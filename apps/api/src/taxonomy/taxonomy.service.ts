import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  /** List all countries sorted alphabetically — International (iso2='XX') first */
  async getCountries() {
    const countries = await this.prisma.country.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, iso2: true, flag: true },
    });
    return [
      ...countries.filter((c) => c.iso2 === 'XX'),
      ...countries.filter((c) => c.iso2 !== 'XX'),
    ];
  }

  /** Get curricula for a country */
  async getCurricula(countryId: string) {
    return this.prisma.curriculum.findMany({
      where: { countryId },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, countryId: true },
    });
  }

  /** Get education levels for a curriculum, optionally filtered by stage */
  async getLevels(curriculumId: string, stage?: string) {
    return this.prisma.educationLevel.findMany({
      where: {
        curriculumId,
        ...(stage ? { stage: stage as any } : {}),
      },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        stage: true,
        name: true,
        orderIndex: true,
        curriculumId: true,
      },
    });
  }

  /**
   * Subjects for a curriculum/level with curriculum-specific alias resolution.
   * If a CurriculumSubjectAlias exists, its localName overrides the canonical name.
   */
  async getSubjects(curriculumId: string, levelId?: string) {
    const mappings = await this.prisma.curriculumSubject.findMany({
      where: {
        curriculumId,
        ...(levelId ? { levelId } : {}),
      },
      include: {
        subject: {
          select: {
            id: true,
            key: true,
            nameEn: true,
            canonicalName: true,
            domain: true,
            nameSw: true,
            aliases: {
              where: {
                curriculumId,
                ...(levelId ? { levelId } : { levelId: null }),
              },
              select: { localName: true, isCore: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { subject: { nameEn: 'asc' } },
    });

    return mappings.map((m) => {
      const alias = m.subject.aliases?.[0];
      return {
        id:            m.subject.id,
        key:           m.subject.key,
        nameEn:        alias?.localName ?? m.subject.canonicalName ?? m.subject.nameEn,
        canonicalName: m.subject.canonicalName,
        domain:        m.subject.domain,
        nameSw:        m.subject.nameSw,
        isCore:        alias?.isCore ?? m.isCore,
        hasAlias:      !!alias,
      };
    });
  }

  /**
   * All registered locales — used by the language picker.
   * Pass onlyComplete=true to return only UI-ready locales.
   */
  async getLocales(onlyComplete = false) {
    return this.prisma.locale.findMany({
      where: onlyComplete ? { status: 'complete' } : undefined,
      orderBy: [{ status: 'asc' }, { englishName: 'asc' }],
    });
  }

  /**
   * Full canonical subject catalogue, optionally filtered by domain.
   * Used for the Lifelong Learning / curriculum-agnostic subject picker.
   */
  async getAllSubjects(domain?: string) {
    return this.prisma.subject.findMany({
      where: domain ? { domain } : undefined,
      orderBy: [{ domain: 'asc' }, { nameEn: 'asc' }],
      select: {
        id: true,
        key: true,
        nameEn: true,
        canonicalName: true,
        domain: true,
        nameSw: true,
      },
    });
  }
}
