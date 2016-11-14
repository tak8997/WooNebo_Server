var express = require('express');
var image = express.Router();
var fs = require('fs');


module.exports = image;

image.get('/:id/:name', function(req, res) {
    var img = fs.readFileSync('public/uploads/' + req.params.id + '/' + req.params.name);

    res.writeHead(200, {'Content-Type': 'image/gif' });
    res.end(img, 'binary');
});
