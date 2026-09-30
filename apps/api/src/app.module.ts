import {Module} from '@nestjs/common';
import {AuthController} from './auth.controller.js';
import {AuthService} from './auth.service.js';
import {PrismaService} from './prisma.service.js';
import {WalletsController} from './wallets.controller.js';
import {WalletsService} from './wallets.service.js';
import {CategoriesController} from './categories.controller.js';
import {CategoriesService} from './categories.service.js';import {TransactionsController} from './transactions.controller.js';import {TransactionsService} from './transactions.service.js';
import {MonthlyPlansController} from './monthly-plans.controller.js';import {MonthlyPlansService} from './monthly-plans.service.js';
import {InsightsController} from './insights.controller.js';import {InsightsService} from './insights.service.js';
import {HealthController} from './health.controller.js';import {HealthService} from './health.service.js';
import {PrismaModule} from './prisma.module.js';
import {TransfersController} from './transfers.controller.js';import {TransfersService} from './transfers.service.js';

@Module({imports:[PrismaModule],controllers:[HealthController,AuthController,WalletsController,CategoriesController,TransactionsController,MonthlyPlansController,InsightsController,TransfersController],providers:[HealthService,AuthService,WalletsService,CategoriesService,TransactionsService,MonthlyPlansService,InsightsService,TransfersService]})
export class AppModule {}
