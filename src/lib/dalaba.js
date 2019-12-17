(function (exports) {

    var toString = ({}).toString;

    var typeOf = function (type) {
        var typeOf = function (v, type2) { return toString.call(v) === "[object " + (type2 || type) + "]"; };
        return function (v) {
            return typeOf(type, "Function") ? type.apply(null, arguments) : typeOf(v);
        };
    };

    var isNodeEnv = toString.call(typeof process !== "undefined" ? process : 0) === "[object process]";

    var global = isNodeEnv ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {};

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
        defined: defined,
        global: global
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

    exports.DEVICE_PIXEL_RATIO = Dalaba.DEVICE_PIXEL_RATIO;
    exports.isArray = Dalaba.isArray;
    exports.isFunction = Dalaba.isFunction;
    exports.isObject = Dalaba.isObject;
    exports.isString = Dalaba.isString;
    exports.isNumber = Dalaba.isNumber;
    exports.isEmptyObject = Dalaba.isEmptyObject;
    exports.defined = Dalaba.defined;
    exports.global = Dalaba.global;
    exports.pack = Dalaba.pack;
    exports.extend = Dalaba.extend;

    exports.LinkedList = require("./linkedlist");
    exports.Heap = require("./heap");

    exports.Math = require("./math");
    exports.Numeric = require("./numeric");
    exports.Vector = require("./vector");
    exports.Formatter = require("./formatter").deps(exports);
    
    exports.KDTree = require("./kdtree").deps(exports.Heap);

    exports.Geometry = require("./geometry").deps(exports.Vector);
    exports.Color = require("./color");
    exports.Text = require("./text");

    exports.Cluster = require("./cluster").deps(exports);

    exports.ZTree = require("./ztree").deps(exports.Cluster.List.partition);
    
    exports.geo = require("./geo").deps(exports);

    exports.geo.simplify = require("./simplify").deps(exports.Heap, exports.LinkedList);

    exports.CSSParser = require("./cssparser");

    return Dalaba;
})