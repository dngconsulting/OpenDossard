import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { UserEntity } from '../users/entities/user.entity';
import { HelloAssoPaymentEntity } from '../helloasso/entities/helloasso-payment.entity';
import { AuthFirebaseController } from './auth-firebase.controller';
import { AuthFirebaseService } from './auth-firebase.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, HelloAssoPaymentEntity]),
    // Config injectée à sign-time dans AuthFirebaseService (pattern identique à AuthModule legacy)
    JwtModule.register({}),
  ],
  controllers: [AuthFirebaseController],
  providers: [AuthFirebaseService],
})
export class AuthFirebaseModule {}
