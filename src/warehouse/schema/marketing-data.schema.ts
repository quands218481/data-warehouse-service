import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createSchemaForClassWithMethods } from '../../create-schema';
import { BaseData } from './base-data.schema';

export enum MKT_SOURCE {
  FACEBOOK = "facebook",
  GOOGLE = "google",
  TIKTOK = 'tiktok',
  SHOPEE = 'shopee'
}

@Schema({ timestamps: true })
export class MarketingData extends BaseData {

}

export const MarketingDataSchema = createSchemaForClassWithMethods(MarketingData);
