var express = require('express');
var kiosk = express();
var moment = require('moment');
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

        res.json(sendResult);
    });
});

kiosk.get('/:id/products', function(req, res) {
    var kioskId = Number.parseInt(req.params.id);
    var currentTime = Date.now();
    var sql = "select p.id, p.product_name, p.description, p.price, p.url, k.last_play_at, m.play_time_at "
            + "from kiosks k, products p, media_file_configs m "
            + "where m.product_id = p.id "
            + "and m.file_id = k.last_play_file_id "
            + "and k.id = ? ";

    db.query(sql, kioskId, function(err, rows) {
        var result, now, diff, period, index;

        if (err) {
            throw err;
        }

        if (rows.length === 0) {
            res.sendStatus(411).send("Invalid Parameters");
        }

        lastPlayTime = moment(rows[0].last_play_at, moment.ISO_8601);
        now = moment(Date.now());
        period = Math.round(moment.duration(now.diff(lastPlayTime)).asSeconds());

        index = 0;
        diff = period - rows[0].play_time_at;

        for (i=0; i<rows.length; i++) {
            if (diff < period - rows[i].play_time_at) {
                index = i;
                diff = period - rows[i].play_time_at;
            }
        }

        result = {};
        result.id = rows[index].id;
        result.product_name = rows[index].product_name;
        result.description = rows[index].description;
        result.price = rows[index].price;
        result.url = rows[index].url;

        res.send(result);
    });
});
