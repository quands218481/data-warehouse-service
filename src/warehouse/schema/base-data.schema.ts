import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createSchemaForClassWithMethods } from '../../create-schema';


@Schema({ timestamps: true })
export class BaseData extends Document {

  @Prop({
    required: false,
  })
  source: string;

  @Prop({
    required: false,
  })
  type: string

  @Prop({
    required: true,
    type: Object
  })
  details: string

  @Prop({
    // required: true
  })
  createdAt?: Date

  @Prop({
    // required: true
  })
  updatedAt?: Date

}

export const BaseDataSchema = createSchemaForClassWithMethods(BaseData);
