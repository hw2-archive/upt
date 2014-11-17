var expect = require('expect.js');
var helpers = require('../helpers');
var glob = require('glob');
var Q = require('q');

var removeIgnores = require('../../lib/util/removeIgnores');

describe('removeIgnores', function () {

    var tempDir = helpers.createTmpDir({
        'upt.json': {},
        'index.js': 'Not to ignore',
        'node_modules/underscore/index.js': 'Should be ignored'
    });

    var ignoreTest = function(dir, meta, leftovers) {
        var deferred = Q.defer();

        removeIgnores(dir, meta).then(function() {
            glob('**/*.*', { cwd: dir }, function(cb, files) {
                expect(files).to.eql(leftovers);
                deferred.resolve();
            });
        });

        return deferred.promise;
    };

    it('removes all files in directory', function () {
        return ignoreTest(tempDir,
            { ignore: [ 'node_modules/**/*' ] },
            [ 'upt.json', 'index.js' ]
        );
    });

    it('removes whole directory', function () {
        return ignoreTest(tempDir,
            { ignore: [ 'node_modules/' ] },
            [ 'upt.json', 'index.js' ]
        );
    });

    it('removes whole directory (no ending slash)', function () {
        return ignoreTest(tempDir,
            { ignore: [ 'node_modules' ] },
            [ 'upt.json', 'index.js' ]
        );
    });

    it('removes all but one file', function() {
        return ignoreTest(tempDir,
            { ignore: [ '**/*', '!upt.json' ] },
            [ 'upt.json' ]
        );
    });

    it('refuses to ignore upt.json', function() {
        return ignoreTest(tempDir,
            { ignore: [ '**/*', '!index.js' ] },
            [ 'upt.json', 'index.js' ]
        );
    });

    it('removes all but one file deep down the tree', function() {
        return ignoreTest(tempDir,
            { ignore: [ '**/*', '!node_modules/underscore/index.js' ] },
            [
                'upt.json',
                'node_modules/underscore/index.js'
            ]
        );
    });
});
