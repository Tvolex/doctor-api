const Joi = require('joi');
const { OBJECT_ID_REGEX, EVENT_STATUS } = require('../../const');

const currentDate = new Date();

const email = Joi.string().email({ minDomainAtoms: 2 });
const password = Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/);
const name = Joi.string().regex(/[a-zA-Zа-яёА-ЯЁ]/u).min(3).max(30);
const surname = Joi.string().regex(/[a-zA-Zа-яёА-ЯЁ]/u).min(3).max(30);
const patronymic = Joi.string().regex(/[a-zA-Zа-яёА-ЯЁ]/u).min(3).max(30);
const birthdate = Joi.date();
const city = Joi.string().regex(/[a-zA-Zа-яёА-ЯЁ]/u);
const street = Joi.string().regex(/[a-zA-Zа-яёА-ЯЁ]/u);
const house = Joi.number();
const apartment = Joi.number().allow(null);
const passportSeries = Joi.string().max(3);
const avatar = Joi.string();
const cabinet = Joi.number();
const passportNumber = Joi.number();
const type = Joi.string().valid(['doctor', 'patient']);
const personalKey = Joi.string().min(32).max(32);

const contact = Joi.string();
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
        apartment,
        passportSeries: passportSeries.required(),
        passportNumber: passportNumber.required(),
        avatar: avatar.allow([null, '']),
    }),
};
