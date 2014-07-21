var path = require('path');
var expect = require('expect.js');
var fs = require('fs');

var helpers = require('../helpers');
var upt = helpers.require('lib/index');

describe('upt install', function () {

    var tempDir = helpers.createTmpDir();
    var uptJsonPath = path.join(tempDir, 'upt_components', 'underscore', 'upt.json');

    function uptJson() {
        return JSON.parse(fs.readFileSync(uptJsonPath));
    }

    var config = {
        cwd: tempDir,
        interactive: true
    };

    it.skip('installs a package', function () {
        this.timeout(10000);
        var logger = upt.commands.install(['underscore'], undefined, config);

        return helpers.expectEvent(logger, 'end')
        .then(function () {
            expect(uptJson()).to.have.key('name');
        });
    });

    it.skip('installs package with --save flag', function () {
        var logger = upt.commands.install(['underscore'], {save: true}, config);

        return helpers.expectEvent(logger, 'end')
        .then(function () {
            expect(uptJson()).to.have.key('name');
        });
    });

});
