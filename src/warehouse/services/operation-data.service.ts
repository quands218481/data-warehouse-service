import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BaseDataService } from "./base-data.service";
import { LarkSuiteService } from "src/larksuite/larksuite.service";
import * as moment from "moment"
import { firstValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { InjectModel } from "@nestjs/mongoose";
import { ACTION, CURRENCY, RATE_SOURCE, RATE_TYPE, Rate } from "../schema/rate.schema";
import { Model } from "mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class OperationDataService {
    constructor(
        private readonly configService: ConfigService,
        private readonly http: HttpService,
        private readonly baseDataService: BaseDataService,
        private readonly larkService: LarkSuiteService,
        @InjectModel(Rate.name) private rateModel: Model<Rate>,
    ) {

    }

    //cronjob at UTCTime
    @Cron('12 16 * * *')
    async getCassoSMSBanking() {
        try {
            const data = await this.larkService.getNewSMSBanking()
            if (data && data.length) {
                this.baseDataService.pushDataToWarehouse('OperationData', 'CassoSMSBanking', data)
            }
        } catch (error) {
            console.log(error)
        }
    }

    @Cron('11 16 * * *')
    async getTopupTransactionFromLark() {
        try {
            const app_token = 'PWQDbkcYbasVnVsmeNkuewIOsdH'
            const table_id = 'tblen5NSfiK7kliV'
            const result = await this.larkService.getNewRecords('', table_id, app_token)
            if (result && result.length) {
                const transactions = result.map((e) => {
                    const obj = {}
                    obj['Rate'] = parseInt(e['fields']['1.Rate']) || 0
                    obj['Client'] = e['fields']['3.Client'] || ''
                    obj['Amount'] = parseInt(e['fields']['Amount(auto)']) || 0
                    obj['AmountVND'] = e['fields']['AmountVND(auto)'] || 0
                    obj['Date'] = new Date(e['fields']['Date(auto)']) || new Date()
                    obj['Platform'] = e['fields']['Ewallet'] || ''
                    return obj;
                })
                await this.baseDataService.pushDataToWarehouse('OperationData', 'TopupTable', transactions)
            }
        } catch (error) {
            console.log(error)
        }
    }
    @Cron('0,15,30,45 * * * *')
    async getQuaterTopupRatesFromPlatform() {
        console.log('topup, quater', new Date())
        try {
            const d = new Date()
            const hour = this.addZero(d.getUTCHours())
            const day = this.addZero(d.getUTCDate())
            const month = this.addZero(d.getUTCMonth() + 1)
            const year = d.getUTCFullYear().toString()
            const lianRate = (await this.getTopupLianRates()).rate
            const wiseRate = (await this.getTopupWiseRates()).rate
            if (lianRate && wiseRate) {
                const data = [{ rateType: RATE_TYPE.QUATER, source: RATE_SOURCE.LIAN, rate: lianRate['GBP'], currency: CURRENCY.GBP, action: ACTION.TOPUP, hour, day, month, year },
                { rateType: RATE_TYPE.QUATER, source: RATE_SOURCE.LIAN, rate: lianRate['EUR'], currency: CURRENCY.EUR, action: ACTION.TOPUP, hour, day, month, year },
                { rateType: RATE_TYPE.QUATER, source: RATE_SOURCE.LIAN, rate: lianRate['AUD'], currency: CURRENCY.AUD, action: ACTION.TOPUP, hour, day, month, year },
                { rateType: RATE_TYPE.QUATER, source: RATE_SOURCE.WISE, rate: wiseRate['GBP'], currency: CURRENCY.GBP, action: ACTION.TOPUP, hour, day, month, year },
                { rateType: RATE_TYPE.QUATER, source: RATE_SOURCE.WISE, rate: wiseRate['EUR'], currency: CURRENCY.EUR, action: ACTION.TOPUP, hour, day, month, year },
                { rateType: RATE_TYPE.QUATER, source: RATE_SOURCE.WISE, rate: wiseRate['AUD'], currency: CURRENCY.AUD, action: ACTION.TOPUP, hour, day, month, year },]
                this.rateModel.insertMany(data)
                this.baseDataService.pushDataToWarehouse('OperationData', 'RatePlatform', data)
            }
        } catch (error) {
            console.log(error)
        }
    }
    @Cron('2 * * * *')
    async getHourTopupRatesFromPlatform() {
        console.log('topup, hour', new Date())
        try {
            const currentDateTime = new Date();
            // Subtract one hour
            const lastHourDateTime = new Date(currentDateTime.getTime() - 60 * 60 * 1000);
            // Extract the hour, date, month, and full year
            const hour = this.addZero(lastHourDateTime.getUTCHours());
            const day = this.addZero(lastHourDateTime.getUTCDate());
            const month = this.addZero(lastHourDateTime.getUTCMonth() + 1); // Months are zero-based
            const year = lastHourDateTime.getUTCFullYear().toString();
            const groups = await Promise.all([
                this.rateModel.find({ source: RATE_SOURCE.LIAN, action: ACTION.TOPUP, rateType: RATE_TYPE.QUATER, currency: CURRENCY.GBP, hour, day, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.LIAN, action: ACTION.TOPUP, rateType: RATE_TYPE.QUATER, currency: CURRENCY.EUR, hour, day, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.LIAN, action: ACTION.TOPUP, rateType: RATE_TYPE.QUATER, currency: CURRENCY.AUD, hour, day, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.WISE, action: ACTION.TOPUP, rateType: RATE_TYPE.QUATER, currency: CURRENCY.GBP, hour, day, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.WISE, action: ACTION.TOPUP, rateType: RATE_TYPE.QUATER, currency: CURRENCY.EUR, hour, day, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.WISE, action: ACTION.TOPUP, rateType: RATE_TYPE.QUATER, currency: CURRENCY.AUD, hour, day, month, year }).lean()
            ])
            const alpha = groups.filter((ele) => {
                return ele.length
            })
            if (alpha.length) {
                const docs = alpha.map((group) => {
                    const rate = group.reduce((acc, cur) => {
                        const length = group.length
                        return acc + cur.rate / length
                    }, 0)
                    return { rate, action: ACTION.TOPUP, rateType: RATE_TYPE.HOUR, source: group[0].source, currency: group[0].currency, hour, day, month, year };
                })
                this.rateModel.insertMany(docs)
                this.baseDataService.pushDataToWarehouse('OperationData', 'RatePlatform', docs)
            }
        } catch (error) {
            console.log(error)
        }
    }
    @Cron('4 0 * * *')
    async getDateTopupRatesFromPlatform() {
        console.log('topup, day', new Date())
        try {
            const currentDateTime = new Date();
            // Subtract one hour
            const lastDateTime = new Date(currentDateTime.getTime() - 24 * 60 * 60 * 1000);
            // Extract the hour, date, month, and full year
            const day = this.addZero(lastDateTime.getUTCDate());
            const month = this.addZero(lastDateTime.getUTCMonth() + 1); // Months are zero-based
            const year = lastDateTime.getUTCFullYear().toString();
            // const lianRate = await this.getWithdrawLianRates()
            // const wiseRate = await this.getWithdrawWiseRates()
            const groups = await Promise.all([
                this.rateModel.find({ source: RATE_SOURCE.LIAN, action: ACTION.TOPUP, rateType: RATE_TYPE.HOUR, currency: CURRENCY.GBP, day, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.LIAN, action: ACTION.TOPUP, rateType: RATE_TYPE.HOUR, currency: CURRENCY.EUR, day, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.LIAN, action: ACTION.TOPUP, rateType: RATE_TYPE.HOUR, currency: CURRENCY.AUD, day, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.WISE, action: ACTION.TOPUP, rateType: RATE_TYPE.HOUR, currency: CURRENCY.GBP, day, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.WISE, action: ACTION.TOPUP, rateType: RATE_TYPE.HOUR, currency: CURRENCY.EUR, day, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.WISE, action: ACTION.TOPUP, rateType: RATE_TYPE.HOUR, currency: CURRENCY.AUD, day, month, year }).lean()
            ])
            const alpha = groups.filter((ele) => {
                return ele.length
            })
            if (alpha.length) {
                const docs = alpha.map((group) => {
                    const rate = group.reduce((acc, cur) => {
                        const length = group.length
                        return acc + cur.rate / length
                    }, 0)
                    return { rate, action: ACTION.TOPUP, rateType: RATE_TYPE.DAY, source: group[0].source, currency: group[0].currency, day, month, year };
                })
                this.rateModel.insertMany(docs)
                this.baseDataService.pushDataToWarehouse('OperationData', 'RatePlatform', docs)
            }
        } catch (error) {
            console.log(error)
        }
    }

    @Cron('8 0 1 * *')
    async getMonthTopupRatesFromPlatform() {
        console.log('topup, month', new Date())
        try {
            const currentDateTime = new Date();
            // Subtract one hour
            const lastMonthTime = new Date(currentDateTime.getTime() - 24 * 60 * 60 * 1000);
            // Extract the hour, date, month, and full year
            const month = this.addZero(lastMonthTime.getUTCMonth() + 1); // Months are zero-based
            const year = lastMonthTime.getUTCFullYear().toString();
            // const lianRate = await this.getWithdrawLianRates()
            // const wiseRate = await this.getWithdrawWiseRates()
            const groups = await Promise.all([
                this.rateModel.find({ source: RATE_SOURCE.LIAN, action: ACTION.TOPUP, rateType: RATE_TYPE.DAY, currency: CURRENCY.GBP, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.LIAN, action: ACTION.TOPUP, rateType: RATE_TYPE.DAY, currency: CURRENCY.EUR, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.LIAN, action: ACTION.TOPUP, rateType: RATE_TYPE.DAY, currency: CURRENCY.AUD, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.WISE, action: ACTION.TOPUP, rateType: RATE_TYPE.DAY, currency: CURRENCY.GBP, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.WISE, action: ACTION.TOPUP, rateType: RATE_TYPE.DAY, currency: CURRENCY.EUR, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.WISE, action: ACTION.TOPUP, rateType: RATE_TYPE.DAY, currency: CURRENCY.AUD, month, year }).lean()
            ])
            const alpha = groups.filter((ele) => {
                return ele.length
            })
            if (alpha.length) {
                const docs = alpha.map((group) => {
                    const rate = group.reduce((acc, cur) => {
                        const length = group.length
                        return acc + cur.rate / length
                    }, 0)
                    return { rate, action: ACTION.TOPUP, rateType: RATE_TYPE.MONTH, source: group[0].source, currency: group[0].currency, month, year };
                })
                this.rateModel.insertMany(docs)
                this.baseDataService.pushDataToWarehouse('OperationData', 'RatePlatform', docs)
            }
        } catch (error) {
            console.log(error)
        }
    }

    @Cron('30 0,15,30,45 * * * *')
    async getAquaterWithdrawRatesFromPlatform() {
        console.log('withdraw, quater', new Date())
        try {
            const d = new Date()
            const hour = this.addZero(d.getUTCHours())
            const day = this.addZero(d.getUTCDate())
            const month = this.addZero(d.getUTCMonth() + 1)
            const year = d.getUTCFullYear().toString()
            const lianRate = (await this.getWithdrawLianRates()).rate
            const wiseRate = (await this.getWithdrawWiseRates()).rate
            if (lianRate && wiseRate) {
                const data = [
                    { rateType: RATE_TYPE.QUATER, source: RATE_SOURCE.LIAN, rate: lianRate['GBP'], currency: CURRENCY.GBP, action: ACTION.WITHDRAW, hour, day, month, year },
                    { rateType: RATE_TYPE.QUATER, source: RATE_SOURCE.LIAN, rate: lianRate['EUR'], currency: CURRENCY.EUR, action: ACTION.WITHDRAW, hour, day, month, year },
                    { rateType: RATE_TYPE.QUATER, source: RATE_SOURCE.LIAN, rate: lianRate['AUD'], currency: CURRENCY.AUD, action: ACTION.WITHDRAW, hour, day, month, year },
                    { rateType: RATE_TYPE.QUATER, source: RATE_SOURCE.WISE, rate: wiseRate['GBP'], currency: CURRENCY.GBP, action: ACTION.WITHDRAW, hour, day, month, year },
                    { rateType: RATE_TYPE.QUATER, source: RATE_SOURCE.WISE, rate: wiseRate['EUR'], currency: CURRENCY.EUR, action: ACTION.WITHDRAW, hour, day, month, year },
                    { rateType: RATE_TYPE.QUATER, source: RATE_SOURCE.WISE, rate: wiseRate['AUD'], currency: CURRENCY.AUD, action: ACTION.WITHDRAW, hour, day, month, year },
                ]
                this.rateModel.insertMany(data)
                this.baseDataService.pushDataToWarehouse('OperationData', 'RatePlatform', data)
            }
        } catch (error) {
            console.log(error)
        }
    }
    @Cron('3 * * * *')
    async getHourWithdrawRatesFromPlatform() {
        console.log('withdraw, hour', new Date())
        try {
            const currentDateTime = new Date();
            // Subtract one hour
            const lastHourDateTime = new Date(currentDateTime.getTime() - 60 * 60 * 1000);
            // Extract the hour, date, month, and full year
            const hour = this.addZero(lastHourDateTime.getUTCHours());
            const day = this.addZero(lastHourDateTime.getUTCDate());
            const month = this.addZero(lastHourDateTime.getUTCMonth() + 1); // Months are zero-based
            const year = lastHourDateTime.getUTCFullYear().toString();
            // const lianRate = await this.getWithdrawLianRates()
            // const wiseRate = await this.getWithdrawWiseRates()
            const groups = await Promise.all([
                this.rateModel.find({ source: RATE_SOURCE.LIAN, action: ACTION.WITHDRAW, rateType: RATE_TYPE.QUATER, currency: CURRENCY.GBP, hour, day, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.LIAN, action: ACTION.WITHDRAW, rateType: RATE_TYPE.QUATER, currency: CURRENCY.EUR, hour, day, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.LIAN, action: ACTION.WITHDRAW, rateType: RATE_TYPE.QUATER, currency: CURRENCY.AUD, hour, day, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.WISE, action: ACTION.WITHDRAW, rateType: RATE_TYPE.QUATER, currency: CURRENCY.GBP, hour, day, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.WISE, action: ACTION.WITHDRAW, rateType: RATE_TYPE.QUATER, currency: CURRENCY.EUR, hour, day, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.WISE, action: ACTION.WITHDRAW, rateType: RATE_TYPE.QUATER, currency: CURRENCY.AUD, hour, day, month, year }).lean()
            ])
            const alpha = groups.filter((ele) => {
                return ele.length
            })
            if (alpha.length) {
                const docs = alpha.map((group) => {
                    const rate = group.reduce((acc, cur) => {
                        const length = group.length
                        return acc + cur.rate / length
                    }, 0)
                    return { rate, action: ACTION.WITHDRAW, rateType: RATE_TYPE.HOUR, source: group[0].source, currency: group[0].currency, hour, day, month, year };
                })
                this.rateModel.insertMany(docs)
                this.baseDataService.pushDataToWarehouse('OperationData', 'RatePlatform', docs)
            }
        } catch (error) {
            console.log(error)
        }
    }

    @Cron('5 0 * * *')
    async getDateWithdrawRatesFromPlatform() {
        console.log('withdraw, day', new Date())
        try {
            const currentDateTime = new Date();
            // Subtract one hour
            const lastDateTime = new Date(currentDateTime.getTime() - 24 * 60 * 60 * 1000);
            // Extract the hour, date, month, and full year
            const day = this.addZero(lastDateTime.getUTCDate());
            const month = this.addZero(lastDateTime.getUTCMonth() + 1); // Months are zero-based
            const year = lastDateTime.getUTCFullYear().toString();
            const groups = await Promise.all([
                this.rateModel.find({ source: RATE_SOURCE.LIAN, action: ACTION.WITHDRAW, rateType: RATE_TYPE.HOUR, currency: CURRENCY.GBP, day, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.LIAN, action: ACTION.WITHDRAW, rateType: RATE_TYPE.HOUR, currency: CURRENCY.EUR, day, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.LIAN, action: ACTION.WITHDRAW, rateType: RATE_TYPE.HOUR, currency: CURRENCY.AUD, day, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.WISE, action: ACTION.WITHDRAW, rateType: RATE_TYPE.HOUR, currency: CURRENCY.GBP, day, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.WISE, action: ACTION.WITHDRAW, rateType: RATE_TYPE.HOUR, currency: CURRENCY.EUR, day, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.WISE, action: ACTION.WITHDRAW, rateType: RATE_TYPE.HOUR, currency: CURRENCY.AUD, day, month, year }).lean()
            ])
            const alpha = groups.filter((ele) => {
                return ele.length
            })
            if (alpha.length) {
                const docs = alpha.map((group) => {
                    const rate = group.reduce((acc, cur) => {
                        const length = group.length
                        return acc + cur.rate / length
                    }, 0)
                    return { rate, action: ACTION.WITHDRAW, rateType: RATE_TYPE.DAY, source: group[0].source, currency: group[0].currency, day, month, year };
                })
                this.rateModel.insertMany(docs)
                this.baseDataService.pushDataToWarehouse('OperationData', 'RatePlatform', docs)
            }
        } catch (error) {
            console.log(error)
        }
    }

    @Cron('7 0 1 * *')
    async getMonthWithdrawRatesFromPlatform() {
        console.log('withdraw, month', new Date())
        try {
            const currentDateTime = new Date();
            // Subtract one hour
            const lastMonthTime = new Date(currentDateTime.getTime() - 24 * 60 * 60 * 1000);
            // Extract the hour, date, month, and full year
            const month = this.addZero(lastMonthTime.getUTCMonth() + 1); // Months are zero-based
            const year = lastMonthTime.getUTCFullYear().toString();
            const groups = await Promise.all([
                this.rateModel.find({ source: RATE_SOURCE.LIAN, action: ACTION.WITHDRAW, rateType: RATE_TYPE.DAY, currency: CURRENCY.GBP, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.LIAN, action: ACTION.WITHDRAW, rateType: RATE_TYPE.DAY, currency: CURRENCY.EUR, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.LIAN, action: ACTION.WITHDRAW, rateType: RATE_TYPE.DAY, currency: CURRENCY.AUD, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.WISE, action: ACTION.WITHDRAW, rateType: RATE_TYPE.DAY, currency: CURRENCY.GBP, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.WISE, action: ACTION.WITHDRAW, rateType: RATE_TYPE.DAY, currency: CURRENCY.EUR, month, year }).lean(),
                this.rateModel.find({ source: RATE_SOURCE.WISE, action: ACTION.WITHDRAW, rateType: RATE_TYPE.DAY, currency: CURRENCY.AUD, month, year }).lean()
            ])
            const alpha = groups.filter((ele) => {
                return ele.length
            })
            if (alpha.length) {
                const docs = alpha.map((group) => {
                    const rate = group.reduce((acc, cur) => {
                        const length = group.length
                        return acc + cur.rate / length
                    }, 0)
                    return { rate, action: ACTION.WITHDRAW, rateType: RATE_TYPE.MONTH, source: group[0].source, currency: group[0].currency, month, year };
                })
                this.rateModel.insertMany(docs)
                this.baseDataService.pushDataToWarehouse('OperationData', 'RatePlatform', docs)
            }
        } catch (error) {
            console.log(error)
        }
    }
    async pushSMSBanking() {
        try {
            const app_token = 'VohabzLERaEXi2s4zTaufY0Hsjh'
            const table_id = 'tbl1XnCDyeqODKbE'
            const SMSBankings = await this.larkService.getNewRecords('', table_id, app_token)
            const newData = SMSBankings.map((sms) => {
                const alpha = { ...sms.fields }
                const newE = { ...alpha }
                newE['Amount'] = Number(alpha['Amount'])
                newE['Balance'] = Number(alpha['Balance'])
                newE['Time'] = new Date(alpha['Time'])
                return newE
            })
            const res = await this.baseDataService.pushDataToWarehouse('OperationData', 'kill', newData)
            return res
        } catch (error) {
            console.log(error)
        }
    }

    async getTopupLianRates() {
        try {
            const url = 'https://vn.lianlianglobal.com/cb-ew-biz-gateway/exchange/quote?t=81066'
            const body1 = {
                "exchangePayCurrency": "EUR", "exchangeReceiveCurrency": "USD", "exchangeAmount": 100, "pricingCurrency": "USD"
            }
            const config = {
                headers: {
                    "content-type": "application/json;charset=UTF-8",
                    "bpentityid": "202108061000001"
                }
            }
            const body2 = {
                "exchangePayCurrency": "GBP", "exchangeReceiveCurrency": "USD", "exchangeAmount": 100, "pricingCurrency": "USD"
            }
            const body3 = {
                "exchangePayCurrency": "AUD", "exchangeReceiveCurrency": "USD", "exchangeAmount": 100, "pricingCurrency": "USD"
            }
            const rate = {}
            const res1 = await firstValueFrom(this.http.post(url, body1, config))
            if (res1 && res1.data && res1.data.success) {
                rate[res1.data['model']['exchangePayCurrency']] = Number(res1.data['model']['selectedRate'])
            } else throw ('Request failed!!')
            const res2 = await firstValueFrom(this.http.post(url, body2, config))
            if (res2 && res2.data && res2.data.success) {
                rate[res2.data['model']['exchangePayCurrency']] = Number(res2.data['model']['selectedRate'])
            } else throw ('Request failed!!')
            const res3 = await firstValueFrom(this.http.post(url, body3, config))
            if (res3 && res3.data && res3.data.success) {
                rate[res3.data['model']['exchangePayCurrency']] = Number(res3.data['model']['selectedRate'])
            } else throw ('Request failed!!')
            return { result: 1, rate }
        } catch (error) {
            return { result: 0, error }
        }
    }

    async getWithdrawLianRates() {
        try {
            const url = 'https://vn.lianlianglobal.com/cb-ew-biz-gateway/exchange/quote?t=81066'
            const body1 = {
                "exchangePayCurrency": "USD", "exchangeReceiveCurrency": "EUR", "exchangeAmount": 100, "pricingCurrency": "USD"
            }
            const config = {
                headers: {
                    "content-type": "application/json;charset=UTF-8",
                    "bpentityid": "202108061000001"
                }
            }
            const body2 = {
                "exchangePayCurrency": "USD", "exchangeReceiveCurrency": "GBP", "exchangeAmount": 100, "pricingCurrency": "USD"
            }
            const body3 = {
                "exchangePayCurrency": "USD", "exchangeReceiveCurrency": "AUD", "exchangeAmount": 100, "pricingCurrency": "USD"
            }
            const rate = {}
            const res1 = await firstValueFrom(this.http.post(url, body1, config))
            if (res1 && res1.data && res1.data.success) {
                rate[res1.data['model']['exchangeReceiveCurrency']] = Number(res1.data['model']['selectedRate'])
            } else throw ('Request failed!!')
            const res2 = await firstValueFrom(this.http.post(url, body2, config))
            if (res2 && res2.data && res2.data.success) {
                rate[res2.data['model']['exchangeReceiveCurrency']] = Number(res2.data['model']['selectedRate'])
            } else throw ('Request failed!!')
            const res3 = await firstValueFrom(this.http.post(url, body3, config))
            if (res3 && res3.data && res3.data.success) {
                rate[res3.data['model']['exchangeReceiveCurrency']] = Number(res3.data['model']['selectedRate'])
            } else throw ('Request failed!!')

            return { result: 1, rate }

        } catch (error) {
            return { result: 0, error }
        }
    }

    async getTopupWiseRates() {
        try {
            const url = 'https://wise.com/gateway/v3/quotes/'
            const config = {
                headers: {
                    "accept": "application/json",
                    "content-type": "application/json"
                }
            }
            const body1 = { "sourceAmount": 1000, "sourceCurrency": "EUR", "targetCurrency": "USD", "preferredPayIn": "BANK_TRANSFER", "guaranteedTargetAmount": false, "type": "REGULAR" }
            const body2 = { "sourceAmount": 1000, "sourceCurrency": "GBP", "targetCurrency": "USD", "preferredPayIn": "BANK_TRANSFER", "guaranteedTargetAmount": false, "type": "REGULAR" }
            const body3 = { "sourceAmount": 1000, "sourceCurrency": "AUD", "targetCurrency": "USD", "preferredPayIn": "BANK_TRANSFER", "guaranteedTargetAmount": false, "type": "REGULAR" }
            const rate = {}
            const res1 = await firstValueFrom(this.http.post(url, body1, config))
            if (res1 && res1.data) {
                rate[res1.data['sourceCurrency']] = Number(res1.data['rate'])
            } else throw ('Request failed!!')
            const res2 = await firstValueFrom(this.http.post(url, body2, config))
            if (res2 && res2.data) {
                rate[res2.data['sourceCurrency']] = Number(res2.data['rate'])
            } else throw ('Request failed!!')
            const res3 = await firstValueFrom(this.http.post(url, body3, config))
            if (res3 && res3.data) {
                rate[res3.data['sourceCurrency']] = Number(res3.data['rate'])
            } else throw ('Request failed!!')

            return { result: 1, rate }
        } catch (error) {
            return { result: 0, error }
        }
    }
    async getWithdrawWiseRates() {
        try {
            const url = 'https://wise.com/gateway/v3/quotes/'
            const config = {
                headers: {
                    "accept": "application/json",
                    "content-type": "application/json"
                }
            }
            const body1 = { "sourceAmount": 1000, "sourceCurrency": "USD", "targetCurrency": "EUR", "preferredPayIn": "BANK_TRANSFER", "guaranteedTargetAmount": false, "type": "REGULAR" }
            const body2 = { "sourceAmount": 1000, "sourceCurrency": "USD", "targetCurrency": "GBP", "preferredPayIn": "BANK_TRANSFER", "guaranteedTargetAmount": false, "type": "REGULAR" }
            const body3 = { "sourceAmount": 1000, "sourceCurrency": "USD", "targetCurrency": "AUD", "preferredPayIn": "BANK_TRANSFER", "guaranteedTargetAmount": false, "type": "REGULAR" }
            const rate = {}
            const res1 = await firstValueFrom(this.http.post(url, body1, config))
            if (res1 && res1.data) {
                rate[res1.data['targetCurrency']] = Number(res1.data['rate'])
            } else throw ('Request failed!!')
            const res2 = await firstValueFrom(this.http.post(url, body2, config))
            if (res2 && res2.data) {
                rate[res2.data['targetCurrency']] = Number(res2.data['rate'])
            } else throw ('Request failed!!')
            const res3 = await firstValueFrom(this.http.post(url, body3, config))
            if (res3 && res3.data) {
                rate[res3.data['targetCurrency']] = Number(res3.data['rate'])
            } else throw ('Request failed!!')

            return { result: 1, rate }
        } catch (error) {
            return { result: 0, error }
        }
    }

    addZero(i) {
        if (i < 10) { i = "0" + i }
        return i.toString();
    }
}