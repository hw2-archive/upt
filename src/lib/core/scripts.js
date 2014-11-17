var mout = require('mout');
var cmd = require('../util/cmd');
var Q = require('q');
var fs = require('fs');
var path = require('path');
var shellquote = require('shell-quote');

var orderByDependencies = function (packages, installed, json) {
    var ordered = [];
    installed = mout.object.keys(installed);

    var depsSatisfied = function (packageName) {
        return mout.array.difference(mout.object.keys(packages[packageName].dependencies), installed, ordered).length === 0;
    };

    var depsFromUptJson = json && json.dependencies ? mout.object.keys(json.dependencies) : [];
    var packageNames = mout.object.keys(packages);

    //get the list of the packages that are specified in upt.json in that order
    //its nice to maintain that order for users
    var desiredOrder = mout.array.intersection(depsFromUptJson, packageNames);
    //then add to the end any remaining packages that werent in upt.json
    desiredOrder = desiredOrder.concat(mout.array.difference(packageNames, desiredOrder));

    //the desired order isn't necessarily a correct dependency specific order
    //so we ensure that below
    var resolvedOne = true;
    while (resolvedOne) {

        resolvedOne = false;

        for (var i = 0; i < desiredOrder.length; i++) {
            var packageName = desiredOrder[i];
            if (depsSatisfied(packageName)) {
                ordered.push(packageName);
                mout.array.remove(desiredOrder, packageName);
                //as soon as we resolve a package start the loop again
                resolvedOne = true;
                break;
            }
        }

        if (!resolvedOne && desiredOrder.length > 0) {
            //if we're here then some package(s) doesn't have all its deps satisified
            //so lets just jam those names on the end
            ordered = ordered.concat(desiredOrder);
        }

    }

    return ordered;
};

var run = function (cmdString, action, logger, config) {
    logger.action(action, cmdString);

    //pass env + UPT_PID so callees can identify a preinstall+postinstall from the same upt instance
    var env = mout.object.mixIn({ 'UPT_PID': process.pid }, process.env);
    var args = shellquote.parse(cmdString, env);
    var cmdName = args[0];
    mout.array.remove(args, cmdName); //no rest() in mout

    var options = {
        cwd: config.cwd,
        env: env
    };

    var promise = cmd(cmdName, args, options);

    promise.progress(function (progress) {
        progress.split('\n').forEach(function (line) {
            if (line) {
                logger.action(action, line);
            }
        });
    });

    return promise;
};

var hook = function (action, ordered, config, logger, packages, installed, json) {
    if (mout.object.keys(packages).length === 0) {
        return Q();
    }

    var orderedPackages = ordered ? orderByDependencies(packages, installed, json) : mout.object.keys(packages);

    var that = this;

    var hooks=[];
    // RUN hook scripts
    orderedPackages.forEach(function(pkg){
        // postresolved is not handled here
        var curDir=( action=="preinstall" ? packages[pkg].canonicalDir : path.join(config.cwd,config.directory,pkg) );
        var script = path.join(curDir,"_upt/installer_hook.js");

        if (fs.existsSync(script)) {
            // maybe we should create a child fork for it instead requiring ?
            hooks.push(hookScript(script, action, config, pkg, curDir, packages[pkg], installed[pkg]));
        };
    });

    return Q.allSettled(hooks)
    .then(function (results) {
        results.forEach(function (result) {
            if (result.state !== "fulfilled") {
                console.log("Hook Rejected: ",result.reason);
            }
        });

        if (!config.scripts || !config.scripts[action]) {
            /*jshint newcap: false  */
            return Q();
        }

        var cmdString = mout.string.replace(config.scripts[action], '%', orderedPackages.join(' '));
        return run(cmdString, action, logger, config);
    });
};

/**
 * It's a special event, it's called as soon as the package has been resolved ( not at end of all resolving processes )
 * and it's called only for hookScripts not hook Commands
 */
var postresolved = function (config, pkgName, pkgPath, pkgMeta) {
    var script = path.join(pkgPath, "_upt/installer_hook.js");
    hookScript(script, "postresolved", config, pkgName, pkgPath, pkgMeta);
};

var hookScript = function (script, action, config, pkg, curDir, package, installed) {
    return Q.fcall(function () {
        var deferred = Q.defer();
        require(script)(action, config, pkg, curDir, package, installed, deferred.resolve);
        return deferred.promise;
    }.bind(action, config, pkg, curDir, package, installed));
};

module.exports = {
    preuninstall: mout.function.partial(hook, 'preuninstall', false),
    preinstall: mout.function.partial(hook, 'preinstall', true),
    postinstall: mout.function.partial(hook, 'postinstall', true),
    postresolved: postresolved,
    hookScript: hookScript,
    //only exposed for test
    _orderByDependencies: orderByDependencies
};