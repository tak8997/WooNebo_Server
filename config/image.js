'use strict';

var express = require('express');
var image = express.Router();
var fs = require('fs');


module.exports = image;

image.get('/:name', function(req, res) {
    let img = fs.readFile('public/uploads/' + req.params.name, function(err, data) {
        if (err) {
            res.writeHead(411);
            res.end();

            return;
        }

        res.writeHead(200, {'Content-Type': 'image/gif' });
        res.end(data, 'binary');
    });
});
