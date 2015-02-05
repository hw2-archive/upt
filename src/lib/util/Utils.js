var fs = require('fs');
var path = require('path');
var md5 = require('./md5');
var Shared = require('./Shared');
var mout = require('mout');
var readJson = require('./readJson');
var createError = require('../util/createError');

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

    var installedPath = decEndpoint.root && decEndpoint.canonicalDir || path.join(Shared.componentsDir, decEndpoint.name);

    // it shouldn't happen
    // the canonical dir of parent package
    // should always exists
    if (!decEndpoint.canonicalDir || !installedPath) {
        throw createError("Parent dir related to " + info.realName + " package doesn't exists!", 'DIRNOTFOUND');
    }

    if (!pkgMeta[jsonKey])
        return false;

    function replaceDep (name) {
        var tmp = pkgMeta[jsonKey][name];
        delete pkgMeta[jsonKey][name];
        pkgMeta[jsonKey][info.realName] = tmp;

        return tmp;
    }

    if (pkgMeta[jsonKey][dynName]) {
        var source = replaceDep(dynName);

        // store dynamic name inside a private object to compare next time
        pkgMeta["_dyn_" + jsonKey] = pkgMeta["_dyn_" + jsonKey] || {};

        pkgMeta["_dyn_" + jsonKey][dynName] = {"source": source, "name": info.realName};
        // if it was already resolved but 
        // data has been changed, then replace
    } else if (pkgMeta["_dyn_" + jsonKey][dynName]
            && pkgMeta["_dyn_" + jsonKey][dynName].name !== info.realName) {
        replaceDep(pkgMeta["_dyn_" + jsonKey][dynName].name);
        pkgMeta["_dyn_" + jsonKey][dynName].name = info.realName;
    } else {
        return false;
    }

    var json = JSON.stringify(pkgMeta, null, '  ');

    // condition needed when cache is not available
    if (installedPath !== decEndpoint.canonicalDir && fs.existsSync(installedPath))
        fs.writeFileSync(path.join(installedPath, ".upt.json"), json);

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

Utils.readPkgMeta = function (dir) {
    var filename = path.join(dir, '.upt.json');

    return readJson(filename)
            .spread(function (json) {
                return json;
            });
};

module.exports = Utils;

