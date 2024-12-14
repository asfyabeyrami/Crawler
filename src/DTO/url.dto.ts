import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty} from 'class-validator';
export class siteMapDto {
  @IsNotEmpty()
  @ApiProperty({ type: String })
  siteMap: string;
}
