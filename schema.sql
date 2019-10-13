CREATE TABLE tokis(
    id SERIAL PRIMARY KEY,
    sprite TEXT,
    name TEXT,
    height REAL,
    weight REAL,
    fly REAL,
    fight REAL,
    fire REAL,
    water REAL,
    electric REAL,
    ice REAL,
    total REAL,
    trainer_name TEXT
);


INSERT INTO tokis (
    name, height, weight, fly, fight, fire, 
    water, electric, ice, total, trainer_name)
    VALUES ('pikachu',130,10,0,12,0,0,100,10,132,'ash ketchum');