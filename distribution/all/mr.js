/** @typedef {import("../types").Callback} Callback */
const getID = require('../util/id.js').getID;

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


const MAP = 'map';
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
    map_fn = configuration.map;
    
    if (!map_fn) {
      map_fn = (k,v) => {return (k,v);}
    }

    red_fn = configuration.reduce;

    // 1. Initiate service --> need name mr-id
    mr_id = 'mr-' + getID(Math.random());
    console.log(mr_id);

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
            build_notify(
              {node: global.nodeConfig, mr_id: mr_id}
            ).notify_orchestrator).notify}, 
            mr_id + '-notif', (e,v) => {
              console.log(v);
        // send 
        if(e.length) {
          cb(new Error('oops'));
          return;
        }
        // cb && cb(new Error('not implemented yet'));
        // return;
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
            // once we have the node, we can send it a ping with this key to make it map the value 
            global.distribution.local.comm.send([{cmd: MAP, map_fn:map_fn, keys:[key]}],{node: node, service: mr_id + '-notif', method: 'exec_worker'}, (e,v) => {
              console.log('cb called')
              console.log(e);
              console.log(v);
              cb(e,v)
            });
          })
        }
        // global.distribution[context.gid].comm.send([{cmd: MAP, map_fn: map_fn}, ])
        console.log('worker put success')
      });
    })

  }

  return {exec};
};

function notification_handler(cb) {
  return{
    notify(config) {  
      if (!config) {
        cb(new Error('No configuration object given.'));
        return;
      }
      console.log('hi')
      const fs = require('fs');
      fs.writeFile('./helloworld', 'hiiiii');
      switch(config.cmd){
        case MAP:
          if(!config.map_fn) {
            cb(new Error('[Map cmd] No Mapping Function provided.'));
            return;
          }
          let out = []
          let count = 0;
          for(key in config.keys) {
            global.distribution.local.store.get({gid:config.id, key: key}, (e, file) => {
              if(e) {
                cb && cb(e);
                return;
              }
              c++;
              out.append(config.map_fn(key, file));
              if(count >= config.keys.length) {
                cb && cb(null, out);
              }
            });  
          }
          break;
        default:
          cb(new Error('[Notif Handler] Did not recognize command type'));
      }
    }
  }
}

function build_notify(config) {
  return{ 
    notify_orchestrator: (e, message) => {
      e && console.log(e);
      console.log("made it to send to orch")
      global.distribution.local.comm.send([config.mr_id, message], {node: config.node, service: config.mr_id, method: 'notify'}, (e,v) => {
        // if (e) {
        //   callback && callback(e);
        //   return;
        // }
        // //
        // callback && callback(null, v);
        console.log('done');
      });
    }
  }
}


function notify_me(mr_id, message, key) {
  if (!mr_id in global.distribution.local) {
    global.distribution.local[mr_id] = {};
  }
  global.distribution.local[mr_id][key] = message;
  // for()
}

module.exports = mr;
