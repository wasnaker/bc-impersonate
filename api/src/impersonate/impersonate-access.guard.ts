import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import {
  IMPERSONATE_MODULE_OPTIONS,
  ImpersonateModuleOptions,
} from './impersonate.options';

@Injectable()
export class ImpersonateAccessGuard implements CanActivate {
  constructor(
    @Optional()
    @Inject(IMPERSONATE_MODULE_OPTIONS)
    private readonly options?: ImpersonateModuleOptions,
  ) {}

  async canActivate(_context: ExecutionContext): Promise<boolean> {
    if (
      this.options?.isModuleActive &&
      !(await this.options.isModuleActive())
    ) {
      throw new ForbiddenException('Impersonate module is inactive');
    }
    return true;
  }
}
