import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dayjs from 'dayjs';
import Joi from 'joi';

const server = express();
server.use(cors());
server.use(express.json());

const { Pool } = pg;

const connection = new Pool({
    user: 'bootcamp_role',
    password: 'senha_super_hiper_ultra_secreta_do_role_do_bootcamp',
    host: 'localhost',
    port: 5432,
    database: 'boardcamp',
});

const validateCategory = data => {
    const schema = Joi.object({
        name: Joi.string().min(1).required()
    }).unknown();
    return schema.validate(data).error;
}

const validateGame = data => {
    const schema = Joi.object({
        name: Joi.string().min(1).required(),
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

server.get(`/customers`, (req, res) => {
    connection.query(`SELECT * FROM customers;`).then(customers => {
        if(req.query.cpf) {
            return res.send(customers.rows.filter(row => row.cpf.startsWith(req.query.cpf)));
        }
        return res.send(customers.rows);
    });
});

server.get(`/customers/:id`, (req, res) => {
    const id = parseInt(req.params.id);

    connection.query(`SELECT * FROM customers WHERE id = $1;`, [id]).then(costumers => {
        if(!costumers.rows.length) {
            return res.sendStatus(404);
        }
        return res.send(costumers.rows[0]);
    });
});

server.put(`/customers/:id`, (req, res) => {
    const id = parseInt(req.params.id);
    const updatedCustomer = req.body;

    if(validateCustomer(updatedCustomer)) {
        return res.sendStatus(400);
    }
    connection.query('SELECT * FROM customers;').then(customers => {
        const alreadyExists = customers.rows.find(c => c.cpf === updatedCustomer.cpf);
        if(!alreadyExists) {
            return res.sendStatus(404);
        }
        connection.query(`UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5;`,
        [updatedCustomer.name, updatedCustomer.phone, updatedCustomer.cpf, updatedCustomer.birthday, id])
        .then(result => {
            return res.sendStatus(200);
        });
    });
});

server.post(`/customers`, (req, res) => {
    const newCustomer = req.body;

    if(validateCustomer(newCustomer)) {
        return res.sendStatus(400);
    }
    connection.query('SELECT * FROM customers;').then(customers => {
        const alreadyExists = customers.rows.find(c => c.cpf === newCustomer.cpf);
        if(alreadyExists) {
            return res.sendStatus(409);
        }
        connection.query(`INSERT INTO customers (name,phone,cpf,birthday) VALUES ($1,$2,$3,$4);`,
        [newCustomer.name, newCustomer.phone, newCustomer.cpf, newCustomer.birthday])
        .then(result => {
            return res.sendStatus(201);
        });
    });
});

server.get(`/categories`, (req, res) => {
    connection.query(`SELECT * FROM categories;`).then(categories => {
        res.send(categories.rows);
    });
});

server.post(`/categories`, (req, res) => {
    const newCategory = req.body;

    if(validateCategory(newCategory)) {
        return res.sendStatus(400);
    }
    connection.query(`SELECT * FROM categories;`).then(categories => {
        const alreadyExists = categories.rows.find(c => c.name === newCategory.name);
        if(alreadyExists) {
            return res.sendStatus(409);
        }
        connection.query(`INSERT INTO categories (name) VALUES ($1);`, [newCategory.name]).then(result => {
            return res.sendStatus(201);
        });
    });
});

server.get("/games", (req, res) => {
    connection.query(`SELECT * FROM games;`).then(games => {
        if(req.query.name) {
            return res.send(games.rows.filter(row => row.name.startsWith(req.query.name)));
        }
        return res.send(games.rows);
    });
});

server.post("/games", (req, res) => {
    const newGame = req.body;

    if(validateGame(newGame)) {
        return res.sendStatus(400);
    }
    connection.query(`SELECT * FROM categories;`).then(categories => {
        const gameCategory = categories.rows.find(c => c.id === newGame.categoryId);
        if(!gameCategory) {
            return res.sendStatus(400);
        }
        connection.query('SELECT * FROM games').then(games => {
            const alreadyExists = games.rows.find(g => g.name === newGame.name);
            if(alreadyExists) {
                return res.sendStatus(409);
            }
            connection.query(`INSERT INTO games (name,image,"stockTotal","categoryId","pricePerDay") VALUES ($1, $2, $3, $4, $5);`, 
            [newGame.name, newGame.image, newGame.stockTotal, newGame.categoryId, newGame.pricePerDay])
            .then(result => {
                return res.sendStatus(201);
            });
        });
    });
});

server.listen(4000);