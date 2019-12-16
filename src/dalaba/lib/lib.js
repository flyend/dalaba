(function() {

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

    var isValue = function(a, isAF) {
        var v = a;

        if (isObject(a) && defined(a.value))
            v = a.value;

        if (isString(v))
            v = parseFloat(v, 10);

        if (isNumber(v, isAF))
            return v;

        return NaN;
    };

    var defined = function(a) {
        return typeof a !== "undefined" && a !== null;
    };

    var Dalaba = {
        defined: defined,
        isNumber: isNumber,
        isArray: isArray,
        isString: isString,
        isFunction: isFunction,
        isObject: isObject,
        isValue: isValue
    };

    return Dalaba;
})()