import { Module } from "@nestjs/common";
import { WarehouseController } from "./warehouse.controller";
import { SalesDataService } from "./services/sales-data.service";
import { MarketingDataService } from "./services/marketing-data.service";
import { OperationDataService } from "./services/operation-data.service";
import { ConfigService } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";

@Module({
    imports: [HttpModule],
    exports: [SalesDataService, MarketingDataService, OperationDataService, ConfigService],
    controllers: [WarehouseController],
    providers: [SalesDataService, MarketingDataService, OperationDataService, ConfigService]
})
export class WarehouseModule {
    constructor() {}
}