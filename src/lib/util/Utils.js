var fs = require('fs');
var path = require('path');
var md5 = require('./md5');

function Utils () {
}

Utils.findDyn = function (jsonKey, name, source, jsonPath) {
    var res = "";
    var jsonPath = path.join(jsonPath, ".upt.json");
    if (fs.existsSync(jsonPath)) {
        var localMeta = require(jsonPath);
        if (localMeta["_dyn_" + jsonKey] !== undefined
                && localMeta["_dyn_" + jsonKey][name] !== undefined
                && localMeta["_dyn_" + jsonKey][name]["source"] === source
                ) {
            res = localMeta["_dyn_" + jsonKey][name]["name"] || "";
        }
    }

    return res;
};

Utils.isDynName = function (name) {
    return name && (name[0] === "%" || name[0] === ":");
};

/**
 * 
 * @param {type} decEndpoint
 * @param {type} name if not specified, will be used that one from decEndpoint
 * @returns {unresolved}
 */
Utils.uniqueId = function (decEndpoint, name) {
    name = (name != "" && name) || decEndpoint.name;

    var isDyn = decEndpoint._dynSrc || Utils.isDynName(name);

    // add a custom prefix to avoid collisions
    return md5((isDyn ? 'dyn-' : 'st-' + name + ':') + (decEndpoint._originalSource || decEndpoint.source) + '#' + decEndpoint.target);
};

Utils.fetchingId = function (decEndpoint) {
    return decEndpoint._originalSource || decEndpoint.source;
};

Utils.resolvedId = function (decEndpoint) {
    var name = decEndpoint.name;

    if (Utils.isDynName(name) || !name) {
        return "%"; // dynamic flag
    }

    return name;
};

/**
 * 
 * @param {type} decEndpoint
 * @param {type} name if not specified, will be used that one from decEndpoint for uniqueid
 * @returns {unresolved}
 */
Utils.getGuid = function (decEndpoint, name) {
    return {
        id: Utils.uniqueId(decEndpoint, name),
        fId: Utils.fetchingId(decEndpoint),
        rId: Utils.resolvedId(decEndpoint)
    };
};

module.exports = Utils;

