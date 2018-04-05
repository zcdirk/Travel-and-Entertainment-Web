const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const https = require('https');

// parse all the request body to json
app.use(bodyParser.json());

// deal with CORS
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

app.use(express.static('public'));

// search for the result tables
app.post('/search', function (req, res) {
    let b = req.body;
    if (b.other !== undefined) {
        // get the location
        let geocoding_url = "https://maps.googleapis.com/maps/api/geocode/json?address="
            + b.other.replace(" ", "+") + "&key=AIzaSyC3pqvt5Q80IONE4AJmMSp7_Ue53s3L6kA";
        https.get(geocoding_url, function (responce) {
            try {
                let json = '';
                responce.setEncoding('utf8');
                responce.on('data', function (d) {
                    json += d;
                });
                responce.on('end', function () {
                    if (json === "{}") return;
                    json = JSON.parse(json);
                    let loc = json.results[0].geometry.location;
                    b.location = loc.lat + "," + loc.lng;
                    let url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="
                        + b.location + "&radius=" + b.radius + "&type=" + b.type + "&keyword=" + b.keyword
                        + "&key=AIzaSyC3pqvt5Q80IONE4AJmMSp7_Ue53s3L6kA";
                    https.get(url, function (responce) {
                        try {
                            let json = '';
                            responce.setEncoding('utf8');
                            responce.on('data', function (d) {
                                json += d;
                            });
                            responce.on('end', function () {
                                if (json === "{}") return;
                                json = JSON.parse(json);
                                res.json(json);
                            });
                        } catch (e) {
                            res.json({'error': true});
                        }
                    }).on('error', function (e) {
                        res.json({'error': true});
                    });
                });
            } catch (e) {
                res.json({'error': true});
            }
        }).on('error', function (e) {
            res.json({'error': true});
        });
    } else {
        let url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="
            + b.location + "&radius=" + b.radius + "&type=" + b.type + "&keyword=" + b.keyword
            + "&key=AIzaSyC3pqvt5Q80IONE4AJmMSp7_Ue53s3L6kA";
        https.get(url, function (responce) {
            try {
                let json = '';
                responce.setEncoding('utf8');
                responce.on('data', function (d) {
                    json += d;
                });
                responce.on('end', function () {
                    if (json === "{}") return;
                    json = JSON.parse(json);
                    res.json(json);
                });
            } catch (e) {
                res.json({'error': true});
            }
        }).on('error', function (e) {
            res.json({'error': true});
        });
    }
});

// get the next page of the results
app.post('/page', function (req, res) {
    let b = req.body;
    let url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken="
        + b.page + "&key=AIzaSyC3pqvt5Q80IONE4AJmMSp7_Ue53s3L6kA";
    https.get(url, function (responce) {
        try {
            let json = '';
            responce.setEncoding('utf8');
            responce.on('data', function (d) {
                json += d;
            });
            responce.on('end', function () {
                if (json === "{}") return;
                json = JSON.parse(json);
                res.json(json);
            });
        } catch (e) {
            res.json({'error': true});
        }
    }).on('error', function (e) {
        res.json({'error': true});
    });
});

// get the detail information of a place
app.post('/detail', function (req, res) {
    let b = req.body;
    let url = "https://maps.googleapis.com/maps/api/place/details/json?placeid="
        + b.id + "&key=AIzaSyC3pqvt5Q80IONE4AJmMSp7_Ue53s3L6kA";
    https.get(url, function (responce) {
        try {
            let json = '';
            responce.setEncoding('utf8');
            responce.on('data', function (d) {
                json += d;
            });
            responce.on('end', function () {
                if (json === "{}") return;
                json = JSON.parse(json);
                res.json(json.result);
            });
        } catch (e) {
            res.json({'error': true});
        }
    }).on('error', function (e) {
        res.json({'error': true});
    });
});

// get the yelp reviews
app.post('/yelp', function (req, res) {
    let b = req.body;
    let best_path = "/v3/businesses/matches/best?name=" + b.name
        + "&city=" + b.city + "&state=" + b.state + "&country=" + b.country;

    let best_options = {
        host: 'api.yelp.com',
        path: encodeURI(best_path),
        method: 'GET',
        headers: {
            Authorization: 'Bearer OEcJjQJLjSIGajNJfaql8tl5ZUTJQWrJKjpuV6CqjntgHotrW2L_vNLrBMozlAhaRi98XYkWfX4FdT_49XoXKw8iOe78GIOGVMzRi6NHqS85kN9EBczQackdAdHCWnYx'
        }
    };
    https.get(best_options, function (responce) {
        try {
            let json = '';
            responce.setEncoding('utf8');
            responce.on('data', function (d) {
                json += d;
            });
            responce.on('end', function () {
                if (json === "{}") {
                    res.json({});
                    return;
                }
                json = JSON.parse(json);
                bus = json.businesses;
                if (bus.length === 0) {
                    res.json({});
                } else {
                    id = bus[0].id;
                    let review_options = {
                        host: 'api.yelp.com',
                        path: encodeURI("https://api.yelp.com/v3/businesses/" + id + "/reviews"),
                        method: 'GET',
                        headers: {
                            Authorization: 'Bearer OEcJjQJLjSIGajNJfaql8tl5ZUTJQWrJKjpuV6CqjntgHotrW2L_vNLrBMozlAhaRi98XYkWfX4FdT_49XoXKw8iOe78GIOGVMzRi6NHqS85kN9EBczQackdAdHCWnYx'
                        }
                    };
                    https.get(review_options, function (reviewRes) {
                        try {
                            let json = '';
                            reviewRes.setEncoding('utf8');
                            reviewRes.on('data', function (d) {
                                json += d;
                            });
                            reviewRes.on('end', function () {
                                if (json === "{}") return;
                                json = JSON.parse(json);
                                res.json(json);
                            });
                        } catch (e) {
                            res.json({'error': true});
                        }
                    }).on('error', function (e) {
                        res.json({'error': true});
                    });
                }
            });
        } catch (e) {
            res.json({'error': true});
        }
    }).on('error', function (e) {
        res.json({'error': true});
    });
});


// set the port number to 8081
app.listen(8081);