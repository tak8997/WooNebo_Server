var mysql = require('mysql');
var connection = mysql.createConnection({
    user    : 'woonebo',
    password: 'dbmysql',
    database: 'woonebo'
});

module.exports = connection;
