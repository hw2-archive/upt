var mout = require('mout');
var semver = require('semver');
var which = require('which');
var fs = require('fs');
var path = require('path');
var Q = require('q');
var execFile = require('child_process').execFile;
var Project = require('../core/Project');
var cli = require('../util/cli');
var defaultConfig = require('../config');
var createError = require('../util/createError');
var readJson = require('../util/readJson');

function version (logger, versionArg, options, config) {
    var project;

    config = mout.object.deepFillIn(config || {}, defaultConfig);
    project = new Project(config, logger);

    if (options.recursive) {
        return getInstalled(options, config, logger).then(function (list) {
            var promises = [];
            list.forEach(function (p) {
                promises.push(bump(project, p, versionArg, options));
            });

            return Q.all(promises);
        });
    } else {
        return bump(project, process.cwd(), versionArg, options);
    }
}

function bump (project, repoPath, versionArg, options) {
    var newVersion;
    var doGitCommit = false;

    return checkGit(repoPath, options, project)
            .then(function (hasGit) {
                doGitCommit = hasGit;
            })
            .then(function () {
                if (!options.skipJson) {
                    return getJson(repoPath).then(function (json) {
                        newVersion = getNewVersion(json.version || "0.0.0", versionArg);
                        project._logger.info('version-change', 'Changed version from '
                                + json.version+' to '+newVersion+ ' and saving to json file');
                        json.version = newVersion;
                        return saveJson(json, repoPath);
                    });
                }
            })
            .then(function () {
                if (!options.dryRun && doGitCommit) {
                    return gitCommitAndTag(repoPath, newVersion, options, project)
                            .then(function () {
                                return options.push ? gitPush(repoPath) : true;
                            });
                }
            });
}

function getNewVersion (currentVersion, versionArg) {
    var newVersion = semver.valid(versionArg);
    if (!newVersion) {
        newVersion = semver.inc(currentVersion, versionArg);
    }
    if (!newVersion) {
        throw createError('Invalid version argument: `' + versionArg + '`. Usage: `upt version [<newversion> | major | minor | patch]`', 'EINVALIDVERSION');
    }
    if (currentVersion === newVersion) {
        throw createError('Version not changed', 'EVERSIONNOTCHANGED');
    }
    return newVersion;
}

function checkGit (checkPath, options, project) {
    var gitDir = path.join(checkPath, '.git');
    return Q.nfcall(fs.stat, gitDir)
            .then(function (stat) {
                if (stat.isDirectory()) {
                    return checkGitStatus(checkPath).then(function (res) {
                        return /*options.push ?*/ checkGitPermissions(checkPath, project) /*: true;*/
                    });
                }
                return false;
            }, function () {
                //Ignore not found .git directory
                return false;
            });
}

function checkGitPermissions (checkPath, project) {
    return Q.nfcall(execFile, 'git', ['push', '--dry-run'], {env: process.env, cwd: checkPath}).then(function (res) {
        return true;
    }, function (res) { // fail case
        project._logger.warn('gitpermissions', 'You don\'t have permissions to commit on "' + checkPath + '"');
        return false;
    });
}


function checkGitStatus (checkPath) {
    return Q.nfcall(which, 'git')
            .fail(function (err) {
                err.code = 'ENOGIT';
                throw err;
            })
            .then(function () {
                return Q.nfcall(execFile, 'git', ['status', '--porcelain'], {env: process.env, cwd: checkPath});
            })
            .then(function (value) {
                var stdout = value[0];
                var lines = filterModifiedStatusLines(stdout);
                if (lines.length) {
                    throw createError('Git working directory not clean on path "' + checkPath + '" .\n' + lines.join('\n'), 'EWORKINGDIRECTORYDIRTY');
                }
                return true;
            });
}

function filterModifiedStatusLines (stdout) {
    return stdout.trim().split('\n')
            .filter(function (line) {
                return line.trim() && !line.match(/^\?\? /);
            }).map(function (line) {
        return line.trim();
    });
}

function gitCommitAndTag (repoPath, newVersion, options, project) {
    var tag;
    var message;

    if (newVersion)
        tag = 'v' + newVersion;

    message = options.message || tag;

    if (!message) {
        throw createError("Without version number in json you must specify a commit message!", ENOCOMMITMESSAGE);
    }

    message = message.replace(/%s/g, newVersion);

    project._logger.info('gitcommit', 'Committing changes to repository');

    return Q.nfcall(execFile, 'git', ['add', 'upt.json'], {env: process.env, cwd: repoPath})
            .then(function () {
                return Q.nfcall(execFile, 'git', ['commit', '-m', message], {env: process.env, cwd: repoPath});
            })
            .then(function () {
                if (tag) {
                    return Q.nfcall(execFile, 'git', ['tag', tag, '-am', message], {env: process.env, cwd: repoPath});
                }
            });
}

function gitPush (repoPath, project) {
    project._logger.info('gitcommit', 'Pushing changes on ' + repoPath);

    return Q.nfcall(execFile, 'git', ['push'], {env: process.env, cwd: repoPath})
            .then(function (res) {
                return true;
            }, function (res) { // fail case
                throw createError(res);
            });
}

function saveJson (json, rPath) {
    var file;
    var jsonStr = JSON.stringify(json, null, '  ') + '\n';

    file = path.join(rPath, 'upt.json');
    return Q.nfcall(fs.writeFile, file, jsonStr);
}

function getJson (rPath) {
    return readJson(rPath)
            .spread(function (pkgMeta, deprecated, assumed) {
                return pkgMeta;
            });
}

function getInstalled (options, config, logger) {
    var project;

    options = options || {};

    // Make relative option true by default when used with paths
    if (options.paths && options.relative == null) {
        options.relative = true;
    }

    config = mout.object.deepFillIn(config || {}, defaultConfig);
    project = new Project(config, logger);

    return project.getTree(options).spread(function (tree, flattened) {
        var installed = [];
        // Relativize paths
        // Also normalize paths on windows
        project.walkTree(tree, function (node) {
            if (node.missing) {
                return;
            }

            if (options.relative) {
                node.canonicalDir = path.relative(config.cwd, node.canonicalDir);
            }
            if (options.paths) {
                node.canonicalDir = normalize(node.canonicalDir);
            }
        }, true);

        // Note that we need to to parse the flattened tree because it might
        // contain additional packages
        mout.object.forOwn(flattened, function (node) {
            if (node.missing) {
                return;
            }

            if (options.relative) {
                node.canonicalDir = path.relative(config.cwd, node.canonicalDir);
            }
            if (options.paths) {
                node.canonicalDir = normalize(node.canonicalDir);
            }

            installed.push(node.canonicalDir);
        });

        return installed;
    });
}

// -------------------

version.line = function (logger, argv) {
    var options = version.options(argv);
    return version(logger, options.argv.remain[1], options);
};

version.options = function (argv) {
    return cli.readOptions({
        'message': {type: String, shorthand: 'm'},
        'recursive': {type: Boolean, shorthand: 'R'},
        'push': {type: Boolean, shorthand: 'P'},
        'skip-json': {type: Boolean},
        'dry-run': {type: Boolean, shorthand: 'd'}
    }, argv);
};

version.completion = function () {
    // TODO:
};

module.exports = version;
