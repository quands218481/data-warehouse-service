import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createSchemaForClassWithMethods } from '../create-schema';

@Schema({ timestamps: true })
export class LarkRate extends Document {

  @Prop({
    required: false,
  })
  provider: string;

  @Prop({
    required: false,
  })
  data: any[]

  @Prop({
    required: false,
  })
  type: string

  
  @Prop({
    // required: true
  })
  createdAt?: Date

  @Prop({
    // required: true
  })
  updatedAt?: Date

}

export const LarkRateSchema = createSchemaForClassWithMethods(LarkRate);
