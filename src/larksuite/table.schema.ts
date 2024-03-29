import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createSchemaForClassWithMethods } from '../create-schema';

@Schema({ timestamps: true })
export class Table extends Document {
  @Prop({
    required: false,
  })
  revision: number;

  @Prop({
    required: false,
  })
  name: string;

  @Prop({
    required: true,
  })
  type: string;

  @Prop({
    required: false,
  })
  table_id: string

  @Prop({
    required: true,
  })
  flag_number: number

  @Prop({
    // required: true
  })
  createdAt?: Date

  @Prop({
    // required: true
  })
  updatedAt?: Date

}

export const TableSchema = createSchemaForClassWithMethods(Table);
