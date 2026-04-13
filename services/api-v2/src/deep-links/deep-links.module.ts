import { Module } from '@nestjs/common';
import { DeepLinksController } from './deep-links.controller';

@Module({
  controllers: [DeepLinksController],
})
export class DeepLinksModule {}
