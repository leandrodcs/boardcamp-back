import dayjs from 'dayjs';
import Joi from 'joi';

const validateCategory = data => {
    const schema = Joi.object({
        name: Joi.string().min(1).required()
    }).unknown();
    return schema.validate(data).error;
}

const validateRental = data => {
    const schema = Joi.object({
        customerId: Joi.number().required(),
        gameId: Joi.number().required(),
        daysRented: Joi.number().min(1).required(),

    }).unknown();
    return schema.validate(data).error;
}

const validateGame = data => {
    const schema = Joi.object({
        name: Joi.string().min(1).required(),
        image: Joi.string().regex(/(https?:\/\/.*\.(?:png|jpg))/i).required(),
        stockTotal: Joi.number().min(1).required(),
        pricePerDay: Joi.number().min(1).required(),
    }).unknown();
    return schema.validate(data).error;
}

const validateCustomer = data => {
    const schema = Joi.object({
        name: Joi.string().min(1).required(),
        phone: Joi.string().min(10).max(11).required(),
        cpf: Joi.string().min(11).max(11).required(),
        birthday: Joi.date().iso().max(dayjs().format(`YYYY-MM-DD`)).required()
    }).unknown();
    return schema.validate(data).error;
}



export {
    validateCategory,
    validateRental,
    validateGame,
    validateCustomer,
}