import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BigQuery } from '@google-cloud/bigquery';

@Injectable()
export class BaseDataService {
    constructor(
        @Inject('BigQueryToken') private readonly bigquery: BigQuery,
        private readonly configService: ConfigService,
    ) {}

    async yourMethod() {
        const schema = [
            {name: 'Name', type: 'STRING', mode: 'REQUIRED'},
            {name: 'Job', type: 'STRING'},
            {name: 'Weight', type: 'FLOAT'},
            {name: 'IsMagic', type: 'BOOLEAN'},
          ]
          const options = {
            schema: schema,
            // location: 'VN',
          };
        // Sử dụng this.bigquery để tương tác với BigQuery
        // await this.bigquery.createDataset('human')
        // await this.bigquery.dataset('human').createTable('Bang2', options);
        // console.log(`Dataset ${dataset.id} created.`);
        // await this.bigquery.dataset('human').table('Bang2').insert({"Name": "Nam Hoang", "Job": "Engineer", "Weight": 55, "IsMagic": false})
       console.log(await this.bigquery.dataset('human').table('Bang2').getRows(
            // {"Name": "Quan", "Age": 29, "Weight": 55, "IsMagic": false}
            ))
    }

    async pushDataToWarehouse(data: []) {
        //logic đẩy dữ liệu lên GoogleBigQuery
    }
}