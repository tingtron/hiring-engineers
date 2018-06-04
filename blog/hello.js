// hello.js
// usage:
//    nohup node hello.js 8083 &    - start in the background, use jobs, fg etc to switch between

var http = require("http");
var port = process.argv[2] || 8081;

http.createServer(function (request, response) {

   // Send the HTTP header 
   // HTTP Status: 200 : OK
   // Content Type: text/plain
   response.writeHead(200, {'Content-Type': 'text/plain'});
   
   // Send the response body as "Hello World"
   response.write('Hello World\n');
   response.write('from port ' + port + '\n');
   response.end();
}).listen(port);

// Console will print the message
console.log('Server running at http://127.0.0.1:%d/', port);

