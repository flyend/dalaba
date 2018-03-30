(function(){
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
    var defaultCompare = function(a, b){
        return a - b;
    };

    function down(array, i){
        var value = array[i];
        var size = array.length;

        while(true){
            var r = (i + 1) << 1,
                l = r - 1,
                j = i;
            var child = array[j];
            if(l < size && defaultCompare(child, array[l]) > 0) child = array[j = l];
            if(r < size && defaultCompare(child, array[r]) > 0) child = array[j = r];
            if(j === i) break;
            array[i] = child;
            array[i = j] = value;
        }
    }
    function up(array, i){
        var value = array[i];
        while(i > 0){
            var j = (i + 1 >> 1) - 1,
                parent = array[j];
            if(defaultCompare(value, parent) >= 0) break;
            array[i] = parent;
            array[i = j] = value;
        }
    }

    var Heap = function(compare){
        return new Heap.init(compare);
    };
    Heap.init = function(compare){
        defaultCompare = compare || defaultCompare;
        this.length = 0;
        return this;
    };

    Heap.prototype = {
        push: function(value){
            var size = this.length;
            this[size] = value;
            up(this, size++);
            return this.length = size;
        },
        pop: function(){
            var size = this.length;
            if(size <= 0)
                return null;
            var removed = this[0];
            var end = this.splice(size - 1, 1)[0];
            if((this.length = --size) > 0){
                this[0] = end;//this[size];
                down(this, 0);
            }
            return removed;
        },
        peek: function(){
            return this[0];
        },
        splice: [].splice,
        size: function(){
            return this.length;
        },
        empty: function(){
            return this.length <= 0;
        }
    };

    Heap.init.prototype = Heap.prototype;

    if (typeof module === "object" && module.exports) {
        module.exports = Heap;
    }
    else if (typeof define === "function" && define.amd) {
        define(function() {
            return Heap;
        });
    }
    return Heap;
}).call(typeof window !== "undefined" ? window : this);