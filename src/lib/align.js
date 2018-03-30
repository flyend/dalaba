(function(global) {
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
})(typeof window !== "undefined" ? window : this)