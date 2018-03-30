(function() {
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
}).call(typeof global !== "undefined" ? global : this);