import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GenerateReminderDto } from './dto/generate-reminder.dto';

@Injectable()
export class AiService {
  constructor(private readonly configService: ConfigService) {}

  async generateReminderMessage(dto: GenerateReminderDto) {
    const key = this.configService.get<string>('GEMINI_API_KEY');

    const prompt = `You are an expert veterinary clinic assistant at ${dto.clinicName}. Write a polite, warm, and professional SMS message (under 160 characters in Vietnamese) to remind ${dto.customerName} that their pet ${dto.petName} is due for a ${dto.reminderType}. Do not use emojis.`;

    if (!key) {
      return {
        text: `Kinh gui ${dto.customerName}, be ${dto.petName} da den lich ${dto.reminderType}. ${dto.clinicName} kinh moi quy khach dat hen trong tuan nay.`,
        provider: 'fallback-template',
      };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

    const response = await axios.post(url, {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 180,
      },
    });

    const text: string | undefined = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new BadRequestException('Gemini returned empty output');
    }

    return {
      text: this.sanitize(text),
      provider: 'gemini',
    };
  }

  private sanitize(input: string): string {
    return input.replace(/[\r\n]+/g, ' ').trim().slice(0, 180);
  }
}
