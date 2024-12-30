import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
export class SiteMapDto {
  @IsNotEmpty()
  @ApiProperty({ type: String })
  title: string;

  @ApiProperty({ type: String })
  siteMap: string;
}

export class UrlDto {
  @IsNotEmpty()
  @ApiProperty({ type: String })
  title: string;

  @ApiProperty({ type: String })
  url: string;
}

export class LinkDto {
  @IsNotEmpty()
  @ApiProperty({ type: String })
  title: string;

  @IsNotEmpty()
  @ApiProperty({ type: String })
  url: string;
}

export class PageDto {
  @IsNotEmpty()
  @ApiProperty({ type: String })
  title: string;

  @IsNotEmpty()
  @ApiProperty({ type: String })
  page: string;
}
