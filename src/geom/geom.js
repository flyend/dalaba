(function () {
    var exports = (function (global) {
        return {
            deps: function (Dalaba) {
                var Tree = require("./tree/tree").deps(Dalaba);
                var RTree = require("./rtree/rtree").deps(Dalaba);
                
                return Dalaba.geom = {
                    Tree: Tree,
                    RTree: RTree
                };
            }
        };
    })(this);

    if (typeof module === "object" && module.exports) {
        module.exports = exports;
    }
    else if (typeof define === "function" && define.amd) {
        define(function () {
            return exports;
        });
    }
    return exports;

}).call(typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this)