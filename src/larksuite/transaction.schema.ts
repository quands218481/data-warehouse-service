import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createSchemaForClassWithMethods } from '../create-schema';


@Schema({ timestamps: true })
export class Transaction extends Document {

  @Prop({
    required: true,
  })
  order_number: number

  @Prop({
    // required: true
  })
  createdAt?: Date

  @Prop({
    // required: true
  })
  updatedAt?: Date

}

export const TransactionSchema = createSchemaForClassWithMethods(Transaction);
