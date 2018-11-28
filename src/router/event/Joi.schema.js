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
const contact = Joi.string();
const avatar = Joi.string();
const comment = Joi.string();

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
        comment: comment.required(),
    },
    personalKey: Joi.string().required(),
    newPatient: Joi.object().keys({
        email: email.required(),
        name: name.required(),
        surname: surname.required(),
        patronymic: patronymic.required(),
        contact: contact.required(),
        birthdate: birthdate.required(),
        avatar: avatar.allow([null, '']),
        city: city.required(),
        street: street.required(),
        house: house.required(),
        apartment: apartment.required(),
        passportSeries: passportSeries.required(),
        passportNumber: passportNumber.required(),
        avatar: avatar.allow([null, '']),
    }),
};
