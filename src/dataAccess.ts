import { Injectable } from '@nestjs/common';
import * as Models from '../src/crawler.model';

@Injectable()
export class DataAccess {
  tableName() {
    return Models.content.tableName;
  }

  async createContent(
    description: string,
    url: string,
  ): Promise<Models.content> {
    return await Models.content.create({
      description,
      url,
    });
  }

  async findOne(id: string): Promise<Models.content> {
    return await Models.content.findOne({
      where: {
        id,
      },
    });
  }

  async findAll(): Promise<Models.content[]> {
    return await Models.content.findAll();
  }
}
