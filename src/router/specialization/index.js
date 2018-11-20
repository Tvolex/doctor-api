const express = require('express');
const Router = express.Router();
const CheckAuth = require('../auth/checkAuth');
const SpecializationModel = require('./model');

Router.get('/', async (req, res, next) => {
    SpecializationModel.get()
        .then(
            specializations => res.status(200).send(specializations))
        .catch(
            err => res.status(err.status || 500).send({type: 'error', message: err.message}));
});

Router.get('/:id', async (req, res, next) => {
    SpecializationModel.getOneById(req.params.id)
        .then(data => res.status(200).send(data))
        .catch(err => res.status(err.status || 500).send({type: 'error', message: err.message}));
});

Router.post('/', CheckAuth, async (req, res, next) => {
    SpecializationModel.add(req.body.name)
        .then(
            result => res.status(200).send({
                created: result ? result: false
            }))
        .catch(
            err => res.status(err.status || 500).send({type: 'error', message: err.message}));
});



module.exports = Router;
