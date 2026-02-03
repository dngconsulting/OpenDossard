import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../users/entities/user.entity';
import { AuthResponseDto, TokensDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserEntity | null> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(user: UserEntity): Promise<AuthResponseDto> {
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.getRolesArray(),
      },
    };
  }

  async refreshTokens(userId: number, _refreshToken: string): Promise<TokensDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // For simplicity, we trust the refresh token if it's valid JWT
    // In production, you'd want to store and validate refresh tokens
    const tokens = await this.generateTokens(user);
    return tokens;
  }

  async logout(_userId: number): Promise<void> {
    // No-op since we don't store refresh tokens in DB
    // In production, you might want to blacklist the token
  }

  async getProfile(userId: number): Promise<{
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    phone: string;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.getRolesArray(),
      phone: user.phone,
    };
  }

  private async generateTokens(user: UserEntity): Promise<TokensDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.getRolesArray(),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET', 'opendossard-secret-v2'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRE', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET', 'opendossard-refresh-secret-v2'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRE', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
