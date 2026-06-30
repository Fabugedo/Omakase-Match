import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { InterpretService } from './interpret.service';
import { InterpretRequestDto, InterpretResponseDto } from '../common/dto';
import type { InterpretResponse } from '../common/schemas';

/**
 * POST /interpret (US4). Turns a free-text taste description into known
 * genres/themes. The global ZodValidationPipe validates the body; the service
 * always returns a valid (possibly empty) genre list, never an error for
 * unrecognized input.
 */
@Controller('interpret')
export class InterpretController {
  constructor(private readonly interpret: InterpretService) {}

  @Post()
  @HttpCode(200)
  @ApiOkResponse({ type: InterpretResponseDto })
  run(@Body() body: InterpretRequestDto): Promise<InterpretResponse> {
    return this.interpret.interpret(body.text, body.language);
  }
}
