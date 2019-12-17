(function () {
    var indexOf = Array.prototype.indexOf;

    var hirschbergs = require("./hirschbergs")();

    var listRemoved = (function () {
        var filter = function (value, args) {
            return args.some(function (d) {
                return d === value;
            });
        };
        function remove (arrays) {
            var n = arrays.length, i = 0;
            var value;
            var removeCount = 0;
            var args = [].slice.call(arguments, 1);

            for (; i < n; i++) {
                value = arrays[i];
                if (filter.call(value, value, args, i, arrays) === true) {
                    ++removeCount;
                    continue;
                }
                if (removeCount > 0) arrays[i - removeCount] = value;
            }
            arrays.length -= removeCount;
            return arrays;
        }
        remove.filter = function (_) {
            if (({}).toString.call(_) === "[object Function]") filter = _;
            return remove;
        };
        return remove;
    })();

    var List = {
        /*
         * The data packet
         * @param data{Array} data Grouping
         * @param filter{Function}
         * Returns Array
        */
        partition: function (data, filter) {
            var length = (data = data || []).length,
                i = 0, j;
            var groups = [], group;
            var visited = new Array(length);
            var a, b;
            if (length === 1) return [[data[i]]];

            for (; i < length; i++) {
                group = [a = data[i]];
                for (j = i + 1; j < length; j++) if (filter && filter.call(data, a, b = data[j], i, j) === true) {
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
        filter: function (data, filter) {
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
        indexOf: function (data, key, fromIndex, useNative) {
            return (useNative !== false && indexOf) ? indexOf.call(data, key, fromIndex) : (function () {
                var i = (fromIndex || 0) - 1, n = data.length;
                var nan = key !== key;

                while (++i < n && ((!nan && data[i] !== key) || (nan && data[i] === data[i])));
                    return i < n ? i : -1;
            })();
        },
        /*
         * The array fill
         * @param data{Array} data source
         * @param place{.} All js data type
         * Returns Array
        */
        fill: function (n, place, start, end) {
            return Array.prototype.fill ? new Array(n = Math.max(0, n) || 0).fill(place, start, end) : (function () {
                var array = [];
                var i = start || 0;

                if (!isNaN(+end)) n = +end;

                while (i < n) array.push(place), i++;
                
                return array;
            })();
        },
        remove: listRemoved
    };

    List.diff = require("./align").deps(hirschbergs);

    var exports = (function (global) {
        return {
            deps: function () {
                var args = [].slice.call(arguments, 0);
                return function (Dalaba) {
                    var Cluster = {};

                    Cluster.hirschbergs = hirschbergs;

                    Cluster.List = List;

                    Cluster.Tree = require("./tree").deps(Dalaba);// a tree simple method

                    return Cluster;
                }.apply(global, [].concat(args));
            }
        };
    })(this);


    if (typeof module === "object" && module.exports) {
        module.exports = exports;
    }
    else if (typeof define === "function" && define.amd) {
        define(function() {
            return exports;
        });
    }
    return exports;
}).call(typeof global !== "undefined" ? global : this)