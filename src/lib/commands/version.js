var mout = require('mout');
var semver = require('semver');
var which = require('which');
var fs = require('fs');
var path = require('path');
var Q = require('q');
var execFile = require('child_process').execFile;
var exec = require('child_process').exec;
var Project = require('../core/Project');
var cli = require('../util/cli');
var defaultConfig = require('../config');
var createError = require('../util/createError');
var readJson = require('../util/readJson');
var glob = require('glob');

var maxBuffer = 5000 * 1024;

function version (logger, versionArg, options, config) {
    var project;

    config = mout.object.deepFillIn(config || {}, defaultConfig);
    project = new Project(config, logger);

    if (options.recursive) {
        return searchFolders(process.cwd(), options).then(function (list) {

            var promises = [];
            list.forEach(function (p) {
                promises.push(bump(project, p, versionArg, options));
            });

            return Q.allSettled(promises);
            // alternative to q.all
            // we need to check repo in order to avoid
            // issues with push on same repository branch
            //return promises.slice(1).reduce(Q.when, promises[0]());
        });
    } else {
        return bump(project, process.cwd(), versionArg, options);
    }
}

function bump (project, repoPath, versionArg, options) {
    var newVersion;
    var gitBranch = false;
    project._logger.info('start-working', 'Working on ' + repoPath);
    return checkGit(repoPath, options, project)
            .then(function (branch) {
                gitBranch = branch;
            })
            .then(function () {
                if (!options.skipJson && !options.dryRun) {
                    return getJson(repoPath).then(function (json) {
                        newVersion = getNewVersion(json.version || "0.0.0", versionArg);
                        project._logger.info('version-change', 'Changed version from '
                                + json.version + ' to ' + newVersion + ' and saving to json file');
                        json.version = newVersion;
                        return saveJson(json, repoPath);
                    });
                }
            })
            .then(function () {
                if (!options.dryRun && gitBranch) {
                    return gitCommitAndTag(repoPath, newVersion, options, project)
                            .then(function () {
                                return options.push ? gitPush(repoPath, project, gitBranch) : true;
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
                    return checkGitStatus(checkPath, options, project)
                            .then(function (branch) {
                                return /*options.push ?*/ checkGitPermissions(checkPath, project, branch) /*: true;*/
                            });
                }
                return false;
            }, function () {
                //Ignore not found .git directory
                return false;
            });
}

function checkGitPermissions (checkPath, project, branch) {
    return Q.nfcall(execFile, 'git', ['push', '--dry-run', 'origin', 'HEAD'], {env: process.env, cwd: checkPath, maxBuffer: maxBuffer}).then(function (res) {
        return branch;
    }, function (res) { // fail case
        project._logger.warn('gitpermissions', 'Seems You don\'t have permissions to commit on "' + checkPath + '" or there is an error with remote repository');
        project._logger.error('giterror', res);
        return false;
    });
}


function checkGitStatus (checkPath, options, project) {
    return Q.nfcall(which, 'git')
            .fail(function (err) {
                err.code = 'ENOGIT';
                throw err;
            })
            .then(function () {
                return Q.nfcall(execFile, 'git', ['status', '--porcelain'], {env: process.env, cwd: checkPath, maxBuffer: maxBuffer});
            })
            .then(function (value) {
                var stdout = value[0];
                var lines = filterModifiedStatusLines(stdout);
                if (lines.length && options.checkMod) {
                    throw createError('Git working directory not clean on path "' + checkPath + '" .\n' + lines.join('\n'), 'EWORKINGDIRECTORYDIRTY');
                }

                return Q.nfcall(exec, "git rev-parse --abbrev-ref HEAD", {env: process.env, cwd: checkPath, maxBuffer: maxBuffer})
                        .fail(function (err) {
                            project._logger.error(err);
                            throw createError(err, 'GITERR');
                        })
                        .spread(function (stdout) {
                            if (stdout) {
                                var branch = stdout.replace(/(\n)$/, '');
                                return branch;
                            }

                            return false;
                        });
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

    // it means that you're just trying to push
    // so skip next steps
    if (!options.message && !tag && options.push) {
        return Q.resolve();
    }

    message = options.message || tag;

    message = message.replace(/%s/g, newVersion);

    project._logger.info('gitcommit', 'Committing changes to repository '+repoPath);

    return Q.nfcall(execFile, 'git', ['add', '-A'], {env: process.env, cwd: repoPath, maxBuffer: maxBuffer})
            .then(Q.nfcall(execFile, 'git', ['commit', '-am ' + message], {env: process.env, cwd: repoPath, maxBuffer: maxBuffer}))
            .then(function () {
                if (tag) {
                    return Q.nfcall(execFile, 'git', ['tag', tag, '-am', message], {env: process.env, cwd: repoPath, maxBuffer: maxBuffer});
                }

                return false;
            });
}

function gitPush (repoPath, project, gitBranch) {
    project._logger.info('gitpush', 'Pushing changes on ' + repoPath + ' -> ' + gitBranch);

    return Q.nfcall(execFile, 'git', ['push', 'origin', gitBranch], {env: process.env, cwd: repoPath, maxBuffer: maxBuffer})
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

function searchFolders (dir, options) {
    var pattern = "*/**/+(" + (options.skipJson ? ".git" : ".git|upt.json") + ")";

    return Q.nfcall(glob, pattern, {
        cwd: dir,
        dot: true
    }).then(function (list) {
        var folders = [];
        list.forEach(function (f) {
            folders.push(path.dirname(f));
        });

        // sorting paths from shorter to longer
        folders.sort(function (a, b) {
            return (a.match(/\//g) || []).length - (b.match(/\//g) || []).length; // ASC -> a - b; DESC -> b - a
        });

        return folders;
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
        'dry-run': {type: Boolean, shorthand: 'd'},
        'check-mod': {type: Boolean, shorthand: 'c'}
    }, argv);
};

version.completion = function () {
    // TODO:
};

module.exports = version;
