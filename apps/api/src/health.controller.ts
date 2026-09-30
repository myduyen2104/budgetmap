import {Controller,Get,HttpCode,Inject,Res} from '@nestjs/common';
import type {Response} from 'express';
import {HealthService} from './health.service.js';
@Controller()
export class HealthController { constructor(@Inject(HealthService) private readonly health:HealthService) {} @Get('health') @HttpCode(200) async check(@Res({passthrough:true}) response:Response):Promise<{status:string}>{if(await this.health.isDatabaseReady())return {status:'ok'};response.status(503);return {status:'unavailable'};} }
