import { Injectable, Logger } from '@nestjs/common';
import * as lark from '@larksuiteoapi/node-sdk';
import { ConfigService } from '@nestjs/config';
import { Watch } from './watch.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Table } from './table.schema';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as https from "https";
import axios from 'axios';
import { randomInt } from 'crypto';
import { Record, TYPE } from './records.schema';
import { createWorker } from 'tesseract.js';
import * as cheerio from 'cheerio';
import { data } from 'cheerio/lib/api/attributes';
import path from 'path';
import { Transaction } from './transaction.schema';
import * as moment from 'moment';
import { LarkRate } from './larkRate.schema';
// import * as FormData from 'form-data';
// import { Duplex } from 'stream';

@Injectable()
export class LarkSuiteService {
  private readonly larkClient: lark.Client;
  private httpsAgent: https.Agent;
  constructor(private readonly configService: ConfigService,
    private readonly http: HttpService,
    @InjectModel (Table.name) private tableModel: Model<Table>
  ) {
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
    this.larkClient = new lark.Client({
      appId: 'cli_a5c27e8d76789009',
      appSecret: 'ucptiuCEFoWAGD56Hk2uMfdjS3sO3vAc',
      appType: lark.AppType.SelfBuild,
      domain: lark.Domain.Feishu,
    });
  }

  async getNewSMSBanking() {
    try {
      const newPaddedDate = this.getUTCDay()
      let order = 0
      const transaction = await this.tableModel.findOne({type: 'cassoSms'})
      // if (transaction) {
      //   order = transaction.flag_number
      // } else await this.tableModel.create({type: 'cassoSms', flag_number: 0})
      const baseUrl = 'https://oauth.casso.vn/v2/transactions'
      const config = {
        headers: { 'Authorization': 'Apikey AK_CS.452806a0aace11eeb4aed127dc45f347.RuAubAz5SLPWzackGw2Sy5wBnPyrQJa6MNP6uoVI9HIsOME54TkIbIQipquXtU7pB2A4kBGX' },
        params: { fromDate: `${newPaddedDate}`, toDate: `${newPaddedDate}`, pageSize: 100, sort: "DESC" }
      }
      const res = await firstValueFrom(this.http.get(baseUrl, config))
      const records = res.data.data.records
      if (records && records.length) {
        const flag_number = records[0]['tid']
        const validatedRecords = records.filter((ele) => {
          return Number(ele['tid'] > order)
        }).map((record) => {
          const newRecord = {}
          if (record['amount'] > 0) {
            newRecord['Transaction Type'] = 'credit'
          } else {
            newRecord['Transaction Type'] = 'debit'
          }
          newRecord['Bank'] = 'ACB'
          newRecord['Amount'] = Number(record['amount'].toString())
          newRecord['Account'] = record['bankSubAccId']
          newRecord['Balance'] = Number(record['cusumBalance'].toString())
          newRecord['Transaction Message'] = `TK${record['bankSubAccId']} ${record['amount'].toString()}`
          newRecord['Original Message'] = record['description']
          newRecord['Time'] = new Date(record['when'])
          return newRecord;
        })
        if (validatedRecords && validatedRecords.length) {
          console.log(validatedRecords[0])
          this.tableModel.updateOne({type: 'cassoSms'}, { $set: { flag_number} }, { upsert: true })
          return validatedRecords
        } else throw('No new Record!!')
      }
    } catch (error) {
      console.log(error)
      return []
    }
  }

  async getNewRecords(page_token, table_id, app_token) {
    try {
      /* Thu vien Moment lay Local time*/
      // const now = Date.now()
      // const yesterdayTimestamp = Date.parse(moment(now - 7*60*60*1000).startOf('day').toString())
      let res;
      let items = [];
      if (!page_token) {
        res = await this.larkClient.bitable.appTableRecord.list({
          path: {
            app_token,
            table_id,
          },
          params: {
            page_size: 499,
            // filter: `currentValue.[Created Time] >= ${yesterday}`
          }
        })
      } else {
        res = await this.larkClient.bitable.appTableRecord.list({
          path: {
            app_token,
            table_id,
          },
          params: {
            page_size: 499,
            page_token,
            // filter: `currentValue.[Created Time] >=${lastCronTime}`
          }
        })
      }
      if (res && res.code == 0) {
        items = items.concat(res.data.items)
        if (!res.data.has_more) {
          return items
        } else {
          return items.concat(await this.getNewRecords(res.data.page_token, table_id, app_token))
        }
      } else {
        throw ('Request failed!!')
      }
    } catch (error) {
      console.log(error)
      return []
    }
  }

  async getEditedRecords(page_token, table_id, app_token, lastModified, now) {
    try {
      let res;
      let items = [];
      if (!page_token) {
        res = await this.larkClient.bitable.appTableRecord.list({
          path: {
            app_token,
            table_id,
          },
          params: {
            page_size: 499,
            filter: `AND(currentValue.[Modified Time] >= ${lastModified}, currentValue.[Created Time] <= ${lastModified})`
          }
        })
      } else {
        res = await this.larkClient.bitable.appTableRecord.list({
          path: {
            app_token,
            table_id,
          },
          params: {
            page_size: 499,
            page_token,
            filter: `AND(currentValue.[Modified Time] >= ${lastModified}, currentValue.[Created Time] <= ${lastModified})`
          }
        })
      }
      if (res && res.code == 0) {
        items = items.concat(res.data.items)
        if (!res.data.has_more) {
          return items
        } else {
          return items.concat(await this.getEditedRecords(res.data.page_token, table_id, app_token, lastModified, now))
        }
      }
    } catch (error) {
      return []
    }
  }
  getUTCDay() {
    const dateObj = new Date();
    const month = dateObj.getUTCMonth() + 1; // months from 1-12
    const day = dateObj.getUTCDate();
    const year = dateObj.getUTCFullYear();


    // Using template literals:
    const newDate = `${year}-${month}-${day}`;

    // Using padded values, so that 2023/1/7 becomes 2023/01/07
    const pMonth = month.toString().padStart(2, "0");
    const pDay = day.toString().padStart(2, "0");
    const newPaddedDate = `${year}-${pMonth}-${pDay}`;
    return newPaddedDate
  }
}