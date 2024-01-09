import { Controller } from "@nestjs/common";
import { SalesDataService } from "./services/sales-data.service";
import { OperationDataService } from "./services/operation-data.service";
import { MarketingDataService } from "./services/marketing-data.service";

@Controller('')

export class WarehouseController {
    constructor(
        private readonly salesService: SalesDataService,
        private readonly operationService: OperationDataService,
        private readonly marketingService: MarketingDataService
    ) {

    }
}