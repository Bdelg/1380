const getID = require('../util/id.js').getID;

const MemMapping = {};

function put(state, configuration, callback) {
    try {
        const gid = configuration.gid || 'all';
        const key = configuration ? configuration.key || configuration : getID(state);
        // key = getID(key);
        if (!(MemMapping.hasOwnProperty(gid))) {
            MemMapping[gid] = new Map();
        }
        MemMapping[gid].set(key, state);   
        
        if (callback) {
            callback(null, state);
        }
    } catch (e) {
        if (callback) {
            callback(e, null);
        }
    }
};

function get(configuration, callback) {
    if(configuration == null) {
        callback(new Error('[get] no key provided.'), null);
    }
    // const key = getID(configuration.key || configuration);
    const key = configuration.key || configuration;
    // console.log(key)
    const gid = configuration.gid || 'all';
    

    if (!(MemMapping.hasOwnProperty(gid))) {
        callback(new Error("[get] Group not found:"+ gid), null);
        return
    }

    if (!(MemMapping[gid].has(key))) {
        callback(new Error("[Get] Key not found: " + key), null);
        return;    
    }

    callback(null, MemMapping[gid].get(key));
    return;
}

function del(configuration, callback) {
    // const key = getID(configuration.key || configuration);
    const key = configuration.key || configuration;
    const gid = configuration.gid || 'all';

    if (!(MemMapping.hasOwnProperty(gid))) {
        callback(new Error("Group not found:"+ gid), null);
        return
    }

    if (MemMapping[gid].has(key)) {
        const temp = MemMapping[gid].get(key)
        MemMapping[gid].delete(key)
        if (callback) {
            callback(null, temp);
        }
    } else {
        if (callback) {
            callback(new Error('[Del] Key not found:' + key), null);
        }
    }
};

module.exports = {put, get, del};
