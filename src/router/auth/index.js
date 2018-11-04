const Token = require('rand-token');
const _ = require('lodash');
const express = require('express');
const ObjectID = require('mongodb').ObjectID;
const Router = express.Router();
const AuthModel = require('./model');
const UserModel = require('../user/model');

Router.post('/login', async (req, res, next) => {
    const {
        body,
    } = req;

    const { email, password } = body;

    let user;

    try {
         user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(400)
                .send({
                    type: 'error',
                    message: "Неправильний E-mail"
                })
        }

        if (user.password !== password) {
            return res.status(400)
                .send({
                    type: 'error',
                    message: "Неправильний пароль"
                })
        }

        console.log(`Login session: ${req.sessionID}`);

        const session = {
            uId: user._id,
      //      id: Token.generate(16),
            id: req.sessionID,
        };

        req.session.uId = user._id;
        req.session.id = req.sessionID;


        // req.session = session;

        await AuthModel.updateUserSession({ _id: user._id, session: session.id });

        console.log(`User ${user._id} logged in`);

    } catch (err) {
        err.status = 500;
        console.log(err);
        throw err;
    }

    delete user.password;
    delete user.session;

    return res.status(200)
        .send(user);
});

Router.get('/check', async (req, res, next) => {
    const {
        session: {
            uId,
            id
        } = {},
    } = req;

    console.log(`Auth session: ${req.sessionID}`);

    if (_.isEmpty(req.session) || !id || !uId) {
        return res.status(401)
            .send({
                type: 'error',
                message: "Не авторизовано!"
            })
    }

    let user;
    try {
        user = await UserModel.getById(uId);
    } catch (ex) {
        return res.status(500)
            .send({
                type: 'error',
                message: "Error UserModel.getById"
            })
    }

    delete user.password;
    delete user.session;

    return res.status(200)
        .send(user)

});

Router.get('/logout', async (req, res, next) => {
    const {
        session: {
            uId,
            id
        } = {},
    } = req;

    console.log(`Logout session: ${req.sessionID}`);

    if (!_.isEmpty(req.session) && uId) {
        console.log(`User ${req.session.uId} logged out`);
    }

    req.session.destroy();

    return res.status(200)
        .send({
            type: 'info',
            message: 'ok',
        })
});



module.exports = Router;
