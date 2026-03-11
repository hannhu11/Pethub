import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { GenerateReminderDto } from './dto/generate-reminder.dto';

@Controller('ai')
@UseGuards(FirebaseAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('reminder-generate')
  async generateReminder(@Body() dto: GenerateReminderDto) {
    return this.aiService.generateReminderMessage(dto);
  }
}
