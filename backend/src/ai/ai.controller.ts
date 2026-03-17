import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { GenerateReminderDto } from './dto/generate-reminder.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { ChatRequestDto } from './dto/chat-request.dto';

@Controller('ai')
@UseGuards(FirebaseAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('reminder-generate')
  async generateReminder(@Body() dto: GenerateReminderDto) {
    return this.aiService.generateReminderMessage(dto);
  }

  @Post('chat')
  async chat(@CurrentUser() user: AuthUser | null, @Body() dto: ChatRequestDto) {
    return this.aiService.chat(dto, user);
  }
}
