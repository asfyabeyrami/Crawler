import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ContentDocument = HydratedDocument<content>;

@Schema()
export class content {
  @Prop()
  description: string;

  @Prop()
  url: string;
}

export const contentSchema = SchemaFactory.createForClass(content);
