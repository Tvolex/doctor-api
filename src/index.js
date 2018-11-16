const express = require ('express');
const bodyParser = require ('body-parser');
const cookieParser = require ('cookie-parser');
const cors = require('cors');
const path = require ('path');
const app = express();
const session = require ('express-session');
const router = require('./router');
const config = require('../config');
const { init, initCollections } = require('./db');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
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

