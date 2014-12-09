var path = require('path');
var expect = require('expect.js');
var fs = require('fs');

var helpers = require('../helpers');
var upt = helpers.require('lib/index');

describe('upt init', function () {

    var tempDir = helpers.createTmpDir();
    var uptJsonPath = path.join(tempDir, 'upt.json');

    var config = {
        cwd: tempDir,
        interactive: true
    };

    it('generates upt.json file', function () {
        var logger = upt.commands.init(config);

        return helpers.expectEvent(logger, 'prompt')
                .spread(function (prompt, answer) {
                    answer({
                        name: 'test-name',
                        version: 'test-version',
                        description: 'test-description',
                        moduleType: 'test-moduleType',
                        keywords: 'test-keyword',
                        authors: 'test-author',
                        license: 'test-license',
                        homepage: 'test-homepage',
                        private: true
                    });

                    return helpers.expectEvent(logger, 'prompt');
                })
                .spread(function (prompt, answer) {
                    answer({
                        prompt: true
                    });

                    return helpers.expectEvent(logger, 'end');
                })
                .then(function () {
                    expect(fs.existsSync(uptJsonPath)).to.be(true);
                });
    });
});
