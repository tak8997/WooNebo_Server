'use strict';

import express from 'express';
import shortid from 'shortid';
import fs from 'fs';

var upload = express.Router();


module.exports = upload;

upload.post('/', ensureAuthentication, (req, res)=>{
    fs.readFile(req.files.uploadFile.path, (error, data)=>{
        let fileName = shortid.generate();
        let filePath = "public/uploads/" + fileName;

        fs.writeFile(filePath, data, (error)=>{
            if (error) {
                res.status(404);
                res.redirect('back');

                return;
            } else {
                res.send("/images/" + fileName);
            }
        });
    });
});


function ensureAuthentication(req, res, next) {
    if (!req.isAuthenticated()) {
        res.status(401);
        res.end();
    } else {
        next();
    }
}
