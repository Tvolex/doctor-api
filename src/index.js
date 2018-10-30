const express = require ('express');
const bodyParser = require ('body-parser');
const session = require ('express-session');
const cookieParser = require ('cookie-parser');
const cors = require('cors');
const path = require ('path');
const app = express();
const router = require('./router');
const config = require('../config');
const { init, initCollections } = require('./db');


app.use(cookieParser());
app.use(bodyParser.json());
app.use(session({
    secret: ',Kvb6s<wh(yB#&m66sk4@a+SB9pSKm-',
    resave: true,
    saveUninitialized: true
}));
app.use(cors());

app.get(['/'], (req, res) => {
    res.send({
        status: "ok",
    })
});

app.use(router);

// Error handler
process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
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

