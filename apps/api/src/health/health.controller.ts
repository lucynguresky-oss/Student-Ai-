import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('healthz')
  @ApiOperation({ summary: 'Liveness probe', description: 'Returns 200 if the API is alive' })
  @ApiResponse({ status: 200, description: 'API is alive' })
  async healthz() {
    return this.healthService.check();
  }

  @Get('readyz')
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Returns 200 if the API and all dependencies are ready',
  })
  @ApiResponse({ status: 200, description: 'API is ready' })
  @ApiResponse({ status: 503, description: 'API is not ready' })
  async readyz() {
    return this.healthService.checkReadiness();
  }
}
