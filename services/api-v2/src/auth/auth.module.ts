import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthorizationService } from './authorization.service';
import { PasswordResetService } from './password-reset.service';
import { PASSWORD_RESET_THROTTLE_TTL_MS, parseThrottleLimit } from './password-reset-throttle';
import { UserClubService } from './user-club.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { ClubEntity } from '../clubs/entities/club.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UserClubEntity } from './entities/user-club.entity';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, UserClubEntity, ClubEntity, PasswordResetTokenEntity]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRE', '15m'),
        },
      }),
    }),
    // Throttle par IP des routes publiques forgot/reset-password. Le guard est
    // posé route par route (pas d'APP_GUARD global). Compteurs en mémoire,
    // propres à chaque process.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: PASSWORD_RESET_THROTTLE_TTL_MS,
            limit: parseThrottleLimit(configService.get<string>('PASSWORD_RESET_THROTTLE_LIMIT')),
          },
        ],
        errorMessage: 'Trop de tentatives, réessayez plus tard',
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthorizationService,
    UserClubService,
    PasswordResetService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [AuthService, AuthorizationService, UserClubService],
})
export class AuthModule {}
