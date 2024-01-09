import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createSchemaForClassWithMethods } from '../../create-schema';
import { BaseData } from './base-data.schema';

export enum OPERATION_SOURCE {

}

@Schema({ timestamps: true })
export class OperationData extends BaseData {

}

export const OperationDataSchema = createSchemaForClassWithMethods(OperationData);
