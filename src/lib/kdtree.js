(function(global) {
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
})(typeof window !== "undefined" ? window : this)