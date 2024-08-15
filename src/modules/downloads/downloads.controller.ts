import { BadRequestException, Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('downloads')
export class DownloadsController {

    private firmwareFiles = [
        {
          version_number: 123,
          filename: 'Version_1.2.3.txt',
          crc: 'Defined',
        },
        {
          version_number: 124,
          filename: 'Version_1.2.4.txt',
          crc: 'Defined',
        },
        {
          version_number: 125,
          filename: 'Version_1.2.5.txt',
          crc: 'Defined',
        },
        {
          version_number: 126,
          filename: 'Version_1.2.6.txt',
          crc: 'Defined',
        },
        {
          version_number: 127,
          filename: 'Version_1.2.7.txt',
          crc: 'Defined',
        },
      ];


    @Get('firmware/weathercom/:version_number')
    async downloadFile(
      @Param('version_number') versionNumber: string,
      @Res() res: Response,
    ): Promise<void> {
      
      let directoryPath: string;
    
      if (process.env.NODE_ENV === 'local') {
        directoryPath = path.join(__dirname, '../../../src/assets/firmware');
      } else if (process.env.NODE_ENV === 'production') {
        directoryPath = path.join(__dirname, '../../../dist/assets/firmware');
      } else {
        throw new Error('NODE_ENV not set or unrecognized');
      }
    
      const actualFilename = this.mapFilename(parseInt(versionNumber));
      const filePath = path.join(directoryPath, actualFilename);
    
      try {
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Disposition', `attachment; filename=${actualFilename}`);
          res.setHeader('Content-Type', 'application/octet-stream');
    
          const fileStream = fs.createReadStream(filePath);
          fileStream.pipe(res);
        } else {
          throw new BadRequestException('File not found');
        }
      } catch (error) {
        console.error(`Error downloading file: ${error.message}`);
        throw new BadRequestException('Could not download the file.');
      }
    }
    
    private mapFilename(versionNumber: number): string {
      const firmware = this.firmwareFiles.find(
        (file) => file.version_number === versionNumber,
      );
    
      if (firmware) {
        return firmware.filename;
      } else {
        throw new BadRequestException('Invalid version identifier');
      }
    }
}
