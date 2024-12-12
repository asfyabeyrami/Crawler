import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { content } from './crawler.model';
import { DataAccess } from './dataAccess';

@Module({
  imports: [
    SequelizeModule.forFeature([content]),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'asfya',
      password: '123456789',
      database: 'crawler',
      autoLoadModels: true,
      synchronize: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, DataAccess],
})
export class AppModule {}
