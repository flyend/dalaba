(function(Dalaba) {
    var min = Math.min;

    var isArray = Dalaba.isArray;

    var isValue = Dalaba.isValue;

    Dalaba.nonull = function(data, filter) {
        var n, i = -1;

        var d;

        if (!isArray(data)) {
            return 0;
        }
        n = data.length;

        while (++i < n) if (isValue(d = data[i], filter ? filter.call(data, d, i, data) : d)) break;

        return i;
    };
    
    function factoy() {


        var Stats = {
            
        };

        Stats.min = require("./min");

        return Dalaba.stats = Stats;
    }

    var exports = {
        deps: function() {
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
    if (typeof module === "object" && module.exports) {
        module.exports = exports;
    }
    else if (typeof define === "function" && define.amd) {
        define(function() {
            return exports;
        });
    }
    return exports;
})(Dalaba)