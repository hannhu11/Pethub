import { InvoiceItemType, PaymentMethod } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CheckoutLineItemDto {
  @IsEnum(InvoiceItemType)
  itemType!: InvoiceItemType;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  qty!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class PosCheckoutDto {
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsString()
  customerId!: string;

  @IsOptional()
  @IsString()
  petId?: string;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CheckoutLineItemDto)
  items!: CheckoutLineItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxPercent?: number;
}
