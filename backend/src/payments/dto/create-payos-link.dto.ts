import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePayosLinkDto {
  @IsNumber()
  @Min(1000)
  amount!: number;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  orderCode?: string;
}
