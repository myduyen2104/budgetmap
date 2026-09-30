import {Body,Controller,Delete,Get,HttpCode,Inject,Param,Patch,Post,Query,Req} from '@nestjs/common';
import type {Request} from 'express';
import {AuthService} from './auth.service.js';
import {TransactionCreateDto,TransactionUpdateDto} from './transactions.dto.js';
import {TransactionsService} from './transactions.service.js';

@Controller('transactions')
export class TransactionsController {
  constructor(@Inject(AuthService)private readonly auth:AuthService,@Inject(TransactionsService)private readonly service:TransactionsService) {}
  private async uid(r:Request){return (await this.auth.fromToken(r.cookies?.budgetmap_session)).id;}
  @Get() list(@Req()r:Request,@Query()q:Record<string,string>){return this.uid(r).then(id=>this.service.list(id,q));}
  @Get(':id') get(@Req()r:Request,@Param('id')id:string){return this.uid(r).then(uid=>this.service.get(uid,id));}
  @Post() create(@Req()r:Request,@Body()b:TransactionCreateDto){return this.uid(r).then(uid=>this.service.create(uid,b));}
  @Patch(':id') update(@Req()r:Request,@Param('id')id:string,@Body()b:TransactionUpdateDto){return this.uid(r).then(uid=>this.service.update(uid,id,b));}
  @Delete(':id') @HttpCode(204) remove(@Req()r:Request,@Param('id')id:string){return this.uid(r).then(uid=>this.service.remove(uid,id));}
}
