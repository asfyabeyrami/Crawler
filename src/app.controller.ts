import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LinkDto, MapDto, PageDto } from './DTO/url.dto';

@ApiTags('Crawler')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('crawl')
  @ApiResponse({
    status: 200,
    description: 'Save All Content Of sitemap in Database.',
  })
  async create(@Body() siteMapDto: MapDto): Promise<string> {
    const { siteMap, url } = siteMapDto;
    return await this.appService.getAllContent(siteMap, url);
  }

  @Post('crawlOnePage')
  @ApiResponse({
    status: 200,
    description: 'Save All Content Of sitemap in Database.',
  })
  async createPage(@Body() pageDto: PageDto): Promise<string> {
    const { page } = pageDto;
    return await this.appService.getContentPage(page);
  }

  @Post('links')
  @ApiResponse({
    status: 200,
    description: 'get all link.',
  })
  async createLink(@Body() linkDto: LinkDto) {
    const { url } = linkDto;
    return await this.appService.getUrl(url);
  }

  @Get()
  async findAll() {
    return await this.appService.findAll();
  }

  @Get('findAllUrl')
  async findAllUrl() {
    return await this.appService.findAllUrl();
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<string> {
    return await this.appService.delete(id);
  }
}
