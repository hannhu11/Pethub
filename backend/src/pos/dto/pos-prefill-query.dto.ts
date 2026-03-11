import { IsOptional, IsString } from 'class-validator';

export class PosPrefillQueryDto {
  @IsString()
  @IsOptional()
  appointmentId?: string;
}
