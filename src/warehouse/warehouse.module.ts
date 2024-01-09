import { Module } from "@nestjs/common";
import { WarehouseController } from "./warehouse.controller";
import { SalesDataService } from "./services/sales-data.service";
import { MarketingDataService } from "./services/marketing-data.service";
import { OperationDataService } from "./services/operation-data.service";
import { ConfigService } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { BigQuery } from '@google-cloud/bigquery';
import { BaseDataService } from "./services/base-data.service";

@Module({
    imports: [HttpModule],
    exports: [SalesDataService, MarketingDataService, OperationDataService, ConfigService, 'BigQueryToken', BaseDataService],
    controllers: [WarehouseController],
    providers: [SalesDataService, MarketingDataService, OperationDataService, ConfigService, BaseDataService, {
        provide: 'BigQueryToken',
        useFactory: async () => {
            const bigquery = new BigQuery({
                projectId: 'inner-tokenizer-410707',
                keyFilename: './keys.json',
            });
            return bigquery;
        },
    },]
})
export class WarehouseModule {
    constructor() { }
}