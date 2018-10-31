(function () {

    var noop = function () {};

    function factory (Dalaba) {
        var isArray = Dalaba.isArray;

        var isFunction = Dalaba.isFunction;

        var extend = Dalaba.extend;


        var dfs = function dfs(root, callbacks) {
            var nodes = isArray(root) ? root : [root];
            var n = nodes.length,
                i = -1;
            var node, childs;

            while (++i < n && (node = nodes[i])) {
                callbacks[0] && callbacks[0].call(node, node, i, nodes);
                if (isArray(childs = node.children) && childs.length) {
                    dfs(childs, callbacks);
                }
                callbacks[1] && callbacks[1].call(node, node, i, nodes);
            }
        };

        var bfs = function (root, callback) {
            var queue = (isArray(root) ? root : [root]).slice();
            var n, i;
            var node, childs;

            while (queue.length) {
                node = queue.shift();
                childs = (node.children || []).slice();
                callback && callback.call(node, node, queue.length - 1, queue);
                if (isArray(childs) && (i = -1, n = childs.length)) for (; ++i < n; ) {
                    queue.push(childs[i]);
                }
            }
        };

        var vstack = function (source, target) {
            var root, ids;
            return function (data) {
                var args = [].slice.call(arguments, 1);
                var node, parent;
                var nodes = [];

                var n, i = -1;

                root = [];
                ids = {};

                if (!isArray(data)) return root;

                n = data.length;

                if (args.length) {
                    args[0] && (source = String(args[0]));
                    args[1] && (target = String(args[1]));
                }
                // use the key algorithm O(n)
                
                while (++i < n) if (node = data[i]) {
                    nodes.push(extend({}, node));// copy
                    node = nodes[nodes.length - 1];
                    ids[node[source]] = node;
                }

                for (i = 0; i < n; i++) if (node = nodes[i]) {
                    parent = ids[node[target]];
                    if (parent) {
                        (parent.children = parent.children || []).push(node);
                    }
                    else {
                        root.push(node);
                    }
                }
                ids = nodes = null;
                return root;
            };
        };

        var hstack = function (source, target) {
            return function (root) {
                var args = [].slice.call(arguments, 1);
                var nodes = [],
                    newNode = {};
                var count = 0;
                var path = [];

                if (args.length) {
                    args[0] && (source = String(args[0]));
                    args[1] && (target = String(args[1]));
                }

                newNode[source] = -1;// root
                path.push(newNode);

                dfs(root, [function (node) {
                    newNode = extend({}, node);
                    newNode[source] = count++;
                    path.push(newNode);
                }, function () {
                    newNode = path.pop();// Backtracking using stack to the last element
                    newNode[target] = path[path.length - 1][source];
                    nodes.push(newNode);
                }]);
                path = null;
                return nodes;
            };
        };
        
        return {
            /**
             * deep first search
             * @ordered {Boolean}
             *        1
             *       / \
             *      2   3
             *     / \   \
             *    4   5   6
             *       / \
             *      7   8
             * ordered is false or default: 4 7 8 5 2 6 3 1 (ROOT-L-R), 后序遍历
             * ordered is true: 1 2 4 5 7 8 3 6 (L-R-ROOT)
             * @example
             * const root = [{
             *   value: 1,
             *   children: [{
             *      value: 2,
             *      children: [{ value: 4 }, { value: 5, children: [{value: 7}, {value: 8}] }]
             *   }, {
             *      value: 3,
             *      children: [{value: 6}]
             *  }]
             * }];
             * dfs(root, value => console.log(value), true)
            **/
            dfs: function (root, callback, ordered) {
                callback = isFunction(callback) ? callback : noop;
                return dfs(root, [null, callback][ordered === true ? "reverse" : "slice"]());
            },
            bfs: bfs,
            /**
             * vertical stack tree
             * @param data {Array}
             * @param id, pid {String} array object key -> parent
             * @returns tree data
             * @example
             * const data = [
             *   { source: 0, target: -1, value: 1},
             *   { source: 1, target: 0, value: 2},
             *   { source: 2, target: 0, value: 3},
             *   { source: 3, target: 1, value: 4},
             *   { source: 4, target: 1, value: 5},
             *   { source: 5, target: 2, value: 6},
             *   { source: 6, target: 4, value: 7},
             *   { source: 7, target: 4, value: 8}
             * }];
             * vstack(data)
            **/
            vstack: vstack("source", "target"),
            hstack: hstack("source", "target")
        };
    }

    return {
        deps: function () {
            return factory.apply(null, [].slice.call(arguments));
        }
    };
}).call(typeof window !== "undefined" ? window : this)