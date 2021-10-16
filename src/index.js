import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { validateCategory, validateRental, validateGame, validateCustomer } from './validations.js';

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

server.get(`/rentals`, async (req, res) => {
    try{
        const rentals = await connection.query(`
        SELECT 
            rentals.*,
            jsonb_build_object('name', customers.name, 'id', customers.id) AS customer,
            jsonb_build_object('id', games.id, 'name', games.name, 'categoryId', games."categoryId", 'categoryName', categories.name) AS game
        FROM games 
        JOIN rentals ON games.id = rentals."gameId" 
        JOIN customers ON rentals."customerId" = customers.id
        JOIN categories ON games."categoryId" = categories.id
        ;`);
        res.send(rentals.rows);
    } catch {
        res.sendStatus(500);
    }
});

server.post(`/rentals`, async (req, res) => {
    try {
        const newRental = req.body;
        const {customerId, gameId, daysRented} = req.body;
        const customers = await connection.query(`SELECT * FROM customers WHERE id = $1;`, [customerId]);
        const games = await connection.query(`SELECT * FROM games WHERE id = $1;`, [gameId]);
        if (!games.rows.length || !customers.rows.length || validateRental(newRental)) {
            return res.sendStatus(400);
        }
        const gameBeingRented = games.rows[0];
        const rentals = await connection.query(`SELECT * FROM rentals WHERE "gameId" = $1;`, [gameId]);
        const isThereStockAvailable = gameBeingRented.stockTotal >= rentals.rows.length;
        if(!isThereStockAvailable) {
            return res.sendStatus(400);
        }
        await connection.query(`INSERT INTO rentals ("customerId","gameId","rentDate","daysRented","returnDate","originalPrice","delayFee") VALUES ($1,$2,$3,$4,$5,$6,$7);`,
        [customerId, gameId, new Date().toLocaleDateString("pt-Br"), daysRented,null,daysRented*gameBeingRented.pricePerDay,null]);
        res.sendStatus(201);
    } catch {
        res.sendStatus(500);
    }
});

server.get(`/customers`, async (req, res) => {
    try {
        const customers = await  connection.query(`SELECT * FROM customers;`);
        if(req.query.cpf) {
            res.send(customers.rows.filter(row => row.cpf.startsWith(req.query.cpf)));
            return;
        }
        res.send(customers.rows);
    } catch {
        res.sendStatus(500);
    }
});

server.get(`/customers/:id`, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const customers = await connection.query(`SELECT * FROM customers WHERE id = $1;`, [id]);
        if(!customers.rows.length) {
            return res.sendStatus(404);
        }
        res.send(customers.rows[0]);
    } catch {
        res.sendStatus(500);
    }
});

server.put(`/customers/:id`, async (req, res) => {
    const updatedCustomer = req.body;
    try {
        if(validateCustomer(updatedCustomer)) {
            return res.sendStatus(400);
        }
        const id = parseInt(req.params.id);
        const {name,phone,cpf,birthday} = updatedCustomer;
        const customers = await connection.query('SELECT * FROM customers;');
        const currentRegister = customers.rows.find(c => c.id === id);
        if(!currentRegister) {
            return res.sendStatus(404);
        }
        if(currentRegister.cpf !== cpf && customers.rows.find(c => c.cpf === cpf)) {
            return res.sendStatus(409);
        }
        await connection.query(`UPDATE customers SET name = $2, phone = $3, cpf = $4, birthday = $5 WHERE id = $1;`,[id, name, phone, cpf, birthday]);
        res.sendStatus(200);
    } catch {
        res.sendStatus(500);
    }
});

server.post(`/customers`, async (req, res) => {
    const newCustomer = req.body;
    try {
        if(validateCustomer(newCustomer)) {
            return res.sendStatus(400);
        }
        const {name,phone,cpf,birthday} = newCustomer;
        const customers = await connection.query('SELECT * FROM customers;');
        const alreadyExists = customers.rows.find(c => c.cpf === cpf);
        if(alreadyExists) {
            return res.sendStatus(409);
        }
        await connection.query(`INSERT INTO customers (name,phone,cpf,birthday) VALUES ($1,$2,$3,$4);`,[name, phone, cpf, birthday]);
        res.sendStatus(201);
    } catch {
        res.sendStatus(500);
    }
});

server.get(`/categories`, async (req, res) => {
    try {
        const categories = await connection.query(`SELECT * FROM categories;`);
        res.send(categories.rows);
    } catch {
        res.sendStatus(500);
    }
    
});

server.post(`/categories`, async (req, res) => {
    const newCategory = req.body;
    try {
        if(validateCategory(newCategory)) {
            return res.sendStatus(400);
        }
        const categories = await connection.query(`SELECT * FROM categories;`);
        const alreadyExists = categories.rows.find(c => c.name === newCategory.name);
        if(alreadyExists) {
            return res.sendStatus(409);
        }
        await connection.query(`INSERT INTO categories (name) VALUES ($1);`, [newCategory.name])
        res.sendStatus(201);
    } catch {
        res.sendStatus(500);
    }
});

server.get("/games", async (req, res) => {
    try {
        const games = await  connection.query(`SELECT games.*, categories.name as "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id;`);
        if(req.query.name) {
            return res.send(games.rows.filter(row => row.name.toLowerCase().startsWith(req.query.name.toLowerCase())));
        }
        res.send(games.rows);
    } catch {
        res.sendStatus(500);
    }
});

server.post("/games", async (req, res) => {
    const newGame = req.body;
    try {
        if(validateGame(newGame)) {
            return res.sendStatus(400);
        }
        const {name, image, stockTotal, categoryId, pricePerDay} = newGame;
        const categories = await connection.query(`SELECT * FROM categories;`);
        const gameCategoryExists = categories.rows.find(c => c.id === categoryId);
        if(!gameCategoryExists) {
            return res.sendStatus(400);
        }
        const games = await connection.query('SELECT * FROM games');
        const alreadyExists = games.rows.find(g => g.name === name);
        if(alreadyExists) {
            return res.sendStatus(409);
        }
        await connection.query(`INSERT INTO games (name,image,"stockTotal","categoryId","pricePerDay") VALUES ($1, $2, $3, $4, $5);`, 
        [name, image, stockTotal, categoryId, pricePerDay]);
        res.sendStatus(201);
    } catch {
        res.sendStatus(500);
    }
});

server.listen(4000);