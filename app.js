// Note: ChatGPT was used to generate this code.

const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

// Dictionary to store words and definitions
const dictionary = {};
// Initialize totalRequests
let totalRequests = 0;

// HTTP server
const server = http.createServer((req, res) => {
    // Increment totalRequests
    totalRequests++;

    // Parse the URL
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');
    const method = req.method.toUpperCase();

    // Get the query string as an object
    const queryStringObject = parsedUrl.query;
    const decoder = new StringDecoder('utf-8');
    let buffer = '';

    // Get the payload, if any
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });

    // When the request ends
    req.on('end', () => {
        buffer += decoder.end();
        
        // Choose the handler this request should go to
        let chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
        
        // Construct the data object to send to the handler
        const data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': req.headers,
            'payload': buffer
        };

        // Handle CORS here by adding headers
        res.setHeader('Access-Control-Allow-Origin', '*'); // This allows all domains
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // Pre-flight request handling
        if (method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }
        
        // Route the request to the handler specified in the router
        chosenHandler(data, (statusCode, payload) => {
            // Use the status code called back by the handler, or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            payload = typeof(payload) == 'object'? payload : {};

            // Convert the payload to a string
            const payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
        });
    });
});

// Handlers
const handlers = {};

// Definitions handler
handlers.definitions = (data, callback) => {
    // Handle the request
    if (data.method === 'POST') {
        // Add a new word and definition to the dictionary
        const definition = JSON.parse(data.payload);
        // Check if the word already exists
        if (dictionary[definition.word]) {
            // Return a warning message
            callback(200, { message: `Warning! '${definition.word}' already exists.`, totalRequests, totalEntries: Object.keys(dictionary).length });
        // Check if the definition is empty
        } else {
            // Add the new word and definition
            dictionary[definition.word] = definition.definition;
            callback(200, { message: `New entry recorded: "${definition.word} : ${definition.definition}"`, totalRequests, totalEntries: Object.keys(dictionary).length });
        }
    // Handle the GET request
    } else if (data.method === 'GET') {
        // Get the definition of a word
        const word = data.queryStringObject.word;
        // Check if the word exists
        if (dictionary[word]) {
            // Return the definition
            callback(200, { definition: dictionary[word], totalRequests });
        // Return a 404 error
        } else {
            // Return a 404 error
            callback(404, { message: `Request# ${totalRequests}, word '${word}' not found!`, totalRequests });
        }
    }
};

// Not found handler
handlers.notFound = (data, callback) => {
    callback(404);
};

// Router
const router = {
    'api/definitions': handlers.definitions
};

// Start the server
server.listen(3000, () => {
    console.log('The server is running on port 3000');
});
