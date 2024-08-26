import { BadRequestException, Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DownloadsService {
  // Add new version to the top of this array. Because sync endpoint get the version number and crc from here. 
  private firmwareFiles = [
    {
      version_number: 'abc25d',
      filename: 'Version_1.2.3.txt',
      crc: '12345',
    },
    {
      version_number: '2dr',
      filename: 'Version_1.2.4.bin',
      crc: 'fgd254rg',
    },
    {
      version_number: '12552d',
      filename: 'Version_1.2.5.exe',
      crc: 'Defined',
    },
    {
      version_number: 'hgt',
      filename: 'Version_1.2.6.txt',
      crc: 'Defined',
    },
    {
      version_number: 'cvt',
      filename: 'Version_1.2.7.txt',
      crc: 'Defined',
    },
  ];

  getLatestFirmware() {
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

  mapFilename(versionNumber: string): string {
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
    const actualFilename = this.mapFilename(versionNumber);
    const directoryPath = this.getDirectoryPath();
    const filePath = path.join(directoryPath, actualFilename);

    if (fs.existsSync(filePath)) {
      return filePath;
    } else {
      throw new BadRequestException('File not found');
    }
  }

  streamFile(filePath: string, res: Response, range: string | undefined): void {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).send('Requested range not satisfiable');
        return;
      }

      const chunksize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'application/octet-stream',
      };

      res.writeHead(206, head);
      fileStream.pipe(res);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename=${path.basename(filePath)}`);
      res.setHeader('Content-Type', 'application/octet-stream');
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  }

  findCrcByVersion(version_number: string): string {
    const firmware = this.firmwareFiles.find(
      (file) => file.version_number === version_number,
    );
    return firmware.crc;
  }
}
