import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UrlsDocument = HydratedDocument<urls>;

@Schema()
export class urls {
  @Prop()
  title: string;

  @Prop()
  url: string;

  @Prop()
  isCrawl: boolean;
}

export const urlsSchema = SchemaFactory.createForClass(urls);
