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
// app.get('/search', (req, res) => res.render('pages/search'));
app.get('/search', async(req, res) => {

    try {
        // No query sent, just returning search page with no results
        var search_val = req.query.search_val;
        if (search_val == '') {
            var search_query = `SELECT * FROM tokis`; 
            const client = await pool.connect();
            var results = await client.query(search_query);
            results = max_attr(results);
            
            res.render('pages/search', results);
            client.release();
        }
        else if (search_val == null) {
            res.render('pages/search');
        }
        else {
            var search_query = `SELECT * FROM tokis WHERE name LIKE '%${search_val}%'`;
            const client = await pool.connect();
            const results = await client.query(search_query);
            res.render('pages/search', results);
            client.release();
        }

    }
    catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});
app.get('/query', async(req, res) => {
    console.log(req.query.searchValue);
    res.render('pages/search');
});
app.post('/add', async(req, res) => {
    try {
        var total = sum_levels(req.body);
        console.log(req.body);
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

        const client = await pool.connect();
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

function max_attr(results) {

    var types = ['fly', 'fight','fire', 'water', 'electric', 'ice'];
    var colors = {
        'fly': 'grey',
        'fight': 'red',
        'fire': 'orange',
        'water': 'teal',
        'electric': 'yellow',
        'ice': 'cyan'
    };
    var max = -1;
    results.rows.forEach(row => {
        types.forEach(col => {
            if (row[col] > max) {
                max = row[col];
                attr_max = col;
            }
        });
        max = -1;
        row.color = colors[attr_max];
        console.log(attr_max)
    });
    return results;
}