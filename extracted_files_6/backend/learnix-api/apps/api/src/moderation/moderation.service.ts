import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModerationStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface ModerationVerdict {
  isEducational: boolean;
  confidence: number; // 0..1
  category: string;
  reason: string;
}

// Decision thresholds (tunable). Deliberately conservative so we don't
// auto-remove on a shaky signal — borderline cases go to human review.
const APPROVE_MIN_CONFIDENCE = 0.5;
const REMOVE_MIN_CONFIDENCE = 0.75;

const SYSTEM_PROMPT = `You are the content classifier for Learnix, an educational social platform.
Decide whether a user's post has genuine educational value.

EDUCATIONAL = teaches or explains an academic subject (maths, sciences, languages,
history, geography, business, computing, etc.), study notes, revision material,
exam/past-paper content, tutorials, how-to/skill explainers, or factual learning content.

NOT EDUCATIONAL = pure entertainment with no learning value, memes without teaching,
advertising or self-promotion, spam, off-topic personal updates, dating/solicitation,
sexual or violent content, harassment, or misinformation presented as fact.

If it is borderline or you are unsure, lower your confidence rather than guessing.

Respond with ONLY a JSON object, no prose, no markdown fences:
{"isEducational": boolean, "confidence": number between 0 and 1, "category": short string, "reason": string under 30 words}`;

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Screen a freshly-created post. Updates moderationStatus, logs the verdict,
   * and warns the author if the post is removed. Never throws to the caller —
   * a moderation failure must not break posting (post stays PENDING for review).
   */
  async screenPost(postId: string): Promise<ModerationStatus> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        caption: true,
        media: { select: { type: true } },
        subject: { select: { name: true } },
      },
    });
    if (!post) return ModerationStatus.PENDING;

    const apiKey = this.config.get<string>('ai.anthropicApiKey');
    if (!apiKey) {
      // Dev / no key: don't block the app. Approve and log that it was skipped.
      this.logger.warn(
        `No ANTHROPIC_API_KEY set — skipping AI moderation for post ${postId} (auto-approved).`,
      );
      await this.apply(post.id, ModerationStatus.APPROVED, null, {
        isEducational: true,
        confidence: 0,
        category: 'unscreened',
        reason: 'Moderation skipped (no API key configured).',
      });
      return ModerationStatus.APPROVED;
    }

    let verdict: ModerationVerdict;
    try {
      verdict = await this.classify(post.caption ?? '', {
        mediaTypes: post.media.map((m) => m.type),
        subject: post.subject?.name ?? null,
      });
    } catch (err) {
      this.logger.error(
        `Moderation call failed for post ${postId}: ${(err as Error).message}`,
      );
      // Fail safe to human review rather than silently publishing.
      await this.apply(post.id, ModerationStatus.FLAGGED, null, {
        isEducational: false,
        confidence: 0,
        category: 'error',
        reason: 'Automated screening failed; queued for review.',
      });
      return ModerationStatus.FLAGGED;
    }

    const action = decideAction(verdict);
    const reason = action === ModerationStatus.REMOVED ? verdict.reason : null;
    await this.apply(post.id, action, reason, verdict);

    if (action === ModerationStatus.REMOVED) {
      await this.warnAuthor(post.authorId, post.id, verdict.reason);
    }
    return action;
  }

  /** Author asks for a human to re-check a removed/flagged post. */
  async appeal(postId: string, userId: string): Promise<{ status: string }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true, moderationStatus: true },
    });
    if (!post) throw new ForbiddenException('Post not found');
    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only appeal your own posts');
    }
    await this.prisma.post.update({
      where: { id: postId },
      data: { moderationStatus: ModerationStatus.FLAGGED },
    });
    return { status: ModerationStatus.FLAGGED };
  }

  /** Admin/moderator review queue. */
  async queue(role: string) {
    if (role !== 'ADMIN' && role !== 'TEACHER') {
      throw new ForbiddenException('Moderator access required');
    }
    return this.prisma.post.findMany({
      where: {
        moderationStatus: {
          in: [ModerationStatus.FLAGGED, ModerationStatus.REMOVED],
        },
      },
      orderBy: { moderatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        caption: true,
        moderationStatus: true,
        moderationReason: true,
        moderatedAt: true,
        author: { select: { id: true, username: true } },
        moderationLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  /** Admin override after review. */
  async setStatus(
    postId: string,
    status: ModerationStatus,
    role: string,
  ): Promise<{ status: ModerationStatus }> {
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    await this.prisma.post.update({
      where: { id: postId },
      data: { moderationStatus: status, moderatedAt: new Date() },
    });
    return { status };
  }

  // ---- internals ----

  private async classify(
    caption: string,
    ctx: { mediaTypes: string[]; subject: string | null },
  ): Promise<ModerationVerdict> {
    const model =
      this.config.get<string>('ai.moderationModel') ??
      'claude-haiku-4-5-20251001';

    const userContent = [
      `Caption: ${caption || '(no caption)'}`,
      `Media: ${ctx.mediaTypes.length ? ctx.mediaTypes.join(', ') : 'none'}`,
      ctx.subject ? `Tagged subject: ${ctx.subject}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.config.get<string>('ai.anthropicApiKey') as string,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 256,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text =
      data.content
        ?.filter((b) => b.type === 'text')
        .map((b) => b.text ?? '')
        .join('') ?? '';

    return parseVerdict(text);
  }

  private async apply(
    postId: string,
    status: ModerationStatus,
    reason: string | null,
    verdict: ModerationVerdict,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.post.update({
        where: { id: postId },
        data: {
          moderationStatus: status,
          moderationReason: reason,
          moderatedAt: new Date(),
        },
      }),
      this.prisma.moderationLog.create({
        data: {
          postId,
          isEducational: verdict.isEducational,
          confidence: verdict.confidence,
          category: verdict.category,
          reason: verdict.reason,
          action: status,
          model:
            this.config.get<string>('ai.moderationModel') ??
            'claude-haiku-4-5-20251001',
        },
      }),
    ]);
  }

  private async warnAuthor(
    authorId: string,
    postId: string,
    reason: string,
  ): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId: authorId,
        actorId: null, // system notice
        type: NotificationType.MODERATION,
        postId,
      },
    });
    this.logger.log(`Warned ${authorId} — post ${postId} removed: ${reason}`);
  }
}

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested in test/moderation.spec.ts)
// ---------------------------------------------------------------------------

/** Map a verdict to a moderation action using confidence thresholds. */
export function decideAction(v: ModerationVerdict): ModerationStatus {
  const c = clamp01(v.confidence);
  if (v.isEducational && c >= APPROVE_MIN_CONFIDENCE) {
    return ModerationStatus.APPROVED;
  }
  if (!v.isEducational && c >= REMOVE_MIN_CONFIDENCE) {
    return ModerationStatus.REMOVED;
  }
  return ModerationStatus.FLAGGED; // borderline → human review
}

/**
 * Robustly parse the classifier's reply into a verdict. Tolerates code fences
 * and surrounding prose by extracting the first JSON object. Falsy/garbage
 * input yields a safe "flag for review" verdict.
 */
export function parseVerdict(text: string): ModerationVerdict {
  const fallback: ModerationVerdict = {
    isEducational: false,
    confidence: 0,
    category: 'unparseable',
    reason: 'Could not parse classifier output; needs review.',
  };
  if (!text) return fallback;

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return fallback;

  try {
    const raw = JSON.parse(text.slice(start, end + 1)) as Record<
      string,
      unknown
    >;
    return {
      isEducational: Boolean(raw.isEducational),
      confidence: clamp01(Number(raw.confidence)),
      category:
        typeof raw.category === 'string' && raw.category
          ? raw.category
          : 'uncategorised',
      reason:
        typeof raw.reason === 'string' && raw.reason
          ? raw.reason
          : 'No reason provided.',
    };
  } catch {
    return fallback;
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
