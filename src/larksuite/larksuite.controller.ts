import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { LarkSuiteService } from './larksuite.service';

@Controller('lark')
export class LarkSuiteController {
  constructor(private readonly larkService: LarkSuiteService) { }

  // @Get()
  // async get() {
  //   console.log('automation -------------------')
  //   return this.larkService.createRecord()
  // return this.larkService.getAppInfo();
  // }
  @Get('sync')
  async sync() {
    // return this.larkService.syncTableData()
  }

  @Get('test')
  async test() {
    return this.larkService.getNewSMSBanking()
  }


}