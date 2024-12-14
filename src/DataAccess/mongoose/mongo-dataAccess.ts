import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { content } from './schema/crawler.schema';
import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';
import { HttpException } from '@nestjs/common';

export class MongoDataAccess {
  constructor(
    @InjectModel(content.name) private readonly contentModel: Model<content>,
  ) {}
  async createContent(description: string, url: string) {
    await this.contentModel.create({
      description,
      url,
    });
  }

  async findAll(): Promise<content[]> {
    return this.contentModel.find().exec();
  }

  async findOne(id: string): Promise<content> {
    return this.contentModel.findOne({ _id: id }).exec();
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

  async delete(id: string): Promise<string> {
    const deletedCat = await this.contentModel
      .findByIdAndDelete({ _id: id })
      .exec();
    if (!deletedCat) {
      throw new HttpException('not exist', 404);
    }
    return `id: (${id}) Successfully Deleted`;
  }
}
