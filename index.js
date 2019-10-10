const cool = require('cool-ascii-faces');
const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
var app = express();

const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => res.render('pages/index'));
app.get('/create', (req, res) => res.render('pages/create'));
app.post('/add', async(req, res) => {
    try {
        var total = sum_levels(req.body);
        console.log('this is the total');
        console.log(total);
        var insert_query = `INSERT INTO tokis (
            name, height, weight, fly, fight, fire, 
            water, electric, ice, total, trainer_name)
            VALUES ('${req.body.name}', ${req.body.height}, 
            ${req.body.weight},
            ${req.body.fly},
            ${req.body.fight},
            ${req.body.fire},
            ${req.body.water},
            ${req.body.electric},
            ${req.body.ice},
            ${total},
            '${req.body.trainer_name}'
            )`;

        const client = await pool.connect()
        const result = await client.query(insert_query);
        req.body.total = total;
        res.render('pages/insert-success', req.body);
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});
app.get('/cool', (req, res) => res.send(cool()));
app.get('/times', (req, res) => res.send(showTimes()));
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));


showTimes = () => {
    let result = ''
    const times = process.env.TIMES || 5
    for (i = 0; i < times; i++) {
        result += i + ' '
    }
    return result;
}

function sum_levels(body) {
    var types = ['fly', 'fight','fire', 'water', 'electric', 'ice'];
    var sum = 0;
    types.forEach(element => {
        sum += parseFloat(body[element]);
    });
    return sum;
}