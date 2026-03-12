import { IsOptional, IsString, MinLength } from 'class-validator';

export class SyncFirebaseDto {
  @IsString()
  @MinLength(3)
  idToken!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
