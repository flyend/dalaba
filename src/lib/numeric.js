(function () {
    var abs = Math.abs,
        log = Math.log,
        pow = Math.pow,
        mathMax = Math.max,
        mathMin = Math.min,
        mathFloor = Math.floor,
        mathCeil = Math.ceil,
        round = Math.round;

    var rPercent = /^[+\-\s\.\d]+\s*%\s*$/;

    var rValue = /([\+\-]?\d+[\.eE]?\d*)/g;

    var lerp = function (a, b, t) {
        return a + b * t;
    };

    var bilinear = function (a, b, values) {
        var na = mathFloor(a),
            nb = mathFloor(b);
        var ma = mathCeil(a),
            mb = mathCeil(b);
        var fa = a - na,
            fb = b - nb;

        return values[na][nb] * (1 - fa) * (1 - fb)
            + values[ma][nb] * fa * (1 - fb)
            + values[na][mb] * (1 - fa) * fb
            + values[ma][mb] * fa * fb;
    };

    var ascending = function (a, b) {
        isString(a) && (a = valueOf(a));
        isString(b) && (b = valueOf(b));
        if (isNumber(a, true) && isNumber(b, true))
            return a - b;
        if (isNumber(a, true))
            return 1;
        if (isNumber(b, true))
            return -1;
        return 0;
    };

    var valueOf = function (v, neighbor) {
        var value = parseFloat(v, 10),
            values = String(v).match(rValue),
            p = values && values.length;
        var filter = function (d) {
            return { x: parseFloat(d, 10) };
        };
        var distance = function (a, b) {
            return (a[neighbor.dim] - b[neighbor.dim]) * (a[neighbor.dim] - b[neighbor.dim]);
        };
        var point = {};
        var kdtree;

        if (isNumber(value, true) && !p) {
            return value;
        }
        if (p && values.length < 2) {
            return value = parseFloat(values[0], 10);
        }
        if (p && defined(neighbor)) {
            if (!isObject(neighbor)) {
                neighbor = { dim: "x", k: 1, filter: filter, distance: distance, base: neighbor };
            }
            !defined(neighbor.dim) && (neighbor.dim = "x");
            !isNumber(neighbor.k, true) && (neighbor.k = 1);
            !isFunction(neighbor.filter) && (neighbor.filter = filter);
            !isFunction(neighbor.distance) && (neighbor.distance = distance);
            point[neighbor.dim] = pack("number", neighbor.base);

            kdtree = new KDTree(values.map(neighbor.filter), [neighbor.dim], neighbor.k);
            value = kdtree.nearest(point, neighbor.distance)[0];//k = 1
            kdtree.destroy();
            if (isNumber(value[neighbor.dim], true)) {
                return value = value[neighbor.dim];
            }
        }
        return null;
    };

    var notNULL = function (data) {
        var d = [];
        var n = data.length,
            i = -1;

        while (++i < n) if (isString(data[i]) || isNumber(data[i], true)) d.push(data[i]);
        
        return d;
    };
    
    /*
     * The array fill
     * @param value{Number} value
     * @param min{Number} min range
     * @param max{Number} max range
     * Returns is a number value
    */
    function clamp (value, min, max) {
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

    var interpolate = function (value, minValue, maxValue, minRange, maxRange) {
        var dissRange = maxRange - minRange,//定义域
            dissDomain = maxValue - minValue,//值域
            retValue;
        dissDomain = dissDomain ? 1 / dissDomain : 0;//fix value is 0
        retValue = (value - minValue) * dissDomain;
        return lerp(minRange, dissRange, retValue);//ax + b
    };

    var toPrecision = function (n, precision) {
        var EPSILON = 8;//0.00000001
        if (arguments.length < 2)
            precision = EPSILON;
        return Number.prototype.toPrecision ? Number(n).toPrecision(precision) : (function (n, precision) {
            if (n === 0 || isNaN(n) || isFinite(n))
                return "" + n;
            var ln10 = ~~(log(abs(n)) / Math.LN10);//log base
            var m;
            if (precision > ln10) {
                m = pow(10, precision - ln10 - 1);
                return "" + (m === 0 ? n : round(n * m) / m);
            }
            m = pow(10, precision - ln10 + 1);
            return "" + (m === 0 ? n : round(n / m) * m);
        })(n, precision);
    };

    var prediction = function (values) {
        var n = values.length,
            sum = 0,
            mean = false;
        var each = function (cb) {
            var l = n & 1,
                r = n;
            l && cb(values[0], mean === false ? 0 : mean);
            while (l < r) {
                cb(values[l++], values[--r]);
            }
        };
        each(function (a, b) { sum += a; sum += b; });
        mean = sum / n, sum = 0;
        each(function (a, b) { sum += (a - mean) * (a - mean), sum += (b - mean) * (b - mean); });

        return values[n - 1]; //mean;// n ? Math.sqrt(sum / n) : 0;
    };

    var quantile = function (data, percent) {
        var n = data.length;
        var i0 = 1 + (~-n) * percent,
            i = i0 | 0;
        var diff = i0 - i;
        var d = data[i],
            d0 = data[i - 1];
        if (!n) return NaN;
        if (percent <= 0 || n < 2) return d = data[0], (isString(d) || isNumber(d)) ? valueOf(d) : 0;
        if (percent >= 1) return d = data[n - 1], (isString(d) || isNumber(d)) ? valueOf(d) : 0;
        d = (isString(d) || isNumber(d)) ? valueOf(d) : 0;
        d0 = (isString(d0) || isNumber(d0)) ? valueOf(d0) : 0;

        return diff ? lerp(d0, d - d0, diff) : d0;
    };

    var quartile = function (data, iqr) {
        var values = notNULL(data).sort(ascending);//new data, string or number
        var length = values.length;
        var first, last;
        var q1, median, q3, lower, upper;
        var ratio;

        iqr = iqr !== false;

        if (!length || (length && length < 5)) {
            return null;
        }

        first = isNumber(first = values[0]) ? first : valueOf(first);
        last = isNumber(last = values[mathMax(0, length - 1)]) ? last : valueOf(last);
        
        q1 = quantile(values, 0.25);
        median = quantile(values, 0.5);
        q3 = quantile(values, 0.75);

        ratio = (iqr ? 1.5 : 1) * (q3 - q1);

        lower = !iqr ? first : mathMax(first, q1 - ratio);
        upper = !iqr ? last : mathMin(last, q3 + ratio);

        return [lower, q1, median, q3, upper];
    };

    var indexOfRange = function (range, d) {
        var l = 0, r;
        var m;

        if (!isArray(range) || (isArray(range) && (r = range.length) === 0))
            return -1;

        if (d === range[0]) return 0;
        if (r > 1 && d === range[~-r]) return r - 2;

        while (l < r) {
            m = (r + l) >> 1;
            if (d >= range[m] && d < range[m + 1]) {
                return m;
            }
            if (d < range[m]) r = m;
            else if (d > range[m]) l = m + 1;
        }
        return -1;
    };

    var Numeric = {
        clamp: clamp,
        percentage: function (value, percentage) {
            return isNumber(value, true) && rPercent.test(percentage)
                ? value * (parseFloat(percentage, 10) / 100)
                : NaN;
        },
        interpolate: interpolate,
        lerp: lerp,
        bilinear: bilinear,
        toPrecision: toPrecision,
        valueOf: valueOf,
        quantile: quantile,
        quartile: quartile,
        prediction: prediction,
        indexOfRange: indexOfRange
    };
    return Numeric;
}).call(typeof global !== "undefined" ? global : this);