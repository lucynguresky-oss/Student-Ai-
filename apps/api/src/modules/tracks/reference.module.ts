import { Controller, Get, Module, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard, Public } from '../../core/tokens/auth.guard';
import { COUNTRIES, LANGUAGES, languagesForCountry } from '@learnix/validation';

/**
 * Global reference data for the client's country/language pickers (worldwide audience).
 * Static and public — safe to cache aggressively at the edge.
 */
@ApiTags('reference')
@Controller('reference')
@UseGuards(AuthGuard)
export class ReferenceController {
  @Public()
  @Get('countries')
  countries() {
    return {
      countries: COUNTRIES.map((c) => ({
        code: c.code,
        name: c.name,
        native: c.native,
        callingCode: c.callingCode,
        flag: c.flag,
        continent: c.continentName,
      })),
    };
  }

  @Public()
  @Get('languages')
  languages() {
    return { languages: LANGUAGES.map((l) => ({ code: l.code, name: l.name, native: l.native, rtl: l.rtl })) };
  }

  /** Suggested content languages for a country — used to pre-select onboarding defaults. */
  @Public()
  @Get('country-languages')
  countryLanguages(@Query('country') country: string) {
    return { languages: country ? languagesForCountry(country) : [] };
  }
}

@Module({ controllers: [ReferenceController] })
export class ReferenceModule {}
