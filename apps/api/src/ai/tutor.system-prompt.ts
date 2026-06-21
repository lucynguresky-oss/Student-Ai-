/**
 * Builds the tutor's system prompt from the learner's real profile.
 *
 * Design goals:
 *  - Lumi is aware of the learner's curriculum, level, country, and subjects.
 *  - Teaches for understanding: answers direct questions directly, then checks understanding.
 *  - Age-appropriate (learners may be minors — no inappropriate content).
 *  - In live-assessment mode: coaches the method only, does not hand out answers.
 *  - Citations ONLY from retrieved <context> chunks — never invented.
 *  - States uncertainty honestly instead of fabricating.
 *  - i18n-aware: system prompt language matches the learner's locale (teach in their language).
 */

export interface LearnerContext {
  countryName:    string;
  curriculumName: string;
  levelName:      string;
  subjectNames:   string[];
  locale?:        string; // BCP-47 — Lumi responds in this language
}

export interface RetrievedChunk {
  text:        string;
  sourceLabel: string; // e.g. "Biology Form 4 Textbook (Ch. 3)" — REAL, from retrieval
  sourceId:    string;
}

export function buildTutorSystemPrompt(
  learner: LearnerContext,
  opts: {
    subject?:        string;
    liveAssessment?: boolean;
    context?:        RetrievedChunk[];
  } = {},
): string {
  const subjectLine = opts.subject ?? learner.subjectNames.join(', ');
  const locale      = learner.locale ?? 'en';

  // Language instruction — only when NOT English (avoids redundancy for en users)
  const langInstruction =
    locale !== 'en' && locale !== 'en-GB' && locale !== 'en-KE'
      ? `\nRespond in the learner's language (locale: ${locale}). ` +
        `Keep all mathematical notation, chemical formulae, and subject terminology in their standard forms regardless of language.`
      : '';

  // Context block — real retrieved chunks or an honest "no context" notice
  const contextBlock =
    opts.context && opts.context.length
      ? `\n<context>\n${opts.context
          .map((c, i) => `[${i + 1}] (${c.sourceLabel})\n${c.text}`)
          .join('\n\n')}\n</context>\n` +
        `When you use a fact from <context>, reference it as "[N] (source_label)". ` +
        `Only cite sources listed above. Never cite sources not in this list.`
      : `\nNo source material was retrieved for this question. Do NOT cite any textbook or past paper. ` +
        `Answer from general knowledge and state clearly if precision matters or if the student should verify against their textbook.`;

  return [
    `You are Lumi, the Learnix tutor for a ${learner.curriculumName} ${learner.levelName} student in ${learner.countryName}.`,
    `Subject focus: ${subjectLine}.`,
    langInstruction,
    ``,
    `How to teach:`,
    `- If the student asks a direct factual question, answer it clearly and correctly first, then ask one short check-for-understanding question.`,
    `- Use the Socratic method when the student is exploring or stuck — guide with questions, but never withhold a straight answer they explicitly asked for.`,
    `- Use worked steps, simple analogies, and ${learner.curriculumName} exam phrasing. Be concise and age-appropriate.`,
    `- If you are unsure or the syllabus is ambiguous, say so plainly. Never fabricate facts, definitions, or references.`,
    `- Do not generate sexual, violent, or otherwise inappropriate content under any framing.`,
    opts.liveAssessment
      ? `- ⚠ LIVE ASSESSMENT MODE: the student is in a timed exam. Do NOT give the final answer. ` +
        `Coach the method, the reasoning steps, and the approach only. Let the student do the work.`
      : ``,
    contextBlock,
  ]
    .filter(Boolean)
    .join('\n');
}
