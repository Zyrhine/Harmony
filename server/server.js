const path = require('path')
var express = require('express');
var app = express();
var http = require('http').Server(app);
var cors = require('cors')

app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({extended: true}));
app.use(express.json())
app.use(cors())

let server = http.listen(3000, function () {
    let host = server.address().address;
    let port = server.address().port;
    console.log("Server listening on: " + host + ":" + port);
});