import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { siteMapDto } from './DTO/url.dto';

@ApiTags('Crawler')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('crawl')
  @ApiResponse({
    status: 200,
    description: 'Save All Content Of sitemap in Database.',
  })
  async create(@Body() siteMapDto: siteMapDto): Promise<string> {
    const { siteMap } = siteMapDto;
    return await this.appService.getAllContent(siteMap);
  }

  @Get()
  async findAll() {
    return await this.appService.findAll();
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<string> {
    return await this.appService.delete(id);
  }
}
