/** @typedef {import("../types").Callback} Callback */

// const distribution = require("../../config.js");
const node = require("../local/node");

/**
 * NOTE: This Target is slightly different from local.all.Target
 * @typdef {Object} Target
 * @property {string} service
 * @property {string} method
 */

/**
 * @param {object} config
 * @return {object}
 */
function comm(config) {
  const context = {};
  context.gid = config.gid || 'all';

  /**
   * @param {Array} message
   * @param {object} configuration
   * @param {Callback} callback
   */
  function send(message, configuration, callback) {
    console.log(configuration)
    console.log(message)
    console.log(context.gid)
    require("../local/groups.js").get(context.gid, (e, nodes) => {
      console.log("nodes", nodes);
      if (e) {
        callback(e);
      }

      const lim = Object.keys(nodes).length;
      let counter = 0;
      let nodeToError = new Map();
      let nodeToResponse = new Map();

      for (sillygoose of Object.keys(nodes)) {
        require("../local/comm.js").send(message, {node: nodes[sillygoose]}, (e,v) => {
          counter++;
          if(e) {
            nodeToError.set(sillygoose, e);
          }
          if (v) {
            nodeToResponse.set(sillygoose, v);
          }
          if (counter == lim) {
            callback(nodeToError.size?nodeToError:null, 
              nodeToResponse.size?nodeToResponse:null);
          }
        });
      }
    });
  }
  return {send};
};

module.exports = comm;
