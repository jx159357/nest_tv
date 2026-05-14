import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface ChatContext {
  title?: string;
  year?: string;
  type?: string;
  genres?: string[];
  rating?: number;
}

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `你是 Nest TV 的智能影视推荐助手。你的职责是：
1. 根据用户的喜好推荐电影、电视剧、综艺、动漫等影视内容
2. 回答关于影视作品的问题（演员、剧情、评分等）
3. 根据当前正在观看的内容推荐相似作品

回复规则：
- 使用中文回复
- 推荐时尽量给出 3-5 个推荐，每个包含：片名、年份、类型、推荐理由
- 可以使用 Markdown 格式让回复更清晰
- 如果用户没有明确偏好，可以从热门、高分作品开始推荐
- 保持回复简洁友好`;

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private apiKey: string;
  private apiUrl: string;
  private model: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('AI_API_KEY', '');
    this.apiUrl = this.config.get<string>('AI_API_URL', 'https://api.openai.com/v1');
    this.model = this.config.get<string>('AI_MODEL', 'gpt-3.5-turbo');
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async *chatStream(
    message: string,
    context?: ChatContext,
    history: HistoryMessage[] = [],
  ): AsyncGenerator<string> {
    const systemPrompt = this.buildSystemPrompt(context);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10),
      { role: 'user', content: message },
    ];

    const response = await axios.post(
      `${this.apiUrl}/chat/completions`,
      {
        model: this.model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1500,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
        timeout: 30_000,
      },
    );

    const stream = response.data;
    let buffer = '';

    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;
          if (delta?.content) {
            let text = delta.content;
            text = text.replace(/<think>[\s\S]*?<\/think>/g, '');
            if (text) yield text;
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
  }

  private buildSystemPrompt(context?: ChatContext): string {
    if (!context?.title) return SYSTEM_PROMPT;

    const parts = [`当前正在观看：${context.title}`];
    if (context.year) parts.push(`年份：${context.year}`);
    if (context.type) parts.push(`类型：${context.type}`);
    if (context.genres?.length) parts.push(`题材：${context.genres.join('、')}`);
    if (context.rating) parts.push(`评分：${context.rating}`);

    return `${SYSTEM_PROMPT}\n\n${parts.join('\n')}`;
  }
}
