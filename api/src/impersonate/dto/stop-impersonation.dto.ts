import { IsString, IsUUID } from 'class-validator';

export class StopImpersonationDto {
  @IsString()
  @IsUUID()
  impersonationId: string;
}
