const Joi = require('joi');
const { OBJECT_ID_REGEX, EVENT_STATUS } = require('../../const');

const currentDate = new Date();

const email = Joi.string().email({ minDomainAtoms: 2 }).required();
const name = Joi.string().alphanum().min(3).max(30).required();
const surname = Joi.string().alphanum().min(3).max(30).required();
const patronymic = Joi.string().alphanum().min(3).max(30).required();
const birthdate = Joi.date().required();
const city = Joi.string().required();
const street = Joi.string().required();
const house = Joi.number().required();
const apartment = Joi.number();
const passportSeries = Joi.string().max(4).required();
const passportNumber = Joi.number().required();
const personalKey = Joi.string().required();

const status = Joi.string().valid(Object.values(EVENT_STATUS));

module.exports = {
    createEvent: Joi.object().keys({
        date: Joi.date().required(),
        doctor: Joi.string().regex(OBJECT_ID_REGEX).required(),
        status: status.default(EVENT_STATUS.PLANNED),
        specialization: Joi.string().regex(OBJECT_ID_REGEX).required(),
        time: Joi.string().required(),
    }),
    updateEventStatus: {
        _id: Joi.string().regex(OBJECT_ID_REGEX).required(),
        status: status.required(),
    },
    personalKey: Joi.string().required(),
    newPatient: Joi.object().keys({
        email,
        name,
        surname,
        patronymic,
        birthdate,
        city,
        street,
        house,
        apartment,
        passportSeries,
        passportNumber,
    }),
};
