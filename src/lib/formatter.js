(function () {

    var mathMax = Math.max,
        mathMin = Math.min;

    //Think Right Before you Leap
    function TRouBLe () {
        var args = arguments,
            n = args.length;
        var top = args[0];

        var filled = function (n, v) {
            var r = [], i = -1;
            while (++i < n) r.push(pack("number", v[i], 0));

            return r;
        };

        var fixed = function (d) {
            var r = [], n = d.length, i = -1;
            while (++i < n) r.push(pack("number", d[i], 0));

            return r;
        };

        var concated = function () {
            var args = [].slice.call(arguments, 0),
                i = -1,
                n = args.length;
            var r = [];

            while (++i < n) r = r.concat(args[i]);

            return r;
        };

        if (!n && !(top = 0) || (isNumber(top, true) && n === 1)) {
            return [top, top, top, top];
        }

        if (!isArray(args[0]) && n) {
            top = [].slice.call(args, 0);
        }

        n = top.length;

        return n === 1 ? filled(4, top.concat(top, top, top))
            : n === 2 ? concated(filled(2, top), fixed(top))
                : n === 3 ? concated(fixed(top), filled(1, [top[0]])) : fixed(top.slice(0, 4));
    }

    var Formatter = {
        String: {},
        TRouBLe: TRouBLe
    };

    function factoy (Dalaba) {
        var defined = Dalaba.defined;

        var isNumber = Dalaba.isNumber;

        Formatter.String = {
            padding: function (v, p) {
                return v > -1 && v < 10 ? (p = p || "0") + v : v;
            },
            numberFormat: function (v, sep, decimals) {
                var places = defined(decimals) ? (isNumber(decimals = Math.abs(decimals)) ? decimals : 2)
                        : Math.min((v.toString().split(".")[1] || "").length, 20),
                    negative = v < 0 ? "-" : "";
                var words = String(parseInt(v = Math.abs(v).toFixed(places))),
                    first = words.length > 3 ? words.length % 3 : 0,
                    rSep = /(\d{3})(?=\d)/g;
                sep = typeof sep === "string" ? sep : ",";
                return !isNaN(+v) && isFinite(v) ? [
                    negative,//positive or negative
                    first ? words.substr(0, first) + (sep) : "",//prefix
                    words.substr(first).replace(rSep, "$1" + sep),//middle
                    places ? "." + Math.abs(v - words).toFixed(places).slice(2) : ""//suffix
                ].join("") : "";
            }
        };
        Formatter.percentage = function () {
            var values = [].slice.call(arguments, 0),
                n = values.length,
                i = 0,
                isClip = values[~-n] === false;
            var percents = [],
                v;
            n -= isClip;

            for (; i < n; i++) {
                v = pack("number", parseFloat(values[i], 10), 0);
                if (isClip) {
                    v = mathMax(0, mathMin(100, v));
                }
                percents.push(v + "%");
            }
            return percents;
        };
        Formatter.imageURI = function (backgroundImage) {
            var tokens = backgroundImage.match(/\S+/g),
                url;
            var image;
            var background = {};

            if (tokens && tokens.length && !!~(url = tokens[0]).indexOf("url")) {
                url = (url = url.substr(url.indexOf("url") + 3)).substr(url.lastIndexOf("(") + 1, url.indexOf(")") - 1);

                background.loaded = function() {
                    background.completed = true;
                    background.size = (tokens.length === 6 ? [tokens[4], tokens[5]] : tokens.length === 4 ? [tokens[3], tokens[3]] : [this.width, this.height]).map(parseFloat);
                };
                background.fail = function() {
                    console.error("background image loaded fail. <options.chart.backgroundImage>");
                };
                (image = background.image = new Image).onload = background.loaded;
                image.onerror = background.fail;
                image.src = url;
                tokens[1] && !!~"repeat no-repeat repeat-x repeat-y".indexOf(tokens[1]) && (background.repeat = tokens[1]);
                tokens.length === 4 | tokens.length === 6 && (background.position = ([tokens[2], tokens.length === 6 ? tokens[3] : tokens[2]]).map(parseFloat));
            }
            return background;
        };
        return Formatter;
    }
    
    
    var exports = {
        deps: function () {
            return factoy.apply(global, [].slice.call(arguments, 0));
        }
    };
    if (typeof module === "object" && module.exports) {
        module.exports = exports;
    }
    else if (typeof define === "function" && define.amd) {
        define(function(){
            return exports;
        });
    }
    return exports;
}).call(typeof global !== "undefined" ? global : this)