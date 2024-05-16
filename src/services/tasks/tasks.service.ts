import { Injectable, Logger } from '@nestjs/common';
import {Cron, CronExpression} from '@nestjs/schedule';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  syncWooAndRedeploy() {
    this.logger.debug('\n\nCalled the syncWooAndRedeploy at midnight');
  }
}
