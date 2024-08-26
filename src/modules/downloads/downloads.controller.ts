import { BadRequestException, Controller, Get, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { DownloadsService } from './downloads.service';

@Controller('downloads')
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Get('firmware/weathercom/:version_number')
  async downloadFile(
    @Param('version_number') versionNumber: string,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<void> {
    try {
      const filePath = this.downloadsService.getFilePath(versionNumber);
      const rangeHeader = req.headers['range'] as string | undefined;
      this.downloadsService.streamFile(filePath, res, rangeHeader);
    } catch (error) {
      console.error(`Error downloading file: ${error.message}`);
      throw new BadRequestException('Could not download the file.');
    }
  }
}
