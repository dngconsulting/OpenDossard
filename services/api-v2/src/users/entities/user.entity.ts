import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
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

  @ApiProperty()
  @Column()
  email: string;

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

  // Helper to get roles as array
  getRolesArray(): string[] {
    return this.roles ? this.roles.split(',') : [];
  }

  // Helper to check if user has a specific role
  hasRole(role: string): boolean {
    return this.getRolesArray().includes(role);
  }
}
