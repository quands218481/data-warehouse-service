import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BaseDataService } from "./base-data.service";

@Injectable()
export class OperationDataService {
    constructor(
        private readonly configService: ConfigService,
        private readonly baseDataService: BaseDataService
    ) {

    }

    async getData() { }
}