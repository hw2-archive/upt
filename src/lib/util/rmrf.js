var _fs = require('fs'),
        _path = require('path'),
        _Q = require('q'),
        //_wrench = require('wrench'),
        _fstreamIgnore = require('fstream-ignore');

function purgeDeploy (dir, filters, callback) {
    if (_fs.existsSync(dir)) {
        // [TODO] deprecated code
        //var files = _wrench.readdirSyncRecursive(dir);
        //if (filters) {
        //  files = filterFiles(files,filters);
        //}

        var files = [];
        var worker = _fstreamIgnore({path: dir});
        worker.addIgnoreRules(filters);

        worker
                .on("child", function (e) {
                    files.push(e.path);
                })
                .on("close", function () {
                    // reverting array we will delete files before and then the emptied directory
                    files.reverse();
                    files.forEach(function (path) {
                        //don't remove folders since it will cause SVN conflict
                        if (_fs.statSync(path).isFile()) {
                            _fs.unlinkSync(path);
                        } else {
                            try {
                                _fs.rmdirSync(path);
                            } catch (e) {
                            }
                        }
                    });

                    callback();
                });
    } else
        callback();
}

/* Deprecated filter method
 function filterFiles(files, excludes) {
 var globOpts = {
 matchBase: false,
 dot: true
 };
 
 excludes = excludes.map(function(val) {
 val = _path.normalize(val);
 val = val.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"); // escape special characters
 return new RegExp("^" + val, "g");
 });
 
 
 return files.filter(function(filePath) {
 var res = false;
 
 excludes.forEach(function(val) {
 if (filePath.match(val)) {
 res = true;
 }
 });
 
 return !res;
 });
 } */

module.exports = {
    purgeDeploy: purgeDeploy
};

