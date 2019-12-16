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

    var Grid = function () {
        this.options = {};
        this.init.apply(this, arguments);
    }, grid = function(Grid) {
        var grid;

        var gridInterpolate = function (a, b, t) {
            return a + (b - a) * t;
        };

        var gridItem = function (d, x, y, width, height) {
            d.x = x;
            d.y = y;
            d.width = width;
            d.height = height;
        };

        grid = Grid.prototype = {
            init: function (data, options) {
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
                        pack("number", Math.max(1, size[0]), 1),
                        pack("number", Math.max(1, size[1]), 1)
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
            setLayout: function () {
                var options = this.options,
                    width = options.width,
                    height = options.height,
                    size = options.size;
                var nodes = options.nodes,
                    row = options.row,
                    col = options.col;
                var margin = TRouBLe(options.margin);

                var nodePaddingLeft, nodePaddingTop;

                var groups = partition(nodes, function (a, b) {
                    return pack("number", a.group) === pack("number", b.group);
                });
                row = Math.max(groups.length, row);
                col = Math.max.apply(Math, groups.map(function (group) { return group.length; }));
                nodePaddingLeft = width / col;
                nodePaddingTop = height / row;

                groups.forEach(function (group, i) {
                    var sumWidth = 0;
                    group.forEach(function (d, j) {
                        var w = pack("number", d.width, size[0]),
                            h = pack("number", d.height, size[1]);
                        gridItem(d,
                            sumWidth = gridInterpolate(margin[3], nodePaddingLeft, j),
                            gridInterpolate(margin[0], nodePaddingTop, i),
                            w, h
                        );
                    });
                    group.forEach(function (d) {
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
}).call(typeof window !== "undefined" ? window : this)