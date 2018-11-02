(function () {
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
    var defaultCompare = function (a, b) {
        return a - b;
    };

    function down (data, i) {
        var value = data[i];
        var size = data.length;

        while (true) {
            var r = (i + 1) << 1,
                l = r - 1,
                j = i;
            var child = data[j];
            if (l < size && defaultCompare(child.value, data[l].value) > 0) child = data[j = l];
            if (r < size && defaultCompare(child.value, data[r].value) > 0) child = data[j = r];
            if (j === i) break;
            data[i] = child, child.index = i;
            data[i = j] = value, value.index = i;
        }
    }

    function up (data, i) {
        var value = data[i];
        while (i > 0) {
            var j = (i + 1 >> 1) - 1,
                parent = data[j];
            if (defaultCompare(value.value, parent.value) >= 0) break;
            data[i] = parent, parent.index = i;
            data[i = j] = value, value.index = i;
        }
    }

    var Heap = function (compare) {
        return new Heap.init(compare);
    };
    Heap.init = function (compare) {
        defaultCompare = compare || function (a, b) {
            return a - b;
        };
        this.length = 0;
        return this;
    };
    
    function search (data, index, value) {
        var left, right;
        var i;
        if (data[index].value === value)
            return index;
        else if (defaultCompare(data[index].value, value) >= 0)
            return -1;
        left = index * 2 + 1;
        right = left + 1;

        i = search(data, left, value);

        if (i !== -1)
            return i;

        return search(data, right, value);
    }

    Heap.prototype = {
        push: function (value) {
            var size = this.length;
            this[size] = {value: value, index: size};
            up(this, size++);
            return this.length = size;
        },
        pop: function () {
            var size = this.length;
            if (size <= 0)
                return null;
            var removed = this[0],
                last = this.splice(size - 1, 1)[0];
            if ((this.length) > 0) {
                //last.index = 0;
                this[0] = last;//this[size];
                down(this, 0);
            }
            return removed.value;
        },
        remove: function (removed) {
            var index = this.indexOf(removed),
                
                last = this.splice(this.length - 1, 1)[0];
            if (index !== this.length) {
                this[index] = last;
                (defaultCompare(last.value, removed) < 0 ? up : down)(this, index);
            }
            return index;
        },
        peek: function () {
            return this[0].value;
        },
        indexOf: function (value) {
            var i = -1,
                length = this.length;

            while (++i < length && this[i].value !== value);
            //b = search(this, 0, removed)
            return i < length ? i : -1;
        },
        splice: [].splice,
        size: function () {
            return this.length;
        },
        empty: function () {
            return this.length <= 0;
        }
    };

    Heap.init.prototype = Heap.prototype;

    if (typeof module === "object" && module.exports) {
        module.exports = Heap;
    }
    else if (typeof define === "function" && define.amd) {
        define(function () {
            return Heap;
        });
    }
    return Heap;
}).call(typeof window !== "undefined" ? window : this);