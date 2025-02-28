/** @typedef {import("../types").Callback} Callback */

const routes = {}
const RoutesMap = new Map();

/**
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function get(configuration, callback) {
    try {
        if (typeof configuration == 'string') {
            if (configuration in RoutesMap) {
                if (RoutesMap[configuration] === undefined) {
                    // console.log("returning string cfg")
                    callback(new Error('Configuration is undefined'), null);
                    return;
                }
                // console.log("returning string cfg")
                // console.log(RoutesMap)
                callback(null, RoutesMap[configuration]);
                return;
            }
            // console.log("rpc callback");
            const rpc = global.toLocal[configuration];
            if (rpc) {
                // console.log("found you")
                callback(null, { call: rpc });
                // console.log("called back");
                return;
            } else {
                // console.log("never together");
                callback(new Error(`Service ${configuration} not found!`));
                return;
            }
            // callback(new Error("Configuration not found"), null);
        } else if (typeof configuration == 'object') {
            // console.log("obj")
            // console.log(configuration.service in global.distribution[configuration.gid])
            if (configuration.service in global.distribution[configuration.gid]) {
                if (global.distribution[configuration.gid] === undefined) {
                    callback(new Error('Configuration is undefined'), null);
                    return;
                }
                callback(null, global.distribution[configuration.gid][configuration.service]);
                return;
            } else {
                const rpc = global.toLocal[configuration.serviceName];
                if (rpc) {
                    callback(null, { call: rpc });
                    return;
                } else {
                    callback(new Error(`Service ${configuration.serviceName} not found!!`));
                    return;
                    }
            }
            callback(new Error("Configuration not found"), null);
            return;
        }
        callback(new Error("Type of configuration unknown:", typeof configuration));
    } catch (e) {
        callback(e);
    }
}

/**
 * @param {object} service
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function put(service, configuration, callback) {
    if (configuration != undefined | null | '') {
        RoutesMap[configuration] = service;
        if (typeof callback === 'function') {
            callback(RoutesMap, configuration);
            return;
        }  
    }
    if (typeof callback === 'function') {
        callback(new Error("Configuration identifier is not defined"),null);
    }
    return
}

/**
 * @param {string} configuration
 * @param {Callback} callback
 */
function rem(configuration, callback) {
    try {
        if (configuration in RoutesMap) {
            delete RoutesMap[configuration];
            if (typeof callback === 'function') {
                callback(null, configuration);
            return;
        }
    }
    } catch (e) {
        if (typeof callback === 'function') {
            callback(e, null);
            return;
        }
    }
    return;
};

module.exports = {get, put, rem};
