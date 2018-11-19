const config = {
    DB_URI: process.env.DB_URI,
    PORT: process.env.PORT || 3000,
    SMS_ACCOUNT_SID: process.env.SMS_ACCOUNT_SID,
    SMS_AUTH_TOKEN: process.env.SMS_AUTH_TOKEN,
    SMS_NUMBER: process.env.SMS_NUMBER,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
};

module.exports = config;
