import { BadRequestException, Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DownloadsService {

  private readonly crc32Table: number[];

  // Add new version to the top of this array. Because sync endpoint get the version number and crc from here. 
  private firmwareFiles = [
    {
      version_number: '1002004',
      filename: 'WeatherKids V4 1.2.4.bin',
      crc: '12345678',
      file_size: '78084',
    },
    {
      version_number: '999001001',
      filename: '3k.txt',
      crc: '12345',
      file_size: '3276',
    },
    {
      version_number: 'abc25d',
      filename: 'Version_1.2.3.txt',
      crc: '12345',
      file_size: '21',
    },
    {
      version_number: '2dr',
      filename: 'Version_1.2.4.bin',
      crc: 'fgd254rg',
      file_size: '534',
    },
    {
      version_number: '12552d',
      filename: 'Version_1.2.5.exe',
      crc: 'Defined',
      file_size: '1024',
    },
    {
      version_number: 'hgt',
      filename: 'Version_1.2.6.txt',
      crc: 'Defined',
      file_size: '2024',
    },
    {
      version_number: 'cvt',
      filename: 'Version_1.2.7.txt',
      crc: 'Defined',
      file_size: '24',
    },
  ];

  constructor() {
    this.crc32Table = this.generateCrc32Table();
  }

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

  async streamFile(filePath: string, res: Response, range: string | undefined): Promise<void> {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    let crc32Value = '';

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).send('Requested range not satisfiable');
        return;
      }

      const chunksize = (end - start) + 1;
      crc32Value = await this.calculateCrc32ForRange(filePath, start, end);
      
      const fileStream = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'application/octet-stream',
        'X-CRC32': `"${crc32Value}"`,
      };

      res.writeHead(206, head);
      fileStream.pipe(res);
    } else {
      crc32Value = await this.calculateCrc32ForRange(filePath, 0, fileSize - 1);

      res.setHeader('Content-Disposition', `attachment; filename=${path.basename(filePath)}`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('X-CRC32', `"${crc32Value}"`);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  }

  findCrcByVersion(version_number: string): { file_size: string; crc: string }{
    const firmware = this.firmwareFiles.find(
      (file) => file.version_number === version_number,
    );
  
    if (firmware) {
      return {
        file_size: firmware.file_size,
        crc: firmware.crc,
      };
    }
  }

  private generateCrc32Table(): number[] {
    const table = new Array(256);
    const polynomial = 0x04C11DB7;

    for (let i = 0; i < 256; i++) {
      let crc = i << 24;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x80000000) !== 0) {
          crc = (crc << 1) ^ polynomial;
        } else {
          crc = crc << 1;
        }
      }
      table[i] = crc >>> 0;
    }
    return table;
  }

  async calculateCrc32ForRange(filePath: string, start: number, end: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(filePath, { start, end });
      let crc32Sum = 0xFFFFFFFF; 

      fileStream.on('data', (chunk) => {
        for (let i = 0; i < chunk.length; i++) {
          const byte = chunk[i] as number; 
          const tableIndex = (crc32Sum >>> 24) ^ byte;
          crc32Sum = (crc32Sum << 8) ^ this.crc32Table[tableIndex];
        }
      });

      fileStream.on('end', () => {
        crc32Sum = crc32Sum >>> 0; 
        const crc32Value = crc32Sum.toString(16).toUpperCase().padStart(8, '0');
        resolve(crc32Value);
      });

      fileStream.on('error', (err) => {
        reject(err);
      });
    });
  }
}
