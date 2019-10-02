import { Injectable } from '@nestjs/common';
import {Licence} from '../entity/Licence';
import {Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';

@Injectable()
export class AppService {
  constructor(
      @InjectRepository(Licence)
      private readonly repository: Repository<Licence>,
  ) {}

  async findAll(): Promise<Licence[]> {
    return await this.repository.find();
  }
}
