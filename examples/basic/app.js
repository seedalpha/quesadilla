var express     = require('express');
var quesadilla  = require('quesadilla');

var app = express();
app.use(quesadilla(__dirname + '/public'));
app.use(express.static(__dirname + '/public'));
app.listen(8000);
