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

const validateGame = data => {
    const schema = Joi.object({
        name: Joi.string().min(1).required(),
        stockTotal: Joi.number().min(1).required(),
        pricePerDay: Joi.number().min(1).required(),
    }).unknown();
    return schema.validate(data).error;
}

server.get("/categories", (req, res) => {
    connection.query(`SELECT * FROM categories;`).then(categories => {
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
        connection.query('INSERT INTO categories (name) VALUES ($1);', [newCategory.name]).then(result => {
            return res.sendStatus(201);
        });
    });
});

server.get("/games", (req, res) => {
    connection.query('SELECT * FROM games;').then(games => {
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
    connection.query('SELECT * FROM categories').then(categories => {
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