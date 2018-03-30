(function(){
    
    var toString = Object.prototype.toString;

    var isObject = function(a) {
        return toString.call(a) === "[object Object]";
    };
    var isNumber = function(a, finite) {
        return typeof a === "number" && !isNaN(a) && (finite !== true || isFinite(a));
    };
    var isArray = function(a) {
        return toString.call(a) === "[object Array]";
    };
    var isFunction = function(a) {
        return toString.call(a) === "[object Function]";
    };
    var isString = function(a) {
        return toString.call(a) === "[object String]";
    };
    var isEmptyObject = function(o) {
        for (var p in o) if (o.hasOwnProperty(p))
            return false;
        return true;
    };

    var defined = function(a) {
        return typeof a !== "undefined" && a !== null;
    };

    var Dalaba = {
        DEVICE_PIXEL_RATIO: global.devicePixelRatio || 1,
        isArray: isArray,
        isFunction: isFunction,
        isObject: isObject,
        isString: isString,
        isNumber: isNumber,
        isEmptyObject: isEmptyObject,
        defined: defined
    };
    /**
     * @param first is object type
     * @param last default value
    */
    Dalaba.pack = function() {
        var r = {
            "number": [0, isNumber],
            "function": [null, isFunction],
            "object": [null, isObject],
            "string": ["", isString],
            "array": [[], isArray]
        };
        var params = arguments,
            type = params[0];
        
        var v, i, n = params.length;
        var t;

        !(isString(type) || isFunction(type)) && (type = "");

        t = r[type];

        for (i = 1; i < n; i++) {
            v = params[i];
            if ((isFunction(type) && type.call(v, v, i) === true) || (type && t && t[1] && t[1](v))) {
                return v;
            }
        }
        return t && t[0];
    };

    /*
     * merge b to a
     * @param a{Object} source object
     * @param b{Object} target object
     * Returns new object
    */
    Dalaba.extend = function extend() {
        var args = arguments,// arraySlice.call(arguments, 1),
            i = 1,
            length = args.length,
            a = args[0],
            b,
            p;
        if (!isObject(a) && !isFunction(a)) {
            a = {};
        }
        for (; i < length; i++) {
            b = args[i];
            for (p in b) {
                var src = a[p],
                    copy = b[p];
                if (src === copy)
                    continue;
                if (copy && isObject(copy)) {
                    a[p] = extend(src, copy);
                }
                else if (copy !== undefined) {
                    a[p] = copy;
                }
            }
        }
        return a;
    };

    Dalaba.Math = require("./math");
    Dalaba.Numeric = require("./numeric");
    Dalaba.Vector = require("./vector");
    Dalaba.Formatter = require("./formatter").deps(Dalaba);

    Dalaba.Heap = require("./heap");
    Dalaba.KDTree = require("./kdtree").deps(Dalaba.Heap);

    Dalaba.Geometry = require("./geometry").deps(Dalaba);
    Dalaba.Color = require("./color");
    Dalaba.Text = require("./text");

    Dalaba.Cluster = require("./cluster");
    Dalaba.Cluster.List.diff = require("./align").deps(Dalaba.Cluster.hirschbergs);

    Dalaba.ZTree = require("./ztree").deps(Dalaba.Cluster.List.partition);
    
    Dalaba.geo = require("./geo")(Dalaba);

    return Dalaba;
})();