import {
  Body,
  Controller,
  Post,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiChatService } from './ai-chat.service';

class ChatMessageDto {
  message!: string;
  context?: {
    title?: string;
    year?: string;
    type?: string;
    genres?: string[];
    rating?: number;
  };
  history?: { role: 'user' | 'assistant'; content: string }[];
}

@ApiTags('AI Chat')
@Controller('ai/chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send chat message for AI recommendation' })
  @ApiBody({ type: ChatMessageDto })
  @ApiResponse({ status: 200, description: 'Streaming response' })
  async chat(@Body() dto: ChatMessageDto, @Res() res: Response) {
    if (!dto.message?.trim()) {
      throw new HttpException('message is required', HttpStatus.BAD_REQUEST);
    }

    if (!this.aiChatService.isConfigured()) {
      throw new HttpException(
        'AI chat is not configured. Set AI_API_KEY in environment.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      const stream = this.aiChatService.chatStream(
        dto.message.trim(),
        dto.context,
        dto.history || [],
      );

      for await (const chunk of stream) {
        if (res.destroyed) break;
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      if (!res.destroyed) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI request failed';
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
}
