import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { UserEntity } from '../entities/user.entity';

/**
 * Utilisateur tel qu'exposé par `/users`. Liste blanche explicite : un champ
 * ajouté à `UserEntity` (hash du mot de passe, secret…) ne sort pas tant
 * qu'il n'est pas recopié ici.
 */
export class UserResponseDto {
  @ApiProperty() id: number;
  @ApiPropertyOptional() firstName: string;
  @ApiPropertyOptional() lastName: string;
  @ApiPropertyOptional() email: string | null;
  @ApiPropertyOptional() roles: string;
  @ApiPropertyOptional() phone: string;
  @ApiPropertyOptional() organisation: string | null;
  @ApiPropertyOptional() firebaseUid?: string | null;
  @ApiPropertyOptional() signInProvider?: string | null;
  @ApiPropertyOptional() createdAt?: Date | null;
  @ApiPropertyOptional() lastLoginAt?: Date | null;
  @ApiPropertyOptional() creationTime?: string | null;
  @ApiPropertyOptional() lastSignInTime?: string | null;
}

export function toUserResponse(user: UserEntity): UserResponseDto {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    roles: user.roles,
    phone: user.phone,
    organisation: user.organisation,
    firebaseUid: user.firebaseUid,
    signInProvider: user.signInProvider,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    creationTime: user.creationTime,
    lastSignInTime: user.lastSignInTime,
  };
}
