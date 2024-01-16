import { Module } from "@nestjs/common";
import { WarehouseController } from "./warehouse.controller";
import { SalesDataService } from "./services/sales-data.service";
import { MarketingDataService } from "./services/marketing-data.service";
import { OperationDataService } from "./services/operation-data.service";
import { ConfigService } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { BigQuery } from '@google-cloud/bigquery';
import { BaseDataService } from "./services/base-data.service";
import { LarkSuiteService } from "src/larksuite/larksuite.service";
import { LarkSuiteModule } from "src/larksuite/larksuite.module";
import { MongooseModule } from "@nestjs/mongoose";
import { Watch, WatchSchema } from "src/larksuite/watch.schema";
import { Transaction, TransactionSchema } from "src/larksuite/transaction.schema";
import { Record, RecordSchema } from "src/larksuite/records.schema";
import { Table, TableSchema } from "src/larksuite/table.schema";
import { Rate, RateSchema } from "./schema/rate.schema";
import { LarkRate, LarkRateSchema } from "src/larksuite/larkRate.schema";

@Module({
    imports: [HttpModule, LarkSuiteModule, MongooseModule.forFeature(
        [
          {
            name: Watch.name,
            schema: WatchSchema
          },
      
          {
            name: Table.name,
            schema: TableSchema
          },
          {
            name: Record.name,
            schema: RecordSchema
          },
          {
            name: Transaction.name,
            schema: TransactionSchema
          },
          {
            name: Rate.name,
            schema: RateSchema
          },
          {
            name: LarkRate.name,
            schema: LarkRateSchema
          },
        ])],
    exports: [SalesDataService, MarketingDataService, OperationDataService, ConfigService, 'BigQueryToken', LarkSuiteService, BaseDataService],
    controllers: [WarehouseController],
    providers: [SalesDataService, MarketingDataService, OperationDataService, ConfigService, BaseDataService, LarkSuiteService, {
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