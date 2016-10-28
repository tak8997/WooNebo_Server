var mysql = require('mysql');
var dbConn = mysql.createConnection({
    user    : 'woonebo',
    password: 'dbmysql',
    database: 'woonebo'
});

module.exports = dbConn;
