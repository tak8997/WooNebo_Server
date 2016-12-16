'use strict';

import express from 'express';
import fs from 'fs';

var image = express.Router();


module.exports = image;

image.get('/:name', (req, res)=>{
    let img = fs.readFile('public/uploads/' + req.params.name, (err, data)=>{
        if (err) {
            res.writeHead(411);
            res.end();

            return;
        }

        res.writeHead(200, {'Content-Type': 'image/gif' });
        res.end(data, 'binary');
    });
});
