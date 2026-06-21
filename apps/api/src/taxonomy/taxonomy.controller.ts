import { Controller, Get, Param, Query } from '@nestjs/common';
import { TaxonomyService } from './taxonomy.service';

@Controller('taxonomy')
export class TaxonomyController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  /** All registered locales. Pass ?complete=true to get only UI-ready ones. */
  @Get('locales')
  async getLocales(@Query('complete') complete?: string) {
    const onlyComplete = complete === 'true' || complete === '1';
    const locales = await this.taxonomyService.getLocales(onlyComplete);
    return { data: locales };
  }

  /** Countries sorted alphabetically (International first). */
  @Get('countries')
  async getCountries() {
    const countries = await this.taxonomyService.getCountries();
    return { data: countries };
  }

  @Get('countries/:countryId/curricula')
  async getCurricula(@Param('countryId') countryId: string) {
    const curricula = await this.taxonomyService.getCurricula(countryId);
    return { data: curricula };
  }

  @Get('curricula/:curriculumId/levels')
  async getLevels(
    @Param('curriculumId') curriculumId: string,
    @Query('stage') stage?: string,
  ) {
    const levels = await this.taxonomyService.getLevels(curriculumId, stage);
    return { data: levels };
  }

  /**
   * Subjects for a curriculum/level with alias resolution.
   * Pass ?levelId=... to get level-specific aliases.
   */
  @Get('curricula/:curriculumId/subjects')
  async getSubjects(
    @Param('curriculumId') curriculumId: string,
    @Query('levelId') levelId?: string,
  ) {
    const subjects = await this.taxonomyService.getSubjects(curriculumId, levelId);
    return { data: subjects };
  }

  /**
   * Full canonical subject catalogue — all subjects grouped by domain.
   * Used for the Lifelong Learning / curriculum-agnostic picker.
   * Pass ?domain=Mathematics to filter.
   */
  @Get('subjects')
  async getAllSubjects(@Query('domain') domain?: string) {
    const subjects = await this.taxonomyService.getAllSubjects(domain);
    return { data: subjects };
  }
}
