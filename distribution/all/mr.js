/** @typedef {import("../types").Callback} Callback */
const getID = require('../util/id.js').getID;
const getNID = require('../util/id.js').getNID;
const log = require('../util/log.js');

/**
 * Map functions used for mapreduce
 * @callback Mapper
 * @param {any} key
 * @param {any} value
 * @returns {object[]}
 */

/**
 * Reduce functions used for mapreduce
 * @callback Reducer
 * @param {any} key
 * @param {Array} value
 * @returns {object}
 */

/**
 * @typedef {Object} MRConfig
 * @property {Mapper} map
 * @property {Reducer} reduce
 * @property {string[]} keys
 */


const MAP = 'MAP';
const SET_MAP = 'set_map';
const GET_STATUS = 'get_status';

const STATUS_MAP_READY = 'map_ready';
const STATUS_MAP_NOT_READY = 'map_not_ready';
const STATUS_MAP_COMPLETE = 'map_complete';
const STATUS_RED_READY = 'red_ready';
const STATUS_RED_NOT_READY = 'red_not_ready';
const STATUS_RED_COMPLETE = 'red_complete';

/*
  Note: The only method explicitly exposed in the `mr` service is `exec`.
  Other methods, such as `map`, `shuffle`, and `reduce`, should be dynamically
  installed on the remote nodes and not necessarily exposed to the user.
*/

function mr(config) {
  const context = {
    gid: config.gid || 'all',
  };

  /**
   * @param {MRConfig} configuration
   * @param {Callback} cb
   * @return {void}
   */
  function exec(configuration, cb) {
    if (!configuration) {
      cb(new Error("[MR] No configuration object given."));
    }

    if (!configuration.keys) {
      cb(new Error("[MR] No keys given."));
    }
    const map_fn = configuration.map;
    
    if (!map_fn) {
      map_fn = (k,v) => {return (k,v);}
    }

    const red_fn = configuration.reduce;

    // 1. Initiate service --> need name mr-id
    const mr_id = 'mr-' + getID(Math.random());
    // console.log(mr_id);

    // place orchestrator notify handler for messages from workers
    global.distribution.local.routes.put({notify: notify_me}, mr_id, (e,v) => {
      if (e) {
        cb(new Error('[ORCH: setup] Failed to put internal notify in route: ' + e.message));
        return;
      }
      console.log('orch put success')

      // place notify handler on all workers to receive commands from orchestrators
      global.distribution[context.gid].routes.put(
        {exec_worker: 
          notification_handler(
            ).notify}, 
            mr_id + '-notif', (e,v) => {
        // send 
        if(e.length) {
          cb(new Error('oops'));
          return;
        }
        let count = 0;
        for (const k in configuration.keys) {
          console.log(configuration.keys);
          const key = configuration.keys[k]
          
          // iterate through keys, choose hash and send to individual nodes
          global.distribution[context.gid].store.get_node(key, (e,node) => {
            if(e) {
              cb && cb(e);
              return;
            }
            console.log(node);
            console.log(key);
            out =[];
            // once we have the node, we can send it a ping with this key to make it map the value 
            global.distribution.local.comm.send([{cmd: MAP, map_fn:map_fn, keys:[key], node: node, id: mr_id, gid: context.gid}],
                {node: node, service: mr_id + '-notif', method: 'exec_worker'}, (e,v) => {
              out.push(v);
              console.log(e);
              console.log(v);
              // cb(null, v);
              // count += v[0].length;
              count++;
              if(count >= configuration.keys.length) {
                console.log('done')
                cb(null, out);
              }
            });
          });
        }
      });
    });
  }

  return {exec};
};

// function in the worker which can get called on by the orchestrator to start particular steps.
function notification_handler() {
  function notify(config, callback) {  
    if (!config) {
      console.log('done... error local store get');
      callback && callback(new Error("[WORK call] No configuration object given."));
      return;
    }
    switch(config.cmd){
      case 'MAP':
        if(!config.map_fn) {
          callback && callback(new Error("[WORK call] no Mapping function provided."))
          return;
        }
        let out = []
        let count = 0;
        for(const key in config.keys) {
          // get original value
          global.distribution.local.store.get({gid:config.gid, key: config.keys[key]}, (e, file) => {
            if(e) {
              callback && callback(new Error("[WORK call]: "  + " Error in local store get: " + e.message))
              return;
            }
            count++;
            // map and locally store values
            out.push(config.map_fn(key, file));
            if(count >= config.keys.length) {
              let sendCount = 0;
              // when finished, for each kv, send to corresponding node (shuffle)
              for (const kv in out) {
                for (const objKey in out[kv]) {
                  global.distribution[config.gid].store.get_node(objKey, (e, node) => { // get corresponding node
                    if (e) {
                      callback && callback(new Error("[WORK call]: " + "Error in local store get node after mapping: " + e.message));
                      return;
                    }
                    global.distribution.local.comm.send([out[kv][objKey], {key: config.id + "-mapped", gid: config.gid}, objKey], {node: node, service: 'store', method: 'append'}, (e,v) => {
                      if (e) {
                        callback && callback(new Error('[WORK call]: ' + "Error in local store append: " + e.message));
                        return;
                      }
                      sendCount++;
                      if (sendCount >= out.length) {
                        callback && callback(null, out);
                      }
                    });
                  });
                }
              }
              // global.distribution.local.comm.send([config.id, 'MAPPED'], {node: config.node, service: config.id, method: 'notify'}, (e,v) => {
              //   callback && callback(null, out);
              // });
            }
          });  
        }
        break;
      default:
        cb(new Error('[Notif Handler] Did not recognize command type'));
    }
  }
  return {notify: notify};
}

// function build_notify(config) {
//   return{ 
//     notify_orchestrator: (e, message) => {
//       e && console.log(e);
//       console.log("made it to send to orch")
//       global.distribution.local.comm.send([config.mr_id, message], {node: config.node, service: config.mr_id, method: 'notify'}, (e,v) => {
//         // if (e) {
//         //   callback && callback(e);
//         //   return;
//         // }
//         // //
//         // callback && callback(null, v);
//         console.log('done');
//       });
//     }
//   }
// }


function notify_me(mr_id, message, key) {
  console.log('notifying myself');
  // if (!"local" in global.distribution) {
  //   global.distribution.local = {};
  // }
  // if (!mr_id in global.distribution.local) {
  //   global.distribution.local[mr_id] = {};
  // }
  // global.distribution.local[mr_id][key] = message;
  // console.log(global.distribution.local[mr_id]);
  // for()
}

module.exports = mr;