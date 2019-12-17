(function (global) {
    var descending = function (a, b) {
        return a - b;
    };

    var ascending = function (a, b, dim) {
        if (dim) {
            return b[dim] - a[dim];
        }
        return b - a;
    };

    var Tree = function (node, parent, dim) {
        this.node = node;
        this.left = null;
        this.right = null;
        this.parent = parent;
        this.dim = dim;
    };

    function factoy (Heap) {
        var heap;

        function buildTree (points, depth, parent, dimensions) {
            var dimn = (dimensions || []).length,
                length = points.length,
                d = depth % Math.max(1, dimn),
                dim,
                sorted = descending,
                m;
            var node;

            if (!length)
                return null;
            if (length === 1)
                return new Tree(points[0], parent, d);//root

            if (dimn) {
                dim = dimensions[d];//dimensions size
                sorted = function (a, b) {
                    return a[dim] - b[dim];
                };
            }
            points.sort(sorted);

            node = new Tree(points[m = points.length >> 1], parent, d);
            node.left = buildTree(points.slice(0, m), depth + 1, node, dimensions);
            node.right = buildTree(points.slice(m + 1), depth + 1, node, dimensions);
            return node;
        }

        var KDTree = function (points, dimensions) {
            return new KDTree.init(points.slice(0), dimensions);
        };

        KDTree.init = function (points, dimensions) {
            this.build(points, dimensions);
            return this;
        };
        KDTree.prototype = {
            build: function (points, dimensions) {
                this.dimensions = dimensions;// || ["x", "y"];
                this.root = buildTree(points, 0, null, this.dimensions);
                heap = new Heap(function (a, b) {
                    return ascending(a, b, "distance");
                });
            },
            nearest: function (point, callback, k) {
                var dimensions = this.dimensions || [];
                var result = [];

                k = Math.max(1, +k) || 1;
                //reset heap
                while (!heap.empty()) {
                    heap.pop();
                }

                function put (node, distance) {
                    heap.push({
                        node: node,
                        distance: distance
                    });
                    if (heap.size() > k) {
                        heap.pop();
                    }
                }

                function search (tree) {
                    var dimension = dimensions[tree.dim];
                    var avalue = callback(point, tree.node), bvalue;
                    var maps = {};
                    var node, child;

                    if (dimensions.length) {
                        dimensions.forEach(function (item, i) {
                            maps[item] = i === dimension ? point[item] : tree.node[item];
                        });
                    }
                    else {
                        maps = point;
                    }
                    bvalue = callback(maps, tree.node);

                    
                    //leaf
                    if (tree.right === null && tree.left === null) {
                        if (heap.size() < k || avalue < heap.peek().distance) {
                            put(tree, avalue);
                        }
                        return null;
                    }

                    if (tree.right === null) {
                        node = tree.left;
                    }
                    else if (tree.left === null) {
                        node = tree.right;
                    }
                    //left && right
                    else {
                        node = (dimensions.length ? point[dimensions[dimension]] < tree.node[dimensions[dimension]] : point < tree.node)
                            ? tree.left
                            : tree.right;
                    }

                    search(node);

                    if (heap.size() < k || avalue < heap.peek().distance) {
                        put(tree, avalue);
                    }

                    if (heap.size() < k || Math.abs(bvalue) < heap.peek().distance) {
                        (child = node === tree.left ? tree.right : tree.left) !== null && search(child);
                    }
                    maps = null;
                }

                if (this.root) {
                    search(this.root);
                    for (var i = 0; i < k; i++) if (!heap.empty() && heap[i].node !== null)
                        result.push(heap[i].node.node);
                }
                return result;
            },
            //TODO
            insert: function () {

            },
            //TODO
            remove: function () {},
            destroy: function () {
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
        deps: function () {
            return factoy.apply(global, [].slice.call(arguments));
        }
    };
})(typeof window !== "undefined" ? window : this)