import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleAdsApi } from 'google-ads-api';
import { BaseDataService } from "./base-data.service";
import { LarkSuiteService } from "src/larksuite/larksuite.service";

@Injectable()
export class SalesDataService {
    constructor(
        private readonly configService: ConfigService,
        private readonly baseDataService: BaseDataService,
        private readonly larkService: LarkSuiteService
    ) {

    }

    async createNewData() {
        // const app_token = 'VohabzLERaEXi2s4zTaufY0Hsjh'
        // const table_id = 'tbl1XnCDyeqODKbE'
        // const data = await this.larkService.getNewRecords('', table_id, app_token)
        // const res = await this.baseDataService.pushDataToWarehouse(data)
        // return res
    }
}