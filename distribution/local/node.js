const http = require('http');
const url = require('url');
const log = require('../util/log');

const { serialize, deserialize } = require('../util/serialization');
const routes = require('./routes');
const { parserConfiguration } = require('yargs');
// const { status } = require('./status');

/*
    The start function will be called to start your node.
    It will take a callback as an argument.
    After your node has booted, you should call the callback.
*/


const start = function(callback) {
  const server = http.createServer((req, res) => {
    /* Your server will be listening for PUT requests. */

    // Write some code...


    /*
      The path of the http request will determine the service to be used.
      The url will have the form: http://node_ip:node_port/service/method
    */


    // Write some code...


    /*

      A common pattern in handling HTTP requests in Node.js is to have a
      subroutine that collects all the data chunks belonging to the same
      request. These chunks are aggregated into a body variable.

      When the req.on('end') event is emitted, it signifies that all data from
      the request has been received. Typically, this data is in the form of a
      string. To work with this data in a structured format, it is often parsed
      into a JSON object using JSON.parse(body), provided the data is in JSON
      format.

      Our nodes expect data in JSON format.
  */

    // Write some code...

    let body = [];

    req.on('data', (chunk) => {
    });


    parsedUrl = url.parse(req.url, true);
    pathName = parsedUrl.pathname;
    splitPath = pathName.split('/').filter((s) => s !== '');
    gid = splitPath[0];
    service = splitPath[1];
    // console.log(`service: ${service}`)
    method = splitPath[2];
    // console.log(method)
    let message = '';
    req.on('data', (chunk) => {
      message += chunk;
    });

    req.on('end', () => {

      /* Here, you can handle the service requests.
      Use the local routes service to get the service you need to call.
      You need to call the service with the method and arguments provided in the request.
      Then, you need to serialize the result and send it back to the caller.
<<<<<<< Updated upstream
      */

      // Write some code...

      args = deserialize(message);
      // console.log(`args: ${args}`);
      /*
      The path of the http request will determine the service to be used.
      The url will have the form: http://node_ip:node_port/service/method

      */

      config = (gid == "local") ? service : {gid: gid, service: service}

      routes.get(config, (error, value) => {
        
        // console.log([error, value])
        // console.log(serialize([error, value]));
        if (error) {
          res.statusCode = 400;
          // console.log([serialize(error),null])
          res.end(serialize([error,value]));
        } else {
          res.statusCode = 200;
          if(value[method]) {
            value[method](...args, (e,v) => {
              res.end(serialize([e, v]));
            });
          } else {
            res.end(serialize([new Error('Method not found'), null]));
          }
        }
        
        
        
        // if (error) {
        //   console.log(`error: ${error}; service; ${service}; method: ${method}`);
        //   res.statusCode = 400;
        //   console.log(serialize(error))
        //   res.end(serialize(error));
        //   return;
        // } else {
        //   console.log(`value: ${value[method]}`);
        //   if (value[method]) {
        //     serialize(value[method](...args, (e,v) => {
        //       if (e) {
        //         console.log(`error: ${e}`);
        //         res.statusCode = 500;
        //         res.end(serialize(e));
        //         return;
        //       }
        //       res.statusCode = 200;
        //       console.log(`success: ${v}`);
        //       res.end(serialize(v));
        //       res.error
        //       return
        //   }));
        //   } else {
        //     res.statusCode = 400;
        //     res.end(serialize(new Error('Method not found')));
        //     return;
        //   }
        // }
      });
    });
    req.on('error', (error) => {
      console.error(error);
    });
  });


  /*
    Your server will be listening on the port and ip specified in the config
    You'll be calling the `callback` callback when your server has successfully
    started.

    At some point, we'll be adding the ability to stop a node
    remotely through the service interface.
  */

  server.listen(global.nodeConfig.port, global.nodeConfig.ip, () => {
    log(`Server running at http://${global.nodeConfig.ip}:${global.nodeConfig.port}/`);
    global.distribution.node.server = server;
    callback(server);
  });

  server.on('error', (error) => {
    // server.close();
    log(`Server error: ${error}`);
    throw error;
  });
};

module.exports = {
  start: start,
};
