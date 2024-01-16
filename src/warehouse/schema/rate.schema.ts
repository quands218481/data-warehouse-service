import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createSchemaForClassWithMethods } from '../../create-schema';
import { enums } from 'google-ads-api';

export enum RATE_SOURCE {
    LIAN = "Lian",
    WISE = "Wise",
    PO = 'Payoneer',
    PIPO = 'Pingpong'
}
export enum RATE_TYPE {
    QUATER = "quater",
    HOUR = "hour",
    DAY = 'day',
    MONTH = 'month'
}
export enum CURRENCY {
    EUR = "EUR",
    USD = "USD",
    GBP = "GBP",
    AUD = 'AUD'
}
export enum ACTION {
    WITHDRAW = "withdraw",
    TOPUP = "topup",
}
@Schema({ timestamps: true })
export class Rate extends Document {

    @Prop({
        required: true,
    })
    source: RATE_SOURCE;

    @Prop({
        required: true,
    })
    rateType: RATE_TYPE;

    @Prop({
        required: true,
    })
    currency: CURRENCY;

    @Prop({
        required: true,
    })
    action: ACTION;

    @Prop({
        required: false,
    })
    hour: string
    @Prop({
        required: false,
    })
    day: string
    @Prop({
        required: false,
    })
    month: string
    @Prop({
        required: false,
    })
    year: string

    @Prop({
        required: true,
    })
    rate: number

    @Prop({
        // required: true
    })
    createdAt?: Date

    @Prop({
        // required: true
    })
    updatedAt?: Date

}

export const RateSchema = createSchemaForClassWithMethods(Rate);
