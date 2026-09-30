import {Inject,Injectable} from '@nestjs/common';
import {PrismaService} from './prisma.service.js';
@Injectable()
export class HealthService { constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {} async isDatabaseReady(): Promise<boolean> { try { await this.prisma.$queryRaw`SELECT 1`; return true; } catch { return false; } } }
