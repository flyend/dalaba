(function(){
    var abs = Math.abs,
        log = Math.log,
        pow = Math.pow,
        round = Math.round;
    var isNumber = function(a){
        return typeof a === "number" && a === a;
    };
    
    /*
     * The array fill
     * @param value{Number} value
     * @param min{Number} min range
     * @param max{Number} max range
     * Returns is a number value
    */
    function clamp(value, min, max){
        return (value = value || 0) < min ? min : value > max ? max : value;
    }

    /*
     * linear calculation
     * @param value{Number}
     * @param minValue{Number}
     * @param maxValue{Number}
     * @param minRange{Number}
     * @param maxRange{Number}
     * Returns a linear value, f(y) = ax + b
    */

    var interpolate = function(value, minValue, maxValue, minRange, maxRange){
        var dissRange = maxRange - minRange,//定义域
            dissDomain = maxValue - minValue,//值域
            retValue;
        dissDomain = dissDomain ? 1 / dissDomain : 0;//fix value is 0
        retValue = (value - minValue) * dissDomain;
        return minRange + dissRange * retValue;//ax + b
    };

    var toPrecision = function(n, precision){
        var EPSILON = 8;//0.00000001
        if(arguments.length < 2)
            precision = EPSILON;
        return Number.prototype.toPrecision ? Number(n).toPrecision(precision) : (function(n, precision){
            if(n === 0 || isNaN(n) || isFinite(n))
                return "" + n;
            var ln10 = ~~(log(abs(n)) / Math.LN10);//log base
            var m;
            if(precision > ln10){
                m = pow(10, precision - ln10 - 1);
                return "" + (m === 0 ? n : round(n * m) / m);
            }
            m = pow(10, precision - ln10 + 1);
            return "" + (m === 0 ? n : round(n / m) * m);
        })(n, precision);
    };
    var Numeric = {
        clamp: clamp,
        percentage: function(value, percentage){
            var rPercent = /^[+\-\s\.\d]+\s*%\s*$/;
            return isNumber(value) && rPercent.test(percentage)
                ? value * (parseFloat(percentage, 10) / 100)
                : NaN;
        },
        interpolate: interpolate,
        toPrecision: toPrecision
    };
    return Numeric;
}).call(typeof global !== "undefined" ? global : this);