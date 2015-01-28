// counter.js
var Shared = module.exports = {
    // some common vars:
    componentsDir: null,
    // getter and setter methods
    set: function (name, val) {
        return Shared[name] = val;
    },
    get: function (name) {
        return Shared[name];
    }
};
