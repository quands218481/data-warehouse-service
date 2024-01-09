import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class BaseDataService {
    constructor(
        private readonly configService: ConfigService,
    ) {

    }

    async pushDataToWarehouse(data: []) { 
        //logic đẩy dữ liệu lên GoogleBigQuery
     }
}