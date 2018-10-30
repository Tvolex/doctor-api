const express = require('express');
const ObjectID = require('mongodb').ObjectID;
const Router = express.Router();
const UserModel = require('./model');

Router.post('/login', async (req, res, next) => {
    const {
        body,
        session,
        sessionID
    } = req;

    const { email, password } = body;

    let user;

    try {
         user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(400)
                .send({
                    type: 'error',
                    message: "Incorrect email"
                })
        }

        if (user.password !== password) {
            return res.status(400)
                .send({
                    type: 'error',
                    message: "Incorrect password"
                })
        }

        await UserModel.updateUserSession({ _id: user._id, session: sessionID });

        session.loggedIn = true;
        session.uId = user._id;
        session.id = sessionID;

        console.log(`User ${user._id} logged in`);

    } catch (err) {
        err.status = 500;
        console.log(err);
        throw err;
    }

    delete user.password;
    delete user.session;

    return res.status(200)
        .send({
            data: user
        })
});

Router.get('/auth', async (req, res, next) => {
    const {
        loggedIn,
        uId,
        id
    } = req.session;

    if (!loggedIn || !uId) {
        return res.status(401)
            .send({
                type: 'error',
                message: "Not authorized"
            })
    }

    let user;
    try {
        user = await UserModel.getById(uId);
    } catch (ex) {
        return res.status(500)
            .send({
                message: "Error UserModel.getById"
            })
    }

    delete user.password;
    return res.status(200)
        .send({
            data: user
        })

});

Router.get('/logout', async (req, res, next) => {
    if (req.session && req.session.loggedIn && req.session.id) {
        console.log(`User ${req.session.uId} logged out`);

        req.session.destroy();
    }

    return res.status(200)
        .send({
            type: 'info',
            message: 'ok',
        })
});



module.exports = Router;
