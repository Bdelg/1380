// const distribution = require("@brown-ds/distribution");

const status = function(config) {
  const context = {};
  context.gid = config.gid || 'all';

  return {
    // message = args
    // configuration = service & method
    get: (configuration, callback) => {

      callback = callback || function() {};
      global.distribution[context.gid].comm.send([configuration], {service: 'status', method: 'get'}, (e,v) => {
        callback(e,v);
      });
    },

    spawn: (configuration, callback) => {
      callback = callback || function() {};
      global.distribution[context.gid].comm.send([...configuration], {service: 'status', method: 'spawn'}, (e,v) => {
        callback(e,v);
      });
    },

    stop: (callback) => {
      callback = callback || function() {};
      global.distribution[context.gid].comm.send([], {service: 'status', method: 'stop'}, (e,v) => {
        callback(e,v);
      });
    },
  };
};

module.exports = status;
