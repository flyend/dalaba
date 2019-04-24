(function () {
    function factory (levenshtein) {
        function trie () {
            var root = null;
            var leafs = [];

            var splitter = Infinity;
            var valueOf = function (d) { return d; };

            function trie (tables) {
                var dp = [];
                var prev = [];

                root = {value: "-1", children: []};
                leafs = [];

                for (var i = 0; i < tables.length; i++) {
                    var values = tables[i], value;
                    var state = dp[dp.length - 1];

                    var next = root;
                    var n = values.length, j = 0, k;
                    var indexes = levenshtein(prev, prev = values.map(valueOf), state, splitter);
                    // console.log(indexes)

                    for (j = 0; j < n; j++) {
                        value = values[j];
                        k = indexes[j];
                        if (j < splitter) {
                            next = next.children[k] = next.children[k] || { value: value, children: [], col: j, index: i};
                        }
                    }
                    // delete next.children;                    
                    // merge remaining node
                    for (j = 0; j < n - splitter; j++) {
                        value = {
                            __sort: j,
                            col: j + splitter,
                            index: i,
                            range: [i, i],
                            isLeaf: splitter + 1 <= j + splitter,
                            value: values[splitter + j]
                        };
                        next.children.push(value);
                    }
                    leafs.push(next);
                    dp.push(indexes);
                }
                leafs.forEach(function (leaf) {
                    leaf.children.sort(function (a, b) { return a.__sort - b.__sort; });
                    leaf.children.forEach(function (d) { delete d.__sort; });
                });

                dp = prev = null;

                return trie;
            }

            trie.root = function () {
                return root;
            };
            trie.leaf = function () {
                return leafs;
            };

            trie.splitter = function (_) {
                return arguments.length ? (splitter = +_, isNaN(splitter) && (splitter = Infinity), trie) : splitter;
            };

            trie.valueOf = function (_) {
                return arguments.length && ({}).toString.call(_) === "[object Function]" ? (valueOf = _, trie) : valueOf;
            };

            return trie;
        }
        return trie;
    }
    return {
        deps: function (levenshtein) {
            return factory(levenshtein);
        }
    };
}).call(typeof window !== "undefined" ? window : this)