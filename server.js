// import Express, initialize app
var express = require('express');
var app = express();

// routes
app.get('/', function(request, response){
    response.sendFile(__dirname + '/index.html');
});

// listen for requests on specified port
app.listen(3000);