var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');
var lr = require('line-reader');

let spots = [];
fs.readdir("./spots", function (err, files) {
    files.forEach(function (file) {
        if (file.substring(file.length-4) === ".wpt") {
            readWPT(file);
        } else {
            spots = spots.concat(readJson(file));
        }
    });
});
console.log("RUNNING");
http.createServer(async function (req, res) {
    if (req.url === "/") {
        fs.readFile('client.html', function(err, data) {
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.write(data);
          res.end();
        });
    } else if (req.url === "/style.css") {
        fs.readFile('style.css', function(err, data) {
          res.writeHead(200, {'Content-Type': 'text/css'});
          res.write(data);
          res.end();
        });
    } else if (req.url === "/code.js") {
        fs.readFile('code.js', function(err, data) {
          res.writeHead(200, {'Content-Type': 'application/javascript'});
          res.write(data);
          res.end();
        });
    } else {
        var q = url.parse(req.url, true).query;
        if (q.lat !== undefined) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify(await getNearby(q.lat,q.long,q.skill)));
            res.end();
        }
    }
}).listen(8080);

function readWPT(file) {
    var results = [];
    lr.eachLine('./spots/' + file, function(line) {
        if (line !== "DATUM,WGS84") {
            line = line.split(",");
            var spot = {latitude: parseFloat(line[3]),longitude: parseFloat(line[4]),spot_name: line[2]}
            if (spot.spot_name !== undefined && spot.latitude !== undefined && spot.longitude !== undefined) {
                spots.push(spot);
            }
        }
    });
}

function readJson(file) {
    return JSON.parse(fs.readFileSync("./spots/" + file));
}

async function getNearby(latitude,longitude,skill) {
    console.log("Searching " + spots.length + " spots");
    spots = spots.sort(compareByDistance(latitude,longitude));
    var results = [];
    var numOfResults = 26;
    var i = 0;
    while (results.length < 30) {
        var time = await getDrivingDistance(latitude,longitude,spots[i].latitude,spots[i].longitude);
        var distance = getDistance(latitude,longitude,spots[i].latitude,spots[i].longitude);
        var wind = await getWindSpeed(spots[i].latitude,spots[i].longitude);
        if (skill === "novice" && wind < 16 || skill === "intermediate" && wind < 21 || skill === "expert") {
            results.push([spots[i],time,distance,wind]);
        }
        i++;
    }
    return results;
}

function compareByDistance(latitude,longitude) {
    return function functionName(a,b) {
        var aDistance = getDistance(latitude,longitude,a.latitude,a.longitude);
        var bDistance = getDistance(latitude,longitude,b.latitude,b.longitude);
        if (aDistance > bDistance) {
            return 1;
        } else if (bDistance > aDistance) {
            return -1;
        } else {
            return 0;
        }
    }
}

function getDistance(lat1,long1,lat2,long2) {
    var dlat = toRadians(lat2) - toRadians(lat1);
    var dlong = toRadians(long2) - toRadians(long1);
    var lat1Radians = toRadians(lat1);
    var lat2Radians = toRadians(lat2);
    var latDifferenceRadians = toRadians(lat2 - lat1);
    var longDifferenceRadians = toRadians(long2 - long1);
    var a = Math.sin(latDifferenceRadians / 2) * Math.sin(latDifferenceRadians / 2) + Math.cos(lat1Radians) * Math.cos(lat2Radians) * Math.sin(longDifferenceRadians / 2) * Math.sin(longDifferenceRadians / 2);
    var c = Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var earthRadius = 6371e3;
    var result = earthRadius * c;
    return parseFloat(result / 1000);
}

function toRadians(coord) {
    return parseFloat((coord * Math.PI) / 180);
}

async function getDrivingDistance(lat1,long1,lat2,long2) {
    return new Promise((resolve,reject) => {
        var origin = lat1 + "," + long1;
        var destination = lat2 + "," + long2;
        var apiKey = {google distance matrix api key};
        var url = '/maps/api/distancematrix/json?units=imperial&origins=' + origin + '&destinations=' + destination + '&key=' + apiKey;
        var options = {
          'method': 'POST',
          'hostname': 'maps.googleapis.com',
          'path': url,
          'headers': {
            'Content-Type': 'application/json'
          },
          'maxRedirects': 20
        };
        const req = https.request(options, (res) => {
            res.on('data', d => {
                var data = JSON.parse(d);
                resolve(data.rows[0].elements[0].duration);
            });
        });
        req.on('error', error => {
            reject(error);
        });
        req.end();
    });
}

async function getWindSpeed(latitude,longitude) {
    return new Promise((resolve,reject) => {
        var key = {open weather api key};
        var url = "/data/2.5/weather?lat=" + latitude + "&lon=" + longitude + "&appid=" + key;
        var options = {
          'method': 'GET',
          'hostname': 'api.openweathermap.org',
          'path': url,
          'headers': {
              'Content-Type': 'application/json'
          },
          'maxRedirects': 20
        };
        const req = https.request(options, (res) => {
            var data = [];
            res.on('data', d => {
                data.push(d);
            }).on("end", function() {
                var result = JSON.parse(Buffer.concat(data).toString());
                resolve(result.wind.speed * 1.94384);
            });
        });
        req.on('error', error => {
            reject(error);
        });
        req.end();
    });
}
