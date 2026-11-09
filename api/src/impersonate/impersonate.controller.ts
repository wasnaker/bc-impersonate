import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StartImpersonationDto } from './dto/start-impersonation.dto';
import { StopImpersonationDto } from './dto/stop-impersonation.dto';
import { ImpersonateService } from './impersonate.service';
import { ImpersonateAccessGuard } from './impersonate-access.guard';

interface AuthenticatedPayload {
  id: number;
  sessionId: number;
  impersonationId?: string;
  actorId?: number;
}
interface AuthenticatedRequest { user: AuthenticatedPayload; }
interface RefreshPayload { sessionId: number; hash: string; }
interface RefreshRequest { user: RefreshPayload; }

@ApiTags('Impersonate')
@ApiBearerAuth()
@UseGuards(ImpersonateAccessGuard)
@Controller({ path: 'impersonate', version: '1' })
export class ImpersonateController {
  constructor(private readonly service: ImpersonateService) {}

  @Get('users')
  @UseGuards(AuthGuard('jwt'))
  users(
    @Request() request: AuthenticatedRequest,
    @Query('q') query = '',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.service.searchUsers(request.user.id, query, Number(page), Number(limit));
  }

  @Post('start')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  start(
    @Request() request: AuthenticatedRequest,
    @Body() dto: StartImpersonationDto,
  ) {
    return this.service.start({
      actorId: request.user.id,
      actorSessionId: request.user.sessionId,
      targetUserId: dto.targetUserId,
      reason: dto.reason,
    });
  }

  // Refresh credentials are accepted only for these two lifecycle operations.
  // The ordinary /auth/refresh endpoint rejects them while the record is active.
  @Post('stop')
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  stop(
    @Request() request: RefreshRequest,
    @Body() dto: StopImpersonationDto,
  ) {
    return this.service.stopWithRefreshToken(
      request.user.sessionId,
      request.user.hash,
      dto.impersonationId,
    );
  }

  @Post('renew')
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  renew(
    @Request() request: RefreshRequest,
    @Body() dto: StopImpersonationDto,
  ) {
    return this.service.renewWithRefreshToken(
      request.user.sessionId,
      request.user.hash,
      dto.impersonationId,
    );
  }

  @Get('current')
  @UseGuards(AuthGuard('jwt'))
  current(@Request() request: AuthenticatedRequest) {
    const payload = request.user;
    if (!payload.impersonationId || !payload.actorId) return { active: false };
    return this.service
      .getCurrent(payload.impersonationId, payload.actorId, payload.id)
      .then((session) => ({ active: true, ...session }));
  }
}
