(function () {

    function factory (trie, dfs) {
        function rangetree () {

            var filter = function (childs) { return childs; };
            var valueOf = function (d) { return d; };

            var tree, tables;
            var splitter = Infinity;
            var dp;

            function build (data) {
                tree = [trie().valueOf(valueOf).splitter(rangetree.splitter())(data).root()];
                return tree;
            }

            function treePath (root) {
                var path = [];
                var nodes = [];
                var tables = {};
                var newNode;
                var deep = 0,
                    hash = "";

                dfs(root, function (node) {
                    newNode = extend({}, node);
                    (newNode.children || []).forEach(function (d, i) {
                        d.index = i;
                    });
                    newNode.deep = deep++;
                    path.push(newNode);
                }, function () {
                    var uri = "",
                        pating = "";
                    var node, parent;
                    path.forEach(function (d) {
                        var index = d.index,
                            code = d.deep.toString(2);
                        var hasIndex = typeof index === "undefined";
                        !hasIndex && (code += index.toString(2));
                        pating += code;
                        if (!d.children) {
                            hash += pating;
                        }
                        uri += d.deep + "" + (hasIndex ? "" : index) + "/";
                    });
                    
                    newNode = path.pop();
                    parent = path[path.length - 1];
                    node = {
                        node: newNode.value,
                        deep: deep,
                        index: newNode.index,
                        row: newNode.range[1],
                        col: newNode.col,
                        range: newNode.range,
                        isLeaf: !newNode.children || (newNode.children && !newNode.children.length),
                        //parent: parent,
                        uri: uri.slice(0, -1),
                    };
                    nodes.push(node);
                    tables[node.uri] = node;
                    deep--;
                });
                path = null;
                if (nodes.length) {
                    nodes[nodes.length - 1].hash = hash;//后序遍历push最后一个节点为根节点
                }
                return tables;
            }
            
            function treeRange (filter) {
                function dfs (tree, deep) {
                    var childs;
                    tree.forEach(function (node) {
                        childs = node.children;
                        if (childs) {
                            if (filter) childs = filter.call(node, childs);
                            dfs(childs, deep + 1);
                            dp[deep] = dp[deep] ? [dp[deep][1] + 1, dp[deep][1] + childs.length] : [0, childs.length - 1];
                            node.range = [dp[deep][0], dp[dp.length - 1][1]];
                        }
                    });
                }
                return dfs;
            }

            function rangetree (data) {
                dp = [];
                tree = build.apply(null, [data].concat([].slice.call(arguments, 1)));

                treeRange(filter)(tree, 0);

                tables = treePath(tree);

                dp = null;

                return rangetree;
            }

            rangetree.filter = function (_) {
                return arguments.length ? (filter = _, rangetree) : filter;
            };

            rangetree.splitter = function (_) {
                return arguments.length ? (splitter = +_, isNaN(splitter) && (splitter = Infinity), rangetree) : splitter;
            };

            rangetree.treePath = function () {
                return tables;
            };

            rangetree.tree = function () {
                return tree;
            };

            rangetree.getXY = function (uri) {
                return tables[uri];
            };

            rangetree.getPath = function (x, y) {
                var table, range, p;
                if (isNumber(x, true) && isNumber(y, true) && x * y >= 0) for (p in tables) if (hasOwnProperty.call(tables, p)) {
                    range = (table = tables[p]).range;
                    if (y === table.col && (x === table.row || (x >= range[0] && x <= range[1]))) {
                        return p;// console.log(table, p);
                    }
                }
                return null;
            };

            rangetree.valueOf = function (_) {
                return arguments.length && ({}).toString.call(_) === "[object Function]" ? (valueOf = _, rangetree) : valueOf;
            };

            return rangetree;
        }

        return rangetree;
    }

    return {
        deps: function () {
            return factory.apply(null, [].slice.call(arguments));
        }
    };
}).call(typeof window !== "undefined" ? window : this)