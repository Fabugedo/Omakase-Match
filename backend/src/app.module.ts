import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HealthController } from './common/health.controller';
import { PrismaModule } from './common/prisma.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
