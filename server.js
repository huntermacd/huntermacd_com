// import Express, initialize app
var express = require('express');
var app = express();

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

// setup password encryption
var bcrypt = require('bcrypt-nodejs');

// setup Passport for user auth
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(
    function(username, password, done){
        db.collection('users').findOne({username: username}, function(err, user){
            if (user === null){
                return done(null, false);
            }
            if (err) {return done(err);}
            if (username !== user.username){
                return done(null, false);
            }
            if (!bcrypt.compareSync(password, user.password)){
                return done(null, false);
            }
            return done(null, user);
        });
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.username);
});

passport.deserializeUser(function(user, done) {
    // find user, add user object to request
    db.collection('users').findOne({username: user}, function(err, user){
        return done(null, user);
    });
});

// setup Swig for templating
var swig = require('swig');
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/templates');

// look in 'public' folder for css and js files
app.use(express.static('public'));

// setup body-parser for adding form data to the response
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

// setup Habitat for fetching environment variables
var habitat = require('habitat');
var env = habitat.load('config.env');

var session = require('express-session');
app.use(session({ secret: env.get("SESSION_SECRET") }));
app.use(passport.initialize());
app.use(passport.session());

// if logged-in, add 'user' to every template
app.use(function(request, response, next){
    response.locals.user = request.user;
    next();
});

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

app.get('/blog', checkPage, function(request, response){
    // Mongo returns an object, so convert data to array for iteration
    if (request.query.page){
        db.collection('posts').find().skip(10 * (request.query.page - 1)).limit(10).sort({date: -1}).toArray(function(err, docs){
            if (docs.length === 0){
                response.status(404).render('404');
            } else {
                response.render('blog', {posts: docs});
            }
        });
    } else {
        db.collection('posts').find().limit(10).sort({date: -1}).toArray(function(err, docs){
            response.render('blog', {posts: docs});
        });
    }
});

app.get('/post/:slug', function(request, response){
    db.collection('posts').findOne({slug: request.params.slug}, function(err, doc){
        if (doc === null){
            response.status(404).render('404');
        } else {
            response.render('post', {post: doc});
        };
    });
});

app.get('/tags', function(request, response){
    db.collection('tags').find().sort({name: 1}).toArray(function(err, docs){
        response.render('tags', {tags: docs});
    });
});

app.get('/tag/:tag', function(request, response){
    db.collection('posts').find({tags: request.params.tag}).sort({date: 1}).toArray(function(err, docs){
        if (docs.length === 0){
            response.status(404).render('404');
        } else {
            response.render('tag', {posts: docs, tag: request.params.tag});
        }
    });
});

app.get('/login', function(request, response){
    response.render('login');
});

app.post('/login',
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login'
    })
);

app.get('/add', loggedIn, function(request, response, next){
    response.render('add');
});

app.post('/add', function(request, response){
    var slug = request.body.title.replace(/ /g, '_').toLowerCase();
    db.collection('posts').insert({
        title: request.body.title,
        body: request.body.body,
        date: new Date(),
        tags: cleanTags(request.body.tags),
        slug: slug
    });
    response.redirect('/post/' + slug);
});

app.get('/edit/:slug', function(request, response){
    db.collection('posts').findOne({slug: request.params.slug}, function(err, doc){
        if (doc === null){
            response.status(404).render('404');
        } else {
            response.render('edit', {post: doc});
        };
    });
});

app.post('/edit/:slug', function(request, response){
    var slug = request.body.title.replace(/ /g, '_').toLowerCase();
    db.collection('posts').findOne({slug: request.params.slug}, function(err, doc){
        if (doc === null){
            response.status(404).render('404');
        } else {
            db.collection('posts').update({_id: doc._id}, {$set:
                {
                    title: request.body.title,
                    body: request.body.body,
                    edited: new Date(),
                    tags: cleanTags(request.body.tags),
                    slug: slug
                }
            });
        };
    });
    response.redirect('/post/' + slug);
});

// custom middleware for error handling (run this if all other routes fail)
app.use(function(request, response, next) {
    response.status(404).render('404');
});

// helper functions
function cleanTags(tagString){
    var re = /\s*,\s*/;
    var tagArray = tagString.split(re);
    for (var i = 0; i < tagArray.length; i++) {
        db.collection('tags').update({name: tagArray[i]}, {name: tagArray[i]}, {upsert: true});
    };
    return tagArray;
}

function loggedIn(request, response, next){
    if (request.user){
        next();
    } else {
        response.redirect('/login');
    }
}

function checkPage(request, response, next){
    // add page number of posts from query string
    var page = parseInt(request.query.page);
    db.collection('posts').count(function(err, count){
        response.locals.page = page;
        response.locals.pagesLeft = count > (page * 10);
        next();
    });
}
