import { Injectable } from '@nestjs/common';
import * as Models from '../src/crawler.model';
import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';
import { ApiBody, ApiProperty } from '@nestjs/swagger';

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


  async getSitemapUrls(siteMap: string): Promise<string[]> {
    try {
      const response = await axios.get(siteMap);
      const parser = new XMLParser();
      const jsonData = parser.parse(response.data);

      // sitemap urls
      const urls = jsonData.urlset.url.map((item: any) => item.loc);
      return urls;
    } catch (error) {
      console.error('Error fetching sitemap:', error.message);
      return [];
    }
  }
}
