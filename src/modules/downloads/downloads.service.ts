import { BadRequestException, Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DownloadsService {
  // Add new version to the top of this array. Because sync endpoint get the version number and crc from here. 
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

  getTopFirmware() {
    return this.firmwareFiles[0];
  }

  getDirectoryPath(): string {
    if (process.env.NODE_ENV === 'local') {
      return path.join(__dirname, '../../../src/assets/firmware');
    } else if (process.env.NODE_ENV === 'production') {
      return path.join(__dirname, '../../../dist/assets/firmware');
    } else {
      throw new Error('NODE_ENV not set or unrecognized');
    }
  }

  mapFilename(versionNumber: number): string {
    const firmware = this.firmwareFiles.find(
      (file) => file.version_number === versionNumber,
    );

    if (firmware) {
      return firmware.filename;
    } else {
      throw new BadRequestException('Invalid version identifier');
    }
  }

  getFilePath(versionNumber: string): string {
    const actualFilename = this.mapFilename(parseInt(versionNumber));
    const directoryPath = this.getDirectoryPath();
    const filePath = path.join(directoryPath, actualFilename);

    if (fs.existsSync(filePath)) {
      return filePath;
    } else {
      throw new BadRequestException('File not found');
    }
  }

  streamFile(filePath: string, res: Response): void {
    res.setHeader('Content-Disposition', `attachment; filename=${path.basename(filePath)}`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}
