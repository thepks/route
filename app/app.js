/*jshint node:true*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as it's web server
// for more info, see: http://expressjs.com
var express = require('express');
var forge = require('node-forge');
var bodyParser = require('body-parser');
var session = require('cookie-session');
var http = require('http');


// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

var jobs_service_config = {                                                                                                                                                        
    'host': appEnv.app.cloudantNOSQLDB[0].credentials.host,                                                                                                      
    'port': appEnv.app.cloudantNOSQLDB[0].credentials.port,                                                                                                                                                              
    'path': '/jobs',                                                                                                                                                          
    'username': appEnv.app.cloudantNOSQLDB[0].credentials.username,                                                                                                                                   
    'password': appEnv.app.cloudantNOSQLDB[0].credentials.password                                                                                                                                    
};                                                                                                                                                                            


var jsonParser = bodyParser.json();

var jobs_form_user_search = function(username) {
    return "/jobs/"+username;
};


var jobs_form_proxy_options = function(req) {

//    console.log(JSON.stringify(req.headers));

    var new_headers = {};
    if ('content-type' in req.headers) {
    new_headers['content-type'] = req.headers['content-type'];
    }
    if ('content-length' in req.headers) {
        new_headers['content-length'] = req.headers['content-length'];
    } 
    new_headers['Authorization'] = 'Basic ' + new Buffer(jobs_service_config.username + ":" + jobs_service_config.password).toString('base64');


 
    return {
        hostname: jobs_service_config.host,
        port: jobs_service_config.port,
        path: req.url,
        method: req.method,
        headers: new_headers 
    };
};

var jobs_form_proxy_options2 = function(method,pathreq) {

    var new_headers = {};
    new_headers['Authorization'] = 'Basic ' + new Buffer(jobs_service_config.username + ":" + jobs_service_config.password).toString('base64');


 
    return {
        hostname: jobs_service_config.host,
        port: jobs_service_config.port,
        path: pathreq,
        method: method,
        headers: new_headers 
    };
};


app.use(session({
    keys: ['flog1', '2flog', 'fl3og']
}));


app.all(/jobs/, function(req, res) {

    if (!req.session.auth) {
        res.statusCode = 401;
        res.send("Unauthorized");
        return false;
    }

 //   console.log(JSON.stringify(form_proxy_options(req)));
    // do the proxy call call
    var reqGet = http.request(jobs_form_proxy_options(req), function(resembedded) {
        console.log("statusCode: ", resembedded.statusCode);
        // uncomment it for header details
        //  console.log("headers: ", res.headers);
        
        resembedded.pipe(res);

    });

    req.addListener('data', function(d) {
//    console.log(d);
    reqGet.write(d,'binary');
    });

    req.addListener('end', function (d) {
    reqGet.end();
    });

    reqGet.on('error', function(e) {
        console.error(e);
    res.statusCode = 500;
    res.send('Error ' + e);
    });
});

app.all('/action/logoff', function(req, res) {

    console.log('Logged on? ' + req.session.auth);
    req.session.auth = false;
    req.session.roles = [];
    res.statusCode = 200;
    res.send("Logged off");

});

app.post('/action/logon', jsonParser, function(req, res) {
var secret;
var md = forge.md.sha1.create();
md.update(req.body.user.password);
secret = md.digest().toHex();
//console.log(secret);
//console.log(form_user_search(req.body.user.username));

// do the call
var reqGet = http.request(form_proxy_options2('GET',form_user_search(req.body.user.username)), function(resembedded) {
//console.log("statusCode: ", resembedded.statusCode);
// uncomment it for header details
//  console.log("headers: ", res.headers);
var data_comb ='';

resembedded.on('data', function(d) {
    data_comb+=d;
});

resembedded.on('end', function() {
    var result = {};
        console.info('logon result:\n');
                    console.info('Get completed');
                    var p = JSON.parse(data_comb);
            console.log(data_comb);
                    try {
                        if (p.password === secret) {

                            result.authorised = true;
                            result.roles = p.roles.split(/,/g);
                            result.company = p.company;
                            
                            req.session.auth = true;
                            req.session.roles = result.roles;
                            req.session.company = result.company;
                            res.statusCode = 200;
                console.log(JSON.stringify(result));
                            res.send(JSON.stringify(result));
                        } else {
                            req.session.auth = false;
                            res.statusCode = 401;
                            result.authorised = false;
                            res.send(JSON.stringify(result));
                        }

                    } catch (e) {
                        console.log('Failed to find path');
                        req.session.auth = false;
                        req.session.roles = [];
                        res.statusCode = 401;
                        result.authorised = false;
                        res.send(JSON.stringify(result));
                    }


                });
            });

            // write the json data
            var posting = jobs_form_user_search(req.body.user.username);
            console.log(posting);
            reqGet.end();
            reqGet.on('error', function(e) {
                console.error(e);
            });

        });



// start server on the specified port and binding host
var server = app.listen(appEnv.port, appEnv.bind, function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

