// import Express, initialize app
var express = require('express');
var app = express();

// import Consolidate for Swig templating
var cons = require('consolidate');
app.engine('html', cons.swig);
app.set('view engine', 'html');
app.set('views', __dirname + '/templates');

// import Mongo, setup db, connect to db
var db;
var MongoClient = require('mongodb').MongoClient;
MongoClient.connect('mongodb://localhost:27017/blog', function(err, database){
    if (err) throw err;

    // set reference to db globally for convenience
    db = database;

    app.listen(3000, function(){
        console.log('Server is running...');
    });
});

// look in 'public' folder for css and js files
app.use(express.static('public'));

// routes
app.get('/', function(request, response){
    response.sendFile(__dirname + '/index.html');
});

app.get('/cv', function(request, response){
    response.sendFile(__dirname + '/templates/cv.html');
});

app.get('/work', function(request, response){
    response.sendFile(__dirname + '/templates/work.html');
});

app.get('/blog', function(request, response){
    // Mongo returns an object, so convert data to array for iteration
    db.collection('posts').find().toArray(function(err, docs){
        response.render('blog', {posts: docs});
        db.close();
    });
});
