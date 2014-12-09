'use strict';

process.bin = process.title = 'upt';

var Hw2Core = require('hw2/modules/js/src/kernel');

Hw2Core(function () {
    var Q = require('q');
    var mout = require('mout');
    var Logger = require('bower-logger');
    var osenv = require('osenv');
    var pkg = require('../package.json');
    var upt = require('../src/lib');
    var cli = require('../src/lib/util/cli');
    var rootCheck = require('../src/lib/util/rootCheck');
    var analytics = require('../src/lib/util/analytics');

    var options;
    var renderer;
    var loglevel;
    var command;
    var commandFunc;
    var logger;
    var levels = Logger.LEVELS;

    options = cli.readOptions({
        version: {type: Boolean, shorthand: 'v'},
        help: {type: Boolean, shorthand: 'h'},
        'allow-root': {type: Boolean}
    });

// Handle print of version
    if (options.version) {
        process.stdout.write(pkg.version + '\n');
        process.exit();
    }

// Root check
    rootCheck(options, upt.config);

// Set loglevel
    if (upt.config.silent) {
        loglevel = levels.error;
    } else if (upt.config.verbose) {
        loglevel = -Infinity;
        Q.longStackSupport = true;
    } else if (upt.config.quiet) {
        loglevel = levels.warn;
    } else {
        loglevel = levels[upt.config.loglevel] || levels.info;
    }

// Get the command to execute
    while (options.argv.remain.length) {
        command = options.argv.remain.join(' ');

        // Alias lookup
        if (upt.abbreviations[command]) {
            command = upt.abbreviations[command].replace(/\s/g, '.');
            break;
        }

        command = command.replace(/\s/g, '.');

        // Direct lookup
        if (mout.object.has(upt.commands, command)) {
            break;
        }

        options.argv.remain.pop();
    }

// Ask for Insights on first run.
    analytics.setup(upt.config).then(function () {
        // Execute the command
        commandFunc = command && mout.object.get(upt.commands, command);
        command = command && command.replace(/\./g, ' ');

        // If no command was specified, show upt help
        // Do the same if the command is unknown
        if (!commandFunc) {
            logger = upt.commands.help();
            command = 'help';
            // If the user requested help, show the command's help
            // Do the same if the actual command is a group of other commands (e.g.: cache)
        } else if (options.help || !commandFunc.line) {
            logger = upt.commands.help(command);
            command = 'help';
            // Call the line method
        } else {
            logger = commandFunc.line(process.argv);

            // If the method failed to interpret the process arguments
            // show the command help
            if (!logger) {
                logger = upt.commands.help(command);
                command = 'help';
            }
        }

        // Get the renderer and configure it with the executed command
        renderer = cli.getRenderer(command, logger.json, upt.config);

        logger
                .on('end', function (data) {
                    if (!upt.config.silent && !upt.config.quiet) {
                        renderer.end(data);
                    }
                })
                .on('error', function (err) {
                    if (levels.error >= loglevel) {
                        renderer.error(err);
                    }

                    process.exit(1);
                })
                .on('log', function (log) {
                    if (levels[log.level] >= loglevel) {
                        renderer.log(log);
                    }
                })
                .on('prompt', function (prompt, callback) {
                    renderer.prompt(prompt)
                            .then(function (answer) {
                                callback(answer);
                            });
                });

        // Warn if HOME is not SET
        if (!osenv.home()) {
            logger.warn('no-home', 'HOME not set, user configuration will not be loaded');
        }

        if (upt.config.interactive) {
            var updateNotifier = require('update-notifier');

            // Check for newer version of Upt
            var notifier = updateNotifier({
                packageName: pkg.name,
                packageVersion: pkg.version
            });

            if (notifier.update && levels.info >= loglevel) {
                notifier.notify();
            }
        }
    });

});
