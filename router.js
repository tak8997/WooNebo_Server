var express = require('express');
var kiosk = require('./routes/kiosk');
var product = require('./routes/product');
var admin = require('./routes/admin');
var user = require('./routes/user');
var upload = require('./config/upload');
var image = require('./config/image');
var router = express.Router();


module.exports = router;

router.use('/kiosks', kiosk);
router.use('/admins', admin);
router.use('/products', product);
router.use('/users', user);
router.use('/uploads', upload);
router.use('/images', image);
