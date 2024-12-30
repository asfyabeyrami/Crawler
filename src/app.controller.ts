import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { LinkDto, PageDto, SiteMapDto, UrlDto } from './DTO/url.dto';

@ApiTags('Crawler')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({
    summary: 'کرال کردن با سایت مپ',
  })
  @Post('crawlSiteMap')
  async createSiteMap(@Body() payload: SiteMapDto): Promise<string> {
    const { title, siteMap } = payload;
    return await this.appService.getAllContent(title, siteMap);
  }

  @ApiOperation({
    summary: 'کرال کردن با آدرس سایت  ',
  })
  @Post('crawlUrl1')
  async create(@Body() payload: UrlDto) {
    const { title, url } = payload;
    await this.appService.saveUrl(title, url);
  }

  @ApiOperation({
    summary: ' کرال کردن یک صفحه ',
  })
  @Post('crawlOnePage')
  @ApiResponse({
    status: 200,
    description: 'Save All Content Of sitemap in Database.',
  })
  async createPage(@Body() pageDto: PageDto): Promise<string> {
    const { title, page } = pageDto;
    return await this.appService.getContentPage(title, page);
  }

  @ApiOperation({
    summary: 'اضافه کردن به صف',
  })
  @Post('links')
  async createLink(@Body() linkDto: LinkDto) {
    const { title, url } = linkDto;
    const links = await this.appService.getQavaninLinks(title, url);
    return links;
  }

  @Get('contents')
  async findAllContent() {
    return await this.appService.findAllContent();
  }

  @Get('urls')
  async findAllUrl() {
    return await this.appService.findAllUrl();
  }

  @ApiOperation({
    summary: 'حذف رکورد',
  })
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<string> {
    return await this.appService.delete(id);
  }

  @Post('start-crawling')
  async startCrawling() {
    return await this.appService.startManualCrawling();
  }

  @Post('stop-crawling')
  async stopCrawling() {
    return await this.appService.stopManualCrawling();
  }

  @Get('crawling-status')
  async getCrawlingStatus() {
    return await this.appService.getCrawlingStatus();
  }
}
