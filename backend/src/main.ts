import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import { env } from './common/config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // OpenAPI generated from the Zod DTOs (T015); cleanupOpenApiDoc post-processes
  // the nestjs-zod schemas into a valid document. Served at /docs.
  const config = new DocumentBuilder()
    .setTitle('Omakase-Match API')
    .setDescription('Anonymous anime recommendation API')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document));

  await app.listen(env.PORT);

  console.log(`Omakase-Match API listening on http://localhost:${env.PORT} (docs at /docs)`);
}

void bootstrap();
