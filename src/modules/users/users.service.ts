import { Injectable } from '@nestjs/common';

// This should be a real class/interface representing a user entity
export type User = any;

@Injectable()
export class UsersService {
  private readonly users = [
    {
      userId: 1,
      username: 'comercial@mercerianortenha.pt',
      password: 'Vam2024selho*',
    },
    {
      userId: 3,
      username: 'comercial@mercearianortenha.pt',
      password: 'Vam2024selho*',
    },
    {
      userId: 2,
      username: 'miguelmorais20@gmail.com',
      password: 'Vam2024selho',
    },
  ];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username);
  }
}
