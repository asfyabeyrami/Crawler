import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { SequelizeModule } from '@nestjs/sequelize';
// import { content } from './crawler.model';
// import { DataAccess } from './DataAccess/sequelize/dataAccess';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoDataAccess } from './DataAccess/mongoose/mongo-dataAccess';
import {
  content,
  contentSchema,
} from './DataAccess/mongoose/schema/crawler.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: content.name, schema: contentSchema }]),
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/crawler'),
    // SequelizeModule.forFeature([content]),
    // SequelizeModule.forRoot({
    //   dialect: 'postgres',
    //   host: 'localhost',
    //   port: 5432,
    //   username: 'asfya',
    //   password: '123456789',
    //   database: 'crawler',
    //   autoLoadModels: true,
    //   synchronize: true,
    // }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    //DataAccess,
    MongoDataAccess,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
