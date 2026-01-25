import type { UserType } from '@/types/users';

export const users: UserType[] = [
  {
    id: 1,
    email: 'john.doe@gmail.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '06 23 27 88 93',
    roles: 'ADMIN,ORGANISATEUR',
  },
  {
    id: 2,
    email: 'guillaume.houis@gmail.com',
    firstName: 'Guillaume',
    lastName: 'Houis',
    phone: '06 23 27 88 93',
    roles: 'ORGANISATEUR',
  },
  {
    id: 3,
    email: 'sami.jaber@gmail.com',
    firstName: 'Sami',
    lastName: 'Jaber',
    phone: '06 23 27 88 93',
    roles: 'ADMIN',
  },
  {
    id: 4,
    email: 'christian.beteille@gmail.com',
    firstName: 'Christian',
    lastName: 'Beteille',
    phone: '06 23 27 88 93',
    roles: 'ORGANISATEUR',
  },
];
