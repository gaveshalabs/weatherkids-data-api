import { BadRequestException, Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { DownloadsService } from './downloads.service';

@Controller('downloads')
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Get('firmware/weathercom/:version_number')
  async downloadFile(
    @Param('version_number') versionNumber: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const filePath = this.downloadsService.getFilePath(versionNumber);
      this.downloadsService.streamFile(filePath, res);
    } catch (error) {
      console.error(`Error downloading file: ${error.message}`);
      throw new BadRequestException('Could not download the file.');
    }
  }
}
