import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
export class MapDto {
  @IsNotEmpty()
  @ApiProperty({ type: String })
  title: string;

  @ApiProperty({ type: String })
  siteMap: string;

  @ApiProperty({ type: String })
  url: string;
}

export class LinkDto {
  @IsNotEmpty()
  @ApiProperty({ type: String })
  url: string;
}

export class PageDto {
  @IsNotEmpty()
  @ApiProperty({ type: String })
  page: string;
}
