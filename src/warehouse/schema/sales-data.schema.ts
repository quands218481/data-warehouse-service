import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createSchemaForClassWithMethods } from '../../create-schema';
import { BaseData } from './base-data.schema';

export enum SALES_SOURCE {

}

@Schema({ timestamps: true })
export class SalesData extends BaseData {

}

export const SalesDataSchema = createSchemaForClassWithMethods(SalesData);