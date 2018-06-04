// stats_hot.js
// usage:
//    nohup node stats_hot.js 8083 &    - start in the background, use jobs, fg etc to switch between
//
// DataDog reporting:
// - counter: request.count
// - counter: error.count
// - timing:  response.time
// - gauge:   reponse.size
// - tag: load_rate: 'low' | 'high'

var http = require("http");
var port = process.argv[2] || 8081;
var sprintf = require('sprintf-js').sprintf

var StatsD = require('hot-shots'),
    statsD = new StatsD({
        prefix: 'my_node.',
        globalTags: { node_js: '', load_rate: 'low' }
    });

function rnd(n, m) {  // inclusive
    return n + Math.floor(Math.random() * (m - n + 1)); 
}
function strFill(n, a) {
    return Array(n + 1).join(a || " "); 
}
function rndWord(n, m) {
    return strFill(rnd(n, m)).replace(/ /g, x => String.fromCharCode(rnd(0, 25) + 65 + 32)); 
}
function rndLine(n, m, nw, mw) {
    return strFill(rnd(n, m)).replace(/ /g, x => rndWord(nw, mw) + " "); 
}
function rndText(n, m, nl, ml, nw, mw) { 
    return strFill(rnd(n, m)).replace(/ /g, x => rndLine(nl, ml, nw, mw) + "\n"); 
}

var server = http.createServer(function (request, response) {

    statsD.increment('request.count');

    var r = Math.random() * 10; 
    var n = Math.floor(4*r) + 1;  // data size 1..40
    var t = Math.floor(r*r) + 10; // time      10..109
    var text = rndText(3, 10+n, 8, 12, 2, 8)
   
    response.setHeader('Content-Type', 'text/plain');
   
    var start = Date.now()
    setTimeout(function() {
        var actual = Date.now() - start;
        var r = t / actual;
        if (r < 0.10) {  // threashold: 0.10 automated load testing, 0.50 manual browser testing
            console.error(`Respose for ${t} ms takes ${actual} ms ratio ${(r*100).toFixed(2)}%`);
            statsD.increment('error.count');

            response.statusCode = 500;
            response.statusMessage  = "Overload";
            response.write('Error: 500 Internal Server Error - Overload\n');
            // throw new Error("Overload");
        } else {
            response.statusCode = 200;
            response.write('Hello Stats\n');
            response.write(`from port ${port} taking ${t} ms for data size ${n}\n\n`);
            response.write(text);
        }
        response.end();
    }, t);
}).listen(port);

var requestStats = require('request-stats')
    requestStats(server, function (stats) {
        // called every time request completes

        report(stats);
        // if (!stats.ok) console.log(stats);
    })

// Console will print the message
console.log('Server running at http://127.0.0.1:%d/', port);
console.log('\n');
console.log('  No Time OK? < Size Method > Size Status');
var count = 1;
function report(s) {
    console.log(sprintf(
            '%4d %4s %3s  %4d %6s %6d %6s',
            ++count, s.time, s.ok?'OK':'ERR', s.req.bytes, s.req.method, s.res.bytes, s.res.status));

    statsD.gauge('reponse.size', s.res.bytes);
    statsD.timing('response.time', s.time);
}

process.on('SIGINT', (code) => {
    console.log(`Exiting with code: ${code}`);
    process.exit(1);
});


process.on('uncaughtException', function(err) {
    // handle the error safely
    console.error(err);
})

process.on('warning', (warning) => {
    console.warn(warning.name);
    console.warn(warning.message);
    console.warn(warning.stack);
});
