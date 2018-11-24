const express = require('express');
const Router = express.Router();
const _ = require('lodash');
const CheckAuth = require('../auth/checkAuth');
const UserModel = require('./model');
const EventModel = require('../event/model');
const { EVENT_STATUS } = require('../../const');

const getRandom = () => {
    return Math.floor(Math.random() * (99 - 1)) + 1;
}

Router.get('/getStatistics', CheckAuth, async (req, res, next) => {
    // const user = await UserModel.get(req);
    console.log('Get Statistics by user: ' + req.session.uId);

    const currenUser = await UserModel.getById(req.session.uId);

    const statistics = {};

    if (currenUser.admin) {
        EventModel.groupForStatisticsByDoctor(req).then((doctors) => {
            const countsByDoctor = doctors.map(data => {
                const title = data.doctor;
                const resData = {};
                resData[title] = data.count;
                return resData;
            });

            statistics.barChartData = [
                {
                    name: 'Кількість пацієнтів',
                    data: Object.assign({}, ...countsByDoctor),
                }
            ];

            statistics.pieChartData = Object.assign({},
                ...countsByDoctor.filter((el, index) => index < 5)
            );

            return res.status(200).send({
                statistics,
            })
        }).catch((err) => {
            return res.status(err.status || 500).send({type: 'error', message: err.message});
        });

    } else {
        UserModel.getPatients(req, { forStatistics: true }).then((users) => {
            const { withEvents, withoutEvents, groupByDate } = users;

            let PlannedEvents = [];
            let DoneEvents = [];
            let RejectedEvents = [];

            withEvents.forEach(user => {
                user.events.forEach(event => PlannedEvents.push(_.isEqual(event.status, EVENT_STATUS.PLANNED)));
                user.events.forEach(event => DoneEvents.push(_.isEqual(event.status, EVENT_STATUS.PASSED)));
                user.events.forEach(event => RejectedEvents.push(_.isEqual(event.status, EVENT_STATUS.REJECTED)));
            });

            PlannedEvents = PlannedEvents.filter(v => !!v);
            DoneEvents = DoneEvents.filter(v => !!v);
            RejectedEvents = RejectedEvents.filter(v => !!v);

            statistics.pieChartData = {
                'Мої пацієнти': withEvents.length,
                'Не записані на обстеження': withoutEvents.length,
                'Заплановані обстеження': PlannedEvents.length,
                'Завершені обстеження': DoneEvents.length,
                'Відхилені обстеження': RejectedEvents.length,
            };

            statistics.lineChartData = [
                {
                    name: 'Кількість пацієнтів',
                    data: Object.assign({}, ...groupByDate.map(data => {
                        const date = `${data._id.year}-${data._id.month}-${data._id.date}`;
                        const resData = {};
                        resData[date] = data.count;
                        return resData;
                    }))
                },
            ];

            return res.status(200).send({
                statistics,
            })

        }).catch((err) => {
            return res.status(err.status || 500).send({type: 'error', message: err.message});
        });
    }
});

Router.get('/patients', CheckAuth, async (req, res, next) => {
    UserModel.getPatients(req, { filterByEvents: true }).then((users) => {
        res.send(users);
    }).catch((err) => {
        return res.status(err.status || 500).send({type: 'error', message: err.message});
    });
});

Router.get('/:_id', CheckAuth, async (req, res, next) => {
    const { params: { _id } } = req;

    const existUser = await UserModel.getById(req.session.uId);

    if (existUser.admin) {
        // return res.status(401).send({type: 'error', message: "Переглянути дані про пацієнтів не можливо. Доступно тільки для адміністраторів!"});
        UserModel.getUserWithEvents(_id).then((user) => {
            res.send(user);
        }).catch((err) => {
            return res.status(err.status || 500).send({type: 'error', message: err.message});
        });
    } else {
        UserModel.getUserWithEvents(_id, req.session.uId).then((user) => {
            res.send(user);
        }).catch((err) => {
            return res.status(err.status || 500).send({type: 'error', message: err.message});
        });
    }


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
    console.log("create New");
    if (body.newPatient) {
        UserModel.createNewPatient(body.newPatient).then((patient) => {
            res.send(patient);
        }).catch((err) => {
            return res.status(err.status || 500).send({type: 'error', message: err.message});
        });
    } else if (body.newDoctor) {
        UserModel.createNewDoctor(body.newDoctor).then((doctor) => {
            res.send(doctor);
        }).catch((err) => {
            return res.status(err.status || 500).send({type: 'error', message: err.message});
        });
    } else {
        return res.status(400).send({type: 'error', message: "Need a valid data"});
    }
});



module.exports = Router;
