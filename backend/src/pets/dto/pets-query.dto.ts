import { IsOptional, IsString } from 'class-validator';

export class PetsQueryDto {
  @IsOptional()
  @IsString()
  customerId?: string;
}
