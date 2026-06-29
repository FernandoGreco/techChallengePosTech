import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './presentation/controllers/auth.controller';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { JwtStrategy } from './infrastructure/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'oficina-mecanica-jwt-secret-dev',
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      } as Record<string, unknown>,
    }),
  ],
  controllers: [AuthController],
  providers: [LoginUseCase, JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
