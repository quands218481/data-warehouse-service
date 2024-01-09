import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config'
// import { ZeroxAnonBotModule } from './0xanonbot/0xanonbot.module';
import { TelegrafModule } from 'nestjs-telegraf';
// import { JobsModule } from './jobs/jobs.module';
// import { MessagesModule } from './message/messages.module';
import { LarkSuiteModule } from './larksuite/larksuite.module';
import { ScheduleModule } from '@nestjs/schedule';
import { Connection } from 'mongoose';
import { WarehouseModule } from './warehouse/warehouse.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      load: [configuration]}),
    MongooseModule.forRoot(process.env.MONGOOSE_URL),
    // TelegrafModule.forRootAsync({
    //   useFactory: () => ({
    //     botName: <string>process.env.TELEGRAM_OXANON_BOT_NAME,
    //     token: <string>process.env.TELEGRAM_0XANON_BOT_TOKEN,
    //     include: [ZeroxAnonBotModule],
    //   }),
    // }),
    LarkSuiteModule,
    WarehouseModule
  ],
})
export class AppModule {}
