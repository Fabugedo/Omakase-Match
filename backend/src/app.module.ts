import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { HealthController } from './common/health.controller';
import { PrismaModule } from './common/prisma.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { CatalogModule } from './catalog/catalog.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { InterpretModule } from './interpret/interpret.module';

@Module({
  imports: [PrismaModule, CatalogModule, RecommendationsModule, InterpretModule],
  controllers: [HealthController],
  providers: [
    // Validate request body/query/params against the DTO's Zod schema (T015).
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    // Serialize responses through the DTO's Zod schema (T015).
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
