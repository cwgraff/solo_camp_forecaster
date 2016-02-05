var express = require('express');

var index = require('./routes/index');
var database = require('./routes/database');

var app = express();

app.use(express.static('server/public'));

app.use('/getData', database);
app.use('/', index);


//##### redirect catch for routing refresh #####
app.get('/*', function(request, response){
    response.redirect('/');
});

//###### Server #######
var server = app.listen(3000, function(){
   var port = server.address().port;
    console.log('Waiting for some requests on port', port);
});
