const { group } = require('yargs');

const util = require('../util/id.js');
const groups = {};
const groupMapping = new Map();
groupMapping['all'] = {}; // TODO: Implement adding to this group based on put and add

groups.get = function(name, callback) {
    switch(name) {
        case 'all':
            if (typeof callback == 'function') {
                callback(null, groupMapping);
            }
        default: 
        console.log('default')
            if (groupMapping.hasOwnProperty(name)) {
                if (typeof callback == 'function') {
                    callback(null, groupMapping[name]);
                }
            } else {
                if (typeof callback =='function') {
                    callback(new Error("Group not found"));
                }
            }
    }
};

groups.put = function(config, group, callback) {
    console.log(config)
    groupMapping[config.gid || config] = group;
    // console.log("pre-assignment", global.distribution);
    
    global.distribution[config.gid || config] = {};
    global.distribution[config.gid || config].status = require("../all/status.js")(config);
    global.distribution[config.gid || config].gossip = require("../all/gossip.js")(config);
    global.distribution[config.gid || config].groups = require("../all/groups.js")(config);
    global.distribution[config.gid || config].mem = require("../all/mem.js")(config);
    global.distribution[config.gid || config].routes = require("../all/routes.js")(config);
    global.distribution[config.gid || config].comm = require("../all/comm.js")(config);
    global.distribution[config.gid || config].store = require("../all/store.js")(config);
    global.distribution[config.gid || config].mr = require("../all/mr.js")(config);
    // console.log("post assignment", global.distribution);
    if (typeof callback == 'function') {
        callback(null, group);
    }
};

groups.del = function(name, callback) {
    if(name in groupMapping) {
        let group = groupMapping[name];
        delete groupMapping[name];
        if (typeof callback == 'function') {
            callback(null, group);
        }
    } else {
        if (typeof callback == 'function') {
            callback(new Error('Node not found:',name));
        }
    }
};

groups.add = function(name, node, callback) {
    if (groupMapping.hasOwnProperty(name)) {
        groupMapping[name][util.getSID(node)] = node;
        if (typeof callback == 'function') {
            callback(null, node);
        }
    } else {
        if (typeof callback == 'function') {
            callback(new Error("Group Not Found"));    
        }
    }
};

groups.rem = function(name, node, callback) {
    console.log('Node:',node.toString());
    if (groupMapping.hasOwnProperty(name)) {
        if(groupMapping[name].hasOwnProperty(node)) {
            let deletedNode = groupMapping[name][node];
            delete groupMapping[name][node];
            if (typeof callback == 'function') {
                callback(null, deletedNode);
            }
        } else {
            if (typeof callback == 'function') {
                callback(new Error('Node in group not found'))
            }
        }
    } else {
        if (typeof callback == 'function') {
            callback(new Error("Group Not Found"));
        }
    }
};

module.exports = groups;
