import { Injectable } from '@nestjs/common';
import type { TrackLevel } from '@learnix/db';

/**
 * PlanResolver (§5.6). v1 is deterministic (no ML): for each selected track it picks a unit
 * sequence for the user's level and reorders by motivation (exam-prep pulls assessment-style
 * units first; career pulls applied units). Architected behind an interface so a
 * pgvector/AI resolver can replace it later without touching callers.
 */
export interface PlanTrackInput {
  trackId: string;
  slug: string;
  title: string;
  level: TrackLevel;
  isPrimary: boolean;
}

export interface PlanTrackOutput {
  trackId: string;
  slug: string;
  title: string;
  level: TrackLevel;
  firstUnits: string[];
}

export interface PersonalizedPlan {
  tracks: PlanTrackOutput[];
  dailyGoalMinutes: number;
  streakTarget: number;
}

export type Motivation = 'exams' | 'school_support' | 'career' | 'curious' | 'teacher';

export interface PlanResolver {
  resolve(input: {
    tracks: PlanTrackInput[];
    motivation: Motivation;
    dailyGoalMinutes: number;
  }): PersonalizedPlan;
}

export const PLAN_RESOLVER = Symbol('PLAN_RESOLVER');

/** Seeded unit templates by level. Real content comes from the lesson build; these are the
 *  deterministic "first units" a new learner sees, keyed by difficulty band. */
const UNIT_TEMPLATES: Record<TrackLevel, string[]> = {
  NEW: ['Foundations 1', 'Foundations 2', 'Core Concepts', 'First Practice', 'Checkpoint'],
  BEGINNER: ['Core Concepts', 'Guided Practice', 'Applied Basics', 'Mini Quiz', 'Checkpoint'],
  INTERMEDIATE: ['Applied Skills', 'Problem Sets', 'Case Study', 'Challenge', 'Assessment'],
  CONFIDENT: ['Advanced Topics', 'Complex Problems', 'Real-World Project', 'Mastery Quiz', 'Assessment'],
};

@Injectable()
export class DeterministicPlanResolver implements PlanResolver {
  resolve(input: { tracks: PlanTrackInput[]; motivation: Motivation; dailyGoalMinutes: number }): PersonalizedPlan {
    // Primary track first, then the rest.
    const ordered = [...input.tracks].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));

    const tracks: PlanTrackOutput[] = ordered.map((t) => {
      let units = [...UNIT_TEMPLATES[t.level]];
      units = this.reorderByMotivation(units, input.motivation);
      return { trackId: t.trackId, slug: t.slug, title: t.title, level: t.level, firstUnits: units.slice(0, 4) };
    });

    return { tracks, dailyGoalMinutes: input.dailyGoalMinutes, streakTarget: 7 };
  }

  private reorderByMotivation(units: string[], motivation: Motivation): string[] {
    const pull = (predicate: (u: string) => boolean) => {
      const hits = units.filter(predicate);
      const rest = units.filter((u) => !predicate(u));
      return [...hits, ...rest];
    };
    switch (motivation) {
      case 'exams':
        // Assessment-style units first.
        return pull((u) => /quiz|assessment|checkpoint|challenge/i.test(u));
      case 'career':
        // Applied/project units first.
        return pull((u) => /applied|project|case study|real-world/i.test(u));
      default:
        return units;
    }
  }
}
