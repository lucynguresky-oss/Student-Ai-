import { Global, Module } from '@nestjs/common';
import { XpService } from './xp.service';

/** Global so any module can inject XpService without re-importing. */
@Global()
@Module({
  providers: [XpService],
  exports: [XpService],
})
export class XpModule {}
