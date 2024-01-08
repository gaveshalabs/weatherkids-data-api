import { Prop } from '@nestjs/mongoose';
import { IsOptional } from 'class-validator';

export class WeatherDataPoint {
  @IsOptional()
  @Prop()
  timestamp: number;

  @IsOptional()
  @Prop()
  temperature: number;

  @IsOptional()
  @Prop()
  humidity: number;

  @IsOptional()
  @Prop()
  pressure: number;

  @IsOptional()
  @Prop()
  precipitation: number;

  @IsOptional()
  @Prop()
  solar_irradiance: number;

  @IsOptional()
  @Prop()
  percentage_light_intensity: number;

  @IsOptional()
  @Prop()
  tvoc: number;
}
