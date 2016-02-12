var express = require('express');
var path = require('path');
var passport = require('passport');

var router = express.Router();

//Serve index.html back to browser
router.get('/', function(request, response){
    response.sendFile(path.join(__dirname, '../public/views/index.html'));
});

router.get('/fail', function(request, response){
    response.send('fail');
});

router.get('/success', function(request, response){
    response.send('success');
});

router.post('/', passport.authenticate('local', {
    successRedirect: '/success',
    failureRedirect: '/fail'
}));

module.exports = router;

