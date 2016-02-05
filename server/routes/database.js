var express = require('express');
var pg = require('pg');

var router = express.Router();

var connectionString = 'postgres://localhost:5432/campwhere';

router.get('/:region', function(request, response){
    var returnData = [];

    var region = request.params.region;
    console.log(region);

    pg.connect(connectionString, function(err, client) {

        if (region == "All") {
        var query = client.query("SELECT * FROM park");
        }  else {
            var query = client.query("SELECT * FROM park WHERE region = '" + region + "'");
        }

        query.on('row', function(row) {
            returnData.push(row);
        });


        query.on('end', function(){
            client.end();
            return response.json(returnData);

        });

    });
});

module.exports = router;