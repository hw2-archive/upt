var path = require('path');
var expect = require('expect.js');
var fs = require('fs');

var helpers = require('../helpers');
var upt = helpers.require('lib/index');

describe('upt uninstall', function () {

    var tempDir = helpers.createTmpDir({
        'upt.json': {
            name: 'hello-world',
            dependencies: {
                'underscore': '*'
            }
        }
    });

    var uptJsonPath = path.join(tempDir, 'upt.json');

    function uptJson () {
        return JSON.parse(fs.readFileSync(uptJsonPath));
    }

    var config = {
        cwd: tempDir,
        interactive: true
    };

    it('does not remove anything from dependencies by default', function () {
        var logger = upt.commands.uninstall(['underscore'], undefined, config);

        return helpers.expectEvent(logger, 'end')
                .then(function () {
                    expect(uptJson().dependencies).to.eql({'underscore': '*'});
                });
    });

    it('removes dependency from upt.json if --save flag is used', function () {
        var logger = upt.commands.uninstall(['underscore'], {save: true}, config);

        return helpers.expectEvent(logger, 'end')
                .then(function () {
                    expect(uptJson().dependencies).to.eql({});
                });
    });

});
