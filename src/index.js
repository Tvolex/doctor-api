const express = require ('express');
const bodyParser = require ('body-parser');
const cookieParser = require ('cookie-parser');
const cors = require('cors');
const http = require("http");
const _ = require('lodash');
const cron = require('node-cron');
const EventModel = require('./router/event/model');
const Notificator = require('./router/notification');
const moment = require('moment');
const app = express();
const session = require ('express-session');
const { EVENT_STATUS } = require('./const');
const router = require('./router');
const config = require('../config');
const { init, initCollections } = require('./db');

app.use(bodyParser.json({
    strict: false,
}));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser('Kvb6swFdB&m66sk4aSB9pSKm'));
app.use(session({
    secret: 'Kvb6swFdB&m66sk4aSB9pSKm',
    resave: true,
    saveUninitialized: true
}));
app.use(cors());

app.all((req, res, next) => {
    console.log(req.sessionID);

    next();
});

app.use('/api', router);

app.get('/ping', (req, res) => res.status(200).send('pong'));

cron.schedule('* 11 * * *', function () {
    const currentDate = moment();
    currentDate.utcOffset(config.TZ);

    EventModel.getEventsByStatusAndTime([EVENT_STATUS.PLANNED], {
        fromDate: currentDate.startOf('day').format("YYYY-MM-DD:HH-mm"),
        toDate: currentDate.endOf('day').format("YYYY-MM-DD:HH-mm"),
        doctor: null,
    }).then(events => {

        console.log(`current date: ${currentDate.format()}`);

        const year = currentDate.get('year');
        const month = currentDate.get('month');
        const date = currentDate.get('date');
        const hour = currentDate.get('hour');

        events.filter(event => {
            const eventFullDate = moment(event.fullDate, "YYYY-MM-DD:HH-mm");

            if (_.isEqual(event.year, year) &&
                _.isEqual(event.month, month) &&
                _.isEqual(event.date, date)
            ) {
                console.log("Sent remind");
                Notificator.sendEmail(event.patient.email, `Нагадування. Ваш сеанс на: ${event.time}. Кабiнет: ${event.doctor.cabinet}. До зустрiчi!`);
                Notificator.sendSMS(event.patient.contact, `Нагадування. Ваш сеанс на: ${event.time}. Кабiнет: ${event.doctor.cabinet}. До зустрiчi!`);
            }
        })
    }).catch(err => console.log(err));
});

// Error handler
process.on('unhandledRejection', (reason) => {
    console.log(reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.log(error);
    process.exit(1);
});

app.use((req, res, next) => {
    res.status(404)
        .send('<h1 align="center">Not Found 404</h1>')
});

setInterval(function() {
    http.get("http://api-doctor.herokuapp.com/ping");
}, 1200000);

(async function () {
    const db = await init();
    await initCollections();

    app.listen(config.PORT, () => {
        console.log('Server start on port ' + config.PORT);
    });
}());

