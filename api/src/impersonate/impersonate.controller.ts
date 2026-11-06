import {
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
import type { RequestWithUser } from '../../utils/request-with-user.type';
import { StartImpersonationDto } from './dto/start-impersonation.dto';
import { StopImpersonationDto } from './dto/stop-impersonation.dto';
import { ImpersonateService } from './impersonate.service';

interface AuthenticatedPayload {
  id: number;
  sessionId: number;
  impersonationId?: string;
  actorId?: number;
}

@ApiTags('Impersonate')
@ApiBearerAuth()
@Controller({ path: 'impersonate', version: '1' })
@UseGuards(AuthGuard('jwt'))
export class ImpersonateController {
  constructor(private readonly service: ImpersonateService) {}

  @Get('users')
  users(
    @Request() request: RequestWithUser<AuthenticatedPayload>,
    @Query('q') query = '',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.service.searchUsers(
      request.user.id,
      query,
      Number(page),
      Number(limit),
    );
  }

  @Post('start')
  @HttpCode(HttpStatus.OK)
  start(
    @Request() request: RequestWithUser<AuthenticatedPayload>,
    @Body() dto: StartImpersonationDto,
  ) {
    return this.service.start({
      actorId: request.user.id,
      actorSessionId: request.user.sessionId,
      targetUserId: dto.targetUserId,
      reason: dto.reason,
    });
  }

  @Post('stop')
  @HttpCode(HttpStatus.OK)
  stop(
    @Request() request: RequestWithUser<AuthenticatedPayload>,
    @Body() dto: StopImpersonationDto,
  ) {
    return this.service.stop(
      request.user.id,
      request.user.sessionId,
      dto.impersonationId,
    );
  }

  @Get('current')
  current(@Request() request: RequestWithUser<AuthenticatedPayload>) {
    const payload = request.user;
    if (!payload.impersonationId || !payload.actorId) {
      return { active: false };
    }
    return this.service.getCurrent(
      payload.impersonationId,
      payload.actorId,
      payload.id,
    ).then((session) => ({ active: true, ...session }));
  }
}
