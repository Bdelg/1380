function mem(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || global.distribution.util.id.naiveHash;

  /* For the distributed mem service, the configuration will
          always be a string */
  return {
    get: (configuration, callback) => {
      if(!configuration) {
        callback(new Error('no key provided'));
        return;
      }

      key = global.distribution.util.id.getID(configuration);
      
      config_to_node(key, context, (e, node) => {
        // console.log(e)
        // console.log(node)
        if (e) {
          callback(e, null);
          return;
        }
        if (!node) {
          callback(new Error("no node found"));
          return;
        }
        // console.log(global.distribution)
        global.distribution.local.comm.send([{gid: context.gid, key: key}], {node:node, service: 'mem', method: 'get'}, (e,v) => {
          // console.log(e)
          callback(e,v)});
      })
    },

    put: (state, configuration, callback) => {
      key = global.distribution.util.id.getID(configuration ? configuration:global.distribution.util.id.getID(state));
      if(!configuration) {
        console.log(key)
      }
      // key = global.distribution.util.id.getID(key);

      config_to_node(key, context, (e, node) => {
        // console.log(node)
        if (e) {
          callback(e, null);
          return;
        }
        if (!node) {
          callback(new Error('no node found'));
          return
        }
        // console.log(global.distribution)
        global.distribution.local.comm.send([state, {gid: context.gid, key: key}], {node:node, service: 'mem', method: 'put'}, (e,v) => {
          // console.log(e)
          // console.log(state);
          // console.log({gid: context.gid, key: key});
          callback(e,v)});
      })
    },

    del: (configuration, callback) => {
      if (!configuration) {
        callback(new Error('no key given'));
        return;
      }
      key = global.distribution.util.id.getID(configuration);
      config_to_node(key, context, (e,node) => {
        if(e) {
          callback(e);
          return;
        }
        if (!node) {
          callback(new Error('Node not found'));
          return;
        }
        global.distribution.local.comm.send([{key: key, gid: context.gid}], {node:node, service: 'mem', method: 'del'}, (e,v) => {
          if (e) {
            callback(e);
            return
          }
          callback(null,v)});
          return;
      })
    },
    reconf: (configuration, callback) => {
    },
  };
};

// helper functionality for mem.all functionilty --> send us to specified node (where we make callback)
function config_to_node(configuration, context, callback) {
  if(!configuration) {
    callback(new Error("No configuration"));
  }
  // key = global.distribution.util.id.getID(configuration);
  key = configuration;
  gid = context.gid;
  // console.log('hi')
  // retrieve nids for all nodes in group
  // console.log(context)
  // console.log(configuration)
  
  global.distribution.local.groups.get(context.gid, (e,group) => {
    if(e) {
      callback(new Error(e.Error()));
      return;
    }
    if(!group) {
      callback(new Error('no group returned for gid'));
      return;
    }
    node_i = context.hash(key, Object.values(group).map((node) => global.distribution.util.id.getNID(node)));
    if(node_i) {
      callback(null, group[node_i.substring(0,5)]);
      return
    }
    callback(new Error('No node retrieved'));
  });
}

module.exports = mem;
