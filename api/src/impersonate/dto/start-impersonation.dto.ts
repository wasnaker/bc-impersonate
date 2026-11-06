import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class StartImpersonationDto {
  @IsInt()
  @Min(1)
  targetUserId: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
