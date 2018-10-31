(function () {
    
    var toString = ({}).toString;

    var typeOf = function (type) {
        var typeOf = function (v, type2) { return toString.call(v) === "[object " + (type2 || type) + "]"; };
        return function (v) {
            return typeOf(type, "Function") ? type.apply(null, arguments) : typeOf(v);
        };
    };

    var isObject = typeOf("Object");

    var isArray = Array.isArray ? Array.isArray : typeOf("Array");

    var isFunction = typeOf("Function");

    var isString = typeOf("String");

    var isNumber = typeOf(function (v, finite) {
        return typeof v === "number" && !isNaN(v) && (finite !== true || isFinite(v));
    });

    var isEmptyObject = typeOf(function (o) {
        for (var p in o) if (o.hasOwnProperty(p))
            return false;
        return true;
    });

    var defined = typeOf(function (v) {
        return typeof v !== "undefined" && v !== null;
    });

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
    Dalaba.pack = function () {
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
        return isFunction(type) && n > 2 ? params[~-n] : t && t[0];
    };

    /*
     * merge b to a
     * @param a{Object} source object
     * @param b{Object} target object
     * Returns new object
    */
    Dalaba.extend = function extend () {
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

    Dalaba.LinkedList = require("./linkedlist");
    Dalaba.Heap = require("./heap");

    Dalaba.Math = require("./math");
    Dalaba.Numeric = require("./numeric");
    Dalaba.Vector = require("./vector");
    Dalaba.Formatter = require("./formatter").deps(Dalaba);
    
    Dalaba.KDTree = require("./kdtree").deps(Dalaba.Heap);

    Dalaba.Geometry = require("./geometry").deps(Dalaba);
    Dalaba.Color = require("./color");
    Dalaba.Text = require("./text");

    Dalaba.Cluster = require("./cluster").deps(Dalaba);

    Dalaba.ZTree = require("./ztree").deps(Dalaba.Cluster.List.partition);
    
    Dalaba.geo = require("./geo").deps(Dalaba);

    return Dalaba;
})();