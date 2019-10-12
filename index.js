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
app.get('/search', async(req, res) => {

    try {
        // No query sent, just returning search page with no results
        var search_val = req.query.search_val;
        if (search_val == '') {
            var search_query = `SELECT * FROM tokis`; 
            const client = await pool.connect();
            var results = await client.query(search_query);
            results = max_attr(results);
            console.log(results);
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
        var sprite = cool();

        var insert_query = `INSERT INTO tokis (
            name, sprite, height, weight, fly, fight, fire, 
            water, electric, ice, total, trainer_name)
            VALUES ('${req.body.name}', '${sprite}',
             ${req.body.height}, 
            ${req.body.weight},
            ${req.body.fly},
            ${req.body.fight},
            ${req.body.fire},
            ${req.body.water},
            ${req.body.electric},
            ${req.body.ice},
            ${total},
            '${req.body.trainer_name}'
            ) RETURNING id`;

        const client = await pool.connect();
        const result = await client.query(insert_query);
        req.body.total = total;
        res.redirect('/toki/' + result.rows[0].id );
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});
app.get('/levels/:id', async(req, res) => {
    try {
        var id = req.params.id;
        var view_query = `SELECT fly, fight, fire, water, electric, ice FROM tokis WHERE id=${id}`;
        const client = await pool.connect();
        const result = await client.query(view_query);
        client.release();
        var levels = [];
        for (level in result.rows[0]) {
            levels.push(result.rows[0][level]);
        }

        res.send(levels);
    }
    catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});

app.get('/delete/:id', async(req, res) => {

    try {
        var id = req.params.id;
        var toki_query = `DELETE FROM tokis WHERE id=${id}`;
        const client = await pool.connect();
        const result = await client.query(toki_query);
        res.redirect('/');
        client.release();
    }
    catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});
app.get('/toki/:id', async(req, res) => {

    try {
        var id = req.params.id;
        var view_query = `SELECT * FROM tokis WHERE id=${id}`;
        const client = await pool.connect();
        const result = await client.query(view_query);
        result.rows[0].total = sum_levels(result.rows[0]);
        res.render('pages/view_toki', result.rows[0]);
        client.release();

    }
    catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});

app.get('/edit/:id', async(req, res) => {

    try {
        var id = req.params.id;
        var toki_query = `SELECT *  FROM tokis WHERE id=${id}`;
        const client = await pool.connect();
        const result = await client.query(toki_query);
        res.render('pages/edit-form',result.rows[0]);
        client.release();
    }
    catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});

app.post('/update/:id', async(req, res) => {

    try {
        var id = req.params.id;
        var total = sum_levels(req.body);
        var update_query = `UPDATE tokis SET 
            name = '${req.body.name}', 
            height = ${req.body.height}, 
            weight = ${req.body.weight},
            fly = ${req.body.fly},
            fight = ${req.body.fight},
            fire = ${req.body.fire},
            water = ${req.body.water},
            electric = ${req.body.electric},
            ice = ${req.body.ice},
            total = ${total},
            trainer_name = '${req.body.trainer_name}'
            WHERE id = ${id}
        `;
        const client = await pool.connect();
        const result = await client.query(update_query);
        res.redirect('/toki/' + id);
        client.release();
    }
    catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});

app.get('/cool', (req, res) => res.send(cool()));
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