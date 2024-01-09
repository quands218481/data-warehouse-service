import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleAdsApi, enums } from "google-ads-api";
import { FacebookAdsApi, AdAccount, Campaign } from 'facebook-nodejs-business-sdk';
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { BaseDataService } from "./base-data.service";

@Injectable()
export class MarketingDataService {
    private readonly ggClient: any;
    private readonly fbAdsAccount: any;
    constructor(
        private readonly configService: ConfigService,
        private readonly http: HttpService,
        private readonly baseDataService: BaseDataService,
    ) {
        this.ggClient = new GoogleAdsApi({
            developer_token: this.configService.get('google.dev_token'),
            client_id: this.configService.get('google.client_id'),
            client_secret: this.configService.get('google.client_secret'),
        })
        const api = FacebookAdsApi.init(
            this.configService.get('facebook.access_token'),
            this.configService.get('facebook.app_id'),
            this.configService.get('facebook.app_secret'),
        );
        this.fbAdsAccount = new AdAccount(this.configService.get('facebook.ads_account_id'));
    }

    async getTiktokCampaigns() {
        const baseUrl = 'https://business-api.tiktok.com/open_api/v1.3/campaign/get/'
        const config = {
            headers: { 'Access-Token': this.configService.get('tiktok.access_token') },
            params: {advertiser_id: this.configService.get('tiktok.ads_id'), fields: [], filtering: {}}
        }
        const res = await firstValueFrom(this.http.get(baseUrl, config))
        if (res && res.data) {
            await this.baseDataService.pushDataToWarehouse(res.data)
        }
    }

    async getTiktokAdsGroups() {
        const baseUrl = 'https://business-api.tiktok.com/open_api/v1.3/adgroup/get/'
        const config = {
            headers: { 'Access-Token': this.configService.get('tiktok.access_token') },
            params: { advertiser_id: this.configService.get('tiktok.ads_id'), fields: [], filtering: {} }
        }
        const res = await firstValueFrom(this.http.get(baseUrl, config))
        if (res && res.data) {
            await this.baseDataService.pushDataToWarehouse(res.data)
        }
    }

    async getTiktokAds() {
        const baseUrl = 'https://business-api.tiktok.com/open_api/v1.3/ad/get/'
        const config = {
            headers: { 'Access-Token': this.configService.get('tiktok.access_token') },
            params: { advertiser_id: this.configService.get('tiktok.ads_id'), fields: [], filtering: {} }
        }
        const res = await firstValueFrom(this.http.get(baseUrl, config))
        if (res && res.data) {
            await this.baseDataService.pushDataToWarehouse(res.data)
        }
    }

    async getFbCampaigns() {
        // const fields = ['name', 'objective', 'status']
        const fields = []
        const params = { 'effective_status': ['ACTIVE', 'PAUSED'], };
        let campaigns = await this.fbAdsAccount.getCampaigns(fields, params, { limit: 20 });
        campaigns.forEach(c => console.log(c.name));
        while (campaigns.hasNext()) {
            //hasNext = true when this campaign has any Adset
            campaigns = await campaigns.next();
            campaigns.forEach(c => console.log(c.name));
        }
        await this.baseDataService.pushDataToWarehouse(campaigns)
    }

    // async getFbAdSet() {
    //     const fields = [
    //     ];
    //     const params = {
    //       'name' : 'My First AdSet',
    //       'lifetime_budget' : '20000',
    //       'start_time' : '2023-04-24T09:24:18-0700',
    //       'end_time' : '2023-05-01T09:24:18-0700',
    //       'campaign_id' : '<adCampaignLinkClicksID>',
    //       'bid_amount' : '500',
    //       'billing_event' : 'IMPRESSIONS',
    //       'optimization_goal' : 'POST_ENGAGEMENT',
    //       'targeting' : {'age_min':20,'age_max':24,'behaviors':[{'id':6002714895372,'name':'All travelers'}],'genders':[1],'geo_locations':{'countries':['US'],'regions':[{'key':'4081'}],'cities':[{'key':'777934','radius':10,'distance_unit':'mile'}]},'interests':[{'id':'<adsInterestID>','name':'<adsInterestName>'}],'life_events':[{'id':6002714398172,'name':'Newlywed (1 year)'}],'facebook_positions':['feed'],'publisher_platforms':['facebook','audience_network']},
    //       'status' : 'PAUSED',
    //     };
    // }

    async getGoogleListCustomers() {
        const refreshToken = this.configService.get('google.refresh_token');
        const customers = await this.ggClient.listAccessibleCustomers(refreshToken);
        return customers;
    }

    async retriveGoogleCampaignWithMetrics() {
        const customer = this.ggClient.Customer({
            customer_id: this.configService.get('google.login_customer_id'),
            refresh_token: this.configService.get('google.refresh_token'),
        })
        const campaigns = await customer.report({
            entity: "campaign",
            attributes: [
                "campaign.id",
                "campaign.name",
                "campaign.bidding_strategy_type",
                "campaign_budget.amount_micros",
            ],
            metrics: [
                "metrics.cost_micros",
                "metrics.clicks",
                "metrics.impressions",
                "metrics.all_conversions",
            ],
            constraints: {
                "campaign.status": enums.CampaignStatus.ENABLED,
            },
            limit: 20,
        })
        await this.baseDataService.pushDataToWarehouse(campaigns)
    }
    async retriveGoogleAdGroupMetricsByDate() {
        const customer = this.ggClient.Customer({
            customer_id: this.configService.get('google.login_customer_id'),
            refresh_token: this.configService.get('google.refresh_token'),
        })
        const campaigns = await customer.report({
            entity: "ad_group",
            metrics: [
                "metrics.cost_micros",
                "metrics.clicks",
                "metrics.impressions",
                "metrics.all_conversions",
            ],
            segments: ["segments.date"],
            from_date: "2021-01-01",
            to_date: "2021-02-01",
        })
        await this.baseDataService.pushDataToWarehouse(campaigns)
    }
}