import {
  Inject,
  Injectable,
  Logger,
  NotImplementedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';

import { UserEntity } from '../users/entities/user.entity';
import { AuthResponseDto } from '../auth/dto';
import { RegisterDto } from './dto';
import { FIREBASE_ADMIN } from '../firebase/firebase.module';

@Injectable()
export class AuthFirebaseService {
  private readonly logger = new Logger(AuthFirebaseService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @Inject(FIREBASE_ADMIN) private readonly firebaseApp: admin.app.App,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async exchange(_idToken: string): Promise<AuthResponseDto> {
    throw new NotImplementedException('exchange() not implemented yet (B7)');
  }

  async register(_dto: RegisterDto): Promise<AuthResponseDto> {
    throw new NotImplementedException('register() not implemented yet (B7)');
  }
}
