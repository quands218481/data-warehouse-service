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
  @Get()
  async get() {
    return this.larkService.createApproval()
  }

  // @Post()
  // async post() {
    // return this.larkService.sendRecordsToVacom()
  // }
}