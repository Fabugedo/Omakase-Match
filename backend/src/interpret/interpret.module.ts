import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { InterpretController } from './interpret.controller';
import { InterpretService } from './interpret.service';
import { GeminiClient } from '../ai/gemini.client';

@Module({
  imports: [CatalogModule], // reuse CatalogService.getGenres() for the vocabulary
  controllers: [InterpretController],
  providers: [InterpretService, GeminiClient],
})
export class InterpretModule {}
