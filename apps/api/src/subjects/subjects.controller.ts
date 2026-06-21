import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';

@ApiTags('subjects')
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjects: SubjectsService) {}

  /** GET /api/subjects — full list for filter pickers */
  @Get()
  getSubjects() {
    return this.subjects.getSubjects();
  }

  /** GET /api/subjects/:id — single subject */
  @Get(':id')
  getSubjectStats(@Param('id') id: string) {
    return this.subjects.getSubjectStats(id);
  }
}
