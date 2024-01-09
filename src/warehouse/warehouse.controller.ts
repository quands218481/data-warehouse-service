import { Controller, Get } from "@nestjs/common";
import { SalesDataService } from "./services/sales-data.service";
import { OperationDataService } from "./services/operation-data.service";
import { MarketingDataService } from "./services/marketing-data.service";
import { BaseDataService } from "./services/base-data.service";

@Controller('warehouse')

export class WarehouseController {
    constructor(
        private readonly baseService: BaseDataService,
        private readonly salesService: SalesDataService,
        private readonly operationService: OperationDataService,
        private readonly marketingService: MarketingDataService
    ) {
    
    }
    @Get()
    get() {
        this.baseService.yourMethod()
    }
}