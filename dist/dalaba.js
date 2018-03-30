/**
 * dalaba - A JavaScript chart library for Canvas.
 * @date 2018/03/23
 * @version v0.3.1
 * @license ISC
 */
"use strict";
!(function(global) {

    var Dalaba = (function(){
    
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

    Dalaba.Math = (function(){
    var mathPow = Math.pow;

    var mathRound = Math.round;

    var mathLog = Math.log;

    function round(v, p) {
        p = mathPow(10, p || 0);
        return p === 0 ? v : mathRound(v * p) / p;
    }
    var Mathematics = {
        log: function(v, base, positive){
            base = base || 10;
            typeof positive === "undefined" && (positive = true);
            return (!!positive ? mathLog(v < 0 ? 0 : v) : -mathLog(v > 0 ? 0 : -v)) / mathLog(base);
        },
        pow: function(v, base, positive){
            base = base || 10;
            typeof positive === "undefined" && (positive = true);
            return !!positive ? mathPow(base, v) : -mathPow(base, -v);
        },
        round: round
    };
    return Mathematics;
}).call(typeof window !== "undefined" ? window : this);;
    Dalaba.Numeric = (function(){
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
}).call(typeof global !== "undefined" ? global : this);;
    Dalaba.Vector = (function(){
    var isNumber = function(a){
        return typeof a === "number" && a === a;
    };

    function pack(){
        var r = {
            "number": [0, isNumber]
        };
        var params = Array.prototype.slice.call(arguments, 0),
            type = params[0];
        var v, i;

        for(i = 1; i < params.length; i++){
            v = params[i];
            if(type && r[type] && r[type][1] && r[type][1](v)){
                return v;
            }
        }
        return r[type] && r[type][0];
    }
    var Vector = function(){
        return (arguments.length >= 3
                ? new Vector3D(arguments[0], arguments[1], arguments[2])
                : new Vector2D(arguments[0], arguments[1]));
    };
    Vector.prototype = {
        add: function(v){
            this.x += pack("number", v.x, 0);
            this.y += pack("number", v.y, 0);
        },
        sub: function(v){
            this.x -= pack("number", v.x, 0);
            this.y -= pack("number", v.y, 0);
            return this;
        },
        length: function(){
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }
    };

    function Vector2D(x, y){
        if(!isNumber(x) || !isNumber(y)){
            throw new Error("x and y not a number.");
        }
        this.x = x;
        this.y = y;
        return this;
    }
    Vector2D.prototype = Vector.prototype;
    Vector2D.prototype.horizontal = function(v){
        var x1 = this.x,
            y1 = this.y;
        var x2 = v.x,
            y2 = v.y;
        //a//b x1*y2=y1*x2
        //var c = x1 * y2 === x2 * y1;
        //x1x2+y1y2=0
        //console.log(x1 * y2, x2 * y1, c, (y2 - y1) / (x2 - x1), x1*x2+y1*y2);
        var ax = x2 - x1;
        if(Math.abs(ax) <= 0.1){
            return false;
        }
        return (y2 - y1) / (ax) <= 0.1;

        
        //return isNumber(c) ? c : false;// === 0;
    };

    function Vector3D(x, y, z){
        this.x = x;
        this.y = y;
        this.z = z;
    }

    if(typeof module === "object" && module.exports){
        module.exports = Vector;
    }
    else if(typeof define === "function" && define.amd){
        define(function(){
            return Vector;
        });
    }
    return Vector;
}).call(typeof global !== "undefined" ? global : window);;
    Dalaba.Formatter = (function() {

    //Think Right Before you Leap
    function TRouBLe() {
        var args = arguments,
            n = args.length;
        var top = args[0];

        var filled = function(n, v) {
            var r = [], i = -1;
            while (++i < n) r.push(pack("number", v[i], 0));

            return r;
        };

        var fixed = function(d) {
            var r = [], n = d.length, i = -1;
            while (++i < n) r.push(pack("number", d[i], 0));

            return r;
        };

        var concated = function() {
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
        return Formatter;
    }
    
    
    var exports = {
        deps: function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
    if(typeof module === "object" && module.exports){
        module.exports = exports;
    }
    else if(typeof define === "function" && define.amd){
        define(function(){
            return exports;
        });
    }
    return exports;
}).call(typeof global !== "undefined" ? global : this).deps(Dalaba);

    Dalaba.Heap = (function(){
    /**
     * @param compare{Function}
     * @example
     * var heap = Heap(function(a, b){ return a - b; });
     * heap.push(19);
     * heap.push(29);
     * heap.push(9);
     * for(var i = 0; i < 6; i++){
     *    heap.push(Math.random() * 20 | 0);
     * }
     * //var t = heap.pop();
     * console.log(heap, heap.length);
     * for(i = 0; i < 4; i++)
     *    console.log(heap.pop(), heap.length);
     */
    var defaultCompare = function(a, b){
        return a - b;
    };

    function down(array, i){
        var value = array[i];
        var size = array.length;

        while(true){
            var r = (i + 1) << 1,
                l = r - 1,
                j = i;
            var child = array[j];
            if(l < size && defaultCompare(child, array[l]) > 0) child = array[j = l];
            if(r < size && defaultCompare(child, array[r]) > 0) child = array[j = r];
            if(j === i) break;
            array[i] = child;
            array[i = j] = value;
        }
    }
    function up(array, i){
        var value = array[i];
        while(i > 0){
            var j = (i + 1 >> 1) - 1,
                parent = array[j];
            if(defaultCompare(value, parent) >= 0) break;
            array[i] = parent;
            array[i = j] = value;
        }
    }

    var Heap = function(compare){
        return new Heap.init(compare);
    };
    Heap.init = function(compare){
        defaultCompare = compare || defaultCompare;
        this.length = 0;
        return this;
    };

    Heap.prototype = {
        push: function(value){
            var size = this.length;
            this[size] = value;
            up(this, size++);
            return this.length = size;
        },
        pop: function(){
            var size = this.length;
            if(size <= 0)
                return null;
            var removed = this[0];
            var end = this.splice(size - 1, 1)[0];
            if((this.length = --size) > 0){
                this[0] = end;//this[size];
                down(this, 0);
            }
            return removed;
        },
        peek: function(){
            return this[0];
        },
        splice: [].splice,
        size: function(){
            return this.length;
        },
        empty: function(){
            return this.length <= 0;
        }
    };

    Heap.init.prototype = Heap.prototype;

    if (typeof module === "object" && module.exports) {
        module.exports = Heap;
    }
    else if (typeof define === "function" && define.amd) {
        define(function() {
            return Heap;
        });
    }
    return Heap;
}).call(typeof window !== "undefined" ? window : this);;
    Dalaba.KDTree = (function(global) {
    var descending = function(a, b) {
        return a - b;
    };

    var Tree = function(node, parent, dim) {
        this.node = node;
        this.left = null;
        this.right = null;
        this.parent = parent;
        this.dim = dim;
    };

    function factoy(Heap) {
        var heap = new Heap(function(a, b) {
            return b.distance - a.distance;
        });
        function buildTree(points, depth, parent, dimensions){
            var length = points.length,
                d = depth % Math.max(1, dimensions.length),
                dim,
                sorted = descending,
                m;
            var node;

            if (!length)
                return null;
            if (length === 1)
                return new Tree(points[0], parent, d);//root

            if (dimensions.length) {
                dim = dimensions[d];//dimensions size
                sorted = function(a, b){
                    return a[dim] - b[dim];
                };
            }
            points.sort(sorted);

            node = new Tree(points[m = points.length >> 1], parent, d);
            node.left = buildTree(points.slice(0, m), depth + 1, node, dimensions);
            node.right = buildTree(points.slice(m + 1), depth + 1, node, dimensions);
            return node;
        }

        var KDTree = function(points, dimensions) {
            return new KDTree.init(points.slice(0), dimensions);
        };

        KDTree.init = function(points, dimensions) {
            this.build(points, dimensions);
            return this;
        };
        KDTree.prototype = {
            build: function(points, dimensions) {
                this.dimensions = dimensions || ["x", "y"];
                this.root = buildTree(points, 0, null, this.dimensions);
            },
            nearest: function(point, callback, k) {
                var dimensions = this.dimensions,
                    dl = dimensions.length;
                var ret = [];

                k = Math.max(1, +k) || 1;
                //reset heap
                while (!heap.empty()) {
                    heap.pop();
                }

                function put(node, distance) {
                    heap.push({
                        node: node,
                        distance: distance
                    });
                    if (heap.size() > k) {
                        heap.pop();
                    }
                }

                function find(tree) {
                    var maps = {},
                        aValue = callback(point, tree.node),
                        bValue;
                    var node;

                    if(dl){
                        dimensions.forEach(function(item, i){
                            maps[item] = i === tree.dim ? point[item] : tree.node[item];
                        });
                    }
                    else{
                        maps = point;
                    }
                    bValue = callback(maps, tree.node);
                    //console.log(tree.node.x1, tree.node.x0, tree.node.y0, tree.node.y1)
                    //parent
                    if(tree.right === null && tree.left === null){
                        if(heap.size() < k || aValue < heap.peek().distance){
                            put(tree, aValue);
                        }
                        return null;
                    }

                    if(tree.right === null){
                        node = tree.left;
                    }
                    else if(tree.left === null){
                        node = tree.right;
                    }
                    //left && right
                    else{
                        node = (dl ? point[dimensions[tree.dim]] < tree.node[dimensions[tree.dim]] : point < tree.node)
                            ? tree.left
                            : tree.right;
                    }

                    find(node);

                    if(heap.size() < k || aValue < heap.peek().distance){
                        put(tree, aValue);
                    }

                    if(heap.size() < k || Math.abs(bValue) < heap.peek().distance){
                        var child = node === tree.left ? tree.right : tree.left;
                        child !== null && find(child);
                    }
                }

                if (this.root) {
                    find(this.root);
                
                    for (var i = 0; i < k; i++) if (!heap.empty() && heap[i].node !== null)
                        ret.push(heap[i].node.node);
                }
                return ret;
            },
            //TODO
            insert: function(){

            },
            //TODO
            remove: function(){},
            destroy: function(){
                //destory
                /*while(heap.size()){
                    heap.pop();
                }
                heap = null;*/
                this.root = null;
            }
        };
        KDTree.init.prototype = KDTree.prototype;

        return KDTree;
    }
    return {
        deps: function() {
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
})(typeof window !== "undefined" ? window : this).deps(Dalaba.Heap);

    Dalaba.Geometry = (function (global) {
    function factoy (global, Dalaba) {
        var Intersection = {
            /*
             * Euclidean distance
             * Returns false or true
            */
            distance: function (p0, p1) {
                var x1 = p0.x,
                    y1 = p0.y;
                var x2 = p1.x,
                    y2 = p1.y;

                return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
            },
            line: function (p0, p1) {
                return this.distance(p0, p1) <= p1.width;
            },
            circle: function (p0, p1) {
                var dx = p1.x - p0.x,
                    dy = p1.y - p0.y,
                    dr = p0.radius + p1.radius;
                return dr * dr - dx * dx - dy * dy < 0.001;
            },
            /*
             * Pie collision detection
             * Returns false or true
             * @param shapes is Shape{Object}, Contains the x, y, size, startAngle and endAngle
             * @param x and y is mouse event
             * @param checkin and checkout is callback
            */
            pie: function (p0, p1) {
                var PI2 = Math.PI * 2;
                var dx = p0.x - p1.x,
                    dy = p0.y - p1.y;

                var inPie = this.distance(p0, p1) <= p1.radius;
                if(inPie && typeof p1.innerRadius === "number")
                    inPie = this.distance(p0, p1) >= p1.innerRadius;

                if(inPie){
                    var angle = Math.atan2(dy, dx) + Math.PI / 2;//顺、逆时针开始
                    if(angle < 0)
                        angle += PI2;
                    if(angle > PI2)
                        angle -= PI2;
                    if(angle >= p1.startAngle && angle <= p1.endAngle){
                        return inPie;
                    }
                }
                return false;
            },
            /*
             * Rect collision detection
             * Returns false or true
             * @param p0 is Point{Object}, Contains the x, y, size, startAngle and endAngle
             * @param p1 is Point{Object}, Contains the x, y, width, height. p1x = x + width, p1y = y + height
            */
            rect: function (p0, p1) {
                var rx = (p0.x - p1.x) * (p0.x - p1.width);
                var ry = (p0.y - p1.y) * (p0.y - p1.height);
                return rx <= 0.0 && ry <= 0.0;
            },
            polygon: function (p0, points) {
                var n = 0;
                for(var i = 0, length = points.length, j = length - 1; i < length; j = i, i++){
                    var source = points[i],
                        target = points[j];
                    //点与多边形顶点重合或在多边形的边上
                    if(
                        (source.x - p0.x) * (p0.x - target.x) >= 0 &&
                        (source.y - p0.y) * (p0.y - target.y) >= 0 &&
                        (p0.x - source.x) * (target.y - source.y) === (p0.y - source.y) * (target.x - source.x)
                    ){
                        return true;
                    }
                    //点与相邻顶点连线的夹角
                    var angle = Math.atan2(source.y - p0.y, source.x - p0.x) - Math.atan2(target.y - p0.y, target.x - p0.x);
                    //确保夹角不超出取值范围（-π 到 π）
                    if(angle >= Math.PI)
                        angle -= Math.PI * 2;
                    else if(angle <= -Math.PI)
                        angle += Math.PI * 2;
                    n += angle;
                }
                return Math.round(n / Math.PI) !== 0;//当回转数为 0 时，点在闭合曲线外部。
            }
        };
        /**
         * Dash Line
        */
        var arcDashLine = function(context, cx, cy, radius, startAngle, endAngle, dasharrays) {
            var length = pack("number", dasharrays && dasharrays[0], 1),
                offset = pack("number", dasharrays && dasharrays[1], 2);
            var size = PI / radius / (2 / length);
            var sa = startAngle,
                ea = sa + size;
            offset = PI / radius / (2 / offset);
            while (ea < endAngle) {
                context.beginPath();
                context.arc(cx, cy, radius, sa, ea, false);
                context.stroke();
                sa = ea + offset;
                ea = sa + size;
            }
        };
        var DashLine = {
            line: function(x, y, w, h, dasharray) {
                var dx = w - x,
                    dy = h - y,
                    length = Math.sqrt(dx * dx + dy * dy),
                    angle = Math.atan2(dy, dx);
                var dal = dasharray.length,
                    di = 0;
                var isDraw = true;

                return function(context) {
                    context.save();
                    context.translate(x, y);
                    context.rotate(angle);

                    context.moveTo(x = 0, 0);
                    while (length > x) {
                        x += dasharray[di++ % dal];
                        if(x > length)
                            x = length;
                        context[isDraw ? "lineTo" : "moveTo"](x, 0);
                        isDraw = !isDraw;
                    }

                    context.stroke();
                    context.restore();
                };
            },
            arc: function(context, cx, cy, radius, startAngle, endAngle, type){
                arcDashLine(context, cx, cy, radius, startAngle, endAngle, {
                    dot: [2, 6],
                    dash: [8, 6],
                    shortdash: [6, 2],
                    shortdot: [2, 2],
                    longdash: [16, 6]
                }[type] || [2, 6]);
            },
            solid: function(context, x, y, w, h){
                //this.line(x, y, w, h, [w])(context);
                context.moveTo(x, y);
                context.lineTo(w, h);
                context.stroke();
            },
            dot: function(context, x, y, w, h){
                this.line(x, y, w, h, [2, 6])(context);
            },
            dash: function(context, x, y, w, h){
                this.line(x, y, w, h, [8, 6])(context);
            },
            shortdash: function(context, x, y, w, h){
                this.line(x, y, w, h, [6, 2])(context);
            },
            shortdot: function(context, x, y, w, h){
                this.line(x, y, w, h, [2, 2])(context);
            },
            shortdashdot: function(context, x, y, w, h){
                this.line(x, y, w, h, [6, 2, 2, 2])(context);
            },
            shortdashdotdot: function(context, x, y, w, h){
                this.line(x, y, w, h, [6, 2, 2, 2, 2, 2])(context);
            },
            longdash: function(context, x, y, w, h){
                this.line(x, y, w, h, [16, 6])(context);
            },
            dashdot: function(context, x, y, w, h){
                this.line(x, y, w, h, [8, 6, 2, 6])(context);
            },
            longdashdot: function(context, x, y, w, h){
                this.line(x, y, w, h, [16, 6, 2, 6])(context);
            },
            longdashdotdot: function(context, x, y, w, h){
                this.line(x, y, w, h, [16, 6, 2, 6, 2, 6])(context);
            }
        };

        /**
        * Line
        **/
        var Line = {
            smooth: function(prevPoint, curPoint, nextPoint, inverted) {
                var smoothing = 1.5,
                    denom = smoothing + 1;
                var leftContX, leftContY, rightContX, rightContY;
                var x, y, prevX, prevY, nextX, nextY;
                var correction, ret = null;
                x = curPoint.x;
                y = curPoint.y;
                if(prevPoint && nextPoint){
                    prevX = prevPoint.x;
                    prevY = prevPoint.y;
                    nextX = nextPoint.x;
                    nextY = nextPoint.y;

                    leftContX = (prevX + smoothing * x) / denom;
                    leftContY = (prevY + smoothing * y) / denom;
                    rightContX = (nextX + smoothing * x) / denom;
                    rightContY = (nextY + smoothing * y) / denom;

                    
                    if(inverted){
                        correction = ((rightContX - leftContX) * (rightContY - y)) / (rightContY - leftContY) + x - rightContX;
                        leftContX += correction;
                        rightContX += correction;
                        if(leftContX > prevX && leftContX > x){
                            leftContX = Math.max(prevX, x);
                            rightContX = x * 2 - leftContX;
                        }
                        else if(leftContX < prevX && leftContX < x){
                            leftContX = Math.min(prevX, x);
                            rightContX = x * 2 - leftContX;
                        }
                        if(rightContX > nextX && rightContX > x){
                            rightContX = Math.max(nextX, x);
                            leftContX = x * 2 - rightContX;
                        }
                        else if(rightContX < nextX && rightContX < x){
                            rightContX = Math.min(nextX, x);
                            leftContX = x * 2 - rightContX;
                        }
                    }
                    else{
                        correction = ((rightContY - leftContY) * (rightContX - x)) / (rightContX - leftContX) + y - rightContY;
                        leftContY += correction;
                        rightContY += correction;
                        if(leftContY > prevY && leftContY > y){
                            leftContY = Math.max(prevY, y);
                            rightContY = y * 2 - leftContY;
                        }
                        else if(leftContY < prevY && leftContY < y){
                            leftContY = Math.min(prevY, y);
                            rightContY = y * 2 - leftContY;
                        }
                        if(rightContY > nextY && rightContY > y){
                            rightContY = Math.max(nextY, y);
                            leftContY = y * 2 - rightContY;
                        }
                        else if(rightContY < nextY && rightContY < y){
                            rightContY = Math.min(nextY, y);
                            leftContY = y * 2 - rightContY;
                        }
                    }
                    curPoint.rightContX = rightContX;
                    curPoint.rightContY = rightContY;
                }
                if(prevPoint){
                    ret = {
                        x1: prevPoint.rightContX || prevPoint.x,
                        y1: prevPoint.rightContY || prevPoint.y,
                        x2: leftContX || x,
                        y2: leftContY || y,
                        x: x,
                        y: y
                    };
                }
                return ret;
            },
            Dash: DashLine
        };

        /**
         * Rect
        **/
        var Rect = {
            getRotationBound: function(width, height, angle) {
                var sin = Math.sin,
                    cos = Math.cos,
                    abs = Math.abs;
                if (angle === 0) {
                    return { width: width, height: height};
                }
                var x0 = abs(sin(angle = angle * Math.PI / 180) * width),
                    x1 = abs(cos(angle) * width);
                var y0 = abs(sin(angle) * height),
                    y1 = abs(cos(angle) * height);
                return {
                    width: x1 + y0,
                    height: x0 + y1
                };
            }
        };

        var Geometry = {
            Intersection: Intersection,
            Line: Line,
            Rect: Rect
        };
        return Geometry;
    }
    var exports = {
        deps: function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [global].concat(args));
        }
    };
    if(typeof module === "object" && module.exports){
        module.exports = exports;
    }
    else if(typeof define === "function" && define.amd){
        define(function(){
            return exports;
        });
    }
    return exports;
})(typeof window !== "undefined" ? window : this).deps(Dalaba);
    Dalaba.Color = (function(){
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
})();
    Dalaba.Text = (function(global){

    var document = global.document;

    var sin = Math.sin,
        cos = Math.cos,
        abs = Math.abs;

    var _toString = Object.prototype.toString;

    var isArray = function(v){
        return _toString.call(v) === "[object Array]";
    };

    /**
     * Text
    */
    var Text = {
        _cache: {
            width: {},
            height: {}
        },
        context: function(context){
            Text._context = context;
        },
        getWidth: function(text, style){
            var fontFamily = (style = style || {}).fontFamily || "sans-serif",
                fontSize = style.fontSize || "12px",
                fontWeight = style.fontWeight || "normal",
                fontStyle = style.fontStyle || "normal",
                lineHeight = style.lineHeight || "normal";
            var font = [
                fontStyle,
                fontWeight,
                fontSize + "/" + lineHeight,
                fontFamily
            ].join(" ");
            text = "" + (text || "Eg");

            var width = 0;

            var id = text + "-" + font;
            if(Text._cache.width[id]){
                return Text._cache.width[id];
            }
            var context = Text._context,
                canvas;
            
            if(document && document.createElement){
                context = (canvas = document.createElement("canvas")).getContext("2d");
            }
            else if(context){
                canvas = context.canvas;
            }
            if(!context){
                return 0;
            }
            Text._context = context;
            //console.log(font, text)
            
            text.split("\n").forEach(function(){
                context.font = font;
                width = Math.max(width, context.measureText(text).width);
            });
            return (Text._cache.width[id] = width);
        },
        getHeight: function(text, style){
            var fontFamily = (style = style || {}).fontFamily || "sans-serif",
                fontSize = style.fontSize || "12px",
                fontWeight = style.fontWeight || "normal",
                fontStyle = style.fontStyle || "normal",
                lineHeight = style.lineHeight || "normal";

            var font = [
                fontStyle,
                fontWeight,
                fontSize + "/" + lineHeight,
                fontFamily
            ].join(" ");

            if(String(text).length === 0){
                return 0;
            }
            text = "" + (text || "Eg");

            var id = text + "-" + font;
            if(Text._cache.height[id]){
                return Text._cache.height[id];
            }
            var context = Text._context,
                canvas;
            if(context){
                canvas = context.canvas;
                if(typeof (Text._cache.height[id] = context.measureText(text).emHeightAscent) === "number"){
                    return Text._cache.height[id];
                }
            }
            else{
                Text._context = context = (canvas = document.createElement("canvas")).getContext("2d");
            }

            var width = Math.ceil(Text.getWidth(text, style)),
                height = Math.ceil(parseFloat(fontSize, 10)),
                top, bottom;
            var data;
            var hasNumber = typeof height === "number";
            if (!hasNumber || (hasNumber && height <= 0) || isNaN(height) || !isFinite(height))
                height = 12;

            context.save();
            context.font = font;
            context.textBaseline = "alphabetic";
            context.textAlign = "left";
            context.fillStyle = "#fff";
            context.fillText(text, 0, height);
            data = context.getImageData(0, 0, width, height).data;
            context.restore();

            top = bottom = -1;
            for(var y = 0; y <= height; y++){
                for(var x = 0; x < width; x++){
                    var i = x + y * width << 2;
                    if(data[i] + data[i + 1] + data[i + 2] > 0){
                        if(top === -1) top = y;//once
                        bottom = y;
                        break;
                    }
                }
            }
            //console.log(bottom - top + 1, text, font)
            return Text._cache.height[id] = bottom - top + 1;
        },
        measureText: function(text, style){
            var angle = style && style.rotation,
                width = 0,
                height = 0;
            var bbox = {
                left: 0, top: 0,
                width: width, height: height
            };
            if(!(text = String(text)).length)
                return bbox;
            bbox.width = width = Text.getWidth(text, style);
            bbox.height = height = Text.getHeight(text, style);
            if(style && typeof angle === "number" && isFinite(angle) && !isNaN(angle)){
                var x0 = abs(sin(angle = angle * Math.PI / 180) * width),
                    x1 = abs(cos(angle) * width);
                var y0 = abs(sin(angle) * height),
                    y1 = abs(cos(angle) * height);
                bbox.width = x1 + y0;
                bbox.height = x0 + y1;
            }
            return bbox;
        },
        multipText: function(word, maxWidth, options){
            var ellipsis = (options = options || {}).ellipse || "..";
            var context = Text._context;
            if(!context){
                Text._context = context = (document.createElement("canvas")).getContext("2d");
            }
            
            var textWidth = (Text.getWidth(word, options));//context.measureText(word).width,
                //curWidth = 0;
            if(textWidth <= maxWidth)
                return word;
            maxWidth -= Text.getWidth(ellipsis);
            var l = 0, r = word.length, m;
            while(l < r){
                m = (l + r >>> 1) + 1;
                if(Text.getWidth(word.slice(0, m), options) < maxWidth) l = m;
                else r = m - 1;
            }
            return word.slice(0, l) + ellipsis;
        }
    };
    Text.HTML = function(nodes, g, options){
        var fontSize = (options = options || {}).fontSize || "12px",
            fontFamily = options.fontFamily || "Arial, sans-serif",
            fontWeight = options.fontWeight || "100",//normal | bold | bolder | lighter | auto | inherit | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
            fontStyle = options.fontStyle || "normal";//normal | italic | oblique | inherit
            //color = options.color || (g && g.fillStyle);
        var bbox = {height: 0, width: 0},
            width = 0,
            height = 0,
            x = 0,
            y = 0;
        var lastHeight = 0;
        function parse(nodes, isTag, render){
            var i, length = nodes.length | (i = 0);
            var curFontWeight = fontWeight,
                curFontStyle = fontStyle,
                node;

            for(; i < length; i++){
                node = nodes[i];
                
                if(node.type === "br"){
                    x = 0;
                    y += bbox.height;
                    continue;
                }
                if(node.type === "b"){
                    g.font = [curFontStyle, curFontWeight = "bold", fontSize, fontFamily].join(" ");
                }
                else if(node.type === "i"){
                    g.font = [curFontStyle = "italic", curFontWeight, fontSize, fontFamily].join(" ");
                }
                else if(node.type === "normal" && !isTag){
                    curFontWeight = fontWeight;
                    g.font = [curFontStyle, curFontWeight, fontSize, fontFamily].join(" ");
                }
                
                if(node.type === "normal"){
                    render && render.call(g, node.value, x, height);
                    bbox = Text.measureText(node.value, options);
                    width = Math.max(width, bbox.width);
                    height = y + bbox.height;
                    x += bbox.width;
                    
                    lastHeight = Math.max(lastHeight, bbox.height);
                }
                if(node.type === "i" ||
                    node.type === "u" ||
                    node.type === "b"
                ){
                    (isArray(node.value)) && parse(node.value, true, render);
                    curFontStyle = fontStyle;
                    curFontWeight = fontWeight;
                }
            }
        }
        var tag = {
            getBBox: function(){
                x = y = width = height = 0;
                parse(nodes, false);
                
                return {
                    left: 0,
                    top: 0,
                    width: width,
                    height: options.rotation ? lastHeight : height
                };
            },
            toCanvas: function(){
                x = y = width = height = 0;
                g.save();
                typeof options.x === "number" && typeof options.y === "number" && g.translate(options.x, options.y);
                parse(nodes, false, function(value, x, y){
                    g.fillText(value, x, y);
                });
                g.restore();
            },
            toHTML: function(){
                var html = "";   
                (function fn(nodes){
                    var i, length = nodes.length | (i = 0);
                    var node;
                    //var args = arguments.callee;
                    
                    for(; i < length; i++){
                        node = nodes[i];
                        
                        if(node.type === "br"){
                            html += "<br />";
                            continue;
                        }
                        
                        if(node.type === "normal"){
                            html += node.value;
                        }
                        if(node.type === "i"  ||
                            node.type === "u" ||
                            node.type === "b"
                        ){
                            html += "<" + node.type + ">";
                            (isArray(node.value)) && fn(node.value);
                            html += "</" + node.type + ">";
                        }
                    }
                    return html;
                })(nodes, false);
                return html;
            }
        };
        return tag;
    };
    Text.parseHTML = (function(){
    var regLib = {
        tag: {
            br: /<br\s*\/?>/,
            all: /<([b|i|u])>(.*?)<\/\1>/g
        },
        specialSym: /([<>&])/g
    };

    var specialMap = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;'
    };

    var utils = {
        filterIllegalSym: function (str) {
            return str.replace(regLib.specialSym, function (unit, sym) {
                return specialMap[sym] || unit;
            });
        }
    };

    var parseBr = function (str, keepPure) {
        if (!(str = "" + str) || !regLib.tag.br.test(str)) {
            return [{type: 'normal', value: str}];
        }
        var group = str.split(regLib.tag.br);
        var parsedGroup = [];
        var strUnit;
        var gL = group.length;
        var gLLess = gL - 1;
        for (var i = 0; i < gLLess; i++) {
            strUnit = group[i];
            if (strUnit === '') {
                parsedGroup.push({
                    type: 'br'
                });
                continue;
            }
            if (keepPure) {
                strUnit = utils.filterIllegalSym(strUnit);
            }
            parsedGroup
                .splice(parsedGroup.length, 0, {type: 'normal', value: strUnit}, {type: 'br'});
        }

        // 结尾处特殊处理
        if (gLLess >= 0) {
            strUnit = group[gLLess];
            if (strUnit !== '') {
                if (keepPure) {
                    strUnit = utils.filterIllegalSym(strUnit);
                }
                parsedGroup.push({
                    type: 'normal',
                    value: strUnit
                });
            }
        }

        return parsedGroup;
    };

    var tagParser = function (strUnit, keepPure) {
        var tagReg = /<([b|i|u])>(.*?)<\/\1>/ig;
        if (!(strUnit = "" + strUnit)) {
            return parseBr(strUnit, keepPure);
        }
        var group = [];
        var execResult;
       
        //var startPos = strUnit.search(tagReg);
        var lastPos = 0;

        while (execResult = tagReg.exec(strUnit)) {
            var fullStr = execResult[0];
            var tagType = execResult[1];
            var mixinStr = execResult[2];
            var leftOffset = tagReg.lastIndex - lastPos - fullStr.length;
            if (leftOffset > 0) {
                var extraStr = strUnit.substr(lastPos, leftOffset);
                group = group.concat(parseBr(extraStr, keepPure));
            }
            var nextParsedVal = tagParser(mixinStr, keepPure);
            lastPos = tagReg.lastIndex;
            group.push({
                type: tagType,
                value: nextParsedVal
            });
        }

        if (lastPos < strUnit.length) {
            group = group.concat(parseBr(strUnit.slice(lastPos), keepPure));
        }

        return group.length ? group : parseBr(strUnit, keepPure);
    };

    var btagParser = function (str, keepPure) {
        return tagParser(str, keepPure);
    };
    
    return btagParser;
})();
    return Text;
})(typeof window !== "undefined" ? window : global);

    Dalaba.Cluster = (function() {
    var indexOf = Array.prototype.indexOf;

    var Cluster = {};

    Cluster.hirschbergs = (function(){
        var min = Math.min;

        //a0[p0,p1) and a1[q0,q1)
        function left(a0, a1, p1, p2, q1, q2, compare, memo) {
            var i, j;
            var diag;

            memo[p1 % 2][q1] = 0;

            for (j = q1 + 1; j <= q2; j++)
                memo[p1 % 2][j] = memo[p1 % 2][j - 1] + 1;

            for (i = p1 + 1; i <= p2; i++) {
                memo[i % 2][q1] = memo[(i - 1) % 2][q1] + 1;
                for (j = q1 + 1; j <= q2; j++) {
                    diag = memo[(i - 1) % 2][j - 1];
                    if (!compare(a0[i - 1], a1[j - 1]))
                        diag += 1;
                    memo[i % 2][j] = min(diag, min(memo[(i - 1) % 2][j] + 1, memo[i % 2][j - 1] +  1));
                }
            }
        }

        //reverse(a0[p1..p2)) and reverse(a1[q1..q2))
        function right(a0, a1, p1, p2, q1, q2, compare, memo) {
            var i, j;
            var diag;

            memo[p2 % 2][q2] = 0;

            for (j = q2 - 1; j >= q1; j--)
                memo[p2 % 2][j] = memo[p2 % 2][j + 1] + 1;

            for (i = p2 - 1; i >= p1; i--) {
                memo[i % 2][q2] = memo[(i + 1) % 2][q2] + 1;
                for (j = q2 - 1; j >= q1; j--) {
                    diag = memo[(i + 1) % 2][j + 1];
                    if (!compare(a0[i], a1[j]))
                        diag += 1;
                    memo[i % 2][j] = min(diag, min(memo[(i + 1) % 2][j] + 1, memo[i % 2][j + 1] + 1));
                }
            }
        }

        //align a0[p1..p2) with a1[q1..q2)
        function align(a0, a1, p0, p1, q0, q1, score0, score1, compare, append) {
            var ret = [];
            var item, memo = 0;
            var i, j;
            //a0 is empty
            if(p1 <= p0) {
                for (j = q0; j < q1; j++) {
                    ret.push(append("+", j));
                }
            }
            //a1 is empty
            else if (q1 <= q0) {
                for (i = p0; i < p1; i++) {
                    ret.push(append("-", i));
                }
            }
            //a0 is one, a1 is not empty
            else if (p1 - 1 === p0) {
                item = a0[p0];
                memo = 0;
                for (j = q0; j < q1; j++) if (compare(item, a1[j]) && !memo && (memo = 1)) {
                    ret.push(append("=", p0, j));
                }
                else ret.push(append("+", j));
                !memo && ret.push(append("-", p0));
            }
            else if (q1 - 1 === q0) {
                item = a1[q0];
                memo = 0;
                for (i = p0; i < p1; i++) {
                    if (compare(item, a0[i]) && !memo && (memo = 1)) {
                        ret.push(append("=", i, q0));
                    }
                    else {
                        ret.push(append("-", i));
                    }
                }
                !memo && ret.push(append("+", q0));
            }
            else {
                var imid = p0 + p1 >> 1;
                left(a0, a1, p0, imid, q0, q1, compare, score0);
                right(a0, a1, imid, p1, q0, q1, compare, score1);

                var jmid = q0,
                    best = Number.MAX_VALUE;
                for (i = q0; i <= q1; i++) {
                    var sum = score0[imid % 2][i] + score1[imid % 2][i];
                    if (sum < best) {
                        best = sum;
                        jmid = i;
                    }
                }

                ret = align(a0, a1, p0, imid, q0, jmid, score0, score1, compare, append)
                    .concat(align(a0, a1, imid, p1, jmid, q1, score0, score1, compare, append));
            }
            return ret;
        }
        return align;
    })();

    Cluster.List = {
        /*
         * The data packet
         * @param data{Array} data Grouping
         * @param filter{Function}
         * Returns Array
        */
        partition: function(data, filter) {
            var length = (data = data || []).length,
                i = 0, j;
            var groups = [], group;
            var visited = new Array(length);
            var a, b;
            if (length === 1) return [[data[i]]];

            for (; i < length; i++) {
                group = [a = data[i]];
                for(j = i + 1; j < length; j++) if (filter && filter.call(data, a, b = data[j], i, j) === true) {
                    group.push(b);
                    visited[j] = true;
                }
                if (!visited[i])
                    groups.push(group);
            }
            visited = null;
            return groups;
        },
        /*
         * The data filter
         * @param data{Array} data source
         * @param filter{Function}
         * Returns Array
        */
        filter: function(data, filter) {
            var length = data.length,
                i = -1;
            var newData = [], a;

            while (++i < length) if (filter && filter.call(data, a = data[i]) === true) {
                newData.push(a);
            }
            return newData;
        },
        /*
         * The data indexOf
         * @param data{Array} data source
         * @param filter{Function}
         * Returns Array
        */
        indexOf: function(data, key){
            return indexOf ? indexOf.call(data, key) : (function() {
                var i = -1, n = data.length;
                while (++i < n && data[i] !== key);
                    return i < n ? i : -1;
            })();
        },
        /*
         * The array fill
         * @param data{Array} data source
         * @param place{.} All js data type
         * Returns Array
        */
        fill: function(n, place) {
            return Array.prototype.fill ? new Array(n = Math.max(0, n) || 0).fill(place) : (function(){
                var array = [];
                while (n--) array.push(place);
                return array;
            })();
        }
    };


    if (typeof module === "object" && module.exports) {
        module.exports = Cluster;
    }
    else if (typeof define === "function" && define.amd) {
        define(function() {
            return Cluster;
        });
    }
    return Cluster;
}).call(typeof global !== "undefined" ? global : this);;
    Dalaba.Cluster.List.diff = (function(global) {
    var forEach = Array.prototype.forEach;

    function defaultCompare(fn) {
        return typeof fn === "function" ? fn : function(a, b) {
            return a === b;
        };
    }

    function append(c, newIndex, oldIndex) {
        var o = { op: c, newIndex: newIndex };
        if (c === "=") {
            o.oldIndex = oldIndex;
        }
        return o;
    }

    function factoy(hirschbergs) {
        /**
         * @param{Array} a0 is first array
         * @param{Array} a1 is second array
         * @param{Function} compare function
        */

        var diff = function(a0, a1, compare) {
            return new diff.fn.compareTo(a0, a1, compare = defaultCompare(compare));
        };
        diff.fn = diff.prototype = {
            compareTo: function(a0, a1, compare) {
                var l0 = a0.length,
                    l1 = a1.length,
                    lm = Math.min(l0, l1),
                    i = -1,
                    j = -1;
                var length = 0;
                var that = this;
                var item;
                
                while (++j < lm && compare(a0[l0 - j - 1], a1[l1 - j - 1]));//right
                
                while (++i < lm && compare(a0[i], a1[i]))//left
                    that[length++] = (item = append("=", i, i));

                if (l0 - j >= i || l1 - j >= i) {
                    forEach.call(hirschbergs(a0, a1, i, l0 - j, i, l1 - j, [[], []], [[], []], compare, append), function(item){
                        that[length++] = (item);
                    });
                    for(i = 0; i < j; i++)
                        that[length++] = (item = append("=", i + l0 - j, i + l1 - j));
                }
                this.length = length;

                return this;
            },
            length: 0,
            splice: [].splice,
            forEach: function(callback) {
                var i = 0, length = this.length;
                for (; i < length; i++)
                    callback.call(this, this[i], this);
            },
            add: function(callback) {
                this.adder = function(newIndex) {
                    return callback.call(this, newIndex);
                };
                return this;
            },
            remove: function(callback) {
                this.remover = function(newIndex) {
                    return callback.call(this, newIndex);
                };
                return this;
            },
            modify: function(callback) {
                this.modifer = function(newIndex, oldIndex) {
                    return callback.call(this, newIndex, oldIndex);
                };
                return this;
            },
            each: function(callback) {
                this.forEach(function(item) {
                    var ret;
                    item.op === "+" && (ret = this.adder && this.adder.call(item, item.newIndex));
                    item.op === "-" && (ret = this.remover && this.remover.call(item, item.newIndex));
                    item.op === "=" && (ret = this.modifer && this.modifer.call(item, item.newIndex, item.oldIndex));
                    callback && callback.call(item, ret);
                });
                this.adder = null;
                this.modifer = null;
                this.remover = null;
            }
        };
        diff.fn.compareTo.prototype = diff.fn;

        return diff;
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
})(typeof window !== "undefined" ? window : this).deps(Dalaba.Cluster.hirschbergs);

    Dalaba.ZTree = (function(factoy) {
    var exports = {
        deps: function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(null, [].concat(args));
        }
    };
    return exports;
}).call(this, function(partition) {

    var Tree = function(parent, leaf) {
        this.parent = parent;
        if(leaf !== null)
            this.leaf = leaf;
    };

    var buildTree = function(data, parent, dimensions, depth) {
        var dim = dimensions[depth];
        var tree;
        var length, i;
        var id = 0, key;

        if (depth >= dimensions.length) {
            return new Tree(parent, data);
        }
        var groups = partition(data, function(a, b) {
            if(typeof a[dim] === "undefined" && typeof b[dim] === "undefined")
                return false;
            return a[dim] === b[dim];
        });
        tree = new Tree(parent, null);//no leaf
        //tree.node = [];
        for(i = 0, length = groups.length; i < length; i++){
            //tree.node.push(buildTree(groups[i], tree, dimensions, depth + 1));
            key = groups[i][0][dim];
            if(typeof key === "undefined"){
                key = "z-" + ++id;//会有冲突
            }
            tree[key] = buildTree(groups[i], tree, dimensions, depth + 1);
        }
        return tree;
    };

    var ZTree = function(data, dimensions) {
        return new ZTree.init(data.slice(0), dimensions);
    };

    ZTree.init = function(data, dimensions) {
        this.build(data, dimensions);
        return this;
    };
    ZTree.prototype = {
        build: function(data, dimensions){
            this.root = buildTree(data, null, dimensions, 0);
            //console.log(this.root);
        },
        update: function(add, modify){
            var root = this.root;

            var setProp = function(node, attrs){
                for(var p in attrs){
                    node[p] = attrs[p];
                }
            };

            var each = function(root){
                var props,
                    newProps = { };

                if(!root){
                    return null;
                }
                if(root.leaf){
                    newProps = props = add && add(root.leaf);
                    setProp(root, props);
                    return props;
                }
                
                for(var p in root) if(root.hasOwnProperty(p)){
                    if(p !== "parent"){
                        props = each(root[p]);
                        if(props){
                            newProps = modify && modify(newProps, props);
                        }
                    }
                }
                setProp(root, newProps);
                return newProps;
            };

            each(root);

            return this;
        },
        getRoot: function(){
            return this.root;
        }
    };
    ZTree.init.prototype = ZTree.prototype;
    return ZTree;
}).deps(Dalaba.Cluster.List.partition);
    
    Dalaba.geo = (function(){
    var PI = Math.PI;
    //var PI2 = PI * 2;
    //var PI21 = PI / 2;
    var PI41 = PI / 4;

    var toRadian = function(v){
        return v * Math.PI / 180;
    };

    function lat2lng(lat, lng){
        return [
            (lat < -168.5 ? lat + 360 : lat) + 170,
            90 - lng
        ];
    }

    /**
     * Default
    */
    function Simple(){
        return function(lat, lng){
            var p = lat2lng(lat, lng);
            return [
                toRadian(p[0]),
                toRadian(p[1])
            ];
        };
    }
    

    /**
     * Mercator Projection
     * -----------------------------
     * E = FE + R (λ – λₒ)
     * N = FN + R ln[tan(π/4 + φ/2)]
     * -----------------------------  
    */
    function Mercator(){
        //var x = lat,
        //    y = Math.log(Math.tan(PI41 + lng / 2));
        return function(lat, lng){
            var p = lat2lng(lat, lng);
            return [
                toRadian(p[0]),
                Math.log(Math.tan(PI41 + toRadian(p[1]) / 2))
            ];
        };
    }

    var Feature = {
        Point: function(p, stream){
            stream.point(p);
        },
        MultiPoint: function(coordinates, stream){
            coordinates.forEach(function(coords){
                Feature.Point(coords, stream);
            });
        },
        LineString: function(coordinates, stream){
            Feature.MultiPoint(coordinates, stream);
        },
        MultiLineString: function(coordinates, stream){
            coordinates.forEach(function(coords){
                stream.points && (stream.points = []);
                Feature.LineString(coords, stream);
                stream.groups && stream.groups();
            });
        },
        Polygon: function(coordinates, stream){
            stream.clear && stream.clear();//reset
            Feature.MultiLineString(coordinates, stream);
        },
        MultiPolygon: function(coordinates, stream){
            stream.clear && stream.clear();
            coordinates.forEach(function(coords){
                Feature.MultiLineString(coords, stream);
            });
        }
    };

    var Geometry = {
        Feature: function(feature, stream){
            var geometry = feature.geometry,
                geometryType = geometry.type,
                coordinates = geometry.coordinates;
            Feature[geometryType](coordinates, stream);
            //callback && callback(stream.points, feature);
        },
        FeatureCollection: function(geojson, stream){
            (geojson.features || []).forEach(function(feature){
                Geometry.Feature(feature, stream);
                /*var geometry = feature.geometry,
                geometryType = geometry.type,
                coordinates = geometry.coordinates;
                Feature[geometryType](coordinates, stream);
                callback && callback(stream.get(), feature);*/
            });
        }
    };

    function factoy (Dalaba) {
        var extend = Dalaba.extend;

        var isNumber = Dalaba.isNumber;

        var isArray = Dalaba.isArray;

        var isObject = Dalaba.isObject;

         /**
         * Class Path
         *
        */
        var Path = (function(){
            var path = {};
            var size = [960, 500],
                scale = [1, 1],
                translate = [0, 0];
            var projection = Simple();

            var type = "Point";

            return extend(path, {
                type: function(t){
                    return arguments.length ? (type = Feature.hasOwnProperty(t) ? t : "Point", path) : type;
                },
                size: function(){
                    if(arguments.length){
                        size = arguments[0];
                        isNumber(size) && (size = [size, size]);
                        isArray(size) && size.length < 2 && (size[1] = size[0]);
                        return path;
                    }
                    return size;
                },
                translate: function(){
                    if(arguments.length){
                        translate = arguments[0];
                        isNumber(translate) && (translate = [translate, translate]);
                        isArray(translate) && translate.length < 2 && (translate[1] = translate[0]);
                        return path;
                    }
                    return path;
                },
                scale: function(){
                    if(arguments.length){
                        scale = arguments[0];
                        isNumber(scale) && (scale = [scale, scale]);
                        isArray(scale) && scale.length < 2 && (scale[1] = scale[0]);
                        return path;
                    }
                    return scale;
                },
                projection: function(){
                    if(arguments.length){
                        projection = arguments[0];
                        return path;
                    }
                    return projection;
                },
                parse: function(geojson, callback){
                    var width = size[0],
                        height = size[1];//translate = [toRadian(480), toRadian(250)];
                    var stream = {
                        points: [],
                        get: function(){
                            return stream.polygons.length ? stream.polygons : stream.points;
                        },
                        polygons: [],
                        clear: function(){
                            this.polygons = [];
                            this.points = [];
                        },
                        groups: function(){
                            stream.polygons.push(stream.points);
                        }
                    };
                    var bounds = Path.bounds(geojson);//bounds = [[360, 180], [0, 0]];
                    //bounds = [[-85.05112878, -180], [85.05112878, 180]];
                    /*var r = {
                        left: bounds[0][0], top: bounds[0][1],
                        width: bounds[1][0], height: bounds[1][1]
                    };
                    console.log(r);*/
                    
                    
                    var scaleWidth = width * scale[0],
                        scaleHeight = height * scale[1];

                    /*var tx = width / (bounds[1][0] - bounds[0][0]),
                        ty = height / (bounds[1][1] - bounds[0][1]);
                    
                    var sx = scaleWidth / (bounds[1][0] - bounds[0][0]),
                        sy = scaleHeight / (bounds[1][1] - bounds[0][1]);
                    sy = sx;
                    if(sx > sy){
                        sx = sy;
                    }
                    else{
                        
                    }
                    sx = sy * 0.75;*/
                    //lock width & height
                    var ratio = Math.max(
                        (bounds[1][0] - bounds[0][0]) / scaleWidth * 1,
                        (bounds[1][1] - bounds[0][1]) / scaleHeight * 1
                    );
                    ratio = ratio ? 1 / ratio : 1;
                    var k0 = ratio;
                    var k1 = ratio * 1.3;
                    var dx = translate[0],// + (width - scaleWidth) / 2,//(tx - ratio) / 2,
                        dy = translate[1];// + (height - scaleHeight) / 2;//(ty - ratio) / 4;
                    stream.point = function(p){
                        var point = projection(p[0], p[1]),
                            x = point[0],
                            y = point[1];
                        x = (point[0] - bounds[0][0]) * k0 + dx;
                        y = (point[1] - bounds[0][1]) * k1 + dy;
                        //console.log(x, y);
                        stream.points.push({x: x, y: y});
                    };
                    if(isObject(geojson)){
                        var Geometry = {
                            FeatureCollection: function(geojson, stream){
                                (geojson.features || []).forEach(function(feature){
                                    Geometry.Feature(feature, stream);
                                    //callback && callback(stream.get(), feature);
                                });
                            },
                            Feature: function(feature, stream){
                                var geometry = feature.geometry,
                                    geometryType = geometry.type,
                                    coordinates = geometry.coordinates;
                                Feature[geometryType](coordinates, stream);
                                callback && callback(stream.get(), feature);
                            }
                        };
                        Geometry[geojson.type](geojson, stream);
                    }
                }
            });
        })();

        Path.bounds = function(geojson){
            var projection = Path.projection();
            //console.log(projection)
            var bounds = [[360, 180], [0, 0]];//min lat and min lng, max lat and max lng
            //bounds = [[-85.05112878, -180], [85.05112878, 180]];

            var stream = {
                point: function(p){
                    var point = projection(p[0], p[1]),
                    x = point[0],
                    y = point[1];
                    //console.log(p)
                    if(bounds[0][0] > x) bounds[0][0] = x;
                    if(x > bounds[1][0]) bounds[1][0] = x;
                    if(bounds[0][1] > y) bounds[0][1] = y;
                    if(y > bounds[1][1]) bounds[1][1] = y;
                }
            };
            if(isObject(geojson)){
                var F = {
                    FeatureCollection: function(geojson){
                        (geojson.features || []).forEach(function(feature){
                            var geometry = feature.geometry,
                                type = feature.type;
                            if(type === "Feature"){
                                Feature[geometry.type](geometry.coordinates, stream);
                            }
                            else if(type === "GeometryCollection"){
                                feature.geometries.forEach(function(geometry){
                                    Feature[geometry.type](geometry.coordinates, stream);
                                });
                            }
                        });
                    },
                    Feature: function(feature){
                        var geometry = feature.geometry,
                            geometryType = geometry.type,
                            coordinates = geometry.coordinates;
                        Feature[geometryType](coordinates, stream);
                    }
                };
                F[geojson.type](geojson);
            }
            return bounds;
        };

        var geo = {
            Mercator: Mercator,
            Path: Path
        };
        return geo;
    }

    var exports = (function (global) {
        return function (Dalaba) {
            return factoy.call(global, Dalaba);
        };
    })(this);
    if (typeof module === "object" && module.exports) {
        module.exports = exports;
    }
    else if (typeof define === "function" && define.amd) {
        define(function () {
            return exports;
        });
    }
    return exports;

}).call(typeof window !== "undefined" ? window : this)(Dalaba);

    return Dalaba;
})();;

    /**
 * Chart constructor function
 * Dalaba.Chart, new Dalaba.Chart method
**/
(function(Dalaba) {
    var defined = Dalaba.defined,
        extend = Dalaba.extend,
        pack = Dalaba.pack;

    var document = global.document;
    /*
     * scale canvas
     * @param g{CanvasRenderingContext2D}
     * @param width{Number}
     * @param height{Number}
     * @param ratio{Number}
    */
    function rescale(g, width, height, ratio, tx, ty) {
        var canvas = g.canvas;
        tx = pack("number", tx, 0);
        ty = pack("number", ty, 0);
        
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        
        if(ratio !== 1){
            canvas.style.width = width + "px";
            canvas.style.height = height + "px";
        }
        g.setTransform(
            ratio, 0,
            0, ratio,
            tx * ratio,
            ty * ratio
        );
    }

    var fixLinePixel = function(x, y, w, h, borderWidth) {
        var xBorder = -((borderWidth = isNaN(+borderWidth) ? 1 : borderWidth) % 2 ? 0.5 : 0),
            yBorder = borderWidth % 2 ? 0.5 : 1;
        //horizontal
        var right = Math.round(x + w) + xBorder;
        x = Math.round(x) + xBorder;
        //vertical
        var bottom = Math.round(y + h) + yBorder,
            isTop = Math.abs(y) <= 0.5 && bottom > 0.5;
        y = Math.round(y) + yBorder;
        h = bottom - y;

        if(isTop){
            y -= 1;
            h += 1;
        }

        return {
            x: x,
            width: right - x,
            y: y,
            height: h
        };
    };

    var fixPixelHalf = function() {
        var args = [].slice.call(arguments, 0),
            sub = args.pop(),
            lineWidth = sub;
        var round = Math.round;
        var r = [],
            v2;
        if(typeof sub === "boolean"){
            lineWidth = args[args.length - 1];
        }
        else{
            sub = null;
        }
        lineWidth = round(lineWidth);
        
        args.forEach(function(y){
            v2 = round(y * 2);
            r.push(((v2 + lineWidth) % 2 === 0 ? v2 : (v2 + (sub || -1))) / 2);
        });
        return r;
    };

    /**
     * Chart static constructor
    */
    var Chart = function(canvas, options) {
        return new Dalaba.Chart.fn.init(canvas, options);
    };

    /**
     * Shape
     *
    */
    Chart.LineSegment = {
        none: function(context, points, options){
            var dashStyle = pack("string", (options = options || {}).dashStyle, "solid");
            var DashLine = Geometry.Line.Dash;
            var length = (points || []).length, i, j;
            var x, y, moveX, moveY;
            var point;
            if(!length)
                return;

            context.beginPath();
            context.moveTo(moveX = points[i = 0].x, moveY = points[0].y);
            for(; i < length; i++){
                point = points[i];
                x = point.x;
                y = point.y;

                if(point.value === null){
                    //find next point
                    for(j = i + 1; j < length; j++){
                        //console.log(points)
                        if(points[j].value !== null){
                            x = points[j].x;
                            y = points[j].y;
                            break;
                        }
                    }
                    context.moveTo(moveX = x, moveY = y);
                }
                if(point.value !== null){
                    DashLine[dashStyle] && dashStyle !== "solid" ? DashLine[dashStyle](
                        context,
                        moveX, moveY,
                        moveX = x, moveY = y
                    ) : context.lineTo(x, y);
                }
            }
        }
    };

    extend(Chart, {
        graphers: {},
        hasTouch: defined(document) && ("ontouchstart" in document)// document.documentElement.ontouchstart !== undefined;
    });
    
    var Arc = (function() {
    var cos = Math.cos,
        sin = Math.sin,
        PI = Math.PI;
    /**
     * svg path a to canvas
     * @example
     * g.beginPath();
     * arc(g, x + l, y + t, [
     *  current[1],
     *  current[2],
     *  current[3],
     *  current[4],
     *  current[5],
     *  current[6] + l,
     *  current[7] + t
     * ], l, t);
     * x = current[6];
     * y = current[7];//next move
     * g.stroke();
    */
    var arc = (function() {
        var arcToSegmentsCache = {},
            segmentToBezierCache = {},
            join = Array.prototype.join,
            argsStr;

        // Copied from Inkscape svgtopdf, thanks!
        function arcToSegments(x, y, rx, ry, large, sweep, rotateX, ox, oy) {
            argsStr = join.call(arguments);
            //console.log(argsStr, arcToSegmentsCache)
            if (arcToSegmentsCache[argsStr]) {
                return arcToSegmentsCache[argsStr];
            }

            var th = rotateX * (PI / 180);
            var sin_th = sin(th);
            var cos_th = cos(th);
            rx = Math.abs(rx);
            ry = Math.abs(ry);
            var px = cos_th * (ox - x) * 0.5 + sin_th * (oy - y) * 0.5;
            var py = cos_th * (oy - y) * 0.5 - sin_th * (ox - x) * 0.5;
            var pl = (px * px) / (rx * rx) + (py * py) / (ry * ry);
            if (pl > 1) {
                pl = Math.sqrt(pl);
                rx *= pl;
                ry *= pl;
            }

            var a00 = cos_th / rx;
            var a01 = sin_th / rx;
            var a10 = (-sin_th) / ry;
            var a11 = (cos_th) / ry;
            var x0 = a00 * ox + a01 * oy;
            var y0 = a10 * ox + a11 * oy;
            var x1 = a00 * x + a01 * y;
            var y1 = a10 * x + a11 * y;

            var d = (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0);
            var sfactor_sq = 1 / d - 0.25;
            if (sfactor_sq < 0) sfactor_sq = 0;
            var sfactor = Math.sqrt(sfactor_sq);
            if (sweep == large) sfactor = -sfactor;
            var xc = 0.5 * (x0 + x1) - sfactor * (y1-y0);
            var yc = 0.5 * (y0 + y1) + sfactor * (x1-x0);

            var th0 = Math.atan2(y0 - yc, x0 - xc);
            var th1 = Math.atan2(y1 - yc, x1 - xc);

            var th_arc = th1-th0;
            if (th_arc < 0 && sweep == 1){
                th_arc += 2*PI;
            } else if (th_arc > 0 && sweep === 0) {
                th_arc -= 2 * PI;
            }

            var segments = Math.ceil(Math.abs(th_arc / (PI * 0.5 + 0.001)));
            var result = [];
            for (var i = 0; i < segments; i++) {
                var th2 = th0 + i * th_arc / segments;
                var th3 = th0 + (i + 1) * th_arc / segments;
                result[i] = [xc, yc, th2, th3, rx, ry, sin_th, cos_th];
            }

            return (arcToSegmentsCache[argsStr] = result);
        }

        function segmentToBezier(cx, cy, th0, th1, rx, ry, sin_th, cos_th) {
            argsStr = join.call(arguments);
            if(segmentToBezierCache[argsStr]){
                return segmentToBezierCache[argsStr];
            }

            var a00 = cos_th * rx;
            var a01 = -sin_th * ry;
            var a10 = sin_th * rx;
            var a11 = cos_th * ry;

            var cos_th0 = cos(th0);
            var sin_th0 = sin(th0);
            var cos_th1 = cos(th1);
            var sin_th1 = sin(th1);

            var th_half = 0.5 * (th1 - th0);
            var sin_th_h2 = sin(th_half * 0.5);
            var t = (8 / 3) * sin_th_h2 * sin_th_h2 / sin(th_half);
            var x1 = cx + cos_th0 - t * sin_th0;
            var y1 = cy + sin_th0 + t * cos_th0;
            var x3 = cx + cos_th1;
            var y3 = cy + sin_th1;
            var x2 = x3 + t * sin_th1;
            var y2 = y3 - t * cos_th1;

            return (segmentToBezierCache[argsStr] = [
                a00 * x1 + a01 * y1,  a10 * x1 + a11 * y1,
                a00 * x2 + a01 * y2,  a10 * x2 + a11 * y2,
                a00 * x3 + a01 * y3,  a10 * x3 + a11 * y3
            ]);
        }

        //<path d="A100{rx}, 100{ry}, 0{rotate}, 1{large}, 0{sweep}, 100{x}, 100{y}"></path>
        return function(g, x, y, coords){
            //x, y => g.moveTo(x, y)
            //var segs = arcToSegments(ex, ey, rx, ry, large, sweep, rot, x, y);
            //console.log(x, y, coords);
            ;(arcToSegments(
                coords[5],//ex
                coords[6],//ey
                coords[0],//rx
                coords[1],//ry
                coords[3],//large
                coords[4],//sweep,
                coords[2],//rotation
                x,
                y
            ) || []).forEach(function(item){
                g.bezierCurveTo.apply(g, segmentToBezier.apply(null, item));
            });
        };
    })();

    var angle2arc = function(cx, cy, radius, innerRadius, startAngle, endAngle, open) {
        var cosStart = cos(startAngle),
            sinStart = sin(startAngle),
            cosEnd = cos(endAngle = endAngle - 0.00000001),
            sinEnd = sin(endAngle),
            longArc = +(endAngle - startAngle > PI);

        return function(context) {
            var moveX, moveY;
            //outerRadius
            context.beginPath();
            context.moveTo(
                moveX = cx + radius * cosStart,
                moveY = cy + radius * sinStart
            );
            //arcTo
            arc(
                context,
                moveX, moveY,
                [
                    radius, radius,//cx, cy radius
                    0,//slanting
                    longArc,//long or short arc
                    1,//clockwise
                    cx + radius * cosEnd, cy + radius * sinEnd//close x, y
                ]
            );
            //innerRadius
            context[open ? "moveTo" : "lineTo"](
                moveX = cx + innerRadius * cosEnd,
                moveY = cy + innerRadius * sinEnd
            );
            arc(
                context,
                moveX, moveY,
                [
                    innerRadius, innerRadius,
                    0,//slanting
                    longArc,
                    0,//clockwise
                    cx + innerRadius * cosStart,
                    cy + innerRadius * sinStart
                ]
            );
            open || context.closePath();
        };
    };
    return {arc: arc, angle2arc: angle2arc};
})();
    var Event = (function(global){
    var document = global.document;
    function factory(Dalaba) {
        var DEVICE_PIXEL_RATIO = Dalaba.DEVICE_PIXEL_RATIO;

        var pack = Dalaba.pack;

        var defined = Dalaba.defined;

        var extend = Dalaba.extend;

        var hasTouch = defined(document) && ("ontouchstart" in document);// document.documentElement.ontouchstart !== undefined;

        var normalize = function(e, element){
            var x, y;
            var pos, bbox;
            e = e || global.event;
            if(!e.target)
                e.target = e.srcElement;
            pos = e.touches ? e.touches.length ? e.touches[0] : e.changedTouches[0] : e;
            bbox = element.getBoundingClientRect();
            if(!bbox){
                //bbox = offset(element);
            }
            
            if(pos.pageX === undefined){
                x = Math.max(e.x, e.clientX - bbox.left);
                y = e.y;
            }
            else{
                x = pos.pageX - bbox.left;
                y = pos.pageY - bbox.top;
            }
            x *= pack("number", element.width / DEVICE_PIXEL_RATIO, element.offsetWidth) / bbox.width;
            y *= pack("number", element.height / DEVICE_PIXEL_RATIO, element.offsetHeight) / bbox.height;
            return {
                x: x - Math.max(document.body.scrollLeft, global.scrollX),
                y: y - Math.max(document.body.scrollTop, global.scrollY)
            };
        };
        var Event = {
            hasTouch: hasTouch,
            normalize: normalize
        };
        return extend(Event, {
            draggable: function(){
                var sx = 0, sy = 0, dx = 0, dy = 0;
                return {
                    start: function(element, e){
                        sy = normalize(e, element);
                        dx = sx = sy.x;
                        dy = sy = sy.y;
                    },
                    drag: function(element, e){
                        dy = normalize(e, element);
                        dx = dy.x - sx;
                        dy = dy.y - sy;
                    },
                    drop: function(){
                        sx = sy = dx = dy = 0;
                    },
                    getX: function(){
                        return dx;
                    },
                    getY: function(){
                        return dy;
                    },
                    normalize: function(){
                        var length = Math.sqrt(dx * dx + dy * dy),
                            x = dx,
                            y = dy;
                        if(length > 0){
                            x /= length;
                            y /= length;
                        }
                        return {
                            x: x,
                            y: y
                        };
                    }
                };
            }
        });
    }
    return {
        deps: function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return factory.apply(global, [].concat(args));
        }
    };
})(typeof window !== "undefined" ? window : this).deps(Dalaba);
    Chart.Event = Event;
    Chart.Event.Handler = (function() {

    var dragging = false;

    var draggable;

    var isClicking = true;

    var fetchData = function(chart, start, end){
        //setTimeout(function(){
            chart.series.forEach(function(item){
                item.start = start;
                item.end = end;
                item.shapes = item.addShape();
            });
            chart.draw();
        //}, 0);
    };

    var addTooltip = function() {
        
        var timer, moving = false;
        
        function clearBuffer(chart, x, y) {
            var tooltip = chart.tooltip;

            if (tooltip.context === chart.context) {
                chart.render("hover", {x: x, y: y});//no redraw
            }
            else {
                tooltip.context.clearRect(0, 0, chart.width, chart.height);
                if(chart.legend !== null && tooltip.context === chart.legend.context){
                    chart.legend.data.length && chart.legend.draw();
                }
            }
        }
        function axisTo(chart, x, y) {
            chart.colorAxis.forEach(function(axis) {
                if (axis.options.enabled !== false) {
                    axis.addTooltip(x, y);
                }
            });
            chart.yAxis.forEach(function(axis) {
                if(axis.options.plotLine){
                    axis.addTooltip(x, y);
                }
            });
            chart.xAxis.forEach(function(axis) {
                if(axis.options.plotLine){
                    axis.addTooltip(x, y);
                }
            });
        }

        var tooltipHide = function(chart, pos) {
            var tooltip = chart.tooltip;
            var options = chart.options,
                tooltipOptions = options.tooltip || {};
            var hideDelay = pack("number", tooltipOptions.hideDelay, 1000);
            var callback = function() {
                tooltip.hide();
                pos !== null && clearBuffer(chart, pos.x, pos.y);
            };
            if (hideDelay > 0) {
                timer && clearTimeout(timer);
                timer = setTimeout(function() {
                    !moving && callback();
                }, hideDelay);
            }
            else {
                !moving && callback();
            }
        };

        var tooltipMoved = function(chart, e) {
            var pos = Event.normalize(e, chart.container),
                x = pos.x,
                y = pos.y;
            var tooltip = chart.tooltip;

            chart.container.style.cursor = "default";
            
            tooltip.move(x, y, true);
            clearBuffer(chart, x, y);
            axisTo(chart, x, y);
        };

        var tooltipEnd = function(chart, e) {
            var tooltipOptions = chart.options.tooltip,
                tooltip = chart.tooltip,
                pos = Event.normalize(e, chart.canvas);
            if (tooltip !== null) {
                if (tooltipOptions.show === true) {
                    pos = tooltip.position();
                    pos !== null && tooltip.move(pos.x, pos.y);
                }
                else tooltipHide(chart, pos);
            }
        };

        var getAllCursor = function(chart, e) {
            var canvas = chart.canvas,
                pos = e && Event.normalize(e, canvas),
                cursor;
            if (pos) {
                chart.rangeSlider.forEach(function(slider) {
                    if(slider !== null){
                        cursor = slider.getCursor(pos.x, pos.y, e);
                        canvas.style.cursor = cursor !== null ? cursor : "default";
                    }
                });
            }
            else {
                canvas.style.cursor = "default";
            }
        };

        return {
            show: function(e, chart) {
                var tooltip = chart.tooltip,
                    tooltipOptions = chart.options.tooltip;
                if (tooltip) {
                    tooltipMoved(chart, e);
                    getAllCursor(chart, e);
                    moving = tooltip.itemLength !== 0;
                    
                    if (tooltipOptions.show === true) {
                        !moving && tooltipEnd(chart, e);
                    }
                    else {
                        tooltipEnd(chart, e);
                    }
                }
            },
            hide: function(e, chart) {
                //moving = false;
                chart.tooltip && tooltipEnd(chart, e);
                getAllCursor(chart);
            }
        };
    };

    var onClick = function(e, chart) {
        var options = chart.options;
        var pos = Event.normalize(e, chart.container);
        var x = pos.x,
            y = pos.y;
        var plotOptions, click;

        if(isClicking && chart.globalAnimation.isReady === true){
            chart.charts.forEach(function(item){
                var shapes = [];
                item.series.forEach(function(series){
                    shapes = [];
                    plotOptions = (options.plotOptions || {})[series.type] || {};
                    click = (click = (click = series.events || {}).click || (plotOptions.events || {}).click);
                    if (isFunction(click)) {
                        shapes = (item.getShape && item.getShape(x, y)) || [];
                        plotOptions = (options.plotOptions || {})[item.type] || {};
                        shapes.forEach(function(item){
                            var shape = item.shape;
                            click = (click = (item.series.events || {}).click || (plotOptions.events || {}).click);
                            click && click.call({
                                x: shape.key,
                                value: shape.value,
                                color: shape.color,
                                key: shape.key,
                                point: shape,
                                total: shape.total,
                                percentage: shape.percentage,
                                series: item.series
                            }, shape, item.series, e, x, y);
                        });
                    }
                });
                shapes = (item.getShape && item.getShape(x, y)) || [];
                if(shapes.length && item.setSliced){
                    item.setSliced(shapes);
                    chart.render("click");
                }
            });
            chart.toolbar && chart.toolbar.onClick && chart.toolbar.onClick.call(chart.container, e);
        }
    };

    var onStart = function(e, chart){
        draggable = Event.draggable();
        var panel = chart.panel;
        var sx, sy;
        draggable.start(this, e);
        sx = draggable.getX(), sy = draggable.getY();
        dragging = true;
        isClicking = true;
        
        chart.rangeSlider.forEach(function(slider, i){
            var pane = panel[Math.min(panel.length - 1, slider.panelIndex | 0)];
            var rangeSelector = chart.rangeSelector[i];
            rangeSelector.maxWidth = pane.plotWidth * (1 + (1 - (rangeSelector.to - rangeSelector.from) / 100));
            rangeSelector.dragging = slider.getTarget(sx, sy) === -1 && Intersection.rect(
                {x: sx, y: sy},
                {x: pane.plotX, y: pane.plotY, width: pane.plotX + pane.plotWidth, height: pane.plotY + pane.plotHeight}
            ) && 1;//no rangeSelector;
            slider && slider.onStart(0, 0, e);
        });
        chart.charts.forEach(function(item){
            isFunction(item.onStart) && item.onStart();
        });
        document.addEventListener("mousemove", chart.globalEvent.drag, false);
    };

    var onDrag = function(e, chart){
        var container = this;
        var dx, dy, dir;

        if(!dragging) return;
        
        draggable.drag(container, e);
        dx = draggable.getX();
        dy = draggable.getY();

        isClicking = 0.1 * 0.1 - dx * dx - dy * dy > 0.001;
        
        chart.globalEvent.isDragging = true;
        chart.series.forEach(function(series) {
            if(series.type === "sankey" || series.type === "node") {
                chart.globalEvent.isDragging = false;
            }
        });
        
        chart.rangeSlider.forEach(function(slider, i) {
            var rangeSelector = chart.rangeSelector[i],
                p = Event.normalize(e, container);
            //drag plot
            if (rangeSelector.dragging) {
                dir = draggable.normalize();
                var dm = Math.max(0, Math.min(1, (Math.abs(dx)) / rangeSelector.maxWidth)) * 100;
                var v = dir.x > 0 || -1;
                var start = rangeSelector._start - dm * v,
                    end = rangeSelector._end - dm * v;
                //console.log(dm)
                var t = end - start;
                if (dir.x > 0) {
                    start = Math.max(0, start);
                    end = Math.max(t, end);
                }
                else {
                    //left
                    end = Math.min(100, end);
                    start = Math.min(100 - t, start);
                }
                rangeSelector.from = start;
                rangeSelector.to = end;
                slider && slider.startToEnd(start + "%", end + "%");
                
                chart.globalEvent.isDragging = chart.globalEvent.isDragging || !chart.globalEvent.isDragging;
                fetchData(chart, start, end);
            }
            slider && slider.onDrag(p.x, p.y, function(sv, ev, start, end){
                chart.globalEvent.isDragging = chart.globalEvent.isDragging || !chart.globalEvent.isDragging;
                rangeSelector.from = parseFloat(start, 10);
                rangeSelector.to = parseFloat(end, 10);
                fetchData(chart, start, end);
            });
        });
        chart.charts.forEach(function(item){
            if(isFunction(item.onDrag)){
                //chart.globalEvent.isDragging = false;
                item.onDrag(dx, dy, e);
            }
        });
        if(!chart.globalEvent.isDragging){
            chart.render("drag");//not dragging
        }
    };

    var onDrop = function(e, chart){
        chart.rangeSlider.forEach(function(slider, i){
            var rangeSelector = chart.rangeSelector[i];
            rangeSelector._start = rangeSelector.from;
            rangeSelector._end = rangeSelector.to;
            slider && slider.onDrop(0, 0, function(){
                //var start = this.start, end = this.end;
            });
        });
        chart.charts.forEach(function(item){
            isFunction(item.onDrop) && item.onDrop();
        });
        chart.globalEvent.isDragging = false;
        dragging = false;
        document.removeEventListener("mousemove", chart.globalEvent.drag, false);
    };

    var onZoom = function(chart){
        var getZoom = function(e){
            var deltaX, deltaY, delta;
            var vector;
            var scale = {};
            if(hasTouch){
                vector = e.originEvent.vector;
                scale.disabled = false;
                scale.length = vector.length;
                scale.scale = vector.scale;
            }
            else{
                deltaX = -e.wheelDeltaX;
                deltaY = pack("number", -e.detail, e.wheelDelta, e.wheelDeltaY, 0);
                delta = deltaY === 0 ? deltaX : deltaY;
                delta = deltaY = pack("number", -e.deltaY, deltaY);
                deltaX = pack("number", e.deltaX, deltaX);
                deltaY === 0 && (delta === -deltaX);
                if(deltaY === 0 && deltaX === 0){
                    scale.disabled = true;
                    return scale;
                }
                delta = Math.max(-1, Math.min(1, delta));
                scale.length = delta;
                scale.scale = Math.exp(delta * 0.2);
            }
            return scale;
        };
        return function(e){
            var viewport = chart.getViewport().plot,
                x = Event.normalize(e, this),
                y = x.y;
            x = x.x;
            if(Intersection.rect(
                {x: x, y: y},
                {x: viewport.left, y: viewport.top, width: viewport.left + viewport.width, height: viewport.top + viewport.height}
            )){
                var scale = getZoom(e);
                if(scale.disabled)
                    return;
                chart.rangeSlider.forEach(function(slider, i){
                    var rangeSelector = chart.rangeSelector[i];
                    var from = rangeSelector.from,
                        to = rangeSelector.to;
                    var r = Math.max(1 - from / to || 0, 0.1);
                    var v = (scale.length > 0 ? from < to | 0 : -1) * scale.scale * r;
                        v || (from = to);
                    
                    from = Math.max(0, from += v);
                    to = Math.min(100, to -= v);
                    rangeSelector.from = rangeSelector._start = from;
                    rangeSelector.to = rangeSelector._end = to;
                    
                        
                    slider && slider.startToEnd(from + "%", to + "%");
                });
                var rangeSelector = chart.rangeSelector;
                if(rangeSelector.length && rangeSelector[0].from !== rangeSelector[0].to){
                    fetchData(chart, rangeSelector[0].from, rangeSelector[0].to);
                    e.preventDefault && e.preventDefault();
                }
            }
        };
    };

    var onResize = function(e, chart){
        var timer;
        var width = chart.getSize(chart.renderer),
            height = width.height;
        width = width.width;
        
        if(chart.globalAnimation.isReady === true){
            timer && clearTimeout(timer);
            timer = setTimeout(function(){
                chart.setSize(width, height, false);
            }, 100);
        }
    };

    var onVisible = function(){
        function visible(){
        }
        (document.hidden || document.webkitHidden) && visible();
    };

    function factory(Dalaba, Event){

        function bindAll(chart, removed) {
            var container = chart.container;
            var globalEvent = chart.globalEvent;
            var type = removed ? "removeEventListener" : "addEventListener",
                useCapture = false;

            var events = {
                click: globalEvent.click,
                mousemove: globalEvent.mousemove,
                mouseout: globalEvent.mouseout,
                mousedown: globalEvent.start,
                mouseup: {el: document, listener: globalEvent.drop},
                mousewheel: globalEvent.zoom,
                DOMMouseScroll: globalEvent.zoom,
                resize: {el: window, listener: globalEvent.resize},
                visibilitychange: {el: document, listener: globalEvent.visible},
                webkitvisibilitychange: {el: document, listener: globalEvent.visible}
            }, event;
            for(var p in events) if(event = events[p], events.hasOwnProperty(p))
                (event.el || container)[type](p, event.listener || event, useCapture);

            container[type]("mousemove", globalEvent.drag, useCapture);
        }

        function event(chart) {
            var tooltip = addTooltip();

            var hasAnimateReady = function(chart) {
                return chart.globalAnimation.isReady === true;
            };
            var hasDragging = function(chart) {
                return !chart.globalEvent.isDragging;
            };
            var hasEventDisabled = function(chart) {
                return chart.globalEvent.disabled !== true;
            };

            //dnd
            chart.rangeSelector.forEach(function(selector) {
                selector._start = selector.from = pack("number", parseFloat(selector.start, 10), 0);
                selector._end = selector.to = pack("number", parseFloat(selector.end, 10), 100);
            });
            (function(chart) {
                var container = chart.container;
                var globalEvent = chart.globalEvent;

                extend(globalEvent, {
                    click: function(e) {
                        hasEventDisabled(chart) && onClick.call(this, e, chart);
                    },
                    mousemove: function(e) {
                        hasAnimateReady(chart) & hasEventDisabled(chart) & hasDragging(chart) && tooltip.show.call(this, e, chart);
                    },
                    mouseout: function(e) {
                        hasEventDisabled(chart) && tooltip.hide.call(this, e, chart);
                    },
                    start: function(e) {
                        hasEventDisabled(chart) && onStart.call(container, e, chart);
                    },
                    drop: function(e) {
                        hasEventDisabled(chart) && onDrop.call(document, e, chart);
                    },
                    drag: function(e) {
                        hasEventDisabled(chart) && onDrag.call(container, e, chart);
                    },
                    zoom: function(e) {
                        var zoom = onZoom(chart);
                        hasEventDisabled(chart) && zoom.call(container, e);
                    },
                    resize: function(e) {
                        var options = chart.options;
                        var width = options.chart.width,
                            height = options.chart.height;
                        width = Math.max(1, width), height = Math.max(1, height);
                        options.chart.reflow !== false & (!isNumber(width, true) | !isNumber(height, true)) & hasAnimateReady(chart) & onResize.call(window, e, chart);
                    },
                    visible: function(e){
                        globalEvent.disabled !== true && onVisible.call(document, e, chart);
                    }
                });

                var touchSwipe = function(e, touch) {
                    if (touch.status === "start") {
                        onStart.call(this, e, chart);
                    }
                    else if (touch.status === "move") {
                        onDrag.call(this, e, chart);
                        globalEvent.isDragging = false;
                        globalEvent.mousemove && globalEvent.mousemove.call(this, e, chart);
                    }
                    else if (touch.status === "end") {
                        onDrop.call(document, e, chart);
                        globalEvent.mouseout && globalEvent.mouseout.call(this, e, chart);
                    }
                };

                var touchPress = function(e, touch) {
                    globalEvent = chart.globalEvent;
                    onStart.call(this, e, chart);
                    globalEvent.mousemove && globalEvent.mousemove.call(this, e, chart);
                    if(touch.status === "end"){
                        globalEvent.mouseout.call(this, e, chart);
                    }
                };
                var touchTap = function(e) {
                    globalEvent.click.call(this, e, chart);
                };

                Event.hasTouch ? new Dalaba.Touch(container).on({
                    tap: touchTap,
                    press: touchPress,
                    swipe: touchSwipe,
                    pinch: function(e) {
                        globalEvent.zoom.call(this, e, chart);
                    }
                }) : bindAll(chart);
            })(chart);
        }
        event.destroy = function (chart) {
            var container = chart.container;
            if (container) {
                Event.hasTouch ? new Dalaba.Touch(container).free() : bindAll(chart, true);
            }
        };

        return event;
    }


    return {
        deps: function() {
            var args = Array.prototype.slice.call(arguments, 0);
            return factory.apply(global, [].concat(args));
        }
    };
})(typeof window !== "undefined" ? window : this).deps(Dalaba, Event);
    Chart.angleInQuadrant = (function(){
    var PI = Math.PI;
    var PI2 = PI * 2;

    var sortByAngle = function(a, b){
        return a.angle - b.angle;
    };
    var angleInQuadrant = function(angle){
        return 0 <= angle && angle < PI / 2
            ? 1
            : angle < PI
                ? 2
                : angle < PI * 1.5
                    ? 3
                    : 0;
    };
    function factoy(shapes, options){
        var quadrants = [[], [], [], []];
        var radius = options.radius || shapes[0].radius,
            maxRadius;
        var fontHeight = 0;

        shapes.forEach(function(shape){
            var angle =  shape.angle * PI / 180;
            angle %= PI2;
            angle < 0 && (angle += PI2);
            quadrants[angleInQuadrant(angle)].push({
                angle: angle,
                cx: shape.cx,
                cy: shape.cy,
                point: shape
            });
        });
        quadrants.forEach(function(item){
            item.sort(sortByAngle);
        });
        quadrants[1].reverse();
        quadrants[3].reverse();

        maxRadius = Math.max(
            radius + fontHeight,
            Math.min(radius / fontHeight, Math.max.apply(Math, quadrants.map(function(item){ return item.length; })))
        );
        quadrants.forEach(function(shapes, g){
            var length = shapes.length,
                j;
            var currentAngle = length * fontHeight,
                maxAngle = maxRadius,
                angle;
            var shape;

            for(j = 0; j < length; j++){
                shape = shapes[j];
                currentAngle -= fontHeight;
                angle = shape.angle;
                angle = Math.abs(maxRadius * Math.sin(angle));
                angle = Math.min(Math.max(angle, currentAngle), maxAngle);
                //maxAngle < angle ? (angle = maxAngle) : angle < currentAngle && (angle = currentAngle);
                shape._angle = angle;
                maxAngle = angle - fontHeight;
            }

            currentAngle = maxRadius - (length - 1) * fontHeight;
            maxAngle = 0;
            for(j = length - 1; j >= 0; --j){
                shape = shapes[j];
                currentAngle += fontHeight;
                angle = shape.angle;
                angle = Math.abs(maxRadius * Math.sin(angle));
                angle = Math.max(Math.min(angle, currentAngle), maxAngle);
                //angle < maxAngle ? (angle = maxAngle) : angle > currentAngle && (angle = currentAngle);
                maxAngle = angle + fontHeight;

                var textAlign = [1, 1, -1, -1],
                    textBaseline = [-1, 1, 1, -1];
                
                var midAngle = (angle + shape._angle) / 2,
                    toX = shape.cx + textAlign[g] * radius * Math.cos(Math.asin(Math.max(-1, Math.min(1, midAngle / maxRadius)))),
                    toY = shape.cy + midAngle * textBaseline[g];
                /*var x = shape.cx + Math.cos(shape.angle) * radius;
                if(g < 2 && toX < x || g < 1 && toX > x){
                    toX = x;
                }*/
                //console.log(g, shape);
                //toX += context.measureText(shape.text).width * [0, 0, -1, -1][g];//["start", "start", "end", "end"]
                //toY += [0, 6, 6, 0][g];//["bottom", "top", "top",  "bottom"]
                shape.point._textX = toX;
                shape.point._textY = toY;
                shape.point._quadrent = g;
                delete shape._angle;
            }
        });
    }
    return factoy;
})();;
    Chart.angle2arc = Arc.angle2arc;
    Chart.arc = Arc.arc;
    Chart.Series = (function(global) {
    var mathMax = Math.max,
        mathMin = Math.min;

    function factoy(global, Dalaba, List) {

        var defined = Dalaba.defined;

        var partition = List.partition;

        var indexOf = List.indexOf;

        var isNumber = function(v) {
            return Dalaba.isNumber(v, true);
        };

        var prediction = function(values) {
            var n = values.length,
                sum = 0,
                mean = false;
            var each = function(fn){
                var l = n & 1,
                    r = n;
                l && fn(values[0], mean === false ? 0 : mean);
                while (l < r) {
                    fn(values[l++], values[--r]);
                }
            };
            each(function(a, b){ sum += a; sum += b; });
            mean = sum / n, sum = 0;
            each(function(a, b){ sum += (a - mean) * (a - mean), sum += (b - mean) * (b - mean); });

            return values[n - 1]; //mean;// n ? Math.sqrt(sum / n) : 0;
        };

        var valueOf = function(v, k) {
            var value = parseFloat(v, 10),
                values = v.match(/([\+\-]?\d+[\.eE]?\d*)/g),
                p = values && values.length;

            if (isNumber(value) && !p) {
                return value;
            }
            if (p && values.length < 2) {
                return value = parseFloat(values[0], 10);
            }
            if (p) {
                var kdtree = new KDTree(values.map(function(t) {
                    return {x: parseFloat(t, 10)};
                }), ["x"]);
                value = kdtree.nearest({x: k}, function(a, b) {
                    return (a.x - b.x) * (a.x - b.x);
                })[0];
                kdtree.destroy();
                if (isNumber(value.x)) {
                    return value = value.x;
                }
            }
            return null;
        };

        function Series(options) {
            extend(this, options);
            this.type = options.type || "line";
            this.name = options.name;
            this.data = options.data || [];
            this.shapes = [];
            this.options = options;
        }
        Series.prototype = {
            constructor: Series,
            update: function(options, redraw) {
                var chart = this.chart,
                    series = this,
                    newSeries;
                this.options = options;
                
                if(defined(chart)){
                    newSeries = extend(this, options);
                    series._shapes = series.shapes;
                    series.shapes = series.addShape();

                    redraw !== false && chart.draw();
                }
            },
            addShape: function() {
                var newSeries = this;
                var animation = this.options.animation || {};
                var data = pack("array", newSeries.data, []),
                    item, value,
                    shapes = [], shape,
                    minValue, maxValue,
                    diff = 0;
                var vari = [];

                var type = newSeries.type;
                var length = data.length,
                    j = 0;
                var isNULL = false;

                var start = pack("number", parseFloat(newSeries.start, 10) / 100, 0),
                    end = pack("number", parseFloat(newSeries.end, 10) / 100, 1);
                start = Math.max(0, Math.min(~~(length * start), ~-length));
                end = Math.min(length, Math.max(~~(length * end), -~start));
                newSeries.startIndex = start;
                newSeries.endIndex = end;

                if(diff = (end - start)){
                    minValue = Number.MAX_VALUE,
                    maxValue = -minValue;
                    for(; start < end; start++, j++){
                        item = data[start];
                        value = item;
                        shape = {
                            series: newSeries,
                            source: item
                        };
                        if(newSeries.animationEnabled !== false){
                            shape.duration = pack("number", animation.duration, newSeries.duration);
                            shape.easing = animation.easing || newSeries.easing;
                            if(isFunction(animation.delay)) shape.delay = animation.delay.call(item, j);
                            else if(isNumber(animation.delay)) shape.delay = animation.delay;
                            else shape.delay = isFunction(newSeries.delay) ? newSeries.delay.call(item, j) : newSeries.delay;
                        }

                        if(isObject(item)){
                            value = defined(item.value) ? item.value : item.y;
                            if(type === "arearange" && defined(item.high)){
                                value = item.high;
                            }
                            extend(shape, item);
                            delete shape.x;
                            delete shape.y;
                            defined(item.x) && (shape._x = item.x);
                            defined(item.y) && (shape._y = item.y);
                        }
                        else if(isArray(item)){
                            value = defined(item[1]) ? item[1] : item[0];
                            if(type === "arearange" || defined(item[2])){
                                value = defined(item[2]) ? item[2] : item[1];
                            }
                            extend(shape, {
                                _x: item[0],
                                _y: item[1]
                            });
                        }
                        var svalue = value,
                            $value = svalue;
                        if(isString(value)){
                            var k = vari.length ? vari.length > 2 ? prediction(vari.slice(-10)) : vari[0] : 0;
                            value = valueOf(svalue = value, k);
                        }
                        
                        if(!isNumber(value) || !isFinite(value)){
                            value = svalue = null;
                            $value = "--";
                        }
                        if(isNumber(value)){
                            minValue = mathMin(minValue, value);
                            maxValue = mathMax(maxValue, value);
                            vari.push(value);
                        }
                        isNULL = value === null;
                        if(type === "candlestick"){
                            (isNULL = !(
                                isNumber(+shape.open, true) &&
                                isNumber(+shape.close, true) &&
                                isNumber(+shape.low, true) &&
                                isNumber(+shape.high, true)
                            )) || ($value = [
                                "<br>",
                                "open: " + shape.open + "<br>",
                                "close: " + shape.close + "<br>",
                                "low: " + shape.low + "<br>",
                                "high: " + shape.high + "<br>"
                            ].join(""));
                            isNULL && ((isNULL = !(
                                isNumber(+item[0], true) &&
                                isNumber(+item[1], true) &&
                                isNumber(+item[2], true) &&
                                isNumber(+item[3], true)
                            )) || ($value = [
                                "<br>",
                                "open: " + item[0] + "<br>",
                                "close: " + item[1] + "<br>",
                                "low: " + item[2]+ "<br>",
                                "high: " + item[3] + "<br>"
                            ].join("")));
                        }
                        if (!!~(indexOf(["pie", "funnel", "venn"], type))) {
                            !defined(shape.name) && (shape.name = svalue);
                        }
                        else {
                            if(type !== "diagram" && type !== "sankey")
                                shape.name = newSeries.name;
                            !defined(shape.color) && (shape.color = newSeries.color);
                        }
                        shape._value = svalue;//show value
                        shape.value = value;//cal value
                        shape.$value = $value;//tooltip value
                        shape.isNULL = isNULL;
                        shapes.push(shape);
                        if ((type === "pie" || type === "funnel")) {
                            data[start] = isObject(item) || isArray(item) ? item : {value: item};//legend data
                        }
                    }
                }
                newSeries.minValue = diff ? minValue : 0;
                newSeries.maxValue = diff ? maxValue : 0;
                return shapes;
            },
            getShape: function(){
                return this.shapes;
            },
            setOptions: function(){

            },
            setData: function(){

            },
            translate: function(){

            },
            destroy: function(){

            }
        };

        /**
         * data classification calculated
         * @param series{Array}
        */
        Series.normalize = function(series) {
            var MAX_VALUE = Number.MAX_VALUE,
                MIN_VALUE = -MAX_VALUE;
            var minValue = MAX_VALUE,
                maxValue = -minValue;
            var minAxisX = minValue,
                maxAxisX = maxValue,
                minAxisY = minValue,
                maxAxisY = maxValue;
            var isX = false, isY = false;
            var isNULL = false;

            var maxLength = -MAX_VALUE;

            var groups = partition(series, function(a, b) {
                if(a.type !== b.type)
                    return false;
                if(typeof a.stack === "undefined" && typeof b.stack === "undefined")
                    return false;
                return a.stack === b.stack;
            });
            var isAllEmpty = false;

            var ztree = new Dalaba.ZTree(series, ["type", "stack"]),
                root;

            root = ztree.update(function(item) {
                var minValue = MAX_VALUE,
                    maxValue = MIN_VALUE;
                var minAxisX = MAX_VALUE,
                    maxAxisX = MIN_VALUE;
                var minAxisY = MAX_VALUE,
                    maxAxisY = MIN_VALUE;

                item.forEach(function(item) {
                    maxLength = Math.max(maxLength, item.data.length);
                });
                var series = item[0],
                    startIndex = series.startIndex,
                    endIndex = series.endIndex;
                var isHigh;
                var m = endIndex - startIndex, n = item.length, i, j;
                var data, source, value, x = null, y = null;
                var lowValue, highValue;//no negative
                var isSelected = false;
                
                for (j = 0; j < m; j++) {
                    var positive = 0, negative = 0;
                    var isNegative = false,
                        isPositive = false;
                    var isNegativeX = false,
                        isPositiveX = false;
                    var isNegativeY = false,
                        isPositiveY = false;

                    var negativeValue = MAX_VALUE, positiveValue = MIN_VALUE;
                    var positiveX = MIN_VALUE, negativeX = MAX_VALUE, positiveXSum = 0, negativeXSum = 0;
                    var positiveY = MIN_VALUE, negativeY = MAX_VALUE, positiveYSum = 0, negativeYSum = 0;

                    for (i = 0; i < n; i++) {
                        series = item[i];
                        isSelected = isSelected || series.selected !== false;
                        if(series.selected !== false){
                            isHigh = !!~(indexOf(["arearange", "candlestick"], series.type));

                            data = series.shapes[j] || {};
                            source = series.data[~~(startIndex + j)];
                            value = data.value;

                            if(isArray(source)){
                                isNumber(source[0]) && (x = source[0], isX = isX || !isX);
                                isNumber(source[1]) && (lowValue = value = y = source[1], isY = isY || !isY);
                                isNumber(source[2]) && (highValue = source[2]);
                                if(isHigh){
                                    isY = false;//arearange use value
                                }
                            }
                            else if(isObject(source)){
                                isNumber(source.x) && (x = source.x, isX = isX || !isX);
                                isNumber(source.y) && (value = y = source.y, isY = isY || !isY);
                                isNumber(source.value) && (value = source.value);
                                isNumber(source.low) && (lowValue = source.low);
                                isNumber(source.high) && (highValue = source.high);
                            }
                            isNegative = isNegative || (isNumber(value) && value < 0);//only a negative
                            isPositive = isPositive || (isNumber(value) && value >= 0);//only a positive
                            isNegativeX = isNegativeX || x < 0;
                            isPositiveX = isPositiveX || x >= 0;
                            isNegativeY = isNegativeY || y < 0;
                            isPositiveY = isPositiveY || y >= 0;
                            isNULL = isNULL || isNumber(value) || (isNumber(lowValue) && isNumber(highValue));
                            if(isHigh){
                                positive += highValue;
                                negative += lowValue;
                                isPositive = isNegative = true;
                            }
                            else{
                                if (isNumber(value)) {
                                    if(value < 0){
                                        negative += value;
                                        positiveValue = mathMax(positiveValue, value);
                                    }
                                    else{
                                        positive += value;
                                        negativeValue = mathMin(negativeValue, value);
                                    }
                                }
                                if (isNumber(x)) {
                                    if(x < 0){
                                        negativeXSum += x;
                                        positiveX = mathMax(positiveX, x);
                                    }
                                    else{
                                        positiveXSum += x;
                                        negativeX = mathMin(negativeX, x);
                                    }
                                }
                                if (isNumber(y)) {
                                    if(y < 0){
                                        negativeYSum += y;
                                        positiveY = mathMax(positiveY, y);
                                    }
                                    else{
                                        positiveYSum += y;
                                        negativeY = mathMin(negativeY, y);
                                    }
                                }
                            }
                        }
                        maxValue = mathMax(maxValue, isPositive ? positive : positiveValue);
                        minValue = mathMin(minValue, isNegative ? negative : negativeValue);
                        maxAxisX = mathMax(maxAxisX, isPositiveX ? positiveXSum : positiveX);
                        minAxisX = mathMin(minAxisX, isNegativeX ? negativeXSum : negativeX);
                        maxAxisY = mathMax(maxAxisY, isPositiveY ? positiveYSum : positiveY);
                        minAxisY = mathMin(minAxisY, isNegativeY ? negativeYSum : negativeY);
                    }
                }

                isAllEmpty = isAllEmpty || !!n;
                return {
                    minValue: minValue,
                    maxValue: maxValue,
                    minAxisX: minAxisX,
                    maxAxisX: maxAxisX,
                    minAxisY: minAxisY,
                    maxAxisY: maxAxisY
                };
            }, function(newProps, props) {
                var cals = {
                    minValue: [mathMin, MAX_VALUE],
                    maxValue: [mathMax, MIN_VALUE],
                    minAxisX: [mathMin, MAX_VALUE],
                    maxAxisX: [mathMax, MIN_VALUE],
                    minAxisY: [mathMin, MAX_VALUE],
                    maxAxisY: [mathMax, MIN_VALUE]
                };

                for (var p in props) if (props.hasOwnProperty(p)) {
                    newProps[p] = cals[p][0](defined(newProps[p]) ? newProps[p] : (newProps[p] = cals[p][1]), props[p]);
                }
                return newProps;
            }).getRoot();
            minValue = root.minValue, maxValue = root.maxValue;
            minAxisX = root.minAxisX, maxAxisX = root.maxAxisX;
            minAxisY = root.minAxisY, maxAxisY = root.maxAxisY;
            //console.log(minValue, maxValue, "x=", minAxisX, maxAxisX, "y=", minAxisY, maxAxisY, isX, isNULL);
            
            if ((!groups.length && !isAllEmpty) || !isNULL) {
                minValue = maxValue = 
                minAxisX = maxAxisX =
                minAxisY = maxAxisY = maxLength = 0;
            }
            else {
                if (minValue === maxValue) {
                    maxValue === 0 ? (maxValue = 1) : (minValue = 0);
                }
                if (minAxisX === maxAxisX) {
                    maxAxisX === 0 ? (maxAxisX = 1) : (minAxisX = 0);
                }
                if (minAxisY === maxAxisY) {
                    maxAxisY === 0 ? (maxAxisY = 1) : (minAxisY = 0);
                }
            }
            var revalue = {
                min: minValue,
                max: maxValue,
                length: maxLength,
                groups: groups
            };
            if (isX) {
                revalue.isX = isX, revalue.minX = minAxisX, revalue.maxX = maxAxisX;
            }
            if (isY) {
                revalue.isY = isY, revalue.minY = minAxisY, revalue.maxY = maxAxisY;
            }
            return revalue;
        };
        
        return Series;
    }
    return {
        deps: function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [global].concat(args));
        }
    };
})(typeof window !== "undefined" ? window : global).deps(Dalaba, Dalaba.Cluster.List);
    Chart.scale = rescale;
    Chart.fixLinePixel = fixLinePixel;
    Chart.fixPixelHalf = fixPixelHalf;

    Dalaba.Chart = Chart;

})(Dalaba);;
//global name
var document = global.document;

var defined = Dalaba.defined,
    extend = Dalaba.extend,
    pack = Dalaba.pack,
    noop = function(){};

var isObject = Dalaba.isObject,
    isNumber = Dalaba.isNumber,
    isArray = Dalaba.isArray,
    isString = Dalaba.isString,
    isFunction = Dalaba.isFunction,
    isEmpty = Dalaba.isEmptyObject;


var Event = Dalaba.Chart.Event,
    Mathematics = Dalaba.Math,
    Geometry = Dalaba.Geometry,
    Intersection = Geometry.Intersection,
    DashLine = Geometry.Line.Dash,
    Text = Dalaba.Text,
    Color = Dalaba.Color,
    Numeric = Dalaba.Numeric,
    Formatter = Dalaba.Formatter,
    List = Dalaba.Cluster.List,
    KDTree = Dalaba.KDTree;

var toPrecision = Numeric.toPrecision,
    interpolate = Numeric.interpolate;

var arrayFilter = List.filter,
    arrayIndexOf = List.indexOf,
    partition = List.partition;

var mathLog = Mathematics.log;

var hasAxis = function(type) {
    return arrayIndexOf(["line", "spline", "column", "bar", "area", "areaspline", "arearange", "scatter", "heatmap", "candlestick"], type) > -1;
};

var hasTouch = Dalaba.Chart.hasTouch;

var rescale = Dalaba.Chart.scale;


var DEVICE_PIXEL_RATIO = Dalaba.DEVICE_PIXEL_RATIO;

var fixLinePixel = Dalaba.Chart.fixLinePixel;

var fixPixelHalf = Dalaba.Chart.fixPixelHalf;

var TRouBLe = Formatter.TRouBLe;

var dataLabels = (function() {
    var PI = Math.PI;

    var noop = function() {};

    function factoy(Dalaba, Text) {
        var defined = Dalaba.defined;

        var pack = Dalaba.pack;

        var isFunction = Dalaba.isFunction;

        var isObject = Dalaba.isObject;

        function labels() {
            var align = noop, vertical = noop;
            var newValue;

            var ret = {
                vertical: function(_){
                    vertical = _;
                    return ret;
                },
                align: function(_){
                    align = _;
                    return ret;
                },
                value: function(_){
                    newValue = _;
                    return ret;
                },
                call: function(shape, series, context) {
                    var dataLabels = series.dataLabels || {},
                        shapeLabels = shape.dataLabels || {};
                    var options = labels.options(shapeLabels, dataLabels),
                        verticalAlign = options.verticalAlign;
                    var value = labels.value(shape, dataLabels.formatter, newValue);
                    var xCallback = options.x,
                        yCallback = options.y;

                    var bbox, x, y;
                    var rotation = options.rotation,
                        angle = rotation % 360 * PI / 180;
                    if (shape.selected !== false && series.selected !== false && options.enabled === true && defined(value)) {
                        var tag = Text.HTML(Text.parseHTML(value), context, options);
                        bbox = tag.getBBox();
                        x = pack("number",
                            align.call(isObject(shape.dataLabels) ? shape.dataLabels : series.dataLabels, options.align, bbox), shape.x0, shape.x, 0
                        );
                        y = pack("number",
                            vertical.call(isObject(shape.dataLabels) ? shape.dataLabels : series.dataLabels, verticalAlign, bbox), shape.y0, shape.y, 0
                        );

                        x = isFunction(xCallback) ? x + pack("number", xCallback.call(shape, x, bbox, shape, value, series)) : (x += options.x);
                        y = isFunction(yCallback) ? y + pack("number", yCallback.call(shape, y, bbox, shape, value, series)) : (y += options.y);
                        if (rotation) {
                            if(angle > 0 && angle < PI){
                                //x = x + bbox.width / 2;
                                //y = y + bbox.height;
                            }
                            else if(angle >= PI && angle < PI * 1.5){
                                x += bbox.width;
                                y += bbox.height;
                            }
                            else if(angle >= PI * 1.5 && angle < PI * 2){
                                x += bbox.width;
                                y += bbox.height;
                            }
                            else{
                                y += bbox.height;
                            }
                        }

                        context.save();
                        context.textAlign = "start";
                        context.textBaseline = "alphabetic";
                        context.fillStyle = options.color;
                        context.font = options.fontStyle + " " + options.fontWeight + " " + options.fontSize + " " + (options.fontFamily);
                        context.translate(x, y);
                        rotation && context.rotate(angle);
                        tag.toCanvas(context);
                        context.restore();
                    }
                }
            };
            return ret;
        }
        labels.options = function(shapeLabels, dataLabels) {
            var shapeStyle = shapeLabels.style || {},
                labelStyle = dataLabels.style || {};
            return {
                enabled: shapeLabels.enabled || dataLabels.enabled,
                align: shapeLabels.align || dataLabels.align,
                verticalAlign: shapeLabels.verticalAlign || dataLabels.verticalAlign,
                rotation: pack("number", shapeLabels.rotation, dataLabels.rotation, 0),
                shapeStyle: shapeLabels,
                labelStyle: dataLabels,
                fontStyle: pack("string", shapeStyle.fontStyle, labelStyle.fontStyle, "normal"),
                fontWeight: pack("string", shapeStyle.fontWeight, labelStyle.fontWeight, "normal"),
                fontSize: pack("string", shapeStyle.fontSize, labelStyle.fontSize, "12px"),
                fontFamily: pack("string", shapeStyle.fontFamily, labelStyle.fontFamily, "Arial"),
                lineHeight: pack("string", shapeStyle.lineHeight, labelStyle.lineHeight, "normal"),
                color: shapeStyle.color || labelStyle.color || "#000",
                x: isFunction(dataLabels.x) ? dataLabels.x : pack("number", shapeLabels.x, dataLabels.x, 0),
                y: isFunction(dataLabels.y) ? dataLabels.y : pack("number", shapeLabels.y, dataLabels.y, 0)
            };
        };
        labels.value = function(shape, formatter, newValue){
            var value = shape.value,
                labelValue = shape._value;
            var v = labelValue;

            if(shape._formatterValue)
                return shape._formatterValue;

            if(defined(newValue)){
                value = v = newValue;
            }
            if (value !== null && isFunction(formatter) && !defined(shape._formatterValue)) {
                v = formatter.call({
                    x: shape.key,
                    key: shape.key,
                    value: value,
                    labelValue: labelValue,
                    color: shape.color,
                    series: shape.series,
                    point: shape,
                    total: shape.total,
                    percentage: shape.percentage
                }, value);
                shape._formatterValue = v;
            }
            return value !== null && defined(v) ? v : null;
        };
    
        return labels();
    }
    
    return {
        deps: function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
}).call(typeof window !== "undefined" ? window : this).deps(Dalaba, Dalaba.Text);

var EVENT_MOUSE_OVER = hasTouch ? "touchstart" : "mouseover";
var EVENT_MOUSE_MOVE = hasTouch ? "touchmove" : "mousemove";
var EVENT_MOUSE_OUT = hasTouch ? "touchend" : "mouseout";
var EVENT_MOUSE_DOWN = "mousedown";
var EVENT_MOUSE_UP = "mouseup";

var PI = Math.PI,
    PI2 = PI * 2;

var noop = function() {};;

(function(global, Dalaba) {
    var Series = Dalaba.Chart.Series;

    function setAttribute(el, attrs){
        if(el) for(var p in attrs)
            el.setAttribute(p, attrs[p]);
    }

    //default chart options
    var defaultOptions = {
    type: "line",
    chart: {
        width: undefined,
        height: undefined,
        spacing: hasTouch ? [0, 0, 0, 0] : [10, 10, 15, 10],
        backgroundColor: "#FFFFFF",
        style: {
            fontFamily: "\"Lucida Grande\", \"Lucida Sans Unicode\", Verdana, Arial, Helvetica, sans-serif",
            fontSize: "12px",
            fontWeight: "normal",
            color: "#333333"
        },
        reflow: true,
        animation: {
            duration: 500,
            easing: "ease-in-out"
        }
    },
    colors: ["#50E3C2", "#21A6EE", "#807CCC", "#72e6f7", "#8cd49c", "#ffc977", "#b794d5", "#f7a35c", "#434348", "#f15c80", "#e4d354", "#2b908f", "#f45b5b", "#91e8e1"],
    title: {
        enabled: true,
        text: "Chart title",
        align: "center",
        margin: [0, 0, 10, 0],
        style: {
            fontSize: "16px",
            fontWeight: "bold"
        },
        x: 0,
        y: 0
    },
    subtitle: {
        enabled: false,
        text: undefined,
        align: "center",
        style: {
            fontSize: "13px"
        },
        x: 0,
        y: 0,
        margin: [3, 0, 5, 0]
    },
    legend: {
        enabled: true,
        style: {
            color: "#606060",
            fontWeight: "bold",
            cursor: "default"
        }
    },
    tooltip: {
        enabled: true,
        shared: true,
        useHTML: true
    },
    yAxis: {
        //enabled: true,
        type: "linear",
        lineColor: "#d3d0cb",
        lineWidth: 1,
        tickColor: "#d3d0cb",
        tickWidth: 1,
        gridLineColor: "#f3f2f0",
        gridLineWidth: 1
    },
    xAxis: {
        //enabled: true,
        type: "categories",
        title: {
            enabled: false
        },
        lineColor: "#d3d0cb",
        lineWidth: 1,
        tickColor: "#d3d0cb",
        tickWidth: 1,
        gridLineColor: "#f3f2f0",
        gridLineWidth: 1
    },
    colorAxis: {
        //enabled: true,
        title: {
            enabled: false
        },
        layout: "vertical",
        floating: true,
        verticalAlign: "top",
        tickLength: 20,
        lineWidth: 0,
        labels: {
            align: "center"
        },
        size: 150,
        x: 10,
        y: 15,
        stops: [
            [0, "#EFEFFF"],
            [1, "#102D4C"]
        ]//default stops
    },
    polarAxis: {
        //type: "categories",
        //enabled: true,
        startAngle: undefined,//default -90,//top
        endAngle: undefined,
        //size: "85%",
        //center: ["50%", "50%"],//center
        //tickLength: 6,
        tickColor: "rgba(0,0,0,.5)",
    },
    radiusAxis: {
        type: "value",
        enabled: false
    },
    plotOptions: {
        series: {
            /*left: 0,
            right: 0,
            top: 20,
            bottom: 0*/
        },
        line: {
            lineWidth: 2,
            marker: {
                //enabled: null,//auto
                radius: 4,
                //lineColor: "#ffffff",
                lineWidth: 0
            },
            dataLabels: {
                enabled: false,
                style: {
                    color: "#606060"
                }
            }
        },
        spline: {
            lineWidth: 2,
            marker: {
                radius: 4
            },
            dataLabels: {
                enabled: false,
                style: {
                    color: "#606060"
                }
            }
        },
        area: {
            lineWidth: 2,
            marker: {
                radius: 4
            },
            dataLabels: {
                enabled: false,
                style: {
                    color: "#606060"
                }
            }
        },
        areaspline: {
            lineWidth: 2,
            marker: {
                radius: 4
            },
            dataLabels: {
                enabled: false,
                style: {
                    color: "#606060"
                }
            }
        },
        column: {
            borderColor: "#FFFFFF",
            borderRadius: 0,
            borderWidth: 0,
            dataLabels: {
                enabled: false,
                //align: "center",[left|center|right]
                //verticalAlign: "top",[top|middle|bottom]
                style: {
                    color: "#606060"
                }
            }
        },
        bar: {
            borderColor: "#FFFFFF",
            borderRadius: 0,
            borderWidth: 0,
            dataLabels: {
                enabled: false,
                //align: "right",[left|center|right]
                //verticalAlign: "middle",[top|middle|bottom]
                style: {
                    color: "#606060"
                }
            }
        },
        pie: {
            showInLegend: false,
            borderColor: "#FFFFFF",
            borderWidth: 1,
            dataLabels: {
                enabled: true,
                distance: hasTouch ? 0 : 15,
                inside: hasTouch ? true : undefined,
                connectorWidth: 1,
                connectorPadding: 10,
                style: {
                    color: "#606060"
                }
            }
        },
        funnel: {
            showInLegend: false,
            borderColor: "#FFFFFF",
            borderWidth: 1,
            dataLabels: {
                enabled: true,
                distance: hasTouch ? 0 : 30,
                inside: hasTouch ? true : undefined,
                style: {
                    color: "#606060"
                }
            }
        },
        map: {
            borderColor: "rgb(204, 204, 204)",
            borderWidth: 1,
            dataLabels: {
                enabled: false,
                align: "center",
                style: {
                    color: "#606060"
                }
            }
        },
        venn: {
            borderColor: "#FFFFFF",
            borderWidth: 1,
            dataLabels: {
                enabled: true,
                style: {
                    color: "#606060"
                }
            }
        },
        heatmap: {
            dataLabels: {
                enabled: false
            },
            radius: 30,
            blur: 0.15,
            fillColor: {
                linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 256,
                    y2: 1
                },
                stops: [
                    [0.25, "rgb(0,0,255)"],
                    [0.55, "rgb(0,255,0)"],
                    [0.85, "yellow"],
                    [1, "rgb(255,0,0)"]
                ]
            }
        },
        diagram: {
            borderColor: "#333333",
            borderWidth: 1,
            lineWidth: 1,
            dataLabels: {
                enabled: true,
                align: "center",
                style: {
                    color: "#606060"
                }
            }
        },
        radar: {
            lineWidth: 2,
            marker: {
                radius: 4,
                lineWidth: 0
            },
            dataLabels: {
                enabled: false,
                style: {
                    color: "#606060"
                }
            }
        },
        candlestick: {
            lineWidth: 0,
            color: ["green", "red"],
            lineColor: ["green", "red"]
        }
    },
    credits: {
        enabled: true,
        text: "MChart",
        style: {
            cursor: "pointer",
            color: "#909090",
            fontSize: "10px"
        },
        href: undefined,
        position: {
            align: "right",
            x: -10,
            y: -5,
            verticalAlign: "bottom"
        }
    },
    rangeSelector: {
        //enabled: false,
        //start: "0%",
        //end: "100%"
    },
    layout: {
        type: "flow"//grid, border, box
    },
    toolbar: {
        enabled: false
    }
};

    /*
     * OffScreen Canvas
    */
    function Layer(container, width, height){
        var canvas = document.createElement("canvas");
        this.context = canvas.getContext("2d");

        setAttribute(this.canvas = canvas, {
            width: width,
            height: height,
            style: [
                "position:absolute",
                "left:0px",
                "top:0px",
                "-webkit-user-select:none",
                "cursor:default"
            ].join(";")
        });
        rescale(this.context, width, height, DEVICE_PIXEL_RATIO);

        container.appendChild(this.canvas);
    }

    function globalStyle(options){
        var chartOptions = options.chart || {},
            plotOptions = options.plotOptions;
        var split = function(){
            var r = [];
            [].forEach.call(arguments, function(item){
                r = r.concat(isArray(item) ? item : isObject(item) ? [item] : []);
            });
            return r;
        };
        var copy = function(item, attr){
            for(var p in attr) if(!item.hasOwnProperty(p)){
                item[p] = attr[p];
            }
            return item;
        };
        split(options.yAxis, options.xAxis, options.colorAxis, options.polarAxis).map(function(item){
            return item.labels || (item.labels = {});
        }).concat(pack("array", options.title, [options.title]).map(function(item){
            copy(item, defaultOptions.title);
        }), pack("array", options.subtitle, [options.subtitle]).map(function(item){
            copy(item, defaultOptions.subtitle);
        })).concat([
            options.tooltip, options.legend, options.credits,
            plotOptions.line.dataLabels,
            plotOptions.spline.dataLabels,
            plotOptions.area.dataLabels,
            plotOptions.areaspline.dataLabels,
            plotOptions.column.dataLabels,
            plotOptions.bar.dataLabels,
            plotOptions.pie.dataLabels
        ]).forEach(function(item){
            if(defined(item)){
                if(defined(item.style)){
                    for(var p in chartOptions.style){
                        !item.style.hasOwnProperty(p) && (item.style[p] = chartOptions.style[p]);
                    }
                }
                else
                    item.style = chartOptions.style;
            }
        });
    }

    function parseImageURI(background, backgroundImage) {
        var tokens = backgroundImage.match(/\S+/g),
            url;
        var image;

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
    }
   
    var Chart = function(element, options) {
        var width, height;

        var chart = this;

        var chartOptions;

        var isNumber = function(v) {
            return Dalaba.isNumber(v, true);
        };

        if (!defined(element)) {
            return null;
        }

        this.options = extend({}, defaultOptions);
        extend(this.options, options);
        globalStyle(this.options);

        chartOptions = pack("object", this.options.chart, {});

        width = chartOptions.width, height = chartOptions.height;

        if (!isNumber(width) || !isNumber(height)) if (element.nodeType === 1) {
            height = (width = this.getSize(element)).height;
            width = width.width;
        }
        else {
            width = pack(isNumber, element.width, 0);
            height = pack(isNumber, element.height, 0);
        }

        this.width = width;
        this.height = height;

        if (element.getContext) {
            this.canvas = this.container = element;
        }
        else {
            setAttribute(this.container = document.createElement("div"), extend({
                style: [
                    "width:" + chart.width + "px",
                    "height:" + chart.height + "px",
                    "overflow:hidden",
                    "position:relative",
                    "background:transparent",
                    "-webkit-tap-highlight-color:transparent",
                    "-webkit-user-select:none"
                ].join(";")
            }, {"class": chartOptions.className}));
            (this.renderer = element).appendChild(this.container);
            this.canvas = new Layer(this.container, this.width, this.height).canvas;
        }
        this.context = this.canvas.getContext("2d");
        //make layer
        this.layer = [];
        if (element.nodeType === 1 && element.constructor === global.HTMLCanvasElement) {
            this.renderer = element;
            this.imageData = this.context.getImageData(0, 0, width, height);
            rescale(this.context, width, height, DEVICE_PIXEL_RATIO);
        }

        if (defined(chartOptions.backgroundImage)) {
            parseImageURI(this.background = { completed: false, repeat: "no-repeat", position: [0, 0], size: [0, 0]}, chartOptions.backgroundImage);
        }

        this.layer.push(this.canvas);

        this.type = this.options.type || "line";

        this.charts = [];
        this.series = [];
        this.panel = [];
        this.axis = [];
        this.xAxis = [];
        this.yAxis = [];
        this.colorAxis = [];
        this.polarAxis = [];
        this.radiusAxis = [];

        this.legend = null;
        this.title = [];
        this.tooltip = null;
        this.rangeSlider = [];
        this.rangeSelector = [];

        this.isAxis2D = false;
        this.srcOptions = options;
        this.eventAction = "update";

        var animationOptions = chartOptions.animation;
        if(!isObject(animationOptions)){
            animationOptions = {enabled: !!animationOptions};
        }

        this.globalAnimation = extend({
            isReady: false,
            enabled: animationOptions.enabled !== false//default true
        }, animationOptions);
        this.globalAnimation.initialize = true;//initial once

        this.globalEvent = {
            click: noop,
            isDragging: false
        };
    }, chartProto;

    chartProto = {
        setTitle: function() {
            var options = this.options;
            var context = this.context,
                chart = this;
            var subtitle = pack("array", options.subtitle, [options.subtitle]);
            var getTitle = function(titleOptions) {
                var style = titleOptions.style || {},
                    margin = TRouBLe(titleOptions.margin);

                return {
                    margin: margin,
                    text: titleOptions.text,
                    dx: pack("number", titleOptions.x, 0),
                    dy: pack("number", titleOptions.y, 0),
                    style: {
                        fontFamily: style.fontFamily,
                        fontSize: style.fontSize,
                        fontStyle: style.fontStyle,
                        fontWeight: style.fontWeight,
                        color: style.color
                    }
                };
            };
            var render = function(title) {
                pack("array", title, [title]).forEach(function(titleOptions, i) {
                    var subtitleOptions = subtitle[i] || {};
                    var panelIndex = titleOptions.panelIndex | 0;
                    var p1 = getTitle(titleOptions),
                        p2 = getTitle(subtitleOptions);
                    var titleText = titleOptions.enabled !== false && defined(p1.text) ? String(p1.text) : "",
                        subtitleText = subtitleOptions.enabled !== false && defined(p2.text) ? String(p2.text) : "";
                    var viewport = {
                        width: 0,
                        height: 0,
                        top: 0,
                        bottom: 0
                    };
                    var titleBBox = {}, titleTag,
                        subtitleTag, subtitleBBox = {};
                    if(titleOptions.enabled !== false && titleText.length){
                        titleBBox = (titleTag = Text.HTML(Text.parseHTML(p1.text), context, p1.style)).getBBox();
                        viewport.top = p1.margin[0];
                        viewport.bottom = p1.margin[2];
                    }
                    if(subtitleText.length){
                        subtitleBBox = (subtitleTag = Text.HTML(Text.parseHTML(p2.text), context, p2.style)).getBBox();
                        viewport.height += p2.margin[0];
                        viewport.bottom = p2.margin[2];
                    }
                    
                    viewport.width += pack("number", Math.max(titleBBox && titleBBox.width, subtitleBBox && subtitleBBox.width), 0);
                    viewport.height += pack("number", titleBBox && titleBBox.height, 0) + pack("number", subtitleBBox && subtitleBBox.height, 0);// + p2.dy;//line height
                    chart.title.push({
                        render: function(){
                            var pane = chart.panel[Math.min(panelIndex, ~-chart.panel.length)] || {
                                x: 0, y: 0, width: chart.width, height: chart.height
                            };
                            var x = 0, y = 0;
                            if(titleOptions.enabled !== false && titleText.length){
                                x = pane.x + p1.dx + (pane.width - titleBBox.width) / 2;
                                y = pane.y + p1.dy + titleBBox.height;
                                y += p1.margin[0];
                                context.save();
                                context.textAlign = "start";
                                context.textBaseline = "alphabetic";
                                context.fillStyle = p1.style.color || "#666";
                                context.font = [
                                    p1.style.fontStyle,
                                    p1.style.fontWeight,
                                    p1.style.fontSize,
                                    p1.style.fontFamily
                                ].join(" ");
                                context.translate(x, y);
                                titleTag.toCanvas(context);
                                context.restore();
                            }
                            if(subtitleOptions.enabled !== false && subtitleText.length){
                                x = pane.x + (pane.width - subtitleBBox.width) / 2 + p2.dx;
                                y = pane.y + subtitleBBox.height + pack("number", titleBBox.height, 0) + p2.dy;
                                y += p2.margin[0];
                                titleOptions.enabled !== false && titleText.length && (y += p1.margin[0]);
                                context.save();
                                context.translate(x, y);
                                subtitleTag.toCanvas(context);
                                context.restore();
                            }
                        },
                        viewport: viewport,
                        panelIndex: panelIndex
                    });
                });
            };
            render(options.title);
            return this;
        },
        setCredits: function() {
            var options = this.options,
                credits = options.credits || {},
                position = credits.position,
                style = credits.style || {},
                bbox,
                factor = 0.6;
            var chart = this;
            var context = chart.context;

            chart.credits = {
                render: function(){
                    if(credits.enabled === true && defined(credits.text)){
                        bbox = Text.measureText(credits.text, style);
                        context.save();
                        context.scale(factor, factor);
                        context.translate(position.x + chart.width / factor - bbox.width, position.y + chart.height / factor);
                        context.fillStyle = style.color;
                        context.textAlign = "start";
                        context.textBaseline = "alphabetic";
                        context.font = style.fontSize + " " + style.fontFamily;
                        context.fillText(credits.text, 0, 0);
                        context.restore();
                    }
                }
            };
        },
        setSeries: function(newData, index) {
            var options = this.options,
                chartAnimation = (options.chart || {}).animation || {},
                seriesAnimation = newData.animation || {},
                plotOptions = options.plotOptions || {},
                mergeOptions,
                rangeSelectorOptions = options.rangeSelector,
                start,
                end,
                series = this.series,
                seriesColors = options.colors;

            var newSeries;

            var type = newData.type || this.type,
                name = newData.name || "Series " + series.length;
            var animation = {
                duration: pack("number", seriesAnimation.duration, chartAnimation.duration, 500),
                easing: seriesAnimation.easing || chartAnimation.easing || "linear",
                delay: seriesAnimation.delay,// chartAnimation.delay, 0),
                enabled: chartAnimation.enabled !== false && seriesAnimation.enabled !== false
            };
            if(!isNumber(animation.delay) && !isFunction(animation.delay)){
                animation.delay = pack("number", chartAnimation.delay, 0);
            }

            newSeries = new Series(newData);
            newSeries.type = type;
            newSeries.name = name;
            newSeries.data = newData.data;
            newSeries.index = index;
            /*if(
                hasAxis(type) &&
                isArray(data = newSeries.data) &&
                !(newSeries.xAxis === null || newSeries.yAxis === null)
            ){*/
            if(defined(rangeSelectorOptions)){
                start = rangeSelectorOptions.start || "0%";
                end = rangeSelectorOptions.end || "100%";
                start = Math.min(100, Math.max(0, pack("number", parseFloat(start, 10), 0)));
                end = Math.min(100, Math.max(0, pack("number", parseFloat(end, 10), 100)));
                newSeries.start = start + "%";
                newSeries.end = end + "%";//xAxis=0
            }
            
            if(defined(newData.layer)){
                newSeries.canvas = this.addLayer(newData.layer);
                newSeries.context = newSeries.canvas.getContext("2d");
            }
            mergeOptions = extend({}, {
                    color: newSeries.color || seriesColors[index % seriesColors.length],
                    duration: animation.duration,
                    delay: animation.delay,
                    easing: animation.easing,
                    animationEnabled: animation.enabled,
                    states: {
                        hover: {}
                    }
                },
                plotOptions.series || {},
                plotOptions[newSeries.type] || {},
                newSeries
            );
            newSeries = new Series(mergeOptions);
            newSeries.shapes = newSeries.addShape();

            return newSeries;
        },
        addSeries: function(newData) {
            var newSeries = this.setSeries(newData, this.series.length);
            
            this.series.push(newSeries);
            return this;
        },
        removeSeries: function(removedSeries) {
            var series = this.series,
                i = 0;
            if(isObject(removedSeries)){
                for(; i < series.length; i++){
                    if(series[i] === removedSeries){
                        series[i].destroy();
                        this.removeSeriesAt(i);
                        break;
                    }
                }
            }
            return this;
        },
        removeSeriesAt: function(index) {
            var series = this.series;
            series.splice(Math.max(0, Math.min(index, series.length - 1)), 1);
        },
        reset: function(){
            this.xAxis.forEach(function(item){
                delete item.options.stack;
                delete item.options.series;
            });
            this.yAxis.forEach(function(item){
                delete item.options.stack;
                delete item.options.series;
            });
            this.colorAxis.forEach(function(item){
                delete item.options.stack;
                delete item.options.series;
            });
        },
        linkSeries: function() {
            var chart = this;
            var plotOptions = this.options.plotOptions || {};
            var isAxis2D;

            var axisSeries = {
                yAxis: {},
                xAxis: {},
                polarAxis: {},
                radiusAxis: {},
                colorAxis: {}
            };
            var paneltree = {
                name: "chart",
                node: this,
                parent: null,
                children: []
            };
            this.mapAxis = axisSeries;

            var clamp = function(v){
                return Math.max(0, pack("number", v, 0));
            };

            var add = function(axisSeries, key, value){
                if(!axisSeries.hasOwnProperty(key)){
                    axisSeries[key] = [value];
                }
                else{
                    axisSeries[key].push(value);
                }
            };

            partition(this.series, function(a, b){
                return a.panelIndex === b.panelIndex;
            }).forEach(function(groups){
                var maxLength = 0,
                    sumLength = 0;
                
                groups.forEach(function(series) {
                    var type = series.type;
                    series.chart = chart;
                    isAxis2D = isAxis2D || hasAxis(type);
                    series.minAxisZero = series.minAxisZero || !!~arrayIndexOf(["column", "bar"], type);
                    
                    if (series.selected !== false) {
                        series.sumLength = Math.max(sumLength, (series.data || []).length | 0);
                        series.maxLength = Math.max(maxLength, series.shapes.length);
                    }
                    //2d axis
                    if (isAxis2D) {
                        add(axisSeries.yAxis, clamp(series.yAxis), series);
                        add(axisSeries.xAxis, clamp(series.xAxis), series);
                    }
                    if (!!~(arrayIndexOf(["map", "heatmap"], type))) {
                        add(axisSeries.colorAxis, clamp(series.colorAxis), series);
                    }
                    if (!!~(arrayIndexOf(["radar"], type))) {
                        add(axisSeries.polarAxis, clamp(series.polarAxis), series);
                        add(axisSeries.radiusAxis, clamp(series.polarAxis), series);
                    }

                    if (defined(plotOptions[type])) {
                        var mergeOptions = extend({}, plotOptions[type]);
                        for(var p in mergeOptions){
                            if(!series.hasOwnProperty(p)){
                                series[p] = mergeOptions[p];
                            }
                        }
                    }
                });
            });
            
            this.panel.forEach(function(pane){
                paneltree.children.push({
                    name: "panel",
                    node: pane,
                    parent: chart,
                    children: []
                });
            });
            function enabledAxis(axis) {
                var enabled = axis._options.enabled;
                axis.options.enabled = enabled === true;
            }
            function addChild(axis) {
                partition(axis, function(a, b) {
                    return a.options.panelIndex === b.options.panelIndex;
                }).forEach(function(groups, i) {
                    var panelIndex = clamp(groups[0].options.panelIndex);
                    var series = axisSeries[groups[0].name][i] || [],
                        isEmpty = !series.length;

                    var pane = paneltree.children[panelIndex],
                        childs = pane.children,
                        child;

                    groups.forEach(function(axis) {
                        series = axisSeries[groups[0].name][clamp(axis.index)] || [];
                        child = series.map(function(s){
                            s["_" + axis.name] = axis.options;
                            return s;
                        });
                        isEmpty = !series.length;
                        isEmpty && (enabledAxis(axis));
                        if(!isEmpty){
                            childs.push({
                                name: axis.name,
                                node: axis,
                                parent: pane,
                                length: groups.length,
                                children: child
                            });
                        }
                    });
                });
            }
            addChild(this.yAxis), addChild(this.xAxis);
            addChild(this.polarAxis), addChild(this.radiusAxis);
            addChild(this.colorAxis);

            this.chartTree = paneltree;
            this.isAxis2D = isAxis2D;
        },
        linkAxis: function() {
            var options = this.options,
                rangeSelectorOptions = options.rangeSelector;
            var xAxis = function(name) {
                return name === "xAxis";
            };

            var yAxis = function(name) {
                return name === "yAxis";
            };

            var linear = function(type) {
                return type === "linear";
            };

            var categor = function(type) {
                return type === "categories";
            };

            var x = function(s) {
                return s.isX === true;
            };

            var y = function(s) {
                return s.isY === true;
            };

            var setAxis = function(node) {
                var axis = node.node,
                    series = node.children,
                    count = node.length;

                var name = axis.name,
                    seriesOptions,
                    mergeOptions,
                    seriesFirst = series[0] || {},
                    start,
                    end;
                var axisOptions = axis._options || {},
                    enabled = axisOptions.enabled,
                    categories = axisOptions.categories,
                    tickAmount = axisOptions.tickAmount,
                    type = axisOptions.type,
                    logBase = pack("number", (axisOptions.logarithmic || {}).base, 10);
                var softMax = axisOptions.softMax,
                    softMin = axisOptions.softMin;
                var max = axisOptions.max,
                    min = axisOptions.min;
                var j = -2, n;
                var isTrued;

                var minValue, maxValue, minDomain, maxDomain;

                var opera = [
                    function(name, type) {
                        return type === "logarithmic";
                    }, function() {
                        minDomain = minValue = mathLog(Math.max(minValue, 1), logBase);
                        maxDomain = maxValue = mathLog(maxValue, logBase);
                    },
                    function(name, type) {
                        return xAxis(name) && !linear(type);
                    }, function() {
                        minDomain = 0, maxDomain = seriesOptions.length;
                    },
                    function(name, type) {
                        return xAxis(name) && !categor(type) && x(seriesOptions);
                    }, function() {
                        minDomain = minValue = seriesOptions.minX;
                        maxDomain = maxValue = seriesOptions.maxX;
                    },
                    function(name, type) {
                        return yAxis(name) && !categor(type) && y(seriesOptions);
                    }, function() {
                        minDomain = minValue = seriesOptions.minY;
                        maxDomain = maxValue = seriesOptions.maxY;
                    },
                    function(name, type) {
                        return seriesFirst.minAxisZero && linear(type);
                    }, function() {
                        minDomain = minValue = Math.min(0, seriesOptions.min);//bar & column base value 0
                    },
                    function() {
                        return isNumber(softMin, true) && softMin < minValue;
                    }, function() {
                        minDomain = minValue = softMin;
                    },
                    function() {
                        return isNumber(softMax, true) && softMax < maxValue;
                    }, function() {
                        maxDomain = maxValue = softMax;
                    },
                    function() {
                        return defined(min) && isNumber(min, true);
                    }, function() {
                        minDomain = minValue = min;
                    },
                    function() {
                        return defined(max) && isNumber(max, true);
                    }, function() {
                        maxDomain = maxValue = max;
                    },
                    function() {
                        return isNumber(axisOptions.tickAmount, true);
                    }, function() {
                        tickAmount = axisOptions.tickAmount;
                    },
                    function(name, type) {
                        return categor(type) || isArray(categories);
                    }, function() {
                        var categoriesLength = pack("number", tickAmount, seriesOptions.length, categories && categories.length, 0);
                        minDomain = Math.max(0, Math.min(~~(categoriesLength * start / 100), categoriesLength - 1));
                        maxDomain = Math.max(Math.ceil(categoriesLength * end / 100), minDomain + 1);
                        if (isNumber(tickAmount, true)) {
                            tickAmount = maxDomain - minDomain;//defined axis tickAmount
                        }
                    },
                    function() {
                        return seriesOptions.length === 0;
                    }, function() {
                        minDomain = maxDomain = 0;
                    }
                ];

                if (count > 1) {
                    tickAmount = 5;
                }

                seriesOptions = extend({series: series}, Series.normalize(series));
                seriesOptions.length = seriesFirst.sumLength;
                start = pack("number", parseFloat(seriesFirst.start, 10), 0);
                end = pack("number", parseFloat(seriesFirst.end, 10), 100);
                minValue = seriesOptions.min, maxValue = seriesOptions.max;
                minDomain = minValue, maxDomain = maxValue;
                
                n = opera.length;
                while ((j += 2) < n) if (isTrued = opera[j].apply(null, [name, type])) {
                    opera[-~j](isTrued);
                }

                mergeOptions = {
                    length: seriesOptions.length,
                    domain: [minDomain, maxDomain],
                    minValue: minValue,
                    maxValue: maxValue,
                    tickAmount: tickAmount
                };
                if (defined(rangeSelectorOptions) && (
                    isNumber(rangeSelectorOptions.yAxis, true) & yAxis(name) ||
                    isNumber(rangeSelectorOptions.xAxis, true) & xAxis(name) ||
                    isNumber(rangeSelectorOptions.polarAxis, true)
                )) {
                    mergeOptions.startValue = minDomain;
                    mergeOptions.endValue = isNumber(rangeSelectorOptions.endValue, true) ? rangeSelectorOptions.endValue : null;
                }
                axis.setOptions && axis.setOptions(mergeOptions);

                isNumber(axis.minValue, true) && (minValue = axis.minValue);
                isNumber(axis.maxValue, true) && (maxValue = axis.maxValue);
                axis.options.maxValue = maxValue;
                axis.options.minValue = minValue;
                axis.options.plot = {
                    x: [seriesOptions.minX, seriesOptions.maxX],
                    y: [seriesOptions.minY, seriesOptions.maxY],
                    value: [seriesOptions.min, seriesOptions.max]
                };
                axis.options.labelWidth = axis.labelWidth;
                axis.options.labelHeight = axis.labelHeight;

                var item;
                isTrued = false;
                for (j = 0, n = series.length; /*!flag && */j < n; j++) {
                    item = series[j];
                    isTrued = isTrued || item.selected !== false;
                }
                axis.options.enabled = enabled === true || ((enabled !== false) && isTrued);
            };

            (function dfs(root) {
                var children = root.children,
                    i = -1,
                    n;
                var next = !0;

                if ((root.name.indexOf("Axis") !== -1) || !root.children) {
                    setAxis(root);
                    next = !1;
                }

                if (next && children && (n = children.length)) while(++i < n) {
                    dfs(children[i]);
                }
            })(this.chartTree);
            //resize axis
            this.translateAxis();
        },
        linkRangeSelector: function(){
            var chartOptions = this.options.chart || {},
                spacing = TRouBLe(chartOptions.spacing || []);
            var legendHeight = this.legend ? this.legend.viewport.height : 0;
            var chart = this;
            var getAxis = function(rangeSelectorOptions){
                var mapAxis = chart.mapAxis;
                var rsp = rangeSelectorOptions,
                    axisIndex, axis;
                var minValue = Number.MAX_VALUE, maxValue = -minValue;
                var startValue, endValue;
                var data = [];
                var p;

                if(!rangeSelectorOptions.hasOwnProperty("xAxis")){
                    rsp = extend({xAxis: 0}, rangeSelectorOptions);//default axis
                }
                //console.log(rsp)
                for(p in rsp) if(mapAxis.hasOwnProperty(p) && isNumber(axisIndex = rsp[p])){
                    data = [];
                    (mapAxis[p][axisIndex] || []).forEach(function(series){
                        series.selected !== false && (
                            data = series.data,
                            series.type === "candlestick" && (data = data.map(function(d){ return d.close; }))
                        );
                    });
                    if(defined(axis = chart[p][axisIndex])){
                        minValue = Math.min(minValue, axis.minValue);
                        maxValue = Math.max(maxValue, axis.maxValue);
                        startValue = "" + axis.startValue;
                        endValue = "" + axis.endValue;
                    }
                }
                return {
                    data: data,
                    minValue: minValue,
                    maxValue: maxValue,
                    startValue: startValue,
                    endValue: endValue
                };
            };
            this.rangeSlider.forEach(function(slider){
                if(slider !== null){
                    var rangeSelectorOptions = slider.options,
                        axisOptions = getAxis(slider.options);
                    slider.setOptions({
                        data: axisOptions.data,
                        y: pack("number",
                            rangeSelectorOptions.y,
                            Numeric.percentage(slider.height, rangeSelectorOptions.y),
                            chart.height - slider.height - legendHeight - spacing[2]
                        )
                    });
                }
            });
        },
        linkLegend: function() {
            var options = this.options;
            if(this.legend !== null/* && this.globalAnimation.initialize*/){
                var legendHeight = 0,
                    legendX = 0,
                    legendY = 0;
                var seriesData = [],
                    seriesColors = options.colors || [];
                if(options.legend.enabled !== false){
                    this.series.forEach(function(series, i){
                        var data = series.data;
                        if((series.type === "pie" || series.type === "funnel") && series.showInLegend === true){
                            data.forEach(function(item, j){
                                if(item !== null && (isObject(item) && item.value !== null)){
                                    var value = extend({type: series.type, seriesIndex: i, dataIndex: j}, item);//new Data
                                    !defined(value.color) && (value.color = seriesColors[j % seriesColors.length]);
                                    !defined(value.name) && (value.name = value.value);
                                    !defined(value.showInLegend) && (value.showInLegend = series.showInLegend);
                                    seriesData.push(value);
                                }
                            });
                        }
                        else{
                            series.showInLegend !== false && seriesData.push(series);
                        }
                    });

                    if(seriesData.length){
                        this.legend.setData(seriesData);
                        legendHeight = this.legend.maxHeight;
                    }
                }

                this.legend.viewport = {
                    width: this.legend.width,
                    height: Math.min(legendHeight + pack("number", this.legend.options.margin, 0), this.height / 2),
                    left: legendX,
                    top: legendY
                };
            }
        },
        setLayout: function() {
            var options = this.options,
                layout = options.layout,
                grid = layout.grid || {},
                margin = TRouBLe(grid.margin);
            var viewport = this.getViewport().getView(),
                width = viewport.width,
                height = viewport.height;

            var dx = viewport.left,
                dy = viewport.top;
            var row = pack("number", grid.row, 1),
                col = pack("number", grid.col, 1),
                n = row * col;
            var ml, mt;
            var panel = [];

            if (defined(layout.panel) && isArray(layout.panel)) {
                n = layout.panel.length;
                layout.panel.forEach(function(pane){
                    var px = pack("number", Numeric.percentage(width, pane.x), pane.x) + dx,
                        py = pack("number", Numeric.percentage(height, pane.y), pane.y) + dy,
                        pw = pack("number", Numeric.percentage(width, pane.width), pane.width, width - dx),
                        ph = pack("number", Numeric.percentage(height, pane.height), pane.height, height - dy);
                    panel.push({
                        x: px, y: py,
                        width: pw, height: ph,
                        borderWidth: pane.borderWidth,
                        borderColor: pane.borderColor,
                        backgroundColor: pane.backgroundColor,
                        plotX: px,
                        plotY: py,
                        plotWidth: pw,
                        plotHeight: ph,
                        viewport: { left: 0, right: 0, top: 0, bottom: 0},
                        yAxis: [],
                        xAxis: [],
                        polarAxis: [],
                        radiusAxis: [],
                        colorAxis: [],
                        series: [],
                    });
                });
            }
            else {
                ml = margin[3];
                mt = margin[0];

                for (var i = 0; i < n; i++) {
                    var ri = i % col,
                        ci = ~~(i / col);
                    var w = width,
                        h = height;
                    var px = ri * (w / col) + dx + ml,
                        py = ci * (h / row) + dy + mt,
                        pw = w / col - margin[1] - ml,
                        ph = h / row - margin[2] - mt;
                    panel.push({
                        x: px,
                        y: py,
                        width: pw,
                        height: ph,
                        yAxis: [],
                        xAxis: [],
                        polarAxis: [],
                        radiusAxis: [],
                        colorAxis: [],
                        series: [],
                        plotX: px,
                        plotY: py,
                        plotWidth: pw,
                        plotHeight: ph,
                        viewport: { left: 0, right: 0, top: 0, bottom: 0}
                    });
                }
            }
            var index = function(i, n) {
                return isNumber(i) && (Math.min(i, n));
            };
            var clamp = function(i, n) {
                return Math.min(Math.max(0, pack("number", i, 0) | 0), n);
            };
            partition(this.series, function(a, b) {
                return index(a.panelIndex, ~-n) === index(b.panelIndex, ~-n);
            }).forEach(function(groups){
                panel[clamp(groups[0].panelIndex, ~-n)].series = groups;
            });
            partition(this.title, function(a, b){
                return index(a.panelIndex, ~-n) === index(b.panelIndex, ~-n);
            }).forEach(function(groups){
                var pane = panel[clamp(groups[0].panelIndex, ~-n)],
                    titleBBox;
                if(groups[0]){
                    titleBBox = groups[0].viewport;// + groups[0].viewport.top + groups[0].viewport.bottom;
                    pane.viewport.top += titleBBox.height + titleBBox.bottom + titleBBox.top;
                    pane.plotY += pane.viewport.top;
                    pane.plotHeight -= pane.viewport.top;
                }
            });
            var split = function (axis) {
                partition(axis, function (a, b) {
                    return index(a.options.panelIndex, ~-n) === index(b.options.panelIndex, ~-n);
                }).forEach(function (groups) {
                    var i = clamp(groups[0].options.panelIndex, ~-n);
                    groups.forEach(function (axis) {
                        panel[i][axis.name].push(axis);
                    });
                });
            };
            split(this.yAxis);
            split(this.xAxis);
            split(this.polarAxis);
            split(this.radiusAxis);
            split(this.colorAxis);
            return this.panel = panel;
        },
        renderAll: function () {
            var options = this.options;
            var context = this.context,
                chart = this;

            function addBackgroundImage(background) {
                var position = background.position,
                    size = background.size;

                var drawImage = function(image, size) {
                    var imgWidth = pack("number", size[0], image.width),
                        imgHeight = pack("number", size[1], image.height),
                        x = pack("number", position[0]),
                        y = pack("number", position[1]);
                    var chartWidth = chart.width,
                        chartHeight = chart.height;
                    var n = imgWidth ? Math.ceil(chartWidth / imgWidth) : 0,
                        m = imgHeight ? Math.ceil(chartHeight / imgHeight) : 0,
                        i, j;

                    if (n * m > 0) {
                        background.repeat !== "repeat" && (n = m = 1);
                        context.save();
                        for (i = 0; i < n; i++) for (j = 0; j < m; j++) {
                            context.drawImage(image, x + i * imgWidth, y + j * imgHeight, imgWidth, imgHeight);
                        }
                        context.restore();
                    }
                };

                if (background.completed) {
                    drawImage(background.image, size);
                }
            }

            var Renderer = {
                image: function() {
                    defined(chart.background) && addBackgroundImage(chart.background);
                },
                background: function(){
                    var backgroundColor = (options.chart || {}).backgroundColor,
                        gradient;
                    var width = chart.canvas.width,
                        height = chart.canvas.height,
                        size = Math.min(width, height);
                    size = Math.sqrt(width * width + height * height) / 2;
                    if (defined(backgroundColor)) {
                        if(backgroundColor.linearGradient || backgroundColor.radialGradient){
                            gradient = Color.parse(backgroundColor);
                            backgroundColor = backgroundColor.radialGradient
                                ? gradient.radial((width - size) / 2, (height - size) / 2, size)
                                : gradient.linear(0, 0, width, height);
                        }
                        context.save();
                        context.fillStyle = backgroundColor;
                        context.fillRect(0, 0, width, height);
                        context.restore();
                    }
                },
                title: function(){
                    chart.title.forEach(function(title){
                        title.render();
                    });
                },
                credits: function(){
                    chart.credits && chart.credits.render();
                },
                toolbar: function() {
                    chart.toolbar && chart.toolbar.render();
                },
                legend: function() {
                    if(chart.legend !== null && chart.legend.data.length){
                        chart.legend.draw();
                    }
                },
                rangeSlider: function() {
                    chart.rangeSlider.forEach(function(slider){
                        slider && slider.draw();
                    });
                },
                tooltip: function() {
                    chart.tooltip && chart.tooltip.draw();
                },
                axis: function() {
                    chart.colorAxis.forEach(function(axis) {
                        if(axis.options.enabled !== false)
                            axis.draw();
                    });
                    chart.radiusAxis.forEach(function(axis) {
                        if(axis.options.enabled !== false)
                            axis.draw();
                    });
                    chart.polarAxis.forEach(function(axis) {
                        if(axis.options.enabled !== false)
                            axis.draw();
                    });
                }
            };

            var onRenderer = function() {
                [
                    {z: 1, render: Renderer.background},
                    {z: 2, render: Renderer.image},
                    {z: 3, render: function(){
                        var grid = options.layout.grid || {};
                        chart.panel.forEach(function(pane){
                            var x, y, width, height;
                            var linePixel;

                            var borderWidth = pack("number", pane.borderWidth, grid.borderWidth, 0),
                                borderColor = pane.borderColor || grid.borderColor,
                                backgroundColor = pane.backgroundColor || grid.backgroundColor;
                            var shadowColor = pane.shadowColor || grid.shadowColor,
                                shadowBlur = pane.shadowBlur || grid.shadowBlur,
                                shadowOffsetX = pane.shadowOffsetX || grid.shadowOffsetX,
                                shadowOffsetY = pane.shadowOffsetY || grid.shadowOffsetY;

                            linePixel = fixPixelHalf(pane.x, pane.y, pane.width, pane.height, borderWidth);

                            x = linePixel[0], y = linePixel[1];
                            width = Math.round(linePixel[2]), height = Math.round(linePixel[3]);
                            context.save();
                            context.shadowColor = shadowColor;
                            isNumber(shadowBlur) && (context.shadowBlur = shadowBlur);
                            isNumber(shadowOffsetX) && (context.shadowOffsetX = shadowOffsetX);
                            isNumber(shadowOffsetY) && (context.shadowOffsetY = shadowOffsetY);
                            if(defined(backgroundColor)){
                                context.fillStyle = backgroundColor;
                                context.fillRect(x, y, width, height);
                            }
                            if(borderWidth > 0){
                                context.beginPath();
                                context.moveTo(x, y);
                                context.lineTo(x + width, y);
                                context.lineTo(x + width, y + height);
                                context.lineTo(x, y + height);
                                context.lineTo(x, y);
                                context.strokeStyle = borderColor;
                                context.stroke();
                            }
                            context.restore();
                            //context.strokeRect(x, y, width, height);
                        });
                    }},
                    {z: 9, render: Renderer.credits},
                    {z: 8, render: Renderer.toolbar},
                    {z: 4, render: Renderer.axis},
                    {z: 5, render: Renderer.title},
                    {z: 6, render: Renderer.rangeSlider},
                    {z: 0, render: function(){
                        if(chart.container.nodeType === 1 && chart.container.constructor === global.HTMLCanvasElement){
                            context.putImageData(chart.imageData, 0, 0);
                        }
                    }}
                ].sort(function(a, b){
                    return a.z - b.z;
                }).forEach(function(item){
                    item.render();
                });
            };
            onRenderer();
        },
        renderChart: function(charts, redraw){
            var panel = this.panel;
            var chart = this;
            charts.forEach(function(item){
                if(redraw === "resize"){
                    chart.series.forEach(function(series){
                        var pane = panel[Math.min(series.panelIndex | 0, ~-panel.length)];
                        series.plotX = pack("number", pane.plotX, pane.x);
                        series.plotY = pack("number", pane.plotY, pane.y);
                        series.plotWidth = pack("number", pane.plotWidth, pane.width);
                        series.plotHeight = pack("number", pane.plotHeight, pane.height);
                        series.plotCenterX = pack("number", pane.plotCenterX, pane.width / 2, 0);
                        series.plotCenterY = pack("number", pane.plotCenterY, pane.height / 2, 0);
                        series.plotRadius = pack("number", pane.plotRadius, Math.min(pane.width, pane.height), 0);
                        series.plotRadius = pane.plotRadius;
                    });
                    item.redraw();
                }
                else{
                    item.draw();
                }
            });
        },
        clear: function() {
            var width = this.width,
                height = this.height;
            this.series.concat([{context: this.context}]).forEach(function(series) {
                var context = series.context;
                if (defined(context)) {
                    context.clearRect(0, 0, width, height);
                }
            });
        },
        draw: function() {
            var options = this.options,
                newOptions = extend({}, options);
            var Graphers = Dalaba.Chart.graphers;

            var addPlotSeries = function(chart) {
                var series = chart.series,
                    panel = chart.panel;
                var width = chart.width,
                    height = chart.height;
                var types = {};

                series.forEach(function(series) {
                    var type = series.type || chart.type;
                    var pane = panel[Math.min(series.panelIndex | 0, ~-panel.length)];
                    series.plotX = pack("number", pane.plotX, pane.x, 0);
                    series.plotY = pack("number", pane.plotY, pane.y, 0);
                    series.plotWidth = pack("number", pane.plotWidth, pane.width, width);
                    series.plotHeight = pack("number", pane.plotHeight, pane.height, height);
                    series.plotCenterX = pack("number", pane.plotCenterX, pane.width / 2, 0);
                    series.plotCenterY = pack("number", pane.plotCenterY, pane.height / 2, 0);
                    series.plotRadius = pack("number", pane.plotRadius, Math.min(pane.width, pane.height), 0);
                    types[type] = type;
                });
                return types;
            };
            var addChartor = function(chart, types, options) {
                var charts = chart.charts;
                var creator = {};
                var isCreated;
                var n, i;

                for (var type in types) {
                    isCreated = false;
                    for (i = 0, n = charts.length; !isCreated && i < n; i++) {
                        isCreated = charts[i].type === type;
                    }
                    //console.log(type, options.panel)
                    if (isCreated) {
                        charts[~-i].init(options);
                    }
                    else if (defined(Graphers[type]) && !(type in creator)) {
                        creator[type] = true;
                        charts.push(new Graphers[type](chart.canvas, options));
                    }
                }
                charts.forEach(function(item, i) {
                    if (!(item.type in types)) {
                        charts.splice(i, 1);
                    }
                });
                types = creator = null;
            };

            if (isEmpty(this.srcOptions) && this.globalAnimation.initialize && !(this.globalAnimation.initialize = false)) {
                this.renderAll();//title & credits
                return this;
            }

            this.reset();

            if (this.tooltip !== null && (this.options.tooltip || {}).show !== true) {
                this.tooltip.hide();//destroy
            }

            if (this.legend !== null && !this.legend.noScroll) {
                this.legend.destroy().scrollTop(0);
            }
            this.linkLegend();
            this.setLayout();
            this.linkSeries();//add to this series
            
            
            this.linkAxis();
            this.linkRangeSelector();
            
            newOptions.series = this.series;
            newOptions.panel = this.panel;


            addChartor(this, addPlotSeries(this), newOptions);
            this.tooltip !== null && this.tooltip.setChart(this.charts);

            
            this.render("update");
        },
        render: function(redraw, moused) {
            var options = this.options,
                events = (options.chart || {}).events || {},
                charts = this.charts,
                chart = this;
            var context = chart.context;
            var globalAnimation = chart.globalAnimation;
            var background = chart.background;
            
            var onLoad = function() {
                defined(events.load) && events.load.call(chart);
            };
            var onReady = function() {
                defined(events.ready) && events.ready.call(chart);
            };
            var onRedraw = function() {
                defined(events.redraw) && events.redraw.call(chart, redraw, moused);
            };
            
            var filterAnimation = function(chart, type) {
                var globalAnimation = chart.globalAnimation;
                return !defined(Dalaba.Animation)
                    || globalAnimation.enabled !== true
                    || !!~arrayIndexOf(["map", "heatmap", "venn", "diagram"], type);
            };

            var filterNotAnimation = function(charts, notAnimation) {
                return arrayFilter(charts, function(series) {
                    var f;
                    return (f = filterAnimation(chart, series.type)) && notAnimation.push(series), !f;
                });
            };

            var getAnimationList = function() {
                var list = [].slice.call(arguments, 0, -1),
                    initialize = !!arguments[list.length];
                var shapes = [];
                list.forEach(function(item) {
                    item.forEach(function(item) {
                        item.animateTo(context, initialize, chart.eventAction).forEach(function(shape) {
                            shapes.push(shape);
                        });
                    });
                });
                return shapes;
            };
            var drawAixs = function(){
                chart.yAxis.concat(chart.xAxis).forEach(function(axis){
                    if(axis.options.enabled !== false){
                        axis.draw();
                        axis._ticks = axis.ticks;
                    }
                });
            };

            function paintComponent(arr, ani) {
                chart.clear();
                chart.renderAll();
                drawAixs();
                ani && ani();
                chart.renderChart(arr, redraw);
                chart.legend && chart.legend.draw();
                chart.tooltip && chart.tooltip.draw();
            }

            var isEventing = function(redraw) {
                return redraw === "hover" || redraw === "resize" || redraw === "drag" || redraw === "click";
            };
            var isAnimationReady = function(chart) {
                return chart.globalAnimation.isReady === true;
            };
            var isDragging = function(chart) {
                return !chart.globalEvent.isDragging;
            };

            var Animation;

            var animateTo = function(charts, onStep, onLoad) {
                var noAnimationCharts, animationCharts = filterNotAnimation(charts, noAnimationCharts = []);

                globalAnimation.isReady = false;
                if (noAnimationCharts.length) {
                    defined(background) && defined(background.image) && background.completed !== true ?
                        new function() {
                            background.image.onload = function() {
                                background.loaded();
                                paintComponent(noAnimationCharts);
                            };
                            background.image.onerror = function () {
                                background.loaded();
                                paintComponent(noAnimationCharts);
                                background.fail();
                            };
                        }
                        : paintComponent(noAnimationCharts);
                }
                if(defined(Dalaba.Animation) && animationCharts.length){
                    Animation = new Dalaba.Animation();
                    //Animation.stop();
                    getAnimationList(animationCharts, true).forEach(function(item){
                        var shape = item[0],
                            step = item[1];
                        var animationEnabled = shape.animationEnabled;
                        if(!defined(animationEnabled) && shape.series){
                            animationEnabled = shape.series.animationEnabled;
                        }
                        Animation.addAnimate(shape, {
                            step: function(target, timer){
                                if(!animationEnabled) timer = 1;
                                step(timer);
                            },
                            complete: function(){
                                
                            },
                            duration: pack("number", shape.duration, globalAnimation.duration, 500),
                            easing: pack("string", shape.easing, globalAnimation.easing, "ease-in-out"),
                            delay: pack("number", shape.delay, globalAnimation.delay, 0)
                        });
                    });
                    Animation.fire(function(){
                        globalAnimation.isReady = false;
                        onStep && onStep(noAnimationCharts, animationCharts);
                    }, function(){
                        globalAnimation.isReady = true;
                        paintComponent(charts);
                        onLoad();
                    });
                }
                animationCharts.length | noAnimationCharts.length || (chart.renderAll(), drawAixs(), onLoad(), onReady());
                !animationCharts.length & !!noAnimationCharts.length && (onLoad(), onReady());
                globalAnimation.isReady = true;
            };
            
            if (globalAnimation.initialize === true && !(globalAnimation.initialize = false)) {
                animateTo(charts, function(noAnimationCharts, animationCharts) {
                    paintComponent(noAnimationCharts, function() {
                        animationCharts.forEach(function(item) {
                            item.onFrame && item.onFrame(context, true);
                        });
                    });
                }, function() {
                    onLoad(), onReady();
                });
            }
            else {
                if (redraw === "update") {
                    var noAnimationCharts, animationCharts = filterNotAnimation(charts, noAnimationCharts = []);

                    if (noAnimationCharts.length) {
                        paintComponent(noAnimationCharts);
                    }
                    if (defined(Dalaba.Animation) && animationCharts.length) {
                        Animation = new Dalaba.Animation();
                        Animation.stop();
                        var shapes = getAnimationList(animationCharts, chart.yAxis, chart.xAxis, false);
                        shapes.forEach(function(item){
                            var shape = item[0],
                                step = item[1];
                            Animation.addAnimate(shape, {
                                duration: 
                                    chart.eventAction === "update"
                                    ? pack("number", shape.duration, globalAnimation.duration, 500)
                                    : chart.eventAction === "selected" ? 300 : 300,
                                delay: 0,
                                easing: "linear",
                                step: function(target, timer){
                                    step(timer);
                                },
                                complete: function(){}
                            });
                        });
                        Animation.fire(function(){
                            globalAnimation.isReady = false;
                            chart.clear();
                            chart.renderAll();
                            chart.yAxis.concat(chart.xAxis).forEach(function(axis){
                                if(axis.options.enabled !== false){
                                    axis.onFrame();
                                }
                            });
                            chart.renderChart(noAnimationCharts);
                            animationCharts.forEach(function(item){
                                item.onFrame && item.onFrame(context, false);
                            });
                            chart.legend && chart.legend.draw();
                            chart.tooltip && chart.tooltip.draw();
                            onRedraw();
                        }, function() {
                            globalAnimation.isReady = true;
                            chart.clear();
                            chart.renderAll();
                            chart.yAxis.concat(chart.xAxis).forEach(function(item){
                                if(item.options.enabled !== false){
                                    item.draw();
                                }
                            });
                            chart.renderChart(charts);
                            chart.legend && chart.legend.draw();
                            chart.tooltip && chart.tooltip.draw();
                            onRedraw(), onReady();
                        });
                    }
                }
                if (isAnimationReady(chart) && isDragging(chart) && isEventing(redraw)) {
                    paintComponent(charts);
                    onRedraw();
                }
            }
        },
        getViewport: function() {
            var options = this.options,
                spacing = TRouBLe(options.chart.spacing || []),
                left = spacing[3],
                right = spacing[1],
                top = spacing[0],
                bottom = spacing[2];
            var width = this.width,
                height = this.height;
            var legendOptions,
                legendBox;
            
            var viewport = {
                left: left,
                right: right,
                top: top,
                bottom: bottom,
                width: width,
                height: height
            };
            //spacing, legend, rangeSelector
            var box = {
                left: left,
                right: right,
                top: top,
                bottom: bottom
            };

            var plot = {};//plotX, plotY, plotWidth, plotHeight
            var offsetLeft = 0,
                offsetRight = 0,
                offsetTop = 0,
                offsetBottom = 0;
            var yAxisTitleHeight = 0;

            if(this.title !== null){
                //viewport.top += this.title.viewport.height;
            }
            if(this.legend !== null && defined(this.legend.viewport)){
                legendOptions = this.legend.options;
                legendBox = this.legend.viewport;
                if(legendOptions.floating !== true){
                    if(legendOptions.layout === "vertical"){
                        legendOptions.align === "left" && (box.left += legendBox.width);
                        legendOptions.align === "right" && (box.right += legendBox.width);
                    }
                    else{
                        legendOptions.verticalAlign === "top" && (box.top += legendBox.height);
                        legendOptions.verticalAlign === "bottom" && (box.bottom += legendBox.height);
                    }
                }
            }
            this.rangeSlider.forEach(function(slider){
                if(slider !== null){
                    legendOptions = slider.options;
                    if(legendOptions.floating !== true && legendOptions.layout !== "vertical"){
                        box.bottom += slider.height + pack("number", legendOptions.margin, 0);
                    }
                }
            });

            this.yAxis.forEach(function(axis){
                if(axis.options.enabled !== false){
                    if(axis.options.opposite === true){
                        offsetRight += axis.labelWidth || 0;
                    }
                    else{
                        offsetLeft += axis.labelWidth || 0;
                    }
                    yAxisTitleHeight = Math.max(yAxisTitleHeight, pack("number", axis.titleHeight, 0));
                }
            });
            this.xAxis.forEach(function(axis){
                if(axis.options.enabled !== false){
                    if(axis.options.opposite === true){
                        offsetTop += axis.labelHeight || 0;
                    }
                    else{
                        offsetBottom += axis.labelHeight || 0;
                    }
                }
            });
            //viewport.top += offsetTop;
            viewport.top += yAxisTitleHeight;

            top = viewport.top + offsetTop;
            bottom = viewport.bottom + offsetBottom;
            left = viewport.left + offsetLeft;
            right = viewport.right + offsetRight;
            plot = {
                width: viewport.width - right - left,
                height: viewport.height - top - bottom,
                left: left,
                right: right,
                bottom: bottom,
                top: top
            };
            viewport.plot = plot;
            viewport.getPlot = function(){
                return plot;
            };
            viewport.getView = function(){
                return {
                    left: box.left,
                    right: box.right,
                    top: box.top,
                    bottom: box.bottom,
                    width: width - box.right - box.left,
                    height: height - box.top - box.bottom
                };
            };
            return viewport;
        },
        setOptions: function(options, redraw) {
            var series = [];
            var seriesOptions,
                axisOptions;
            var chart = this;
            extend(this.options, options);
            
            var remove = function(type, axisOptions){
                var oldAxis = chart[type],
                    newAxis = axisOptions;
                chart[type].splice(Math.abs(oldAxis.length - newAxis.length));
            };
            var modify = function(type, axisOptions){
                axisOptions.slice(0, chart[type].length).forEach(function(item, i){
                    var axis = chart[type][i];
                    axis.setOptions(item);
                    axis._options = item;
                });
            };
            var add = function(type, axis){
                axis.forEach(function(item){
                    var axisOptions = extend({}, defaultOptions[type]);
                    extend(axisOptions, item);
                    chart.addAxis(type, axisOptions)._options = item;
                });
            };
            var execute = function(type, axisOptions){
                axisOptions = pack("array", axisOptions, [axisOptions]);
                axisOptions.length ^ chart[type].length
                    ? axisOptions.length < chart[type].length
                        ? (remove(type, axisOptions), modify(type, axisOptions))
                        : (modify(type, axisOptions), add(type, axisOptions.slice(chart[type].length)))
                    : modify(type, axisOptions);
                //reset index
                chart[type].forEach(function(axis, i){
                    axis.index = i;
                });
            };
            defined(axisOptions = options.xAxis) && execute("xAxis", axisOptions);
            defined(axisOptions = options.yAxis) && execute("yAxis", axisOptions);
            defined(axisOptions = options.polarAxis) && execute("polarAxis", axisOptions);
            defined(axisOptions = options.colorAxis) && execute("colorAxis", axisOptions);
            //rebuild tree

            if (defined(seriesOptions = options.series)) {
                seriesOptions = pack("array", seriesOptions, []);
                List.diff(this.series, seriesOptions, function(a, b) {
                    return a.name === b.name && a.type === b.type;
                }).modify(function(newIndex, oldIndex){
                    var newSeries, oldSeries;
                    oldSeries = chart.series[oldIndex];
                    newSeries = seriesOptions[newIndex];
                    newSeries.used = true;
                    oldSeries.update(newSeries, false);
                    series.push(oldSeries);
                }).each();
                seriesOptions.forEach(function(item, i){
                    var newSeries;
                    if(!item.used){
                        newSeries = chart.setSeries(item, i);
                        newSeries._diffValues = [];
                        series.push(newSeries);
                        delete item.used;
                    }
                });
                this._series = this.series;
                this.series = series;//sort index
            }
            if (defined(options.tooltip) && this.tooltip !== null) {
                this.tooltip.setOptions(options.tooltip);
            }

            this.eventAction = "update";
            redraw !== false && this.draw();
            return this;
        },
        setSize: function(width, height) {
            var options = this.options,
                spacing = TRouBLe(options.chart.spacing || []);
            var percentage = Numeric.percentage;
            var chart = this;
            this.width = width;
            this.height = height;
            this.layer.forEach(function(layer) {
                rescale(layer.getContext("2d"), width, height, DEVICE_PIXEL_RATIO);
            });
            this.container.style.width = width + "px";
            this.container.style.height = height + "px";

            if (this.legend !== null && this.legend.data.length) {
                this.legend.destroy();
                this.legend.setOptions({
                    width: pack("number",
                        (options.legend || {}).width,//absolute value
                        percentage(width, (options.legend || {}).width),//percent
                        (width - spacing[1] - spacing[3]) * 0.7//auto
                    )
                });
                this.legend.viewport.height = Math.min(
                    this.legend.maxHeight + (pack("number", this.legend.options.margin, 0)),
                    this.height / 2
                );
            }
            if (this.tooltip !== null) {
                //this.tooltip.move();
            }
            this.rangeSlider.forEach(function(slider) {
                var rangeSelectorOptions;
                if(slider !== null){
                    rangeSelectorOptions = slider._options;
                    slider.setOptions({
                        width: pack("number",
                            rangeSelectorOptions.width,
                            Numeric.percentage(chart.width, rangeSelectorOptions.width),
                            chart.width - spacing[1] - spacing[3]
                        )
                    });
                }
            });
            this.setLayout();
            this.translateAxis();
            this.render("resize");
        },
        getSize: function(container){
            var options = this.options,
                chartOptions = options.chart || {};
            var width = chartOptions.width,
                height = chartOptions.height;

            var bbox = container.getBoundingClientRect(),
                boxWidth = pack("number", bbox.width, container.offsetWidth),
                boxHeight = pack("number", bbox.height, container.offsetHeight);

            width = Math.max(0, pack("number", width, Numeric.percentage(boxWidth, width)));
            height = Math.max(0, pack("number", height, Numeric.percentage(boxHeight, height)));
            
            if(height <= 0){
                height = pack("number", bbox.height, container.offsetHeight);
            }
            if(width <= 0){
                width = pack("number", bbox.width, container.offsetWidth);
            }
            return {
                width: width,
                height: height
            };
        },
        destroy: function(){
            var container = this.container;

            Event.Handler.destroy(this);

            this.layer.forEach(function(layer){
                container.removeChild(layer);
                layer = null;
            });

            if(this.tooltip !== null){
                this.tooltip.useHTML === true && (container.removeChild(this.tooltip.canvas));
            }
            container.parentNode.removeChild(container);

            [container, this.context, this.tooltip, this.legend].concat(
                this.xAxis, this.yAxis, this.colorAxis, this.series
            ).forEach(function(item){
                item = null;
            });
        },
        addLayer: function(isLayer){
            var layer = this.layer;
            return isNumber(isLayer) & isLayer > 0 ?
                (layer[layer.length] = new Layer(this.container, this.width, this.height).canvas)
                : this.canvas;
        },
        addAxis: function(name, axisOptions) {
            var Axis = Dalaba.Chart.Axis,
                axis = null;
            var chart = this;
            var axisMaps = {
                xAxis: 0,
                yAxis: 0,
                polarAxis: 0,
                radiusAxis: 0,
                colorAxis: 0
            };

            if (defined(Axis) && ({}).hasOwnProperty.call(axisMaps, name) && defined(this[name])) {
                if(!defined(axisOptions.range)){
                    axisOptions.range = [0, chart.width];
                }
                axis = new Axis(this.canvas, axisOptions);
                axis.name = name;
                axis.index = this[name].length;
                this[name].push(axis);
            }
            return axis;
        },
        addLegend: function(legendOptions){
            var Legend = Dalaba.Chart.Legend,
                legend = null;

            if(defined(Legend) && legendOptions.enabled !== false){
                legend = new Legend(
                    this.canvas,//this.addLayer(legendOptions.layer),
                    legendOptions.series,
                    legendOptions//selected为false不读取
                );
            }
            return legend;
        },
        addToolbar: function(toolbarOptions) {
            var options = toolbarOptions || {};
            var context = this.context;
            var toolbar;
            var width = 15,
                height = 0;
            var x = this.width - width,
                y = 0;
            var chart = this;
            var doInited = false;
            var bar;
            

            if (options.enabled === true) {
                toolbar = {
                    render: function() {
                        var w = width,
                            h = 0;
                        x = chart.width - width,
                        context.save();
                        context.fillStyle = "rgba(0, 0, 0, 0.25)";
                        context.fillRect(x, y, w, 1);
                        context.fillRect(x, y + (h += 3), w * 0.8, 1);
                        context.fillRect(x, y + (h += 3), w, 1);
                        context.fillRect(x, y + (h += 3), w * 0.8, 1);
                        context.fillRect(x, y + (h += 3), w, 1);
                        context.restore();
                        toolbar.viewport.height = height = h;
                        toolbar.viewport.x = x;
                    },
                    viewport: {
                        x: x,
                        y: y,
                        width: width
                    },
                    onClick: function(e) {
                        var pos = Event.normalize(e, this);
                        var ex = pos.x,
                            ey = pos.y;
                        if (Intersection.rect(
                            {x: ex, y: ey},
                            {x: x, y: y, width: x + width, height: y + height}
                        )) {
                            
                            if (!doInited && (doInited = !doInited)) {
                                
                                var script = document.createElement("script");
                                script.src = "/src/chart/dashboard.js";
                                script.onload = function() {
                                    
                                    new Dalaba.Chart.Dashboard(chart);
                                    
                                };
                                chart.container.appendChild(script);
                                //console.log(e);
                            }
                        }
                    }
                };

                return this.toolbar = toolbar;
            }
            return null;
        },
        translateAxis: function(){
            var panel = this.panel;
            this.yAxis.forEach(function (axis) {
                var pane = panel[Math.min(axis.options.panelIndex | 0, panel.length - 1)];
                
                if (axis.options.enabled === true) {
                    //console.log(pane.height);
                    axis.scale(0, pane.height);//viewport.height - viewport.top - viewport.bottom);
                    if(axis.options.opposite === true){
                        pane.viewport.right += axis.labelWidth;
                    }
                    else{
                        pane.viewport.left += axis.labelWidth;
                    }
                    if(!pane.yAxisTitleFirst){
                        pane.yAxisTitleFirst = true;
                        pane.viewport.top += pack("number", axis.titleHeight, 0);
                    }
                }
            });
            this.xAxis.forEach(function(axis){
                var pane = panel[Math.min(axis.options.panelIndex | 0, panel.length - 1)];
                if(axis.options.enabled === true){
                    axis.scale(0, pane.width);//viewport.width - viewport.left - viewport.right - offsetLeft - offsetRight);
                    if(axis.options.opposite === true){
                        pane.viewport.top += axis.labelHeight;
                    }
                    else{
                        pane.viewport.bottom += axis.labelHeight;
                    }
                }
            });
            //set viewport
            /*this.chartTree.children.forEach(function(pane){
                partition(pane.children, function(a, b){
                    return a.name === b.name;
                }).forEach(function(groups){
                    console.log(groups[0]);
                });
            });*/
            panel.forEach(function(item){
                var xLeftWidth = 0,
                    xRightWidth = 0,
                    yBottomHeight = 0,
                    yTopHeight = 0;

                var startX;
                item.yAxis.forEach(function(axis){
                    var pane = panel[Math.min(axis.options.panelIndex | 0, panel.length - 1)];
                    var plotHeight = pane.height - pane.viewport.top - pane.viewport.bottom,
                        plotWidth = pane.width - pane.viewport.left - pane.viewport.right,
                        plotY = pane.y + pane.viewport.top;
                    var x = pane.x,
                        y = plotY;
                    //startX = x;
                    if(axis.options.enabled !== false){
                        if(axis.options.opposite === true){
                            //startX = pane.x + axis.labelWidth;
                            x += pane.width - axis.labelWidth - xRightWidth; //xRightWidth - axis.labelWidth;
                            xRightWidth += axis.labelWidth;
                        }
                        else{
                            startX = x += axis.labelWidth + xLeftWidth;
                            xLeftWidth += axis.labelWidth;
                        }
                        axis.setOptions({
                            x: x,
                            y: y,
                            width: plotWidth,// viewport.width - viewport.left - viewport.right - offsetLeft - offsetRight,
                            range: [0, plotHeight]// viewport.height - viewport.top - viewport.bottom - offsetTop - offsetBottom]
                        });
                    }
                    pane.plotX = pack("number", startX, pane.x);//enabled is false
                    pane.plotY = y;
                    pane.plotHeight = plotHeight;
                    pane.plotWidth = plotWidth;
                });
                item.xAxis.forEach(function(axis){
                    var pane = panel[Math.min(axis.options.panelIndex | 0, panel.length - 1)];
                    var plotHeight = pane.height - pane.viewport.top - pane.viewport.bottom,
                        plotWidth = pane.width - pane.viewport.left - pane.viewport.right;
                    var y = 0;
                    if(axis.options.enabled !== false){
                        if(axis.options.opposite === true){
                            y = pane.y + pane.viewport.top + yTopHeight;
                            yTopHeight += axis.labelHeight;//titleHeight
                        }
                        else{
                            y = pane.y + pane.height - axis.labelHeight - yBottomHeight;// yBottomHeight - axis.labelHeight;
                            yBottomHeight += axis.labelHeight;
                        }
                        axis.setOptions({
                            x: pane.x + pane.viewport.left,//viewport.left + offsetLeft,
                            y: y,
                            height: plotHeight,// viewport.height - viewport.top - viewport.bottom - offsetTop - offsetBottom,
                            range: [0, plotWidth]//viewport.width - viewport.left - viewport.right - offsetLeft - offsetRight]
                        });
                    }
                    if(!item.yAxis.length){
                        pane.plotHeight = plotHeight;//no yAxis
                    }
                });

                item.polarAxis.concat(item.radiusAxis).forEach(function(axis, i){
                    var pane = panel[Math.min(axis.options.panelIndex | 0, panel.length - 1)];
                    var plotHeight = pane.height - pane.viewport.top - pane.viewport.bottom,
                        plotWidth = pane.width - pane.viewport.left - pane.viewport.right,
                        plotY = pane.y + pane.viewport.top;
                    var axisOptions = axis._options;
                    var size = Math.min(plotHeight, plotWidth) / 2,//default 85%
                        center;
                    
                    size = pack("number", axisOptions.size, Numeric.percentage(size, axisOptions.size), size * 0.85, 0);
                    center = (
                        center = pack("array", axisOptions.center, [pane.x + plotWidth / 2, plotY + plotHeight / 2]),//["50%", "50%"]
                        center.length < 2 && (center[1] = center[0]), center
                    );
                    center = [
                        pack("number", center[0], Numeric.percentage(plotWidth, center[0]), size),
                        pack("number", center[1], Numeric.percentage(plotHeight, center[1]), size)
                    ];
                    if(axis.options.enabled !== false){
                        axis.scale(0, plotWidth);
                        axis.setOptions({
                            center: center,
                            size: size,
                            width: pane.width,
                            height: pane.height,
                            range: [0, size],
                            length: pane.polarAxis[i >> 1] && pane.polarAxis[i >> 1].ticks.length//sync
                        });
                    }
                    pane.plotCenterX = center[0];
                    pane.plotCenterY = center[1];
                    pane.plotRadius = size;
                });
                item.colorAxis.forEach(function(axis){
                    var size = pack("number", axis.options.size, 150);
                    axis.scale(0, size);
                    axis.setOptions({
                        range: [0, size]
                    });
                });
            });
        },
        export: function(image, width, height, type){
            var canvas = document.createElement("canvas"),
                context = canvas.getContext("2d");
            var w = image.width,
                h = image.height;
            var data;

            rescale(context, width, height, DEVICE_PIXEL_RATIO);
            context.drawImage(
                image,
                0, 0, w, h,
                0, 0, width, height
            );
            data = canvas.toDataURL(type);
            document.location.href = data.replace(type, "image/octet-stream");
        }
    };

    Chart.prototype = chartProto;

    Dalaba.Chart.setOptions = function(options){
        defaultOptions = extend(defaultOptions, options);
    };
    Dalaba.Chart.getOptions = function(){
        return defaultOptions;
    };
    
    Dalaba.Chart.fn = Dalaba.Chart.prototype = {
        constructor: Chart,
        init: function(canvas, options) {
            if (Chart.call(this, canvas, options) === null) {
                return this;
            }

            var options = this.options,
                chart = this;
            var width = this.width,
                spacing = TRouBLe(options.chart.spacing);
            var percentage = Numeric.percentage;

            Color.GRADIENT_CONTEXT = this.context;
            Text.context(this.context);
            
            //create title
            this.setTitle();
            //create credits
            this.setCredits();
            
            pack("array", options.series, []).forEach(function(item){
                chart.addSeries(item);
            });

            //create axis
            var add = function(name, axis){
                pack("array", axis, isObject(axis) ? [axis] : [{enabled: false}]).forEach(function(item){
                    var srcOptions = isObject(item) ? item : {};
                    (chart.addAxis(name, 
                        extend({
                            name: name,
                            index: chart[name].length,
                            lang: options.lang
                            }, defaultOptions[name], srcOptions)
                        ) || {}
                    )._options = srcOptions;
                });
            };
            add("yAxis", options.yAxis), add("xAxis", options.xAxis),
            add("radiusAxis", options.radiusAxis), add("polarAxis", options.polarAxis),
            add("colorAxis", options.colorAxis);

            //create legend
            var legendOptions = extend({}, options.legend || {});
            extend(legendOptions, {
                //series: this.series,//showInLegend
                //borderWidth: 1,
                width: pack("number",
                    legendOptions.width,//absolute value
                    percentage(width, legendOptions.width),//percent
                    (width - spacing[1] - spacing[3]) * 0.7//auto
                ),
                x: {
                    left: spacing[3],
                    center: 0,
                    right: spacing[1]
                }[pack("string", legendOptions.align, "center")] + pack("number", legendOptions.x, 0),
                y: {
                    top: spacing[0],// + chart.title.viewport.height,
                    middle: 0,
                    bottom: spacing[2]
                }[pack("string", legendOptions.verticalAlign, "bottom")] + pack("number", legendOptions.y, 0)
            });
            var legend = this.addLegend(legendOptions);
            if(legend !== null){
                legend.onClick(chart.container, function(item, index){
                    var series = chart.series,
                        selected = this.selected,
                        curSeries;
                
                    if(item.type === "pie" || item.type === "funnel"){
                        pack("object", pack("object",
                            series[pack("number", item.seriesIndex, -1)], {}
                        ).data[pack("number", item.dataIndex, -1)], {}).selected = selected;
                        //item.selected = selected;
                    }
                    else{
                        curSeries = series[index];
                        curSeries.selected = selected;//modified series
                        curSeries.action = "click";//hover-on, hover-off, click-on, click-off
                    }
                    series.forEach(function(series){
                        series.shapes = series.addShape();
                    });
                    chart.eventAction = "selected";

                    legend.noScroll = true;
                    chart.draw();
                    curSeries && (curSeries.action = "");
                }).onState(chart.container, function(item){
                    var series = chart.series,
                        shape = item;
                    if(item.type === "pie" || item.type === "funnel"){
                        var shapes = pack("object",
                            series[pack("number", item.seriesIndex, -1)], {}
                        ).shapes || [];
                        shapes.forEach(function(shape){
                            delete shape.state;
                        });
                        (shape = shapes[pack("number", item.dataIndex, -1)] || {}).state = !0;
                    }
                    else{
                        series.forEach(function(series){
                            delete series.state;
                        });
                        shape.state = !0;
                    }
                    chart.render("hover");
                    delete shape.state;
                }).onScroll(chart.container, function(){
                    chart.render("click");
                });
                this.legend = legend;
            }

            var RangeSelector = Dalaba.Chart.RangeSelector;
            if(defined(options.rangeSelector)){
                (isArray(options.rangeSelector) ? options.rangeSelector : [options.rangeSelector]).forEach(function(item){
                    var rangeSelectorOptions = extend({}, item || {}),
                        rangeSlider = null;
                    var xAxisIndex = rangeSelectorOptions.xAxis,
                        yAxisIndex = rangeSelectorOptions.yAxis,
                        polarAxisIndex = rangeSelectorOptions.polarAxis;
                    if(chart.xAxis[xAxisIndex] || chart.yAxis[yAxisIndex] || chart.polarAxis[polarAxisIndex]){
                        var width = pack("number",
                                rangeSelectorOptions.width,
                                Numeric.percentage(chart.width, rangeSelectorOptions.width),
                                chart.width - spacing[1] - spacing[3]
                            ),
                            height = pack("number",
                                rangeSelectorOptions.height,
                                Numeric.percentage(chart.height, rangeSelectorOptions.height),
                                30
                            );
                        extend(rangeSelectorOptions, {
                            width: width,
                            height: height,
                            x: pack("number", rangeSelectorOptions.x, Numeric.percentage(width, rangeSelectorOptions.x), spacing[3])
                        });
                        if(defined(RangeSelector) && rangeSelectorOptions.enabled === true){
                            rangeSlider = new RangeSelector(chart.canvas, rangeSelectorOptions);
                            rangeSlider._options = item || {};
                        }
                        chart.rangeSlider.push(rangeSlider);
                        chart.rangeSelector.push({
                            start: rangeSelectorOptions.start,
                            end: rangeSelectorOptions.end
                        });
                    }
                });
            }
            //tooltip
            var tooltipOptions = this.options.tooltip;
            var Tooltip = Dalaba.Chart.Tooltip,
                tooltip = null;

            if (defined(Tooltip) && tooltipOptions.enabled !== false) {
                tooltip = new Tooltip(this.addLayer(tooltipOptions.layer), tooltipOptions);
            }
            this.tooltip = tooltip;

            this.toolbar = chart.addToolbar(options.toolbar);

            chart.draw();
            chart.container.nodeType === 1 && Event.Handler(this);

            return this;
        }
    };
    extend(Dalaba.Chart.prototype, Chart.prototype);
    Dalaba.Chart.fn.init.prototype = Dalaba.Chart.fn;
})(typeof window !== "undefined" ? window : this, Dalaba);;
    (function(global, Dalaba) {    
    var Chart = Dalaba.Chart || {};

    var defaultOptions = {
        enabled: true,
        show: false,
        animation: true,
        style: {
            fontSize: "12px",
            fontWeight: "normal",
            color: "#666666",
            cursor: "default",
            lineHeight: "16px"
        },
        padding: 5,
        crosshairs: undefined,
        shared: true,
        formatter: undefined,
        borderWidth: 0,
        borderRadius: 4,
        borderColor: "#7B7B7B",
        backgroundColor: "rgba(251, 251, 251, .85)",
        shadow: true,
        headerFormat: "",
        //crosshairs: {color, width, dashStyle, snap}
        positioner: undefined//The return should be an object containing x and y values
    };

    var symbolCallout = function(x, y, w, h, options){
        var arrowLength = 6,
            halfDistance = 6,
            r = Math.min((options && options.r) || 0, w, h),
            safeDistance = r + halfDistance,
            anchorX = options && options.anchorX,
            anchorY = options && options.anchorY,
            path;

        path = [
            "M", x + r, y, 
            "L", x + w - r, y, // top side
            "C", x + w, y, x + w, y, x + w, y + r, // top-right corner
            "L", x + w, y + h - r, // right side
            "C", x + w, y + h, x + w, y + h, x + w - r, y + h, // bottom-right corner
            "L", x + r, y + h, // bottom side
            "C", x, y + h, x, y + h, x, y + h - r, // bottom-left corner
            "L", x, y + r, // left side
            "C", x, y, x, y, x + r, y // top-right corner
        ];
        if (anchorX && anchorX > w && anchorY > y + safeDistance && anchorY < y + h - safeDistance) { // replace right side
            path.splice(13, 3,
                "L", x + w, anchorY - halfDistance, 
                x + w + arrowLength, anchorY,
                x + w, anchorY + halfDistance,
                x + w, y + h - r
            );
        } else if (anchorX && anchorX < 0 && anchorY > y + safeDistance && anchorY < y + h - safeDistance) { // replace left side
            path.splice(33, 3, 
                "L", x, anchorY + halfDistance, 
                x - arrowLength, anchorY,
                x, anchorY - halfDistance,
                x, y + r
            );
        } else if (anchorY && anchorY > h && anchorX > x + safeDistance && anchorX < x + w - safeDistance) { // replace bottom
            path.splice(23, 3,
                "L", anchorX + halfDistance, y + h,
                anchorX, y + h + arrowLength,
                anchorX - halfDistance, y + h,
                x + r, y + h
            );
        } else if (anchorY && anchorY < 0 && anchorX > x + safeDistance && anchorX < x + w - safeDistance) { // replace top
            path.splice(3, 3,
                "L", anchorX - halfDistance, y,
                anchorX, y - arrowLength,
                anchorX + halfDistance, y,
                w - r, y
            );
        }
        //console.log(path);
        return function(context){
            context.beginPath();
            context.moveTo(x + r, y);
            context.lineTo(x + w - r, y);//top side
            context.bezierCurveTo(x + w, y, x + w, y, x + w, y + r);//top-right corner
            context.lineTo(x + w, y + h - r);//right side
            context.bezierCurveTo(x + w, y + h, x + w, y + h, x + w - r, y + h);//bottom-right corner
            context.lineTo(x + r, y + h);//bottom side
            context.bezierCurveTo(x, y + h, x, y + h, x, y + h - r);//bottom-left corner
            context.lineTo(x, y + r);//left side
            context.bezierCurveTo(x, y, x, y, x + r, y);//top-right corner
            /*context.lineTo(x + w, y + h);//right
            context.lineTo(x, y + h);//bottom
            context.lineTo(x, y);*/
            //context.closePath();
        };
    };

    var symbolHTML = function(tag, text){
        var style = [].concat(Array.prototype.slice.call(arguments, 2)).join(";");
        return "<" + tag + " style='" + style + "'>" + text + "</" + tag + ">";
    };

    function Tooltip(){
        this.init.apply(this, arguments);
    }
    Tooltip.prototype = {
        Item: function(x, y, options) {
            this.x = x;
            this.y = y;
            this.node = null;
            this.selected = options.selected;
        },//new this.Element
        init: function(canvas, options) {
            var tooltipOptions;
            this.options = extend({}, defaultOptions);
            tooltipOptions = extend(this.options, options);
            this.useHTML = !!tooltipOptions.useHTML;
            this.canvas = canvas;
            this.context = canvas.getContext("2d");

            if (canvas.nodeType === 1 && this.useHTML === true) {
                var style = tooltipOptions.style || {};
                var attr = {
                    position: "absolute",
                    border: (tooltipOptions.borderWidth | 0) + "px solid " + tooltipOptions.borderColor,
                    "border-radius": tooltipOptions.borderRadius / 2 + "px",
                    "background-color": tooltipOptions.backgroundColor,
                    padding: pack("number", tooltipOptions.padding) + "px",
                    "line-height": style.lineHeight,
                    "font-weight": style.fontWeight || "normal",
                    "font-size": style.fontSize || "12px",
                    "font-family": style.fontFamily || "sans-serif",
                    "white-space": "nowrap",
                    color: style.color || "#666",
                    //visibility: "visible",
                    display: "none",
                    "z-index": 3,
                    "box-shadow": "0px 0px 3px #7B7B7B"
                };
                if(tooltipOptions.animation){
                    attr.transition = "left .1s linear, top .1s linear";
                }
                this.canvas = document.createElement("div");
                for(var p in attr) if(attr.hasOwnProperty(p)){
                    this.canvas.style[p.replace(/\-(\w)/g, function(all, s){
                        return s.toUpperCase();
                    })] = attr[p];
                }
                canvas.parentNode.appendChild(this.canvas);
            }

            this.x = +tooltipOptions.x;
            this.y = +tooltipOptions.y;
            if(isNaN(this.x)){
                this.x = -9999;
            }
            if(isNaN(this.y)){
                this.y = -9999;
            }

            this.width = 0;
            this.height = 0;

            this.itemLength = 0;
            this.visible = false;

            this.data = [];
        },
        addCrosshair: function() {
            var options = this.options,
                crosshairs = options.crosshairs;
            var bounds = this.bounds;
            if(!defined(bounds))
                return this;
            var x = this.dx,
                y = this.dy;
            //console.log(x)
            var lineWidth = 1,
                color = "#ACD8FF";
            var context = this.context;
            var left = bounds.left || 0,
                top = bounds.top || 0,
                width = (bounds.width + left) || 100,
                height = (bounds.height + top) || 25;

            var lineTo = function(x0, y0, x1, y1, prop) {
                var dashStyle = pack("string", prop.dashStyle, "solid"),
                    linePixel;
                context.lineWidth = prop.lineWidth;
                context.strokeStyle = prop.color;
                context.beginPath();
                
                linePixel = fixLinePixel(
                    x0,
                    y0,
                    x1,
                    y1,
                    prop.lineWidth
                );
                if(dashStyle === "solid"){
                    context.moveTo(x0, y0);
                    context.lineTo(x1, y1);
                    context.stroke();
                }
                else{
                    DashLine[dashStyle] ? DashLine[dashStyle](
                        context,
                        linePixel.x,
                        linePixel.y,
                        linePixel.width,
                        linePixel.height
                    ) : (context.moveTo(x0, y0), context.lineTo(x1, y1), context.stroke());
                }
            };

            if (this.visible && defined(crosshairs) && (crosshairs.length || crosshairs === true)) {
                context.save();
                crosshairs = crosshairs === true ? !0 : crosshairs[0];
                
                if(defined(crosshairs)){
                    lineTo(
                        Math.max(left, Math.min(width, x)),
                        top,
                        Math.max(left, Math.min(width, x)),
                        height,
                        {
                            lineWidth: crosshairs.lineWidth || lineWidth,
                            color: crosshairs.color || color,
                            dashStyle: crosshairs.dashStyle,
                            snap: !!crosshairs.snap
                        }
                    );
                }
                crosshairs = options.crosshairs[1];
                if(defined(crosshairs)){
                    lineTo(
                        left,
                        Math.max(top, Math.min(height, y)),
                        width,
                        Math.max(top, Math.min(height, y)),
                        {
                            lineWidth: crosshairs.lineWidth || lineWidth,
                            color: crosshairs.color || color,
                            dashStyle: crosshairs.dashStyle,
                            snap: !!crosshairs.snap
                        }
                    );
                }
                context.restore();
            }
            return this;
        },
        parseHTML: function(item, isLast) {
            var content = "";
            if(defined(item.color)){
                content += symbolHTML("span", "",
                    "display:inline-block",
                    "margin:3px",
                    "border-radius:" + item.symbolWidth / 2 + "px",
                    "width:" + item.symbolWidth + "px",
                    "height:" + item.symbolWidth + "px",
                    "background-color:" + (item.color || "inherit")
                );
            }
            content += item.value;
            content += isLast ? "" : "<br />";
            return content;
        },
        formatter: function() {
            var options = this.options,
                style = options.style || {},
                fontStyle = {
                    fontStyle: style.fontStyle || "normal",
                    fontSize: style.fontSize || "12px",
                    fontWeight: style.fontWeight || "normal",
                    fontFamily: style.fontFamily || "Arial",
                    lineHeight: style.lineHeight || "normal",
                    color: style.color
                };
            var canvas = this.canvas,
                context = this.context,
                data = this.data,
                useHTML = this.useHTML,
                tooltip = this;

            var content = "";

            data.forEach(function(item, i, items) {
                var fontWeight = fontStyle.fontWeight;
                if (item.type === "title") {
                    fontWeight = "bold";
                }
                if (item.value.nodeType === 1) {
                    content = item.value;
                }
                else if (useHTML === true) {
                    content += tooltip.parseHTML(item, !(items.length - i - 1));
                }
                else {
                    context.save();
                    context.textAlign = "start";
                    context.textBaseline = "alphabetic";
                    context.fillStyle = (fontStyle.color || "#ccc");
                    context.font = [
                        fontStyle.fontStyle,
                        fontWeight,
                        fontStyle.fontSize + "/" + fontStyle.lineHeight,
                        fontStyle.fontFamily
                    ].join(" ");
                    var tag = Text.HTML(Text.parseHTML(item.value, fontStyle), context, fontStyle);
                    context.translate(item.x, item.y);
                    tag.toCanvas();
                    if(item.type !== "title"){
                        context.fillStyle = item.color;
                        context.beginPath();
                        context.arc(-item.symbolWidth / 1.5, -item.height / 2, item.symbolWidth / 2, 0, Math.PI * 2);
                        context.fill();
                    }
                    context.restore();
                }
            });
            
            if(content.nodeType === 1){
                canvas.appendChild(content);
            }
            else if(useHTML === true){
                canvas.innerHTML = content;
            }
        },
        setLabels: function() {
            var options = this.options,
                style = options.style,
                padding = parseInt(options.padding, 10) | 0,
                lineHeight = 4,
                symbolWidth = 6;
            var x = this.x,
                y = this.y;
            var sumHeight = 0,
                sumWidth = 0;

            var canvas = this.canvas,
                useHTML = this.useHTML,
                tooltip = this;

            var content = "", bbox;

            this.data.forEach(function(item, i, items){
                var bbox = Text.measureText(item.value, style);
                var dy = -~i * (bbox.height);
                item.height = bbox.height;
                item.x = x + padding;
                item.symbolWidth = symbolWidth;
                if(i){
                    dy += i * lineHeight;
                }
                item.y = y + dy + padding;
                sumHeight = dy + padding;
                sumWidth = Math.max(bbox.width, sumWidth);
                if(item.value.nodeType === 1){
                    content = item.value;
                }
                else if(useHTML === true){
                    content += tooltip.parseHTML(item, !(~-items.length - i));
                }
            });
            if(defined(options.height) && isNumber(options.height)){
                this.height = options.height;
            }
            else{
                this.height = sumHeight + padding;
            }
            if(defined(options.width) && isNumber(options.height)){
                this.width = options.width;
            }
            else{
                this.width = sumWidth + symbolWidth + padding * 2;
            }
            if(content.nodeType === 1){
                bbox = content.getBoundingClientRect();
                canvas.innerHTML = "";
                this.width = bbox.width;
                this.height = bbox.height;
            }
            else if(useHTML === true){
                canvas.style.display = "block";
                canvas.innerHTML = content;
                bbox = canvas.getBoundingClientRect();
                this.width = bbox.width;
                this.height = bbox.height;
            }
        },
        setBounds: function(bounds) {
            this.bounds = bounds;
        },
        pointFormatter: function(items, x, y) {
            var options = this.options,
                formatter = options.formatter,
                shared = options.shared;
            var tooltip = this;
            var title, shapes, point, text;
            var length;

            if (length = items.length) {
                for (; --length >= 0 && !defined(title = items[length].key); );

                shapes = items.map(function(d) { return d.shape; });

                if (isFunction(formatter)) {
                    point = shapes[0];

                    text = formatter.call(shared ? {
                        mx: x,
                        my: y,
                        x: title,
                        key: title,
                        value: point.$value,
                        points: shapes
                    } : {
                        mx: x,
                        my: y,
                        x: title,
                        value: point.$value,
                        key: title,
                        percentage: point.percentage,
                        total: point.total,
                        point: point,
                        points: shapes
                    }, tooltip);

                    if (defined(text)) {
                        if (text.nodeType === 1) {
                            tooltip.text({
                                value: text,
                                hasDOM: true
                            });
                        }
                        else {
                            var html = Text.HTML(Text.parseHTML(text)).toHTML();
                            html = html.split(/<br\s*\/*>/);
                            if(defined(html)){
                                html.forEach(function(item){
                                    tooltip.text({
                                        value: item,
                                        //color: shape.color
                                    });
                                });
                            }
                        }
                    }
                    else {
                        tooltip.hide();
                    }
                }
                else {
                    if (defined(title)) {
                        tooltip.text({value: "<b>" + title + "</b>", type: "title"});
                    }
                    shapes.forEach(function(shape) {
                        tooltip.text(shape.name + ": " + shape.$value, {
                            color: shape.color
                        });
                    });
                }
            }
        },
        draw: function() {
            if (this.data.length) {
                this.setLabels();
                this.show();
                if (this.useHTML !== true) {
                    this.style();
                }
                this.formatter();
                this.data.splice(0);
            }
            this.addCrosshair();
        },
        style: function() {
            var options = this.options,
                padding = pack("number", options.padding, 0),
                context = this.context;
            var x = this.x - padding, y = this.y,
                width = this.width + padding, height = this.height;
            context.save();
            context.lineWidth = options.borderWidth || 0;
            context.fillStyle = options.backgroundColor;
            if(options.shadow === true){
                context.shadowColor = "#7B7B7B";
                context.shadowBlur = 6;
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;
            }
            
            if(defined(options.borderColor)){
                context.strokeStyle = options.borderColor;
            }
            symbolCallout(x, y, width, height, {
                r: options.borderRadius || 4
            })(context);
            
            if(defined(options.borderWidth) && options.borderWidth > 0){
                context.stroke();
            }
            if(defined(options.backgroundColor)){
                context.fill();
            }
            context.restore();
        },
        setOptions: function(options) {
            extend(this.options, options);
            return this;
        },
        setChart: function(charts) {
            this.charts = charts;
            //(pos = this.position()) !== null && this.move(pos.x, pos.y);
        },
        position: function(x, y) {
            var options = this.options,
                positioner = options.positioner;
            var pos;

            if (options.show === true && defined(positioner)) {
                pos = positioner;
                isFunction(positioner) && (pos = positioner.call(this, x, y, {
                    plotX: x,
                    plotY: y
                }));
                if (isObject(pos) && isNumber(pos.x) && isNumber(pos.y)) {
                    return pos;
                }
                return null;
            }
            return null;
        },
        getShape: function(x, y) {
            var options = this.options,
                shared = options.shared;
            var shapes = [];

            this.charts.forEach(function(chart) {
                pack("array", pack("function", chart.getShape, noop).call(chart, x, y, shared)).forEach(function(shape) {
                    shapes.push({
                        shape: shape.shape,
                        series: shape.series,
                        key: shape.shape.key
                    });
                });
            });
            return shapes;
        },
        move: function(x, y, isMoving) {
            var options = this.options;
            var items = this.getShape(x, y),
                length,
                plot;
            var pos = this.position(x, y);
            var isShow = options.show === true && pos !== null,
                isMove = isMoving === true;

            this.dx = x;
            this.dy = y;

            //no show item length
            if ((this.itemLength = length = items.length) || (!length && isShow && (x = pos.x, y = pos.y, (items = this.getShape(x, y)).length))) {
                plot = items[0].series;
                this.pointFormatter(items, x, y);

                this.setBounds({
                    left: plot.plotX,
                    right: 0,
                    top: plot.plotY,
                    bottom: 0,
                    width: plot.plotWidth,
                    height: plot.plotHeight
                });
            }

            switch (isMove * (!length << -~isShow) + !isMove * isShow) {
                case 0:
                    //this.draw();
                break;
                case 1:
                    this.draw();
                break;
                case 2:
                    //this.hide();
                break;
                case 4:
                    this.dx = pos.x, this.dy = pos.y, this.show();
                break;
            }
        },
        show: function() {
            var canvas = this.canvas,
                useHTML = this.useHTML;
            var margin = 8;
            var bounds = this.bounds || {};
            var height = bounds.height - bounds.top - bounds.bottom,
                width = bounds.width - bounds.left - bounds.right;
            var tooltipHeight = this.height,
                tooltipWidth = this.width;
            var x = this.dx,
                y = this.dy;

            x += margin;
            y += margin;
            if (y + tooltipHeight >= height) {
                y -= tooltipHeight;
                y -= margin * 2;
            }
            if (x + tooltipWidth >= width) {
                x -= tooltipWidth;
                x -= margin * 2;
            }
            if (x <= bounds.left) {
                x = bounds.left + margin;
            }
            if (tooltipHeight > bounds.height) {
                y = this.dy - tooltipHeight / 2;
            }
            if (tooltipHeight >= bounds.height) {
                y = this.dy - tooltipHeight / 2;
                if(y + tooltipHeight >= bounds.height) {
                    y = bounds.height - tooltipHeight - margin;
                }
            }
            if (y <= bounds.top) {
                y = bounds.top;
            }
            this.x = x;
            this.y = y;
            if (useHTML === true && isNumber(x, true) && isNumber(y, true)) {
                this.visible = true;
                canvas.style.display = "block";
                canvas.style.left = this.x + "px";
                canvas.style.top = this.y + "px";
            }
        },
        hide: function() {
            //this.bounds = {};
            this.visible = false;
            this.addCrosshair();
            this.destroy();
        },
        text: function(value, params) {
            params = params || {};
            // value can be string or array
            if (!isObject(value)) {
                value = {name: value, value: value};
            }
            defined(params.color) && (value.color = params.color);
            this.data.push(value);
            return this;
        },
        destroy: function() {
            this.data.splice(0);
            if(this.useHTML === true){
                this.canvas.style.display = "none";
                //this.canvas.innerHTML = "";
            }
        }
    };

    if(typeof module === "object")
        module.exports = Tooltip;
    else if(typeof define === "function" && define.amd)
        define(function(){
            return Tooltip;
        });
    else{
        
    }
    Chart.Tooltip = Tooltip;
})(typeof window !== "undefined" ? window : this, Dalaba);;
    (function(global, Chart){
    var Symbol = {
        circle: function(x, y, w, h) {
            var PI2 = Math.PI * 2;
            return function(context){
                context.beginPath();
                context.arc(x + w / 2, y + w / 2, w / 2 - 0.5, 0, PI2, true);
                //context.arc(x, y, h * 0.4, 0, PI2, false);
                return {
                    x: x,// + w / 2 - 1,
                    y: y,// + w / 2 - 1,
                    width: w,
                    height: h
                };
            };
        },
        rect: function(x, y, w, h, r){
            r = r || 0;
            var linePixel = fixLinePixel(x, y, w - 1, h - 1);
            x  = linePixel.x, y = linePixel.y;
            w = linePixel.width, h = linePixel.height;
            return function(context){
                context.beginPath();
                context.moveTo(x + r, y);
                //top-right
                context.lineTo(x + w - r, y);
                context.bezierCurveTo(x + w, y, x + w, y, x + w, y + r);//top-right corner
                //bottom-right
                context.lineTo(x + w, y + h - r);
                context.bezierCurveTo(x + w, y + h, x + w, y + h, x + w - r, y + h);//bottom-right corner
                //bottom-left
                context.lineTo(x + r, y + h);
                context.bezierCurveTo(x, y + h, x, y + h, x, y + h - r);//bottom-left corner
                //top-left
                context.lineTo(x, y + r);
                context.bezierCurveTo(x, y, x, y, x + r, y);//top-left corner
                //context.closePath();
                return {
                    x: x - 1,
                    y: y - 1,
                    width: w,
                    height: h
                };
            };
        },
        ellipse: function(x, y, w, h){
            var cpw = 0.166 * w;
            return function(context){
                context.beginPath();
                context.moveTo(x + w / 2, y);
                context.bezierCurveTo(x + w + cpw, y, x + w + cpw, y + h, x + w / 2, y + h);
                context.bezierCurveTo(x - cpw, y + h, x - cpw, y, x + w / 2, y);
                context.closePath();
            };
        },
        line: function(x, y, w, h){
            var PI2 = Math.PI * 2;
            return function(context){
                //Symbol.rect(x - r, y + h / 2, w + r * 2, 3)(context);
                //context.fill();
                context.save();
                context.beginPath();
                context.lineWidth = 4;
                context.moveTo(x + 3, y + w / 2 - 1);
                context.lineTo(x, y + w / 2 - 1);
                context.moveTo(x + w - 3, y + w / 2 - 1);
                context.lineTo(x + w, y + w / 2 - 1);
                context.stroke();
                //context.fill();
                context.restore();
                context.beginPath();
                context.lineWidth = 3;
                context.arc(x + w / 2, y + w / 2  - 1, w / 4, 0, PI2, true);
                return {
                    x: x,
                    y: y,
                    width: w,
                    height: h
                };
            };
        }
    };
    var defaultOptions = {
        style: {
            fontSize: "12px",
            fontWeight: "bold",
            lineHeight: "normal",
            cursor: "pointer",
            color: "#606060"
        },
        x: 0,
        y: 0,
        width: undefined,
        maxHeight: undefined,
        padding: 8,
        margin: 0,
        layout: "horizontal",//horizontal or vertical,
        verticalAlign: "bottom",//top, bottom, middle
        align: "center",//left, right or center
        floating: false,
        borderWidth: 0,
        borderColor: "#909090",
        backgroundColor: undefined,
        symbolWidth: 14,
        symbolHeight: undefined,
        symbolRadius: 6,
        symbolPadding: 4,
        symbol: {
            enabled: true,
            width: 14,
            height: undefined,
            radius: 6,
            padding: 4
        },
        itemWidth: undefined,
        itemMarginBottom: 8,
        itemDistance: 20,
        navigation: {
            animation: true
        },
        useHTML: false
    };

    var setStyle = function (context, attr) {
        for(var p in attr) if(attr.hasOwnProperty(p)){
            context.style[p.replace(/\-(\w)/g, function(all, s){
                return s.toUpperCase();
            })] = attr[p];
        }
        return context;
    };

    function Legend(){
        this.init.apply(this, arguments);
    }
    Legend.prototype = {
        Item: function(x, y, options){
            this.x = x;
            this.y = y;
            this.node = null;
            this.selected = options.selected;
        },//new this.Element
        init: function(canvas, series, options){
            this.options = extend({}, defaultOptions);
            options = extend(this.options, options);

            this.data = pack("array", series, []);

            this.container = canvas;
            this.canvas = canvas;
            this.context = this.canvas.getContext("2d");

            if (options.useHTML === true) {
                this.canvas = setStyle(canvas.parentNode.appendChild(document.createElement("div")), {
                    position: "absolute",
                    border: (options.borderWidth | 0) + "px solid " + options.borderColor,
                    "background-color": options.backgroundColor,
                    "z-index": 2
                });
            }

            this.width = 0;
            this.height = pack("number", options.height, 0);
            this.maxHeight = pack("number", options.maxHeight, 0);
            this.items = [];
            this.setLabels();
            //this.translate();
            this.translateY = 0;
            this.scroller = {next: null, prev: null};
            this.globalAnimation = {
                isFinish: false,
                startY: 0,
                current: 0
            };
        },
        translate: function(){
            var options = this.options,
                x = options.x,
                y = options.y,
                align = pack("string", options.align, "center"),
                verticalAlign = pack("string", options.verticalAlign, "bottom"),
                padding = pack("number", options.padding, 0),
                borderWidth = pack("number", options.borderWidth, 0),
               // margin = pack("number", options.margin, 0),
                width = this.width,//legend width
                height = this.maxHeight,//legend viewport height
                chartWidth = pack("number", this.container.width / DEVICE_PIXEL_RATIO, width),
                chartHeight = pack("number", this.container.height / DEVICE_PIXEL_RATIO, this.height);

            if(align === "left"){
                x += borderWidth;
            }
            else if(align === "right"){
                x = chartWidth - width - borderWidth - padding - x;// options.width - width + padding + margin;
            }
            else{
                x += (chartWidth - width) / 2;//default middle
            }
            if(verticalAlign === "top"){
                y += borderWidth;
            }
            else if(verticalAlign === "middle"){
                y += (chartHeight - height) / 2;
            }
            else{
                y = chartHeight - height - borderWidth - y;
            }
            this.x = x, this.y = y;
        },
        setData: function(series){
            this.data = series.slice(0);
            //this.translateY = 0;
            this.setLabels();
            return this;
        },
        setOptions: function(params){
            extend(this.options, params);
            this.setLabels();
            return this;
        },
        setWidth: function(width){
            this.width = width;
            this.setLabels();
        },
        setLabels: function(){
            var options = this.options,
                style = options.style,
                padding = options.padding,
                layout = options.layout,
                itemMarginBottom = pack("number", options.itemMarginBottom, 8),
                itemDistance = pack("number", options.itemDistance, 0),
                symbolPadding = pack("number", options.symbolPadding, 0),
                borderWidth = pack("number", options.borderWidth, 0),
                bbox = {width: 0, height: 0},
                symbolWidth = options.symbolWidth,
                useHTML = options.useHTML,
                formatter = options.formatter,
                fontStyle = {
                    fontStyle: style.fontStyle || "normal",
                    fontWeight: style.fontWeight || "normal",
                    fontSize: style.fontSize || "12px",
                    fontFamily: style.fontFamily || "Arial",
                    lineHeight: style.lineHeight || "normal",
                    color: style.color
                };
            var canvas = this.canvas,
                context = this.context,
                items = (this.items = []),
                length = this.data.length;
            var sumWidth = 0,
                sumHeight = 0,
                itemWidth = options.itemWidth || options.width || 80,
                lineNumber = 1,
                maxHeight = 0,
                x = padding,
                y = 0;
            var count = 0;
            var linePixel;
            var itemHTML = "";
            var legend = this;
            var isFormatter = isFunction(formatter);

            this.data.forEach(function(item, i){
                var text = item.name,
                    selected = item.selected !== false,//默认显示
                    disabled = item.showInLegend !== false;
                var width = 0,
                    textHeight = 0;
                var legendItem;
                var legendFormatter;
                var nowrap = false;
                if (disabled) {
                    context.font = [
                        fontStyle.fontStyle,
                        fontStyle.fontWeight,
                        fontStyle.fontSize + "/" + fontStyle.lineHeight,
                        fontStyle.fontFamily
                    ].join(" ");
                    bbox = Text.measureText(text, fontStyle);
                    textHeight = symbolWidth;// Math.max(symbolWidth, bbox.height);

                    if(bbox.width >= itemWidth){
                        text = Text.multipText(text, itemWidth, fontStyle);
                    }
                    bbox.width = Text.measureText(text, fontStyle).width;
                    width = bbox.width + ({
                        column: symbolWidth,
                        pie: symbolWidth,
                        line: symbolWidth + 4
                    }[item.type] || symbolWidth) + symbolPadding;
                    //第一个除外
                    if(count && (layout === "vertical" || ((x + width) >= options.width - padding * 2))){
                        nowrap = true;
                        x = padding;
                        //width -= itemDistance;
                        y += textHeight + itemMarginBottom;
                        if(lineNumber % 3 === 0){
                            y += padding - itemMarginBottom;
                        }
                        
                        if(lineNumber === 3){
                            maxHeight = y;//clip height
                        }
                        lineNumber++;
                    }
                    count++;
                }
                items.push(legendItem = {
                    x: x,
                    y: y,
                    width: width,
                    height: textHeight,
                    text: item.name,
                    value: item.name,
                    selected: selected,
                    disabled: disabled,
                    ellipse: text,
                    type: item.type,
                    color: (item.color || style.color),
                    series: item,
                    index: i,
                    nowrap: nowrap
                });
                legendFormatter = isFormatter && formatter.call(legendItem, legendItem.value, legendItem.index, legend);
                if (useHTML === true) {
                    var legendItemHTML = [
                        "<p style='",
                            [
                                "position: absolute",
                                "left:" + (x) + "px",
                                "top:" + (y + symbolPadding) + "px",
                                "color:" + (selected ? fontStyle.color : "#ccc"),
                                "font:" + fontStyle.fontStyle + " " + fontStyle.fontWeight + " " + fontStyle.fontSize + " " + fontStyle.fontFamily,
                                "white-space: nowrap"
                            ].join(";"),
                        "' data-legend-index='" + i + "'>",
                        "<span style='",
                            [
                                "display:inline-block",
                                "position:relative",
                                "top:3px",
                                "border-radius:3px",
                                "width:" + symbolWidth + "px",
                                "height:" + symbolWidth + "px",
                                "background-color:" + (selected ? (item.color || style.color) : "#ccc")
                            ].join(";"),
                        "'></span>",
                        " " + text,
                        "</p>"
                    ];
                    if (isFormatter) {
                        if (defined(legendFormatter)) legendItemHTML[6] = legendFormatter, itemHTML += legendItemHTML.join("");
                    }
                    else {
                        itemHTML += legendItemHTML.join("");
                    }
                }
                if (!isFormatter || legendFormatter) {
                    x += width + itemDistance * (layout === "horizontal");
                }
                sumWidth = Math.max(sumWidth, x);
                sumHeight = y;
            });
            //sumHeight += bbox.height + padding / 2;
            sumHeight += symbolWidth;// + padding / 2;
            if(!defined(options.height)){
                this.height = (sumHeight + padding) * (length !== 0);
            }
            this.width = (sumWidth + padding * 2 - itemDistance * (layout === "horizontal")) * (length !== 0);//fix width
            if(lineNumber < 4){
                maxHeight = this.height;
            }
            if(layout === "vertical"){
                maxHeight = this.height;
            }
            if(isNumber(options.maxHeight)){
                maxHeight = options.maxHeight;
            }
            this.maxHeight = (maxHeight + padding) * (length !== 0);//options.borderWidth * 2
            this.lineNumber = lineNumber * (length !== 0);

            this.translate();

            linePixel = fixLinePixel(0, 0, this.width + (this.height > this.maxHeight) * 15, this.maxHeight - borderWidth, borderWidth);

            if (useHTML === true && itemHTML.length) {
                setStyle(canvas, {
                    left: this.x + linePixel.x + "px",
                    top: this.y + linePixel.y + "px",
                    height: linePixel.height + "px",
                    width: linePixel.width + "px",
                    overflow: "auto"
                });
                canvas.innerHTML = itemHTML;
            }
        },
        scrollTop: function(y){
            this.translateY = y;
        },
        formatter: function(){
            var context = this.context,
                options = this.options,
                style = pack("object", options.style, {}),
                formatter = options.formatter,
                fontStyle = {
                    fontStyle: pack("string", style.fontStyle, "normal"),
                    fontWeight: pack("string", style.fontWeight, "normal"),
                    fontSize: pack("string", style.fontSize, "12px"),
                    fontFamily: pack("string", style.fontFamily, "Arial"),
                    lineHeight: pack("string", style.lineHeight, "normal"),
                    color: style.color
                },
                padding = pack("number", options.padding, 0);
            var symbolWidth = pack("number", options.symbolWidth, 16),
                symbolRadius = pack("number", options.symbolRadius, 0),
                symbolPadding = pack("number", options.symbolPadding, 0),
                //symbolHeight = 10,
                symbolTypes = {},
                symbolBBox;
            var legend = this;

            context.save();
            context.translate(padding, padding + this.translateY);
            this.items.forEach(function(item){
                var x = item.x,
                    y = item.y;
                var color = item.selected ? item.color : "#ccc";
                var tag, bbox;
                var legendFormatter = isFunction(formatter) && formatter.call(item, item.value, item.index, legend);
                if(item.disabled) {
                    context.save();
                    //context.textBaseline = "bottom"
                    context.font = [
                        fontStyle.fontStyle,
                        fontStyle.fontWeight,
                        fontStyle.fontSize + "/" + (fontStyle.lineHeight),
                        fontStyle.fontFamily
                    ].join(" ");
                    if (isFunction(formatter)) {
                        if (defined(legendFormatter)) {
                            tag = Text.HTML(Text.parseHTML(legendFormatter), context, fontStyle);
                        }
                    }
                    else {
                        tag = Text.HTML(Text.parseHTML(item.ellipse), context, fontStyle);
                    }
                    if (!isFunction(formatter) || defined(legendFormatter)) {
                        symbolTypes = {
                            column: Symbol.rect(x, y, symbolWidth, symbolWidth, symbolRadius),
                            pie: Symbol.circle(x, y, symbolWidth, symbolWidth),
                            line: Symbol.line(x, y, symbolWidth + 4, symbolWidth)
                        };
                        context.lineWidth = 1;
                        context.strokeStyle = color;
                        if(Color.isColor(color)){
                            color = Color.parse(color).alpha(0.55).rgba();
                        }
                        else if(isObject(color)){
                            color = defined(color.radialGradient)
                                ? Color.parse(color).radial(x + symbolRadius, y + symbolRadius, symbolRadius)
                                : defined(color.linearGradient)
                                    ? Color.parse(color).linear(x, y, symbolWidth, symbolWidth)
                                    : "#000";
                        }
                        else{
                            color = "#000";
                        }
                        
                        context.fillStyle = color;
                        symbolBBox = (symbolTypes[item.type] || symbolTypes.column)(context);
                        context.stroke();
                        context.fill();
                        //draw text label
                        
                        context.textAlign = "start";
                        context.textBaseline = "alphabetic";
                        context.fillStyle = item.selected ? fontStyle.color : "#ccc";
                    
                        bbox = tag.getBBox();
                        x = x + symbolBBox.width + symbolPadding;
                        //y = symbolBBox.y + symbolBBox.height;// - bbox.height;// + symbolBBox.height / 2;
                        //y += (bbox.height - symbolBBox.height) / 2;
                        y = y + bbox.height;
                        y = y + (symbolBBox.height - 1 - bbox.height) / 2;
                        //console.log(bbox, item.ellipse, fontStyle)
                    
                        context.translate(x, y);
                        tag.toCanvas(context);
                    }
                    context.restore();
                }
            });
            context.restore();
        },
        draw: function(){
            var maxHeight = this.maxHeight,
                options = this.options,
                //padding = pack("number", options.padding, 0),
                borderWidth = pack("number", options.borderWidth, 0),
                borderColor = pack("string", options.borderColor, "#000000"),
                linePixel;
            var context = this.context;

            var isClip = this.height > maxHeight;

            if (this.data.length && options.useHTML !== true) {
                context.save();
                context.translate(this.x, this.y);
                linePixel = fixLinePixel(0, 0, this.width + isClip * 15, maxHeight - borderWidth, borderWidth);
                
                context.fillStyle = defined(options.backgroundColor) ? options.backgroundColor : "none";
                Symbol.rect(linePixel.x, linePixel.y, linePixel.width, linePixel.height)(context);
                
                if(defined(options.backgroundColor)){
                    context.fill();
                }
                (context.lineWidth = borderWidth) > 0 && (
                    context.strokeStyle = borderColor,
                    context.stroke()
                );
                if (isClip) {
                    context.clip();
                    this.next();
                }
                
                this.formatter();

                context.restore();
            }
        },
        next: function(){
            var options = this.options,
                itemMarginBottom = pack("number", options.itemMarginBottom, 8),
                width = this.width,
                maxHeight = this.maxHeight;
            var size = 5, x, y = -size;
            var context = this.context;
            var prev = { p0: {x: 0, y: 0}, p1: {x: 0, y: 0}, type: "prev"},
                next = { p0: {x: 0, y: 0}, p1: {x: 0, y: 0}, type: "next"};
            if(defined(options.borderWidth) && options.borderWidth > 0){
                context.beginPath();
                context.moveTo(width, 0);
                context.lineTo(width, maxHeight);
                context.stroke();
            }

            context.lineWidth = 3;
            context.strokeStyle = "#CCC";
            context.fillStyle = "red";
            context.lineJoin = "round";
            context.lineCap = "round";
            context.beginPath();
            context.moveTo(x = (next.p1.x = width + size * 2 + 2), (next.p0.y = y += maxHeight - size / 2));
            context.lineTo(x -= size, next.p1.y = y + size);
            context.lineTo(next.p0.x = x -= size, y);
            context.stroke();
            context.beginPath();
            context.moveTo(prev.p1.x = x += size * 2, y = itemMarginBottom);
            context.lineTo(x -= size, prev.p0.y = y - size);
            context.lineTo(prev.p0.x = x -= size, prev.p1.y = y);
            context.stroke();
            this.scroller.prev = prev;
            this.scroller.next = next;
        },
        onScroll: function(callback){
            var options = this.options,
                //borderWidth = pack("number", options.borderWidth, 0),
                navigation = options.navigation || {},
                padding = pack("number", options.padding, 0);
            var globalAnimation = this.globalAnimation,
                Animation;

            var canvas = this.canvas,
                legend = this;
            if(arguments[1]){
                canvas = callback;
                callback = arguments[1];
            }
            var nextId = 0;

            var animateTo = function(clickedItem){
                //var length = Math.ceil(legend.height / (legend.maxHeight - 2)),
                var dir = (clickedItem.type === "next" || -1);
                var isFinish = globalAnimation.isFinish,
                    isLast = false,
                    //current = globalAnimation.current,
                    startY = globalAnimation.startY,
                    endY;
                var step = legend.maxHeight - padding;

                //globalAnimation.current = current = Math.min(length - 1, Math.max(0, current += dir));
                endY = startY + dir * step;
                if(endY < 0){
                    startY = -1;/*缓动*/
                    endY = 0;
                }
                if(endY >= legend.height){
                    endY = startY + 1;
                    isLast = true;
                }
                // (current += dir) * (legend.maxHeight - padding - borderWidth*0);
                //console.log(endY, startY, legend.maxHeight, legend.height);
                if (defined(Dalaba.Animation)/* && (endY < legend.height)*/) {
                    var value = 0;
                    /*Animation ? Animation.stop() : (*/Animation = new Dalaba.Animation();
                    [[{ }, function (timer) {
                        value = startY + (endY - startY) * timer;
                    }]].forEach(function(item){
                        var step = item[1];
                        Animation.addAnimate(item[0], {
                            step: function(target, timer){
                                step(timer);
                                legend.translateY = -(value);
                                callback && callback(legend, value);
                            },
                            duration: 300,
                            delay: 0,
                            easing: "linear"
                        });
                    });

                    Animation.fire(function(){
                        isFinish = true;
                    }, function(){
                        if(!isLast)
                            globalAnimation.startY = startY = endY;
                        globalAnimation.isFinish = isFinish = false;
                    });
                }
                else{
                    legend.translateY = -endY;
                    callback && callback(legend, endY);
                    if(!isLast)
                        globalAnimation.startY = startY = endY;
                }
            };
            var clipTo = function(clickedItem){
                //var items = legend.items;
                //var currentY;
                var length = Math.floor(legend.height / legend.maxHeight);
                var dir = (clickedItem.type === "next" || -1);

                nextId += dir;
                nextId = Math.max(0, Math.min(nextId, length));
                var cy = nextId * legend.maxHeight - padding * nextId;
                /*for(var i = 0; i < items.length; i++){
                    if(cy <= items[i].y){
                        currentY = items[i].y - items[i].height - options.padding;
                        break;
                    }
                }*/
                //console.log(nextId, cy);
                cy = Math.max(0, cy);
                legend.translateY = -cy;
                callback && callback(legend, cy);
            };

            var onClick = function(e){
                var buttons = [legend.scroller.prev, legend.scroller.next];
                var clickedItem = null;
                var evt = Event.normalize(e, this),
                    ex = evt.x,
                    ey = evt.y,
                    x = legend.x,
                    y = legend.y;
                if(legend.height < legend.maxHeight){
                    return;//no clip
                }

                for(var i = 0; i < buttons.length; i++){
                    var item = buttons[i];
                    if(item && Intersection.rect({
                        x: ex,
                        y: ey
                    }, {
                        x: item.p0.x - 10 + x,
                        y: item.p0.y - 10 + y,
                        width: item.p1.x + 10 + x,
                        height: item.p1.y + 10 + y
                    })){
                        clickedItem = item;
                        break;
                    }
                }

                if(clickedItem){
                    if(navigation.animation !== false){
                        animateTo(clickedItem);
                    }
                    else{
                        clipTo(clickedItem);
                    }
                }
            };
            if(hasTouch) {
                //new Dalaba.Touch(canvas).on("tap", onClick, false);
                new Dalaba.Touch(canvas).on({
                    tap: onClick
                });
            }
            else if(canvas.nodeType === 1) {
                canvas.removeEventListener("click", onClick, false);
                canvas.addEventListener("click", onClick, false);
            }
            onClick = null;
            return this;
        },
        destroy: function(){
            var globalAnimation = this.globalAnimation;
            globalAnimation.isFinish = false;
            globalAnimation.startY = 0;
            globalAnimation.current = 0;
            return this;
        }
    };
    (function(Legend) {
        var useCapture = false;

        var isInside = function(y, bounds){
            return !(
                y < bounds.y ||
                y > bounds.height + bounds.y
            );
        };
        var filter = function(legend, item, x, y){
            var options = legend.options,
                padding = pack("number", options.padding, 0),
                borderWidth = pack("number", options.borderWidth, 0),
                context = legend.context;
            Symbol.rect(
                legend.x + item.x,
                legend.y + item.y + legend.translateY + padding,//translateY
                item.width + padding,
                item.height
            )(context);
            //context.fill();
            return isInside(y / DEVICE_PIXEL_RATIO, {
                y: legend.y - borderWidth,
                height: legend.maxHeight - borderWidth
            }) &&
            context.isPointInPath(x, y);
        };

        var onAction = function(x, y, callback){
            var clicked = false;
            var items = this.items,
                item;
            var that = this;

            var flag = x === true ? function(item) {
                while (y && y.getAttribute && y.getAttribute("data-legend-index") === null) y = y.parentNode;
                return (y && y.getAttribute && parseInt(y.getAttribute("data-legend-index"), 10)) === item.index;
            } : function(item) {
                return filter(that, item, x, y);
            };
            for(var i = 0; i < items.length; i++){
                item = items[i];
                if(flag(item)){
                    clicked = true;
                    break;
                }
            }
            callback.call(item, clicked, items);
        };
        var getXY = function(e, el){
            var evt = Event.normalize(e, el),
                x = evt.x,
                y = evt.y;
            return [x *= DEVICE_PIXEL_RATIO, y *= DEVICE_PIXEL_RATIO];
        };
        extend(Legend.prototype, {
            onClick: function(callback){
                var canvas = this.canvas,
                    legend = this;
                var useHTML = this.options.useHTML;

                if(arguments[1]){
                    canvas = callback;
                    callback = arguments[1];
                }
                
                var onClick = function(e){
                    var x = getXY(e, this),
                        y = x[1];
                    x = x[0];

                    onAction.apply(legend, (useHTML === true ? [useHTML, e.target] : [x, y]).concat(function(clicked, items) {
                        var item = this;
                        if(clicked){
                            item.selected = !item.selected;
                            callback && callback.call(item, item.series, item.index, items);
                        }
                    }));
                };
                if (hasTouch && useHTML !== true) {
                    new Dalaba.Touch(canvas).on({
                        tap: onClick
                    });
                }
                else if (canvas.nodeType === 1) {
                    canvas = useHTML === true ? this.canvas : canvas;
                    canvas.removeEventListener("click", onClick, useCapture);
                    canvas.addEventListener("click", onClick, useCapture);
                }
                //onClick = null;
                return this;
            },
            onState: function(callback){
                var canvas = this.canvas,
                    legend = this;
                var flag;

                if(arguments[1]){
                    canvas = callback;
                    callback = arguments[1];
                }
                
                var onState = function(e){
                    var x = getXY(e, this),
                        y = x[1];
                    x = x[0];
                    onAction.call(legend, x, y, function(clicked, items){
                        var item = this;
                        if(!clicked){
                            flag = 0;
                        }
                        if(clicked && !flag){
                            flag = 1;
                            callback && callback.call(item, item.series, item.index, items);
                        }
                    });
                };
                if(canvas.nodeType === 1){
                    canvas.removeEventListener("mousemove", onState, useCapture);
                    canvas.addEventListener("mousemove", onState, useCapture);
                }
                onState = null;
                return this;
            }
        });
    })(Legend);

    Chart.Legend = Legend;

    if(typeof module === "object" && module.exports) {
        module.exports = Legend;
    }
    else if(typeof define === "function" && define.amd)
        define(function(){
            return Legend;
        });
    else {
        (typeof Chart !== "undefined" ? Chart : this).Legend = Legend;
    }
})(typeof window !== "undefined" ? window : global, Dalaba.Chart);;
    (function (global, Dalaba) {
    var Chart = Dalaba.Chart;

    var angle2arc = Chart.angle2arc;

    var stringPad = Formatter.String.padding;

    var numberFormat = Formatter.String.numberFormat;

    var mathRound = Mathematics.round,
        mathPow = Mathematics.pow;

    var ONE_DAY = 864E5;
    /*millisecond:"%A, %b %e, %H:%M:%S.%L",
    second:"%A, %b %e, %H:%M:%S",
    minute:"%A, %b %e, %H:%M",
    hour:"%A, %b %e, %H:%M",
    day:"%A, %b %e, %Y",
    week:"Week from %A, %b %e, %Y",
    month:"%B %Y",
    year:"%Y"*/

    var dateTypes = {
        millisecond: {
            interval: 1,
            format: function(timestamp) {
                var date = new Date(timestamp);
                return [
                    stringPad(date.getMinutes(), "0"), ":",
                    stringPad(date.getSeconds(), "0"), ".",
                    ("" + date.getMilliseconds()).substr(0, 3)
                ].join("");
            },
        },
        second: {
            interval: 1E3,
            format: function(timestamp) {
                var date = new Date(timestamp);
                return [
                    stringPad(date.getHours(), "0"), ":",
                    stringPad(date.getMinutes(), "0"), ":",
                    stringPad(date.getSeconds(), "0")
                ].join("");
            }
        },
        minute: {
            interval: 6E4,
            format: function(timestamp){
                var date = new Date(timestamp);
                return [
                    stringPad(date.getHours(), "0"), ":",
                    stringPad(date.getMinutes(), "0")
                ].join("");
            }
        },
        hour: {
            interval: 36E5,
            format: function(timestamp){
                var date = new Date(timestamp);
                return [
                    stringPad(date.getHours(), "0"), ":",
                    stringPad(date.getMinutes(), "0"),
                    //stringPad(date.getSeconds(), "0")
                ].join("");
            }
        },
        day: {
            interval: ONE_DAY,
            format: function(timestamp){
                var date = new Date(timestamp),
                    year = date.getFullYear(),
                    month = date.getMonth(),
                    day = date.getDate();
                return [
                    year, "/",
                    stringPad(month + 1, "0"), "/",
                    stringPad(day, "0")
                ].join("");
            }
        },
        week: {
            interval: 7 * ONE_DAY,
            format: function(timestamp){
                var date = new Date(timestamp),
                    year = date.getFullYear(),
                    day = date.getDate(),
                    week = date.getDay() === 0 ? 7 : date.getDay();
                date.setDate(date.getDate() + 4 - week);
                week = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 1, -6)) / ONE_DAY);
                week = ~~(week / 7) + 1;
                return [
                    year, "W",
                    stringPad(week, "0"), "D",
                    stringPad(day, "0")
                ].join("");
            }
        },
        month: {
            interval: 30 * ONE_DAY,
            format: function(timestamp){
                var date = new Date(timestamp),
                    year = date.getFullYear(),
                    month = date.getMonth();
                return [
                    year, "/",
                    stringPad(month + 1, "0"),
                ].join("");
            }
        },
        year: {
            interval: 365 * ONE_DAY,
            format: function(timestamp){
                var date = new Date(timestamp);
                return date.getFullYear();
            }
        }
    };

    var lg10ln = function(n) {
        return Math.pow(10, Math.floor(Math.log(n) / Math.LN10));
    };

    var numberic2value = function (value, numericSymbols) {
        var i = numericSymbols.length;
        var ret,
            multi;
        var v = Math.abs(value);
        if (i && v >= 1000) {
            while (i-- && !defined(ret)) {
                multi = Math.pow(1000, i + 1);
                if (v >= multi && numericSymbols[i] !== null) {
                    ret = numberFormat((v * 10) % multi === 0 ? v / multi : (Math.round(v / multi * 100) / 100, null)) + numericSymbols[i];
                }
            }
            if (defined(ret)) {
                ret = (value < 0 ? "-" : "") + ret;
            }
        }
        else if (!defined(ret)) {
            ret = numberFormat(value, null, undefined);
        }
        return ret;
    };
    var date2value = function (value, type) {
        var format = dateTypes[type];
        return format.format ? format.format(value) : value;
    };

    var symbolCallout = function (x, y, w, h, options) {
        var arrow = options.arrowLength || 10,
            anchor = options.anchor ||  "left";
        var path = [
            {x: x, y: y},//left(O)
            {x: x + w, y: y},//top
            {x: x + w, y: y + h},//right
            {x: x, y: y + h},//bottom
            {x: x, y: y + h / 2 + arrow},//triangle left bottom(2/3), default left
            {x: x - arrow, y: y + h / 2},//triangle left middle(2)
            {x: x, y: y + h / 2 - arrow},//triangle left top(1/3)
            {x: x, y: y}//left(O)
        ];
        if(anchor === "top"){
            path.splice(1, path.length, 
                {x: x + w / 2 - arrow, y: y},//triangle top left
                {x: x + w / 2, y: y - arrow},//triangle top middle
                {x: x + w / 2 + arrow, y: y},//triangle top right
                {x: x + w, y: y},
                {x: x + w, y: y + h},
                {x: x, y: y + h},
                {x: x, y: y}
            );
        }
        else if(anchor === "bottom"){
            path.splice(3, path.length,
                {x: x + w / 2 + arrow, y: y + h},
                {x: x + w / 2, y: y + h + arrow},
                {x: x + w / 2 - arrow, y: y + h},
                {x: x, y: y + h},
                {x: x, y: y}
            );
        }
        return function(context){
            context.beginPath();
            context.moveTo((path[0].x), (path[0].y));
            path.forEach(function(p){
                context.lineTo((p.x), (p.y));
            });
        };
    };

    var defaultOptions = {
        enabled: true,
        type: "linear",
        title: {
            align: "middle",//"low", "middle" by default, "high"
            enabled: true,
            margin: 5,
            offset: undefined,
            rotation: 0,
            style: {
                fontWeight: "normal",
                fontSize: "12px",
                color: "#707070"
            },
            text: "Axis Values",
            x: 0,
            y: 0
        },
        labels: {
            align: "center",
            verticalAlign: undefined,
            style: {
                fontSize: "12px",
                fontWeight: "normal",
                color: "#606060"
            },
            padding: 5,
            autoRotation: -45,
            formatter: undefined,
            //step: hasTouch ? 3 : undefined,
            size: 30,
            x: 0,
            y: 0
        },
        logarithmic: {
            base: 10
        },
        lineColor: "rgba(0,0,0,.5)",
        lineWidth: 1,
        gridLineColor: "rgba(0,0,0,.2)",
        gridLineWidth: 1,
        gridLineDashStyle: "solid",
        min: undefined,
        max: undefined,
        tickInterval: 1,
        tickLength: 6,
        tickWidth: 1,
        opposite: false,
        reversed: false,
        lang: {
            numericSymbols: ["k", "M", "G", "T", "P", "E"],
            decimalPoint: "."
        },
        x: 0,
        y: 0,
        layout: "vertical",
        verticalAlign: "top",
        floating: undefined,
        angleOptions: {

        }
    };

    function Axis () {
        this.init.apply(this, arguments);
    }
    Axis.prototype = {
        constructor: Axis,
        Item: function () {
            var options = this.options,
                labels = options.labels || {},
                autoRotation = pack("number", labels.autoRotation, -45),
                tickLength = pack("number", options.tickLength, 0),
                tickWidth = pack("number", options.tickWidth, 0),
                lineWidth = pack("number", options.lineWidth, 0),
                gridLineWidth = pack("number", options.gridLineWidth, 0),
                gridLineInterpolation = options.gridLineInterpolation,
                opposite = !!options.opposite,
                style = pack("object", labels.style, {}),
                fontStyle = {
                    fontStyle: style.fontStyle || "normal",
                    fontWeight: style.fontWeight || "normal",
                    fontSize: style.fontSize || "12px",
                    fontFamily: style.fontFamily || "Arial",
                    lineHeight: style.lineHeight || "normal",
                    color: style.color
                };
            var isCategories = defined(options.categories) && !!options.categories.length;

            var context = this.context,
                name = this.name;
            var minRange = this.minRange,
                maxRange = this.maxRange;
            var axis = this;

            var setAlign = function(x, maxLabelWidth, width){
                return {
                    left: x - (maxLabelWidth - width),
                    center: x,
                    right: x + (maxLabelWidth - width)
                };
            };

            function tick(){

            }
            tick.line = function(){
                var tx = pack("number", options.x, 0),
                    ty = pack("number", options.y, 0);
                var lineColor = options.lineColor,
                    lineDashStyle = options.lineDashStyle;
                var zeroAxis = axis.zeroAxis,
                    linePixel;
                var center = options.center,
                    radius = options.size,
                    cx, cy;
                var startAngle = pack("number", options.startAngle, -90);
                
                linePixel = fixLinePixel(tx, ty - tickWidth / 2, tx, ty + maxRange + tickWidth, lineWidth);
                if(name === "xAxis"){
                    linePixel = fixLinePixel(tx, ty, tx + maxRange, ty + lineWidth, lineWidth);
                }
                context.save();
                if(lineWidth > 0){
                    if(name === "yAxis" || name === "xAxis"){
                        context.beginPath();
                        context.lineWidth = lineWidth;
                        context.strokeStyle = lineColor;
                        context.moveTo(linePixel.x, linePixel.y);
                        context.lineTo.apply(context,
                            name === "yAxis"
                            ? [linePixel.x, linePixel.height]
                            : [linePixel.width, linePixel.y]
                        );
                        context.stroke();
                        if(!zeroAxis.hidden){
                            linePixel = fixLinePixel.apply(null,
                                name === "xAxis"
                                ? [tx + zeroAxis.x, ty, tx + zeroAxis.x, ty - options.height * !opposite, 1]
                                : [tx, ty + zeroAxis.y, tx + options.width * !opposite, ty + zeroAxis.y, 1]
                            );
                            context.beginPath();
                            context.lineWidth = lineWidth;
                            context.strokeStyle = Color.parse(lineColor).alpha(0.45).rgba();
                            context.moveTo(linePixel.x, linePixel.y);
                            context.lineTo.apply(context,
                                name === "xAxis"
                                ? [linePixel.x, linePixel.height]
                                : [linePixel.width, linePixel.y]
                            );
                            context.stroke();
                        }
                    }
                    else if(name === "polarAxis" && center){
                        cx = center[0], cy = center[1];
                        context.beginPath();
                        if(gridLineInterpolation === "polygon"){
                            axis.ticks.forEach(function(tick, i){
                                context[i ? "lineTo" : "moveTo"](
                                    Math.cos(tick.angle * PI / 180) * radius + cx,
                                    Math.sin(tick.angle * PI / 180) * radius + cy
                                );
                            });
                            context.closePath();
                        }
                        else{
                            if(defined(lineDashStyle)){
                                DashLine.arc(context, cx, cy, radius, 0, PI2, lineDashStyle);
                            }
                            else{
                                context.arc(cx, cy, radius, 0, PI2);
                            }
                        }
                        context.lineWidth = lineWidth;
                        context.strokeStyle = lineColor;
                        context.stroke();
                    }
                    else if(name === "radiusAxis" && center){
                        cx = center[0], cy = center[1];
                        startAngle = startAngle * PI / 180;
                        context.moveTo(cx, cy);
                        context.lineTo(Math.cos(startAngle) * radius + cx, Math.sin(startAngle) * radius + cy);
                        context.lineWidth = lineWidth;
                        context.strokeStyle = lineColor;
                        context.stroke();
                    }
                }
                context.restore();
            };
            tick.xAxis = function(item){
                var tx = pack("number", options.x),
                    ty = pack("number", options.y),
                    y = ty + item.y,
                    x = tx + item.x;
                var opposite = !!options.opposite;
                var linePixel;

                x = Math.max(0, x);
                context.save();
                //tick
                if(options.tickWidth > 0){
                    context.beginPath();
                    context.strokeStyle = options.tickColor;
                    context.lineWidth = tickWidth;
                    linePixel = fixLinePixel(x, y, x, y - tickLength * (opposite || -1), tickWidth);
                    if(!item.isFirst || options.startOnTick === true){
                        context.moveTo(linePixel.x, linePixel.y);
                        context.lineTo(linePixel.x, linePixel.height);
                    }
                    if(item.isLast && options.endOnTick === true){
                        linePixel = fixLinePixel(x + maxRange, y, x + maxRange, y + tickLength * (opposite || -1), tickWidth);
                        context.moveTo(linePixel.x, linePixel.y);
                        context.lineTo(linePixel.x, linePixel.height);
                    }
                    context.stroke();
                }
                //grid line
                if(!item.isFirst && (!item.isLast || isCategories) && defined(options.height)){
                    if(gridLineWidth > 0){
                        var dashStyle = pack("string", options.gridLineDashStyle, "solid");
                        context.beginPath();
                        context.lineWidth = gridLineWidth;
                        context.strokeStyle = options.gridLineColor;
                        linePixel = fixLinePixel(
                            x,
                            ty,
                            x,
                            ty - (options.height * (!opposite || -1)),//Math.min(y + options.height, options.height) * (opposite || -1),
                            gridLineWidth
                        );
                        DashLine[dashStyle] && DashLine[dashStyle](
                            context,
                            linePixel.x,
                            linePixel.y,
                            linePixel.x,
                            linePixel.height
                        );
                        context.stroke();
                    }
                }
                context.restore();
            };
            tick.yAxis = function(item){
                var tx = pack("number", options.x, 0),
                    ty = pack("number", options.y, 0),
                    y = ty + item.y,
                    x = tx + item.x;
                var linePixel;

                y = Math.max(0, y);

                context.save();
                if (tickWidth > 0) {
                    context.beginPath();
                    linePixel = fixLinePixel(x, y, x + tickLength * (opposite || -1), y, tickWidth);
                    context.lineWidth = tickWidth;
                    context.strokeStyle = options.tickColor;
                    if(!item.isFirst || options.startOnTick === true){
                        context.moveTo(linePixel.x, linePixel.y);
                        context.lineTo(linePixel.width, linePixel.y);
                    }
                    if(item.isLast && options.endOnTick === true){
                        linePixel = fixLinePixel(x, ty, x - tickLength * (opposite || -1), ty, tickWidth);
                        context.moveTo(linePixel.x, linePixel.y);
                        context.lineTo(linePixel.width, linePixel.y);
                    }
                    context.stroke();
                }
                //grid line
                if(gridLineWidth > 0 && /*!item.isFirst && */defined(options.width)){
                    var dashStyle = pack("string", options.gridLineDashStyle, "solid");
                    //context.save();
                    context.beginPath();
                    context.lineWidth = gridLineWidth;
                    context.strokeStyle = options.gridLineColor;
                    //context.moveTo(x, y);
                    //context.lineTo(Math.min(x + options.width, options.width) * (options.opposite ? -1 : 1), y);
                    //context.stroke();
                    //console.log(dashStyle)//animate draw

                    linePixel = fixLinePixel(
                        tx,
                        y,
                        tx + (options.width * (!opposite || -1)),
                        y,
                        gridLineWidth
                    );
                    DashLine[dashStyle] && DashLine[dashStyle](
                        context,
                        linePixel.x,
                        linePixel.y,
                        linePixel.width,
                        linePixel.y
                    );
                    //context.restore();
                }
                context.restore();
            };
            tick.colorAxis = function(item){
                var tx = pack("number", options.x, 0),
                    ty = pack("number", options.y, 0);
                    //y = ty + item.y,
                    //x = tx + item.x;
                var stops = options.stops,
                    linearGradient,
                    isHorizontal = options.layout === "horizontal";
                if(item.isFirst){
                    if(!defined(stops)){
                        stops = [
                            [0, "#EFEFFF"],
                            [1, "#102D4C"]
                        ];
                    }
                    var x0 = tx,//options.x,
                        y0 = ty,//options.y,
                        x1 = tickLength,
                        y1 = Math.abs(maxRange - minRange);//vertical
                    if(isHorizontal){
                        x1 = Math.abs(maxRange - minRange);
                        y1 = tickLength;
                    }
                    linearGradient = context.createLinearGradient.apply(context, [x0, y0].concat(isHorizontal ? [x1, y0] : [x0, y1]));
                    for(var j = 0; j < stops.length; j++){
                        var stop = stops[j];
                        if(isNumber(stop[0]) && typeof stop[1] === "string")
                            linearGradient.addColorStop(stop[0], stops[isHorizontal ? j : stops.length - j - 1][1]);
                    }
                    context.save();
                    context.fillStyle = linearGradient;
                    context.strokeStyle = options.lineColor;
                    context.lineWidth = options.lineWidth;
                    context.beginPath();
                    if(isHorizontal){
                        /*context.moveTo(0, y);
                        context.lineTo(x, y);
                        context.lineTo(x, tickLength);
                        context.lineTo(0, tickLength);*/
                        //context.fillRect(x0, y0, x1, y1);
                    }
                    else{
                        /*context.moveTo(x, 0);
                        context.lineTo(x, y);
                        context.lineTo(x + tickLength, y);
                        context.lineTo(x + tickLength, 0);*/
                        
                    }
                    context.fillRect(x0, y0, x1, y1);
                    //context.closePath();
                    context.fill();
                    //context.fillRect(x0, y0, x1, y1);
                    if(defined(options.lineWidth) && options.lineWidth > 0)
                        context.stroke();
                    context.restore();
                }
            };
            tick.polarAxis = function(item){
                var gridDashStyle = options.gridLineDashStyle,
                    gridLineColor = options.gridLineColor;
                var cx = item.cx,
                    cy = item.cy,
                    innerRadius = item.innerRadius,
                    radius = item.radius,
                    angle = item.angle * PI / 180;
                //tick
                if(tickWidth > 0){
                    context.save();
                    context.beginPath();
                    context.lineWidth = tickWidth;
                    //context.strokeStyle = options.tickColor;
                    context.fillStyle = options.tickColor;
                    context.translate(cx, cy);
                    context.rotate(angle);
                    context.fillRect(item.radius, 0, tickLength, tickWidth);
                    /*context.moveTo(x, y);
                    context.lineTo(Math.cos(angle) * tickLength + x, Math.sin(angle) * tickLength + y);
                    */
                    context.restore();
                }
                if(innerRadius > 0 && gridLineWidth > 0/* && !item.isFirst*/){
                    //var linePixel = fixLinePixel(cx, cy, x, y, gridLineWidth);
                    context.save();
                    context.beginPath();
                    context.lineWidth = gridLineWidth;
                    context.strokeStyle = gridLineColor;
                    //context.fillStyle = gridLineColor;
                    var x = cx + Math.cos(angle) * radius;
                    var y = cy + Math.sin(angle) * radius;
                    //context.translate(cx, cy);
                    //context.rotate(angle);
                    if(defined(gridDashStyle) && DashLine[gridDashStyle] && gridDashStyle !== "solid"){
                        DashLine[gridDashStyle](
                            context,
                            cx,
                            cy,
                            x,
                            y
                        );
                    }
                    else{
                        context.moveTo(cx, cy);
                        context.lineTo(x, y);
                        //context.fillRect(0, 0, radius, gridLineWidth);
                    }
                    context.stroke();
                    context.restore();
                }
            };
            tick.radiusAxis = function(item){
                var tickWidth = pack("number", options.tickWidth, 1),
                    tickColor = options.tickColor,
                    gridLineInterpolation = options.gridLineInterpolation,
                    gridDashStyle = options.gridLineDashStyle,
                    gridLineColor = options.gridLineColor;
                var length = options.length;
                //var ticks = axis.ticks;

                var cx = item.cx,
                    cy = item.cy,
                    //radius = item.radius,
                    innerRadius = item.innerRadius,
                    //angle = item.angle * PI / 180,
                    startAngle = item.startAngle * PI / 180;

                //tick
                if(tickWidth > 0){
                    context.save();
                    //context.fillStyle = tickColor;
                    //context.translate(cx, cy);
                    //context.rotate(startAngle);
                    //context.translate(innerRadius - tickWidth, 0);
                    //context.fillRect(0, 0, tickWidth, -tickLength);
                    context.transform(
                        Math.cos(startAngle), Math.sin(startAngle),
                        -Math.sin(startAngle), Math.cos(startAngle),
                        cx,
                        cy
                    );
                    context.moveTo(innerRadius, 0);
                    context.lineTo(innerRadius, tickLength);

                    context.strokeStyle = tickColor;
                    context.stroke();
                    context.restore();
                }
                if(innerRadius > 0 && gridLineWidth > 0 && !item.isFirst){
                    context.save();
                    context.beginPath();
                    context.lineWidth = gridLineWidth;
                    context.strokeStyle = gridLineColor;
                    if(gridLineInterpolation === "polygon"){
                        //ticks.forEach(function(tick, i){
                        for(var i = 0; i < length; i++){
                            var ratio = i / length,
                                angle = (ratio * PI2) + startAngle;
                            context[i ? "lineTo" : "moveTo"](
                                Math.cos(angle) * innerRadius + cx,
                                Math.sin(angle) * innerRadius + cy
                            );
                        }
                        context.closePath();
                    }
                    else{
                        if(defined(gridDashStyle) && gridDashStyle !== "solid"){
                            DashLine.arc(context, cx, cy, innerRadius, 0, PI2, gridDashStyle);
                        }
                        else{
                            context.arc(cx, cy, innerRadius, 0, PI2);//context.setLineDash([5, 15]);
                        }
                    }
                    context.stroke();
                    context.restore();
                }
            };
            tick.adjustLabel = function (tick, i, params) {
                var opposite = !!options.opposite,
                    tickWidth = tick.size,
                    tickLength = options.tickLength,
                    logarithmic = options.logarithmic,
                    layout = options.layout,
                    tx = pack("number", options.x, 0),
                    ty = pack("number", options.y, 0);
                var type = axis.type;
                
                var isRotation = params.isRotation,
                    isCenter = params.isCenter,
                    isCategories = defined(options.categories) && !!options.categories.length;
                
                var angle = labels.rotation;
                var maxLabelWidth = axis.labelWidth;
                
                if(opposite === true){
                    tickLength = -tickLength;
                }
                if(!defined(angle)){
                    angle = (isRotation && name === "xAxis") ? autoRotation : 0;//default angle
                }
                isCenter = isCenter && isCategories;
                var x = tick.x,
                    y = tick.y;

                var cx = tick.cx,
                    cy = tick.cy,
                    radius = tick.radius;
                var text = tick.text;
                if (defined(text.ellipse)) {
                    var height = text.height,
                        width = text.width;

                    if (name === "yAxis") {
                        if(opposite === true){
                            width = 0;
                        }
                        y = Math.max(0, y);
                        //y = y + height / 2;
                        if(isCategories){
                            y -= tick.size / 2;
                        }
                        x = x - width - tickLength;
                        x = setAlign(x, maxLabelWidth, text.width)[pack("string", labels.align, "center")];
                    }
                    else if (name === "xAxis") {
                        x = Math.max(0, x);
                        if(isCenter){
                            x = x + (tickWidth - width) / 2;
                        }
                        else{
                            x = x - width / 2;
                        }
                        y = y + tickLength + pack("number", text.firstHeight, text.height);
                        if(opposite === true){
                            y = y - height / 2 + tickLength;
                        }
                    }
                    else if (name === "polarAxis") {
                        var delta = tick.angle * PI / 180;
                        x = Math.cos(delta) * (radius + tickLength + 3) + cx;
                        y = Math.sin(delta) * (radius + tickLength + 3) + cy;
                    }
                    
                    if (isNumber(labels.rotation) || (isRotation && name === "xAxis")) {
                        if (angle < 0) {
                            angle = 360 + angle;
                        }
                        angle %= 360;
                        if(angle > 0 && angle <= 90){
                            x = tick.x + (tick.size - text.width) / 2;
                            y = tick.y + tickLength;
                        }
                        else if(angle >= 180 && angle < 270){
                            x = tick.x + (tick.size);
                            y = tick.y + text.height * !opposite + tickLength;
                        }
                        else if(angle >= 270 && angle < 360){
                            x = (type === "categories")
                                ? tick.x + tick.size / 2 - (text.width / 2) * !opposite //(text.width - tick.size) / 2
                                : tick.x - text.width / 2;
                            y = tick.y + (text.height * !opposite) + tickLength;
                        }
                        else{
                            x = tick.x + (tick.size - text.width) / 2;
                            y = tick.y + text.height + tickLength;
                        }
                    }
                    /*if(name === "colorAxis"){
                        options.layout !== "horizontal" ?
                            (x += tickLength, y += (i !== 0) * textHeight)
                            : (y += tickLength + textHeight, x -= (i !== 0) * textWidth);
                    }*/
                    var color = Color.parse(fontStyle.color);
                    color.a = Math.max(0, Math.min(pack("number", tick.opacity, 1), 1));
                    context.save();
                    context.beginPath();
                    context.fillStyle = Color.rgba(color);
                    context.textAlign = "start";
                    context.textBaseline = "alphabetic";
                    context.font = [
                        fontStyle.fontStyle,
                        fontStyle.fontWeight,
                        fontStyle.fontSize + "/" + fontStyle.lineHeight,
                        fontStyle.fontFamily
                    ].join(" ");
                    if(name === "colorAxis"){
                        ((text.isLast) && (layout !== "horizontal"
                            ? (x = tick.x + (tickLength - text.width) / 2, y = minRange - 2)
                            : (x = tick.x, y = tick.y + text.height + (tickLength - text.height) / 2), !0)
                        ||
                        (text.isFirst) && (layout !== "horizontal"
                            ? (x = tick.x + (tickLength - text.width) / 2, y = maxRange + text.height + 2)
                            : (x = tick.x - text.width - 2, y = tick.y + text.height + (tickLength - text.height) / 2), !0)
                        ) && (
                            context.translate(tx + x + pack("number", labels.x, 0), ty + y + pack("number", labels.y, 0)),
                            context.fillText(text.ellipse, 0, 0)
                        );
                    }
                    else{
                        var tag = Text.HTML(Text.parseHTML(text.ellipse), context, {
                            fontFamily: style.fontFamily,
                            fontSize: style.fontSize,
                            fontWeight: style.fontWeight
                        }),
                        bbox = Text.measureText(text.ellipse, style);
                        if(name === "yAxis"){
                            y += bbox.height / 2;
                        }
                        else if(name === "polarAxis"){
                            if(Math.abs(x - cx) / radius < 0.3){
                                x -= bbox.width / 2;
                            }
                            else if(x <= cx){
                                x -= bbox.width;
                            }
                            if(Math.abs(y - cy) / radius < 0.3){
                                y += bbox.height / 2;//0,180
                            }
                            else if(y > cy){
                                y += bbox.height;
                            }
                        }
                        else if(name === "radiusAxis"){
                            context.translate(tick.cx, tick.cy);
                            context.rotate(tick.startAngle * PI / 180);
                            x = (tick.radius - tick.innerRadius) - text.width / 2;
                            y = tickLength + text.height;
                            angle = 0;
                        }
                        context.translate(tx + x + pack("number", labels.x, 0), ty + y + pack("number", labels.y, 0));
                        context.rotate(angle * PI / 180);
                        tag.toCanvas(context);
                        //context.fillText(text.ellipse, 0, 0);
                    }
                    if(type === "logarithmic" && isNumber(logarithmic.base) && defined(logarithmic.pow)){
                        var dm = 1,
                            powN;
                        if(isNumber(options.tickAmount) && options.tickAmount > 1){
                            dm = axis.maxDomain / ~-options.tickAmount;
                        }
                        powN  = mathRound(axis.startValue + dm * i, 1);
                        context.scale(0.8, 0.8);
                        context.fillText(
                            powN,
                            !opposite ? width - context.measureText(powN).width / 2 : text.width * 0.8,
                            0 
                        );
                    }
                    context.restore();
                }
            };
            tick.render = function (item) {
                return ({
                    xAxis: this.xAxis,
                    yAxis: this.yAxis,
                    colorAxis: this.colorAxis,
                    polarAxis: this.polarAxis,
                    radiusAxis: this.radiusAxis
                }[name] || function () {})(item), this;
            };
            return tick;
        },
        init: function(canvas, options){
            this.options = extend({}, defaultOptions);
            var axisOptions = extend(this.options, options);

            this.type = isArray(axisOptions.categories) ? "categories" : axisOptions.type;//linear, categories, logarithmic or datetime
            this.name = axisOptions.name || "xAxis";
            this.startValue = 0;
            this.endValue = 0;
            this.minValue = 0;
            this.maxValue = 0;

            this.minRange = (axisOptions.range = axisOptions.range || [])[0];
            this.maxRange = axisOptions.range[1];
            this.labelWidth = 0;
            this.labelHeight = 0;
            this.isRotation = false;

            this.ticks = [];
            this._ticks = [];
            this.tickPositions = [];
            this.values = [];
            this.tickInterval = 5;
            this.tickGap = 1;//define categroies
            this.zeroAxis = {
                hidden: true,
                x: 0,
                y: 0
            };

            this.canvas = canvas;
            this.context = canvas.getContext("2d");

            !~("logarithmic categories datetime".indexOf(this.type)) && (this.type = "linear");
            this.setTitle();
        },
        translate: function (x, y) {
            var options = this.options;
            options.x = x;
            options.y = y;
            return this;
        },
        domain: function (min, max) {
            var options = this.options;
            return arguments.length ? (options.domain[0] = min, options.domain[1] = max, this) : options.domain;
        },
        range: function () {
            if (arguments.length) {
                this.minRange = arguments[0];
                this.maxRange = defined(this.minRange) ? (arguments[1] || 0) : (this.minRange = 0);
                return this;
            }
            else {
                return [this.minRange, this.maxRange];
            }
        },
        nice: function (minDomain, maxDomain, m) {
            var min = minDomain,
                max = maxDomain,
                dm;
            dm = (min > max && (dm = min, min = max, max = dm), max - min);
            if (!defined(m))
                m = 10;

            var step = lg10ln(dm / m);
            var decimal = m / dm * step;

            if (decimal <= 0.15) {
                step *= 10;
            }
            else if (decimal <= 0.35) {
                step *= 5;
            }
            else if (decimal <= 0.75) {
                step *= 2;
            }
            min = Math.floor(min / step) * step;
            max = Math.ceil(max / step) * step;
            if (minDomain > maxDomain) {
                dm = min;
                min = max;
                max = dm;
            }
            return {
                min: min,
                max: max,
                step: step
            };
        },
        /*
         * Returns linear value
         * tickAmount > interval
        */
        getLinearTicks: function(startValue, endValue){
            var options = this.options,
                interval = options.interval,
                tickAmount = options.tickAmount,
                tickInterval = this.tickInterval;
            var ticks = [];
            var min = startValue,
                max = endValue,
                dm,
                i = 0;
            var floor = Math.floor,
                ceil = Math.ceil,
                abs = Math.abs;
            var eps = Math.pow(10, 16);
            
            var v;
            dm = (min > max && (dm = min, min = max, max = dm), max - min);

            var step = lg10ln(dm / tickInterval);
            var decimal = tickInterval / dm * step;

            //console.log(interval, step, min, max);
            if(decimal <= 0.15){
                step *= 10;
            }
            else if(decimal <= 0.35){
                step *= 5;
            }
            else if(decimal <= 0.75){
                step *= 2;
            }
            if(step === Infinity){
                return ticks;
            }
            //domain[i0] = parseFloat(toPrecision(Math.floor(min / step) * step), 10);
            //domain[i1] = Math.ceil(max / step) * step;

            if(isNumber(tickAmount)){
                var ln10;//Math.pow(10, Math.round(Math.log(dm) / Math.LN10) - 1);
                tickInterval = Math.max(1, tickAmount - 1);
                //console.log(max -= max / tickAmount);
                min *= tickAmount;
                max *= tickAmount;
                dm = abs(min - max) / tickInterval;
                ln10 = lg10ln(dm);
                min = floor((min) / ln10) * ln10;
                max = ceil((max) / ln10) * ln10;
                while(i < tickAmount){
                    dm = abs(max - min) / tickAmount;
                    dm /= tickInterval;
                    v = min / tickAmount + (dm * i++);
                    //v = (Math.floor(min / ln10) * ln10/*start*/) + (Math.ceil((dm / tickInterval) / ln10) * ln10/*step*/) * i++;
                    ticks.push(parseFloat(toPrecision(v), 10));
                }
            }
            else{
                var start, stop;
                var bit;

                if(isNumber(interval)){
                    start = min, stop = max;
                    step = Math.min(Math.abs(max - min) / 2, interval);
                    v = start;
                    while((step < 0 ? v >= stop : v <= stop)){
                        v = start + step * i++;
                        ticks.push(v);
                    }
                }
                else{
                    min = floor(floor(min / step) * step * eps) / eps;
                    max = floor(ceil(max / step) * step * eps) / eps;
                    
                    start = parseFloat(toPrecision(min, 10), 16);//Math.ceil(min / step) * step, 16), 10);//min
                    stop = ceil(max / step) * step + step * 0.5;//max
                    bit = 1;
                    while(abs(step) * bit % 1)
                        bit *= 10;
                    start *= bit, stop *= bit, step *= bit;
                    while((v = start + step * i++, step < 0 ? v > stop : v < stop)){
                        ticks.push(v / bit);
                    }
                }
            }
            if(defined(options.startValue)){
                startValue !== ticks[0] && (ticks[0] = (parseFloat(toPrecision(startValue, 10), 10)));
            }
            if(defined(options.endValue)){
                endValue !== ticks[ticks.length - 1] && (ticks[ticks.length - 1] = parseFloat(toPrecision(endValue, 10), 10));
            }
            return ticks;
        },
        getCategoriesTicks: function(startValue, endValue){
            var options =  this.options,
                tickAmount = options.tickAmount;
            var ticks = [];
            var i;

            if(isNumber(tickAmount)){
                tickAmount = Math.max(1, ~~tickAmount);
                //dm = ~~((endValue - startValue) / tickAmount);
                for(i = 0; i < tickAmount; i++){
                    ticks.push(startValue + i);//startValue + i * dm);
                }
            }
            else{
                for(i = startValue; i < endValue; i += 1){
                    ticks.push(i);
                }
            }
            return ticks;
        },
        getLogTicks: function(startValue, endValue, base){
            var options = this.options,
                tickAmount = options.tickAmount;
            var ticks = [];
            var min = startValue,
                max = endValue,
                dm;
            dm = (min > max && (dm = min, min = max, max = dm), max - min);
            
            var positive = min >= 0 && max >= 0;

            var start = Math.floor(parseFloat(toPrecision(min), 10)),
                end = 1 + Math.ceil(parseFloat(toPrecision(max), 10));
            var i;

            //console.log(start, end, min, max, positive)
            if(isNumber(tickAmount)){
                tickAmount = Math.max(tickAmount, 1);
                for(i = 0; i < tickAmount; i++){
                    var v = mathPow(i, base, positive);
                    ticks.push(parseFloat(toPrecision(v, 15), 10));
                }
            }
            else{
                if(isFinite(start) && isFinite(end)){
                    dm = 1 + Math.ceil(max);// end - start;
                    for(i = 0; i < dm; i++){
                        ticks.push(mathPow(i, base, positive));
                    }
                    /*for(; i < interval; i++){
                        ticks.push(mathPow(i, base, positive));
                    }*/
                }
            }
            return ticks;
        },
        getTimeTicks: function(startValue, endValue){
            var options = this.options,
                tickAmount = options.tickAmount;// Math.max(1, ~~pack("number", options.tickAmount, 1));
            var min = startValue,
                max = endValue;
            var start,
                end,
                dm;
            var startYear;
            
            var interval = (dateTypes[options.dateType] || {}).interval || ONE_DAY;

            var getTime = function(year, month, day, hour, minute, seconds){
                return new Date(
                    year,
                    month,
                    pack("number", day, 1),
                    pack("number", hour, 0),
                    pack("number", minute, 0),
                    pack("number", seconds, 0)
                ).getTime();
            };
            var getTimeInterval = function(time, i, year, month, date){
                if(interval === dateTypes.year.interval){
                    time = getTime(year + i, 0);
                }
                else if(interval === dateTypes.month.interval){
                    time = getTime(year, month + i);
                }
                else if(interval === dateTypes.day.interval){
                    time = getTime(year, month, date + i);
                }
                else if(interval === dateTypes.week.interval){
                    time = getTime(year, month, date + i * 7);
                }
                else{
                    time += interval;
                }
                return time;
            };
            var ticks = [];
            var i = 1;
            if(
                (start = new Date(min)).toString() !== "Invalid Date" &&
                (end = new Date(max)).toString() !== "Invalid Date"){
                (start.getTime() > end.getTime() &&
                    (dm = start, start = end, end = dm));
            }
            else{
                return ticks;
            }
            
            start.setMilliseconds(interval >= dateTypes.second.interval ? 0 : start.getMilliseconds());
            if(interval >= dateTypes.second.interval){
                start.setSeconds(interval >= dateTypes.minute.interval ? 0 : start.getSeconds());
            }
            if(interval >= dateTypes.minute.interval){
                start.setMinutes(interval >= dateTypes.hour.interval ? 0 : start.getMinutes());
            }
            if(interval >= dateTypes.hour.interval){
                start.setHours(interval >= dateTypes.day.interval ? 0 : start.getHours());
            }
            if(interval >= dateTypes.day.interval){
                start.setDate(interval >= dateTypes.month.interval ? 1 : start.getDate());
            }
            if(interval >= dateTypes.month.interval){
                start.setDate(interval > dateTypes.year.interval ? 0 : start.getMonth());
                startYear = start.getFullYear();
            }
            if(interval > dateTypes.year.interval){
                start.setFullYear(startYear);
            }
            startYear = start.getFullYear();

            var time = start.getTime(),
                month = start.getMonth(),
                date = start.getDate();
            end = end.getTime();

            if(isNumber(tickAmount)){
                tickAmount = Math.max(1, ~~tickAmount);
                dm = Math.floor((end - time) / tickAmount);
                while(i <= tickAmount){
                    var t = getTimeInterval(time, i, startYear, month, date);
                    t = t + (dm * i);
                    ticks.push(t);
                    i++;
                }
            }
            else{
                ticks.push(time);
                while(time < end){
                    ticks.push(time = getTimeInterval(time, i, startYear, month, date));
                    i++;
                }
            }
            return ticks;
        },
        getPolarTicks: function(){
            var options = this.options,
                tickAmount = options.tickAmount;
            var startValue = 0,
                endValue = 360;
            var step;
            var ticks = [];
            if(!isNumber(tickAmount)){
                tickAmount = 12;
            }
            step = endValue / tickAmount;
            for(var i = 0; i < tickAmount; i++){
                ticks.push(startValue + parseFloat(toPrecision(i * step, 10), 10));
            }
            return ticks;
        },
        setTickInterval: function () {
            var options = this.options,
                categories = options.categories,
                tickAmount = options.tickAmount,
                logBase = pack("number", pack("object", options.logarithmic, {}).base, 10),
                type = this.type;
            var domain = options.domain,
                minDomain = domain[0],
                maxDomain = domain[1],
                dm;
            var minValue = options.minValue,
                maxValue = options.maxValue,
                startValue = options.startValue,
                endValue = options.endValue;
            startValue = Math.min(100, Math.max(0, pack("number", parseFloat(startValue, 10), 0))) / 100;
            endValue = Math.min(100, Math.max(0, pack("number", parseFloat(endValue, 10), 100))) / 100;

            startValue > endValue && (dm = startValue, startValue = endValue, endValue = dm);
            minDomain > maxDomain && (dm = minDomain, minDomain = maxDomain, maxDomain = dm);
            startValue = minDomain + (maxDomain - minDomain) * startValue;
            endValue = minDomain + (maxDomain - minDomain) * endValue;

            var values = [];
            var ticks = type === "logarithmic"
                ? this.getLogTicks(minValue, maxValue, logBase)
                : type === "datetime"
                    ? this.getTimeTicks(minDomain, maxDomain)
                    /*: type === "categories"
                        ? this.getCategoriesTicks(minDomain, maxDomain)*/
                        : this.getLinearTicks(minValue, maxValue);//min & max value

            if(type === "logarithmic"){
                values = this.getLogTicks(minDomain, maxDomain, logBase);
            }
            else if(type === "categories" || (isArray(categories))){
                values = this.getCategoriesTicks(minDomain, maxDomain);
            }
            else if(type === "datetime"){
                values = this.getTimeTicks(startValue, endValue);
            }
            else if(this.name === "polarAxis"){
                values = this.getPolarTicks();
            }
            else{
                if(!isNumber(tickAmount) && this.name === "polarAxis" && options.gridLineInterpolation === "polygon"){
                    tickAmount = options.length;
                }
                values = this.getLinearTicks(minDomain, maxDomain);//startValue, endValue);
            }
            
            if(options.reversed === true){
                values.reverse();
            }

            if(values.length >= 1){
                this.startValue = values[0];
                this.endValue = values[values.length - 1];
            }
            if(ticks.length > 1){
                this.minValue = ticks[0];
                this.maxValue = ticks[ticks.length - 1];
            }
            else{
                this.minValue = minValue;
                this.maxValue = maxValue;
            }
            if (type === "logarithmic") {
                this.minValue = mathLog(this.minValue, logBase);
                this.maxValue = mathLog(this.maxValue, logBase);
            }
            //console.log(values, type, this.name, this.minValue, this.maxValue, maxDomain);
            return this.values = values;
        },
        setLabels: function () {
            var options = this.options,
                layout = options.layout || {},
                hasCategories = options.categories && isArray(options.categories) && !!options.categories.length;

            var maxRange = this.maxRange,
                minRange = this.minRange,
                startValue = this.startValue,
                endValue = this.endValue;
            var ticks = this.ticks,
                type = this.type,
                name = this.name;
            var size = 0,
                length;
            var axis = this;

            var startAngle = pack("number", options.startAngle, -90),
                center = (
                    center = pack("array", options.center, ["50%", "50%"]),
                    center.length < 2 && (center[1] = center[0]), center
                ),
                radius = maxRange;//polar axis
            center[0] = pack("number", center[0], Numeric.percentage(options.width, center[0]));
            center[1] = pack("number", center[1], Numeric.percentage(options.height, center[1]));

            axis.zeroAxis.hidden = type === "categories"
                    || !(startValue <= 0 && endValue > 0)
                    || (name !== "xAxis" && name !== "yAxis");
            if(length = ticks.length){
                size = Math.max(minRange, maxRange, 1) / (length);
                ticks.forEach(function(tick, i){
                    if (name === "xAxis") {
                        size = maxRange / Math.max(1, length - 1);
                        tick.y = 0;
                        if(type === "categories"){
                            size = maxRange / (length - !hasCategories);
                            tick.x = hasCategories ? i * size : interpolate(tick.value, startValue, endValue, minRange, maxRange);
                        }
                        else{/* if(type === "linear"){*/
                            tick.x = interpolate(tick.value, startValue, endValue, minRange, maxRange);
                        }
                        if(tick.value === 0)
                            axis.zeroAxis.x = tick.x;
                    }
                    else if (name === "yAxis") {
                        tick.x = 0;
                        if(type === "logarithmic"){
                            size = Math.max(minRange, maxRange, 1) / (Math.max(1, length - 1));
                            tick.y = (length - i - 1) * size;
                        }
                        else if (type === "categories"){
                            size =  maxRange / (length - !hasCategories);
                            tick.y = (length - i - !hasCategories) * size;
                        }
                        else {
                            tick.y = interpolate(tick.value, startValue, endValue, maxRange, minRange);
                        }
                        if (tick.value === 0)
                            axis.zeroAxis.y = tick.y;
                    }
                    else if(name === "colorAxis"){
                        if(layout === "vertical"){
                            tick.x = 0;
                            tick.y = interpolate(tick.value, startValue, endValue, maxRange, minRange);
                        }
                        else{
                            tick.x = interpolate(tick.value, endValue, startValue, maxRange, minRange);
                            tick.y = 0;
                        }
                    }
                    else if(name === "polarAxis" || name === "radiusAxis"){
                        var ratio = i / Math.max(1, length - (name === "radiusAxis")),
                            innerRadius = radius - radius * ratio,
                            angle = ratio * 360 + startAngle, //(ratio * PI2) + (startAngle / 180 * PI);
                            delta = angle * PI / 180;
                        var cx = center[0],// (options.width - innerRadius * 2),
                            cy = center[1];// (options.height - innerRadius * 2);
                        tick.cx = cx;
                        tick.cy = cy;
                        tick.x = Math.cos(delta) * radius + cx;
                        tick.y = Math.sin(delta) * radius + cy;
                        tick.angle = angle;
                        tick.radius = radius;
                        tick.innerRadius = innerRadius;
                        tick.startAngle = startAngle;
                    }
                    tick.size = size;
                });
            }
            //this.scale();
        },
        scale: function (minRange, maxRange) {
            var options = this.options,
                labels = options.labels || {},
                autoRotation = pack("number", labels.autoRotation, -45),
                categories = pack("array", options.categories, []),
                tickLength = pack("number", options.tickLength, 0),
                logarithmic = options.logarithmic || {},
                step = labels.step,
                maxWidth = labels.maxWidth,
                angle = labels.rotation,
                tickInterval = options.tickInterval,
                tickAmount = options.tickAmount,
                style = pack("object", labels.style, {}),
                fontStyle = {
                    fontStyle: pack("string", style.fontStyle, "normal"),
                    fontWeight: pack("string", style.fontWeight, "normal"),
                    fontSize: pack("string", style.fontSize, "12px"),
                    fontFamily: pack("string", style.fontFamily, "Arial"),
                    lineHeight: pack("string", style.lineHeight, "normal")
                };

            var minTickWidth = 60;
            var labelWidth = 0,
                labelHeight = 0;
            var size = 0;

            var ticks = [];
            var values = this.values,
                tickPositions = this.tickPositions;
            var hasCategories = this.type === "categories";// isArray(categories) && categories.length;
            var isRotation = isNumber(angle) && !isNaN(angle) && isFinite(angle);

            var axis = this;
            var context = this.context,
                type = this.type,
                name = this.name;
            if(name === "yAxis"){
                minTickWidth = this.labelHeight;
            }

            var length = values.length;

            if(!isNumber(tickInterval))
                tickInterval = 1;
            if(!isNumber(step)){
                if(isNumber(tickAmount)){
                    tickInterval = 1;
                }
                else if(type === "logarithmic"){
                    tickInterval = 1;//no auto
                }
                else if(name === "colorAxis"){
                    tickInterval = 1;
                }
                else if(~~(maxRange / length) <= minTickWidth){
                    tickInterval = Math.round(length / maxRange * minTickWidth);
                }
            }
            else{
                tickInterval = step;
            }
            tickInterval = Math.max(tickInterval, 1);
            for(var i = 0, j = 0; i < length; i++){
                var value = values[i];
                var tick = {
                    isFirst: i === 0,
                    isLast: i === length - 1,
                    //size: size,
                    value: value,
                    gap: Math.abs(value - (values[i + 1] || value))
                };
                tickPositions[i] = hasCategories && categories[i] || value;
                if (i % tickInterval === 0) {
                    j++;
                    tick.enabled = true;
                    ticks.push(tick);
                }
            }
            if(length = ticks.length){
                size = (maxRange - minRange) / (j);
                ticks.forEach(function(item, i){
                    var text = axis.labelFormatter(item.value, {
                        isFirst: !i,
                        isLast: !(length - i - 1),
                        index: i
                    }), ellipse = text,
                    bbox,
                    tag;

                    context.font = [
                        fontStyle.fontStyle,
                        fontStyle.fontWeight,
                        fontStyle.fontSize + "/" + (fontStyle.lineHeight),
                        fontStyle.fontFamily
                    ].join(" ");
                    tag = Text.HTML(Text.parseHTML(text), context, {
                        fontStyle: fontStyle.fontStyle,
                        fontWeight: fontStyle.fontWeight,
                        fontSize: fontStyle.fontSize,
                        lineHeight: fontStyle.lineHeight,
                        fontFamily: fontStyle.fontFamily
                    });
                    bbox = tag.getBBox();
                    if(isNumber(maxWidth)){
                        //bbox.width = maxWidth;
                    }
                    var tickSize = size - 4 * (name === "xAxis"),//margin
                        dm;
                    
                    if(name === "xAxis" || name === "yAxis"){
                        if(isNumber(maxWidth)){
                            maxWidth < bbox.width && (ellipse = Text.multipText("" + text, maxWidth));
                        }
                        else{
                            (bbox.width > tickSize) && (ellipse = Text.multipText("" + text, tickSize));
                        }
                    }
                    tag = Text.HTML(Text.parseHTML(ellipse), context, {
                        fontStyle: fontStyle.fontStyle,
                        fontWeight: fontStyle.fontWeight,
                        fontSize: fontStyle.fontSize,
                        lineHeight: fontStyle.lineHeight,
                        fontFamily: fontStyle.fontFamily
                    });
                    bbox = tag.getBBox();
                    //bbox.width = context.measureText(ellipse).width;
                    if(isNumber(logarithmic.base) && defined(logarithmic.pow)){
                        dm = 1;
                        if(isNumber(options.tickAmount) && options.tickAmount > 1){
                            dm = axis.maxDomain / ~-options.tickAmount;
                        }
                        bbox.width += context.measureText(mathRound(i * dm, 1)).width * 0.7;
                    }
                    isRotation = isRotation || (name === "xAxis" && bbox.width >= tickSize);//margin
                    
                    item.text = {
                        name: text,
                        ellipse: ellipse,
                        width: bbox.width,
                        height: bbox.height,
                        isFirst: !i,
                        isLast: !(length - i - 1)
                    };
                });
                
                ticks.forEach(function(tick){
                    var text = tick.text,
                        bbox,
                        tag;
                    if(name === "xAxis"){
                        //after rotate bbox
                        bbox = Text.measureText(text.ellipse, {
                            fontStyle: fontStyle.fontStyle,
                            fontWeight: fontStyle.fontWeight,
                            fontSize: fontStyle.fontSize,
                            lineHeight: fontStyle.lineHeight,
                            fontFamily: fontStyle.fontFamily,
                            rotation: pack("number", angle, isRotation ? autoRotation : 0)
                        });
                        text.firstHeight = bbox.height;
                        tag = Text.HTML(Text.parseHTML(text.ellipse), context, {
                            fontStyle: fontStyle.fontStyle,
                            fontWeight: fontStyle.fontWeight,
                            fontSize: fontStyle.fontSize,
                            lineHeight: fontStyle.lineHeight,
                            fontFamily: fontStyle.fontFamily,
                            rotation: pack("number", angle, isRotation ? autoRotation : 0)
                        });
                        //console.log(tag.getBBox(), text.ellipse)
                        bbox = tag.getBBox();
                        text.width = bbox.width;
                        text.height = bbox.height;
                    }
                    labelWidth = Math.max(labelWidth, text.width);
                    labelHeight = Math.max(labelHeight, text.height);
                });
                if(!defined(angle)){
                    angle = 0;//this.name !== "yAxis" ? -45 : 0;//default angle
                    if(name === "xAxis" && isRotation)
                        angle = autoRotation;
                }
                angle = angle * Math.PI / 180;
                //labelWidth += !isRotation * options.tickLength;
                labelHeight += /*!isRotation **/ tickLength;
                //console.log(labelWidth, labelHeight, isRotation);
            }
            if(name === "yAxis"){
                labelWidth += tickLength;
            }
            else if(name === "xAxis"){
                labelHeight += tickLength;
            }
            this.labelWidth = labelWidth * !labels.floating;
            this.labelHeight = labelHeight * !labels.floating;
            this.isRotation = isRotation;
            this.ticks = ticks;
            //console.log(this.labelWidth, this.labelHeight, ticks, this.name, isRotation);
        },
        setTitle: function(){
            var options = this.options,
                context = this.context;
            var title = options.title || {},
                labels = options.labels || {},
                margin = pack("number", title.margin, 0),
                style = title.style || {},
                fontStyle = {
                    fontWeight: style.fontWeight || "normal",
                    fontStyle: style.fontStyle || "normal",
                    fontFamily: style.fontFamily || (labels.style || {}).fontFamily || "Arial",
                    fontSize: style.fontSize || "12px",
                    lineHeight: style.lineHeight || "normal",
                    color: style.color
                },
                bbox;
            var x = pack("number", options.x,0) + pack("number", title.x, 0),
                y = pack("number", options.y, 0) + pack("number", title.y, 0);
            if(isObject(title) && title.enabled !== false && defined(title.text)){
                context.save();
                context.textAlign = "start";
                context.textBaseline = "alphabetic";
                context.fillStyle = fontStyle.color;
                context.font = [
                    fontStyle.fontStyle,
                    fontStyle.fontWeight,
                    fontStyle.fontSize + "/" + fontStyle.lineHeight,
                    fontStyle.fontFamily
                ].join(" ");
                bbox = Text.measureText(title.text, fontStyle);
                
                y -= margin;
                if(options.opposite === true){
                    x -= bbox.width;
                }
                context.fillText(title.text, x, y);
                context.restore();
                this.titleWidth = bbox.width;
                this.titleHeight = bbox.height + margin;
            }
        },
        setPlotLine: function(x, y, props){
            var options = this.options,
                fontStyle = {
                    fontSize: "14px",
                    fontWeight: "bold",
                    fontFamily: "Arial",
                    color: "#666"
                },
                arrow = pack("number", props.arrowLength, 5),
                padding = 8,
                w, h,
                text,
                bbox;
            var context = this.context;
            var axis = this;

            text = Numeric.toPrecision(props.value);//.toFixed(2);
            bbox = Text.measureText(text, fontStyle);
            w = bbox.width + padding * 2;
            h = bbox.height + padding;
            if(props.anchor === "bottom"){
                x = Math.min(x, axis.maxRange - w + options.x), y -= (h + arrow);
            }
            else if(props.anchor === "left"){
                x += arrow, y = Math.min(y, axis.maxRange - h + options.y);
            }
            else if(props.anchor === "top"){
                x = Math.min(x, axis.maxRange - w + options.x), y += arrow;
            }
            context.save();
            context.textAlign = "start";
            context.textBaseline = "alphabetic";
            context.fillStyle = "rgba(251, 251, 251, .85)";
            symbolCallout(x, y, w, h, {
                arrowLength: arrow,
                anchor: props.anchor
            })(context);
            (context.lineWidth = 1) && (context.strokeStyle = props.color, context.stroke());
            context.fill();
            context.fillStyle = fontStyle.color;
            context.font = fontStyle.fontWeight + " " + fontStyle.fontSize + " " + fontStyle.fontFamily;
            context.fillText(text, x + padding, y + bbox.height + arrow);
            context.restore();
        },
        setGrid: function(tick, i, ticks){
            var options = this.options,
                gridLineInterpolation = options.gridLineInterpolation;
            var context = this.context,
                name = this.name;
            var sin = Math.sin, cos = Math.cos;

            var fillArea = function(x, y, w, h, color){
                context.fillStyle = color;
                context.fillRect(x, y, w, h);
            };
            var fillRadius = function(tick, color){
                var x = tick.cx,
                    y = tick.cy,
                    innerRadius = tick.innerRadius,
                    startAngle = tick.startAngle;
                var size = Math.abs(ticks[0].innerRadius - ticks[1].innerRadius);
                var length = options.length,
                    i;
                var ratio, angle;

                context.fillStyle = color;
                context.beginPath();
                if(gridLineInterpolation === "polygon"){
                    for(i = 0; i <= length; i++){
                        ratio = i / length;
                        angle = (ratio * PI2) + startAngle;
                        context[i ? "lineTo" : "moveTo"](
                            cos(angle) * innerRadius + x,
                            sin(angle) * innerRadius + y
                        );
                    }
                    context.lineTo(cos(angle) * (innerRadius - size) + x, sin(angle) * (innerRadius - size) + y);
                    for(i = length; i >= 0; i--){
                        ratio = i / length;
                        angle = (ratio * PI2) + startAngle;
                        context["lineTo"](
                            cos(angle) * (innerRadius - size) + x,
                            sin(angle) * (innerRadius - size) + y
                        );
                    }
                }
                else{
                    angle2arc(
                        x,
                        y,
                        innerRadius,
                        innerRadius - size,
                        0,
                        PI2,
                        false//close path
                    )(context);
                }
                context.fill();
            };
            //alternate grid color
            if(defined(options.alternateGridColor) && ticks.length > 1){
                context.save();
                context.translate(options.x, options.y);
                if(name === "xAxis"){
                    ((i % 2) & !tick.isLast) && fillArea(
                        tick.x + 0.5,
                        tick.y - options.height,
                        Math.abs(ticks[0].x - ticks[1].x),//tick.size,
                        options.height - 0.5,
                        options.alternateGridColor
                    );
                }
                else if(name === "yAxis"){
                    (!(i % 2) && !tick.isLast) && fillArea(
                        tick.x + 0.5,
                        tick.y - Math.abs(ticks[0].y - ticks[1].y),
                        options.width,
                        Math.abs(ticks[0].y - ticks[1].y),
                        options.alternateGridColor
                    );
                }
                else if(name === "radiusAxis"){
                    (!(i % 2) && !tick.isLast) && fillRadius(tick, options.alternateGridColor);
                }
                context.restore();
            }
        },
        setOptions: function (options) {
            var domain, range;
            extend(this.options, options);
            if (defined(domain = options.domain)) {
                this.setTickInterval();
            }
            if (defined(range = options.range)) {
                this.minRange = range[0];
                this.maxRange = range[1] || range[0];
                this.setLabels();
            }
            return this;
        },
        labelFormatter: function(value, params){
            var options = this.options,
                numericSymbols = pack("array", options.lang.numericSymbols, []),
                formatter = (options.labels || {}).formatter,
                logarithmic = pack("object", options.logarithmic, {}),
                ret;//tickPositions
            params = params || {};
            var type = this.type;
            
            if(type === "categories"){
                ret = pack("array", options.categories, [])[value];
                !defined(ret) && (ret = value);
                this.tickPositions[value] = ret;
            }
            else if(type === "datetime"){
                ret = date2value(value, options.dateType || "year");//Date.format
            }
            else if(type === "logarithmic"){
                if(defined(logarithmic) && isNumber(logarithmic.base) && defined(logarithmic.pow)){
                    ret = "" + (logarithmic.base === Math.E ? "e" : logarithmic.base);
                }
                if(!defined(ret))
                    ret = numberic2value(value, numericSymbols);
            }
            else{
                ret = numberic2value(value, numericSymbols);
            }
            //formatter rewrite value
            if(isFunction(formatter)){
                ret = formatter.call({
                    axis: this,
                    value: value,
                    name: defined(ret) ? ret : value,
                    isFirst: !!params.isFirst,
                    isLast: !!params.isLast
                }, defined(ret) ? ret : value, params.index, this);
            }
            return ret;
        },
        formatter: function(callback){
            var options = this.options,
                labels = options.labels || {};
            var ticks = this.ticks,
                tick;
            var axis  = this;
            tick = this.Item();
            ticks.forEach(function(item, i){
                axis.setGrid(item, i, ticks);
                tick.adjustLabel(item, i, {
                    isCenter: labels.align === "center" && !!ticks.length,
                    isRotation: axis.isRotation
                });
                tick.render(item, i);
                callback && callback.call(axis, item);
            });
            tick.line();
        },
        animateTo: function(){
            var oldData = this._ticks,
                newData = this.ticks;
            var ticks = [];
            var animator = [];

            List.diff(newData, oldData, function(a, b){
                return a && b && (a.text.ellipse === b.text.ellipse);
            }).add(function(newIndex){
                var oldTick = oldData[newIndex], mergeTick;
                if(oldTick){
                    mergeTick = {
                        isFirst: oldTick.isFirst,
                        isLast: oldTick.isLast,
                        size: oldTick.size,
                        text: oldTick.text,
                        angle: oldTick.angle,
                        x: oldTick.x,
                        y: oldTick.y,
                        opacity: 0
                    };
                    ticks.push([oldTick, function(){
                        mergeTick.x = oldTick.x;
                        mergeTick.y = oldTick.y;// * timer;//oldTick.y;
                        mergeTick.opacity = 0;//1 - 1 * timer;
                    }]);
                    //animateTo(mergeTick, newIndex);
                    //animator.push(oldTick);
                }
            }).modify(function(newIndex, oldIndex){
                var newTick = newData[newIndex],
                    oldTick = oldData[oldIndex],
                    mergeTick;
                if(newTick && oldTick){
                    mergeTick = {
                        isFirst: newTick.isFirst,
                        isLast: newTick.isLast,
                        size: newTick.size,
                        text: newTick.text,
                        angle: newTick.angle,
                        x: oldTick.x,
                        y: oldTick.y
                    };
                    ticks.push([newTick, function(timer){
                        var ox = oldTick.x || 0,//step missing x&y
                            oy = pack("number", oldTick.y, newTick.y, 0);
                        mergeTick.x = ox + (newTick.x - ox) * timer;
                        mergeTick.y = oy + (newTick.y - oy) * timer;
                    }]);
                    animator.push(mergeTick);
                }
            }).remove(function(newIndex){
                var newTick = newData[newIndex],
                    mergeTick;
                if(newTick){
                    mergeTick = {
                        isFirst: newTick.isFirst,
                        isLast: newTick.isLast,
                        size: newTick.size,
                        text: newTick.text,
                        angle: newTick.angle,
                        x: newTick.x,
                        y: newTick.y,
                        //opacity: 0
                    };
                    ticks.push([newTick, function(){
                        mergeTick.x = newTick.x;
                        mergeTick.y = newTick.y;
                        //mergeTick.opacity = timer;
                    }]);
                    animator.push(mergeTick);
                }
            }).each();
            
            this._ticks = this.ticks;
            this.animator = animator;
            return ticks;
        },
        onFrame: function(){
            var labels = this.options.labels || {};
            var tick = this.Item();
            var axis = this;
            var oldData = this._ticks,
                newData = this.ticks;
            var animateTo = function(mergeTick, i){
                axis.setGrid(mergeTick, i, newData);
                tick.render(mergeTick);
                tick.adjustLabel(mergeTick, i, {
                    isCenter: labels.align === "center" && !!oldData.length,
                    isRotation: axis.isRotation
                });
            };
            this.animator.forEach(function(tick, i){
                animateTo(tick, i);
            });
            tick.line();
            axis.setTitle();
        },
        draw: function() {
            this.formatter();
            this.setTitle();
        },
        redraw: function(callback){
            this.draw(callback);
        },
        addTooltip: function(x, y, callback) {
            var options = this.options,
                stops = pack("array", options.stops, []),
                isHorizontal = options.layout === "horizontal",
                name = this.name;
            var startValue = this.startValue,
                endValue = this.endValue,
                maxRange = this.maxRange;
            var axis = this;

            var onMove = function(area) {
                extend(area, {
                    xAxis: {
                        width: options.x + maxRange,
                        height: options.y + options.tickLength + axis.labelHeight,
                        dx: x,
                        dy: options.y,
                        k: (x - options.x) / maxRange,
                        anchor: "bottom"
                    },
                    yAxis: {
                        width: options.x - options.tickLength - axis.labelWidth,
                        height: options.y + maxRange,
                        dx: options.x,
                        dy: y,
                        k: (maxRange - y + options.y) / (maxRange),
                        anchor: "left"
                    },
                    colorAxis: {
                        width: options.x + (isHorizontal ? maxRange : options.tickLength),
                        height: options.y + (isHorizontal ? options.tickLength : maxRange),
                        dx: isHorizontal ? x : options.x + options.tickLength,
                        dy: isHorizontal ? options.y + options.tickLength : y,
                        k: (isHorizontal ? x - options.x : maxRange - y + options.y) / (maxRange),
                        anchor: isHorizontal ? "top" : "left"
                    }
                }[name]);
                if (isNumber(startValue, true) && isNumber(endValue, true) && Intersection.rect({x: x, y: y}, area)) {
                    var k = Math.min(1, Math.max(0, area.k));
                    if (k - 0.01 <= 0) k = 0;
                    if (k - 0.99 >= 0) k = 1;
                    var value = startValue + (endValue - startValue) * k,
                        color = stops.length > 1 ? Color.interpolate(stops[0][1], stops[stops.length - 1][1])(k) : "#000";
                    axis.setPlotLine(area.dx, area.dy, {
                        value: value,
                        color: color,
                        anchor: area.anchor
                    });

                    //console.log(k, value, startValue, endValue);
                    
                    isFunction(callback) && callback.call(axis, value, color, k);
                }
            };
            onMove({x: options.x, y: options.y});
            return this;
        },
        destroy: function(){
            
        }
    };
    Chart.Axis = Axis;
})(typeof window !== "undefined" ? window : this, Dalaba);;
    (function(global, Dalaba){
    var Chart = Dalaba.Chart || {};

    var interpolate = Numeric.interpolate;

    var mathRound = Mathematics.round;

    var fixLinePixel = Chart.fixLinePixel;

    var Event = Chart.Event;

    var defaultOptions = {
        style: {
            fontSize: "12px",
            fontWeight: "normal",
            fontFamily: "\"Lucida Grande\", \"Lucida Sans Unicode\", Arial, Helvetica, sans-serif",
            lineHeight: "normal",
            cursor: "pointer",
            color: "#606060"
        },
        x: undefined,
        y: undefined,
        width: undefined,
        height: 30,
        margin: 0,
        layout: "horizontal",//horizontal or vertical,
        verticalAlign: "bottom",//top, bottom, middle
        align: "center",//left, right or center
        floating: false,
        borderWidth: 1,
        borderColor: "#ccc",
        backgroundColor: "#fff",// "rgba(51,92,173,0.05)"
        handles: [{
            backgroundColor: "#f2f2f2",
            borderColor: "#999",
            shadowBlur: 2,
            shadowColor: "rgba(0, 0, 0, 0.6)",
            shadowOffsetX: 1,
            shadowOffsetY: 0
        }, {
            backgroundColor: "#f2f2f2",
            borderColor: "#999",
            shadowBlur: 2,
            shadowColor: "rgba(0, 0, 0, 0.6)",
            shadowOffsetX: -1,
            shadowOffsetY: 0
        }]
    };
    var setShadow = function(context, options){
        defined(options.shadowColor) && (context.shadowColor = options.shadowColor);
        isNumber(options.shadowBlur) && (context.shadowBlur = options.shadowBlur);
        isNumber(options.shadowOffsetX) && (context.shadowOffsetX = options.shadowOffsetX);
        isNumber(options.shadowOffsetY) && (context.shadowOffsetY = options.shadowOffsetY);
    };

    var Symbol = {
        rect: function(x, y, size, height, options){
            var color = options.borderColor,
                w = size,
                h = 15;
            var linePixel = fixLinePixel(x, y, w, h);
            return function(context){
                var bw = 1;
                context.save();
                context.fillStyle = color;
                setShadow(context, options);
                context.fillRect(x, y, bw, height);
                x = linePixel.x, y = linePixel.y;
                w = linePixel.width, h = linePixel.height;
                
                context.translate(-w / 2 + bw, (height - h) / 2 - 1);
                context.lineWidth = 1;
                context.strokeStyle = color;
                context.fillStyle = options.backgroundColor;
                context.beginPath();
                context.moveTo(x, y);//left top
                context.lineTo(x + w, y);//right top
                context.lineTo(x + w, y + h);//right bottom
                context.lineTo(x, y + h);//left bottom
                context.lineTo(x, y);//close path
                setShadow(context, options);
                context.fill();
                context.stroke();

                context.beginPath();
                context.moveTo(x + 3, y + 3);
                context.lineTo(x + 3, y + h - 3);
                context.moveTo(x + w - 3, y + 3);
                context.lineTo(x + w - 3, y + h - 3);
                context.stroke();
                context.restore();
                return {
                    left: x - w / 2 + bw,
                    top: y,
                    width: w,
                    height: h
                };
            };
        }
    };

    function RangeSelector(){
        this.init.apply(this, arguments);
    }
    RangeSelector.prototype = {
        init: function(canvas, options){
            this.options = extend({}, defaultOptions);
            extend(this.options, options);

            this.canvas = canvas;
            this.context = canvas.getContext("2d");

            this.x = pack("number", this.options.x, 0);
            this.y = pack("number", this.options.y, this.options.borderWidth, 0);
            this.height = pack("number", this.options.height, defaultOptions.height);
            this.width = pack("number", this.options.width, this.height * 2);
            
            this.start = pack("number", Math.max(0, Math.min(100, parseFloat(options.start, 10)), 0), 0);
            this.end = pack("number", Math.max(0, Math.min(100, parseFloat(options.end, 10))), 100);
            if(this.start > this.end){
                var t = this.start;
                this.start = this.end;
                this.end = t;
            }
            this.start += "%";
            this.end += "%";

            this.from = Numeric.percentage(this.width, this.start) + this.x;
            this.to = Numeric.percentage(this.width, this.end) + this.x;

            this.minValue = pack("number", options.min, 0);
            this.maxValue = pack("number", options.max, 0);

            this.range = [];
            this.target = -1;

            this.dragging = false;

            //this.setValue();
        },
        setWidth: function(width){
            this.width = pack("number", width, 0);
            this.from = Numeric.percentage(this.width, this.start) + this.x;
            this.to = Numeric.percentage(this.width, this.end) + this.x;
        },
        setValue: function(){
            var width = this.width,
                x =  this.x;
            var minValue = this.minValue,
                maxValue = this.maxValue,
                startValue = minValue + (maxValue - minValue) * ((this.from - x) / width),
                endValue = minValue + (maxValue - minValue) * ((this.to - x) / width);
            //var percent = (maxValue - minValue) / (width);
            //sync start & end
            startValue = minValue + (maxValue - minValue) * parseFloat(this.start, 10) / 100;// (this.from - x) * percent;
            endValue = minValue + (maxValue - minValue) * parseFloat(this.end, 10) / 100;// (this.to - x) * percent;
            if(startValue > endValue){
                x = startValue;
                startValue = endValue;
                endValue = x;
            }
            this.startValue = startValue;
            this.endValue = endValue;
        },
        startToEnd: function(start, end){
            this.start = start;
            this.end = end;
            this.setWidth(this.width);
            this.draw();
        },
        setOptions: function(options){
            var hasOwnProperty = Object.prototype.hasOwnProperty;
            extend(this.options, options);

            switch(true){
                case hasOwnProperty.call(options, "min"):
                case hasOwnProperty.call(options, "max"):
                case hasOwnProperty.call(options, "width"):
                case hasOwnProperty.call(options, "x"):
                case hasOwnProperty.call(options, "y"):
                    isNumber(options.min) && (this.minValue = options.min);
                    isNumber(options.max) && (this.maxValue = options.max);
                    isNumber(options.x) && (this.x = pack("number", options.x, 0), this.setWidth(this.width - options.x));
                    isNumber(options.y) && (this.y = pack("number", options.y, 0));
                    defined(options.width) && this.setWidth(options.width);
                break;
                default:
                    
                break;
            }
            if(hasOwnProperty.call(options, "start") && hasOwnProperty.call(options, "end")){
                this.startToEnd(options.start, options.end);
            }
            return this;
        },
        drawPlot: function(){
            var options = this.options,
                borderWidth = pack("number", options.borderWidth, 1),
                borderColor = options.borderColor;
            var width = this.width,
                height = this.height,
                x = this.x,
                y = this.y - borderWidth;
            var context = this.context;
            var linePixel = fixLinePixel(x, y, width, height, borderWidth);

            context.save();
            context.fillStyle = options.backgroundColor;
            context.beginPath();
            context.moveTo(linePixel.x, linePixel.y);
            context.lineTo(linePixel.x + linePixel.width, linePixel.y);
            context.lineTo(linePixel.x + linePixel.width, linePixel.y + linePixel.height);
            context.lineTo(linePixel.x, linePixel.y + linePixel.height);
            context.closePath();
                
            if(borderWidth > 0){
                context.strokeStyle = borderColor;
                context.lineWidth = borderWidth;
                context.stroke();
            }
            if(defined(options.backgroundColor)){
                context.fill();
            }
            context.fillRect(linePixel.x, linePixel.y, 0, height);
            context.clip();
            context.restore();
        },
        drawNavigator: function(){
            var options = this.options,
                borderWidth = pack("number", options.borderWidth, 1),
                handles = (isArray(handles = options.handles) ? handles : [handles]),
                handle;
            var height = this.height,
                y = this.y;
            var context = this.context;
            var startX = this.from,// interpolate(this.start, 0, 100, x, width),
                endX = this.to;// interpolate(this.end, 0, 100, x, width);
            //console.log(startX, endX, this.start, this.end);
            var z0 = {x: startX, y: y},
                z1 = {x: endX, y: y};
            if(startX > endX){
                z0 = {x: endX, y: y};
                z1 = {x: startX, y: y};
            }
            context.save();
            context.fillStyle = "rgba(51,92,173,0.2)";
            context.fillRect(z0.x, y, z1.x - z0.x, height);
            /*context.fillStyle = zoomColor;
            context.fillRect(startX, y, Math.abs(startX - endX), 1);
            context.fillRect(startX, y + height, Math.abs(startX - endX), 1);*/
            //context.translate(x, 0);
            handle = handles[0] || {};
            z0.viewport = handle.enabled !== false ? Symbol.rect(z0.x, z0.y, 8, height, handle)(context) : {};
            handle = handles[1] || handle;
            z1.viewport = handle.enabled !== false ? Symbol.rect(z1.x, z1.y, 8, height, handle)(context) : {};
            context.restore();
            this.range = [z0, z1];
        },
        drawSeries: function(){
            var options = this.options,
                data = pack("array", options.data, []),
                length = data.length,
                i = 0,
                j;

            var width = this.width,
                height = this.height,// - pack("number", options.borderWidth, 1),
                tx = this.x,
                ty = this.y,
                x, y;
            var minValue,
                maxValue;
            var startX, startY, isNull = false;
            var size = width / ~-length,
                value;
            var context = this.context;

            var getDataValue = function(item){
                var value = item;
                if(isObject(item) && (isNumber(item.value) || isNumber(item.y))){
                    value = item.value;
                    isNumber(item.y) && (value = item.y);
                }
                else if(isArray(item)){
                    value = item[1];
                }
                return isNumber(value) ? value : null;
            };

            while(value = getDataValue(data[i]), !isNumber(value) && ++i < length);
            while(value = getDataValue(data[length - 1]), !isNumber(value) && --length >= 0);
            //console.log(i, length);
            minValue = maxValue = value = getDataValue(data[j = i]);
            for(j = i + 1; j < length; j++){
                value = getDataValue(data[j]);
                isNumber(value) && (minValue > value && (minValue = value), maxValue < value && (maxValue = value));
            }
            if(maxValue - minValue === 0)
                return;
            context.save();            
            context.beginPath();
            context.moveTo(
                startX = tx + i * size,
                startY = ty + interpolate(getDataValue(data[i]), minValue, maxValue, height, 0)
            );
            for(; i < length; i++){
                value = getDataValue(data[i]);
                x = i * size + tx;
                if(!isNumber(value)){
                    isNull = isNull || !isNull;
                    j = i + 1;
                    do{
                        value = getDataValue(data[j]);
                    }while(!isNumber(value) && j++ < length);
                    context.moveTo(j * size + tx, ty + interpolate(value, minValue, maxValue, height, 0));
                }
                y = ty + interpolate(value, minValue, maxValue, height, 0);
                context.lineTo(x, y);
            }
            context.lineWidth = 1;
            context.strokeStyle = "#afb8bc";
            context.stroke();
            isNull || (
                context.lineTo(x, ty + height),
                context.lineTo(startX, ty + height),
                context.lineTo(startX, startY),
                context.fillStyle = "#e2e4e5",
                context.fill()
            );

            context.restore();
        },
        getTarget: function(x, y){
            var range = this.range,
                height = this.height,
                startZoom,
                endZoom,
                size;
            var target = -1;
            if(!this.range.length){
                return target;
            }
            startZoom = range[0].viewport;
            endZoom = range[1].viewport;
            size = range[1].x - range[0].x;
            if(Intersection.rect(
                {x: x, y: y},
                {x: range[0].x, y: this.y, width: range[0].x + size, height: this.y + height}
            )){
                target = 0;
            }
            if(Intersection.rect(
                {x: x, y: y},
                {x: startZoom.left, y: startZoom.top, width: startZoom.left + startZoom.width, height: startZoom.top + this.height}
            )){
                target = 1;
            }
            else if(Intersection.rect(
                {x: x, y: y},
                {x: endZoom.left, y: endZoom.top, width: endZoom.left + endZoom.width, height: endZoom.top + height}
            )){
                target = 2;
            }
            return target;
        },
        getCursor: function(x, y){
            var cursor = null;
            var target = this.getTarget(x, y);
            if(target === 0)
                cursor = "move";
            if(target === 1 || target === 2)
                cursor = "ew-resize";
            this.hasRange = target > -1 && target < 3;
            return cursor;
        },
        getRangeValue: function(){
            var options = this.options,
                style = options.style || {},
                fontStyle = {
                    fontStyle: style.fontStyle || "normal",
                    fontSize: style.fontSize || "12px",
                    fontWeight: style.fontWeight || "normal",
                    fontFamily: style.fontFamily || "Arial",
                    lineHeight: style.lineHeight || "normal",
                    color: style.color
                };
            var height = this.height,
                y = this.y,
                fontSize = pack("number", parseFloat(fontStyle.fontSize, 10) * 0.8);
            var range = this.range,
                z0 = range[0].viewport,
                z1 = range[1].viewport;
            var startValue = parseFloat(this.start, 10),
                endValue = parseFloat(this.end, 10);
            if(startValue > endValue){
                var t = startValue;
                startValue = endValue;
                endValue = t;
            }
            startValue = pack("string",
                options.startValue,
                parseFloat(Numeric.toPrecision(this.startValue, 8), 10),
                mathRound(startValue, 3) + "%",
                "0"
            );
            endValue = pack("string",
                options.endValue,
                parseFloat(Numeric.toPrecision(this.endValue, 8), 10),
                mathRound(endValue, 3) + "%",
                "0"
            );
            var context = this.context;

            this.setValue();
            if(this.hasRange || this.dragging){
                context.save();
                context.fillStyle = fontStyle.color;
                context.font = [fontStyle.fontStyle, fontStyle.fontWeight,
                    fontStyle.fontSize + "/" + fontStyle.lineHeight, fontStyle.fontFamily].join(" ");
                //context.textBaseline = "top";
                context.textAlign = "right";
                context.fillText(startValue, range[0].x - z0.width / 2, y + fontSize + (height - fontSize) / 2);
                context.textAlign = "left";
                context.fillText(endValue, range[1].x + z1.width / 2, y + fontSize + (height - fontSize) / 2);
                context.restore();
            }
        },
        draw: function(){
            this.drawPlot();
            this.drawSeries();
            this.drawNavigator();
            this.getRangeValue();
        },
        onStart: function(x, y, e){
            var target;
            var start = parseFloat(this.start, 10),
                end = parseFloat(this.end, 10),
                t;
            x = Event.normalize(e, this.canvas);
            y = x.y;
            x = x.x;
            this.dragging = (target = this.target = this.getTarget(x, y)) > -1 && target < 3;
            this.dx = x - this.range[0].x;
            if(this.from > this.to){
                t = this.from;
                this.from = this.to;
                this.to = t;
            }
            if(start > end){
                t = this.start;
                this.start = this.end;
                this.end = t;
            }
        },
        onDrag: function(x, y, callback){
            var width = this.width;
            var range = this.range,
                z0 = range[0],
                z1 = range[1],
                startZoom = z0.viewport,
                endZoom = z1.viewport;
            var start, end;
            var target = this.target;
            var size = z1.x - z0.x,
                dx, sx, ex;

            if(!this.dragging)
                return;

            if(target === 1){
                dx = startZoom.left + (x - startZoom.left);
                this.from = Math.min(width + this.x, Math.max(this.x, dx));
                this.start = Math.max(0, Math.min(1, (dx - this.x) / width)) * 100 + "%";
            }
            else if(target === 2){
                dx = endZoom.left + (x - endZoom.left);
                this.to = Math.min(width + this.x, Math.max(this.x, dx));
                this.end = Math.max(0, Math.min(1, (dx - this.x) / width)) * 100 + "%";
            }
            else if(target === 0){
                dx = x - this.dx;// + this.ax;
                sx = dx;
                ex = dx + size;
                if(sx <= this.x){
                    sx = this.x;
                    ex = sx + size;
                }
                else if(ex >= this.width + this.x){
                    ex = this.width + this.x;
                    sx = ex - size;
                }
                this.from = sx;
                this.to = ex;
                this.start = Math.max(0, Math.min(1, (sx - this.x) / width)) * 100 + "%";
                this.end = Math.max(0, Math.min(1, (ex - this.x) / width)) * 100 + "%";
            }
            start = parseFloat(this.start, 10), end = parseFloat(this.end, 10);
            if(start > end){
                dx = start;
                start = end;
                end = dx;
            }

            target > -1 && target < 3 && callback && callback.call(this, this.startValue, this.endValue, start + "%", end + "%");
        },
        onDrop: function(x, y, callback){
            this.target >-1 && this.target < 3 && callback && callback.call(this);
            this.dragging = false;
            this.target = -1;
            delete this.hasRange;

        }
    };

    if(defined(Chart)){
        Chart.RangeSelector = RangeSelector;
    }

    if(typeof module === "object" && module.exports){
        module.exports = RangeSelector;
    }
    else if(typeof define === "function" && define.amd)
        define(function(){
            return RangeSelector;
        });
    else{
        (typeof Chart !== "undefined" ? Chart : global).RangeSelector = RangeSelector;
    }
})(typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this, Dalaba);;

    (function(global, Chart){

    var relayout = (function(global){

    var isZero = function (min, max) { return min <= 0 && max >= 0; };

    function factoy (Mathematics, Numeric) {
        var interpolate = Numeric.interpolate;
        var mathMin = Math.min,
            mathMax = Math.max,
            mathFloor = Math.floor;
        var mathLog = Math.log;

        return function(panels) {

            function getKey(series, xAxisOptions, index, size) {
                var categories = xAxisOptions.categories,
                    startIndex = +series.startIndex;// pack("number", series.startIndex, 0);
                isNaN(startIndex) || (startIndex = 0);

                var key = index;
                if(categories && categories.length){
                    key = mathFloor(index + size + startIndex);
                    if(defined(categories[key]))
                        key = categories[key];
                }
                else{
                    //key = (minTickValue) + index * (maxTickValue - minTickValue) / length;
                    key = mathFloor(key + size + startIndex);
                }
                return key;
            }

            panels.forEach(function(pane) {
                var series = pane.series;
                var newData = partition(series, function(a, b){
                    var axis = (a.yAxis) === (b.yAxis) && (a.xAxis === b.xAxis);
                    if(axis){
                        if(typeof a.stack === "undefined" && typeof b.stack === "undefined")
                            return false;
                        return a.stack === b.stack && a.type === b.type;
                    }
                    return false;
                });
                    
                newData.forEach(function(group){
                    var n = group.length,
                        m = group[0].data.length,
                        j,//data size
                        i = 0;//series size
                    /*group.forEach(function(series){
                        m = mathMax(series.data.length, m);
                    });*/
                    var series, shape, value, total, positiveTotal, negativeTotal = 0;
                    var plotX, plotY, plotWidth, plotHeight;
                    var pointWidth, pointHeight, center, centerY, zeroY, yBottom, xLeft, x, y, highY;
                    var yAxisOptions,
                        xAxisOptions,
                        logBase, minValue, maxValue,
                        reversed;
                    //series properties
                    var inverted, pointPosition,
                        coordinate;
                    var isStart;
                    var size;

                    m = pack("number", group[0].maxLength, /*group[0].data.length,*/ group[0].maxLength);

                    for(j = 0; j < m; j++){
                        positiveTotal = 0;
                        negativeTotal = 0;
                        for(i = 0; i < n; i++){
                            series = group[i];//stack series
                            shape = series.shapes[j] || {};
                            value = shape.value;

                            inverted = !!series.inverted;
                            coordinate = series.coordinate;
                            pointPosition = series.pointPosition;

                            plotX = series.plotX;
                            plotY = series.plotY;
                            plotWidth = series.plotWidth;
                            plotHeight = series.plotHeight;

                            yAxisOptions = series._yAxis;// yAxis[series.yAxis | 0];
                            logBase = (yAxisOptions.logarithmic || {}).base || 10;
                            reversed = yAxisOptions.reversed;
                            maxValue = yAxisOptions.maxValue;
                            minValue = yAxisOptions.minValue;
                            xAxisOptions = series._xAxis;

                            isStart = pointPosition === "start";
                            size = mathMax(1, m - isStart);

                            pointHeight = plotHeight / size;
                            pointWidth = plotWidth / size;
                            center = (pointWidth / 2) * !isStart;
                            centerY = (pointHeight / 2) * !isStart;
                            zeroY = plotHeight - (isZero(minValue, maxValue)
                                ? reversed === true
                                    ? interpolate(0, minValue, maxValue, plotHeight, 0)
                                    : interpolate(0, minValue, maxValue, 0, plotHeight)
                                : 0
                            );
                            yBottom = plotY + zeroY;
                            yBottom = mathMin(plotHeight + plotY, yBottom);
                            xLeft = plotX;

                            if(series.selected === false || value === 0 || shape.isNULL){
                                value = 0;
                            }
                            else if(value < 0){
                                negativeTotal += value;
                            }
                            else{
                                positiveTotal += value;
                            }

                            if(yAxisOptions.type === "logarithmic"){
                                negativeTotal += value;
                                positiveTotal = mathLog(negativeTotal, logBase);
                            }
                            if(coordinate === "xy"){
                                x = interpolate.apply(null, [
                                    isArray(shape.source) ? shape.source[0] : isObject(shape.source) ? shape._x : null,
                                    xAxisOptions.minValue, xAxisOptions.maxValue, 0, plotWidth
                                ]);
                                x += plotX + center;
                                y = interpolate.apply(null, [
                                    isArray(shape.source) ? shape.source[1] : isObject(shape.source) ? shape._y : null,
                                    minValue, maxValue
                                ].concat(reversed === true ? [0, plotHeight] : [plotHeight, 0]));
                                y += plotY;
                            }
                            else{
                                if(isArray(shape.source) && shape.source.length > 1){
                                    //连续性
                                    x = j * pointWidth;// interpolate.apply(null, [shape.source[0], xAxisOptions.minValue, xAxisOptions.maxValue, 0, plotWidth]);
                                    x += plotX;
                                    x += center;
                                    y = isNumber(shape.source[1]) ? interpolate.apply(null,
                                        [shape.source[1], minValue, maxValue].concat(
                                            reversed === true ? [0, plotHeight] : [plotHeight, 0]
                                        )
                                    ) : NaN;
                                    y += plotY;
                                    highY = isNumber(shape.source[2]) ? interpolate.apply(null,
                                        [shape.source[2], minValue, maxValue].concat(
                                            reversed === true ? [0, plotHeight] : [plotHeight, 0]
                                        )
                                    ) : NaN;
                                    highY += plotY;
                                }
                                else if(isNumber(shape._x) && isNumber(shape._y)){
                                    x = plotX + j * pointWidth;//离散性
                                    x += center;
                                    y = interpolate.apply(null,
                                        [shape._y, minValue, maxValue].concat(
                                            reversed === true ? [0, plotHeight] : [plotHeight, 0]
                                        )
                                    );
                                    y += plotY;
                                }
                                else{
                                    if(inverted){
                                        pointWidth = plotHeight / (m);
                                        //console.log(inverted, pointWidth);
                                        y = j * pointWidth;
                                        y += plotY;
                                        y += centerY;
                                        x = interpolate(
                                            value < 0 ? negativeTotal : positiveTotal,
                                            minValue,
                                            maxValue,
                                            0,
                                            plotWidth
                                        );
                                        x += plotX;
                                    }
                                    else{
                                        x = j * pointWidth;
                                        x += plotX;
                                        x += center;
                                        //m === 1 && (x += center);
                                        y = [value < 0 ? negativeTotal : positiveTotal, minValue, maxValue, plotHeight, 0];
                                        reversed === true && (y[3] = y[4], y[4] = plotHeight);
                                        y = interpolate.apply(null, y);
                                        y += plotY;
                                    }
                                }
                            }

                            var prevShape = inverted ? {
                                x: xLeft, y: y,
                                x1: xLeft, y1: y,
                                x2: xLeft, y2: y
                            } : {
                                x: x, y: yBottom,
                                x1: x, y1: yBottom,
                                x2: x, y2: yBottom
                            };
                            if(i > 0){
                                prevShape = group[i - 1].shapes[j];
                                yBottom =  prevShape.y;
                                xLeft = prevShape.x;
                                yBottom = mathMin(plotHeight + plotY, yBottom);
                            }

                            total = n > 1 ? value >= 0 ? positiveTotal : negativeTotal : undefined;//series not shared
                            if(series.selected === false){
                                //y = plotY + zeroY;
                            }
                            y = mathMin(plotY + plotHeight, y);
                            shape.x = shape.x1 = shape.x2 = x;
                            shape.y = shape.y1 = shape.y2 = y;
                            shape.highY = highY;
                            shape.total = total;
                            shape.percentage = n > 1 ? value / total * 100 : undefined;
                            shape.size = pointWidth;
                            shape.margin = center;
                            shape.yBottom = yBottom;
                            shape.xLeft = xLeft;
                            shape.key = getKey(series, xAxisOptions, j, center / plotWidth / m, m);
                            shape.index = j;
                            shape.prevShape = prevShape;
                        }
                    }
                });

                series.forEach(function(item){
                    if(item.type === "spline" || item.type === "areaspline"){
                        Renderer.pointSpline(item.shapes, item);
                    }
                });
            });
        };
    }
    return {
        deps: function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
}).call(typeof window !== "undefined" ? window : this).deps(Dalaba.Math, Numeric);

    var Linked = (function(){
    var next = function(points, i, n) {
        var point;
        while(point = points[i], point.isNULL && i < ~-n) ++i;
            return i;
    };
    var back = function(points, i, n) {
        var point;
        while(point = points[n - 1], point.isNULL && --n > i);
            return n;
    };
    var find = function(points, s, e) {
        var j = s, point;
        do {
            point = points[j];
        } while(point.isNULL && j++ < e);
        return j;
    };
    var each = function(context, points, step) {
        var length = points.length,
            i = next(points, 0, length),
            j;
        var point;
        var moveX, moveY;
        length = back(points, i, length);
        point = points[i];

        context.beginPath();
        context.moveTo(moveX = point.x, moveY = point.y);
        for(; i < length; i++){
            point = points[i];
            if(point.isNULL){
                j = find(points, j = i + 1, length);
                point = points[j];
                context.moveTo(moveX = point.x, moveY = point.y);
            }
            step(point, i, moveX, moveY);
        }
    };

    var Linked = {
        line: function(context, points, options) {
            var dashStyle = options.dashStyle,
                onStep = options.onStep;
            var length = points.length,
                i = next(points, 0, length),//[a, b-1)
                j;
            var point;
            var x, y, moveX, moveY;
            length = back(points, i, length);//(b, a]
            point = points[i];

            context.beginPath();
            context.moveTo(moveX = point.x, moveY = point.y);
            for (; i < length; i++) {
                point = points[i];
                if (point.isNULL) {
                    j = find(points, j = i + 1, length);
                    point = points[j];
                    context.moveTo(moveX = point.x, moveY = point.y);
                }
                //step(point, i, moveX, moveY);
                x = point.x, y = point.y;
                DashLine[dashStyle] && dashStyle !== "solid" ? DashLine[dashStyle](
                    context,
                    moveX, moveY,
                    moveX = x, moveY = y
                ) : context.lineTo(x, y);
                onStep && onStep(point);
            }
        },
        spline: function(context, points, options) {
            var onStep = options.onStep;
            var length = points.length,
                i = next(points, 0, length),
                j;
            var x, y, x1, y1, x2, y2;
            var point;
            length = back(points, i, length);
            point = points[i];

            context.beginPath();
            context.moveTo(point.x, point.y);
            for (; i < length; i++) {
                point = points[i];
                x = point.x, y = point.y;
                x1 = point.x1, y1 = point.y1;
                x2 = point.x2, y2 = point.y2;
                if (point.isNULL) {
                    j = find(points, j = i + 1, length);
                    point = points[j];
                    x = x1 = x2 = point.x;
                    y = y1 = y2 = point.y;
                    context.moveTo(x, y);
                }
                else context.bezierCurveTo(x1, y1, x2, y2, x, y);
                onStep && onStep(point);
            }
        },
        step: function(context, points, options) {
            var type = options.step,
                onStep = options.onStep;
            each(context, points, function(point, i) {
                var curt = points[i],
                    prev = points[i - 1];
                if (prev && !prev.isNULL && !curt.isNULL) {
                    switch (type) {
                        case "right":
                            context.lineTo(prev.x, curt.y);
                        break;
                        case "center":
                            context.lineTo((prev.x + curt.x) / 2, prev.y);
                            context.lineTo((prev.x + curt.x) / 2, curt.y);
                        break;
                        default:
                            context.lineTo(curt.x, prev.y);
                        break;
                    }
                    context.lineTo(curt.x, curt.y);
                    onStep && onStep(curt);
                }
            });
        },
        arearange: function(context, points, options){
            var onStep = options.onStep;
            var length = points.length,
                i = next(points, 0, length),
                j;
            var point;
            var x, y, moveX, moveY;
            var key = options.key,
                dashStyle = options.dashStyle;
            length = back(points, i, length);
            point = points[i];

            context.beginPath();
            context.moveTo(moveX = point.x, moveY = point[key]);
            for(; i < length; i++){
                point = points[i];
                if(point.isNULL){
                    j = find(points, j = i + 1, length);
                    point = points[j];
                    context.moveTo(moveX = point.x, moveY = point[key]);
                }
                x = point.x, y = point[key];
                DashLine[dashStyle] && dashStyle !== "solid" ? DashLine[dashStyle](
                    context,
                    moveX, moveY,
                    moveX = x, moveY = y
                ) : context.lineTo(x, y);
                onStep && onStep(point);
            }
        }
    };
    return Linked;
})();;

    var Fill = (function() {
    var find = function(points, start, end) {
        for(var k = end, b; k >= start && (b = points[k]).isNULL; k++);
            return k;
    };

    var each = function(points, call) {
        var n = points.length,
            i;
        var left = (i = 0),
            right = n;
        var point;

        while (left < right) {
            point = points[--right];
            if (point.isNULL) {
                i = right;
                n--;
                i ^ n && call(i + 1, n);
                n = i;
            }
        }
        !points[0].isNULL && call(0, n - 1);
    };

    var begin = function(context, points, start, end, draw, call) {
        var point = points[start];
        var n = end,
            i = start;

        context.moveTo(point.x, point.y);

        for (; i <= n || call(start, i); i++)
            draw(points[i]);
    };
    var stop = function(context, points, start, end, inverted, call) {
        var point = points[end -= 1];
        context.lineTo(inverted ? point.xLeft : point.x, point.yBottom);
        call(start, end);
    };
    var close = function(context, points, start, end, draw) {
        var i = end;
        for(; i > start; --i)
            draw(points[i], start, i);
    };

    var Fill = {
        line: function(context, points, options) {
            var inverted = options.inverted,
                type = options.type;
            each(points, function(start, end) {
                begin(context, points, start, end, function(point) {
                    context.lineTo(point.x, point.y);
                }, function(start, end) {
                    stop(context, points, start, end, inverted, function(start, end) {
                        close(context, points, ~-start, end, function(point) {
                            context.lineTo.apply(context, type === "arearange" ? [point.x, point.highY] : inverted ? [point.xLeft, point.y] : [point.x, point.yBottom]);
                        });
                    });
                });
            });
        },
        spline: function(context, points, options) {
            var inverted = options.inverted;
            each(points, function(start, end) {
                begin(context, points, start, end, function(point) {
                    context.bezierCurveTo(point.x1, point.y1, point.x2, point.y2, point.x, point.y);
                }, function(start, end) {
                    var startX = points[start];
                    stop(context, points, start, end, inverted, function(start, end) {
                        close(context, points, start, end, function(point, start, end) {
                            if (point.prevShape) {
                                var b = points[end - 1];
                                if (b) {
                                    if(b.isNULL){
                                        b = points[find(points, start, end)];
                                    }
                                    b = b.prevShape; 
                                }
                                else {
                                    b = startX;
                                }
                                context.bezierCurveTo(
                                    point.prevShape.x2,
                                    point.prevShape.y2,
                                    point.prevShape.x1,
                                    point.prevShape.y1,
                                    b.x,
                                    b.y
                                );
                            }
                        });
                    });
                });
            });
        },
        range: function(context, points, options) {
            Fill.line(context, points, options);
        }
    };
    return Fill;
})();;

    var smooth = Geometry.Line.smooth;

    var setPoint = function(points, start, end, inverted){
        var segment = points.slice(start, end),//[start, end)
            point,
            bezierCurve;
        for (var k = 0; k < end - start; k++) {
            bezierCurve = smooth(
                segment[k - 1],//prev point
                point = points[start + k],
                segment[k + 1],//next point
                inverted
            );
            if (bezierCurve) {
                point.x1 = bezierCurve.x1;
                point.y1 = bezierCurve.y1;
                point.x2 = bezierCurve.x2;
                point.y2 = bezierCurve.y2;
                point.x = bezierCurve.x;
                point.y = bezierCurve.y;
            }
        }
    };
    
    var Renderer = {
        pointSpline: function(points, series){
            var start = 0, end = points.length;
            var left = 0, right = end;
            while (left < right) {
                var point = points[left];
                if (point.isNULL) {
                    end = left;
                    if (start !== end && end - start > 2) {
                        setPoint(points, start, end, !!series.inverted);
                    }
                    for (var k = end; k < right; k++) if (!points[k].isNULL) {
                        end = k;
                        break;
                    }
                    start = end;
                }
                left++;
            }
            if (!points[left - 1].isNULL && left - start > 2) {
                setPoint(points, start, left, !!series.inverted);
            }
        },
        line: function(context, shapes, series, options){
            var dashStyle = pack("string", series.dashStyle, "solid"),
                lineWidth = pack("number", series.lineWidth, 2),
                step = series.step,
                type = series.type;
            var key = options.y || "y";
            //console.log(series.state)
            if(shapes.length){
                context.save();
                if(type === "spline" || type === "areaspline"){
                    Linked.spline(context, shapes, {});
                }
                else if(type === "arearange"){
                    Linked.arearange(context, shapes, {
                        key: key,
                        dashStyle: dashStyle
                    });
                }
                else{
                    Linked[defined(step) ? "step" : "line"](context, shapes, {
                        step: step,
                        dashStyle: dashStyle,
                        //onStep: function(shape){ }
                    });//line step
                }
                series.selected !== false && (lineWidth) > 0 && (
                    context.shadowColor = series.shadowColor,
                    isNumber(series.shadowBlur) && (context.shadowBlur = series.shadowBlur),
                    isNumber(series.shadowOffsetX) && (context.shadowOffsetX = series.shadowOffsetX),
                    isNumber(series.shadowOffsetY) && (context.shadowOffsetY = series.shadowOffsetY),
                    context.strokeStyle = series.lineColor || series.color,
                    context.lineCap = "round",
                    context.lineJoin = "round",
                    context.lineWidth = lineWidth,// + 1 * !!series.state,
                    context.stroke()
                );
                context.restore();
            }
        },
        area: function(context, shapes, series){
            var type = series.type;
            var color = series.color,
                opacity = series.opacity,
                fillColor;
            if(!shapes.length || series.selected === false){
                return;
            }
            
            var minY = Number.MAX_VALUE,
                maxY = -minY;
            var minX = null, maxX = null;

            shapes.forEach(function(shape, i) {
                var last = shapes[shapes.length - i - 1];
                if(isNumber(shape.yBottom) && shape.yBottom === shape.yBottom){
                    minY = Math.min(minY, shape.yBottom);
                }
                maxY = Math.max(maxY, shape.y);
                if (minX === null && isNumber(shape.x, true)) {
                    minX = shape.x;
                }
                if (maxX === null && isNumber(last.x, true))
                    maxX = last.x;
            });
            

            if(defined(fillColor = series.fillColor) && shapes.length > 1){
                if(Color.isColor(fillColor)){
                    color = fillColor;
                }
                else if(defined(fillColor.linearGradient)) {
                    color = Color.parse(fillColor).linear(minX, minY, maxX, maxY);
                }
            }
            else{
                color = Color.parse(color).alpha(pack("number", opacity, 0.75)).rgba();
            }

            context.save();
            context.beginPath();
            
            Fill[{
                areaspline: "spline",
                arearange: "range"
            }[type] || "line"](context, shapes, {
                inverted: !!series.inverted,
                type: type
            });
            context.globalCompositeOperation = pack("string", series.blendMode, "source-over");//multiply
            //context.globalAlpha = .5;
            context.fillStyle = color;
            context.fill();
            context.restore();
        },
        hover: function(context, shape, series){
            var marker = series.marker || {},
                fillColor = shape.color || series.color,
                hoverColor = Color.parse(fillColor);
                hoverColor.a = 0.5;
            var fill = function(x, y) {
                context.fillStyle = Color.rgba(hoverColor);
                context.beginPath();
                context.arc(x, y, 8, 0, PI2);
                context.fill();

                context.fillStyle = fillColor;
                context.strokeStyle = marker.fillColor || "#fff";
                context.beginPath();
                context.arc(x, y, 3, 0, PI2);
                context.fill();
                context.stroke();
            };
            if (marker.enabled !== false && isNumber(shape.current) && shape.current !== -1) {
                [].slice.call(arguments, -2).forEach(function(key) {
                    context.save();
                    fill(shape.x, shape[key]);
                    context.restore();
                });
            }
            delete shape.current;
        },
        xClip: function(t, context, canvas, x, y){
            if(0 !== t){
                context.save();
                t > 0 && context.drawImage(
                    canvas,
                    x, y, canvas.width * t, canvas.height,
                    x, y, canvas.width * t / DEVICE_PIXEL_RATIO, canvas.height / DEVICE_PIXEL_RATIO
                );
                context.restore();
            }
        },
        yClip: function(t, context, canvas, x, y){
            if(0 !== t){
                context.save();
                t > 0 && context.drawImage(
                    canvas,
                    x, y, canvas.width, canvas.height * t,
                    x, y, canvas.width / DEVICE_PIXEL_RATIO, canvas.height * t / DEVICE_PIXEL_RATIO
                );
                context.restore();
            }
        }
    };
    /*
     * Class Line
    */
    function Line(canvas, options) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.type = "line";
        
        this.series = [];
        this.shapes = [];
        this.init(options);
	}
	Line.prototype = {
        constructor: Line,
		init: function(options) {
            var canvas = this.canvas,
                type = this.type,
                animation = (options.chart || {}).animation;
            var panels = [],
                panel = options.panel;
            var n = panel.length,
                i = -1,
                nn, j;
            var series = [], newSeries;

            while (++i < n) {
                newSeries = [];
                for (j = 0, nn = panel[i].series.length; j < nn; j++) if ((series = panel[i].series[j]).type === this.type) {
                    newSeries.push(series);
                    series._diffValues = List.diff(series.shapes, series._shapes || [], function(a, b) {
                        return a && b && a.value === b.value;
                    });
                }
                panels.push({series: newSeries});
            }
            this.options = options;
            this.panels = panels;
            this.series = newSeries;

            relayout(panels, options);

            if ((animation === true || (animation && animation.enabled !== false))
                    && canvas.nodeType === 1) {

                this.series.forEach(function(series) {
                    var image = document.createElement("canvas"),
                        context = image.getContext("2d");
                    Chart.scale(
                        context,
                        pack("number", series.plotWidth + series.plotX, canvas.width),
                        pack("number", series.plotHeight + series.plotY, canvas.height),
                        DEVICE_PIXEL_RATIO
                    );
                    series._image = image;
                    if(type === "area" || type === "areaspline" || type === "arearange"){
                        Renderer.area(context, series.shapes, series);
                        if(type === "arearange"){
                            Renderer.line(context, series.shapes, series, {
                                y: "highY"
                            });
                        }
                    }
                    Renderer.line(context, series.shapes, series, {
                        y: "y"
                    });
                });
            }
        },
        draw: function() {
            var context = this.context,
                chart = this;
            this.series.forEach(function(series){
                var shapes = series.shapes;
                //draw line
                Renderer.line(context, shapes, series, {
                    y: "y",
                    //addMarker: function(shape){}
                });
                shapes.forEach(function(shape){
                    chart.drawMarker(context, shape, series, "y");//draw marker
                    chart.drawLabels(context, shape, series);//draw data labels
                    Renderer.hover(context, shape, series, "y");//hover points
                });
            });
        },
        redraw: function() {
            relayout(this.panels, this.options);
            this.draw();
        },
        animateTo: function(context, initialize){
            var chart = this;
            var shapes = [];
            chart.series.forEach(function(series){
                var newData = series.shapes,
                    oldData = series._shapes || [];
                var animators = [];
                if(initialize === true){
                    var mergeShape = series;
                    shapes.push([series, function(timer){
                        mergeShape._timer = timer;
                    }]);
                    animators.push(mergeShape);
                }
                else{
                    series._diffValues.add(function(newIndex){
                        var oldShape = oldData[newIndex],
                            mergeShape = {
                                value: oldShape.value,
                                _value: oldShape._value,
                                isNULL: oldShape.isNULL,
                                color: oldShape.color,
                                x: oldShape.x,
                                y: oldShape.y,
                                x1: oldShape.x1,
                                y1: oldShape.y1,
                                x2: oldShape.x2,
                                y2: oldShape.y2,
                                highY: oldShape.highY,
                                yBottom: oldShape.yBottom,
                                marker: oldShape.marker,
                                dataLabels: oldShape.dataLabels
                            };
                        if(defined(oldShape.prevShape)){
                            mergeShape.prevShape = {
                                x: oldShape.prevShape.x,
                                y: oldShape.prevShape.y,
                                x1: oldShape.prevShape.x1,
                                y1: oldShape.prevShape.y1,
                                x2: oldShape.prevShape.x2,
                                y2: oldShape.prevShape.y2,
                                highY: oldShape.prevShape.highY
                            };
                        }
                        //timer = Math.min(1, countLength * timer);
                        //console.log(item, newData[item.newIndex].value)
                        if(oldShape.value === oldData[0].value){
                            //mergeShape.x = mergeShape.x * timer;// oldShape.x1 - (oldShape.x1 - oldShape.x0) * timer;//forward
                        }
                        else/* if(oldShape.value === oldData[oldData.length - 1].value)*/{
                            
                        }
                        mergeShape.x = NaN;// oldShape.x + (newShape.x - oldShape.x) * timer;//back
                        //mergeShape.y = oldShape.y + (newShape.y - oldShape.y) * timer;
                        animators.push(mergeShape);
                    }).remove(function(newIndex){
                        var newShape, oldShape,
                            mergeShape;
                        newShape = newData[newIndex];
                        oldShape = oldData[newIndex];
                        mergeShape = {
                            value: newShape.value,
                            _value: newShape._value,
                            isNULL: newShape.isNULL,
                            color: newShape.color,
                            x: newShape.x,
                            y: newShape.y,
                            x1: newShape.x1,
                            y1: newShape.y1,
                            x2: newShape.x2,
                            y2: newShape.y2,
                            highY: newShape.highY,
                            yBottom: newShape.yBottom,
                            marker: newShape.marker,
                            dataLabels: newShape.dataLabels
                        };
                        if(defined(newShape.prevShape)){
                            mergeShape.prevShape = {
                                x: newShape.prevShape.x,
                                y: newShape.prevShape.y,
                                x1: newShape.prevShape.x1,
                                y1: newShape.prevShape.y1,
                                x2: newShape.prevShape.x2,
                                y2: newShape.prevShape.y2,
                                highY: newShape.prevShape.highY
                            };
                        }
                        shapes.push([newShape, function(timer){
                            var xGap = series.plotWidth / newData.length * (newData.length - oldData.length),
                                xStart,
                                xEnd;
                            xEnd = newData[newData.length - 1].x;
                            xStart = xEnd - xGap;
                            xGap -= series.plotX;

                            xStart = xStart + (xEnd - xStart) * timer;
                            xEnd = xEnd - xStart;
                            
                            mergeShape.x1 = newShape.x1;// + xGap * (1 - timer);
                            mergeShape.y1 = newShape.y1;
                            mergeShape.x2 = newShape.x2;// + xGap * (1 - timer);
                            mergeShape.y2 = newShape.y2;
                            mergeShape.x = newShape.x;// + xGap * (1 - timer);
                            mergeShape.y = newShape.y;
                        }]);
                        animators.push(mergeShape);
                    }).modify(function(newIndex, oldIndex){
                        var newShape = newData[newIndex],
                            oldShape = oldData[oldIndex],
                            mergeShape;
                        
                        if(oldShape && newShape){
                            mergeShape = {
                                value: newShape.value,
                                _value: newShape._value,
                                isNULL: newShape.isNULL,
                                color: newShape.color,
                                x: oldShape.x,
                                y: oldShape.y,
                                x1: oldShape.x1,
                                y1: oldShape.y1,
                                x2: oldShape.x2,
                                y2: oldShape.y2,
                                highY: oldShape.highY,
                                yBottom: newShape.yBottom,
                                marker: newShape.marker,
                                dataLabels: newShape.dataLabels
                            };
                            if(defined(newShape.prevShape)){
                                mergeShape.prevShape = {
                                    x: newShape.prevShape.x,
                                    y: newShape.prevShape.y,
                                    x1: newShape.prevShape.x1,
                                    y1: newShape.prevShape.y1,
                                    x2: newShape.prevShape.x2,
                                    y2: newShape.prevShape.y2,
                                    highY: newShape.prevShape.highY
                                };
                            }
                            shapes.push([newShape, function(timer){
                                var x = (oldShape.x || newShape.x) + (newShape.x - (oldShape.x || newShape.x)) * timer;
                                var y = (oldShape.y || newShape.y) + (newShape.y - (oldShape.y || newShape.y)) * timer;
                                var y1 = (oldShape.y1 || newShape.y1) + (newShape.y1 - (oldShape.y1 || newShape.y1)) * timer;
                                var y2 = (oldShape.y2 || newShape.y2) + (newShape.y2 - (oldShape.y2 || newShape.y2)) * timer;
                                var x1 = (oldShape.x1 || newShape.x1) + (newShape.x1 - (oldShape.x1 || newShape.x1)) * timer;
                                var x2 = (oldShape.x2 || newShape.x2) + (newShape.x2 - (oldShape.x2 || newShape.x2)) * timer;
                                var highY = (oldShape.highY || newShape.highY) + (newShape.highY - (oldShape.highY || newShape.highY)) * timer;

                                mergeShape.x = x;
                                mergeShape.y = y;
                                //console.log(oldShape.y, newShape.y)
                                mergeShape.x1 = x1;
                                mergeShape.x2 = x2;
                                mergeShape.y1 = y1;
                                mergeShape.y2 = y2;
                                mergeShape.highY = highY;
                            }]);
                            animators.push(mergeShape);
                        }
                    }).each();
                }
                series._animators = animators;
                series._shapes = series.shapes;
            });
            return shapes;
        },
        onFrame: function(context, initialize){
            var chart = this;
            this.series.forEach(function(series){
                var animators = series._animators;
                if(initialize === true){
                    animators.forEach(function(series){
                        series._image && Renderer[series.inverted ? "yClip" : "xClip"](series._timer, context, series._image, 0, 0);
                    });
                }
                else{
                    if(series.type === "area" || series.type === "areaspline" || series.type === "arearange"){
                        Renderer.area(context, animators, series);
                        if(series.type === "arearange"){
                            Renderer.line(context, animators, series, {
                                y: "highY"
                            });
                        }
                    }
                    Renderer.line(context, animators, series, {
                        y: "y"
                    });
                    animators.forEach(function(shape){
                        chart.drawMarker.apply(null, [context, shape, series].concat(series.type === "arearange" ? ["y", "highY"] : ["y"]));
                        chart.drawLabels(context, shape, series);
                    });
                }
            });
        },
        drawShape: function(context, shape, series){
            if(shape && shape.value !== null){
                Renderer.hover(context, shape.x, shape.y, series);
            }
        },
        drawLabels: function(context, shape, series){
            var radius = pack("number", (shape.marker || {}).radius, (series.marker || {}).radius, 0);
            dataLabels.align(function(type, bbox){
                var t = pack("string", type, "center"),
                    x = shape.x,
                    w = bbox.width;
                if(isNaN(x))
                    return -9999;
                return {
                    left: x - w - radius / 2,
                    center: x - w / 2,
                    right: x + radius / 2
                }[t];
            }).vertical(function(type, bbox){
                var t = pack("string", type, "top"),
                    y = shape.y,
                    h = bbox.height;
                if(isNaN(y))
                    return -9999;
                return {
                    top: y - h - radius,
                    middle: y - h + radius,
                    bottom: y + radius
                }[t];
            }).call(shape, series, context);
        },
        drawMarker: function(context, shape, series){
            var seriesMarker = series.marker || {},
                shapeMarker = shape.marker || {};
            var lineWidth = pack("number", shapeMarker.lineWidth, seriesMarker.lineWidth, 0),
                lineColor = pack("string", shapeMarker.lineColor, seriesMarker.lineColor, shape.color, "#000"),
                fillColor = pack("string", shapeMarker.fillColor, seriesMarker.fillColor, shape.color, "#000"),
                radius = pack("number", shapeMarker.radius, seriesMarker.radius, 4);

            var usemarker = radius * radius <= series.plotWidth / series.shapes.length;
            if(defined(shapeMarker.enabled) || defined(seriesMarker.enabled)){
                usemarker = shapeMarker.enabled === true || seriesMarker.enabled === true;
            }

            [].slice.call(arguments, -2).forEach(function(key){
                if(series.selected !== false & shape.value !== null & usemarker){
                    context.save();
                    context.fillStyle = fillColor;
                    context.beginPath();
                    context.arc(shape.x, shape[key], radius, 0, PI2, true);
                    context.fill();
                    lineWidth > 0 && (context.lineWidth = lineWidth, context.strokeStyle = lineColor, context.stroke());
                    context.restore();
                }
            });
        },
        getShape: function(x, y, shared){
            var series,
                shape,
                sl = this.series.length,
                i;
            var results = [],
                result,
                shapes;
            var kdtree;

            var inverted;

            var isInside = function(series){
                return !(
                    x < pack("number", series.plotX, 0) ||
                    x > series.plotWidth + pack("number", series.plotX, 0) ||
                    y < pack("number", series.plotY, 0) ||
                    y > series.plotHeight + pack("number", series.plotY, 0)
                );
            };
            function reset(shapes){
                shapes.forEach(function(item){
                    delete item.current;
                });
            }

            for(i = 0; i < sl; i++){
                series = this.series[i];
                if(series.selected !== false){
                    shapes = series.shapes;
                    inverted = !!series.inverted;
                    if(isInside(series)){
                        reset(shapes);
                        kdtree = KDTree(shapes);
                        shape = kdtree.nearest({x: x, y: y}, function(a, b){
                            var dx = a.x - b.x,
                                dy = a.y - b.y;
                            return inverted ? dy * dy : dx * dx;
                        })[0];
                        kdtree.destroy();
                        if(defined(shape) && !shape.isNULL){
                            shape.current = shape.index;
                            result = {shape: shape, series: series};
                            result.shape.$value = shape._value;
                            if(series.type === "arearange"){
                                result.shape.$value = shape.source[1] + "," + (shape._value);
                            }
                            results.push(result);
                        }
                    }
                }
            }
            if(shared === false){
                shapes = results.map(function(item){ return item.shape; });
                reset(shapes);
                kdtree = KDTree(shapes);
                shape = kdtree.nearest({x: x, y: y}, function(a, b){
                    var dx = a.x - b.x, dy = a.y - b.y;
                    return dx * dx + dy * dy;
                })[0];
                kdtree.destroy();

                if(defined(shape) && !shape.isNULL){
                    shape.current = shape.index;
                    result = {shape: shape, series: shape.series};
                    result.shape.$value = "" + shape._value;
                    if(shape.series.type === "arearange"){
                        result.shape.$value = shape._value + "," + (shape.source[2]);
                    }
                    return [result];
                }
            }
            return results;
        }
    };

    var Spline = (function () {
    return {
        deps: function () {
            return function (Dalaba, Line) {
                var extend = Dalaba.extend,
                    pack = Dalaba.pack,
                    arrayFilter = Dalaba.Cluster.List.filter;

                var Spline = function (canvas, options) {
                    this.canvas = canvas;
                    this.context = canvas.getContext("2d");
                    this.type = "spline";

                    this.init(options);
                };
                extend(Spline.prototype, Line.prototype, {
                    constructor: Spline,
                    init: function (options) {
                        this.series = arrayFilter(pack("array", options.series, []), function(series){
                            return series.type === "spline";
                        });
                        Line.prototype.init.call(this, options);
                    }
                });
                return Spline;
            }.apply(global, [].concat([].slice.call(arguments, 0)));
        }
    };
})().deps(Dalaba, Line);

    var Area = (function () {
    function factoy (Dalaba, Line) {
        var extend = Dalaba.extend,
            pack = Dalaba.pack,
            arrayFilter = Dalaba.Cluster.List.filter;

        function Area (canvas, options) {
            this.canvas = canvas;
            this.context = canvas.getContext("2d");
            this.type = "area";

            this.init(options);
        }
        extend(Area.prototype, Line.prototype, {
            constructor: Area,
            init: function(options) {
                this.series = arrayFilter(pack("array", options.series, []), function(series){
                    return series.type === "area";
                });
                Line.prototype.init.call(this, options);
            },
            draw: function() {
                var context = this.context,
                    chart = this;
                this.series.forEach(function(series){
                    var shapes = series.shapes;
                    Renderer.area(context, shapes, series);
                    Renderer.line(context, shapes, series, {
                        y: "y"
                    });

                    shapes.forEach(function(shape){
                        chart.drawMarker(context, shape, series, "y");//draw marker
                        chart.drawLabels(context, shape, series);//draw data labels
                        Renderer.hover(context, shape, series, "y");//hover points
                    });
                });
            },
            redraw: function(){
                Line.prototype.redraw.apply(this, arguments);
            }
        });
        return Area;
    }

    return {
        deps: function() {
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
})().deps(Dalaba, Line, Renderer.area);

    var AreaSpline = (function () {
    return {
        deps: function () {
            return function (Dalaba, Area) {
                var pack = Dalaba.pack,
                    extend = Dalaba.extend,
                    arrayFilter = Dalaba.Cluster.List.filter;
                
                function AreaSpline(canvas, options) {
                    this.canvas = canvas;
                    this.context = canvas.getContext("2d");
                    this.type = "areaspline";
                    
                    this.init(options);
                }
                extend(AreaSpline.prototype, Area.prototype, {
                    init: function(options) {
                        this.series = arrayFilter(pack("array", options.series, []), function(series){
                            return series.type === "areaspline";
                        });
                        Area.prototype.init.call(this, options);
                    }
                });
                return AreaSpline;
            }.apply(global, [].slice.call(arguments));
        }
    };
})().deps(Dalaba, Area);

    var AreaRange = (function () {
    function factoy (Dalaba, AreaSpline) {
        var extend = Dalaba.extend;

        var arrayFilter = Dalaba.Cluster.List.filter;


        function AreaRange (canvas, options) {
            this.canvas = canvas;
            this.context = canvas.getContext("2d");
            this.type = "arearange";

            this.init(options);
        }
        extend(AreaRange.prototype, AreaSpline.prototype, {
            init: function(options){
                this.series = arrayFilter(pack("array", options.series, []), function(series){
                    return series.type === "arearange";
                });
                Area.prototype.init.call(this, options);
            },
            draw: function(){
                var context = this.context,
                    chart = this;
                this.series.forEach(function(series){
                    var shapes = series.shapes;
                    Renderer.area(context, series.shapes, series);
                    Renderer.line(context, shapes, series, {
                        y: "highY"
                    });                    
                    Renderer.line(context, shapes, series, {
                        y: "y"
                    });//draw line

                    shapes.forEach(function(shape){
                        var params = [context, shape, series, "y"];
                        if(series.type === "arearange"){
                            params.push("highY");
                        }
                        chart.drawMarker.apply(null, params);//draw marker
                        chart.drawLabels(context, shape, series);//draw data labels
                        Renderer.hover.apply(null, params);//hover points
                    });
                });
            }
        });
        return AreaRange;
    }

    return {
        deps: function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
})().deps(Dalaba, AreaSpline);
    
    var graphers = (Chart.graphers = Chart.graphers || {}),
        charts,
        type;
    for(type in (charts || (charts = {
        Line: Line,
        Spline: Spline,
        Area: Area,
        AreaSpline: AreaSpline,
        AreaRange: AreaRange
    }))){
        graphers[type.toLowerCase()] = Chart[type] = charts[type];
    }

})(typeof window !== "undefined" ? window : this, Dalaba.Chart || {});;
    (function(global, Chart) {

    var addLayout = (function(global) {

    var mathLog = Mathematics.log;

    var isZero = function(min, max) {
        return min <= 0 && max >= 0;
    };

    function factoy() {
        var computeColumn = function(group, width, height, groupCounting, groupLength) {
            var series = group[0];
            var plotX = pack("number", series.plotX, 0),
                plotY = pack("number", series.plotY, 0),
                plotWidth = pack("number", series.plotWidth, width),
                plotHeight = pack("number", series.plotHeight, height);

            var yAxisOptions = series._yAxis/*[series.yAxis | 0]*/ || {},
                logBase = pack("number", pack("object", yAxisOptions.logarithmic, {}).base, 10),
                maxValue = yAxisOptions.maxValue,
                minValue = yAxisOptions.minValue;
            var reversed = yAxisOptions.reversed;
            //console.log(series.minValue, minValue, series.maxValue, maxValue, reversed)

            var xAxisOptions = series._xAxis /*[series.xAxis | 0]*/ || {},
                minTickValue = 0,
                maxTickValue = xAxisOptions.length,
                categories = xAxisOptions.categories;

            var n = group.length, m = series.maxLength;//group[0].shapes.length;
            var maxLength = m;
            if(series.grouping === false){
                groupLength = 1;
                groupCounting = 0;
            }

            var tickWidth = plotWidth / maxLength;//maxLength
            var pointSize = getPointSize(group[0], tickWidth, groupLength);
            var center = (tickWidth - groupLength * pointSize) / 2;
            var zeroY = plotHeight - (isZero(minValue, maxValue) ? interpolate(0, minValue, maxValue, 0, plotHeight) : 0);

            var shape, value;
            
            for(var j = 0; j < m; j++){
                series = group[0];
                shape = series.shapes[j] || {};
                value = shape.value;

                var sum = value,
                    total = value;
                if(yAxisOptions.type === "logarithmic"){
                    value = mathLog(value, logBase);
                }
                for(var i = 1; i < n; i++){
                    total += (group[i].shapes[j] || {}).value;
                }
                var key = getKey(series, minTickValue + j * maxTickValue / m, categories, j, center / width / m);
                if(shape._x){
                    key = shape._x;
                }

                var x0, y0, x1, y1;
                var dirTop,/*positive*/dirBottom,/*negative*/startY;

                x0 = plotX + (j * tickWidth);
                x0 += center;
                x0 += groupCounting * pointSize;
                x1 = x0 + pointSize;//width
                                
                y0 = plotY + (reversed === true ? 0 : zeroY);
                y1 = y0;//value is zero


                if(series.selected === false || value === 0){
                    y1 = 0;
                    sum = 1;//log value is 0
                }
                else if(value < 0){
                    y1 = interpolate(value, 0, minValue, 0, Math.abs(plotHeight - zeroY));
                }
                else{
                    y1 = interpolate(value, 0, maxValue, 0, zeroY);
                }

                dirTop = dirBottom = y0;
                if(value >= 0){
                    startY = dirTop;
                    dirTop -= y1;
                    y1 = -y1;
                }
                else{
                    startY = dirBottom;
                    dirBottom += y1;
                }
                //y1 = (y0 = startY) + y1;
                y1 = (y0 = startY) + (!(reversed === true) || -1) * y1;

                if(series.selected === false){
                    x0 = x1;
                    y1 = y0;
                }

                extend(shape, {
                    x0: x0,
                    y0: y0,
                    x1: x1,
                    y1: y1,
                    total: n > 1 ? total : undefined,//series not shared
                    percentage: n > 1 ? value / total * 100 : undefined,
                    size: pointSize,
                    margin: center,
                    yBottom: zeroY + plotY,
                    key: key,
                    index: j
                });

                //stack
                for(i = 1; i < n; i++){
                    series = group[i];
                    shape = series.shapes[j] || {};
                    value = shape.value;
                    if(!isNumber(value)){
                        value = 0;
                    }

                    //dirTop = dirBottom = y1;
                    if(yAxisOptions.type === "logarithmic"){
                        value = mathLog(value += sum, logBase);
                        y1 = interpolate(value, minValue, maxValue, 0, plotHeight);
                        y1 -= interpolate(mathLog(sum, logBase), minValue, maxValue, 0, plotHeight);
                    }
                    else{
                        if(series.selected === false || value === 0){
                            y1 = 0;
                        }
                        else if(value < 0){
                            y1 = interpolate(value, 0, minValue, 0, Math.abs(plotHeight - zeroY));
                        }
                        else{
                            y1 = interpolate(value, 0, maxValue, 0, zeroY);
                        }
                    }

                    if(value >= 0){
                        startY = dirTop;
                        dirTop -= y1;
                        y1 = -y1;
                    }
                    else{
                        startY = dirBottom;
                        dirBottom += y1;
                    }

                    //pointSize = getPointSize(item[i], tickWidth, groupLength);
                    
                    x0 = plotX + (j * tickWidth);
                    x0 += center;
                    x0 += groupCounting * pointSize;
                    x1 = x0 + pointSize;//width

                    y0 = startY;
                    //y1 = y0 + y1;
                    y1 = y0 + (!(reversed === true) || -1) * y1;
                    if(series.selected === false){
                        x0 = x1;
                        y1 = y0;
                    }
                    extend(shape, {
                        x0: x0,
                        y0: y0,
                        x1: x1,
                        y1: y1,
                        size: pointSize,
                        margin: center,
                        yBottom: zeroY + plotY,
                        total: total,
                        percentage: value / total * 100,
                        key: key,
                        index: j
                    });
                }
            }
        };
        var computeBar = function(group, width, height, groupCounting, groupLength) {
            var series = group[0];
            var plotX = pack("number", series.plotX, 0),
                plotY = pack("number", series.plotY, 0),
                plotWidth = pack("number", series.plotWidth, width),
                plotHeight = pack("number", series.plotHeight, height);

            var xAxisOptions = series._xAxis || {},
                logBase = pack("number", (xAxisOptions.logarithmic || {}).base, 10),
                maxValue = xAxisOptions.maxValue,
                minValue = xAxisOptions.minValue;

            var yAxisOptions = series._yAxis || {},
                minTickValue = 0,
                maxTickValue = yAxisOptions.length,
                categories = yAxisOptions.categories;

            var reversed = xAxisOptions.reversed;
            //minValue = yAxisOptions.minValue;
            if (series.grouping === false) groupCounting = ~-(groupLength = 1);
            
            var n = group.length, m = series.maxLength;// group[0].shapes.length;
            var tickHeight = plotHeight / m;
            var pointSize = getPointSize(group[0], tickHeight, groupLength);
            var center = (tickHeight - groupLength * pointSize) / 2;
            var zeroX = (isZero(minValue, maxValue) ? interpolate(0, minValue, maxValue, 0, plotWidth) : 0);
            var shape, value;
            for (var j = 0; j < m; j++) {
                series = group[0];
                shape = series.shapes[j] || {};
                value = shape.value;

                var sum = value,
                    total = value;
                if(xAxisOptions.type === "logarithmic"){
                    value = mathLog(value, logBase);
                }
                for(var i = 1; i < n; i++){
                    total += group[i].shapes[j].value;
                }

                var key = getKey(series, minTickValue + j * maxTickValue / m, categories, j, center / width / m);
                var x0, y0, x1, y1;
                var dirLeft,/*positive*/dirRight,/*negative*/startX;
                //down to top
                y0 = plotHeight + plotY;//plotY + (j * tickHeight);
                y0 -= j * tickHeight;
                y0 -= center;
                y0 -= groupCounting * pointSize;
                y0 -= pointSize;
                y1 = y0 + pointSize;

                x0 = plotX + (reversed === true ? plotWidth : zeroX);
                x1 = x0;//value is zero
                if(isNumber(shape._x) && isNumber(shape._y)){
                    if(series.selected === false || shape._y === 0){
                        x1 = 0;
                    }
                    else if(shape._y < 0){
                        x1 = interpolate(shape._y, minValue, maxValue, 0, zeroX);
                    }
                    else{
                        x1 = interpolate(shape._y, minValue, maxValue, 0, Math.abs(plotWidth - zeroX));
                    }
                    key = shape._x;
                }
                else{
                    if(series.selected === false || value === 0){
                        x1 = 0;
                    }
                    else if(value < 0){
                        x1 = interpolate(value, 0, minValue, 0, zeroX);
                    }
                    else{
                        x1 = interpolate(value, 0, maxValue, 0, Math.abs(plotWidth - zeroX));
                    }
                }

                dirLeft = dirRight = x0;
                if(value >= 0){
                    startX = dirLeft;
                    dirLeft += x1;
                }
                else{
                    startX = dirRight;
                    dirRight -= x1;
                    x1 = -x1;
                }
                x1 = (x0 = startX) + (!(reversed === true) || -1) * x1;

                if(series.selected === false){
                    y0 = y1;
                    x1 = x0;
                }

                extend(shape, {
                    x0: x0,
                    y0: y0,
                    x1: x1,
                    y1: y1,
                    total: n > 1 ? total : undefined,//series not shared
                    percentage: n > 1 ? value / total * 100 : undefined,
                    size: pointSize,
                    margin: center,
                    yBottom: zeroX + plotX,
                    key: key
                });

                //stack
                for(i = 1; i < n; i++){
                    series = group[i];
                    shape = series.shapes[j];
                    value = shape.value;

                    if(yAxisOptions.type === "logarithmic"){
                        x1 = sum;
                        value = mathLog(sum += value, logBase);
                        x1 = interpolate(value, minValue, maxValue, 0, plotWidth) -
                            interpolate(mathLog(y1, logBase), minValue, maxValue, 0, plotWidth);
                    }
                    else{
                        if(isNumber(shape._x) && isNumber(shape._y)){
                            if(series.selected === false || shape._y === 0){
                                x1 = 0;
                            }
                            else if(shape._y < 0){
                                x1 = interpolate(shape._y, yAxisOptions.min, yAxisOptions.max, 0, zeroX);
                            }
                            else{
                                x1 = interpolate(shape._y, yAxisOptions.min, yAxisOptions.max, 0, Math.abs(plotWidth - zeroX));
                            }
                        }
                        else{
                            if(series.selected === false || value === 0){
                                x1 = 0;
                            }
                            else if(value < 0){
                                x1 = interpolate(value, 0, minValue, 0, zeroX);
                            }
                            else{
                                x1 = interpolate(value, 0, maxValue, 0, Math.abs(plotWidth - zeroX));
                            }
                        }
                    }
                    //pointSize = getPointSize(item[i], tickWidth, groupLength);

                    y0 = plotHeight + plotY;
                    y0 -= j * tickHeight;
                    y0 -= center;
                    y0 -= groupCounting * pointSize;
                    y0 -= pointSize;
                    y1 = y0 + pointSize;
                                    
                    x0 = zeroX + plotX;
                    
                    if(value >= 0){
                        startX = dirLeft;
                        dirLeft += x1;
                    }
                    else{
                        startX = dirRight;
                        dirRight -= x1;
                        x1 = -x1;
                    }
                    x1 = (x0 = startX) + x1;

                    if(series.selected === false){
                        y0 = y1;
                        x1 = x0;
                    }
                    //console.log(shape)
                    extend(shape, {
                        x0: x0,
                        y0: y0,
                        x1: x1,
                        y1: y1,
                        size: pointSize,
                        margin: center,
                        yBottom: zeroX + plotX,
                        total: total,
                        percentage: value / total * 100,
                        key: key,
                    });
                }
            }
        };
        var getPointSize = function(series, tickWidth, groupLength) {
            var point = pack("object", series.point, {}),
                groupPadding = pack("number", series.groupPadding, 0.5);//default center
            var size = tickWidth / groupLength;//auto
            size = (tickWidth - size * groupPadding) / groupLength;
            if(defined(point.width)){
                size = Math.max(0, pack("number",
                    point.width,
                    Numeric.percentage(tickWidth, point.width),
                    0
                ));
            }
            if(isNumber(point.maxWidth) || isNumber(series.maxPointWidth)){
                size = Math.min(size, pack("number", point.maxWidth, series.maxPointWidth));
            }
            return size;
        };
        var getKey = function(series, key, categories, j, size) {
            //var key = minTickValue + j * maxTickValue / m;
            //key = key + center / width / maxLength;
            var startIndex = pack("number", series.startIndex, 0);
            if(categories && categories.length){
                key = Math.floor(j + size + startIndex);
                if(categories[key])
                    key = categories[key];
            }
            else{
                key = Math.floor(j + size + startIndex);
            }
            return key;
        };

        var groupLength = 0,
            groupCounting = -1;

        var counter = function(data) {
            var flag = !1;
            var n = data.length,
                i = 0,
                d;
            for (; !flag && i < n; i++) {
                flag = (d = data[i]).selected !== false && d.grouping !== false;//default true
            }

            return flag;
        };

        return function(panels, modified) {
            panels.forEach(function(pane) {
                var series = pane.series;
                groupLength = 0,
                groupCounting = -1;
                var groups = partition(series, function(a, b) {
                    if(typeof a.stack === "undefined" && typeof b.stack === "undefined")
                        return false;
                    return (a.yAxis === b.yAxis) && a.stack === b.stack && a.type === b.type;
                });
                
                groups.forEach(function(group) {
                    counter(group) && groupLength++;
                });
                groupLength = Math.max(1, groupLength);
                groups.forEach(function(group) {
                    counter(group) && groupCounting++;
                    //console.log(groupCounting, groupLength, group[0].panelIndex, group)
                    group[0].type === "bar" ?
                        computeBar(group, group[0].plotWidth, group[0].plotHeight, groupCounting, groupLength)
                        : computeColumn(group, group[0].plotWidth, group[0].plotHeight, groupCounting, groupLength);
                });
            });
        };
    }

    return {
        deps: function() {
            return factoy.apply(global, [].concat([].slice.call(arguments, 0)));
        }
    };
}).call(typeof window !== "undefined" ? window : this).deps(Numeric);

    var extent = function(series) {
        var a, b;
        var n = series.length,
            i = 0;
        var l = 0,
            r = n - 1;
        a = series[i];
        b = series[n - 1];
       
        while (++i < n) {
            if (a.selected === false) a = series[++l];
            if (b.selected === false) b = series[--r];
        }
        return [a, b];
    };

    /*
     * Class Column
    */
    function Column (canvas, options) {
        this.type = "column";

        this.shapes = [];

        this.canvas = canvas;
        this.context = canvas.getContext("2d");

        this.init(options);
	}
	Column.prototype = {
        constructor: Column,
		init: function(options) {
            var panels = [],
                panel = options.panel;
            var n = panel.length, i = -1, j, nn;

            var newSeries = [],
                series;
            this.series = [];

            while (++i < n) {
                newSeries = [];
                for (j = 0, nn = panel[i].series.length; j < nn; j++) if ((series = panel[i].series[j]).type === this.type) {
                    newSeries.push(series);
                    this.series = this.series.concat(series);
                    series._diffValues = List.diff(series.shapes, series._shapes || [], function(a, b){
                        return a && b && a.value === b.value;
                    });
                }
                panels.push({
                    series: newSeries
                });
            }
            this.options = options;//update
            this.panels = panels;

            addLayout(panels);
        },
        draw: function () {
            var context = this.context,
                chart = this;
            //only render
            this.series.forEach(function(series){
                series.shapes.forEach(function(shape){
                    chart.drawShape(series.context || context, shape, series);
                    delete shape.current;
                });
            });

            this.series.forEach(function(series){
                if(series.state){
                    chart.drawState(context, series);
                }
                series.shapes.forEach(function(shape){
                    chart.dataLabels(series.context || context, shape, series);
                });
            });
        },
        redraw: function () {
            addLayout(this.panels, 1);
            this.draw();
        },
        animateTo: function(){
            var shapes = [];
            this.series.forEach(function(series){
                var newData = series.shapes,
                    oldData = series._shapes || [];
                var animators = [];
                series._diffValues.remove(function(newIndex){
                    var newShape = newData[newIndex],
                        mergeShape = {
                            /*x0: newShape.x0,
                            y0: newShape.y0,
                            x1: newShape.x1,
                            y1: newShape.y1,*/
                            color: newShape.color,
                            _value: newShape._value,
                            value: newShape.value,
                            percentage: newShape.percentage,
                            shape: newShape
                        };
                    shapes.push([newShape, function(timer){
                        mergeShape.x0 = newShape.x0;
                        mergeShape.y0 = newShape.y0;
                        mergeShape.x1 = newShape.x1;
                        mergeShape.y1 = newShape.y1;
                        if(series.type === "bar"){
                            mergeShape.x1 = newShape.x0 + (newShape.x1 - newShape.x0) * timer;
                        }
                        else{
                            mergeShape.y1 = newShape.y0 + (newShape.y1 - newShape.y0) * timer;
                        }
                    }]);
                    
                    /*if(oldShape){
                        var y0 = oldShape.y0 + (newShape.y0 - oldShape.y0) * timer;
                        var y1 = oldShape.y1 + (newShape.y1 - oldShape.y1) * timer;
                        //console.log(newShape, oldShape);
                        
                        mergeShape.y0 = y0;
                        mergeShape.y1 = y1;
                    }*/
                    return mergeShape;
                }).add(function(newIndex){
                    var oldShape = oldData[newIndex],
                        mergeShape = {
                            x0: oldShape.x0,
                            y0: oldShape.y0,
                            x1: oldShape.x1,
                            y1: oldShape.y1,
                            color: oldShape.color,
                            _value: oldShape._value,
                            value: oldShape.value,
                            percentage: oldShape.percentage,
                            shape: oldShape
                        };
                    shapes.push([oldShape, function(timer){
                        mergeShape.y1 = oldShape.y1 - (oldShape.y1 - oldShape.y0) * timer;
                        mergeShape.x1 = oldShape.x1 - (oldShape.x1 - oldShape.x0) * timer;
                    }]);
                    return mergeShape;
                }).modify(function(newIndex, oldIndex){
                    var newShape = newData[newIndex], oldShape = oldData[oldIndex],
                        mergeShape;
                    var x0, x1, y0, y1;
                    if(oldShape && newShape){
                        mergeShape = {
                            x0: oldShape.x0,
                            y0: oldShape.y0,
                            x1: oldShape.x1,
                            y1: oldShape.y1,
                            color: newShape.color,
                            _value: newShape._value,
                            value: newShape.value,
                            percentage: newShape.percentage,
                            shape: newShape
                        };
                        shapes.push([newShape, function(timer){
                            x0 = oldShape.x0 + (newShape.x0 - oldShape.x0) * timer;
                            x1 = oldShape.x1 + (newShape.x1 - oldShape.x1) * timer;
                            if(series.selected === false){
                                x0 = oldShape.x0 + (newShape.x0 - oldShape.x0) * timer;
                                x1 = oldShape.x1 + (newShape.x1 - oldShape.x1) * timer;
                                y0 = oldShape.y0;
                                y1 = oldShape.y1;
                            }
                            else{
                                x0 = oldShape.x0 + (newShape.x0 - oldShape.x0) * timer;
                                x1 = oldShape.x1 + (newShape.x1 - oldShape.x1) * timer;
                                y0 = oldShape.y0 + (newShape.y0 - oldShape.y0) * timer;
                                y1 = oldShape.y1 + (newShape.y1 - oldShape.y1) * timer;
                            }
                            //y0 = oldShape.y0 + (newShape.y0 - oldShape.y0) * timer;
                            //y1 = oldShape.y1 + (newShape.y1 - oldShape.y1) * timer;

                            mergeShape.x0 = x0;
                            mergeShape.x1 = x1;
                            mergeShape.y0 = y0;
                            mergeShape.y1 = y1;
                        }]);
                    }
                    return mergeShape;
                }).each(function(mergeShape){
                    mergeShape && animators.push(mergeShape);
                });
                series._animators = animators;
                series._shapes = series.shapes;
            });
            return shapes;
        },
        onFrame: function(context){
            var chart = this;
            this.series.forEach(function(series){
                var animators = series._animators;
                animators.forEach(function(shape){
                    chart.drawShape(context, shape, series);
                    chart.dataLabels(context, shape.shape, series);
                });
            });
        },
        drawState: function(){},
        drawShape: function (context, shape, series) {
            var x0 = shape.x0,
                y0 = shape.y0,
                x1 = shape.x1,
                y1 = shape.y1;
            var width = Math.abs(x1 - x0),
                height = Math.abs(y0 - y1);
            var borderWidth = pack("number", series.borderWidth, 0),
                borderColor = pack("string", series.borderColor, "#FFFFFF"),
                borderRadius = series.borderRadius;
            var rotation = pack("number", shape.rotation, 0);
            var color = shape.color;
            if(series.selected === false){
                borderWidth = borderRadius = 0;
            }
            if(isObject(color) && defined(color.stops) && isArray(color.stops)){
                var linearGradient = context.createLinearGradient(Math.abs(x1 - x0), y1, Math.abs(x1 - x0), y0);
                color.stops.forEach(function(item){
                    if(isNumber(item[0]) && typeof item[1] === "string")
                        linearGradient.addColorStop(item[0], item[1]);
                });
                color = linearGradient;
            }
            else{
                color = Color.parse(color);
                if(defined(shape.current)){
                    color.a = 0.55;
                }
                color = Color.rgba(color);
            }

            context.save();
            !isArray(borderRadius) && (borderRadius = isNumber(borderRadius) && borderRadius > 0
                ? [borderRadius, borderRadius, borderRadius, borderRadius]
                : [0, 0, 0, 0]);//top, right, bottom and left
            context.beginPath();
            context.moveTo(x0 + pack("number", borderRadius[0], 0), y1);//left-top
            context.lineTo(x1 - pack("number", borderRadius[1], 0), y1);//right-top
            context.bezierCurveTo(x1, y1, x1, y1, x1, y1 + pack("number", borderRadius[1], 0));//right-top corner
            context.lineTo(x1, y0);//right-bottom, height
            context.lineTo(x0, y0);//left-bottom
            context.lineTo(x0, y1 + pack("number", borderRadius[0], 0));//left-top
            context.bezierCurveTo(x0, y1, x0, y1, x0 + pack("number", borderRadius[0], 0), y1);//left-top corner

            if (defined(series.shadowColor)) {
                context.shadowColor = series.shadowColor;
                isNumber(series.shadowBlur) && (context.shadowBlur = series.shadowBlur);
                isNumber(series.shadowOffsetX) && (context.shadowOffsetX = series.shadowOffsetX);
                isNumber(series.shadowOffsetY) && (context.shadowOffsetY = series.shadowOffsetY);
            }
            context.fillStyle = color;
            context.fill();
            if(borderWidth > 0){
                context.beginPath();
                context.lineWidth = borderWidth;
                context.strokeStyle = borderColor;
                context.moveTo(x0 + borderWidth / 2, y1 - borderWidth / 2);
                context.lineTo(x1 - borderWidth / 2, y1 - borderWidth / 2);//bottom
                context.lineTo(x1 - borderWidth / 2, y0 + borderWidth / 2);//right
                context.lineTo(x0 + borderWidth / 2, y0 + borderWidth / 2);//top
                context.lineTo(x0 + borderWidth / 2, y1);//left
                context.stroke();
            }
            context.restore();
        },
        dataLabels: function(context, shape, series) {
            var isColumn = series.type === "column";
            dataLabels.align(function(type, bbox) {
                var w = bbox.width,
                    w2 = Math.abs(shape.x1 - shape.x0);
                var offset = 0;
                var t = pack("string", type, isColumn ? "center" : "right");
                if (!defined(type)) {
                    !isColumn && isNumber(shape.value) && shape.value < 0 && (offset = w);
                }
                return {
                    left: shape.x0,
                    center: shape.x0 + (w2 - w) / 2,
                    right: shape.x1 - w * (isColumn) - offset
                }[t];
            }).vertical(function (type, bbox) {
                var h = bbox.height,
                    h2 = Math.abs(shape.y1 - shape.y0);
                var offset = 0;
                var t = pack("string", type, isColumn ? "top" : "middle");
                if (!defined(type)) {
                    isColumn && isNumber(shape.value) && shape.value < 0 && (offset = h);
                }
                return {
                    top: shape[isColumn ? "y1" : "y0"] + offset,
                    middle: (shape[isColumn ? "y1" : "y0"] + h) + (h2 - h) / 2,//start + center
                    bottom: shape[isColumn ? "y0" : "y1"]
                }[t];
            }).call(shape, series, context);
        },
        getShape: function(x, y, shared) {
            var series = this.series,
                length = series.length;
            var plotY, plotHeight;

            var shapes, shape, item, area,
                first,
                last;
            var results = [], result;

            function reset(shapes){
                shapes.forEach(function(item){
                    delete item.current;
                });
            }
            var isInside = function(series){
                return !(
                    x < pack("number", series.plotX, 0) ||
                    x > series.plotWidth + pack("number", series.plotX, 0) ||
                    y < pack("number", series.plotY, 0) ||
                    y > series.plotHeight + pack("number", series.plotY, 0)
                );
            };
            item = extent(series);
            first = item[0];
            last  = item[1];

            for(var i = 0; i < length; i++){
                item = series[i];
                if(item.selected === false)
                   continue;
                plotY = item.plotY;
                plotHeight = item.plotHeight;
                
                if(!isInside(item)){
                    return results;
                }
                reset(shapes = item.shapes);

                for(var j = 0; j < shapes.length; j++){
                    shape = shapes[j] || {};
                    if(shape.value === null){
                        continue;
                    }
                    area = {
                        x: shape.x0 - shape.margin,
                        y: shape.y0,
                        width: shape.x1 + shape.margin,
                        height: shape.y1
                    };
                    if (Intersection.rect({x: x, y: y}, area)) {
                        result = {shape: shape, series: item};
                        result.shape.$value = "" + shape._value;
                        results.push(result);
                        shape.current = j;
                        if(!shared){
                            return results;
                        }
                        break;
                    }
                }
            }
            return results;
        }
    };

    var graphers = (Chart.graphers = Chart.graphers || {}),
        charts,
        type;
    for (type in (charts || (charts = {
        Column: Column,
        Bar: (function(global) {

    function factoy(Column) {

        var Bar = function(canvas, options) {
            this.type = "bar";

            this.shapes = [];
            this.canvas = canvas;
            this.context = canvas.getContext("2d");

            this.init(options);
        };
        var columnProp = Column.prototype,
            barProp = Bar.prototype;

        var methods = {
            init: columnProp.init,
            draw: columnProp.draw,
            redraw: columnProp.redraw,
            drawShape: columnProp.drawShape,
            drawState: columnProp.drawState,
            dataLabels: columnProp.dataLabels,
            onFrame: columnProp.onFrame
        };

        for (var p in methods) if (({}).hasOwnProperty.call(methods, p)) {
            (function(p) {
                barProp[p] = function() {
                    methods[p].apply(this, arguments);
                };
            })(p);
        }

        extend(Bar.prototype, barProp, {
            animateTo: function() {
                return columnProp.animateTo.apply(this, arguments);
            },
            getShape: function(x, y, shared) {
                var series = this.shapes,
                    length = series.length;
                var plotX, plotWidth;
                var shapes, shape, item, area,
                    first,
                    last;
                var ret = [];
                function reset(shapes){
                    shapes.forEach(function(item){
                        delete item.current;
                    });
                }
                item = extent(series);
                first = item[0];
                last  = item[1];

                for(var i = 0; i < length; i++){
                    item = series[i];
                    if(item.selected === false){
                        continue;
                    }
                    plotX = item.plotX;
                    plotWidth = item.plotWidth;
                    reset(shapes = item.shapes);
                    for(var j = 0; j < shapes.length; j++){
                        shape = shapes[j];
                        
                        if(!defined(shape.value)){
                            continue;
                        }
                        area = {x: shape.x0, y: shape.y0 - shape.margin, width: shape.x1, height: shape.y1 + shape.margin};
                        if(shared){
                            area.y = first.shapes[j] ? first.shapes[j].y0 - shape.margin : 0;
                            area.x = plotX;
                            area.width = plotWidth + plotX;
                            area.height = last.shapes[j] ? last.shapes[j].y1 + shape.margin : 0;
                        }
                        if(Intersection.rect({x: x, y: y}, area)){
                            ret.push({
                                shape: shape,
                                series: item
                            });
                            shape.current = j;
                            if(!shared){
                                return ret;
                            }
                            break;
                        }
                    }
                }
                return ret;
            }
        });
        return Bar;
    }

    return {
        deps: function() {
            return factoy.apply(global, [].slice.call(arguments, 0));
        }
    };
})(typeof window !== "undefined" ? window : this).deps(Column)
    }))) {
        graphers[type.toLowerCase()] = Chart[type] = charts[type];
    }

})(typeof window !== "undefined" ? window : this, Dalaba.Chart);;
    (function(global, Chart){
    var relativeLength = Numeric.percentage;

    var angle2arc = Chart.angle2arc;

    function Pie(canvas, options){
        this.type = "pie";

        this.series = [];
        this.canvas = canvas;
        this.context = canvas.getContext("2d");

        this.init(options);
    }
    Pie.prototype = {
        constructor: Pie,
        init: function(options){
            var type = this.type;
            var seriesColors;
            this.options = extend({}, options);
            seriesColors = this.options.colors || [];
            this.series = arrayFilter(this.options.series || [], function(series){
                var shapes = series.shapes || [],
                    length = shapes.length,
                    j = 0;
                var value, minValue, maxValue, sumValue;
                var filter = series.type === type;
                if(filter){
                    series._diffValues = List.diff(series.shapes, series._shapes || [], function(a, b){
                        return a && b && a.value === b.value;
                    });
                    minValue = maxValue = sumValue = 0;
                    for(; j < length; j++){
                        var shape = shapes[j];
                        value = Math.max(0, shape.value);
                        
                        !defined(shape.color) && (shape.color = seriesColors[j % seriesColors.length]);
                        if(isNumber(value) && shape.selected !== false){
                            maxValue = Math.max(maxValue, value);
                            minValue = Math.min(minValue, value);
                            sumValue += value;
                        }
                    }
                    series.maxValue = maxValue;
                    series.minValue = minValue;
                    series.sumValue = sumValue;
                }
                return filter;
            });
            var pie = new Pie.Layout(type, this.series, this.options);
            this.shapes = pie.shapes;
            this.layout = pie;
        },
        draw: function(){
            var context = this.context;
            var chart = this;

            this.shapes.forEach(function(series){
                var shapes = series.shapes;
                shapes.forEach(function(shape){
                    chart.drawShape(context, shape, series);
                });
                shapes.forEach(function(shape){
                    chart.drawLabels(context, shape, series);
                });
            });
        },
        redraw: function(){
            this.shapes = this.layout.subgroup();
            this.draw();
        },
        animateTo: function(){
            var shapes = [];
            this.shapes.forEach(function(series){
                var newData = series.shapes,
                    oldData = series._shapes || [];
                var fromAngle = pack("number", series.startAngle * PI / 180, -PI / 2),
                    startAngle,
                    endAngle;
                var animators = [];
                series._diffValues.add(function(newIndex) {
                    var oldShape = oldData[newIndex],
                        newShape = newData[newIndex] || {},
                        mergeShape;
                    
                    mergeShape = {
                        shapeArgs: extend({}, newShape.shapeArgs),
                        textArgs: extend({}, newShape.textArgs),
                        connectorPoints: newShape.connectorPoints,
                        angle: newShape.angle,
                        color: newShape.color,
                        value: newShape.value,
                        _value: newShape._value,
                        percentage: newShape.percentage
                    };
                    //startAngle => endAngle
                    shapes.push([oldShape, function(timer){
                        startAngle = oldShape.shapeArgs.startAngle;
                        endAngle = oldShape.shapeArgs.endAngle;
                        mergeShape.shapeArgs.startAngle = startAngle * (1 - timer) + (endAngle) * timer;
                        //newShape.shapeArgs.endAngle = endAngle * (1 - timer) - (endAngle - startAngle) / 2 * timer;
                        mergeShape.textArgs.x = -9999;
                        mergeShape.textArgs.y = -9999;
                    }]);
                    return mergeShape;
                }).modify(function(newIndex, oldIndex){
                    var newShape = newData[newIndex],
                        oldShape = oldData[oldIndex],
                        mergeShape;
                    //console.log(newShape.textArgs)
                    if(newShape && oldShape && (newShape.shapeArgs && oldShape.shapeArgs)){
                        /*mergeShape = extend({}, newShape, {
                            shapeArgs: {
                                startAngle: oldShape.shapeArgs.startAngle,
                                endAngle: oldShape.shapeArgs.endAngle,
                            },
                            textArgs: {
                                x: oldShape.textArgs.x,
                                y: oldShape.textArgs.y
                            }
                        });*/
                        mergeShape = {
                            shapeArgs: extend({}, newShape.shapeArgs),
                            textArgs: extend({}, newShape.textArgs),
                            connectorPoints: newShape.connectorPoints,
                            color: newShape.color,
                            value: newShape.value,
                            _value: newShape._value,
                            percentage: newShape.percentage
                        };
                        mergeShape.shapeArgs.startAngle = oldShape.shapeArgs.startAngle;
                        mergeShape.shapeArgs.endAngle = oldShape.shapeArgs.endAngle;
                        //console.log( newShape.shapeArgs)
                        shapes.push([newShape, function(timer){
                            var oldStartAngle = oldShape.shapeArgs.startAngle,
                                oldEndAngle = oldShape.shapeArgs.endAngle;
                            var newStartAngle = newShape.shapeArgs.startAngle,
                                newEndAngle = newShape.shapeArgs.endAngle;

                            mergeShape.shapeArgs.startAngle = oldStartAngle + (newStartAngle - oldStartAngle) * timer;
                            mergeShape.shapeArgs.endAngle = oldEndAngle + (newEndAngle - oldEndAngle) * timer;
                            mergeShape.textArgs.x = oldShape.textArgs.x + (newShape.textArgs.x - oldShape.textArgs.x) * timer;
                            mergeShape.textArgs.y = oldShape.textArgs.y + (newShape.textArgs.y - oldShape.textArgs.y) * timer;
                            //console.log( mergeShape.shapeArgs.startAngle,  mergeShape.shapeArgs.endAngle)
                        }]);
                    }
                    return mergeShape;
                }).remove(function(newIndex){//add
                    var newShape = newData[newIndex],
                        mergeShape;
                    mergeShape = {
                        shapeArgs: extend({}, newShape.shapeArgs),
                        textArgs: extend({}, newShape.textArgs),
                        connectorPoints: newShape.connectorPoints,
                        angle: newShape.angle,
                        color: newShape.color,
                        value: newShape.value,
                        _value: newShape._value,
                        percentage: newShape.percentage
                    };

                    shapes.push([newShape, function(timer){
                        startAngle = newShape.shapeArgs.startAngle;
                        endAngle = newShape.shapeArgs.endAngle;
                        if(oldData[newIndex - 1]){
                            mergeShape.shapeArgs.startAngle = endAngle + (startAngle - endAngle) * timer;
                            mergeShape.textArgs.x = newShape.textArgs.x;
                            mergeShape.textArgs.y = newShape.textArgs.y;
                        }
                        else{
                            mergeShape.shapeArgs.startAngle = fromAngle + (startAngle - fromAngle) * timer;
                            mergeShape.shapeArgs.endAngle = fromAngle + (endAngle - fromAngle) * timer;
                        }
                    }]);
                    return mergeShape;
                }).each(function(mergeShape){
                    mergeShape && animators.push(mergeShape);
                });
                series._animators = animators;
                series._shapes = series.shapes;
            });
            return shapes;
        },
        onFrame: function(context){
            var chart = this;
            this.shapes.forEach(function(series){
                var animators = series._animators;
                animators.forEach(function(shape){
                    chart.drawShape(context, shape, series);
                    chart.drawLabels(context, shape, series);
                });
            });
        },
        drawState: function(context, shape, series){
            var shapeArgs = shape.shapeArgs,
                x = shapeArgs.x,
                y = shapeArgs.y,
                radius = shapeArgs.radius,
                startAngle = shapeArgs.startAngle,
                endAngle = shapeArgs.endAngle;
            var color = pack("string", shape.color, series.color, "#000");
            context.save();
            context.beginPath();
            angle2arc(
                x,
                y,
                radius + (radius * 0.05),
                radius,
                startAngle,
                endAngle,
                false//close path
            )(context);
            context.fillStyle = Color.parse(color).alpha(0.2).rgba();
            context.fill();
            context.restore();
        },
        drawShape: function(context, shape, series){
            var color = pack("string", shape.color, series.color, "#000");
            var borderWidth = pack("number", series.borderWidth, 0),
                borderColor = pack("string", series.borderColor, "#FFFFFF");

            var shapeArgs = shape.shapeArgs,
                x = shapeArgs.x,
                y = shapeArgs.y,
                startAngle = shapeArgs.startAngle,
                endAngle = shapeArgs.endAngle,
                middleAngle;
            
            //color = Color.parse(color);
            if(defined(shape.current)){
                color = Color.parse(color).alpha(0.7);
                color.r = Math.min(0xff, color.r + 20);
                color.g = Math.min(0xff, color.g + 20);
                color.b = Math.min(0xff, color.b + 20);
                color = Color.rgba(color);
            }

            if(shape.sliced === true){
                middleAngle = (startAngle + endAngle) / 2;
                x += Math.cos(middleAngle) * 10;
                y += Math.sin(middleAngle) * 10;
            }
            
            context.save();
            context.fillStyle = color;
            angle2arc(
                x,
                y,
                shapeArgs.radius,
                shapeArgs.innerRadius,
                startAngle,
                endAngle,
                false//close path
            )(context);
            series.nofill !== true && context.fill();            
            (context.lineWidth = pack("number", borderWidth)) > 0 && (context.strokeStyle = borderColor, context.stroke());
            if(defined(shape.state)){
                this.drawState(context, shape, series);
            }
            context.restore();
        },
        drawLabels: function(context, shape, series){
            var shapeLabels = shape.dataLabels || {},
                dataLabels = pack("object", shape.dataLabels, series.dataLabels, {}),
                enabled = shapeLabels.enabled || dataLabels.enabled,
                style = shapeLabels.style || series.dataLabels.style || {},
                fontStyle = {
                    fontStyle: pack("string", style.fontStyle, "normal"),
                    fontSize: pack("string", style.fontSize, "12px"),
                    fontWeight: pack("string", style.fontWeight, "normal"),
                    fontFamily: pack("string", style.fontFamily, "Arial"),
                    lineHeight: pack("string", style.lineHeight, "normal")
                },
                isInside = !!shapeLabels.inside || !!dataLabels.inside || series.shapes.length === 1;

            var textArgs = shape.textArgs,
                connectorPoints = shape.connectorPoints,
                formatText;
            var fillText = function(item, x, y, reversed){
                var value = item._value,
                    formatter = dataLabels.formatter;
                function setVertical(y, h){
                    return {
                        top: y - h,
                        bottom: y + h,
                        middle: y + h / 2
                    };
                }
                function setAlign(x, w){
                    return {
                        left: x - w * !reversed,
                        right: x - w * reversed,
                        center: x - w / 2 * !reversed,
                    };
                }
                if(isFunction(formatter)){
                    value = formatter.call({
                        name: item.name,
                        value: value,
                        total: item.total,
                        percentage: item.percentage,
                        point: item,
                        series: item.series,
                        color: item.color
                    }, item);
                }
                if(defined(value)){
                    var tag = Text.HTML(Text.parseHTML(value), context, fontStyle);
                    var bbox = tag.getBBox();
                    var w = bbox.width,
                        h = bbox.height;
                    if(isInside){
                        x = x - w * reversed;
                        y += h / 2;
                    }
                    else{
                        x = pack("number",
                            setAlign(x, w)[pack("string", dataLabels.align, "right")],
                            x
                        );

                        y = pack("number",
                            setVertical(y, h)[pack("string", dataLabels.verticalAlign, "middle")],
                            y - h / 2
                        );
                    }

                    context.save();
                    context.fillStyle = style.color;
                    context.font = [
                        fontStyle.fontStyle,
                        fontStyle.fontWeight,
                        fontStyle.fontSize,
                        fontStyle.fontFamily
                    ].join(" ");
                    context.translate(x, y);
                    tag.toCanvas(context);
                    context.restore();
                }
                return value;
            };
            if(shape.value !== null && shape.selected !== false && enabled === true){
                if(series.shapes.length === 1 && !shape.shapeArgs.innerRadius && isInside){
                    context.save();
                    context.textAlign = "center";
                    fillText(shape, textArgs.x, textArgs.y, false);
                    context.restore();
                }
                else if(isInside){
                    context.save();
                    context.textAlign = "center";// reversed ? "left" : "right";
                    fillText(shape, textArgs.x, textArgs.y, false);
                    context.restore();
                }
                else{
                    if(shape.visibility !== true){
                        formatText = fillText(shape, textArgs.x, textArgs.y, textArgs["text-anchor"] === "end");
                        if(defined(formatText) && dataLabels.distance > 0 && dataLabels.connectorWidth > 0){
                            context.save();
                            context.strokeStyle = shape.color;
                            context.lineWidth = dataLabels.connectorWidth;
                            context.beginPath();
                            (connectorPoints || []).forEach(function(point, i){
                                context[i ? "lineTo" : "moveTo"](point.x, point.y);
                            });
                            context.stroke();
                            context.restore();
                        }
                    }
                }
            }
        },
        setSliced: function(shapes){
            shapes.forEach(function(item){
                var currentShape = item.shape,
                    series = item.series;
                series.shapes.forEach(function(shape){
                    shape !== currentShape && (delete shape.sliced);
                });
                currentShape.sliced = !currentShape.sliced;
            });
        },
        getShape: function(x, y){
            var series = this.shapes,
                length = series.length,
                index = -1;
            var context = this.context;
            var shapes, shape, item;
            var ret = [];
            function remove(item){
                delete item.current;
            }
            function reset(shapes){
                shapes.forEach(function(item){
                    remove(item);
                });
            }

            x *= DEVICE_PIXEL_RATIO;
            y *= DEVICE_PIXEL_RATIO;

            for(var i = 0; i < length; i++){
                item = series[i];
                reset(shapes = item.shapes);
                index = -1;
                for(var j = 0; j < shapes.length; j++){
                    shape = shapes[j];
                    this.drawShape(context, shape, {nofill: true});
                    if(context.isPointInPath(x, y)){
                        shape.$value = "" + shape._value;
                        ret.push({shape: shape, series: item});
                        index = j;
                        break;
                    }
                }
                if(index !== -1){
                    shapes[index].current = index;
                }
                else{
                    reset(shapes);//no selected
                }
            }
            //console.log(ret);
            return ret;
        }
    };
    Pie.Layout = function(type, series, options){
        this.type = type;
        this.options = options;
        this.series = series.slice(0);

        this.init();
    };
    Pie.Layout.prototype = {
        init: function(){
            this.shapes = this.subgroup();
        },
        subgroup: function(){
            var options = this.options,
                type = this.type,
                minRadius = 10;
            var layout = this;
            var shapes = [];
            options.panel.forEach(function(pane){
                var series = arrayFilter(pane.series, function(series){
                    return series.type === type;
                });
                series.forEach(function(series){
                    var plotX = pack("number", series.plotX, 0),
                        plotY = pack("number", series.plotY, 0),
                        plotWidth = pack("number", series.plotWidth, 0),
                        plotHeight = pack("number", series.plotHeight, 0);

                    var total = series.sumValue,
                        maxValue = series.maxValue;
                    var dataLabels = series.dataLabels || {},
                        distance = pack("number", dataLabels.distance, 0),
                        fontStyle = pack("object", dataLabels.style, {}),
                        fontSize = pack("number", parseInt(fontStyle.fontSize, 10), 12);
                    var roseType = series.roseType;

                    var startAngle = -90,//default -Math.PI/2
                        endAngle = 360 - 90,//Math.PI*2
                        diffAngle = endAngle - startAngle;
                    if(defined(series.startAngle)){
                        startAngle = series.startAngle;
                        endAngle = startAngle + endAngle + 90;
                    }
                    if(defined(series.endAngle)){
                        endAngle = series.endAngle;
                    }
                    /*data.sort(function(a, b){
                        return b.value - a.value;
                    });*/
                    if(!total){
                        total = 1;//all is 0
                    }
                    var radius = 0,
                        innerSize = 0,
                        center = defined(series.center) ? series.center : [plotWidth / 2, plotHeight / 2];
                    var cx = pack("number", relativeLength(plotWidth, center[0]), center[0], plotWidth / 2),
                        cy = pack("number", relativeLength(plotHeight, center[1]), center[1], plotHeight / 2);
                    cx += plotX;
                    cy += plotY;
                    //var connectorOffset = (dataLabels.distance) * 2 + fontSize;
                    if(dataLabels.enabled === false || dataLabels.inside === true){
                        //connectorOffset = 0;
                    }
                    if(distance > 0 && dataLabels.inside !== true){
                        plotHeight -= distance * 2;
                        plotHeight -= fontSize;
                    }
                    //
                    //plotWidth -= bbox.width * 2 - distance * 2 + dataLabels.connectorPadding * 2;
                    radius = Math.min(plotWidth / 2, plotHeight / 2);
                    if(defined(series.size)){
                        radius = Math.max(pack("number", series.size, relativeLength(radius, series.size), minRadius), minRadius);
                    }
                    
                    if(defined(series.innerSize)){
                        innerSize = pack("number", series.innerSize, relativeLength(radius, series.innerSize));
                        innerSize = Math.min(innerSize, radius - 1);
                    }

                    startAngle = Math.PI / 180 * (startAngle);
                    endAngle = Math.PI / 180 * ((endAngle || startAngle + 360 - 90));
                    diffAngle = endAngle - startAngle;
                    //calculator value

                    var nextvalue = 0;
                    for(var j = 0, jj = series.shapes.length; j < jj; j++){
                        var shape = series.shapes[j],
                            value = shape.value,
                            percentage = value / total,
                            start,
                            end;
                        var radii = radius;
                        var isRoseArea = roseType === "area";
                        
                        if(value === null || shape.selected === false || value < 0){
                            value = percentage = 0;
                        }
                        if(roseType === true || roseType === "radius" || isRoseArea){
                            radii = interpolate(value, 0, maxValue, innerSize, radius);
                            isRoseArea && (percentage = 1 / jj);
                        }
                        
                        angle = (end + start) / 2;
                        //only one data
                        //if(percentage === 1 || percentage === 0){}
                        start = startAngle + nextvalue * diffAngle;
                        nextvalue += percentage;
                        end = startAngle + nextvalue * diffAngle;

                        var angle = (start + end) / 2,
                            half;
                        if(angle > PI * 1.5)
                            angle -= PI2;
                        else if(angle < -PI / 2)
                            angle += PI2;
                        half = angle < -PI / 2 || angle > PI / 2 ? 1 : 0;
                        extend(shape, {
                            shapeArgs: {
                                x: cx,
                                y: cy,
                                radius: radii,
                                innerRadius: innerSize,
                                startAngle: start,
                                endAngle: end
                            },
                            textArgs: {
                                x: NaN,
                                y: NaN
                            },
                            transX: 0,
                            transY: 0,//sliced pull
                            center: center,
                            percentage: percentage * 100,
                            total: total,
                            angle: angle,
                            half: half,
                            radius: radius
                        });

                    }
                    //dataLabels
                    series.shapes.length && layout.labels(series.shapes, series);
                    shapes.push(series);
                });
            });
            return shapes;
        },
        labels: function(shapes, series){
            var sortByValue = function(a, b){
                return a.point.value - b.point.value;
            };
            var sortByAngle = function(a, b){
                return a.angle - b.angle;
            };
            var angleToQuadrant = function(angle){
                angle = angle % (PI2);
                0 > angle && (angle = PI2 + angle);
                return 0 <= angle && angle < Math.PI / 2 ? 1 : angle < Math.PI ? 2 : angle < Math.PI * 1.5 ? 3 : 0;
            };
            var dataLabels = series.dataLabels || {},
                style = dataLabels.style || {},
                distance = pack("number", dataLabels.distance, 0),
                lineHeight = pack("number", Math.ceil(parseFloat(style.lineHeight), 10), 12),
                isInside = !!dataLabels.inside || shapes.length === 1,
                skipOverlapLabels = !!dataLabels.skipOverlapLabels,
                manageLabelOverflow = !!dataLabels.manageLabelOverflow,
                isSmartLineSlanted = !!dataLabels.isSmartLineSlanted;

            var positions = [
                shapes[0].shapeArgs.x,//x 
                shapes[0].shapeArgs.y,//y
                shapes[0].radius,//size
                shapes[0].shapeArgs.innerRadius || 0//innerSize
            ];
            var centerX = positions[0],
                centerY = positions[1],//L=x
                radius = positions[2],
                innerRadius = positions[3];
            var labelsRadius = series.labelsRadius || (radius + distance / 2);
            var labelsMaxInQuadrant = series.labelsMaxInQuadrant || Math.floor(labelsRadius / parseInt(style.fontSize, 10));
            var fontSize = parseInt(style.fontSize, 10);

            var connectorPadding = pack("number", dataLabels.connectorPadding, 15),
                connectorPaddings = [connectorPadding, connectorPadding, -connectorPadding, -connectorPadding];

            var fourQuadrants = [[], [], [], []];

            //if(dataLabels.enabled !== true)
            //    return;
            
            //one data and inside
            if(shapes.length === 1 && !innerRadius && isInside){
                //shape.slicedTranslation = [z, C];//canvasLeft, canvasTop
                shapes[0].textArgs = {
                    x: centerX,
                    y: centerY,
                    "text-anchor": "center"
                };
            }
            //inside
            else if(isInside){
                shapes.forEach(function(shape){
                    if(shape.value !== null && dataLabels.enabled === true || isObject(shape.dataLabels) && shape.dataLabels.enabled === true){
                        //var halfRadius = innerRadius;// + (radius - innerRadius) / 1.5;//radius center
                        //var quadrants = angleToQuadrant(shape.angle);
                        var isLabelInside = true;//inner
                        var middleAngle = (shape.shapeArgs.startAngle + shape.shapeArgs.endAngle) / 2;
                        var radius = shape.shapeArgs.radius;
                        var dx = Math.cos(middleAngle),
                            dy = Math.sin(middleAngle),
                            x1 = (isLabelInside ? (radius + innerRadius) / 2 * dx : radius * dx) + centerX,
                            y1 = (isLabelInside ? (radius + innerRadius) / 2 * dy : radius * dy) + centerY;

                        var textX = x1 + dx * 4,
                            textY = y1 + dy * 4;
                        //var reversed = quadrants >= 2;

                        if(shape.sliced){
                            //var slicedTranslation = shape.slicedTranslation;
                            //x += ma[0] - positions[0];//canvasLeft;
                            //y += ma[1] - positions[1];
                        }
                        shape.textArgs = {
                            x: textX,
                            y: textY,
                            "text-anchor": "center"
                        };
                    }
                });
            }
            else{
                var point;
                var maxAngle, midAngle, currentAngle;
                var quadrants;
                
                shapes.forEach(function(shape){
                    if(dataLabels.enabled === true || isObject(shape.dataLabels) && shape.dataLabels.enabled === true){
                        var angle = shape.angle % (Math.PI * 2);
                            0 > angle && (angle = Math.PI * 2 + angle);
                        var ga = 0 <= angle && angle < Math.PI / 2 ? 1 : angle < Math.PI ? 2 : angle < Math.PI * 1.5 ? 3 : 0;
                        fourQuadrants[ga].push({
                            point: shape,
                            angle: angle
                        });
                    }
                });
                for(var k = 4; k--; ){
                    var v;
                    if(skipOverlapLabels && (v = fourQuadrants[k].length - labelsMaxInQuadrant, 0 < v)){
                        fourQuadrants[k].sort(sortByValue);
                        quadrants = fourQuadrants[k].splice(0, v);
                        for(v = 0; v < quadrants.length; v++){
                            point = quadrants[v].point;
                            point.visibility = true;
                        }
                    }
                    fourQuadrants[k].sort(sortByAngle);
                }
                var maxInQuadrant = Math.max(
                    Math.min(
                        Math.max(fourQuadrants[0].length, fourQuadrants[1].length, fourQuadrants[2].length, fourQuadrants[3].length),
                        labelsMaxInQuadrant
                    ) * fontSize,
                    labelsRadius + fontSize
                );
                var quadrantsTop = fourQuadrants[0].concat(fourQuadrants[1]);
                var quadrantsBottom = fourQuadrants[2].concat(fourQuadrants[3]);
                maxAngle = Number.POSITIVE_INFINITY;
                for(k = quadrantsTop.length - 1; 0 <= k; k--){
                    point = quadrantsTop[k].point;
                    delete point.clearance;
                    delete point.clearanceShift;
                    currentAngle = Math.abs(maxInQuadrant * Math.sin(point.angle));
                    if(Math.abs(maxAngle - currentAngle) < 2 * lineHeight){
                        point.clearance = 0;
                        quadrantsTop[k + 1].point.clearanceShift = lineHeight / 2;
                    }
                    maxAngle = currentAngle;
                }
                maxAngle = Number.POSITIVE_INFINITY;
                for(k = 0; k < quadrantsBottom.length; k++){
                    point = quadrantsBottom[k].point;
                    delete point.clearance;
                    delete point.clearanceShift;
                    currentAngle = Math.abs(maxInQuadrant * Math.sin(point.angle));
                    if(Math.abs(maxAngle - currentAngle) < 2 * lineHeight){
                        point.clearance = 0;
                        quadrantsBottom[k - 1].point.clearanceShift = lineHeight / 2;
                    }
                    maxAngle = currentAngle;
                }

                fourQuadrants[1].reverse();
                fourQuadrants[3].reverse();

                for(var g = 4; g--; ){
                    quadrants = fourQuadrants[g];
                    var labelQuadrant = quadrants.length;
                    var angle;

                    skipOverlapLabels || (fontSize = labelQuadrant > labelsMaxInQuadrant ? maxInQuadrant / labelQuadrant : parseInt(style.fontSize, 10), fontSize / 2);
                    currentAngle = labelQuadrant * fontSize;
                    maxAngle = maxInQuadrant;
                    for(k = 0; k < labelQuadrant; k += 1, currentAngle -= fontSize){
                        angle = Math.abs(maxInQuadrant * Math.sin(quadrants[k].angle));
                        maxAngle < angle ? (angle = maxAngle) : angle < currentAngle && (angle = currentAngle);
                        maxAngle = (quadrants[k].oriY = angle) - fontSize;
                    }
                    var textAnchor = ["start", "start", "end", "end"][g];
                    labelQuadrant = maxInQuadrant - (labelQuadrant - 1) * fontSize;
                    maxAngle = 0;
                    for(k = quadrants.length - 1; 0 <= k; --k, labelQuadrant += fontSize){
                        var shape = quadrants[k];
                        point = quadrants[k].point;
                        if(isObject(shape.dataLabels))
                            dataLabels = shape.dataLabels;
                        
                        angle = Math.abs(maxInQuadrant * Math.sin(shape.angle)),
                        angle < maxAngle ? (angle = maxAngle) : angle > labelQuadrant && (angle = labelQuadrant);

                        maxAngle = angle + fontSize;
                        var borderWidth = void 0 === point.clearance ?
                            Math.ceil(pack("number", parseFloat(series.borderWidth, 10), 12)) * 2
                            : Math.ceil(pack("number", parseFloat(series.borderWidth, 10), point.clearance, 0)) * 2;
                        
                        var toY = (angle + quadrants[k].oriY) / 2;
                        centerX = point.shapeArgs.x;
                        centerY = point.shapeArgs.y;
                        radius = point.shapeArgs.radius;
                        //console.log(point.shapeArgs.x, centerX)
                        angle = centerX + ([1, 1, -1, -1][g]) * labelsRadius * Math.cos(Math.asin(Math.max(-1, Math.min(toY / maxInQuadrant, 1))));
                        toY *= [-1, 1, 1, -1][g];//d
                        toY += centerY;
                        var x = centerX + radius * Math.cos(shape.angle),
                            y = centerY + radius * Math.sin(shape.angle),
                            dx = Math.cos(midAngle = (point.shapeArgs.startAngle + point.shapeArgs.endAngle) / 2),
                            dy = Math.sin(midAngle);
                        
                        (2 > g && angle < x || 1 < g && angle > x) && (angle = x);
                        var toX = angle + connectorPaddings[g];
                        //var textX = toX + connectorPaddings[g];
                        if(manageLabelOverflow){
                            var textHeight = lineHeight + borderWidth;
                            void 0 === point.clearance && textHeight > fontSize && (toY += fontSize);
                        }
                        if(point.sliced){
                            var fa = point.transX;
                            var ka = point.transY;
                            toX += fa;
                            angle += fa;
                            x += fa;
                            y += ka;
                            //textX += fa;
                        }
                        var r = connectorPadding + point.radius - radius,
                            x1 = x + dx * r,
                            x2 = toX + (dx >= 0 || -1) * (distance);// + (dx >= 0 || -1) * distance;
                            //y1 = y + dy * r,
                            //y2 = y1;
                        // point.connectorPoints = [
                        //     {x: x, y: y},
                        //     {x: !isSmartLineSlanted ? angle : x, y: toY},
                        //     {x: toX, y: toY}
                        // ];
                        point.connectorPoints = [
                            {x: x, y: y}, {x: x1, y: toY}, {x: x2, y: toY}
                        ];
                        point.textArgs = {
                            x: toX + (dx >= 0 || -1) * (3 + distance),
                            y: toY,
                            "text-anchor": textAnchor
                        };
                    }
                }
            }
        }
    };

    (Chart.graphers = Chart.graphers || {}).pie = Chart.Pie = Pie;
    
})(typeof window !== "undefined" ? window : this, Dalaba.Chart);;
    (function(global, Chart){
    var relayout = (function(global) {

    function factoy(Numeric) {
        var interpolate = Numeric.interpolate;

        return function(type, options) {
            options.panel.forEach(function(pane) {
                var series = arrayFilter(pane.series, function(series) {
                    return series.type === type;
                });

                series.forEach(function(series){
                    var plotX = pack("number", series.plotX, 0),
                        plotY = pack("number", series.plotY, 0),
                        plotWidth = pack("number", series.plotWidth, 0),
                        plotHeight = pack("number", series.plotHeight, 0);

                    var xAxisOptions, yAxisOptions;
                    var minValue, maxValue, logBase;
                    var reversed;

                    var pointWidth;

                    var shapes = series.shapes,
                        length = shapes.length;
                    var j = 0;
                    for(j = 0; j < length; j++){
                        var shape = series.shapes[j],
                            value = shape.value;
                        var x, y;
                        var radius = pack("number",
                            shape.radius,
                            series.radius,
                            isFunction(series.radius) && series.radius.call(shape, shape.source, value),
                            5
                        );

                        xAxisOptions = series._xAxis || {};// xAxis[series.xAxis | 0];
                        yAxisOptions = series._yAxis || {};// yAxis[series.yAxis | 0];
                        logBase = pack("number", pack("object", yAxisOptions.logarithmic, {}).base, 10),
                        maxValue = pack("number", series.max, yAxisOptions.maxValue);
                        minValue = pack("number", series.min, yAxisOptions.minValue);

                        reversed = yAxisOptions.reversed;

                        pointWidth = plotWidth / (Math.max(1, length - 1));

                        if(isArray(shape.source) && shape.source.length > 1){
                            x = isNumber(shape.source[0]) ? interpolate.apply(null, [shape.source[0], xAxisOptions.minValue, xAxisOptions.maxValue, 0, plotWidth]) : NaN;
                            x += plotX;
                            y = isNumber(shape.source[1]) ? interpolate.apply(null, [shape.source[1], minValue, maxValue].concat(
                                reversed === true ? [0, plotHeight] : [plotHeight, 0]
                            )) : NaN;
                            y += plotY;
                        }
                        else if(isNumber(shape._x) && isNumber(shape._y)){
                            x = interpolate.apply(null, [shape._x, xAxisOptions.minValue, xAxisOptions.maxValue, 0, plotWidth]);
                            x += plotX;
                            y = interpolate.apply(null, [shape._y, minValue, maxValue].concat(
                                reversed === true ? [0, plotHeight] : [plotHeight, 0]
                            ));
                            y += plotY;
                        }
                        else{
                            x = j * pointWidth;
                            x += plotX;
                            y = interpolate.apply(null, [value, minValue, maxValue].concat(
                                reversed === true ? [0, plotHeight] : [plotHeight, 0]
                            ));
                            y += plotY;
                        }
                        if(series.selected === false){
                            radius = 0;
                        }
                        shape.radius = radius;

                        extend(shape, {
                            cx: x,
                            cy: y,
                            radius: radius
                        });
                    }
                });
            });
        };
    }
    return {
        deps: function() {
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
}).call(typeof window !== "undefined" ? window : this).deps(Numeric);
    /*
     * Class Scatter
    */
    function Scatter(canvas, options){
        this.type = "scatter";

        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        
        this.init(options);
    }
    Scatter.prototype = {
        constructor: Scatter,
        init: function(options){
            var type = this.type;
            this.options = extend({}, options);

            this.series = arrayFilter(options.series, function(series){
                var filter = series.type === type;
                if(filter){
                    series._diffValues = List.diff(series.shapes, series._shapes || [],  function(a, b){
                        return a && b && a.value === b.value;
                    });
                }
                return filter;
            });
            relayout(type, this.options);
        },
        draw: function(){
            var context = this.context,
                chart = this;
            this.series.forEach(function(series){
                series.shapes.forEach(function(shape){
                    chart.drawShape(context, shape, series);
                });
                series.shapes.forEach(function(shape){
                    if(isNumber(shape.current) && shape.current > -1){
                        chart.drawShape(context, shape, series);
                    }
                    chart.drawLabels(context, shape, series);
                });
            });
        },
        redraw: function(){
            relayout(this.type, this.options);
            this.draw();
        },
        getShape: function(x, y){
            var series,
                shape,
                sl = this.series.length,
                dl,
                i,
                j;
            var results = [],
                shapes;

            var isInside = function(series){
                return !(
                    x < pack("number", series.plotX, 0) ||
                    x > series.plotWidth + pack("number", series.plotX, 0) ||
                    y < pack("number", series.plotY, 0) ||
                    y > series.plotHeight + pack("number", series.plotY, 0)
                );
            };
            var resetShape = function(shapes){
                for(var j = 0, l = shapes.length; j < l;  j++){
                    delete shapes[j].current;
                }
            };

            for(i = 0; i < sl; i++){
                shapes = (series = this.series[i]).shapes;
                resetShape(shapes);
                if(!isInside(series)){
                    return results;
                }
                for(j = 0, dl = shapes.length; j < dl; j++){
                    shape = shapes[j];
                    if(series.selected === false){
                        continue;
                    }
                    if(Intersection.line(
                        {x: x, y: y},
                        {x: shape.cx, y: shape.cy, width: shape.radius}
                    )){
                        shape.current = j;
                        results.push({shape: shape, series: series});
                        break;
                    }
                }
            }
            return results;
        },
        drawShape: function(context, shape, series){
            var borderWidth = pack("number", series.borderWidth, 0),
                borderColor = series.borderColor,
                fillColor = shape.color || series.color,
                radius = shape.radius,
                opacity = Numeric.clamp(pack("number", shape.opacity, series.opacity, 1), 0, 1),
                shadowBlur = pack("number", shape.shadowBlur, series.shadowBlur, 0),
                shadowOffsetX = pack("number", shape.shadowOffsetX, series.shadowOffsetX, 0),
                shadowOffsetY = pack("number", shape.shadowOffsetY, series.shadowOffsetY, 0),
                shadowColor = shape.shadowColor || series.shadowColor;
            var cx = shape.cx, cy = shape.cy;
            var color = fillColor;

            if(defined(fillColor.radialGradient)){
                color = Color.parse(fillColor);
                fillColor = color.radial(cx, cy, radius);
                color = color.color;
            }
            if(opacity < 1){
                color = fillColor = Color.parse(fillColor).alpha(opacity).rgba();
            }
            
            if(isNumber(shape.current) && shape.current > -1){
                var cr = radius + 3;
                context.save();
                context.fillStyle = Color.parse(color).alpha(0.25).rgba();
                context.beginPath();
                context.arc(cx, cy, cr, 0, PI * 2, true);
                context.fill();
                context.restore();
            }
            
            context.save();
            context.fillStyle = fillColor;
            context.beginPath();
            radius > 0 && context.arc(cx, cy, radius, 0, PI2, true);
            borderWidth > 0 && (context.lineWidth = borderWidth, context.strokeStyle = borderColor, context.stroke());
            if(shadowBlur > 0){
                context.shadowColor = shadowColor;
                context.shadowBlur = shadowBlur;
                context.shadowOffsetX = shadowOffsetX;
                context.shadowOffsetY = shadowOffsetY;
            }
            context.fill();
            context.restore();
        },
        drawLabels: function(context, shape, series){
            var dataLabels = series.dataLabels || {},
                shapeLabels = shape.dataLabels || {},
                style = shapeLabels.style || dataLabels.style || {},
                align = shapeLabels.align || dataLabels.align,
                verticalAlign = shapeLabels.verticalAlign || dataLabels.verticalAlign,
                formatter = shapeLabels.formatter || dataLabels.formatter;
            function setVertical(y, bbox){
                return {
                    top: y,
                    middle: y + radius,
                    bottom: y + bbox.height * 2 + radius
                };
            }
            function setAlign(x, bbox){
                return {
                    left: x - bbox.width,
                    center: x - bbox.width / 2,
                    right: x
                };
            }
            var enabled = shapeLabels.enabled || dataLabels.enabled,
                name = pack("string", "" + shape._value, shape.name, ""),
                radius = shape.radius,
                bbox,
                x, y;
            if(series.selected !== false && enabled === true && shape.value !== null){
                if(isFunction(formatter)){
                    name = formatter.call({
                        x: shape.key,
                        key: shape.key,
                        name: name,
                        color: shape.color,
                        series: shape.series,
                        point: shape
                    }, name);
                }
                if(defined(name)){
                    var tag = Text.HTML(Text.parseHTML(name), context, {
                        fontFamily: style.fontFamily,
                        fontSize: style.fontSize,
                        fontWeight: style.fontWeight
                    });
                    bbox = tag.getBBox();
                    x = pack("number",
                        setAlign(shape.cx, bbox)[pack("string", align, "center")],
                        shape.cx
                    ) + pack("number", shapeLabels.x, dataLabels.x, 0);
                    y = pack("number",
                        setVertical(shape.cy, bbox)[pack("string", verticalAlign, "top")],
                        shape.cy - radius
                    ) + pack("number", shapeLabels.y, dataLabels.y, 0);

                    context.save();
                    context.fillStyle = style.color;
                    context.translate(x, y - bbox.height);
                    tag.toCanvas(context);
                    context.restore();
                }
            }
        },
        animateTo: function(context, initialize){
            var shapes = [];
            this.series.forEach(function(series){
                var newData = series.shapes,
                    oldData = series._shapes || [];
                var animators = [];
                if(initialize === true){
                    newData.forEach(function(shape){
                        var mergeShape = {
                            cx: shape.cx,
                            cy: shape.cy,
                            color: shape.color,
                            shape: shape
                        };
                        shapes.push([shape, function(timer){
                            mergeShape.radius = shape.radius * timer;
                        }]);
                        animators.push(mergeShape);
                    });
                }
                else{
                    series._diffValues.remove(function(newIndex){
                        var newShape = newData[newIndex],
                            mergeShape;

                        mergeShape = {
                            cx: newShape.cx,
                            cy: newShape.cy,
                            value: newShape.radius,
                            shape: newShape
                        };
                        shapes.push([newShape, function(timer){
                            mergeShape.radius = newShape.radius * timer;
                        }]);
                        animators.push(mergeShape);
                    }).add(function(newIndex){
                        var oldShape = oldData[newIndex],
                            mergeShape;
                        mergeShape = {
                            cx: oldShape.cx,
                            cy: oldShape.cy,
                            color: oldShape.color,
                            value: oldShape.value,
                            shape: oldShape
                        };
                        shapes.push([oldShape, function(timer){
                            mergeShape.radius = oldShape.radius - oldShape.radius * timer;
                        }]);
                        animators.push(mergeShape);
                    }).modify(function(newIndex, oldIndex){
                        var newShape = newData[newIndex],
                            oldShape = oldData[oldIndex],
                            mergeShape;
                        if(oldShape && newShape){
                            mergeShape = {
                                color: newShape.color,
                                value: newShape.value,
                                shape: newShape
                            };
                            shapes.push([newShape, function(timer){
                                mergeShape.cx = oldShape.cx + (newShape.cx - oldShape.cx) * timer;
                                mergeShape.cy = oldShape.cy + (newShape.cy - oldShape.cy) * timer;
                                mergeShape.radius = oldShape.radius + (newShape.radius - oldShape.radius) * timer;
                            }]);
                            animators.push(mergeShape);
                        }
                    }).each();
                }
                series._shapes = series.shapes;
                series._animators = animators;
            });
            return shapes;
        },
        onFrame: function(context){
            var chart = this;
            this.series.forEach(function(series){
                var animators = series._animators;
                animators.forEach(function(shape){
                    chart.drawShape(context, shape, series);
                    chart.drawLabels(context, shape.shape, series);
                });
            });
        }
    };

    (Chart.graphers = Chart.graphers || {}).scatter = Chart.Scatter = Scatter;

})(typeof window !== "undefined" ? window : this, Dalaba.Chart);;
    (function(global, Chart){

    var SQRT3 = Math.sqrt(3);

    var lineSlope = function(p1, p2){
        var slope = p2.x - p1.x ? (p2.y - p1.y) / (p2.x - p1.x) : 0;//斜率
        return {
            slope: slope,
            b: p1.y - slope * p1.x
        };
    };

    /**
     * Class Funnel
    */

    function Funnel(canvas, options){
        this.type = "funnel";
        this.canvas = canvas;
        this.context = canvas.getContext("2d");

        this.series = [];
        this.shapes = [];
        
        this.init(options);
    }
    Funnel.prototype = {
        constructor: Funnel,
        init: function(options){
            var type = this.type;
            var seriesColors;
            this.options = extend({}, options);
            seriesColors = this.options.colors || [];
            this.series = arrayFilter(this.options.series || [], function(series){
                var shapes = series.shapes || [],
                    length = shapes.length,
                    j = 0;
                var minValue, maxValue, sumValue;
                var filter = series.type === type;
                if(filter){
                    series._diffValues = List.diff(series.shapes, series._shapes || [], function(a, b){
                        return a && b && a.value === b.value;
                    });
                    minValue = maxValue = sumValue = 0;
                    for(; j < length; j++){
                        var shape = shapes[j],
                            value;
                        !isNumber(value = shape.value) && (shape.value = null);
                        !defined(shape.name) && (shape.name = shape.value);
                        !defined(shape.color) && (shape.color = seriesColors[j % seriesColors.length]);
                        if(shape.value !== null && shape.selected !== false){
                            maxValue = Math.max(maxValue, value = Math.max(0, value));
                            minValue = Math.min(minValue, value);
                            sumValue += value;
                        }
                    }
                    series.maxValue = maxValue;
                    series.minValue = minValue;
                    series.sumValue = sumValue;
                }
                return filter;
            });
            var funnel = new Funnel.Layout(type, this.series, this.options);
            this.shapes = funnel.shapes;
            this.layout = funnel;
        },
        draw: function(){
            var context = this.context,
                chart = this;
            this.shapes.forEach(function(series){
                series.shapes.forEach(function(shape){
                    chart.drawShape(context, shape, series);
                });
                series.shapes.forEach(function(shape){
                    chart.drawLabels(context, shape, series);
                });
            });
        },
        redraw: function(){
            this.layout.subgroup();
            this.draw();
        },
        animateTo: function(){
            var shapes = [];
            this.shapes.forEach(function(series){
                var newData = series.shapes,
                    oldData = series._shapes || [];
                var animators = [];
                series._diffValues.remove(function(newIndex){
                    var newShape = newData[newIndex],
                        mergeShape;
                    var points;
                    var startY, endY, nextY;
                    var temp = newShape.series;
                    delete newShape.series;
                    mergeShape = extend({}, newShape);
                    newShape.series = temp;
                    shapes.push([newShape, function(timer){
                        var fromY = newShape.points[0].y;
                        points = newShape.points.map(function(point){
                            return extend({}, point);
                        });
                        startY = points[0].y;
                        endY = points[points.length - 2].y;
                        nextY = points[points.length - 3].y;
                        if(points.length === 7){
                            points[0].y = points[1].y = points[6].y = fromY + (startY - fromY) * timer;
                            points[2].y = points[5].y = fromY + (endY - fromY) * timer;
                            points[3].y = points[4].y = fromY + (nextY - fromY) * timer;
                        }
                        else{
                            //points[0].y = points[1].y = points[4].y = fromY + (startY - fromY) * timer;
                            points[2].y = points[3].y = fromY + (endY - fromY) * timer;
                        }
                        mergeShape.points = points;
                    }]);
                    return mergeShape;
                }).add(function(newIndex){
                    var newShape = oldData[newIndex],
                        mergeShape;
                    var temp = newShape.series;
                    delete newShape.series;
                    mergeShape = extend({}, newShape);
                    newShape.series = temp;
                    return mergeShape;
                }).modify(function(newIndex, oldIndex){
                     var newShape = newData[newIndex],
                        oldShape = oldData[oldIndex],
                        mergeShape;
                    var points;
                    var startY, endY, nextY;
                    var temp;
                    
                    if(oldShape && newShape && newShape.selected !== false && newShape.value !== null){
                        temp = newShape.series;
                        delete newShape.series;
                        mergeShape = extend({}, newShape);
                        newShape.series = temp;
                        shapes.push([newShape, function(timer){
                            points = newShape.points.map(function(point){
                                return extend({}, point);
                            });
                            var opoints = oldShape.points.map(function(point){
                                return extend({}, point);
                            });
                            startY = points[0].y;
                            endY = points[points.length - 2].y;
                            nextY = points[points.length - 3].y;
                            var ostartY = opoints[0].y,
                                oendY = opoints[opoints.length - 2].y,
                                onextY = opoints[opoints.length - 3].y;
                            if(points.length === 7){
                                points[0].y = points[1].y = points[6].y = ostartY + (startY - ostartY) * timer;
                                points[2].y = points[5].y = oendY + (endY - oendY) * timer;
                                points[3].y = points[4].y = onextY + (nextY - onextY) * timer;
                            }
                            else{
                                //points[0].y = points[1].y = points[4].y = ostartY + (startY - ostartY) * timer;
                                points[2].y = points[3].y = oendY + (endY - oendY) * timer;
                            }
                            mergeShape.points = points;
                        }]);
                    }
                    return mergeShape;
                }).each(function(mergeShape){
                    mergeShape && animators.push(mergeShape);
                });
                series._animators = animators;
                series._shapes = series.shapes;
            });
            return shapes;
        },
        onFrame: function(context){
            var chart = this;
            this.shapes.forEach(function(series){
                var animators = series._animators;
                animators.forEach(function(shape){
                    chart.drawShape(context, shape, series);
                    chart.drawLabels(context, shape, series);
                });
            });
        },
        drawShape: function(context, shape, series){
            var borderWidth = pack("number", shape.borderWidth, series.borderWidth, 0),
                fillColor = shape.color || series.color;
            if(shape.selected !== false && shape.value !== null){
                fillColor = Color.parse(fillColor);
                fillColor.a = defined(shape.current) ? 0.75 : 1;

                context.save();
                context.fillStyle = Color.rgba(fillColor);
                context.beginPath();
                shape.points.forEach(function(point, i){
                    context[i ? "lineTo" : "moveTo"](point.x, point.y);
                });
                context.fill();

                (context.lineWidth = borderWidth) > 0 && (
                    context.strokeStyle = series.borderColor,
                    context.stroke()
                );
                context.restore();
            }
        },
        getShape: function(x, y){
            var ret = [];
            var series = this.shapes,
                length = series.length;
            var shapes, shape, item;

            function reset(shapes){
                shapes.forEach(function(item){
                    delete item.current;
                });
            }

            for(var i = 0; i < length; i++){
                item = series[i];
                reset(shapes = item.shapes);
                for(var j = 0; j < shapes.length; j++){
                    shape = shapes[j];
                    if(
                        shape.value !== null &&
                        shape.selected !== false &&
                        Intersection.polygon({x: x, y: y}, shape.points)
                    ){
                        shape.current = j;
                        shape.$value = "" + shape._value;
                        ret.push({shape: shape, series: item});
                        break;
                    }
                }
            }
            return ret;
        },
        drawLabels: function(context, shape, series){
            dataLabels.align(function(type, bbox){
                var t = pack("string", type, "center");
                var points = shape.points,
                    textArgs = shape.textArgs,
                    ls;
                var w2 = Math.abs(points[1].x - points[0].x),
                    w = bbox.width,
                    x = textArgs.x,
                    y = textArgs.y;
                if(this.inside === true){
                    x = points[0].x;
                }
                else{
                    if(this.distance > 0){
                        context.save();
                        context.beginPath();
                        context.moveTo(x, y);
                        context.lineTo(x += this.distance, y);
                        context.strokeStyle = shape.color;
                        context.stroke();
                        context.restore();
                    }
                    return x;
                }
                ls = lineSlope(points[4], points[3]);
                return {
                    left: (y - ls.b) / ls.slope,
                    center: x  + (w2 - w) / 2,
                    right: textArgs.x - w
                }[t];
            }).vertical(function(type, bbox){
                var points = shape.points,
                    shapeArgs = shape.shapeArgs;
                var h = bbox.height,
                    h2 = shapeArgs.height,
                    y = points[0].y;
                var t = pack("string", type, "top");
                if(this.inside !== true)
                    return shape.textArgs.y + h / 2;
                return {
                    top: y + h,
                    middle: y + h + (h2 - h) / 2,
                    bottom: y + h2
                }[t];
            }).call(shape, series, context);
        }
    };
    
    Funnel.Layout = function(type, series, options){
        this.series = series;
        this.shapes = [];

        this.type = type;
        this.options = options;

        this.init();
    };
    Funnel.Layout.prototype = {
        init: function(){
            this.shapes = this.subgroup();
        },
        neckWidth: function(series, plotX, plotY, plotWidth, plotHeight){
            var NECK_HEIGHT_FACTOR = pack("number",
                    Numeric.percentage(100, series.neckHeight) / 100,
                    0.75
                ),
                reversed = !!series.reversed,
                sorted = series.sorted;

            var seriesWidth = pack("number",
                    series.width,//absolute
                    Numeric.percentage(plotWidth, series.width),//percent
                    plotWidth//auto
                ),
                seriesHeight = pack("number",
                    series.height,
                    Numeric.percentage(plotHeight, series.height),
                    plotHeight
                ),
                size = Math.min(seriesWidth, seriesHeight);
            var cx = pack("number",
                    series.left,
                    Numeric.percentage(plotWidth, series.left),
                    plotX + (plotWidth - size) / 2//auto center
                ),
                cy = pack("number",
                    series.top,
                    Numeric.percentage(plotHeight, series.top),
                    plotY// + (plotHeight - seriesHeight) / 2
                );
            var nextHeight = reversed * seriesHeight,
                pointWidth = size;

            var turningHeight = SQRT3 * size * NECK_HEIGHT_FACTOR / 2,
                curTurningHeight = 0,
                turningFlag = false;
            var xTopLeft = cx;//pointWidth; //cx;

            var shapes = series.shapes,
                length = shapes.length,
                j = reversed ? length : -1;
            var sumValue = Math.max(pack("number", series.sumValue), 1e-8);

            (series.neck === true && (defined(sorted) && sorted !== false)) && shapes.sort(function(a, b){
               return a.value - b.value;
            });
            var al = 0;
            while (reversed ? j-- : ++j < length) {
                var shape = shapes[j],
                    value = shape.value,
                    percentage = value / sumValue;
                if (shape.isNULL || shape.selected === false || value < 0) {
                    value = percentage = 0;
                }
                var height = percentage * seriesHeight,
                    nextWidth = turningFlag ? 0 : height / SQRT3;

                var xTopRight = xTopLeft + pointWidth,
                    xBottomRight = xTopRight - nextWidth,
                    xBottomLeft = xTopLeft + nextWidth;
                var yTop = cy + nextHeight,
                    yBottom = yTop + height;

                var points = [
                    {x: xTopLeft, y: yTop},//top left
                    {x: xTopRight, y: yTop}//top right
                ];
                if (reversed) {
                    yBottom = nextHeight;
                    yTop = yBottom - height;

                    xBottomRight = al + pointWidth;
                    xTopLeft = al - nextWidth;
                    xTopRight = al + nextWidth;

                    points = [
                        {x: xBottomRight, y: yBottom},//left bottom
                        {x: al, y: yBottom},//right bottom
                        {x: xTopLeft, y: yTop},//right top
                        {x: xTopRight, y: yTop}//left top
                    ];
                    nextHeight -= height;
                }
                else {
                    //turn shape
                    if(!turningFlag && curTurningHeight + height > turningHeight) {
                        var minWidth = size * (1 - NECK_HEIGHT_FACTOR);
                        turningFlag = true;
                        nextWidth = (pointWidth - minWidth) / 2;
                        points = points.concat([
                            {x: xTopRight - nextWidth, y: yTop + turningHeight - curTurningHeight},
                            {x: xTopRight - nextWidth, y: yBottom},
                            {x: xTopLeft + nextWidth, y: yBottom},
                            {x: xTopLeft + nextWidth, y: yTop + turningHeight - curTurningHeight}
                        ]);
                        pointWidth = minWidth;
                        xBottomLeft = xTopLeft + nextWidth;
                    }
                    else{
                        curTurningHeight += height;
                        points.push(
                            {x: xBottomRight, y: yBottom},//bottom right
                            {x: xBottomLeft, y: yBottom}//bottom left
                        );
                        pointWidth = pointWidth - 2 * nextWidth;
                    }
                    nextHeight += height;
                    points.push({x: xTopLeft, y: yTop});//close path
                    xTopLeft = xBottomLeft;
                }

                extend(shape, {
                    x: xTopLeft,
                    y: yTop,
                    points: points,
                    total: series.sumValue,
                    percentage: percentage * 100,
                    shapeArgs: {
                        x: xTopLeft,
                        y: yTop,
                        height: height
                    },
                    textArgs: {
                        x: -9999,
                        y: -9999
                    }
                });
                
            }
        },
        neckHeight: function(series, plotX, plotY, plotWidth, plotHeight){
            var reversed = !!series.reversed,
                sorted = series.sorted;
            var seriesWidth = pack("number",
                    series.width,//absolute
                    Numeric.percentage(plotWidth, series.width),//percent
                    plotWidth//auto
                ),
                seriesHeight = pack("number",
                    series.height,
                    Numeric.percentage(plotHeight, series.height),
                    plotHeight
                ),
                size = Math.min(seriesWidth, seriesHeight);
            var cx = pack("number",
                    series.left,
                    Numeric.percentage(plotWidth, series.left),
                    plotX + (plotWidth - size) / 2//auto center
                ),
                cy = pack("number",
                    series.top,
                    Numeric.percentage(plotHeight, series.top),
                    plotY + (plotHeight - size) / 2 - 1
                );

            var shapes = series.shapes,
                length = shapes.length,
                j = reversed ? -1 : length,
                shape;

            var nextY = reversed ? cy : (cy + size),
                nextX = 0,
                nextX1 = 0;

            var pointHeight;

            sorted !== false && shapes.sort(function(a, b){
                return reversed
                    ? a.value - b.value
                    : b.value - a.value;
            });

            var lastShape, filterLength = 0;
            while(reversed ? ++j < length : j--){
                var filter = (shape = shapes[j]).selected !== false && shape.value !== null && shape.value >= 0;
                delete shape.isLast;
                if(filter){
                    lastShape || (lastShape = shape);
                    ++filterLength;
                }
            }
            pointHeight = size / filterLength;
            lastShape && (lastShape.isLast = true);

            j = reversed ? -1 : length;
            while(reversed ? ++j < length : j--){
                var value = (shape = shapes[j]).value,
                    percentage = value / series.maxValue;
                var points = [];
                var x, y, x1, y1, w = 0, h;
                var isEmpty = false;
                h = pointHeight;
                if(value === null || value < 0 || shape.selected === false){
                    value = h = 0;
                    isEmpty = true;
                }
                w = percentage * size;
                x = cx;
                x += (size - w) / 2;
                x1 = x + w;
                if(reversed){
                    y = nextY;
                    y1 = y + h;
                    points = [
                        {x: nextX, y: y},//left top
                        {x: nextX1, y: y},//right top
                        {x: x1, y: y1},//right bottom
                        {x: x, y: y1},//left bottom
                        {x: nextX, y: y}//close
                    ];
                    if(shape.isLast){
                        points = [
                            {x: x + w / 2, y: y},
                            {x: x + w / 2, y: y},
                            {x: x1, y: y1},
                            {x: x, y: y1},
                            {x: x + w / 2, y: y}
                        ];
                    }
                    nextY = y1;
                }
                else{
                    y = nextY - h;
                    y1 = y + h;
                    
                    points = [
                        {x: x, y: y},//left top
                        {x: x1, y: y},//right top
                    ];
                    if(shape.isLast){
                        points.push(
                            {x: x1 - w / 2, y: y1},//right bottom
                            {x: x1 - w / 2, y: y1}//repeat this x and y
                        );
                    }
                    else{
                        points.push(
                            {x: nextX1, y: y1},//right bottom
                            {x: nextX, y: y1}//left bottom
                        );
                    }
                    points.push({x: x, y: y});
                    nextY = y;
                }
                if(!isEmpty){
                    nextX1 = x1;
                    nextX = x;
                }

                extend(shape, {
                    points: points,
                    shapeArgs: {
                        x: x,
                        y: y,
                        height: pointHeight,
                        width: w
                    },
                    textArgs: {
                        x: -9999,
                        y: -9999
                    }
                });
            }
        },
        dataLabels: function(series){
            var shapes = series.shapes;
            shapes.forEach(function(shape){
                var points = shape.points || [],
                    shapeArgs = shape.shapeArgs;
                var ls;
                var x, y;
                if(points.length){
                    ls = lineSlope(points[2], points[1]);
                    //funnel shape
                    if(points.length >= 7){
                        ls = lineSlope(points[4], points[3]);
                    }
                    // //triangle shape
                    // else if(points.length <= 4){
                    //     ls = lineSlope(points[1], points[0]);
                    // }
                    y = (shapeArgs.y + shapeArgs.height / 2);
                    x = (y - ls.b) / ls.slope;
                    if(ls.slope === 0){
                        if(points.length >= 7){
                            x = points[3].x;
                            y = points[2].y;
                        }
                        else
                            x = points[2].x;//没有斜率
                    }
                    shape.textArgs.x = x;
                    shape.textArgs.y = y;
                }
            });
        },
        subgroup: function(){
            var options = this.options,
                type = this.type,
                width = options.chart.width,
                height = options.chart.height;
            var layout = this;
            options.panel.forEach(function(pane){
                var series = arrayFilter(pane.series, function(series){
                    return series.type === type;
                });
            
                series.forEach(function(series){
                    var plotX = pack("number", series.plotX, 0),
                        plotY = pack("number", series.plotY, 0),
                        plotWidth = pack("number", series.plotWidth, width, 0),
                        plotHeight = pack("number", series.plotHeight, height, 0);

                    layout[series.neck === true ? "neckHeight" : "neckWidth"].apply(layout, [
                        series, plotX, plotY, plotWidth, plotHeight
                    ]);
                    layout.dataLabels(series);
                });
            });
            return this.series;
        }
    };

    (Chart.graphers = Chart.graphers || {}).funnel = Chart.Funnel = Funnel;

})(typeof window !== "undefined" ? window : this, Dalaba.Chart);;
    (function(global, Chart){

    var relayout = (function(global){

    function factoy(Numeric){
        var interpolate = Numeric.interpolate;

        return function(type, options){

            var getKey = function(index, axis){
                var categories;
                if(isArray(categories = axis.categories) && categories.length){
                    return categories[index];
                }
                return index;
            };
            options.panel.forEach(function(pane){
                var series = arrayFilter(pane.series, function(series){
                    return series.type === type;
                });
                series.forEach(function(series){
                    var startAngle, endAngle;
                    var minValue, maxValue, logBase;
                    var polarAxisOptions = series._polarAxis || {};
                    var plotX = polarAxisOptions.center[0],
                        plotY = polarAxisOptions.center[1],
                        plotRadius = series.plotRadius;
                    startAngle = pack("number", polarAxisOptions.startAngle, -90) * PI / 180;
                    endAngle = pack("number", polarAxisOptions.endAngle, 360) * PI / 180;
                    logBase = pack("number", pack("object", polarAxisOptions.logarithmic, {}).base, 10);
                    maxValue = pack("number", polarAxisOptions.maxValue);
                    minValue = pack("number", polarAxisOptions.minValue);
                    //console.log(series.minValue, polarAxisOptions.minValue, series.maxValue, polarAxisOptions.maxValue);

                    var shapes = series.shapes,
                        length = shapes.length,
                        j = 0;
                    for(j = 0; j < length; j++){
                        var shape = series.shapes[j],
                            value = shape.value;
                        var x, y, angle, radius;
                        if(isArray(shape.source)){
                            angle = shape.source[0] * PI2 / 360 + startAngle;
                            radius = interpolate(shape.source[1], minValue, maxValue, 0, plotRadius);
                        }
                        else{
                            angle = j * PI2 / Math.max(1, length) + startAngle;
                            radius = interpolate(value, minValue, maxValue, 0, plotRadius);
                        }
                        if(series.selected === false || value === null){
                            radius = 0;//minValue = maxValue = 0;
                        }
                        
                        x = plotX + Math.cos(angle) * radius;
                        y = plotY + Math.sin(angle) * radius;

                        extend(shape, {
                            x: x,
                            y: y,
                            angle: angle,
                            index: j,
                            key: getKey(j, polarAxisOptions)
                        });
                        shape.series._startAngle = startAngle;
                        shape.series._endAngle = endAngle;
                    }
                });
            });
        };
    }
    return {
        deps: function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
}).call(typeof window !== "undefined" ? window : this).deps(Numeric);

    var LineSegment = Chart.LineSegment;

    var angle2arc = Chart.angle2arc;

    var Clip = function(canvas){
        var cx, cy, cr;
        //var image = canvas.getContext("2d");
        var angle;
        return {
            ploar: function(x, y, r){
                cx = x, cy = y, cr = r;
                return this;
            },
            angle: function(a){
                //image.save();
                //image.clearRect(0, 0, canvas.width, canvas.height);
                /*angle2arc(
                    cx, cy,
                    cr, 0,
                    angle[0], angle[1],
                    false//close path
                )(image);
                image.clip();*/
                angle = a;
                return this;
            },
            clip: function(context){
                context.save();
                //image.clearRect(0, 0, canvas.width, canvas.height);
                angle2arc(
                    cx, cy,
                    cr / 2, 0,
                    angle[0], angle[1],
                    false//close path
                )(context);
                //context.fill();
                context.clip();
                context.drawImage(
                    canvas,
                    0, 0, canvas.width, canvas.height,
                    0, 0, canvas.width / DEVICE_PIXEL_RATIO, canvas.height / DEVICE_PIXEL_RATIO
                );
                context.restore();
            }
        };
    };

    /*
     * Class Scatter
    */
    function Radar(canvas, options){
        this.type = "radar";

        this.canvas = canvas;
        this.context = canvas.getContext("2d");

        this.series = [];
        
        this.init(options);
    }
    Radar.prototype = {
        constructor: Radar,
        init: function(options){
            var type = this.type,
                canvas = this.canvas;
            var chart = this;

            this.options = extend({}, options);
            this.series = arrayFilter(options.series, function(series){
                var filter = series.type === type;
                if(filter){
                    series._diffValues = List.diff(series.shapes, series._shapes || [], function(a, b){
                        return a && b && a.value === b.value;
                    });
                }
                return filter;
            });
            relayout(type, this.options);

            if(canvas.nodeType === 1){
                this.series.forEach(function(series){
                    if(series.animationEnabled){
                        var image = document.createElement("canvas"),
                            context = image.getContext("2d");

                        Chart.scale(context, canvas.width, canvas.height, DEVICE_PIXEL_RATIO);
                        series._image = image;
                        chart.drawLine(context, series.shapes, series);
                    }
                });
            }
        },
        draw: function(){
            var context = this.context,
                chart = this;
            this.series.forEach(function(series){
                chart.drawLine(context, series.shapes, series);
                if(series.selected !== false){
                    series.shapes.forEach(function(shape){
                        chart.drawShape(context, shape, series);
                    });
                    series.shapes.forEach(function(shape){
                        chart.drawLabels(context, shape, series);
                        chart.onHover(context, shape, series);
                    });
                }
            });
        },
        redraw: function(){
            relayout(this.type, this.options);
            this.draw();
        },
        getShape: function(x, y){
            var series,
                shape,
                sl = this.series.length,
                dl,
                i,
                j;
            var results = [],
                shapes;

            var isInside = function(series){
                var dx = x - series.plotCenterX,
                    dy = y - series.plotCenterY;
                return series.plotRadius * series.plotRadius - dx * dx - dy * dy >= 0.001;
            };
            var resetShape = function(shapes){
                for(var j = 0, l = shapes.length; j < l;  j++){
                    delete shapes[j].current;
                }
            };

            for(i = 0; i < sl; i++){
                series = this.series[i];
                shapes = series.shapes;
                if(isInside(series)){
                    //return results;
                    resetShape(shapes);
                    for(j = 0, dl = shapes.length; j < dl; j++){
                        shape = shapes[j];
                        if(series.selected !== false && !shape.isNULL && Intersection.line(
                            {x: x, y: y},
                            {x: shape.x, y: shape.y, width: pack("number", (series.marker || {}).radius, 5) * 2}
                        )){
                            shape.current = j;
                            results.push({shape: shape, series: series});
                            break;
                        }
                    }
                }
            }
            return results;
        },
        drawShape: function(context, shape, series){
            var marker = pack("object", shape.marker, series.marker, {});
            var lineWidth = pack("number", marker.lineWidth, 0),
                lineColor = pack("string", marker.lineColor, shape.color, series.color, "#000"),
                fillColor = pack("string", marker.fillColor, shape.color, series.color, "#000"),
                radius = pack("number", marker.radius, 4);

            var usemarker = series.shapes.length * radius < series.radius;
            if(defined(marker.enabled) || defined(marker.enabled)){
                usemarker = marker.enabled === true;
            }
            if(series.selected !== false & shape.value !== null & usemarker){
                context.save();
                context.fillStyle = fillColor;
                context.beginPath();
                context.arc(shape.x, shape.y, radius, 0, PI2, true);
                context.fill();
                (context.lineWidth = lineWidth) > 0 &&(context.strokeStyle = lineColor, context.stroke());
                context.restore();
            }
        },
        drawLine: function(context, shapes, series){
            var lineWidth = pack("number", series.lineWidth, 2),
                lineColor = series.lineColor || series.color,
                fillColor = series.fillColor || series.color,
                radarType = series.radarType;
            context.save();
            context.beginPath();
            if(radarType === "area"){
                if(Color.isColor(fillColor)){
                    fillColor = Color.parse(fillColor).alpha(0.75).rgba();
                }
                else if(defined(fillColor.radialGradient)){
                    fillColor = Color.parse(fillColor).radial(series.cx, series.cy, series.radius);
                }
                LineSegment.none(context, shapes, series);
                context.fillStyle = fillColor;
                context.closePath();
                context.fill();
            }
            else{
                LineSegment.none(context, shapes, series);
                context.closePath();
            }

            (context.lineWidth = lineWidth) > 0 && (
                context.shadowColor = series.shadowColor,
                isNumber(series.shadowBlur) && (context.shadowBlur = series.shadowBlur),
                isNumber(series.shadowOffsetX) && (context.shadowOffsetX = series.shadowOffsetX),
                isNumber(series.shadowOffsetY) && (context.shadowOffsetY = series.shadowOffsetY),
                context.strokeStyle = lineColor,
                context.stroke()
            );
            context.restore();
        },
        onHover: function(context, shape, series){
            var marker = series.marker || {},
                fillColor = shape.color || series.color,
                hoverColor;
            if(!shape.isNULL && isNumber(shape.current) && shape.current > -1){
                hoverColor = Color.parse(fillColor);
                hoverColor.a = 0.5;
                context.save();
                context.fillStyle = Color.rgba(hoverColor);
                context.beginPath();
                context.arc(shape.x, shape.y, 8, 0, PI2);
                context.fill();

                context.fillStyle = fillColor;
                context.strokeStyle = marker.fillColor || "#fff";
                context.beginPath();
                context.arc(shape.x, shape.y, 3, 0, PI2);
                context.fill();
                context.stroke();
                context.restore();
            }
            delete shape.current;
        },
        drawLabels: function(context, shape, series){
            var radius = pack("number", (shape.marker || {}).radius, (series.marker || {}).radius, 0);
            dataLabels.align(function(type, bbox){
                var t = pack("string", type, "center"),
                    //angle = shape.angle,
                    x = shape.x,
                    w = bbox.width;
                return {
                    left: x - w - radius / 2,
                    center: x - w / 2,
                    right: x + radius / 2
                }[t];
            }).vertical(function(type, bbox){
                var t = pack("string", type, "top"),
                    y = shape.y,
                    h = bbox.height;
                return {
                    top: y - radius,
                    middle: y - h + radius,
                    bottom: y + radius
                }[t];
            }).call(shape, series, context);
        },
        animateTo: function(context, initialize){
            var chart = this;
            var shapes = [];
            chart.series.forEach(function(series){
                var newData = series.shapes,
                    oldData = series._shapes || [];
                var animators = [];
                if(initialize === true){
                    var mergeShape = series;
                    mergeShape._timer = 0;
                    shapes.push([series, function(timer){
                        mergeShape._timer = timer;
                    }]);
                    animators.push(mergeShape);
                }
                else{
                    series._diffValues.remove(function(newIndex){
                        var newShape = newData[newIndex],
                            mergeShape = {
                                x: newShape.x,
                                y: newShape.y,
                                color: newShape.color,
                                value: newShape.value,
                                _value: newShape._value,
                                isNULL: newShape.isNULL
                            };
                        shapes.push([newShape, function(timer){
                            mergeShape.radius = newShape.radius * timer;
                        }]);
                        animators.push(mergeShape);
                    }).add(function(newIndex){
                        var oldShape = oldData[newIndex],
                            mergeShape = {
                                x: oldShape.x,
                                y: oldShape.y,
                                color: oldShape.color,
                                _value: oldShape._value,
                                value: oldShape.value,
                                isNULL: oldShape.isNULL
                            };
                        shapes.push([oldShape, function(timer){
                            //mergeShape.x = NaN;
                            mergeShape.radius = oldShape.radius - oldShape.radius * timer;
                        }]);
                        animators.push(mergeShape);
                    }).modify(function(newIndex, oldIndex){
                        var newShape = newData[newIndex],
                            oldShape = oldData[oldIndex],
                            mergeShape;
                        if(oldShape && newShape){
                            mergeShape = {
                                x: oldShape.x,
                                y: oldShape.y,
                                color: newShape.color,
                                _value: newShape._value,
                                value: newShape.value,
                                isNULL: newShape.isNULL
                            };
                            shapes.push([newShape, function(timer){
                                mergeShape.x = oldShape.x + (newShape.x - oldShape.x) * timer;
                                mergeShape.y = oldShape.y + (newShape.y - oldShape.y) * timer;
                                mergeShape.radius = oldShape.radius + (newShape.radius - oldShape.radius) * timer;
                            }]);
                            animators.push(mergeShape);
                        }
                    }).each();
                }
                series._animators = animators;
                series._shapes = series.shapes;
            });
            return shapes;
        },
        onFrame: function(context, initialize){
            var chart = this;
            this.series.forEach(function(series){
                var animator = series._animators;
                if(initialize === true){
                    animator.forEach(function(series){
                        series._image && Clip(series._image)
                            .ploar(series.plotCenterX, series.plotCenterY, series.plotRadius * 2 + 10)
                            .angle([series._startAngle, series._endAngle * (series._timer) + series._startAngle])
                            .clip(context);
                    });
                }
                else{
                    chart.drawLine(context, animator, series);
                    animator.forEach(function(mergeShape){
                        chart.drawShape(context, mergeShape, series);
                        chart.drawLabels(context, mergeShape, series);
                    });
                }
            });
        }
    };

    (Chart.graphers = Chart.graphers || {}).radar = Chart.Radar = Radar;

})(typeof window !== "undefined" ? window : this, Dalaba.Chart);;
    (function(global, Chart){
    
    var relayout = (function(global){

    function factoy(geo, Color){
        var rescale = function(s){
            return isNumber(s) && isFinite(s) ? Math.min(10, Math.max(s, 0)) : 1;
        };
        return function(type, options){
            var defaultGeoPath = {};
            var Path = geo.Path;

            options.panel.forEach(function(pane){
                var series = arrayFilter(pane.series, function(series){
                    return series.type === type;
                });
                series.forEach(function(series){
                    var geoJson = series.mapData,
                        geoPath = defaultGeoPath,
                        shapes = [];
                    var plotX = pack("number", series.plotX, 0),
                        plotY = pack("number", series.plotY, 0),
                        plotWidth = pack("number", series.plotWidth, 0),
                        plotHeight = pack("number", series.plotHeight, 0),
                        chartWidth = pack("number", series.chartWidth, plotWidth, 0),
                        chartHeight = pack("number", series.chartHeight, plotHeight, 0);

                    var colorAxisOptions = series._colorAxis,//[series.colorAxis | 0],
                        domain = [],
                        range = [],
                        lerp;
                    var minValue = colorAxisOptions.minValue,
                        maxValue = colorAxisOptions.maxValue;
                    var maxWidth = 0,
                        maxHeight = 0;
                    var scale = [1, 1],
                        translate = [0, 0];

                    if (defined(colorAxisOptions) && isArray(colorAxisOptions.stops)) {
                        colorAxisOptions.stops.forEach(function(stop){
                            domain.push(stop[0]);
                            range.push(stop[1]);
                        });
                        lerp = Color.lerp(domain, range, Color.interpolate);
                    }
                        
                    if (defined(geoJson)) {
                        scale = [plotWidth / chartWidth * 0.9, plotHeight / chartHeight * 0.9];
                        translate = [plotX, plotY];
                        if(defined(series.scale)){
                            isNumber(series.scale) && (scale = rescale(series.scale), scale = [scale, scale]);
                            if(isArray(series.scale)){
                                scale = [rescale(series.scale[0]), rescale(series.scale[1])];
                            }
                        }
                        if(defined(series.translate)){
                            isNumber(series.translate) && (translate = [plotX + pack("number", series.translate), plotY + pack("number", series.translate)]);
                            if(isArray(series.translate)){
                                translate = [plotX + pack("number", series.translate[0]), plotY + pack("number", series.translate[1])];
                            }
                        }
                        
                        Path.size([chartWidth, chartHeight]).scale(scale).translate(translate).parse(geoJson, function(groups, feature){
                            var points = [];
                            var count = 0;
                            var centerX = 0,
                                centerY = 0;
                            var shape = {
                                name: (feature.properties || {}).name,
                                points: points
                            };

                            groups.forEach(function(polygon, i) {
                                var x, y;
                                var length = polygon.length,
                                    j;
                                var point;
                                i && points.push({x: polygon[j = 0].x, y: polygon[j].y, isNext: true});
                                for(j = 1; j < length; j++){
                                    point = polygon[j];
                                    x = point.x;
                                    y = point.y;
                                    maxWidth = Math.max(x, maxWidth);
                                    maxHeight = Math.max(y, maxHeight);
                                    centerX += (x - centerX) / ++count;
                                    centerY += (y - centerY) / count;
                                    points.push({x: x, y: y});
                                }
                            });
                            shape.shapeArgs = {
                                x: centerX, y: centerY,
                                maxX: maxWidth,
                                maxY: maxHeight
                            };

                            var data = series.mapKey[shape.name],
                                value,
                                color;
                            if(!isObject(data)){
                                data = {value: null};
                            }
                            if(isNumber(value = data.value)){
                                color = lerp && lerp(interpolate(value, minValue, maxValue, 0, 1));
                                shape.color = color || series.color;
                            }
                            extend(shape, data);
                            shapes.push(shape);
                        });
                        shapes.forEach(function(shape) {
                            var cx = (chartWidth - maxWidth) / 2,
                                cy = (chartHeight - maxHeight) / 2 + plotY;
                            shape.points.forEach(function(point){
                                point.x += cx;
                                point.y += cy;
                            });
                            shape.shapeArgs.x += cx;
                            shape.shapeArgs.y += cy;
                        });
                        series._geo = {
                            path: Path,
                            size: geoPath.size,
                            x: geoPath.x,
                            y: geoPath.y,
                            center: geoPath.center
                        };
                    }
                    series.shapes = shapes;
                });
            });
        };
    }
    return {
        deps: function() {
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
}).call(typeof window !== "undefined" ? window : this).deps(Dalaba.geo, Color);
    /*
     * Class Map
    */
    function Map(canvas, options) {
        this.type = "map";

        this.series = [];

        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        
        this.init(options);
    }
    Map.prototype = {
        constructor: Map,
        init: function(options) {
            var type = this.type;
            this.options = extend({}, options);

            this.series = arrayFilter(pack("array", this.options.series, []), function(item){
                var f = item.selected !== false
                    && (item.type === type);
                if(f){
                    var mapKey = {};
                    item.data.forEach(function(d){
                        if(defined(d.name)){
                            mapKey[d.name] = d;
                        }
                    });
                    item.mapKey = mapKey;
                }
                return f;
            });
            relayout(type, this.options);
        },
        draw: function(){
            var context = this.context,
                chart = this;
              
            this.series.forEach(function(series){
                var shapes = series.shapes;
                if(defined(series.mapData)){
                    shapes.forEach(function(shape){
                        chart.drawShape(context, shape, series);
                    });
                    shapes.forEach(function(shape){
                        chart.drawLabels(context, shape, series);
                    });
                }
            });
        },
        redraw: function(){
            relayout(this.type, this.options);
            this.draw();
        },
        drawShape: function(context, shape, series) {
            var borderWidth = pack("number", series.borderWidth, 0),
                borderColor = pack("string", series.borderColor, "#FFFFFF"),
                fillColor = series.fillColor || shape.color || "#f7f7f7";
            var points = shape.points;
            var shapeArgs = shape.shapeArgs;
            var gradient;

            if (fillColor.linearGradient || fillColor.radialGradient) {
                var s0 = (shapeArgs.maxX - shapeArgs.x) / 2,
                    s1 = (shapeArgs.maxY - shapeArgs.y) / 2;
                gradient = Color.parse(fillColor);
                fillColor = fillColor.radialGradient
                    ? gradient.radial(shapeArgs.x, shapeArgs.y, Math.sqrt(s0 * s0 + s1 * s1) / 4)
                    : gradient.linear(0, 0, s0, s1);
            }

            if (isNumber(shape.current) && shape.current !== -1) {
                !shape.isNULL
                    ? (fillColor = Color.parse(fillColor).alpha(0.75).rgba())
                    : (fillColor = "rgb(79, 134, 189)");
            }

            context.save();
            context.beginPath();
            points.forEach(function(point, i){
                context[i && !point.isNext ? "lineTo" : "moveTo"](point.x, point.y);
            });
            context.closePath();
            context.fillStyle = fillColor;

            if (defined(series.shadowColor)) {
                context.shadowColor = series.shadowColor;
                isNumber(series.shadowBlur) && (context.shadowBlur = series.shadowBlur);
                isNumber(series.shadowOffsetX) && (context.shadowOffsetX = series.shadowOffsetX);
                isNumber(series.shadowOffsetY) && (context.shadowOffsetY = series.shadowOffsetY);
            }

            context.fill();
            (context.lineWidth = borderWidth) > 0 && (
                context.strokeStyle = borderColor,
                context.stroke()
            );
            context.restore();
        },
        getShape: function(x, y){
            var series,
                shapes,
                shape;
            var ret = [];

            function reset(shapes){
                shapes.forEach(function(item){
                    delete item.current;
                });
            }

            for(var i = 0, n = this.series.length; i < n; i++){
                reset(shapes = (series = this.series[i]).shapes);
                for(var j = 0; j < shapes.length; j++){
                    shape = shapes[j];
                    if(Intersection.polygon({
                        x: x,
                        y: y
                    }, shape.points)){
                        shape.$value = shape.isNULL ? "--" : "" + shape.value;
                        ret.push({shape: shape, series: series});
                        shape.current = j;
                        break;
                    }
                }
            }
            var diffData = [],
                diffMaps = {};
            ret.forEach(function(item){
                var key = item.shape.name;
                if(!diffMaps.hasOwnProperty(key)){
                    diffMaps[key] = !0;
                    diffData.push(item);
                }
            });
            return diffData;
        },
        drawLabels: function(context, shape, series) {
            dataLabels.value(shape.name).align(function(type, bbox) {
                var x = shape.shapeArgs.x,
                    w = bbox.width;
                return x - w / 2;
            }).vertical(function(type, bbox) {
                var y = shape.shapeArgs.y,
                    h = bbox.height;
                return y + h / 2;
            }).call(shape, series, context);
        }
    };

    (Chart.graphers = Chart.graphers || {}).map = Chart.Map = Map;
    
})(typeof window !== "undefined" ? window : this, Dalaba.Chart);;
    (function(global, Chart){
    var listFilter = List.filter;

    function arcTo(context, paths){
        var arc = Chart.arc;
        var moveX, moveY;
        paths.forEach(function(path, i){
            if(i){
                arc(
                    context,
                    moveX, moveY,
                    path
                );
                moveY = (moveX = path.slice(-2))[1];
                moveX = moveX[0];
            }
            else{
                context.moveTo(moveX = path[0], moveY = path[1]);
            }
        });
    }

    function intersectedPoints(p1, p2, r1, r2){
        var dx = p2.x - p1.x,
            dy = p2.y - p1.y;
        var d = Math.sqrt(dx * dx + dy * dy);
            /*r1 = p1.radius,
            r2 = p2.radius;*/
        //两圆相交分如下几种情况：相离、相切、相交、包含。
        if(d >= r1 + r2 || d <= Math.abs(r1 - r2))
            return [];//相离相切的面积为零
        //包含的面积就是小圆的面积
        /*if(r2 - r1 >= d){
            return r1 * r1 * Math.PI;
        }*/
        //两圆交点
        var a = (r1 * r1 - r2 * r2 + d * d) / (2 * d),
            h = Math.sqrt(r1 * r1 - a * a);
        var x0 = p1.x + a * (dx) / d,
            y0 = p1.y + a * (dy) / d;
        var rx = -(dy) * (h / d),
            ry = -(dx) * (h / d);
        return [
            {x: x0 + rx, y: y0 - ry},//p1
            {x: x0 - rx, y: y0 + ry}//p2
        ];
    }
    /*
     * Overlap
    */
    var Overlap = {
        overlap: function(r1, r2, d){
            if(d >= r1 + r2)
                return 0;//相离、相切
            if(d <= Math.abs(r1 - r2))
                return Math.min(r1, r2) * Math.min(r1, r2) * PI;//包含
            //相交
            /*var w1 = r1 - (d * d - r2 * r2 + r1 * r1) / (2 * d);
            var w2 = r2 - (d * d + r2 * r2 - r1 * r1) / (2 * d);
            return Overlap.area(r1, w1) + Overlap.area(r2, w2);*/
            var a1 = (r1 * r1 + d * d - r2 * r2) / (2 * r1 * d),
                a2 = (r2 * r2 + d * d - r1 * r1) / (2 * r2 * d);
            a1 = Math.acos(a1);
            a2 = Math.acos(a2);
            return a1 * r1 * r1 + a2 * r2 * r2 - r1 * d * Math.sin(a1);
        },
        area: function(r, width){
            var integral;
            return (integral = function(r, x){
                var y = Math.sqrt(r * r - x * x);
                return x * y + r * r * Math.atan2(x, y);
            })(r, width - r) - integral(r, -r);
        }
    };
    /*
     * Union
    */
    var Union = {
        arcs: [],
        areas: NaN,
        points: {
            inner: [],
            intersector: []
        },
        area: function(nodes){
            var intersectPoints = [],
                innerPoints,
                point;
            var EPS = 1e-10;

            var length = nodes.length,
                i, j;
            for(i = 0; i < length; i++){
                for(j = i + 1; j < length; j++){
                    var a = nodes[i],
                        b = nodes[j];
                    intersectedPoints(a, b, a.radius, b.radius).forEach(function(item){
                        item.parentIndex = [i, j];
                        item.source = a;
                        item.target = b;
                        //item.color = ;//a + b
                        intersectPoints.push(item);
                    });
                }
            }
            innerPoints = arrayFilter(intersectPoints, function(item){
                for(i = 0; i < length; i++){
                    var a = item, b = nodes[i];
                    if(Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)) > b.radius + EPS)
                        return false;
                }
                return true;
            });
            var polygonArea = 0,
                arcArea = 0,
                arcs = this.arcs = [];
            //包含
            if(innerPoints.length > 1){
                var centroid = {x: 0, y: 0};
                length = innerPoints.length;
                for(i = 0; i < length; i++){
                    point = innerPoints[i];
                    centroid.x += point.x;
                    centroid.y += point.y;
                }
                centroid.x /= length;
                centroid.y /= length;
                for(i = 0; i < length; i++){
                    point = innerPoints[i];
                    point.angle = Math.atan2(point.x - centroid.x, point.y - centroid.y);
                }
                innerPoints.sort(function(a, b){ return b.angle - a.angle; });
                var p2 = innerPoints[innerPoints.length - 1],
                    p1,
                    arc;
                for(i = 0; i < length; i++){
                    p1 = innerPoints[i];
                    polygonArea += (p2.x + p1.x) * (p1.y - p2.y);
                    arc = null;
                    for(j = 0; j < p1.parentIndex.length; ++j){
                        if(p2.parentIndex.indexOf(p1.parentIndex[j]) > -1){
                            var node = nodes[p1.parentIndex[j]];
                            var a1 = Math.atan2(p1.x - node.x, p1.y - node.y),
                                a2 = Math.atan2(p2.x - node.x, p2.y - node.y),
                                sub = a2 - a1,
                                angle,
                                distance;
                            if(sub < 0)
                                sub += Math.PI * 2;
                            angle = a2 - sub / 2;

                            var middle = {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2},
                                current = {
                                    x: node.x + Math.sin(angle) * node.radius,
                                    y: node.y + Math.cos(angle) * node.radius
                                };
                            distance = Math.sqrt(
                                (middle.x - current.x) * (middle.x - current.x) +
                                (middle.y - current.y) * (middle.y - current.y)
                            );
                            //console.log(nodes[p2.parentIndex[j]], "000");
                            if(arc === null || arc.width > distance){
                                arc = {
                                    width: distance,
                                    p1: p1,
                                    p2: p2,
                                    node: node
                                };
                                //console.log(p1.source.color, p1.target.color)
                            }
                        }
                    }
                    arcs.push(arc);
                    arcArea += Overlap.area(arc.node.radius, arc.width);
                    //console.log(arcArea, arc);
                    p2 = p1;
                }
            }
            else{
                var minNode = nodes[0],
                    disjoint = false;
                length = nodes.length;
                for(i = 1; i < length; i++){
                    if(nodes[i].radius < minNode.radius)
                        minNode = nodes[i];
                }
                for(i = 0; i < length; i++){
                    if(Math.sqrt(
                        (nodes[i].x - minNode.x) * (nodes[i].x - minNode.x) +
                        (nodes[i].y - minNode.y) * (nodes[i].y - minNode.y)
                    )){
                        disjoint = true;
                        break;
                    }
                }
                if(disjoint){
                    arcArea = polygonArea = 0;
                }
                else{
                    arcArea = minNode.radius * minNode.radius * Math.PI;//包含
                    arcs.push({
                        node: minNode,
                        p1: {x: minNode.x, y: minNode.y + minNode.radius},
                        p2: {x: minNode.x - EPS, y: minNode.y + minNode.radius},
                        width: minNode.radius * 2
                    });
                }
            }

            this.areas = arcArea + polygonArea;
            this.points.inner = innerPoints;
            this.points.intersector = intersectPoints;

            polygonArea /= 2;
            return arcArea + polygonArea;
        }
    };
    /*
     * Subset
    */
    function Subset(data){
        var links = {};

        (this.nodes = listFilter(data, function(item){
            var f = typeof item.id !== "undefined";
            return f;
        })).forEach(function(item, i){
            item.x = item.y = 0;
            item.radius = Math.sqrt(item.value / Math.PI);
            links[i] = [];
        });
        (this.overlaps = listFilter(data, function(item){
            return typeof item.sets !== "undefined" && item.sets.length > 1;
        })).forEach(function(item){
            var a = item.sets[0],
                b = item.sets[1];
            //if(ids.sets.length !== 2)
            //    continue;
            links[a].push({node: b, value: item.value});//L => R
            links[b].push({node: a, value: item.value});//R => L
        });
        this.links = links;
        this.width = 0;
        this.height = 0;

        this.init();
    }
    Subset.prototype = {
        init: function(){
            var nodes = this.nodes,
                links = this.links;
            if(!nodes.length)
                return;
            var newNodes = [],
                link,
                weight;
            for(link in links){
                if(links.hasOwnProperty(link)){
                    weight = 0;
                    (links[link] || []).forEach(function(item){
                        weight += item.value;
                    });
                    newNodes.push({node: link, weight: weight});
                }
            }
            newNodes.sort(function(a, b){ return b.weight - a.weight; });//value max to min sort

            var visited = {},
                first = newNodes[0].node,
                points,
                overlap;
            var matrix = this.matrix();

            nodes[first].x = 0;
            nodes[first].y = 0;//set first node
            visited[first] = true;

            //console.log(nodes, links, matrix);

            for(var i = 1; i < newNodes.length; i++){
                link = newNodes[i].node;
                overlap = listFilter(links[link], function(item){
                    return item.node in visited;//TODO: 邻接矩阵访问模式
                }).sort(function(a, b){
                    return b.value - a.value;
                });
                if(overlap.length === 0){
                    console.log("error");
                }
                //cal a and b circle points
                points = this.union(matrix[link], overlap);
                
                //loss points
                var point = points[0],
                    best = 1e50,
                    loss;
                for(var j = 0; j < points.length; j++){
                    nodes[link].x = points[j].x;
                    nodes[link].y = points[j].y;
                    loss = this.loss();
                    if(loss < best){
                        best = loss;
                        point = points[j];
                    }
                }
                //best point to nodes
                visited[link] = true;
                nodes[link].x = point.x;
                nodes[link].y = point.y;
            }
        },
        union: function(matrix, overlap){
            var nodes = this.nodes;
            var points = [];

            for(var j = 0; j < overlap.length; j++){
                var node = overlap[j].node,
                    p1 = nodes[node],
                    m1 = matrix[node];
                points.push(
                    {x: p1.x + m1, y: p1.y},
                    {x: p1.x - m1, y: p1.y},
                    {x: p1.x, y: p1.y + m1},
                    {x: p1.x, y: p1.y - m1}
                );
                for(var k = j + 1; k < overlap.length; k++){
                    var o = overlap[k].node,
                        p2 = nodes[o],
                        m2 = matrix[o];
                    intersectedPoints(
                      {x: p1.x, y: p1.y},//a circle
                      {x: p2.x, y: p2.y},
                      m1,
                      m2
                    ).forEach(function(item){
                        points.push(item);
                    });
                }
            }
            return points;
        },
        matrix: function(){
            var nodes = this.nodes,
                overlaps = this.overlaps;

            var length = nodes.length,
                matrix = [];//new Array(length);//.fill(new Array(length).fill(0));

            for(var i = 0; i < length; i++){
                matrix.push([]);
                for(var j = 0; j < length; j++){
                    matrix[i].push(0);
                }
            }
            length = overlaps.length;
            for(i = 0; i < length; i++){
                var id = overlaps[i];
                if(id.sets.length !== 2)
                    continue;
                var a = id.sets[0], b = id.sets[1];
                var r1 = Math.sqrt(nodes[a].value / Math.PI),
                    r2 = Math.sqrt(nodes[b].value / Math.PI);
                var distance = Math.min(r1, r2) * Math.min(r1, r2) * Math.PI;
                var value = id.value;
                if(distance <= value){
                    distance = Math.abs(r2 - r1);
                }
                else{
                    distance = this.bisect(0, r1 + r2, function(d){
                        return Overlap.overlap(r1, r2, d) - value;
                    });
                }
                matrix[a][b] = matrix[b][a] = distance;//邻接矩阵
            }
            return matrix;
        },
        loss: function(nodes){
            var overlaps = this.overlaps;
            var loss = 0;
            nodes = nodes || this.nodes;
            for(var i = 0; i < overlaps.length; i++){
                var overlap = overlaps[i],
                    lap;

                if(overlap.sets.length === 2){
                  var a = nodes[overlap.sets[0]],
                      b = nodes[overlap.sets[1]];
                  var distance = Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
                  lap = Overlap.overlap(a.radius, b.radius, distance);
                }
                else{
                    //mutip sets
                    lap = Union.area(overlap.sets.map(function(i){
                        return nodes[i];
                    }));
                }
                //console.log(a, b)
                loss += (lap - overlap.value) * (lap - overlap.value);//lossFunction = ∑ (actualOverlapi - desiredOverlapi )^2 )
            }
            return loss;
        },
        //逼近
        bisect: function(a, b, callback){
            var maxInterations = 100,
                min = 1e-10,
                mid;
            var fA = callback(a),
                fB = callback(b),
                fM;
            var delta = b - a;
            if(fA * fB > 0){
                throw "points";
            }
            if(fA === 0) return a;
            if(fB === 0) return b;

            for(var i = 0; i < maxInterations; i++){
                delta /= 2;
                mid = a + delta;
                fM = callback(mid);
                if(fM * fA >= 0)
                    a = mid;
                if((Math.abs(delta) < min) || (fM === 0)){
                    return mid;
                }
            }
            return a + delta;
        },
        scale: function(width, height, padding){
            var nodes = this.nodes;
            var me = this;

            padding = padding || 1;

            var minMax = function(d){
                var max = Math.max.apply(Math, nodes.map(function(item){ return item[d] + item.radius; })),
                    min = Math.min.apply(Math, nodes.map(function(item){ return item[d] - item.radius; }));
                return {
                    min: min,
                    max: max
                };
            };

            //width -= 2*padding;
            //height -= 2*padding;

            var xRange = minMax("x"),
                yRange = minMax("y");
            var scaling = Math.min(
                width  / (xRange.max - xRange.min),
                height / (yRange.max - yRange.min)
            );

            nodes.forEach(function(item){
                item.radius = scaling * item.radius;
                item.x = padding + (item.x - xRange.min) * scaling;
                item.y = padding + (item.y - yRange.min) * scaling;
                me.width = Math.max(me.width, item.x + item.radius);
                me.height = Math.max(me.height, item.y + item.radius);
            });
            return this;
        },
        translate: function(x, y){
            this.nodes.forEach(function(item){
                item.x += (+x || 0);
                item.y += (+y || 0);
            });
        },
        shapes: function(series, options){
            var nodes = this.nodes,
                overlaps = this.overlaps;
            var shapes = [],
                deep = nodes.length;
            nodes.forEach(function(item, i){
                item.color = options.colors[i % options.colors.length];
            });
            overlaps.forEach(function(item){
                var maps = item.sets.map(function(i){ return nodes[i]; });
                Union.area(maps);
                var arcs = Union.arcs;
                if(arcs.length){
                    var moveX = arcs[0].p2.x,
                        moveY = arcs[0].p2.y;
                    var paths = [[moveX, moveY]];
                    
                    var arc = {
                        x: moveX,
                        y: moveY,
                        type: "arc"
                    };
                    
                    var rgba;
                    var name;
                    arcs.forEach(function(item){
                        var r = item.node.radius,
                            wide = item.width > r;                            
                        paths.push([r, r, 0, wide ? 1 : 0, 1, item.p1.x, item.p1.y]);

                        moveX = item.p1.x;
                        moveY = item.p1.y;

                        var sourceColor = Color.parse(item.p1.source.color);
                        var targetColor = Color.parse(item.p1.target.color);
                        
                        var sCR = sourceColor.r,
                            sCG = sourceColor.g,
                            sCB = sourceColor.b;
                            //sCA = Color.alpha(sourceColor);
                        var tCR = targetColor.r,
                            tCG = targetColor.g,
                            tCB = targetColor.b;
                        var addR = sourceColor.add(sCR, tCR),
                            addG = sourceColor.add(sCG, tCG),
                            addB = sourceColor.add(sCB, tCB);
                        rgba = Color.toString(0xff * 0.5 << 24 | addR << 16 | addG << 8 | addB);
                        name = item.p1.source.name + " & " + item.p1.target.name;
                    });
                    arc.name = name;
                    arc.value = item.value;
                    arc.path = paths;
                    arc.deep = deep++;//max
                    arc.color = rgba;
                    //console.log(rgba);
                    
                    shapes.push(arc);
                }
            });
            nodes.forEach(function(item, i){
                item.type = "circle";
                item.deep = i;
                shapes.push(item);
            });
            //console.log(shapes);
            return shapes;
        }
    };

    //reset deep
    function resetDeep(shapes){
        shapes.sort(function(a, b){ return a.deep - b.deep; });
    }
    

    function Venn(canvas, options){
        this.type = "venn";

        this.canvas = canvas;
        this.context = canvas.getContext("2d");

        this.series = [];
        this.shapes = [];
        this.init(options);
    }
    Venn.prototype = {
        constructor: Venn,
        init: function(options){
            var type = this.type;
            this.options = extend({}, options);
            this.series = arrayFilter(options.series, function(series){
                return series.type === type;
            });
            
            var venn = new Venn.Layout(type, this.series, this.options);
            this.shapes = venn.shapes;
            this.layout = venn;
        },
        draw: function(){
            var context = this.context,
                chart = this;
            this.shapes.forEach(function(series){
                var dataLabels = series.dataLabels || {},
                    style = dataLabels.style || {},
                    fontStyle = {
                        fontStyle: pack("string", style.fontStyle, "normal"),
                        fontWeight: pack("string", style.fontWeight, "normal"),
                        fontSize: pack("string", style.fontSize, "12px"),
                        fontFamily: pack("string", style.fontFamily, "Arial"),
                        lineHeight: pack("string", style.lineHeight, "normal"),
                        color: style.color || "#000"
                    };
                var shapes = series.shapes;
                shapes.forEach(function(shape){
                    chart.drawShape(context, shape, series);
                });
                if(dataLabels.enabled !== false){
                    shapes.forEach(function(item){
                        if(item.type === "circle"){
                            context.font = [
                                fontStyle.fontStyle,
                                fontStyle.fontWeight,
                                fontStyle.fontSize + "/" + fontStyle.lineHeight,
                                fontStyle.fontFamily || "Arial"
                            ].join(" ");
                            context.fillStyle = fontStyle.color;
                            context.fillText(item.name, item.x, item.y);
                        }
                    });
                }
            });
        },
        redraw: function(){
            this.shapes = this.layout.subgroup();
            this.draw();
        },
        animateTo: function(time, context){
            this.draw(context);
        },
        drawShape: function(context, shape, item){
            var dataLabels = item.dataLabels || {},
                style = dataLabels.style || {};
            context.save();
            context.beginPath();
            context.fillStyle = shape.color;
            if(shape.type === "circle"){
                context.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2, true);
            }
            else if(shape.type === "arc"){
                arcTo(context, shape.path);
            }
            context.fill();
            if(context !== this.context){
                this.shapes.forEach(function(item){
                    item.shapes.forEach(function(item){
                        if(item.type === "circle"){
                            context.font = [
                                "normal",
                                style.fontWeight || "normal",
                                style.fontSize,
                                style.fontFamily || "Arial"
                            ].join(" ");
                            context.fillStyle = style.color;
                            context.fillText(item.name, item.x, item.y);
                        }
                    });
                });
            }
            context.restore();
        },
        getShape: function(x, y){
            var series = this.shapes,
                shapes,
                shape,
                item,
                index = -1;
            var context = this.context;
            var ret = [];
            x *= DEVICE_PIXEL_RATIO, y *= DEVICE_PIXEL_RATIO;
            

            for(var j = 0; j < series.length; j++){
                index = -1;
                item = series[j];
                shapes = item.shapes;
                    
                shapes.sort(function(a, b){ return b.deep - a.deep; });
            
                for(var i = 0; i < shapes.length; i++){
                    shape = shapes[i];
                        
                    context.beginPath();
                    if(shape.type === "circle"){
                        context.arc(shape.x, shape.y, shape.radius, 0, PI2, true);
                    }
                    else if(shape.type === "arc"){
                        arcTo(context, shape.path);
                    }
                    //context.stroke();
                    //var distance = Math.sqrt((x - shape.x) * (x - shape.x) + (y - shape.y) * (y - shape.y));
                    if(context.isPointInPath(x, y)){
                        //distance < shape.radius
                        shape.$value = shape.value;
                        ret.push({shape: shape, series: item});
                        index = i;
                        break;
                    }
                }
                if(index !== -1){
                    var temp = shapes[shapes.length - 1];
                    shapes[shapes.length - 1] = (shape = shapes[index]);
                    shapes[index] = temp;
                }
                else{
                    resetDeep(shapes);//no selected, initial deep
                }
            }
            return ret;
        }
    };
    Venn.Layout = function(type, series, options){
        this.series = series;
        this.shapes = [];

        this.type = type;
        this.options = options;

        this.init();
    };
    Venn.Layout.prototype = {
        init: function(){
            this.shapes = this.subgroup();
        },
        subgroup: function(){
            var options = this.options,
                type = this.type;
            var series = this.series;
            
            options.panel.forEach(function(pane){
                var series = arrayFilter(pane.series, function(series){
                    return series.type === type && series.selected !== false;
                });
                series.forEach(function(series){
                    var //plotX = pack("number", series.plotX, 0),
                        plotY = pack("number", series.plotY, 0),
                        plotHeight = pack("number", series.plotHeight, 0),
                        plotWidth = pack("number", series.plotWidth, 0);

                    var subset = new Subset(series.data);
                        //nodes = subset.nodes;
                    var radius = series.size,
                        cx = series.x,
                        cy = series.y;
                    if(isNumber(radius)){
                        plotWidth = radius;
                        plotHeight = radius;
                    }
                    subset.scale(plotWidth, plotHeight);
                    !isNumber(cx) && (cx = (plotWidth - subset.width) / 2);
                    !isNumber(cy) && (cy = plotY + (plotHeight - subset.height) / 2);
                    
                    subset.translate(cx, cy);
                    //subset.scale(options.chart.width, options.chart.height);
                    series.shapes = subset.shapes(series, options);//me.shapes;
                    resetDeep(series.shapes);
                });
            });
            return series;
        }
    };

    (Chart.graphers = Chart.graphers || {}).venn = Chart.Venn = Venn;
    
})(typeof window !== "undefined" ? window : this, Dalaba.Chart);;
    (function(global, Chart){
    var listFilter = List.filter,
        listFill = List.fill;
    var relayout = (function(global){

    var xy = function(a, b, c, d){
        return function(x){
            return interpolate(x, a, b, c, d);
        };
    };
    var getData = function(item){
        var value = item;
        if(isObject(item)){
            value = [item.x, item.y, item.value, item.color];
        }
        else if(isNumber(item)){
            value = [item];
        }
        return value;
    };

    function factoy(Numeric){
        var interpolate = Numeric.interpolate;

        return function(type, options) {
            var getXY = function(shape, f0, f1){
                var x, y, data, value;
                data = getData(shape.source);
                x = data[0], y = data[1], value = data[2];
                
                x = f0(x);
                y = f1(y);
                return {x: x, y: y, value: value};
            };
            var addCircle = function(shape, series, f0, f1, f2){
                var radius = series.radius;
                var x = getXY(shape, f0, f1),
                    y = x.y,
                    value = x.value;
                x = x.x;

                extend(shape, {
                    x0: x - radius / 2,
                    y0: y - radius / 2,
                    x1: x + radius,
                    y1: y + radius,
                    width: radius,
                    height: radius,
                    blur: series.blur,
                    alpha: f2(value, series.minValue, series.maxValue)
                });
            };
            var addRect = function(shape, series, f0, f1, f2){
                var tickWidth = series.tickWidth, tickHeight = series.tickHeight;
                var x = getXY(shape, f0, f1),
                    y = x.y,
                    value = x.value;
                x = x.x;
                extend(shape, {
                    x0: x,
                    y0: y,
                    x1: x + tickWidth,
                    y1: y + tickHeight,
                    width: tickWidth,
                    height: tickHeight,
                    color: f2(value, series.minValue, series.maxValue)
                });
            };
            options.panel.forEach(function(pane){
                var series = arrayFilter(pane.series, function(series){
                    return series.type === type;
                });
                var newData = partition(series, function(a, b){
                    return a.radius !== null && b.radius !== null;
                });
                newData.forEach(function(item){
                    item.forEach(function(series){
                        var plotX = pack("number", series.plotX, 0),
                            plotY = pack("number", series.plotY, 0),
                            plotWidth = pack("number", series.plotWidth, 0),
                            plotHeight = pack("number", series.plotHeight, 0);
                        var coordinate = series.coordinate,
                            shapes = series.shapes;
                        var xAxisOptions = series._xAxis || {},
                            yAxisOptions = series._yAxis || {},
                            maxValue = yAxisOptions.maxValue,
                            minValue = yAxisOptions.minValue;
                        var minX = pack("number", xAxisOptions.plot.x[0], minValue, 0),
                            maxX = pack("number", xAxisOptions.plot.x[1], maxValue, 0),
                            minY = pack("number", yAxisOptions.plot.y[0], minValue, 0),
                            maxY = pack("number", yAxisOptions.plot.y[1], maxValue, 0);

                        var colorAxisOptions = series._colorAxis || {},// colorAxis[series.colorAxis | 0],
                            stops = colorAxisOptions.stops || [[0, "#313695"], [1, "#a50026"]],
                            domain = [],
                            range = [],
                            lerp;
                                    
                        if(isArray(stops)){
                            stops.forEach(function(stop){
                                domain.push(stop[0]);
                                range.push(stop[1]);
                            });
                            lerp = Color.lerp(domain, range, Color.interpolate);
                        }
                        var tickWidth = plotWidth / ((maxX - minX) + 1),
                            tickHeight = plotHeight / ((maxY - minY) + 1);
                        
                        shapes.forEach(function(shape, i){
                            if(defined(coordinate) || isObject(shape.source)){
                                addCircle(shape, {
                                    minValue: series.minValue,
                                    maxValue: series.maxValue,
                                    radius: pack("number", shape.radius, series.radius, 0.1),
                                    blur: pack("number", series.blur, 0.05)
                                }, function(x){
                                    return xy(xAxisOptions.minValue, xAxisOptions.maxValue, 0, plotWidth)(x) + plotX;
                                }, function(x){
                                    return xy(yAxisOptions.minValue, yAxisOptions.maxValue, 0, plotHeight)(x) + plotY;
                                }, function(x, min, max){
                                    return Math.max((x - min) / (max - min), 0.01) || 0;
                                });
                            }
                            else{
                                if(isArray(shape.source)){
                                    addRect(shape, {
                                        minValue: yAxisOptions.plot.value[0],
                                        maxValue: yAxisOptions.plot.value[1],
                                        tickWidth: tickWidth,
                                        tickHeight: tickHeight
                                    }, function(x){
                                        return xy(minX, maxX + 1, 0, plotWidth)(x) + plotX;
                                    }, function(x){
                                        return xy(minY - 1, maxY, plotHeight, 0)(x) + plotY;
                                    }, function(x, min, max){
                                        return (lerp && isNumber(x)) ? lerp(interpolate(x, min, max, 0, 1)) : "#000";
                                    });
                                }
                                else{
                                    maxX = pack("number", xAxisOptions.categories && xAxisOptions.categories.length, 6);
                                    maxY = pack("number", yAxisOptions.categories && yAxisOptions.categories.length, 5);
                                    tickWidth = plotWidth / (maxX);
                                    tickHeight = plotHeight / (maxY);

                                    addRect(shape, {
                                        minValue: yAxisOptions.plot.value[0],
                                        maxValue: yAxisOptions.plot.value[1],
                                        tickWidth: tickWidth,
                                        tickHeight: tickHeight
                                    }, function(){
                                        return xy(0, maxX, 0, plotWidth)(i % maxX) + plotX;
                                    }, function(){
                                        return xy(-1, maxY - 1, plotHeight, 0)(i % maxY) + plotY;
                                    }, function(x, min, max){
                                        return (lerp && isNumber(shape.value)) ? lerp(interpolate(shape.value, min, max, 0, 1)) : "#000";
                                    });
                                }
                            }
                        });
                    });
                });
            });
        };
    }
    return {
        deps: function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
}).call(typeof window !== "undefined" ? window : this).deps(Numeric);

    var Renderer = {
        gradient: function(fillColor){
            var canvas = document.createElement("canvas"),
                context = canvas.getContext("2d");
            var color, linearGradient;
            canvas.width = 256;
            canvas.height = 1;
            //Chart.scale(context, width, height, 1);
            if(defined(fillColor)){
                if(Color.isColor(fillColor)){
                    color = fillColor;
                }
                else if(defined(linearGradient = fillColor.linearGradient)){
                    var x1 = (linearGradient.x1 | 0),
                        y1 = (linearGradient.y1 | 0),
                        x2 = (linearGradient.x2 | 0),
                        y2 = (linearGradient.y2 | 0);
                    color = context.createLinearGradient(x1, y1, x2, y2);
                    (fillColor.stops).forEach(function(item){
                        color.addColorStop(item[0], item[1]);
                    });
                }
            }
            context.fillStyle = color;
            context.fillRect(0, 0, 256, 1);
            return context.getImageData(0, 0, 256, 1).data;
        },
        node: function(radius, blur){
            //var r2 = radius + radius * blur;
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            //canvas.width = canvas.height = radius * 2;
            Chart.scale(context, radius, radius, DEVICE_PIXEL_RATIO);

            if(blur == 1){
                context.fillStyle = "rgba(0,0,0,1)";
                context.beginPath();
                context.arc(radius / 2, radius / 2, radius / 2, 0, 2 * Math.PI, true);
                context.closePath();
                context.fill();
            }
            else{
                var g = context.createRadialGradient(
                    radius / 2, radius / 2,//start cx & cy
                    radius / 2 * blur,//start r
                    radius / 2, radius / 2,//end cx & cy
                    radius / 2//end r
                );
                g.addColorStop(0, "rgba(0,0,0,1)");
                g.addColorStop(1, "rgba(0,0,0,0)");
                context.fillStyle = g;
                context.fillRect(0, 0, radius, radius);
            }
            return canvas;
        },
        shadow: function(shapes, series, width, height){
            var canvas = document.createElement("canvas"),
                context = canvas.getContext("2d");
            var nodeCache = {};

            Chart.scale(context, width, height, DEVICE_PIXEL_RATIO);
            
            shapes.forEach(function(shape){
                var x = shape.x0,
                    y = shape.y0,
                    radius = shape.radius || series.radius || 0.1,
                    blur = series.blur || 0.05;
                var node;
                if(!nodeCache[radius]){
                    node = nodeCache[radius] = Renderer.node(radius, blur);
                }
                else
                    node = nodeCache[radius];
                
                context.globalAlpha = shape.alpha;
                //context.fillRect(0, 0, shadow.width, shadow.height);
                /*context.beginPath();
                context.arc(x + viewport.left, y + viewport.top, radius, 0, Math.PI * 2);
                context.fill();*/
                context.drawImage(
                    node,
                    x,
                    y,
                    node.width / DEVICE_PIXEL_RATIO,
                    node.height / DEVICE_PIXEL_RATIO
                );
            });
            return canvas;
        },
        buffer: function(canvas, series){
            var opacity = 0;
            var useGradient = false;
            var context = canvas.getContext("2d");

            var colors = Renderer.gradient(series.fillColor);

            var buffer = context.getImageData(0, 0, canvas.width, canvas.height);
            var pixels = buffer.data,
                length = pixels.length;
            
            for(var i = 3; i < length; i += 4){
                var pixel = pixels[i];
                var index = pixel << 2;
                if(index){
                    var r = colors[index],
                        g = colors[index + 1],
                        b = colors[index + 2],
                        a;
                    if(opacity > 0){
                        a = opacity;
                    }
                    else{
                        a = Math.min(0xff, Math.max(pixel, 0));
                    }
                    pixels[i] = useGradient ? colors[index + 3] : a;//a
                    pixels[i - 1] = b;
                    pixels[i - 2] = g;
                    pixels[i - 3] = r;
                }
            }
            //buffer.data = pixels;
            context.putImageData(buffer, 0, 0);
            return canvas;
        }
    };

    function Heatmap(canvas, options){
        this.type = "heatmap";

        this.canvas = canvas;
        this.context = canvas.getContext("2d");

        this.series = [];
        this.init(options);
    }
    Heatmap.prototype = {
        constructor: Heatmap,
        init: function(options){
            var type = this.type;
            this.options = extend({}, options);
            this.series = listFilter(pack("array", options.series, []), function(series){
                return series.selected !== false && series.type === type;
            });
            this.tables = new Array(listFill(Math.ceil(options.chart.width), []));
            
            relayout(type, this.options);
        },
        draw: function(){
            var context = this.context,
                chart = this;
            var options = this.options;
            var width = options.chart.width,
                height = options.chart.height,
                left = options.chart.spacing[3],
                top = options.chart.spacing[0];

            this.series.forEach(function(series){
                var shapes = series.shapes;
                if(defined(series.coordinate) || isObject(shapes[0].source)){
                    var shadow = Renderer.buffer(
                        Renderer.shadow(shapes, series, width + left, height + top),
                        series
                    );
                    context.save();
                    context.drawImage(
                        shadow,
                        0,
                        0,
                        shadow.width / DEVICE_PIXEL_RATIO,
                        shadow.height / DEVICE_PIXEL_RATIO
                    );
                    context.restore();
                }
                else{
                    shapes.forEach(function(shape){
                        chart.drawShape(context, shape, series);
                    });
                    shapes.forEach(function(shape){
                        chart.dataLabels(context, shape, series);
                    });
                }
            });
        },
        redraw: function(){
            relayout(this.type, this.options);
            this.draw();
        },
        drawShape: function(context, shape, series){
            var x0 = shape.x0,
                y0 = shape.y0,
                x1 = shape.x1,
                y1 = shape.y1;
            var setBorder = function(borderWidth, borderColor){
                context.beginPath();
                context.lineWidth = borderWidth;
                context.strokeStyle = borderColor;
                context.moveTo(x0 + borderWidth / 2, y0);
                context.lineTo(x0 + borderWidth / 2, y1 - borderWidth / 2);//bottom
                context.lineTo(x1 - borderWidth / 2, y1 - borderWidth / 2);//right
                context.lineTo(x1 - borderWidth / 2, y0 + borderWidth / 2);//top
                context.lineTo(x0 + borderWidth / 2, y0 + borderWidth / 2);//left
                context.stroke();
            };
            if(shape.value === null){
                return;
            }
            var color = shape.color;
            if(isObject(color) && defined(color.stops) && isArray(color.stops)){
                var linearGradient = context.createLinearGradient(Math.abs(x1 - x0), y1, Math.abs(x1 - x0), y0);
                color.stops.forEach(function(item){
                    if(isNumber(item[0]) && typeof item[1] === "string")
                        linearGradient.addColorStop(item[0], item[1]);
                });
                color = linearGradient;
            }
            
            context.save();
            context.fillStyle = color;
            context.beginPath();
            context.moveTo(x0, y0);
            context.lineTo(x0, y1);
            context.lineTo(x1, y1);
            context.lineTo(x1, y0);
            context.lineTo(x0, y0);
            //context.fillRect(x0, y0, Math.abs(x0 - x1), Math.abs(y1 - y0));
            context.fill();
            if(defined(shape.current)){
                setBorder(series.borderWidth || 1, series.borderColor);
            }
            if(defined(series.borderWidth) && series.borderWidth > 0){
                setBorder(series.borderWidth, series.borderColor);
            }
            context.restore();
        },
        dataLabels: function(context, shape, series){
            dataLabels.align(function(type, bbox){
                var t = pack("string", type, "center");
                var w = bbox.width,
                    w2 = Math.abs(shape.x1 - shape.x0);
                return {
                    left: shape.x0,
                    center: shape.x0 + (w2 / 2) - w / 2,
                    right: shape.x1 - w
                }[t];
            }).vertical(function(type, bbox){
                var t = pack("string", type, "middle");
                var h = bbox.height,
                    h2 = Math.abs(shape.y1 - shape.y0);
                return {
                    top: shape.y0 + h,
                    middle: shape.y0 + h + (h2 - h) / 2,
                    bottom: shape.y1
                }[t];
            }).call(shape, series, context);
        },
        getShape: function(x, y){
            var series = this.series,
                length = series.length,
                shapeLength;
            var shapes, shape, item;
            var ret = [];
            function reset(shapes){
                shapes.forEach(function(item){
                    delete item.current;
                });
            }
            //[i / M + i % N]
            //var xy = ~~(x / width + y % height);
            if(defined(this.tables[x]) && defined(this.tables[x][y]))
                return this.tables[x][y];

            for(var i = 0; i < length; i++){
                item = series[i];
                reset(shapes = item.shapes);
                shapeLength = shapes.length;
                for(var j = 0; j < shapeLength; j++){
                    shape = shapes[j];
                    if(shape.value === null){
                        continue;
                    }
                    if(Intersection.rect(
                        {x: x, y: y},
                        {x: shape.x0, y: shape.y0, width: shape.x1, height: shape.y1}
                    )){
                        shape.current = j;
                        if(isNumber(shape._x) && isNumber(shape._y)){
                            shape.$value = shape._x + ", " + shape._y + ", " + shape.value;
                        }
                        else{
                            shape.$value = shape.value;
                        }
                        ret.push({
                            shape: shape,
                            series: item
                        });
                        if(defined(this.tables[x]))
                            this.tables[x][y] = ret;
                        return ret;                        
                    }
                }
            }
            return ret;
        }
    };

    (Chart.graphers = Chart.graphers || {}).heatmap = Chart.Heatmap = Heatmap;
})(typeof window !== "undefined" ? window : this, Dalaba.Chart);;
    (function(global, Chart){
    var Layout = (function(global){

    function factoy(){
        var Layout = {};

        Layout = {
            shapes: function(type, options){
                options.panel.forEach(function(pane){
                    var series = arrayFilter(pane.series, function(series){
                        return series.type === type;
                    });
                    series.forEach(function(series){
                        var plotX = pack("number", series.plotX, 0),
                            plotY = pack("number", series.plotY, 0),
                            plotWidth = pack("number", series.plotWidth),
                            plotHeight = pack("number", series.plotHeight);
                        var shapes = series.shapes,
                            shape;
                        var length = shapes.length,
                            j;
                        var tickWidth = plotWidth / length,
                            pointWidth = tickWidth / 2,
                            center = (tickWidth - pointWidth) / 2;
                        var color;


                        var yAxisOptions = series._yAxis || {},
                            yminValue = yAxisOptions.minValue,
                            ymaxValue = yAxisOptions.maxValue;
                       
                        var x, y, x1, y1, x2, y2, y3;
                        var open, close, high, low;//open, close, high, low
                        for(j = 0; j < length; j++){
                            shape = shapes[j];
                            color = shape.color;
                            x = plotX + j * tickWidth + center;
                            x1 = x + pointWidth;
                            x2 = x1 - pointWidth / 2;
                            if(isArray(shape.source)){
                                open = shape.source[0], close = shape.source[1];
                                high = shape.source[2], low = shape.source[3];
                            }
                            else if(isObject(shape.source)){
                                open = shape.source.open, close = shape.source.close;
                                high = shape.source.high, low = shape.source.low;
                            }
                            else open = close = high = low = 0;
                            
                            y = interpolate(open, yminValue, ymaxValue, plotHeight, 0) + plotY;//open
                            y1 = interpolate(close, yminValue, ymaxValue, plotHeight, 0) + plotY;//close
                            y2 = interpolate(high, yminValue, ymaxValue, plotHeight, 0) + plotY;//high
                            y3 = interpolate(low, yminValue, ymaxValue, plotHeight, 0) + plotY;//low
                            if(series.selected === false){
                                y = y1 = y2 = y3 = -9999;
                            }
                            extend(shape, {
                                x: x,
                                y: y,
                                x1: x1,
                                y1: y1,
                                x2: x2,
                                y2: y2,
                                x3: x2,
                                y3: y3,
                                index: j,
                                color: Color.isColor(color) ? color : (open > close) ? color[0] : color[1]
                            });
                        }
                    });
                });
            }
        };
        return Layout;
    }
    return {
        deps: function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
}).call(typeof window !== "undefined" ? window : this).deps(Dalaba);

    var isInside = function(x, y, series){
        return !(
            x < pack("number", series.plotX, 0) ||
            x > series.plotWidth + pack("number", series.plotX, 0) ||
            y < pack("number", series.plotY, 0) ||
            y > series.plotHeight + pack("number", series.plotY, 0)
        );
    };
    var xClip = function(t, context, canvas, x, y){
        if(0 !== t){
            context.save();
            t > 0 && context.drawImage(
                canvas,
                x, y, canvas.width * t, canvas.height,
                x, y, canvas.width * t / DEVICE_PIXEL_RATIO, canvas.height / DEVICE_PIXEL_RATIO
            );
            context.restore();
        }
    };

    function K(canvas, options){
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.type = "candlestick";
        
        this.series = [];
        this.init(options);
    }
    K.prototype = {
        constructor: K,
        init: function(options){
            var canvas = this.canvas,
                type = this.type,
                chart = this;
            this.options = extend({}, options);
            this.series = arrayFilter(pack("array", options.series, []), function(series){
                var filter = series.type === type;
                return filter && (
                    series._diffValues = List.diff(series.shapes, series._shapes || [], function(a, b){
                        return a && b && a.open === b.open && a.close === b.close && a.low === b.low && a.high === b.high;
                    }),
                filter);
            });
            Layout.shapes(type, options);

            if(canvas.nodeType === 1){
                this.series.forEach(function(series){
                    if(series.animationEnabled){
                        var image = document.createElement("canvas"),
                            context = image.getContext("2d");
                        Chart.scale(
                            context,
                            pack("number", series.plotWidth + series.plotX, canvas.width),
                            pack("number", series.plotHeight + series.plotY, canvas.height),
                            DEVICE_PIXEL_RATIO
                        );
                        series._image = image;
                        series.shapes.forEach(function(shape){
                            chart.drawShape(context, shape, series);
                        });
                    }
                });
            }
        },
        draw: function(){
            var context = this.context,
                chart = this;
            this.series.forEach(function(series){
                var shapes = series.shapes;
                shapes.forEach(function(shape){
                    chart.drawShape(context, shape, series);
                });
            });
        },
        redraw: function(){
            Layout.shapes(this.type, this.options);
            this.draw();
        },
        drawShape: function(context, shape, series){
            var x = shape.x, y = shape.y,
                x1 = shape.x1, y1 = shape.y1,
                x2, y2 = shape.y2,
                y3 = shape.y3,
                w = Math.round(shape.x1 - shape.x);
            var lineWidth = pack("number", shape.lineWidth, series.lineWidth, 1),
                fillColor = shape.fillColor || series.fillColor || shape.color || series.color,
                borderColor = shape.color || series.color,
                lineColor = shape.lineColor || series.lineColor;
            var isUP = y1 > y,
                linePixel;

            x2 = x + w / 2;
            if(isNumber(shape.current) && shape.current > -1){
                lineWidth = Math.max(1, Math.min(lineWidth, 1) * 2);
            }
            delete shape.current;
            linePixel = fixPixelHalf(x, y, x1, y1, lineWidth);

            x = linePixel[0], y = linePixel[1];
            x1 = linePixel[2], y1 = linePixel[3];
            x2 = fixPixelHalf(x2, lineWidth || 1)[0];

            var addStroke = function(lineWidth, color){
                (context.lineWidth = lineWidth) > 0 && (
                    context.strokeStyle = Color.isColor(color) ? color : isUP ? color[0] : color[1],
                    context.stroke()
                );
            };
            if(series.selected !== false && !lineWidth && y === y1){
                y1 += 1;
            }

            context.save();
            context.beginPath();
            context.moveTo(x, y);//open
            context.lineTo(x, y1);//close
            context.lineTo(x + w, y1);//close
            context.lineTo(x + w, y);//open
            context.lineTo(x, y);
            //context.rect(x, y, w, y1 - y);
            context.fillStyle = fillColor;
            context.fill();
            addStroke(lineWidth, borderColor);
            //high
            context.beginPath();
            context.moveTo(x2, isUP ? y : y1);//open
            context.lineTo(x2, y2);
            addStroke(lineWidth || 1, lineColor);

            //low
            context.beginPath();
            context.moveTo(x2, !isUP ? y : y1);//close
            context.lineTo(x2, y3);
            addStroke(lineWidth || 1, lineColor);
            
            context.restore();
        },
        animateTo: function(context, initialize){
            var chart = this;
            var shapes = [];
            chart.series.forEach(function(series){
                var newData = series.shapes,
                    oldData = series._shapes || [];
                var animators = [];
                if(initialize === true){
                    var mergeShape = series;
                    shapes.push([series, function(timer){
                        mergeShape._timer = timer;
                    }]);
                    animators.push(mergeShape);
                }
                else{
                    series._diffValues.add(function(){
                        //var oldShape = oldData[newIndex],
                        //    mergeShape;
                        return null;
                    }).remove(function(newIndex){
                        var newShape = newData[newIndex],
                            mergeShape;
                        mergeShape = {
                            color: newShape.color,
                            isNULL: newShape.isNULL
                        };
                        shapes.push([newShape, function(timer){
                            mergeShape.x = newShape.x, mergeShape.y = newShape.y;
                            mergeShape.x1 = newShape.x1;
                            mergeShape.x2 = newShape.x2, mergeShape.y2 = newShape.y2;
                            mergeShape.y3 = newShape.y3;
                            mergeShape.y1 = newShape.y + (newShape.y1 - newShape.y) * timer;
                        }]);
                        return mergeShape;
                    }).modify(function(newIndex, oldIndex){
                        var newShape = newData[newIndex],
                            oldShape = oldData[oldIndex],
                            mergeShape;
                        var action = series.action;
                        if(newShape && oldShape){
                            mergeShape = {
                                x: oldShape.x,
                                y: oldShape.y,
                                x1: oldShape.x1,
                                y1: oldShape.y1,
                                y2: oldShape.y2,
                                y3: oldShape.y3,
                                color: newShape.color,
                                isNULL: newShape.isNULL
                            };

                            shapes.push([newShape, function(timer){
                                var y1;
                                if(action === "click"){
                                    if(series.selected !== false){
                                        y1 = newShape.y + (newShape.y1 - newShape.y) * timer;
                                        mergeShape.x = newShape.x, mergeShape.y = newShape.y;
                                        mergeShape.x1 = newShape.x1;
                                        mergeShape.x2 = newShape.x2, mergeShape.y2 = newShape.y2;
                                        mergeShape.y3 = newShape.y3;
                                        mergeShape.y1 = y1;
                                    }
                                    else{
                                        y1 = oldShape.y1 + (oldShape.y - oldShape.y1) * timer;
                                        mergeShape.x = oldShape.x, mergeShape.y = oldShape.y;
                                        mergeShape.x1 = oldShape.x1;
                                        mergeShape.x2 = oldShape.x2, mergeShape.y2 = oldShape.y2;
                                        mergeShape.y3 = oldShape.y3;
                                        mergeShape.y1 = y1;
                                    }
                                }
                                else{
                                    mergeShape.x = oldShape.x + (newShape.x - oldShape.x) * timer;
                                    mergeShape.y = oldShape.y + (newShape.y - oldShape.y) * timer;
                                    mergeShape.x1 = oldShape.x1 + (newShape.x1 - oldShape.x1) * timer;
                                    mergeShape.y1 = oldShape.y1 + (newShape.y1 - oldShape.y1) * timer;
                                    mergeShape.y2 = oldShape.y2 + (newShape.y2 - oldShape.y2) * timer;
                                    mergeShape.y3 = oldShape.y3 + (newShape.y3 - oldShape.y3) * timer;
                                }
                            }]);
                        }
                        return mergeShape;
                    }).each(function(mergeShape){
                        mergeShape && animators.push(mergeShape);
                    });
                }
                series._shapes = series.shapes;
                series._animators = animators;
            });
            return shapes;
        },
        onFrame: function(context, initialize){
            var chart = this;
            this.series.forEach(function(series){
                var animators = series._animators;
                if(initialize === true){
                    animators.forEach(function(series){
                        series._image && xClip(series._timer, context, series._image, 0, 0);
                    });
                }
                else{
                    animators.forEach(function(shape){
                        chart.drawShape(context, shape, series);
                    });
                }
            });
        },
        getShape: function(x, y){
            var length = this.series.length,
                i = 0;
            var series, shapes, shape;
            var kdtree;
            var reset = function(shapes){
                shapes.forEach(function(item){
                    delete item.current;
                });
            };
            var results = [];

            for(; i < length && (series = this.series[i]).selected !== false; i++){
                if(!isInside(x, y, series)){
                    return results;
                }
                reset(shapes = series.shapes);
                kdtree = KDTree(shapes);
                shape = kdtree.nearest({x: x, y: y}, function(a, b){
                    var dx = a.x - b.x;
                    return dx * dx;
                })[0];
                kdtree.destroy();
                if(shape && !shape.isNULL){
                    shape.current = shape.index;
                    results.push({shape: shape, series: series});
                }
                
            }
            return results;
        }
    };

    (Chart.graphers = Chart.graphers || {}).candlestick = K;
    
})(typeof window !== "undefined" ? window : this, Dalaba.Chart);
    (function(global, Chart){
    var Layout = (function(global) {

    var sankeyInterpolate = function(a, b, t) {
        return a * (1 - t) + b * t;
    };

    var sankeyCurve = function(startX, endX, startY, endY) {
        var curvature = 0.5;
        var x0 = startX,
            x1 = endX,
            x2 = sankeyInterpolate(x0, x1, curvature),
            x3 = sankeyInterpolate(x0, x1, 1 - curvature),
            y0 = startY,
            y1 = endY;
        return [x0, y0, x2, y0, x3, y1, x1, y1];
    };

    var sankeySum = function(arrays, key) {
        var n = arrays.length,
            i = n & 1;
        var v = i ? arrays[0][key] : 0;
        while (i < n) {
            v += arrays[i++][key] + arrays[--n][key];
        }
        return v;
    };

    var sankeyUnique = function(arrays){
        var length = arrays.length,
            i = -1;
        var ret = [], o;
        var maps = {};

        while(++i < length){
            o = arrays[i];
            if(!(o.data.source in maps)){
                maps[o.data.source] = 1;
                ret.push(o);
            }
        }
        return ret;
    };
    var sankeyIndexOf = (function(){
        var filter = function(a, b){
            return a === b;
        };
        var indexOf = function(nodes, key){
            var i = -1, n = nodes.length;
            while(++i < n && !filter(nodes[i], key));
                return i < n ? i : -1;
        };
        
        return indexOf;
    })();

    var Sankey = function() {
        var sankey = {},
            nodeWidth = NaN,
            minWidth = 1e-3,
            maxWidth = 1e3,
            nodePadding = 8,
            nodeSpacing = [1, 1],//x, y spacing
            size = [1, 1],
            nodes = [],
            links = [];
        var dx = 0, dy = 0;

        sankey.data = function(data) {
            (data || []).forEach(function(d, i){
                var source = d.source;
                typeof source !== "undefined" && nodes.push({name: source, data: d});
                links.push({ "source": d.source, "target": d.target, "value": +d.value, weight: d.weight, index: i});
            });
            data.forEach(function(d){
                var target = d.target;
                typeof target !== "undefined" && nodes.push({name: target, data: d});
            });
            var keys = [];
            nodes = sankeyUnique(nodes).map(function(d){
                keys.push(d.name);
                return d.data;
            });

            data.forEach(function(d, i) {
                if(d.empty){
                    links[i].target = links[i].source = sankeyIndexOf(keys, d.source);
                    links[i].empty = true;
                }
                else{
                    links[i].source = sankeyIndexOf(keys, d.source);
                    links[i].target = sankeyIndexOf(keys, d.target);
                }
            });
            nodes.forEach(function(node){
                node.sourceLinks = [];
                node.targetLinks = [];
            });
            links.forEach(function(link){
                var source = link.source,
                    target = link.target;
                if (typeof source === "number") source = link.source = nodes[source];
                if (typeof target === "number") target = link.target = nodes[target];

                if(source && target){
                    source.sourceLinks.push(link);
                    target.targetLinks.push(link);
                }
            });
            return sankey;
        };

        sankey.nodeWidth = function(_) {
            if (!arguments.length) return nodeWidth;
            if (isNumber(_, true)) nodeWidth = _;
            return sankey;
        };

        sankey.minWidth = function(_) {
            if (!arguments.length) return minWidth;
            if (isNumber(_, true)) minWidth = _;
            return sankey;
        };

        sankey.maxWidth = function(_) {
            if (!arguments.length) return maxWidth;
            if (isNumber(_, true)) maxWidth = _;
            return sankey;
        };

        sankey.nodePadding = function(_) {
            if (!arguments.length) return nodePadding;
            nodePadding = +_;
            return sankey;
        };
        sankey.nodeSpacing = function(_){
            return !_ ? nodeSpacing : (nodeSpacing = _, sankey);
        };

        sankey.nodes = function(_) {
            if (!arguments.length) return nodes;
            nodes = _;
            return sankey;
        };

        sankey.links = function(_) {
            if (!arguments.length) return links;
            links = _;
            return sankey;
        };

        sankey.size = function(_) {
            if (!arguments.length) return size;
            size = _;
            return sankey;
        };

        sankey.translate = function(x, y) {
            return arguments.length ? (dx = x, dy = y, sankey) : [dx, dy];
        };

        sankey.layout = function(iterations) {
            if(iterations === "none"){
                computeNodeGroup();
            }
            return sankey;
        };

        function computeNodeGroup() {
            var width = size[0],
                height = size[1];

            var maxValueGroup = function(groups){
                var max = 0;
                groups.forEach(function(groups){
                    max = Math.max(max, sankeySum(groups, "value"));
                });
                return max;
            };
            var translateGroup = function(groups, height, curHeight){
                groups.forEach(function(node){
                    node.y += (height - curHeight) / 2 + dy;
                    node.x += dx;
                });
            };
            var groups = partition(nodes, function(a, b){
                return a.group === b.group;
            });
            var groupLength = groups.length;
            var groupSum = maxValueGroup(groups);
            var defaultNodeWidth = width / groupLength - nodeSpacing[0] * ~-groupLength;
            groups.forEach(function(groups, i) {
                var nextY = 0;
                groups.forEach(function(node) {
                    var x = i * (width / groupLength),
                        h = 0;
                    if(defined(node.value)){
                        h = interpolate(node.value, 0, groupSum, 0, height - nodeSpacing[1] * ~-groups.length);
                    }
                    node.x = x;
                    node.y = nextY;
                    node.width = Math.max(minWidth, Math.min(maxWidth, pack("number", nodeWidth, defaultNodeWidth, minWidth, 0)));
                    node.dy = h;
                    nextY += h + nodeSpacing[1];
                });
                translateGroup(groups, height, nextY - nodeSpacing[1]);
            });
            nodes.forEach(function(node){
                var sourceLinks = node.sourceLinks,
                    targetLinks = node.targetLinks;
                /*var length = sourceLinks.length + targetLinks.length;
                var linkHeight = node.dy / length,//each box height
                    nextHeight = 0;*/
                var sourceHeight = 0,
                    targetHeight = 0;
                var sourceWeight = 0,
                    targetWeight = 0;
                var linkHeight;

                node.sourceLinks.forEach(function(link){
                    sourceWeight += link.weight;
                });
                node.targetLinks.forEach(function(link){
                    targetWeight += link.weight;
                });
                
                node.linkArgs = [];
                node.sourceLinks.forEach(function(link){
                    if (link.weight) {
                        linkHeight = node.dy * (link.weight / sourceWeight);
                    }
                    else {
                        linkHeight = (node.dy / sourceLinks.length);
                    }
                    link.sy = sourceHeight;
                    link.sy0 = linkHeight + link.sy;
                    //sy += link.dy;
                    
                    link.x = node.x;
                    link.y = node.y + sourceHeight;
                    link.dx = node.width;
                    link.dy = link.sy0;
                    sourceHeight += linkHeight;
                });
                //console.log(node.name, node.targetLinks)
                
                node.targetLinks.forEach(function(link){
                    if (link.weight) {
                        linkHeight = node.dy * (link.weight / targetWeight);
                    }
                    else {
                        linkHeight = (node.dy / targetLinks.length);
                    }
                    link.ty = targetHeight;
                    link.ty0 = linkHeight + link.ty;
                    //ty += link.dy;
                    link.x = node.x;
                    link.y = node.y + targetHeight;
                    link.dx = node.width;
                    link.dy = link.ty0;
                    targetHeight += linkHeight;
                });
            });
        }

        return sankey;
    };

    function factoy() {
        var percentage = Numeric.percentage;

        var sankeySmooth = function(startX, endX, startY, endY) {
            var curvature = 0.5;
            var spacing = Math.abs(endY - startY) / 4;
            var x0 = startX,
                x1 = endX,
                x2 = sankeyInterpolate(x0 + spacing, x1 + spacing, curvature),
                x3 = sankeyInterpolate(x0 + spacing, x1 + spacing, curvature),
                y0 = startY,
                y1 = endY;
            return [x0, y0, x2, y0, x3, y1, x1, y1];
        };
        var resetTransform = function(series, transform) {
            var size = series.size;
            var x = series.plotX,
                y = series.plotY,
                width = pack("number", size, size && size[0], series.plotWidth),
                height = pack("number", size && size[1], series.plotHeight);
            var scale = (transform || {}).scale,
                translate = (transform || {}).translate;
            
            if (defined(translate)) {
                x += translate[0];
                y += translate[1];
            }
            if (defined(scale) && scale !== 1) {
                scale = Math.max(pack("number", scale, 1), 1e-5);
                width = width * scale;
                height = height * scale;
                x += (series.plotWidth - width) / 2;
                y += (series.plotHeight - height) / 2;
            }
            return {
                x: x,
                y: y,
                width: width,
                height: height
            };
        };
        return function(type, options){
            
            options.panel.forEach(function(pane){
                var series = arrayFilter(pane.series, function(series){
                    return series.type === type;
                });
                series.forEach(function(series){
                    var plotX, plotY, plotWidth, plotHeight;
                    var minWidth,
                        maxWidth,
                        percentWidth,
                        boxWidth = series.point && (minWidth = series.point.minWidth, maxWidth = series.point.maxWidth, series.point.width);

                    var transform = resetTransform(series, series.transform);

                    plotX = pack("number", transform.x, 0);
                    plotY = pack("number", transform.y, 0);
                    plotWidth = pack("number", transform.width);
                    plotHeight = pack("number", transform.height);

                    isNumber(percentWidth = percentage(plotWidth, minWidth)) && (minWidth = percentWidth);
                    isNumber(percentWidth = percentage(plotWidth, maxWidth)) && (maxWidth = percentWidth);
                    isNumber(percentWidth = percentage(plotWidth, boxWidth)) && (boxWidth = percentWidth);

                    var shapes = series.shapes;
                    var nodes = series.nodes = [];
                    var sankey = Sankey().nodeWidth(boxWidth)
                        .minWidth(minWidth > maxWidth ? maxWidth : minWidth)
                        .maxWidth(minWidth > maxWidth ? minWidth : maxWidth)
                        .nodeSpacing([15, 20])
                        .translate(plotX, plotY)
                        .size([plotWidth, plotHeight]);
                    
                    sankey.data(shapes).layout("none");

                    sankey.links().forEach(function(link) {
                        if(link.target && link.source) {
                            if(link.empty){
                                link.source.linkArgs.push({
                                    from: sankeyCurve(
                                        link.source.x + link.target.width,
                                        link.target.x + link.target.width + 15,
                                        link.source.y + link.sy,
                                        link.source.y + link.sy0
                                    ),
                                    to: sankeyCurve(
                                        link.target.x + link.target.width + 15, link.source.x + link.source.width,
                                        link.target.y + link.ty0 + 2, link.source.y + link.sy0
                                    ),
                                    empty: true,
                                    source: link.source,
                                    target: link.target,
                                    weight: link.weight,
                                    index: link.index,
                                    size: link.dy
                                });
                            }
                            else if(link.source.group === link.target.group){
                                link.source.linkArgs.push({
                                    from: sankeySmooth(
                                        link.source.x + link.target.width, link.target.x + link.target.width,
                                        link.source.y + link.sy, link.target.y + link.ty
                                    ),
                                    to: sankeySmooth(
                                        link.target.x + link.target.width, link.source.x + link.source.width,
                                        link.target.y + link.ty0, link.source.y + link.dy
                                    ),
                                    source: link.source,
                                    target: link.target,
                                    weight: link.weight,
                                    index: link.index,
                                    size: link.dy
                                });
                            }
                            else if(link.source.group < link.target.group){
                                link.source.linkArgs.push({
                                    from: sankeyCurve(
                                        link.source.x + link.source.width, link.target.x,
                                        link.source.y + link.sy, link.y// + link.dy
                                    ),
                                    to: sankeyCurve(
                                        link.target.x, link.source.x + link.source.width,
                                        link.target.y + link.dy, link.source.y + link.sy0
                                    ),
                                    source: link.source,
                                    target: link.target,
                                    weight: link.weight,
                                    index: link.index,
                                    size: link.dy
                                });
                            }
                            else{
                                link.source.linkArgs.push({
                                    from: sankeyCurve(
                                        link.source.x, link.target.x + link.target.width,
                                        link.source.y + link.sy, link.target.y + link.ty
                                    ),
                                    to: sankeyCurve(
                                        link.target.x + link.target.width, link.source.x,
                                        link.target.y + link.ty0, link.source.y + link.sy0
                                    ),
                                    source: link.source,
                                    target: link.target,
                                    weight: link.weight,
                                    index: link.index,
                                    size: link.dy
                                });
                            }
                        }
                    });
                    sankey.nodes().forEach(function(node, i){
                        nodes.push(extend(node, {
                            name: node.source,
                            key: null,
                            index: i,
                            x: node.x,
                            y: node.y,
                            width: node.width,
                            height: node.dy
                        }));
                    });
                });
            });
        };
        //return Sankey;
    }
    return {
        deps: function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
}).call(typeof window !== "undefined" ? window : this).deps(Dalaba.Numeric);

    var xClip = function(t, context, canvas, x, y){
        if(0 !== t){
            context.save();
            t > 0 && context.drawImage(
                canvas,
                x, y, canvas.width * t, canvas.height,
                x, y, canvas.width * t / DEVICE_PIXEL_RATIO, canvas.height / DEVICE_PIXEL_RATIO
            );
            context.restore();
        }
    };

    var lerpArrays = function(a0, a1, t){
        var ret = [];
        a0.forEach(function(a, i){
            var b = a1[i];
            ret.push(a * (1 - t) + b * t);
        });
        return ret;
    };

    var parseGradient = function(context, x, y, width, height, options) {
        var linearGradient = options.linearGradient,
            x1 = linearGradient.x1,
            y1 = linearGradient.y1,
            x2 = linearGradient.x2,
            y2 = linearGradient.y2,
            stops = options.stops || [];
        var xx = (x1 ^ x2),
            yy = !(y1 ^ y2);
        var gradient = context.createLinearGradient(
            x + width * xx,
            y + height * yy,
            x + width * xx,
            y + height * !yy
        );
        stops.forEach(function(item){
            if(isNumber(item[0]) && typeof item[1] === "string")
                gradient.addColorStop(item[0], item[1]);
        });
        return gradient;
    };

    function Sankey(canvas, options) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.type = "sankey";
        
        this.series = [];
        this.init(options);
    }
    Sankey.prototype = {
        constructor: Sankey,
        init: function(options) {
            var canvas = this.canvas,
                type = this.type,
                chart = this;
            this.actived = {};
            this.options = extend({}, options);
            this.series = arrayFilter(pack("array", options.series, []), function(series){
                var filter = series.type === type;
                return filter;
            });
            
            Layout(type, options);

            if(canvas.nodeType === 1){
                this.series.forEach(function(series){
                    if(series.animationEnabled){
                        var image = document.createElement("canvas"),
                            context = image.getContext("2d");
                        var shapes = series.shapes;
                        var selectedShapes = [];
                        Chart.scale(
                            context,
                            pack("number", series.plotWidth + series.plotX, canvas.width),
                            pack("number", series.plotHeight + series.plotY, canvas.height),
                            DEVICE_PIXEL_RATIO
                        );
                        series._image = image;
                        shapes.forEach(function(shape) {
                            if (shape.selected !== true) {
                                chart.drawLink(context, shape, series);
                            }
                            else {
                                selectedShapes.push(shape);
                            }
                        });
                        selectedShapes.forEach(function(shape) {
                            chart.drawLink(context, shape, series);
                        });
                        shapes.forEach(function(shape){
                            chart.drawShape(context, shape, series);
                        });
                    }
                });
            }
        },
        draw: function() {
            var context = this.context,
                chart = this;
                
            this.series.forEach(function(series) {
                var shapes = series.shapes;
                var selectedShapes = [];
                shapes.forEach(function(shape) {
                    if (shape.selected !== true) {
                        chart.drawLink(context, shape, series);
                    }
                    else {
                        selectedShapes.push(shape);
                    }
                });
                selectedShapes.forEach(function(shape){
                    chart.drawLink(context, shape, series);
                });
                if(chart.actived.link) {
                    chart.drawPath(context, chart.actived.link, series);
                }
            });
            this.series.forEach(function(series) {
                series.nodes.forEach(function(shape) {
                    chart.drawShape(context, shape, series);
                });
                series.nodes.forEach(function(shape) {
                    chart.dataLabels(context, shape, series);
                });
            });
        },
        redraw: function() {
            Layout(this.type, this.options);
            this.draw();
        },
        drawShape: function(context, shape, series) {
            var x = shape.x, y = shape.y,
                width = shape.width,
                height = shape.height;
            var borderWidth = pack("number", shape.borderWidth, series.borderWidth, 0),
                borderColor = shape.borderColor || series.borderColor,
                fillColor = shape.fillColor || series.fillColor || shape.color || series.color;
            var hover = (series.states || {}).hover,
                hoverColor;

            if (isFunction(hover)) {
                hover = hover.call(shape, shape, series);
            }
            if (!defined(hover)) {
                hover = {};
            }
            hoverColor = hover.color;

            if (defined(fillColor.linearGradient) && isNumber(width) && isNumber(height)) {
                fillColor = parseGradient(context, x, y, width, height, fillColor);
            }

            if (shape === this.actived.shape) {
                if(defined(hoverColor)) {
                    fillColor = defined(hoverColor.linearGradient) ? parseGradient(context, x, y, width, height, hoverColor) : hoverColor;
                }
                else{
                    fillColor = Color.parse(fillColor);
                    fillColor.a = 0.75;
                    fillColor = Color.rgba(fillColor);
                }
            }
            context.save();
            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(x + width, y);
            context.lineTo(x + width, y + height);
            context.lineTo(x, y + height);
            context.closePath();

            borderWidth > 0 && (context.lineWidth = borderWidth, context.strokeStyle = borderColor, context.stroke());
            context.fillStyle = fillColor;
            context.fill();
            context.restore();
        },
        drawPath: function (context, link, series) {
            var shapes = series.shapes,
                shape = shapes[link.index] || {};
            var lineColor = shape.lineColor || series.lineColor || "#eee",
                lineWidth = pack("number", shape.lineWidth, series.lineWidth);
            var hover = (series.states || {}).hover,
                hoverLineColor;

            if (isFunction(hover)) {
                hover = hover.call(shape, shape, series);
            }
            if (!defined(hover)) {
                hover = {};
            }
            hoverLineColor = hover.lineColor;
            
            var from = link.from,
                to = link.to;

            if(link === this.actived.link) {
                if (defined(hoverLineColor)){
                    lineColor = hoverLineColor;
                }
                else {
                    lineColor = Color.parse(lineColor);
                    lineColor.a = 0.55;
                    lineColor = Color.rgba(lineColor);
                }
            }
            context.beginPath();
            context.moveTo(from[0], from[1]);
            context.bezierCurveTo.apply(context, from.slice(2));
            if(to){
                context.lineTo(to[0], to[1]);
                context.bezierCurveTo.apply(context, to.slice(2));
            }
            context.fillStyle = lineColor;
            context.fill();
            lineWidth > 0 || (link.size < 1) && (
                context.strokeStyle = lineColor,
                context.stroke()
            );
        },
        drawLink: function(context, shape, series) {
            var chart = this;
            context.save();
            (shape.linkArgs || []).forEach(function(link) {
                chart.drawPath(context, link, series);
            });
            context.restore();
        },
        dataLabels: function(context, shape, series) {
            dataLabels.value(shape.value).align(function(type, bbox){
                var x = shape.x,
                    w = bbox.width,
                    w2 = shape.width;
                var t = pack("string", type,  "center");
                return {
                    left: x,
                    center: x + (w2 - w) / 2,
                    right: x + w2 - w
                }[t];
            }).vertical(function(type, bbox){
                var y = shape.y,
                    h = bbox.height,
                    h2 = shape.height;
                var t = pack("string", type, "top");
                return {
                    top: y + h,
                    middle: y +  (h2 - h) / 2,
                    bottom: y + h2
                }[t];
            }).call(shape, series, context);
        },
        animateTo: function(context, initialize){
            var chart = this;
            var shapes = [];
            chart.series.forEach(function(series){
                var animators = [];
                if(initialize === true){
                    var mergeShape = series;
                    shapes.push([series, function(timer){
                        mergeShape._timer = timer;
                    }]);
                    animators.push(mergeShape);
                }
                else if(defined(series.transform)){
                    series.nodes.forEach(function(newShape, newIndex){
                        var oldShape = series._nodes[newIndex],
                            mergeShape;
                        var x, y, width, height;
                        var linkArgs;

                        if(oldShape && newShape){
                            mergeShape = {
                                width: oldShape.width,
                                height: oldShape.height,
                                x: oldShape.x,
                                y: oldShape.y,
                                color: newShape.color,
                                lineColor: newShape.lineColor,
                                fillColor: newShape.fillColor,
                                _value: newShape._value,
                                selected: oldShape.selected,
                                text: newShape.text,
                                source: newShape.source,
                                value: newShape.value,
                                linkArgs: oldShape.linkArgs,
                                shape: newShape
                            };
                            
                            shapes.push([newShape, function(timer){
                                linkArgs = [];
                                width = oldShape.width + (newShape.width - oldShape.width) * timer;
                                height = oldShape.height + (newShape.height - oldShape.height) * timer;
                                x = oldShape.x + (newShape.x - oldShape.x) * timer;
                                y = oldShape.y + (newShape.y - oldShape.y) * timer;

                                (oldShape.linkArgs || []).forEach(function(oldLink, i){
                                    var newLink = newShape.linkArgs[i];
                                    if(newLink){
                                        linkArgs.push({
                                            from: lerpArrays(oldLink.from, newLink.from, timer),
                                            to: lerpArrays(oldLink.to, newLink.to, timer),
                                            lineColor: oldLink.lineColor,
                                            empty: oldLink.empty,
                                            index: newLink.index
                                        });
                                    }
                                });

                                mergeShape.width = width;
                                mergeShape.height = height;
                                mergeShape.x = x;
                                mergeShape.y = y;
                                mergeShape.linkArgs = linkArgs;
                            }]);
                        }
                        if(mergeShape)
                            animators.push(mergeShape);
                    });
                }
                series._shapes = series.shapes;
                series._nodes = series.nodes;
                series._animators = animators;
            });
            return shapes;
        },
        onFrame: function(context, initialize){
            var chart = this;
            this.series.forEach(function(series){
                var animators = series._animators;
                if(initialize === true){
                    animators.forEach(function(series){
                        series._image && xClip(series._timer, context, series._image, 0, 0);
                    });
                }
                else{
                    animators.forEach(function(shape){
                        chart.drawLink(context, shape, series);
                    });
                    animators.forEach(function(shape){
                        chart.drawShape(context, shape, series);
                        chart.dataLabels(context, shape, series);
                    });
                }
            });
        },
        onStart: function(){
            this.series.forEach(function(series){
                var transform = series.transform;
                if(defined(transform) && defined(transform.translate)){
                    transform._translate = transform.translate;
                }
            });
        },
        onDrag: function(x, y) {
            this.actived = {};
            this.series.forEach(function(series) {
                var transform = series.transform || {},
                    translate = transform._translate;
                if(defined(translate)){
                    transform.translate = [translate[0] + x, translate[1] + y];
                }
            });
            Layout(this.type, this.options);
        },
        getShape: function(x, y) {
            var length = this.series.length,
                i = 0,
                j;
            var series, shapes, shape;
            var nodes;
            var context = this.context;
            var results = [], result;

            for(; i < length && (series = this.series[i]).selected !== false; i++){
                nodes = series.nodes;
                delete this.actived.shape;
                for(j = 0; j < nodes.length; j++){
                    shape = nodes[j];
                    if(!shape.isNULL && Intersection.rect(
                        {x: x, y: y}, 
                        {x: shape.x, y: shape.y, width: shape.x + shape.width, height: shape.y + shape.height}
                    )){
                        result = {shape: shape, series: series};
                        result.shape.$value = "" + shape._value;
                        result.shape.shape = "node";
                        results.push(result);
                        this.actived.shape = shape;
                        break;
                    }
                }
            }
            
            for (i = 0; i < length; i++) {
                shapes = series.shapes;
                delete this.actived.link;
                label: for(j = 0; j < shapes.length; j++) {
                    shape = shapes[j];
                    var linkArgs = shape.linkArgs || [];
                    for (var z = 0; z < linkArgs.length; z++) {
                        var link = linkArgs[z];
                        var from = link.from,
                            to = link.to;
                        context.beginPath();
                        context.moveTo(from[0], from[1]);
                        context.bezierCurveTo.apply(context, from.slice(2));
                        if (to) {
                            context.lineTo(to[0], to[1]);
                            context.bezierCurveTo.apply(context, to.slice(2));
                        }
                        context.closePath();
                        if (context.isPointInPath(x * DEVICE_PIXEL_RATIO, y * DEVICE_PIXEL_RATIO)) {
                            this.actived.link = link;
                            result = {shape: {
                                shape: "line",
                                $value: shape._value,
                                target: link.target,
                                source: link.source,
                                weight: link.weight,
                                empty: link.empty,
                                sourceLinks: shape.sourceLinks,
                                targetLinks: shape.targetLinks,
                                linkArgs: shape.linkArgs,
                                index: z
                            }, series: series};
                            results.push(result);
                            break label;
                        }
                    }
                }
            }
            return results;
        }
    };

    (Chart.graphers = Chart.graphers || {}).sankey = Sankey;
    
})(typeof window !== "undefined" ? window : this, Dalaba.Chart);
    (function(global, Chart) {

    var Symbol = (function() {

    var Symbol = {
        dount: function(x, y, w, h) {
            var r = Math.min(w, h);
            return function(context){
                context.beginPath();
                context.arc(x, y + r / 2, r, 0, PI2, true);
                context.arc(x, y + r / 2, r * 0.4, 0, PI2, false);
            };
        },
        square: function(x, y, w, h, r){
            r = 6;//typeof r === "undefined" ? 0 : Math.min(r || 0, w, h);
            return function(context){
                context.beginPath();
                context.moveTo(x + r, y);
                //top-right
                context.lineTo(x + w - r, y);
                context.bezierCurveTo(x + w, y, x + w, y, x + w, y + r);//top-right corner
                //bottom-right
                context.lineTo(x + w, y + h - r);
                context.bezierCurveTo(x + w, y + h, x + w, y + h, x + w - r, y + h);//bottom-right corner
                //bottom-left
                context.lineTo(x + r, y + h);
                context.bezierCurveTo(x, y + h, x, y + h, x, y + h - r);//bottom-left corner
                //top-left
                context.lineTo(x, y + r);
                context.bezierCurveTo(x, y, x, y, x + r, y);//top-left corner
                //context.closePath();
            };
        },
        triangle: function(x, y, w, h){
            return function(context){
                context.beginPath();
                context.moveTo(x, y + h / 2);
                context.lineTo(x + w / 2, y - h / 2);
                context.lineTo(x + w, y + h / 2);
                context.lineTo(x, y + h / 2);
            };
        },
        circle: function(x, y, w, h){
            //var cpw = 0.166 * w;
            return function(context){
                context.beginPath();
                /*context.moveTo(x + w / 2, y);
                context.bezierCurveTo(x + w + cpw, y, x + w + cpw, y + h, x + w / 2, y + h);
                context.bezierCurveTo(x - cpw, y + h, x - cpw, y, x + w / 2, y);*/
                context.arc(x + w / 2, y + w / 2, w / 2, 0, PI2);
                context.closePath();
            };
        },
        hexagon: function(x, y, w, h){
            var r = Math.max(w, h);
            return function(context){
                var i = -1, n = 6, a;
                var sin = Math.sin, cos = Math.cos;
                r /= 2;
                context.beginPath();
                context.moveTo(x + cos(0) * r + r, y + sin(0) * r + r);
                while(++i < n){
                    context.lineTo(
                        x + cos(a = i / n * PI2) * r + r,
                        y + sin(a) * r + r
                    );
                }
                context.closePath();
            };
        },
        path: function(x, y, w, h, r){
            var path = this;
            var arc = Chart.arc;
            return function(context){
                //context.stroke(new Path2D(path));
                var moveX, moveY,//line
                    centerX, centerY;//arc
                path = path.replace(/([MmZzLlHhVvCcSsQqTtAa])([^\s])/gm, "$1 $2")
                    .replace(/([^\s])([MmZzLlHhVvCcSsQqTtAa])/gm, "$1 $2");
                var tokens = path.split(/[\s+]/g),
                    length = tokens.length,
                    i = 0,
                    d;
                //console.log(tokens)

                context.save();
                context.translate(x, y + r / 2);
                context.beginPath();
                //Path.parse
                for(; i < length; i++){
                    d = tokens[i];
                    switch(d){
                        case "M":
                            context.moveTo(moveX = centerX = +tokens[++i], moveY = centerY = +tokens[++i]);
                        break;
                        case "L":
                            context.lineTo(moveX = +tokens[++i], moveY = +tokens[++i]);
                        break;
                        case "A":
                            arc(context,
                                moveX,//ex
                                moveY,//ey
                                [+tokens[++i],//rx
                                +tokens[++i],//ry
                                +tokens[++i],//large
                                +tokens[++i],//sweep
                                +tokens[++i],//rotation
                                moveX = +tokens[++i],//x
                                moveY = +tokens[++i]]//y
                            );
                        break;
                        case "Z":
                            moveX = centerX, moveY = centerY;
                            i++;
                            context.closePath();
                        break;
                    }
                }
                context.restore();
                //console.log(path)
            };
        }
    };
    return Symbol;
})();;

    var Linked = (function() {

    var hasProps = ({}).hasOwnProperty;

    var abs = Math.abs;
    var max = Math.max;
    var min = Math.min;

    var curveStep = function(source, target, options) {
        var lineWidth = pack("number", options.lineWidth, 0);

        var positions = {};

        var x, y, x1, y1, x2, y2, x3, y3;
        var dx, dy;
        if (source && target) {
            var smoothing = 0.5;
            var points = [
                {x: source.x + source.width * smoothing, y: source.y + source.height},//source bottom
                {x: source.x + source.width * smoothing, y: source.y},//source top
                null,
                null,
                {x: target.x + target.width * smoothing, y: target.y + target.height},//target bottom
                {x: target.x + target.width * smoothing, y: target.y}//target top
            ];
            x = points[0].x;
            y = points[0].y;
            x1 = points[4].x;
            y1 = points[5].y;

            if (source.y < target.y) {
                y = points[0].y;
            }
            else {
                y = points[1].y;
                y1 = points[4].y;
            }
            var ratio = 0.2;
            if (source.x > target.x) {
                ratio = 0.8;
            }
            dy = max(abs(y - y1) * ratio, lineWidth);
            y2 = y + dy;
            x3 = x1;
            y3 = y + dy;
            if (source.y > target.y) {
                y2 = y3 = y - dy;
            }

            //console.log(x, y, dy);
            positions = {
                x: x, y: y, x0: x, y0: y,
                x1: x1, y1: y1,//to
                x2: x, y2: y2,
                x3: x3, y3: y3
            };
        }
        return positions;
    };

    var curveBasis = function(source, target, options) {
        if (!source || !target)
            return {};

        var lineWidth = (options.lineWidth || 1) - 1,
            sourceSpacing = lineWidth + (options.sourceSpacing || 0),
            targetSpacing = lineWidth + (options.targetSpacing || 0);

        var smoothing = 0.5; 
        var abox = {x: source.x, y: source.y, width: source.width, height: source.height},
            bbox = {x: target.x, y: target.y, width: target.width, height: target.height};
        
        var points = [
            {x: abox.x + abox.width * smoothing, y: abox.y - sourceSpacing},//source right
            {x: abox.x + abox.width * smoothing, y: abox.y + abox.height + sourceSpacing},//source bottom
            {x: abox.x - sourceSpacing, y: abox.y + abox.height * smoothing},//source left
            {x: abox.x + abox.width + sourceSpacing, y: abox.y + abox.height * smoothing},//source top

            {x: bbox.x + bbox.width * smoothing, y: bbox.y - targetSpacing},//target right
            {x: bbox.x + bbox.width * smoothing, y: bbox.y - targetSpacing},//target bottom
            {x: bbox.x - targetSpacing, y: bbox.y + bbox.height * smoothing},//target left
            {x: bbox.x + bbox.width + targetSpacing, y: bbox.y + bbox.height * smoothing}//target top
        ];

        var distance = [],
            links = [],
            maps = {};//i ==> j
        var dx, dy;
        var x, y, x2, y2, x3, y3, x1, y1;

        var detected = function(i, j, equalx, equaly) {
            return ((i ^ 3 & (j ^ 2)) > 0 | equalx) // left
                & ((i ^ 2 & (j ^ 3)) > 0 | !equalx) // right
                & ((i ^ 1 & (j ^ 0)) > 0 | equaly) // top
                & ((i ^ 0 & (j ^ 1)) > 0 | !equaly); //bottom
        };

        for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
            var a = points[i],
                b = points[j + 4];
            var equalx = a.x < b.x,
                equaly = a.y < b.y;
            if ((i === j) | detected(i, j, equalx, equaly)) {
                maps[distance[distance.push((dx = abs(a.x - b.x)) + (dy = abs(a.y - b.y))) - 1]] = [i, j + 4];
            }
        }
        
        if (distance.length === 0) {
            links = [0, 4];//start - end
        }
        else {
            links = maps[min.apply(Math, distance)];//i ==> j
        }
        x = points[links[0]].x;//i ==> j point
        y = points[links[0]].y;//move point
        x1 = points[links[1]].x;//j
        y1 = points[links[1]].y;//end point

        dx = max(abs(x1 - x) / 2, lineWidth);// middle point min
        dy = max(abs(y1 - y) / 2, lineWidth);

        x2 = [x, x, x - dx, x + dx][links[0]];//control point p1
        y2 = [y - dy, y + dy, y, y][links[0]];

        x3 = [x1, x1, x1 - dx, x1 + dx][links[1] - 4];//p2
        y3 = [y + dy, y - dy, y1, y1][links[1] - 4];

        return {
            x: x, y: y,
            x1: x1, y1: y1,//to
            x2: x2, y2: y2,
            x3: x3, y3: y3,
        };
    };

    var data = [];
    var srcdata = [];

    function merged(data) {
        var n = data.length,
            i = -1;
        var node;

        var maps = {};

        var ret = [];

        while (++i < n) if ((node = data[i]) && defined(node.source)) {
            maps[node.source] = 1;
            ret.push({
                source: node.source,
                target: node.target,
                index: i
            });
        }
        i = -1;
        while (++i < n) if ((node = data[i]) && defined(node.target) && !(hasProps.call(maps, node.target)) && (maps[node.target] = 1)) {
            ret.push({
                source: node.target,
                target: null,
                index: i
            });
        }
        return ret;
    }


    function adjacency(_) {
        data = merged(srcdata = _ || []);
        
        return adjacency;
    }
    var matrix = [];

    var nodes = [];

    var sourcelinks = {};

    adjacency.matrix = function() {
        var n = data.length,
            i, j;
        var a, b;
        var source, target;
        
        sourcelinks = {};

        for (i = 0; i < n; i++) matrix[i] = new Array(n).fill(-1);

        for (i = 0; i < n; i++) {
            for (j = 0; j < n; j++) {
                a = data[i], b = data[j];
                target = a.target, source = b.source;

                //a target, no self
                if (i ^ j && target === source) {
                    if (!(hasProps.call(sourcelinks, a.source))) {
                        sourcelinks[a.source] = [{name : b.source, index: j, source: a, target: b}];
                    }
                    else {
                        var clusters = sourcelinks[a.source];
                        clusters.push({name: b.source, index: i, source: clusters[clusters.length - 1].source, target: b});
                    }

                    //console.log(data[i].source, target, source, target === source, i, j);
                    matrix[i][j] = j;
                    matrix[j][i] = i;//matrix[i][j];
                }
            }
        }
        return adjacency;
    };
    adjacency.nodes = function() {
        var n = data.length,
            i = -1;
        var maps = {},
            node;
        nodes = [];

        adjacency.matrix();
        while (++i < n) if ((node = data[i]) && !(hasProps.call(maps, node.source)) && (maps[node.source] = 1)) {
            var item = srcdata[node.index];
            item.source = node.source;
            item.target = node.target;
            item.sourcelinks = sourcelinks[item.source] || [];
            nodes.push(item);
        }
        return nodes;
    };

    adjacency.links = function() {
        nodes.forEach(function(node) {
            var lines = [];
            var sw = node.width,
                sh = node.height;
            var dirSize = Math.max(2, Math.min(10, pack("number", Math.min(node.width, node.height), node.radius, 5) / 2));

            node.sourcelinks.forEach(function(link) {
                var source = srcdata[link.source.index];// link.source;
                var target = srcdata[link.target.index];// link.target;
                lines.push(curveBasis({
                    x: source.x,
                    y: source.y,
                    width: sw, height: sh
                }, {
                    x: target.x,
                    y: target.y,
                    width: sw, height: sh
                }, {
                    lineWidth: 1,
                    sourceSpacing: 0,
                    targetSpacing: dirSize
                }));
            });
            node.linklines = lines;
            node.linklines.dirSize = dirSize;
        });
    };

    

    return adjacency;
})();;

    var addLayout = (function(global) {

    function noLayout(px, py, pwidth, pheight, shapes, series) {
        var seriesWidth = series.width,
            seriesHeight = series.height,
            seriesRadius = series.radius,
            seriesSymbol = series.symbol;
        shapes.forEach(function(shape) {
            var x = shape._x,
                y = shape._y,
                symbol = pack("string", shape.symbol, seriesSymbol, "square"),
                radius = pack("number", shape.radius, seriesRadius, 50),
                width = pack("number", shape.width, seriesWidth, radius),
                height = pack("number", shape.height, seriesHeight, 20);

            if(symbol === "hexagon" || symbol === "circle"){
                width = height = radius * 2;
            }
            if(series.selected === false){
                width = height = radius = 0;
            }

            extend(shape, {
                radius: radius,
                width: width,
                height: height,
                symbol: symbol,
                name: shape.name || series.name,
                x: x,
                y: y
            });
        });
    }

    function gridLayout(px, py, pwidth, pheight, shapes, series) {
        var cols = 0,
            rows = 0;

        new Dalaba.Layout.Grid(shapes, {
            width: pwidth,
            height: pheight,
            size: TRouBLe(series.symbol === "circle" ?  series.radius || 60 : [series.width || 25, series.height || 20]),
            margin: TRouBLe(py, 0, 0, px),
            row: rows,
            col: cols
        });
    }

    function radialTreeLayout(px, py, pwidth, pheight, shapes) {
        new Dalaba.Layout.RadialTree(shapes, {
            width: pwidth,
            height: pheight,
            margin: TRouBLe(py, 0, 0, px)
        });
    }

    function factoy(linked) {
        var link;
        var nodes;

        var setLayout = function() {
            var args = [].slice.call(arguments),
                type = args.shift();
            if (type === 'grid') {
                gridLayout.apply(null, args);
            }
            else if (type === 'radialTree') {
                radialTreeLayout.apply(null, args);
            }
            else {
                noLayout.apply(null, args);
            }
        };

        return function(panels, modified) {
            panels.forEach(function(pane) {
                pane.series.forEach(function(series) {
                    var plotX = pack("number", series.plotX, 0),
                        plotY = pack("number", series.plotY, 0),
                        plotWidth = pack("number", series.plotWidth),
                        plotHeight = pack("number", series.plotHeight);
                    var layout = series.layout;

                    if (!defined(modified) && !link) {
                        link = linked(series.shapes);
                        nodes = link.nodes();
                    }
                    setLayout(layout, plotX, plotY, plotWidth, plotHeight, nodes, series);
                    link.links();
                });
            });
        };
    }

    return {
        deps: function() {
            var args = [].slice.call(arguments, 0);
            return factoy.apply(global, args);
        }
    };
}).call(typeof window !== "undefined" ? window : this).deps(Linked);

    var diagramLinkArrow = function(context, from, to, s) {
        var x = from.x,
            y = from.y;
        var tx = to.x,
            ty = to.y;
        var theta = Math.atan2(ty - y, tx - x);

        if (x < tx) {
            theta = 0;
        }
        else if (x > tx) {
            theta = Math.PI;
        }
        context.save();
        context.translate(tx, ty);
        context.rotate(theta);
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(0, -s / 2);
        context.lineTo(0 + s, 0);
        context.lineTo(0, s / 2);
        context.fill();
        context.restore();
    };

    var Diagram = function(canvas, options) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.series = [];

        this.type = "diagram";

        this.init(options);

    }, diagramProto = Diagram.prototype;

    diagramProto = {
        constructor: Diagram,
        init: function(options) {            
            var panels = [],
                panel = options.panel;
            var n = panel.length, i = -1, j, nn;

            var newSeries = [],
                series;
            while (++i < n) {
                newSeries = [];
                for (j = 0, nn = panel[i].series.length; j < nn; j++) if ((series = panel[i].series[j]).type === this.type) {
                    newSeries.push(series);
                }
                panels.push({
                    series: newSeries
                });
            }
            this.series = newSeries;
            this.options = options;//update
            this.panels = panels;

            addLayout(panels);
        },
        draw: function() {
            var context = this.context,
                chart = this;
                
            this.series.forEach(function(series){
                var shapes = series.shapes;
                var selectedShapes = [];
                shapes.forEach(function(shape) {
                    if (shape.selected !== true) {
                        //chart.drawLink(context, shape, series);
                    }
                    else {
                        selectedShapes.push(shape);
                    }
                });
                /*
                selectedShapes.forEach(function(shape){
                    chart.drawLink(context, shape, series);
                });
                if(chart.actived.link) {
                    chart.drawPath(context, chart.actived.link, series);
                }*/
            });
            this.series.forEach(function(series) {
                
                series.shapes.forEach(function(shape){
                    chart.dataLabels(context, shape, series);
                    chart.drawLink(context, shape, series);
                });
                series.shapes.forEach(function(shape){
                    chart.drawShape(context, shape, series);
                });
            });
        },
        redraw: function() {
            addLayout(this.panels, 1);
            this.draw();
        },
        drawShape: function(context, shape, series) {
            var borderWidth = pack("number", shape.borderWidth, series.borderWidth, 0),
                borderColor = shape.borderColor || series.borderColor,
                fillColor = shape.color || series.fillColor,
                symbol = pack("string", series.symbol, shape.symbol, "square"),
                radius = shape.radius,
                width = shape.width,
                height = shape.height;

            var x = shape.x, y = shape.y;
            var linePixel = fixLinePixel(x, y, width, height, borderWidth);

            context.save();
            context.fillStyle = fillColor;
            (defined(shape.path) ? Symbol.path : Symbol[symbol] ? Symbol[symbol] : Symbol.square).apply(
                shape.path,
                [linePixel.x, linePixel.y, linePixel.width, linePixel.height, radius]
            )(context);
            context.fill();
            borderWidth > 0 && (context.lineWidth = borderWidth, context.strokeStyle = borderColor, context.stroke());
            context.restore();
        },
        drawLink: function(context, shape) {
            var linklines = shape.linklines || [],
                dirSize = linklines.dirSize;
            context.save();
            
            (shape.linklines || []).forEach(function(link) {
                context.beginPath();
                context.strokeStyle = shape.lineColor;
                context.moveTo(link.x, link.y);
                /*context.lineTo(link.x2, link.y2);
                context.lineTo(link.x3, link.y3);
                context.lineTo(link.x1, link.y1);*/
                context.bezierCurveTo(link.x2, link.y2, link.x3, link.y3, link.x1, link.y1);
                context.stroke();

                diagramLinkArrow(context, {
                    x: link.x,
                    y: link.y
                }, {
                    x: link.x1,
                    y: link.y1
                }, dirSize);
            });
            
            context.restore();
        },
        dataLabels: function(context, shape, series) {
            dataLabels.value(shape.value).align(function(type, bbox){
                var x = shape.x,
                    w = bbox.width,
                    w2 = shape.width;
                var t = pack("string", type,  "center");
                return {
                    left: x,
                    center: x + (w2 - w) / 2,
                    right: x + w2 - w
                }[t];
            }).vertical(function(type, bbox){
                var y = shape.y,
                    h = bbox.height,
                    h2 = shape.height;
                var t = pack("string", type, "middle");
                return {
                    top: y + h,
                    middle: y + h + (h2 - h) / 2,
                    bottom: y + h2
                }[t];
            }).call(shape, series, context);
        },
        getShape: function(x, y) {
            var series, shapes, shape;
            var n = this.series.length, ii, i, j;
            var symbol;
            var inRanged = false;
            var results = [];

            for (i = 0; i < n; i++) {
                shapes = (series = this.series[i]).shapes;
                for (j = 0, ii = shapes.length; j < ii; j++) {
                    shape = shapes[j];
                    symbol = "square";//shape.symbol;
                    inRanged = false;
                    if (symbol === "square") {
                        inRanged = Intersection.rect(
                            {x: x, y: y},
                            {x: shape.x, y: shape.y, width: shape.x + shape.width, height: shape.y + shape.height}
                        );
                    }
                    else if (symbol === "circle" || symbol === "dount") {
                        inRanged = Intersection.distance(
                            {x: x, y: y},
                            {x: shape.x + shape.radius, y: shape.y + shape.radius}
                        ) <= shape.radius;
                    }
                    else if (symbol === "triangle" || symbol === "hexagon") {
                        inRanged = Intersection.polygon(
                            {x: x, y: y},
                            []
                        );
                    }
                    delete shape.current;
                    if (inRanged) {
                        shape.current = j;
                        results.push({
                            series: series,
                            shape: shape
                        });
                        break;
                    }
                }
            }
            return results;
        }
    };

    Diagram.prototype = diagramProto;

    (Chart.graphers = Chart.graphers || {}).diagram = Diagram;

})(typeof window !== "undefined" ? window : this, Dalaba.Chart);;

    /*
 * Class Animation
 * @param source{Array}
 * @param target{Array}
 * @param options{Object}
 * example
 * Animation.fire([0], [10], {
 *     step: function(){ //this.target},
 *     complete: function(){},
 *     easing: "linear"
 *     duration: 1000
 * })
*/
(function(callback){
    // Easing functions take at least four arguments:
    // t: Current time
    // b: Start value
    // c: Change in value from start to end
    // d: Total duration of the animation
    // Some easing functions also take some optional arguments:
    // a: Amplitude
    // p: Period
    // s: Overshoot amount
    //
    // The equations are created by Robert Penner.
    // (c) 2003 Robert Penner, all rights reserved.
    // The work is subject to the terms in http://www.robertpenner.com/easing_terms_of_use.html.
    var easing = {
        // Deprecated
        "ease-in": function (time) {
            return easing.cubicBezier(0.42, 0, 1, 1, time);
        },

        // Deprecated
        "ease-out": function (time) {
            return easing.cubicBezier(0, 0, 0.58, 1, time);
        },

        // Deprecated
        "ease-in-out": function (time) {
            return easing.cubicBezier(0.42, 0, 0.58, 1, time);
        },

        // Deprecated syntax, will adopt the t, b, c, d syntax as the rest
        "linear": function (time) {
            return time;
        },

        "ease-in-quad": function (t, b, c, d) {
            return c*(t/=d)*t + b;
        },

        "ease-out-quad": function (t, b, c, d) {
            return -c *(t/=d)*(t-2) + b;
        },

        "ease-in-out-quad": function (t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t + b;
            return -c/2 * ((--t)*(t-2) - 1) + b;
        },

        "ease-in-cubic": function (t, b, c, d) {
            return c*(t/=d)*t*t + b;
        },

        "ease-out-cubic": function (t, b, c, d) {
            return c*((t=t/d-1)*t*t + 1) + b;
        },

        "ease-in-out-cubic": function (t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t + b;
            return c/2*((t-=2)*t*t + 2) + b;
        },

        "ease-in-quart": function (t, b, c, d) {
            return c*(t/=d)*t*t*t + b;
        },

        "ease-out-quart": function (t, b, c, d) {
            return -c * ((t=t/d-1)*t*t*t - 1) + b;
        },

        "ease-in-out-quart": function (t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
            return -c/2 * ((t-=2)*t*t*t - 2) + b;
        },

        "ease-in-quint": function (t, b, c, d) {
            return c*(t/=d)*t*t*t*t + b;
        },

        "ease-out-quint": function (t, b, c, d) {
            return c*((t=t/d-1)*t*t*t*t + 1) + b;
        },

        "ease-in-out-quint": function (t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
            return c/2*((t-=2)*t*t*t*t + 2) + b;
        },

        "ease-in-sine": function (t, b, c, d) {
            return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
        },

        "ease-out-sine": function (t, b, c, d) {
            return c * Math.sin(t/d * (Math.PI/2)) + b;
        },

        "ease-in-out-sine": function (t, b, c, d) {
            return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
        },

        "ease-in-expo": function (t, b, c, d) {
            return (t===0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
        },

        "ease-out-expo": function (t, b, c, d) {
            return (t===d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
        },

        "ease-in-out-expo": function (t, b, c, d) {
            if (t===0) return b;
            if (t==d) return b+c;
            if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
            return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
        },

        "ease-in-circ": function (t, b, c, d) {
            return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
        },

        "ease-out-circ": function (t, b, c, d) {
            return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
        },

        "ease-in-out-circ": function (t, b, c, d) {
            if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
            return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
        },

        "ease-in-elastic": function (t, b, c, d, a, p) {
            a = a || 0;
            if (t===0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*0.3;
            if (a < Math.abs(c)) { a=c; var s=p/4; }
            else var s = p/(2*Math.PI) * Math.asin (c/a);
            return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
        },

        "ease-out-elastic": function (t, b, c, d, a, p) {
            a = a || 0;
            if (t===0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*0.3;
            if (a < Math.abs(c)) { a=c; var s=p/4; }
            else var s = p/(2*Math.PI) * Math.asin (c/a);
            return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
        },

        "ease-in-out-elastic": function (t, b, c, d, a, p) {
            a = a || 0;
            if (t===0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(0.3*1.5);
            if (a < Math.abs(c)) { a=c; var s=p/4; }
            else var s = p/(2*Math.PI) * Math.asin (c/a);
            if (t < 1) return -0.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
            return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*0.5 + c + b;
        },

        "ease-in-back": function (t, b, c, d, s) {
            if (s === undefined) s = 1.70158;
            return c*(t/=d)*t*((s+1)*t - s) + b;
        },

        "ease-out-back": function (t, b, c, d, s) {
            if (s === undefined) s = 1.70158;
            return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
        },

        "ease-in-out-back": function (t, b, c, d, s) {
            if (s === undefined) s = 1.70158;
            if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
            return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
        },

        "ease-in-bounce": function (t, b, c, d) {
            return c - easing["ease-out-bounce"](d-t, 0, c, d) + b;
        },

        "ease-out-bounce": function (t, b, c, d) {
            if ((t/=d) < (1/2.75)) {
                return c*(7.5625*t*t) + b;
            } else if (t < (2/2.75)) {
                return c*(7.5625*(t-=(1.5/2.75))*t + 0.75) + b;
            } else if (t < (2.5/2.75)) {
                return c*(7.5625*(t-=(2.25/2.75))*t + 0.9375) + b;
            } else {
                return c*(7.5625*(t-=(2.625/2.75))*t + 0.984375) + b;
            }
        },

        "ease-in-out-bounce": function (t, b, c, d) {
            if (t < d/2) return easing["ease-in-bounce"](t*2, 0, c, d) * 0.5 + b;
            return easing["ease-out-bounce"](t*2-d, 0, c, d) * 0.5 + c*0.5 + b;
        },

        // Deprecated, will be replaced by the new syntax for calling easing functions
        cubicBezier: function (x1, y1, x2, y2, time) {

            // Inspired by Don Lancaster's two articles
            // http://www.tinaja.com/glib/cubemath.pdf
            // http://www.tinaja.com/text/bezmath.html


                // Set start and end point
            var x0 = 0,
                y0 = 0,
                x3 = 1,
                y3 = 1,

                // Convert the coordinates to equation space
                A = x3 - 3*x2 + 3*x1 - x0,
                B = 3*x2 - 6*x1 + 3*x0,
                C = 3*x1 - 3*x0,
                D = x0,
                E = y3 - 3*y2 + 3*y1 - y0,
                F = 3*y2 - 6*y1 + 3*y0,
                G = 3*y1 - 3*y0,
                H = y0,

                // Variables for the loop below
                t = time,
                iterations = 5,
                i, slope, x, y;

            if(time <= 0)
                return 0;

            // Loop through a few times to get a more accurate time value, according to the Newton-Raphson method
            // http://en.wikipedia.org/wiki/Newton's_method
            for (i = 0; i < iterations; i++) {

                // The curve's x equation for the current time value
                x = A* t*t*t + B*t*t + C*t + D;

                // The slope we want is the inverse of the derivate of x
                slope = 1 / (3*A*t*t + 2*B*t + C);

                // Get the next estimated time value, which will be more accurate than the one before
                t -= (x - time) * slope;
                t = t > 1 ? 1 : (t < 0 ? 0 : t);
            }

            // Find the y value through the curve's y equation, with the now more accurate time value
            y = Math.abs(E*t*t*t + F*t*t + G*t * H);

            return y;
        }
    };
    return callback && callback.call(this, easing);
}).call(typeof window !== "undefined" ? window : this, function(easing){
    var toString = Object.prototype.toString;

    var isObject = function(v){
        return toString.call(v) === "[object Object]";
    };
    
    var extend = function(a, b){
        var n;
        if (!a) {
            a = {};
        }
        for (n in b) {
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

    var requestAnimationFrame = this.requestAnimationFrame
        || this.mozRequestAnimationFrame
        || this.webkitRequestAnimationFrame
        || this.msRequestAnimationFrame
        || this.oRequestAnimationFrame
        || function(callback){
            return setTimeout(callback, 1000 / 60);
        };
    var cancelAnimationFrame = this.cancelAnimationFrame
        || this.webkitCancelAnimationFrame
        || this.mozCancelAnimationFrame
        || this.oCancelAnimationFrame
        || function(id){
            clearTimeout(id);
        };

    var parseCubicBezier = function(value){
        var x1, y1, x2, y2;
        var bezier = value.match(/cubic-bezier\(\s*(.*?),\s*(.*?),\s*(.*?),\s*(.*?)\)/);
        if(bezier){
            isNaN(x1 = parseFloat(bezier[1], 10)) && (x1 = 0);
            isNaN(y1 = parseFloat(bezier[2], 10)) && (y1 = 0);
            isNaN(x2 = parseFloat(bezier[3], 10)) && (x2 = 1);
            isNaN(y2 = parseFloat(bezier[4], 10)) && (y2 = 1);

            return function(time){
                return easing.cubicBezier(x1, y1, x2, y2, time);
            };
        }
    };
    var propFilter = function(props, key, a, b, k){
        if(typeof a === "number"){
            props[key] = a + (b - a) * k;
        }
        else if(typeof a === "object" && typeof b === "object"){
            for(var p in b){
                propFilter(props[key], p, a[p], b[p], k);
            }
        }
    };
    var easingFn = function(type){      
        var fn;     
        if(typeof type === "function"){
            return type;        
        }       
        else if(typeof type === "string"){      
            if(!!~type.indexOf("cubic-bezier")){        
                fn = parseCubicBezier(type) || easing["linear"];        
            }       
            else{       
                fn = easing[type] || easing["linear"];      
            }       
        }       
        else{       
            fn = easing["linear"];      
        }       
        return fn;      
    };

    function runAnimation(animators){
        var now = new Date().getTime(),
            ani;
        var isAnim = true,
            i = 0,
            ii = animators.length;
        for(; i < ii; i++) if(!(ani = animators[i]).paused && !ani.done){
            var nextd = ani.next,
                target = ani.target;
            var time = now - ani.start,
                duration = ani.duration,
                easefy = ani.easefy,
                step = ani.step,
                complete = ani.complete;
            var timer;
            isAnim = false;
            if(time < 0){
                continue;
            }
            if(time < duration){
                timer = easefy(time, duration, now);
                step(target, timer);
            }
            else{
                step(target, timer = 1);
                complete(target, timer);
                //animators.splice(i--, 1);
                ani.done = true;
                //--count;
                if(ani.repeat > 1 && !nextd){

                }
                //if(nextd && !ani.stop){
                    //animation(me.animators.slice());
                //}
            }
        }
        //console.log(isAnim)
        //return animators.length <= 0;
        return isAnim;
    }

    var aniQueue = [];
    /**
     * Class Animation
    **/
    function Animation(){
        this.animators = [];
        this.running = false;
        if(aniQueue.length > 1){
            //aniQueue.pop();
        }
        aniQueue.push(this);
    }
    Animation.prototype = {
        stop: function(gotoEnd){
            var animators = this.animators;
            animators.forEach(function(ani){
                if(gotoEnd){
                    ani.step(ani.target, 1);
                }
            });
            //this.prev = aniQueue.shift();
            return this;
        },
        addAnimate: function(){
            //this.stop();
            var args = Array.prototype.slice.call(arguments, 0),
                target = {},
                options = {},
                defaultOptions = {
                    duration: 500,
                    easing: "linear",
                    step: function(){},
                    complete: function(){}
                };
            var easing, duration, delay, step, complete;
            if(!args.length){
                return this;
            }
            if(args.length > 1){
                target = args[0] || {};
                options = args[1] || defaultOptions;
            }
            else{
                target = {};
                options = args[0] || defaultOptions;
            }
            step = options.step, complete = options.complete, easing = options.easing;

            duration = Math.max(1, options.duration) || defaultOptions.duration;
            delay = options.delay || 0;
            step = typeof step === "function" ? step : defaultOptions.step;
            //console.log(duration)
            complete = typeof complete === "function" ? complete : defaultOptions.complete;

            var tweens = easingFn(easing),
                timestamp = new Date().getTime();

            this.animators.push({
                //percent: percent,
                target: target,
                timestamp: timestamp,
                start: timestamp + delay,
                stop: false,
                duration: duration,
                easefy: function(t, d){
                    return tweens.length === 1 ? tweens(t / d) : tweens(t, 0, 1, d);
                },
                step: function(target, percent){
                    step(target, percent);
                },
                complete: function(target, percent){
                    complete(target, percent);
                },
            });
        },
        fire: function(step, complete){
            var me = this.prev || this;
            //var animators = me.animators;
            if(!aniQueue.length){
                complete();
            }
            var t;
            var animation = function(){
                me.running = true;
                function loop(){
                    if(me.running){
                        var isAnim;
                        step && step();
                        //isAnim = runAnimation(animators);
                        for(var i = 0; i < aniQueue.length; i++){
                            var f = runAnimation(aniQueue[i].animators);
                            if(f){
                                aniQueue.splice(i--, 1);
                            }
                        }
                        isAnim = !aniQueue.length;
                        if(!isAnim){
                            t = requestAnimationFrame(loop);
                        }
                        else{
                            //me.running = false;
                            //me.stop(1);
                            step && step(1);
                            /*animators.forEach(function(ani){
                                ani.step(ani.target, 1);
                            });*/
                            //t && cancelAnimationFrame(t);
                            complete && complete.call(me);
                            //aniQueue = [];
                        }
                    }
                }
                requestAnimationFrame(loop);
            };
            animation();
        }
    };

    if (typeof Dalaba !== "undefined") {
        Dalaba.Animation = Animation;
    }

    if (typeof module === "object" && module.exports) {
        module.exports = Animation;
    }
    else if (typeof define === "function" && define.amd) {
        define(function() {
            return Animation;
        });
    }
    return Animation;
});;
    (function(global) {
    /**
     * TouchJS - v1.0.0
     * 2016-11-04
     * Class Touch
     * @example
     * new Touch(DOM).on({
     *     tap: function(){},
     *     swipe: function(){},
     *     pan: function(){},
     *     press: function(){},
     *     pinch: function(){},
     *     rotate: function(),
     *     translate: function(){},
     *     scale: function(){}
     * });
    */
    var toString = Object.prototype.toString;

    var arraySlice = Array.prototype.slice;

    var defined = function (o) { return typeof o !== "undefined" || o !== null; };

    var isObject = function (o) { return toString.call(o) === "[object Object]"; };

    var isFunction = function (o) { return toString.call(o) === "[object Function]"; };

    var noop = function () {};

    var EVENT_TOUCH_START = "touchstart",
        EVENT_TOUCH_MOVE = "touchmove",
        EVENT_TOUCH_END = "touchend",
        EVENT_TOUCH_CANCEL = "touchcancel";


    var defaultFunction = function(fn) {
        return isFunction(fn) ? fn : noop;
    };
    

    var Touch = function (node, options) {
        return new Touch.init(node, options);
    };

    Touch.init = function (node, options) {
        if(node && node.nodeType !== 1){
            throw Error("not a HTMLElement.");
        }
        this.node = node;
        this.options = isObject(options) ? options : {};
        this.globalTimer = null;
        this.v1 = [];
        this.v2 = [];

        return this;
    };

    var touchProto = Touch.prototype;

    touchProto = {
        constructor: Touch,
        events: {
            touchStart: null,
            touchMove: null,
            touchEnd: null,
            touchCancel: null
        },
        on: function(options) {
            var node = this.node;
            var useCapture = options.useCapture,
                isScrolling = options.isScrolling === true;
            var events = this.events;

            var timestamp;
            
            var firstTouched = {
                isFirst: false,
                isMultiPoint: false,
                isPressed: false
            };
            var lastScalePoint = {x: 0, y: 0};

            var callback;

            var touch = this;


            useCapture = !(defined(useCapture) ? !useCapture : useCapture);

            if(arguments[1]){
                isFunction(callback = arguments[1] || noop) || noop;
            }
            var onPress = defaultFunction(options.press),
                onSwipe = defaultFunction(options.swipe),
                onTap = function(e, touch){
                    var v1 = touch.v1[0],
                        v2 = arraySlice.call(e.changedTouches)[0];
                    var dx = v1.clientX - v2.clientX,
                        dy = v1.clientY - v2.clientY;

                    if(0.1 * 0.1 - dx * dx - dy * dy > 0.001){
                        defaultFunction(options.tap).call(this, e, touch);
                    }
                },
                onPinch = function(e, touch) {
                    var v1 = touch.v1,
                        v2 = touch.v2;
                    if(v2.length > 1 && v1.length > 1){
                        var target = e.target,
                            bbox = target.getBoundingClientRect();
                        
                        var v2x = v2[1].clientX - v2[0].clientX,
                            v2y = v2[1].clientY - v2[0].clientY;
                        var length = +(v2x * v2x > lastScalePoint.x * lastScalePoint.x || -1);
                        var scale = Math.sqrt(v2x * v2x + v2y * v2y) / bbox.width;
                        //scale = Math.sqrt(source.x * source.x + source.y * source.y) / Math.sqrt(target.x * target.x + target.y * target.y);

                        lastScalePoint.x = v2x;

                        e.originEvent = {
                            vector: {
                                length: length,//<1 -1>
                                scale: scale
                            }
                        };
                        
                        defaultFunction(options.pinch).call(this, e, touch);
                    }
                };


            events.touchStart = function(e) {
                var node = this;
                
                touch.v1 = arraySlice.call(e.touches);
                timestamp = new Date().getTime();
                firstTouched.isPressed = true;

                touch.status = "start";
                setTimeout(function() {
                    firstTouched.isMultiPoint || onPress.call(node, e, touch);//press
                }.call(touch), 250);
            };
            events.touchMove = function(e) {
                var node = this;
                touch.v2 = arraySlice.call(e.touches);//simple point
                if(!firstTouched.isFirst){
                    firstTouched.isFirst = !firstTouched.isFirst;
                    touch.status = "start";

                    firstTouched.isMultiPoint = touch.v2.length > 1;
                    if(firstTouched.isMultiPoint){
                        lastScalePoint.x = touch.v2[1].clientX - touch.v2[0].clientX;
                        lastScalePoint.y = touch.v2[1].clientY - touch.v2[0].clientY;
                    }
                    else{
                        onSwipe.call(node, e, touch);
                    }
                }
                touch.status = "move";

                if(firstTouched.isMultiPoint){
                    onPinch.call(node, e, touch);
                }
                else{
                    onSwipe.call(node, e, touch);
                }

                if(touch.isHorizontal() || firstTouched.isMultiPoint || isScrolling){
                    e.preventDefault && e.preventDefault();
                    return false;
                }
            };
            events.touchEnd = function(e) {
                var node = this;
                touch.status = "end";
                firstTouched.isPressed && onTap.call(node, e, touch);
                (firstTouched.isMultiPoint = firstTouched.isFirst = firstTouched.isPressed = false) || onSwipe.call(node, e, touch);
                touch.destroy();
            };
            events.touchCancel = function(){
                touch.destroy();
            };

            this.free();

            node.addEventListener(EVENT_TOUCH_START, events.touchStart, useCapture);
            node.addEventListener(EVENT_TOUCH_MOVE, events.touchMove, useCapture);
            node.addEventListener(EVENT_TOUCH_END, events.touchEnd, useCapture);
            node.addEventListener(EVENT_TOUCH_CANCEL, events.touchCancel , useCapture);

            return this;
        },
        free: function() {
            var options = this.options,
                useCapture = options.useCapture;
            var node = this.node,
                events = this.events;
            useCapture = !(defined(useCapture) ? !useCapture : useCapture);

            this.destroy();
            [
                [events.touchStart, EVENT_TOUCH_START],
                [events.touchMove, EVENT_TOUCH_MOVE],
                [events.touchEnd, EVENT_TOUCH_END],
                [events.touchCancel, EVENT_TOUCH_CANCEL],
            ].forEach(function(event){
                event[0] && (node.removeEventListener(event[1], event[0], useCapture), event[0] = null);
            });
        },
        isHorizontal: function() {
            var v1 = this.v1[0],
                v2 = this.v2[0];
            var x1, y1, x2, y2;
            x1 = v1.clientX, y1 = v1.clientY;
            x2 = v2.clientX, y2 = v2.clientY;
            return Math.abs(x2 - x1) > Math.abs(y2 - y1);
        },
        destroy: function() {
            /*this.v1 = [];
            this.v2 = [];*/
        }
    };
    Touch.init.prototype = touchProto;
    
    if (typeof module === "object" && module.exports) {
        module.exports = Touch;
    }
    else if (typeof define === "function" && define.amd) {
        define(function(){
            return Touch;
        });
    }
    else {
        (typeof Dalaba !== "undefined" ? Dalaba : global).Touch = Touch;
    }
})(typeof window !== "undefined" ? window : this);;
    if (Dalaba.Chart.hasTouch) {
    Dalaba.Chart.setOptions({
        legend: {
            itemMarginBottom: 12
        },
        tooltip: {
            backgroundColor: "#00bfa9",
            shadow: false,
            style: {
                fontSize: "14px",
                color: "#FFFFFF"
            },
            positioner: function(x, y, position){
                return {x: position.plotX, y: 0};
            },
            hideDelay: 0
        },
        plotOptions: {
            line: {
                lineWidth: 3,
                marker: {
                    fillColor: "#FFFFFF",
                    lineWidth: 2
                }
            },
            spline: {
                lineWidth: 3,
                marker: {
                    fillColor: "#FFFFFF",
                    lineWidth: 2
                }
            },
            area: {
                lineWidth: 1,
                marker: {
                    fillColor: "#FFFFFF",
                    lineWidth: 2
                }
            },
            areaspline: {
                lineWidth: 1,
                marker: {
                    fillColor: "#FFFFFF",
                    lineWidth: 2
                }
            },
            pie: {
                borderWidth: 0,
                dataLabels: {
                    connectorWidth: 1.5,
                    inside: true,
                    style: {
                        fontSize: "14px"
                    }
                }
            },
            funnel: {
                borderWidth: 0
            }
        }
    });
};

    //layout
    (function () {
    /**
     * Dalaba.Layout.Cluster
     * Dalaba.Layout.Partition
     * Dalaba.Layout.Tree
     * Dalaba.Layout.Treemap
     * Dalaba.Layout.Indent
     * Dalaba.Layout.Area
     * Dalaba.Layout.Pack
     * Dalaba.Layout.Hierarchy
    */
    "use strict";

    var MAX_VALUE = Number.MAX_VALUE;

    function hierarchy (node, depth, nodes) {
        var children = (function (d) {
            return d.children;
        }).call(null, node);
        var length,
            i = 0,
            v = 0,
            c,
            d;
        node.depth = depth;
        nodes.push(node);
        if (children && (length = children.length)) {
            c = node.children = [];
            v = 0;
            for (; i < length; i++) {
                d = hierarchy(children[i], depth + 1, nodes);
                d.parent = node;
                c.push(d);
                v += d.value;
            }
            //c.sort(function(a, b){ return a.value - b.value; });
            //if(sort) c.sort(sort);
            if(typeof node.value === "undefined") node.value = v;
        }
        /*else if(value){
            node.value = +value.call(null, node, depth) || 0;
        }*/
        return node;
    }

    /**
     * Treemap
    */
    function Treemap() {
        this.init.apply(this, arguments);
    }

    Treemap.prototype = {
        init: function(data, options) {
            var size = options.size || [1, 1];
            this.nodes = [];
            hierarchy(data, 0, this.nodes);
            this.squarify(this.nodes[0], size);
        },
        squarify: function(node, size){
            var children = node.children,
                n;
            var treemap = this;
            //console.log(node);
            if(!node.parent){
                node.x = node.y = 0;
                node.dx = size[0], node.dy = size[1];
                treemap.scale([node], node.dx * node.dy / node.value);
            }
            var row = [],
                nodes;
            var box = {
                x: node.x,
                y: node.y,
                dx: node.dx,
                dy: node.dy
            };
            var u = Math.min(node.dx, node.dy);
            var best = MAX_VALUE;
            var child;
            var s;
            
            if(children && (n = children.length)){
                //console.log(node);
                nodes = children.slice();
                treemap.scale(nodes, box.dx * box.dy / node.value);
                row.area = 0;
                while((n = nodes.length) > 0){
                    row.push(child = nodes[n - 1]);
                    row.area += child.area;
                    
                    if((s = treemap.worst(row, row.area, u)) <= best){
                        best = s;
                        nodes.pop();
                    }
                    else{
                        row.area -= row.pop().area;
                        treemap.position(row, u, box, false);
                        u = Math.min(box.dx, box.dy);
                        row.length = row.area = 0;
                        best = MAX_VALUE;
                    }
                }
                if(row.length){
                    treemap.position(row, u, box, true);
                    row.length = 0;
                    row.area = 0;
                }
                children.forEach(function(node){
                    treemap.squarify(node, size);
                });
            }
        },
        scale: function(children, k){
            var child, area;
            for(var i = 0, n = children.length; i < n; i++){
                area = (child = children[i]).value * (k < 0 ? 0 : k);
                child.area = isNaN(area) || area < 0 ? 0 : area;
            }
        },
        worst: function(row, v, u){
            var ratio = (1 + Math.sqrt(5)) / 2;//glod ratio
            var min = MAX_VALUE,
                max = 0;
            var a;
            for(var i = 0; i < row.length; i++){
                if(a = row[i].area){
                    min = Math.min(min, a);
                    max = Math.max(max, a);
                }
            }
            v = v * v;
            u = u * u;
            return v ? Math.max(u * max * ratio / v, v / (u * min * ratio)) : MAX_VALUE;
        },
        position: function(row, u, box, flush){
            var n = row.length,
                i = 0;
            var x = box.x,
                y = box.y;
            var w = u ? Math.round(row.area / u) : 0;
            var r;
            if(u === box.dx){
                if(flush || w > box.dy) w = box.dy;
                
                for(; i < n; i++){
                    r = row[i];
                    r.x = x;
                    r.y = y;
                    r.dy = w;
                    r.dx = Math.min(box.x + box.dx - x, w ? Math.round(r.area / w) : 0);
                    x += r.dx;
                }
                //last
                r.dx += box.x + box.dx - x;
                box.y += w;
                box.dy -= w;
            }
            else{
                if(flush || w > box.dx) w = box.dx;
                for(; i < n; i++){
                    r = row[i];
                    r.x = x;
                    r.y = y;
                    r.dx = w;
                    r.dy = Math.min(box.y + box.dy - y, w ? Math.round(r.area / w) : 0);
                    y += r.dy;
                }
                r.dy += box.y + box.dy - y;
                box.x += w;
                box.dx -= w;
            }
        }
    };

    /**
     * Grid Layout
     */

    var Grid = function() {
        this.options = {};
        this.init.apply(this, arguments);
    }, grid = function(Grid) {
        var grid;

        var gridInterpolate = function(a, b, t) {
            return a + (b - a) * t;
        };

        var gridItem = function(d, x, y, width, height) {
            d.x = x;
            d.y = y;
            d.width = width;
            d.height = height;
        };

        grid = Grid.prototype = {
            init: function(data, options) {
                var args = arguments,
                    n = args.length;
                var width = 1,
                    height = 1;
                var size = [10, 5];
                var col = 1, row = 1;

                var defaultOptions = {
                    width: width,
                    height: height,
                    size: size,
                    row: row,
                    col: col
                }, settings;

                if (!n) return this;

                this.options = settings = n === 1
                    ? extend(defaultOptions, {nodes: pack("array", data && data.data, [])},  data || {})
                    : extend(defaultOptions, {nodes: pack("array", data, [])}, options || {});

                if (isNumber(settings.size, true)) {
                    settings.size = [settings.size, settings.size];
                }
                if (isArray(size = settings.size)) {
                    size.length && size.length < 2 && (size = [size[0], size[0]]);
                    this.options.size = settings.size = [
                        pack("number", Math.max(1, size[0], 1)),
                        pack("number", Math.max(1, size[1], 1))
                    ];
                }

                if (isNumber(this.options.col)) col = Math.max(col, this.options.col);
                if (isNumber(this.options.row)) row = Math.max(row, this.options.row);

                if (!isNumber(settings.width, true) || (isNumber(settings.width, true) && settings.width < 0))
                    this.options.width = 1;
                if (!isNumber(settings.height, true) || (isNumber(settings.height, true) && settings.height < 0))
                    this.options.height = 1;

                if (!isArray(settings.size) || (isArray(size = settings.size) && !size.length)) {
                    this.options.size = defaultOptions.size;
                }

                isArray(settings.nodes) && settings.nodes.length && this.setLayout();
            },
            setLayout: function() {
                var options = this.options,
                    width = options.width,
                    height = options.height,
                    size = options.size;
                var nodes = options.nodes,
                    row = options.row,
                    col = options.col;
                var margin = options.margin;

                var nodePaddingLeft, nodePaddingTop;

                var groups = partition(nodes, function(a, b) {
                    return pack("number", a.group) === pack("number", b.group);
                });
                row = Math.max(groups.length, row);
                col = Math.max.apply(Math, groups.map(function(group) { return group.length; }));
                nodePaddingLeft = width / col;
                nodePaddingTop = height / row;

                groups.forEach(function(group, i) {
                    var sumWidth = 0;
                    group.forEach(function(d, j) {
                        var w = pack("number", d.width, size[0]),
                            h = pack("number", d.height, size[1]);
                        gridItem(d,
                            sumWidth = gridInterpolate(margin[3], nodePaddingLeft, j),
                            gridInterpolate(margin[0], nodePaddingTop, i),
                            w, h
                        );
                    });
                    group.forEach(function(d) {
                        gridItem(d, d.x + (width - sumWidth - d.width) / 2, d.y + (nodePaddingTop - margin[0]) / 2, d.width, d.height);
                    });
                });
            }
        };

        return grid;
    }(Grid);

    grid.constructor = Grid;

    /**
     * RadialTree Layout
     */

    var RadialTree = function() {
        this.options = {};
        this.init.apply(this, arguments);
    }, radialTree = function(RadialTree) {

        var radialTree = RadialTree.prototype = {
            init: function(data, options) {
                var args = arguments,
                    n = args.length;
                var width = 1,
                    height = 1;
                var size = [10, 5];

                var defaultOptions = {
                    width: width,
                    height: height,
                    size: size
                }, settings;

                if (!n) return this;

                this.options = settings = n === 1
                    ? extend(defaultOptions, {nodes: pack("array", data && data.data, [])},  data || {})
                    : extend(defaultOptions, {nodes: pack("array", data, [])}, options || {});

                isArray(settings.nodes) && settings.nodes.length && this.setLayout();
            },
            setLayout: function() {

            }
        };
        return radialTree;
    }(RadialTree);

    radialTree.constructor = RadialTree;


    function factoy(Dalaba) {
        var pick = Dalaba.pick;

        var extend = Dalaba.extend;

        var defined = Dalaba.defined;

        var isArray = Dalaba.isArray;

        var isNumber = Dalaba.isNumber;

        var Intersection = Dalaba.Geometry.Intersection;


        /**
         * Layuot
        */

        var Layout = {
            Pack: Pack,
            Treemap: Treemap,
            Grid: Grid,
            RadialTree: RadialTree
        };

        /**
         * Pack
        */
        function Pack () {
            this.init.apply(this, arguments);
        }
        Pack.create = (function () {
            function tree (node) {
                var children = node.children;
                if (children && children.length) {
                    children.forEach(tree);
                    node.radius = radii(children);
                }
                else {
                    node.radius = Math.sqrt(node.value);
                }
            }
            function insert(a, b){
                var c = a.next;
                a.next = b;
                b.prev = a;
                b.next = c;
                c.prev = b;
            }
            function splice(a, b){
                a.next = b;
                b.prev = a;
            }

            function place(a, b, c){
                var dx = b.x - a.x,
                    dy = b.y - a.y,
                    dc = Math.sqrt(dx * dx + dy * dy);
                var da = b.radius + c.radius,
                    db = a.radius + c.radius;
                var cos = Math.min(1, Math.max(-1, (db * db + dc * dc - da * da) / (2 * db * dc))),
                    x = cos * db,
                    y = Math.sin(Math.acos(cos)) * db;
                if(dc){
                    dx /= dc;
                    dy /= dc;
                    c.x = a.x + x * dx + y * dy;
                    c.y = a.y + x * dy - y * dx;
                }
                else{
                    c.x = a.x + dc;
                    c.y = a.y;
                }
            }
            function add(node){
                node.next = node.prev = node;
            }
            function removed(node){
                delete node.next, delete node.prev;
            }
            function radii(nodes){
                var xMin = MAX_VALUE,
                    xMax = -xMin,
                    yMin = xMin,
                    yMax = xMax;

                function bound(node){
                    xMin = Math.min(node.x - node.radius, xMin);
                    xMax = Math.max(node.x + node.radius, xMax);
                    yMin = Math.min(node.y - node.radius, yMin);
                    yMax = Math.max(node.y + node.radius, yMax);
                }
                nodes.forEach(add);

                var a, b, c;
                //first node
                a = nodes[0];
                a.x = -a.radius;
                a.y = 0;
                bound(a);

                //second node
                if(nodes.length > 1){
                    b = nodes[1];
                    b.x = b.radius;
                    b.y = 0;
                    bound(b);

                    if(nodes.length > 2){
                        c = nodes[2];
                        place(a, b, c);
                        bound(c);
                        insert(a, c);
                        a.prev = c;
                        insert(c, b);
                        b = a.next;

                        for(var i = 3; i < nodes.length; i++){
                            var ins = 0, s1 = 1, s2 = 1;
                            place(a, b, c = nodes[i]);
                            for(var j = b.next; j !== b; j = j.next, s1++){
                                if(!Intersection.circle(j, c)){
                                    ins = 1;
                                    break;
                                }
                            }

                            if(ins === 1){
                                for(var k = a.prev; k !== j.prev; k = k.prev, s2++){
                                    if(!Intersection.circle(k, c)){
                                        if(s2 < s1){
                                            ins = -1;
                                            j = k;
                                        }
                                        break;
                                    }
                                }
                            }
                            //update
                            if(ins === 0){
                                insert(a, c);
                                b = c;
                                bound(c);
                            }
                            else if(ins > 0){
                                splice(a, j);
                                b = j;
                                i--;
                            }
                            else if(ins < 0){
                                splice(j, b);
                                a = j;
                                i--;
                            }
                        }
                    }
                }

                var cx = (xMin + xMax) / 2,
                    cy = (yMin + yMax) / 2,
                    cr = 0;
                nodes.forEach(function(node){
                    node.x -= cx;
                    node.y -= cy;
                    cr = Math.max(cr, node.radius + Math.sqrt(node.x * node.x + node.y * node.y));
                });
                //console.log(cx, cy, cr)
                nodes.forEach(removed);
                return cr;
            }
            function transform(node, x, y, k){
                var children = node.children;
                x += node.x * k;
                y += node.y * k;

                node.x = x, node.y = y, node.radius *= k;

                if(children) for(var i = 0; i < children.length; i++)
                    transform(children[i], x, y, k);
            }
            return function(data, nodes){
                var root, depth = 0;

                hierarchy(data, depth, nodes);
                root = nodes[0];
                //console.log(root)

                return {
                    sort: function(sort){
                        (function(node, callback){
                            var first = [node], second = [];
                            var i, n, children;
                            while((node = first.pop()) != null){
                                second.push(node);
                                if((children = node.children) && (i = -1, n = children.length)) while(++i < n)
                                    first.push(children[i]);
                            }
                            while((node = second.pop()) != null)
                                callback(node);
                        })(root, function(node){
                            if(node.children && defined(sort)) node.children.sort(sort);
                        });
                        return this;
                    },
                    tree: function(){
                        root.x = 0;
                        root.y = 0;
                        tree(root);
                        return this;
                    },
                    transform: function(w, h){
                        var k = 1 / Math.max(root.radius * 2 / w, root.radius * 2 / h);
                        transform(root, w / 2, h / 2, k);
                    }
                };
            };
        })();
        Pack.prototype = {
            init: function(data, options){
                this.data = [];
                this.options = extend({
                    nodes: data
                }, options || {});

                if (!defined(this.options.nodes) || arguments.length < 2) {
                    return this;
                }

                var w = options.size[0],
                    h = options.size[1];
                Pack.create.call(this, this.options.nodes, this.data)
                    .sort(options.sort)
                    .tree()
                    .transform(w, h);

                return this;
            },
            pack: function(){
                return this.init(this.options.nodes, this.options);
            },
            padding: function(x){
                var options = this.options;
                if(isNumber(x)){
                    options.padding = x;
                    return this;
                }
                return pick("number", options.padding, 0);
            },
            sort: function(x){
                var options = this.options;
                if(defined(x)){
                    options.sort = x;
                    return this;
                }
                return options.sort;
            },
            size: function(x){
                var options = this.options;
                if(isArray(x)){
                    !isNumber(x[0]) && (x[0] = 0);
                    x = !isNumber(x[1]) ? [x, x] : x;
                    options.size = x;
                    return this;
                }
                return options.size;
            },
            nodes: function(x){
                var options = this.options;
                if(x){
                    options.nodes = x;
                    return this;
                }
                return this.data;
            }
        };

        Dalaba.Layout = Layout;

        return Layout;
    }
    var exports = (function (global) {
        return {
            deps: function () {
                var args = Array.prototype.slice.call(arguments, 0);
                return factoy.apply(global, [].concat(args));
            }
        };
    })(this);

    if(typeof module === "object" && module.exports){
        module.exports = exports;
    }
    else if(typeof define === "function" && define.amd){
        define([], function(){
            return exports;
        });
    }
    return exports;
}).call(typeof window !== "undefined" ? window : this).deps(Dalaba);

    if (typeof module === "object" && module.exports) {
        module.exports = Dalaba;
    }
    else if (typeof define === "function" && define.amd) {
        define(function() {
            return Dalaba;
        });
    }
    else {
        global.Dalaba = Dalaba;
    }
})(typeof window !== "undefined" ? window : this);