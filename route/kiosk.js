var express = require('express');
var kiosk = express();
var db = require('../mysql');


module.exports = kiosk;

kiosk.get('/', function(req, res) {
    var sql = "select id, description from kiosks";
    var sendResult = {};

    db.query(sql, function (err, rows, fields) {
        sendResult.counts = rows.length;

        sendResult.kiosks = [];

        for (i=0; i<rows.length; i++) {
            sendResult.kiosks[i] = {
                id: rows[i].id,
                desc: rows[i].description
            };
        }

        res.send(sendResult);
    });
});
