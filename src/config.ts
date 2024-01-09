export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: process.env.MONGOOSE_URL || '',

  telegram_bot_token: process.env.TELEGRAM_0XANON_BOT_TOKEN || '',
  telegram_bot_name: process.env.TELEGRAM_0XANON_BOT_NAME || '',
  lark: {
    app_id: process.env.APP_ID || '',
    app_secret: process.env.APP_SECRET || '',
    topup_token: process.env.TOPUP_APP_TOKEN || '',
    topup_table: process.env.TOPUP_TABLEID || '',
    withdraw_token: process.env.WITHDRAW_APP_TOKEN || '',
    withdraw_table: process.env.WITHDRAW_TABLEID || '',
    user_token: process.env.USER_APP_TOKEN || '',
    user_table: process.env.USER_APP_TOKEN || ''
  },
  google: {
    dev_token: process.env.GG_DEVELOP_TOKEN || '',
    client_id: process.env.GG_CLIENT_ID || '',
    client_secret: process.env.GG_CLIENT_SECRET || '',
    refresh_token: process.env.GG_REFRESH_TOKEN || '',
    login_customer_id: process.env.GG_LOGIN_CUSTOMER_ID|| '',
    linked_customer_id: process.env.GG_LINKED_CUSTOMER_ID || '',
    user_agent: process.env.GG_USER_AGENT || ''
  },
  facebook: {
    access_token: process.env.FB_ACCESS_TOKEN || '',
    ads_account_id: process.env.FB_ADS_ACCOUNT_ID || '',
    app_id: process.env.FB_APP_ID || '',
    app_secret: process.env.FB_APP_SECRET || ''
  },

  tiktok: {
    access_token: process.env.TIKTOK_ACESS_TOKEN || '',
    ads_id: process.env.TIKTOK_ADS_ID || ''
  }

  });