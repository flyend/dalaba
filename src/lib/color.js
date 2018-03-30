(function(){
	var toString = Object.prototype.toString;

	var defined = function(a) {
        return typeof a !== "undefined" && a !== null;
    };
    var isObject = function(a){
        return toString.call(a) === "[object Object]";
    };
    var isArray = function(a){
        return toString.call(a) === "[object Array]";
    };
    var isNumber = function(a){
        return toString.call(a) === "[object Number]";
    };

	var extend = function(a, b){
        var n;
        if(!isObject(a) && !(toString.call(a) === "[object Function]")){
            a = {};
        }
        for(n in b){
            var src = a[n],
                copy = b[n];
            if(src === copy)
                continue;
            if(copy && isObject(copy)){
                a[n] = extend(src, copy);
            }
            else if(copy !== undefined){
                a[n] = copy;
            }
        }
        return a;
    };

    var clamp = function(v, min, max){
        return v < min ? min : v > max ? max : v;
    };

    var rHEX = /^#(([\da-f])([\da-f])([\da-f])([\da-f]{3})?)$/i,
        rRGBA = /(rgba?)\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d\.]+))?\)/,
        rHSL = /(hsl?)\((\d+),\s*(\d+)%,\s*(\d+)%\)/;

    var parse = function(color){
        var rgba = rHEX.exec(color), value, table;
        if((table = Color2.LOOKUP_TABLE).hasOwnProperty(color)){
            value = defined(table.a) ? table : extend({a: 1}, table[color]);
        }
        if(rgba){
            value = rgba[5] ? rgba[1] : [rgba[2], rgba[2], rgba[3], rgba[3], rgba[4], rgba[4]].join("");//#000 to #0000000
            value = parseInt(value, 16);
            value = {
                r: (value >>> 16) & 0xff,
                g: (value >>> 8) & 0xff,
                b: value & 0xff,
                a: 1
            };
        }
        rgba = rRGBA.exec(color);
        if(rgba){
            value = {
                r: rgba[2] | 0,
                g: rgba[3] | 0,
                b: rgba[4] | 0,
                a: rgba[1] === "rgb" ? 1 : (parseFloat(rgba[5], 10))
            };
            isNumber(value.a) || (value.a = 1);
        }
        rgba = rHSL.exec(color);
        if(rgba){
            var hue2rgb = function(p, q, t){
                //linear interpolate a + (b - a) * t
                t < 0 && t++;
                t > 1 && t--;
                return t < 1 / 6
                    ? p + (q - p) * t * 6
                    : t < 1 / 2
                        ? q
                        : t < 2 / 3
                            ? p + (q - p) * (2 / 3 - t) * 6
                            : p;//[0/360,45,90,135,180,225,270,315] lerp
            };

            var h = parseFloat(rgba[2], 10) / 360 % 360,
                s = Math.min(1, Math.max(0, parseFloat(rgba[3], 10) / 100)),
                l = Math.min(1, Math.max(0, parseFloat(rgba[4], 10) / 100));
            h < 0 && h++;
            if(s === 0){
                s = h = l;//achromatic 消色
            }
            else{
                var q = l < 0.5 ? l * (s + 1) : l + s - l * s,
                    p = l * 2 - q;
                s = hue2rgb(p, q, h + 1 / 3);//360 / 3
                l = hue2rgb(p, q, h);
                h = hue2rgb(p, q, h - 1 / 3);
            }
            value = {
                r: ~~(s * 256),
                g: ~~(l * 256),
                b: ~~(h * 256),
                a: 1
            };
        }
        if(!value){
            value = {r: 0, g: 0, b: 0, a: 1};
        }
        return value;
    };

	
    var Color2 = {};
    Color2.RED_MASK = 0x00ff0000;
    Color2.GREEN_MASK = 0x0000ff00;
    Color2.BLUE_MASK = 0x000000ff;
    Color2.ALPHA_MASK = 0xff000000;
    Color2.LOOKUP_TABLE = {
        aqua: {r: 0, g: 255, b: 255, a: 1},
        lime: {r: 0, g: 255, b: 0, a: 1},
        silver: {r: 192, g: 192, b: 192, a: 1},
        black: {r: 0, g: 0, b: 0, a: 1},
        maroon: {r: 128, g: 0, b: 0, a: 1},
        teal: {r: 0, g: 128, b: 128, a: 1},
        blue: {r: 0, g: 0, b: 255, a: 1},
        navy: {r: 0, g: 0, b: 128, a: 1},
        white: {r: 255, g: 255, b: 255, a: 1},
        fuchsia: {r: 255, g: 0, b: 255, a: 1},
        olive: {r: 128, g: 128, b: 0, a: 1},
        yellow: {r: 255, g: 255, b: 0, a: 1},
        orange: {r: 255, g: 165, b: 0, a: 1},
        gray: {r: 128, g: 128, b: 128, a: 1},
        purple: {r: 128, g: 0, b: 128, a: 1},
        green: {r: 0, g: 128, b: 0, a: 1},
        red: {r: 255, g: 0, b: 0, a: 1},
        pink: {r: 255, g: 192, b: 203, a: 1},
        cyan: {r: 0, g: 255, b: 255, a: 1},
        transparent: {r: 255, g: 255, b: 255, a: 0}
    };
    Color2.red = function(value){
        return ((value & Color2.RED_MASK) >>> 16);
    };
    Color2.green = function(value){
        return ((value & Color2.GREEN_MASK) >>> 8);
    };
    Color2.blue = function(value){
        return (value & Color2.BLUE_MASK);
    };
    Color2.alpha = function(value){
        return ((value & Color2.ALPHA_MASK) >>> 24);
    };
    extend(Color2, {
        isColor: function(color){
            return Color2.LOOKUP_TABLE.hasOwnProperty(color)
                || rHEX.exec(color)
                || rRGBA.exec(color);
        },
        rgb: function(rgb){
            return "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
        },
        rgba: function(rgba){
            return "rgba(" + rgba.r + "," + rgba.g + "," + rgba.b + "," + rgba.a + ")";
        },
        hex: function(rgba){
            var f;
            return "#" + 
                (f = function(c){
                    return (c = Math.max(0, Math.min(c, 0xff)).toString(16), c.length < 2 ? "0" + c : c);
                }, f(rgba.r)) + f(rgba.g) + f(rgba.b);
        },
        toString: function(c){
            return "rgba("
                + ((c & Color2.RED_MASK) >>> 16) + ","
                + ((c & Color2.GREEN_MASK) >>> 8) + ","
                + ((c & Color2.BLUE_MASK)) + ","
                + ((c & Color2.ALPHA_MASK) >>> 24) / 255 +
            ")";
        },
        interpolate: function(a, b){
            var ar, ag, ab, br, bg, bb;
            a = parse(a), b = parse(b);
            br = b.r - (ar = a.r), bg = b.g - (ag = a.g), bb = b.b - (ab = a.b);
            return function(t){
                return Color2.hex({
                    r: Math.round(ar + br * t),//at + b
                    g: Math.round(ag + bg * t),
                    b: Math.round(ab + bb * t)
                });
            };
        },
        lerp: (function(){
            var uninterpolateNumber = function(a, b){
                b = b - (a = +a) ? 1 / (b - a) : 0;
                return function(x){
                    return (x - a) * b;
                };
            };
            //uninterpolateNumber
            return function(domain, range, interpolateRGB){
                var numberFns = [],
                    colorFns = [];
                var length = Math.min(domain.length, range.length) - 1,
                    i = 1;
                if(domain[length] < domain[0]){
                    domain = domain.slice().reverse();
                    range = range.slice().reverse();
                }
                for(; i <= length; i++){
                    numberFns.push(uninterpolateNumber(domain[i - 1], domain[i]));//prev & current
                    colorFns.push(interpolateRGB(range[i - 1], range[i]));
                }
                return function(x){
                    var l = 1, r = length, m;
                    while(l < r){
                        m = l + r >> 1;
                        x < domain[m] ? (r = m) : (l = m + 1);
                    }
                    return colorFns[l -= 1](numberFns[l](x));
                };
            };
        })()
    });

    /**
     * create static Color parse
    */

    var Color = extend({}, Color2);

    Color.parse = function(color){
        return new Color.prototype.init(color);// {r: 0, g: 0, b: 0, a: 1};//default black
    };
    Color.prototype = {
        init: function(color){
            var rgba;
            this.a = +!(this.r = this.g = this.b = 0);
            if(Color2.isColor(color)){
                rgba = parse(color);
                this.r = rgba.r;
                this.g = rgba.g;
                this.b = rgba.b;
                this.a = rgba.a;
            }
            else if(isObject(color) && (color.hasOwnProperty("radialGradient") || color.hasOwnProperty("linearGradient"))){
                Color.Gradient.parse.call(this, color);
            }
            return this;
        },
        add: function(c1, c2){
            //return c1 + c2 & 0xff;
            //return Math.min(0xff, c1 + c2);
            //return (c2 < 128) ? (2 * c1 * c2 / 255) : (255 - 2 * (255 - c1) * (255 - c2) / 255);
            return (c1 < 128) ? (2 * c1 * c2 / 255) : (255 - 2 * (255 - c1) * (255 - c2) / 255);
        },
        linear: function(x1, y1, x2, y2){
            var context = Color.GRADIENT_CONTEXT;
            if(defined(context)){
                var gradient = context.createLinearGradient(
                    this.x1 * x1, this.y1 * y1,
                    this.x2 * x2, this.y2 * y2
                );
                this.stops.forEach(function(item){
                    gradient.addColorStop(item[0], item[1]);
                });
                return gradient;
            }
            return null;
        },
        radial: function(cx, cy, cr){
            var context = Color.GRADIENT_CONTEXT;
            if(defined(context)){
                cx = isNumber(cx) ? cx : 0;
                cy = isNumber(cy) ? cy : 0;
                cr = isNumber(cr) ? cr : 0;

                var xoff = this.cx0 * cr,
                    yoff = this.cy0 * cr;
                var gcx = xoff + cx,
                    gcy = yoff + cy,
                    or = this.cr0 * cr + Math.sqrt(xoff * xoff + yoff * yoff);
                //console.log(cr, cx, cy, or, gcx);
                var gradient = context.createRadialGradient(
                    gcx, gcy, 0,
                    gcx, gcy, or
                );
                this.stops.forEach(function(item){
                    gradient.addColorStop(item[0], item[1]);
                });
                return gradient;
            }
            return null;
        }
    };

    Color.prototype.init.prototype = Color.prototype;
    extend(Color.prototype, Color2);

    extend(Color.prototype, {
        rgba: function(){
            return Color2.rgba(this);
        },
        rgb: function(){
            return Color2.rgb(this);
        },
        alpha: function(a){
            if(!arguments.length){
                return this.a;
            }
            this.a = Math.max(0, Math.min(1, a));
            return this;
        },
        hex: function(){
            return Color2.hex(this);
        },
        hsl: function(){

        },
        interpolate: function(b){
            return Color2.interpolate(this, b);
        },
        value: function(){
            return this.a << 24 | this.r << 16 | this.g << 8 | this.b;
        }
    });

    //Color.RadialGradient.parse(fillColor.radialGradient).context(context);
    Color.GRADIENT_CONTEXT = null;
    Color.Gradient = {
        parse: function(color){
            var radialGradient, cx0, cy0, cr0;
            var linearGradient, x1, y1, x2, y2;
            var stops = [];
            if(defined(radialGradient = color.radialGradient)){
                this.cx0 = cx0 = clamp(isNumber(cx0 = (radialGradient = radialGradient || {}).cx) ? cx0 : 1, 0, 1);
                this.cy0 = cy0 = clamp(isNumber(cy0 = radialGradient.cy) ? cy0 : 1, 0, 1);
                this.cr0 = cr0 = clamp(isNumber(cr0 = radialGradient.r) ? cr0 : 0, 0, 1);
            }
            if(defined(linearGradient = color.linearGradient)){
                this.x1 = x1 = clamp(isNumber(x1 = (linearGradient = linearGradient || {}).x1) ? x1 : 0, 0, 1);
                this.y1 = y1 = clamp(isNumber(y1 = linearGradient.y1) ? y1 : 0, 0, 1);
                this.x2 = x2 = clamp(isNumber(x2 = linearGradient.x2) ? x2 : 0, 0, 1);
                this.y2 = y2 = clamp(isNumber(y2 = linearGradient.y2) ? y2 : 0, 0, 1);
            }
            if(isArray(color.stops)){
                color.stops.forEach(function(item){
                    var r = isNumber(item[0]) ? item[0] : 1,
                        c = Color2.isColor(item[1]) ? item[1] : "#000";
                    stops.push([clamp(r, 0, 1), c]);
                });
            }
            this.stops = stops;
            this.color = stops.length ? (stops[stops.length - 1][1]) : "#000";
        }
    };

    if(typeof module === "object" && module.exports){
        module.exports = Color;
    }
    else if(typeof define === "function" && define.amd){
        define([], function(){
            return Color;
        });
    }
    return Color;
})()