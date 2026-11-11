const knex = require('knex')({
    client: 'mysql2',
    connection: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'Senac2019',
        database: 'sabor_tapajos'
    }
});

module.exports = knex;