var express = require('express');
var passport = require('passport');
var session = require('express-session');
var pg = require('pg');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var database = require('./routes/database');
var localStrategy = require('passport-local').Strategy;
var connectionString = 'postgres://localhost:5432/campwhere';

var app = express();

app.use(express.static('server/public'));

app.use('/getData', database);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));


//###########################################################
//               Passport Authentication Stuff
//###########################################################

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: false,
    cookie: {maxAge: 60000, secure: false}
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', index);

passport.serializeUser(function(user, done){
    console.log('serializeUser', user);
    done(null, user.id);
});

passport.deserializeUser(function(id, done){
    console.log('deserializeUser', id);
    pg.connect(connectionString, function(err, client){
        var user = {};

        var query = client.query('SELECT * FROM users WHERE id = $1', [id]);

        query.on('row', function(row){
            user = row;
            console.log('User object', user);
            done(null, user); //creates req.user
        });
    });
});

passport.use('local', new localStrategy({
    passReqToCallback: true,
    usernameField: 'username'
}, function(req, username, password, done){

    console.log('Inside function');
    pg.connect(connectionString, function(err, client){
        var user = {};

        var query = client.query('SELECT * FROM users WHERE username = $1', [username]);
        console.log(query);
        query.on('row', function(row){
            user = row;
            console.log('User object', user);
        });

        query.on('end', function(){
            if(user && user.password === password){
                console.log('success');
                done(null, user); //success
            } else {
                done(null, false); //fail
            }
            client.end();
        });
    });

    //does the password match?

}));


//##### redirect catch for routing refresh #####
app.get('/*', function(request, response){
    response.redirect('/');
});

//###### Server #######
var server = app.listen(3000, function(){
   var port = server.address().port;
    console.log('Waiting for some requests on port', port);
});
