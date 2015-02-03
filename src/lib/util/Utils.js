var fs = require('fs');
var path = require('path');
var md5 = require('./md5');
var Shared = require('./Shared');
var mout = require('mout');

function Utils () {
}

Utils._retrieveDynInfo = function (meta, dynlist, replace) {
    if (!meta)
        return;

    function find (jsonKey) {
        if (!meta["_dyn_" + jsonKey])
            return;

        mout.object.forOwn(meta["_dyn_" + jsonKey], function (info, name) {
            if (dynlist[info.source] || !Utils.isDynName(name))
                return;

            dynlist[info.source] = {
                "source": info.source,
                "realName": info.name,
                // maybe should be saved in parent json file with other info
                "canonicalDir": path.join(Shared.componentsDir, info.name)
            };

            // replace dependencies list with resolved values
            if (replace) {
                meta[jsonKey][info.name] = info.source;
                delete meta[jsonKey][name];
            }
        }, this);
    }

    find("dependencies");
    find("devDependencies");
};

/**
 * This method is ( and must be ) invoked  after Resolver _savePkgMeta
 * @param {type} info
 * @param {type} jsonKey
 * @returns {Boolean}
 */
Utils._changeDep = function (info, dynName, jsonKey, logger) {
    var decEndpoint = info.decEndpoint;
    var pkgMeta = decEndpoint.pkgMeta;

    // it shouldn't happen
    // the canonical dir of parent package
    // should always exists
    if (!decEndpoint.canonicalDir) {
        logger.warn('DIRNOTFOUND', "Parent dir about "+info.realName+" package doesn't exists!");
        return;
    }

    // get dependencies object inside json
    var meta = pkgMeta[jsonKey];

    if (!meta || !meta[dynName])
        return false;

    // change dynamic name with resolved
    var tmp = meta[dynName];
    delete meta[dynName];
    meta[info.realName] = tmp;

    // store dynamic name inside a private object to compare next time
    if (typeof pkgMeta["_dyn_" + jsonKey] === 'undefined') {
        pkgMeta["_dyn_" + jsonKey] = {};
    }

    pkgMeta["_dyn_" + jsonKey][dynName] = {"source": tmp, "name": info.realName};

    var json = JSON.stringify(pkgMeta, null, '  ');
    fs.writeFileSync(path.join(decEndpoint.canonicalDir, ".upt.json"), json);

    return true;
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
    return md5((isDyn ? 'dyn-' : 'st-' + name + ':') + Utils.fetchingId(decEndpoint));
};

Utils.fetchingId = function (decEndpoint) {
    return (decEndpoint._originalSource || decEndpoint.source) + '#' + decEndpoint.target;
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

