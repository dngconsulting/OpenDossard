import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

@Entity('user')
export class UserEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiPropertyOptional()
  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @ApiPropertyOptional()
  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  // Nullable depuis la v3 auth-firebase : pour les users mode firebase, l'email
  // n'est PAS persisté côté backend (source de vérité = Firebase Auth).
  // Reste obligatoire pour les users legacy backoffice (ADMIN/ORGANIZER) et
  // mobile pré-firebase, qui s'authentifient via /auth/login (email/password).
  // `type: 'varchar'` explicite — sans ça TypeORM voit `string | null` comme
  // `Object` via la reflection métadata et lève DataTypeNotSupportedError.
  @ApiPropertyOptional()
  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  @Exclude()
  password: string;

  @ApiPropertyOptional()
  @Column('text', { nullable: true })
  roles: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  phone: string;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', name: 'firebase_uid', length: 128, nullable: true, unique: true })
  @Index()
  firebaseUid?: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', name: 'sign_in_provider', length: 32, nullable: true })
  signInProvider?: string | null;

  // Helper to get roles as array
  getRolesArray(): string[] {
    return this.roles ? this.roles.split(',') : [];
  }

  // Helper to check if user has a specific role
  hasRole(role: string): boolean {
    return this.getRolesArray().includes(role);
  }
}
