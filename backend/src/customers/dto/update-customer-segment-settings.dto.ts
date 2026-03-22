import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class UpdateCustomerSegmentSettingsDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  regularMinSpent!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  loyalMinSpent!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  vipMinSpent!: number;
}
