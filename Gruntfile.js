'use strict';
module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            files: [
                'Gruntfile.js',
                'bin/*',
                'src/lib/**/*.js',
                'src/test/**/*.js',
                '!src/test/assets/**/*',
                '!src/test/reports/**/*',
                '!src/test/tmp/**/*'
            ]
        },
        simplemocha: {
            options: {
                reporter: 'spec',
                timeout: '5000'
            },
            full: {
                src: ['src/test/test.js']
            },
            short: {
                options: {
                    reporter: 'dot'
                },
                src: ['src/test/test.js']
            }
        },
        exec: {
            assets: {
                command: 'node src/test/packages.js && node src/test/packages-svn.js'
            },
            'assets-force': {
                command: 'node src/test/packages.js --force && node src/test/packages-svn.js --force'
            },
            cover: {
                command: 'STRICT_REQUIRE=1 node node_modules/istanbul/lib/cli.js cover --dir ./src/test/reports node_modules/mocha/bin/_mocha -- -R dot src/test/test.js'
            },
            coveralls: {
                command: 'node node_modules/.bin/coveralls < src/test/reports/lcov.info'
            }
        },
        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['jshint', 'simplemocha:short']
        }
    });

    grunt.registerTask('assets', ['exec:assets-force']);
    grunt.registerTask('test', ['jshint', 'exec:assets', 'simplemocha:full']);
    grunt.registerTask('cover', 'exec:cover');
    grunt.registerTask('travis', ['jshint', 'exec:assets', 'exec:cover', 'exec:coveralls']);
    grunt.registerTask('default', 'test');
};
