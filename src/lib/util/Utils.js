var fs = require('fs');
var path = require('path');

function Utils () {
}

Utils.findDyn = function (jsonKey, name, source, jsonPath) {
    var res = "";
    var jsonPath = path.join(jsonPath, ".upt.json");
    if (fs.existsSync(jsonPath)) {
        var localMeta = require(jsonPath);
        if (localMeta["_dyn_" + jsonKey] !== "undefined"
                && localMeta["_dyn_" + jsonKey][name] !== "undefined"
                && localMeta["_dyn_" + jsonKey][name]["source"] === source
                ) {
            res = localMeta["_dyn_" + jsonKey][name]["name"] || "";
        }
    }

    return res;
};

module.exports = Utils;

