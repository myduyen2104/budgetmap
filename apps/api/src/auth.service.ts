import {ConflictException,HttpException,Inject,Injectable,InternalServerErrorException,UnauthorizedException} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import {PrismaService} from './prisma.service.js';
import argon2 from 'argon2';
import {createHash,randomBytes} from 'node:crypto';
import {DEFAULT_CATEGORIES} from '../../../packages/shared/src/categories.js';

class TooManyRequestsException extends HttpException { constructor(message:string){super(message,429);} }

@Injectable()
export class AuthService {
  constructor(@Inject(PrismaService)private readonly db: PrismaService) {}
  private readonly attempts = new Map<string,{count:number;until:number}>();
  private hash(token: string): string { return createHash('sha256').update(token).digest('hex'); }
  async register(username: string,password: string,displayName?: string) { const normalized=username.trim().toLowerCase(); if(password.length<8||password.length>128) throw new Error('invalid password'); try { const user=await this.db.$transaction(async tx=>{const created=await tx.user.create({data:{username:normalized,passwordHash:await argon2.hash(password,{type:argon2.argon2id}),displayName}});await tx.category.createMany({data:DEFAULT_CATEGORIES.map((c)=>({userId:created.id,name:c.name,type:c.type,icon:c.icon,color:c.color}))});return created;}); return this.publicUser(user); } catch (error) { if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2002') throw new ConflictException('username already exists'); throw new InternalServerErrorException('registration failed'); } }
  async login(username: string,password: string,ip='unknown') { const now=Date.now(),attempt=this.attempts.get(ip); if(attempt&&attempt.until>now&&attempt.count>=5)throw new TooManyRequestsException('RATE_LIMITED'); if(attempt&&attempt.until<=now)this.attempts.delete(ip); const normalized=username.trim().toLowerCase(); const user=await this.db.user.findFirst({where:{OR:[{username:normalized},{email:normalized}]}}); if(!user||!(await argon2.verify(user.passwordHash,password))){const current=this.attempts.get(ip);this.attempts.set(ip,{count:(current?.count??0)+1,until:now+900000});throw new UnauthorizedException('invalid credentials');} this.attempts.delete(ip); const token=randomBytes(32).toString('base64url'); await this.db.session.create({data:{userId:user.id,tokenHash:this.hash(token),expiresAt:new Date(Date.now()+7*86400000)}}); return {user:this.publicUser(user),token}; }
  async fromToken(token?: string) { if(!token) throw new UnauthorizedException(); const session=await this.db.session.findUnique({where:{tokenHash:this.hash(token)},include:{user:true}}); if(!session||session.expiresAt<=new Date()) throw new UnauthorizedException(); await this.db.session.update({where:{id:session.id},data:{lastUsedAt:new Date()}}); return session.user; }
  async logout(token?: string): Promise<void> { if(token) await this.db.session.deleteMany({where:{tokenHash:this.hash(token)}}); }
  async updateProfile(id:string,data:{displayName?:string}) { return this.publicUser(await this.db.user.update({where:{id},data})); }
  async changePassword(id:string,currentPassword:string,newPassword:string): Promise<void> {
    if (currentPassword === newPassword) throw new HttpException('NEW_PASSWORD_MUST_DIFFER', 400);
    const user = await this.db.user.findUnique({where:{id}});
    if (!user || !(await argon2.verify(user.passwordHash, currentPassword))) {
      throw new UnauthorizedException('INVALID_CURRENT_PASSWORD');
    }
    await this.db.user.update({
      where: {id},
      data: {passwordHash: await argon2.hash(newPassword, {type: argon2.argon2id})},
    });
  }
  publicUser(user: {id:string;username:string|null;email:string|null;displayName:string|null}) { return {id:user.id,username:user.username,email:user.email,displayName:user.displayName}; }
}
