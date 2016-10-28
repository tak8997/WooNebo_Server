var express = require('express');
var kiosk = require('./route/kiosk');
var router = express.Router();

module.exports = router;

router.use('/kiosks', kiosk);
