import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PayosWebhookDto {
  @IsString()
  orderCode!: string;

  @IsString()
  status!: string;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  signature?: string;
}
