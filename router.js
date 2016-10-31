var express = require('express');
var kiosk = require('./routes/kiosk');
var admin = require('./routes/admin');
var router = express.Router();

module.exports = router;

router.use('/kiosks', kiosk);
router.use('/admins', admin);
