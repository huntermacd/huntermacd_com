// import Express, initialize app
var express = require('express');
var app = express();

// setup Swig for templating
var swig = require('swig');
app.engine('html', swig.renderFile);
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
    response.render('contact');
});

app.get('/cv', function(request, response){
    response.render('cv');
});

app.get('/work', function(request, response){
    response.render('work');
});

app.get('/blog', function(request, response){
    // Mongo returns an object, so convert data to array for iteration
    db.collection('posts').find().toArray(function(err, docs){
        response.render('blog', {posts: docs});
    });
});
