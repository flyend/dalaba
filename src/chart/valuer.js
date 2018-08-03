(function () {
    var valueOf = Numeric.valueOf;

    var prediction = Numeric.prediction;

    var undef = function (v) {
        return typeof v === "undefined";
    };

    var valuer = function (value) {
        return {
            _x: value,
            _y: value,
            value: value,
            minValue: value,
            maxValue: value,
            sumValue: value
        };
    };

    var copyAt = function (keys, values) {
        var maps = {};
        var key, value;
        var flag = false;
        var i = -1,
            n;
        if (!isArray(keys) || !isArray(values) || (((isArray(keys) & isArray(values)) && (n = keys.length) * values.length) === 0))
            return null;
        while (++i < n) if (defined(key = keys[i]) && defined(value = values[i]))
            maps[key] = value;

        return flag ? null : maps;
    };

    var mergeAt = function (a, b, keys) {
        var ret = {},
            p;
        for (p in a) {
            ret[p] = a[p];
        }
        for (p in b) {
            var src = ret[p],
                copy = b[p];
            if (src === copy || (isObject(keys) && ({}).hasOwnProperty.call(keys, p)))
                continue;
            if (copy !== undefined) {
                ret[p] = copy;
            }
        }
        return ret;
    };

    var reValue = function (rv, value) {
        rv.value = rv.sumValue = rv.minValue = rv.maxValue = value;
    };

    var isNULL = function (rev) {
        return rev && (rev.isNULL = !((isNumber(rev._x, true) && isNumber(rev._y, true)) || isNumber(rev.value, true)));
    };

    var vari = [];

    function revalue (value, rules, nocopy) {
        var rv = valuer(value);
        var flag = false;
        if (isNumber(value, true)) {
            rv._x = rv._y = undefined;
            return rv;
        }
        if (isObject(value)) {
            if (isObject(value) && defined(value.value)) {
                rv = revalue(value.value, rules, nocopy);
                rv = mergeAt(rv, value, {value: true});
            }
            else {
                rv = mergeAt(rv, value, {value: true});// candlestick chart
            }
            !undef(value.x) && (rv._x = value.x, reValue(rv, undefined), flag = true);
            !undef(value.y) && (rv._y = value.y, reValue(rv, undefined), flag = true);
            isNumber(rv.value, true) && (flag = true);
            return flag ? rv : null;
        }
        else if (isString(value)) {
            rv._x = rv._y = undefined;
            reValue(rv, valueOf(value, vari.length ? vari.length > 2 ? prediction(vari.slice(-10)) : vari[0] : 0));
            return rv;
        }
        else if (isArray(value)) {
            // TODO [x, value]
            rv._x = value[0], rv._y = value[1];
            rv.value = rv.sumValue = rv.minValue = rv.maxValue = pack(function (d) {
                return isNumber(d, true);
            }, value[2], value[1], undefined);// value.length > 2 ? value[2] : undefined;
            return extend(rv, copyAt(rules, nocopy === true ? value : value.slice(3)));
        }
        return null;
    }

    /**
     * 1. reset value
     * 2. setting tooltip value
     * 3. validate shape is null
    **/
    return {
        var: function (_) {
            vari = _;
        },
        line: function (data) {
            var rev = revalue(data);
            isNULL(rev);
            rev && !rev.isNULL && ((isNumber(rev._y, true) && !isNumber(rev.value, true) && (reValue(rev, rev._y))), rev["$value"] = rev.value);
            return rev;
        },
        spline: function (data) {
            return this.line(data);
        },
        area: function (data) {
            return this.line(data);
        },
        areaspline: function (data) {
            return this.line(data);
        },
        radar: function (data) {
            return this.line(data);
        },
        scatter: function (data) {
            var rules = ["name", "color"];
            var rev = revalue(data, rules);
            rev && (isNumber(rev._x, true) && isNumber(rev._y, true) ? (rev["$value"] = rev._x + "," + rev._y) : (isNumber(rev._y, true) || isNumber(rev.value, true) && (rev["$value"] = pack("string", rev.value, rev._y))));
            isNULL(rev);
            return rev;
        },
        column: function (data) {
            var rev = revalue(data, ["name", "color"]);
            if (rev) {
                isNULL(rev);
                isNumber(rev._y, true) && !isNumber(rev.value, true) && (reValue(rev, rev._y)); //no projection
                !rev.isNULL && (rev["$value"] = rev.value);
            }
            return rev;
        },
        bar: function (data) {
            return this.column(data);
        },
        candlestick: function (data) {
            var rev = revalue(data, ["open", "close", "high", "low"], true);// {open[0], close[1], high[2], low[3]}
            if (rev) {
                isNumber(rev.high, true) && (rev.value = rev.high);
                isNumber(rev.low, true) && (rev.minValue = rev.low);
                !(rev.isNULL = !(isNumber(rev.open, true) && isNumber(rev.close, true)
                    && isNumber(rev.high, true) && isNumber(rev.low))) && (rev["$value"] = [
                        "<br>",
                        "open: " + rev.open + "<br>",
                        "close: " + rev.close + "<br>",
                        "low: " + rev.low + "<br>",
                        "high: " + rev.high + "<br>"
                    ].join(""));
            }
            return rev;
        },
        boxplot: function (data) {
            var rev = revalue(data, ["low", "q1", "median", "q3", "high"], true);// the values correspond to x,low,q1,median,q3,high
            if (rev) {
                isNumber(rev.low, true) && (rev.minValue = rev.low);
                isNumber(rev.high, true) && (rev.value = rev.maxValue = rev.high);
                !(rev.isNULL = !(isNumber(rev.low, true) && isNumber(rev.q1, true)
                    && isNumber(rev.median, true) && isNumber(rev.q3) && isNumber(rev.high))) && (rev["$value"] = [
                        "<br>",
                        "upper: " + rev.high + "<br>",
                        "Q3: " + rev.q3 + "<br>",
                        "median: " + rev.median + "<br>",
                        "q1: " + rev.q1 + "<br>",
                        "lower: " + rev.low + "<br>"
                    ].join(""));
            }
            return rev;
        },
        arearange: function (data) {
            var rev = revalue(data, ["_x", "low", "high"], true);
            if (rev) {
                isNumber(rev.low, true) && (rev.minValue = rev.low);
                isNULL(rev);
                !rev.isNULL && (rev["$value"] = rev.low + "," + rev.high);
            }
            return rev;
        },
        heatmap: function (data) {
            var rev = revalue(data);
            return rev;
        },
        pie: function (data, color) {
            var rev = revalue(data, ["name", "value", "color"], true);
            if (rev) {
                rev.isNULL = !(isNumber(rev._y, true) || isNumber(rev.value, true));
                !rev.isNULL && (isNumber(rev._y, true) && !isNumber(rev.value, true) && (reValue(rev, rev._y)), rev["$value"] = rev.value);
                !defined(rev.name) && (rev.name = rev.value); // init name
                !defined(rev.color) && defined(color) && (rev.color = color);
            }
            return rev;
        },
        funnel: function (data, color) {
            return this.pie(data, color);
        },
        sankey: function (data) {
            var rev = revalue(data);
            if (rev) {
                rev.isNULL = !defined(data.source) && !defined(data.target);
            }
            return rev;
        },
        diagram: function (data) {
            return this.sankey(data);
        },
        map: function (data) {
            return this.pie(data);
        }
    };
})();