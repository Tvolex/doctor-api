const express = require ('express');
const bodyParser = require ('body-parser');
const cookieParser = require ('cookie-parser');
const cors = require('cors');
const _ = require('lodash');
const cron = require('node-cron');
const EventModel = require('./router/event/model');
const Notificator = require('./router/notification');
const moment = require('moment');
const path = require ('path');
const app = express();
const session = require ('express-session');
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

cron.schedule('50 * * * * *', function () {
    console.log("CRON");

    EventModel.getAllEvents().then(events => {
        const currentDate = new Date();

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const date = currentDate.getDate();
        const hour = currentDate.getHours();

        events.filter(event => {
            const eventFullTime = moment(event.fullDate, "YYYY-MM-DD:HH-mm");

            if (_.isEqual(event.year, year) &&
                _.isEqual(event.month, month) &&
                _.isEqual(event.date, date) &&
                moment(eventFullTime, "YYYY-MM-DD:HH-mm").isBefore(moment(eventFullTime, "YYYY-MM-DD:HH-mm").set('hour', hour).format(), "hour")
            ) {
                console.log("Sent remind");
                Notificator.sendEmail(event.patient.email, `Нагадування. Ваш сеанс на: ${event.time}. Кабiнет: ${event.doctor.cabinet}. До зустрiчi!`)
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


(async function () {
    const db = await init();
    await initCollections();

    app.listen(config.PORT, () => {
        console.log('Server start on port ' + config.PORT);
    });
}());

