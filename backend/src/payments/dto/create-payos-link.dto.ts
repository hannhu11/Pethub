import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreatePayosLinkDto {
  @IsString()
  @IsIn(['starter', 'professional'])
  plan!: 'starter' | 'professional';

  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;
}
