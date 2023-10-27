import { FirebaseModule } from './modules/firebase/firebase.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { WeatherDataModule } from './modules/weather-data/weather-data.module';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { WeatherStationsModule } from './modules/weather-stations/weather-stations.module';
@Module({
  imports: [
    FirebaseModule,
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URL),
    WeatherDataModule,
    UsersModule,
    WeatherStationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
