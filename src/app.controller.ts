import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Crawler')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  @ApiResponse({ status: 200, description: 'Save Content in Database.' })
  create() {
    return this.appService.getContent();
  }

  @Get()
  findAll(){
    return this.appService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.appService.remove(id);
  }
}