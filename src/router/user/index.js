const express = require('express');
const Router = express.Router();
const CheckAuth = require('../auth/checkAuth');
const UserModel = require('./model');

const getRandom = () => {
    return Math.floor(Math.random() * (99 - 1)) + 1;
}

Router.get('/getStatistics', CheckAuth, async (req, res, next) => {
    // const user = await UserModel.get(req);
    console.log('Get Statistics by user: ' + req.session.uId);
    res.status(200)
        .send({
            statistics: {
                pieChartData: {'Обстежено': getRandom(), 'Записано на обстеження': getRandom()},
                lineChartData: [
                    {
                        name: 'Кількість пацієнтів',
                        data: {
                            '2018-11-01': getRandom(),
                            '2018-11-02': getRandom(),
                            '2018-11-03': getRandom(),
                            '2018-11-04': getRandom(),
                            '2018-11-05': getRandom(),
                            '2018-11-06': getRandom(),
                        },
                    },
                ]
            },
        });
});

Router.get('/patients', CheckAuth, async (req, res, next) => {
    UserModel.get(req, {filterByEvents: true}).then((users) => {
        res.send(users);
    }).catch((err) => {
        return res.status(err.status || 500).send({type: 'error', message: err.message});
    });
});

Router.get('/:_id', async (req, res, next) => {
    UserModel.getById(req.params._id).then((users) => {
        res.send(users);
    }).catch((err) => {
        return res.status(err.status || 500).send({type: 'error', message: err.message});
    });
});

Router.get('/', async (req, res, next) => {
    UserModel.get(req).then((users) => {
        res.send(users);
    }).catch((err) => {
        return res.status(err.status || 500).send({type: 'error', message: err.message});
    });
});

Router.post('/', CheckAuth, async (req, res, next) => {
    const { body } = req;
    UserModel.createNewPatient(body.newPatient).then((users) => {
        res.send(users);
    }).catch((err) => {
        return res.status(err.status || 500).send({type: 'error', message: err.message});
    });
});



module.exports = Router;
