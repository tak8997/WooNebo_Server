var express = require('express');
var app = express();

app.get('/', function(req, res) {
    let obj1 = {
        item: 'item',
        image: 'http://bookthumb.phinf.naver.net/cover/101/209/10120935.jpg?type=m140&udate=20160612',
        url: 'http://book.naver.com/bookdb/book_detail.nhn?bid=10961916',
        price: 3000
    }
    let obj2 = {
        item: 'item2',
        image: 'http://bookthumb.phinf.naver.net/cover/101/614/10161496.jpg?type=m140&udate=20160218',
        url: 'http://book.naver.com/bookdb/book_detail.nhn?bid=9586856',
        price: 10000
    }
    let obj3 = {
        item: 'item3',
        image: 'http://bookthumb.phinf.naver.net/cover/106/529/10652939.jpg?type=m140&udate=20160817',
        url: 'http://book.naver.com/bookdb/book_detail.nhn?bid=10362971',
        price: 12300
    }
    let array = [obj1, obj2, obj3];

    res.send(array);
});

app.listen(3000, function() {
    console.log('Server started, localhost:3000');
});
