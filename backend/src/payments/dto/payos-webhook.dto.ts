import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PayosWebhookDataDto {
  @IsOptional()
  @IsString()
  @Type(() => String)
  orderCode?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsString()
  @Type(() => String)
  status?: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  reference?: string;
}

export class PayosWebhookDto {
  @IsOptional()
  @IsString()
  @Type(() => String)
  orderCode?: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  status?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsString()
  @Type(() => String)
  signature?: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  code?: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  desc?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  success?: boolean;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PayosWebhookDataDto)
  data?: PayosWebhookDataDto;
}
