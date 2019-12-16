(function(global) {

    var Dalaba = require("lib/lib");

    require("stats/stats").deps(Dalaba);


    if (typeof module === "object" && module.exports) {
        module.exports = Dalaba;
    }
    else if (typeof define === "function" && define.amd) {
        define(function() {
            return Dalaba;
        });
    }
    else {
        global.Dalaba = Dalaba;
    }

    return Dalaba;
    
})(typeof window !== "undefined" ? window : this);