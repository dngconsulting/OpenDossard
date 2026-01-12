import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  @Exclude()
  password: string;

  @Column('text', { nullable: true })
  roles: string;

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
