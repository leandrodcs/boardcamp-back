import express from 'express';
import cors from 'cors';
import pg from 'pg';
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

server.get("/categories", (req, res) => {
    connection.query('SELECT * FROM categories').then(categories => {
        res.send(categories.rows);
    });
});

server.post("/categories", (req, res) => {
    const newCategory = req.body;

    if(validateCategory(newCategory)) {
        return res.sendStatus(400);
    }
    connection.query('SELECT * FROM categories').then(categories => {
        const alreadyExists = categories.rows.find(c => c.name === newCategory.name);
        if(alreadyExists) {
            return res.sendStatus(409);
        }
    });
    connection.query('INSERT INTO categories (name) VALUES ($1)', [newCategory.name]).then(result => {
        res.sendStatus(201);
    });
});

server.listen(4000);