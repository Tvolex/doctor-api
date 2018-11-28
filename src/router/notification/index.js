const { SMS_ACCOUNT_SID, SMS_AUTH_TOKEN, SMS_NUMBER, SENDGRID_API_KEY } = require('../../../config');
const twilio_module = require('twilio');
const SendGrid = require('@sendgrid/mail');

const Twilio = new twilio_module(SMS_ACCOUNT_SID, SMS_AUTH_TOKEN);
SendGrid.setApiKey(SENDGRID_API_KEY);

module.exports = {
    sendSMS: async (to, message) => {
        Twilio.messages.create(
            {
                to: to,
                from: SMS_NUMBER,
                body: message,
            },
        ).then((message) => {
            console.log(`Send sms to: ${to}`)
        }).catch((err) => {
            console.log(err);
        });
    },
    sendEmail: (to, message) => {
        const msg = {
            to,
            from: 'no-reply@doctor.dns-cloud.net',
            subject: 'Doctor CMS',
            text: 'test',
            html: message,
        };
        SendGrid.send(msg).then((sent) => {
            console.log(`Send email to: ${to}`)
        }).catch((err) => {
            console.log(err);
        });
    }
};