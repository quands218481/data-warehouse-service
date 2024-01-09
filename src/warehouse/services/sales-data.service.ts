import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleAdsApi } from 'google-ads-api';
import { BaseDataService } from "./base-data.service";

@Injectable()
export class SalesDataService {
    constructor(
        private readonly configService: ConfigService,
        private readonly baseDataService: BaseDataService
    ) {

    }

    async getData() {}
}