const getID = require('../util/id.js').getID;

const MemMapping = {};

function put(state, configuration, callback) {
    try {
        const gid = configuration? configuration.gid || 'all': 'all';
        const key = configuration? configuration.key || configuration || getID(state) : getID(state);

        
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
    const key = configuration.key || configuration;
    // console.log(key)
    const gid = configuration.gid || 'all';

    if (!(MemMapping.hasOwnProperty(gid))) {
        callback(new Error("Group not found:", gid), null);
        return
    }

    if (!(MemMapping[gid].has(key))) {
        // console.log(MemMapping[gid])
        // console.log(key)
        console.log(MemMapping)
        callback(new Error("[Get] Key not found: " + key), null);
        return;    
    }

    callback(null, MemMapping[gid].get(key));
    return;
}

function del(configuration, callback) {
    const key = configuration.key || configuration || getID(state);
    const gid = configuration.gid || 'all';

    if (!(MemMapping.hasOwnProperty(gid))) {
        callback(new Error("Group not found:", gid), null);
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
            callback(new Error('[Get] Key not found:', key), null);
        }
    }
};

module.exports = {put, get, del};
