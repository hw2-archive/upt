var path = require('path');
var uptJson = require('upt-json');
var Q = require('q');
var fs = require("graceful-fs")

// The valid options are the same as upt-json#readFile.
// If the "assume" option is passed, it will be used if no json file was found

// This promise is resolved with [json, deprecated, assumed]
// - json: The read json
// - deprecated: The deprecated filename being used or false otherwise
// - assumed: True if a dummy json was returned if no json file was found, false otherwise
function readJson(file, options) {
    options = options || {};

    function readCustom(meta) {
        var depName=options.name || meta.name;
        if (!depName || !options.config)
            return meta;

        var customFile=path.join(options.config.cwd,options.config.directory, depName,"upt.custom.json");
        try {
            var customMeta = JSON.parse(fs.readFileSync(customFile,{encoding:"utf8"}));
            // custom file must match the name of original json
            for (var key in customMeta) {
                meta[key]=customMeta[key];
            }
        } catch(e) {}

        return meta;
    }

    // Read
    return Q.nfcall(uptJson.read, file, options)
    .spread(function (json, jsonFile) {
        var deprecated;

        jsonFile = path.basename(jsonFile);
        deprecated = jsonFile === 'component.json' ? jsonFile : false;
        json=readCustom(json);

        return [json, deprecated, false];
    }, function (err) {
        // No json file was found, assume one
        if (err.code === 'ENOENT' && options.assume) {
            // custom json should be considered only when we're assuming a name in case of prev failure
            var meta=readCustom(uptJson.parse(options.assume, options));
            return [meta, false, true];
        }

        err.details = err.message;

        if (err.file) {
            err.message = 'Failed to read ' + err.file;
            err.data = { filename: err.file };
        } else {
            err.message = 'Failed to read json from ' + file;
        }

        throw err;
    });
}

module.exports = readJson;
