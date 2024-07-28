import { Prop } from '@nestjs/mongoose';
import { IsOptional } from 'class-validator';

export class KiteDataPoint {
  @IsOptional()
  @Prop()
  timestamp: number;

  @IsOptional()
  @Prop()
  timestamp_iso: string;

  @IsOptional()
  @Prop()
  temperature: number;

  @IsOptional()
  @Prop()
  pressure: number;

  @IsOptional()
  @Prop()
  altitude: number;
}
