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

// Home page, will display the top 4 Tokimons
app.get('/', async(req, res) => {

    try {
        var search_query = `SELECT * FROM tokis ORDER BY total DESC LIMIT 4`; 
        const client = await pool.connect();
        var results = await client.query(search_query);
        results = max_attr(results);
        res.render('pages/index', results);
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});

/*
 * Search page, can be in 1 of 3 states:
 * initial search page, waiting for input
 * null search, will display all Tokimons
 * name search, that will display Tokimons matching search criteria
 */
app.get('/search', async(req, res) => {

    try {

        var search_val = req.query.search_val;
        // Null search, return all Tokimons
        if (search_val == '') {
            var search_query = `SELECT * FROM tokis`; 
            const client = await pool.connect();
            var results = await client.query(search_query);

            // This alters the results object and ends another field to each row.
            // The maximum level of a Tokimon becomes its type and will correlate to a color.
            results = max_attr(results);
            res.render('pages/search', results);
            client.release();
        }
        // No query sent, just returning search page with no results
        else if (search_val == null) {
            res.render('pages/search');
        }
        // Return Tokimons matching the search criteria
        else {
            var search_query = `SELECT * FROM tokis WHERE LOWER(name) LIKE LOWER('%${search_val}%')`;
            const client = await pool.connect();
            var results = await client.query(search_query);

            // Adds color attribute to each Tokimon given their highest level
            results = max_attr(results);
            res.render('pages/search', results);
            client.release();
        }
    }
    catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});

// Create form
app.get('/create', (req, res) => res.render('pages/create'));

// Database call that will add to DB
app.post('/add', async(req, res) => {
    try {

        // Sum the levels of the Tokimon
        var total = sum_levels(req.body);

        // Limit to length of 27 to the sprite
        var sprite = cool().slice(0,27);

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

        // After adding a Tokimon, redirect to its info page
        res.redirect('/toki/' + result.rows[0].id );
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});

// View all the information of a Tokimon
app.get('/toki/:id', async(req, res) => {

    try {
        var view_query = `SELECT * FROM tokis WHERE id=${req.params.id}`;
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

// An AJAX call to pass the data of the Tokimon to the chart when viewing
app.get('/levels/:id', async(req, res) => {
    try {
        var view_query = `SELECT fly, fight, fire, water, electric, ice FROM tokis WHERE id=${req.params.id}`;
        const client = await pool.connect();
        const result = await client.query(view_query);
        client.release();
        var levels = [];

        // Create an array to send back to the request with the data of the levels
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

// Edit form to edit a Tokimon
app.get('/edit/:id', async(req, res) => {

    try {
        var toki_query = `SELECT *  FROM tokis WHERE id=${req.params.id}`;
        const client = await pool.connect();
        const result = await client.query(toki_query);
        res.render('pages/edit-form', result.rows[0]);
        client.release();
    }
    catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});

// Update Tokimon in database
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

// Delete a Tokimon, a modal will prompt to double check
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
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

// Total the levels of a Tokimon
function sum_levels(body) {
    var types = ['fly', 'fight','fire', 'water', 'electric', 'ice'];
    var sum = 0;
    types.forEach(element => {
        sum += parseFloat(body[element]);
    });
    return sum;
}

// Find the highest attribute of a Tokimon and add a color field to correlate with it
function max_attr(results) {

    var types = ['fly', 'fight','fire', 'water', 'electric', 'ice'];
    var colors = {
        'fly': 'rgba(192, 192, 192, 0.5)',
        'fight': 'rgba(255, 99, 132, 0.5',
        'fire': 'rgba(255, 140, 0, 0.5)',
        'water': 'rgba(0, 191, 255, 0.5)',
        'electric': 'rgba(255, 255, 0, 0.5)',
        'ice': 'rgba(0, 255, 255, 0.5)'
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
    });
    return results;
}