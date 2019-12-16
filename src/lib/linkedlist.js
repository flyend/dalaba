(function () {
    /**
     * @param data{Array}
     * @param options{Object}
     * @example
     * var list = LinkedList(data);
     * list.push(19);
     * Doubly LinkedList
     * new LinkedList(data, true)
     * LinkedList(data, {
     *    filter: function (d) { return d === null; }
     * });
     */
    var toString = ({}).toString;

    var isObject = function (v) {
        return toString.call(v) === "[object Object]";
    };

    var isFunction = function (v) {
        return toString.call(v) === "[object Function]";
    };

    var matrix = [];

    // 过滤器将增加matrix
    var linkedList = function (data) {
        var n, i;
        var d;
        var node;
        var has = toString.call(data) !== "[object Array]";
        var filter = this.filter;
        var isTrued;

        if (has || (!has && !(n = data.length))) {
            return this;
        }
        
        d = data[i = 0];
        node = {
            value: d,
            index: 0,
            head: -1,// null,
            tail: n - 1// null
        };
        if (filter) {
            matrix[n] = n - 1;
            node.value = data[n - 1];
            isTrued = filter.call(node, node.value, 0) === true;            
            node.nextIndex = (isTrued ? n : 0) - 1;
            node.next = data[node.nextIndex];
            node.first = !isTrued;
        }
        //this[0] = node; this.length++;

        for (i = n - 1; i >= 0; i--) {
            var nextIndex = node.nextIndex;
            d = data[i];
            node = insert(i, node, d, false);
            this[i] = node;
            this.length++;

            if (filter) {
                isTrued = filter.call(node, node.value, i) === true;// filter function is true
                matrix[i] = isTrued ? matrix[i + 1] : i;
                node.nextIndex = matrix[i];
                node.next = data[node.nextIndex];
                node.first = node.nextIndex === nextIndex;// && isTrued;// is previous null and cur is true
            }
        }
        //console.log(matrix);
    };

    function insert (index, oldData, newData, isBefored) {
        var data = { value: newData };
        if (isBefored === true) {

        }
        else {
            data.index = index;
            data.head = index - 1;
            data.tail = index === oldData.tail ? -1: index + 1;
            //oldData.tail = index;
        }
        return data;
    }

    function up (first, list, length) {
        var node;
        for (var i = 1; i < length; i++) {
            node = list[i];
            first.value = node.value;
            if (i === length - 1)
                first.tail = -1;
            first = node;
        }
    }

    function down (first, list, length) {
        var temp;
        for (var i = 1; i < length; i++) {
            temp = list[i].value;
            list[i].value = first.value;
            first.value = temp;
        }
    }

    function nextTo (node) {
        var filter = this.filter;
        var nextIndex;
        var isTrued;
        if (isFunction(filter)) {
            for (var i = this.length - 1; i >= 0; i--) {
                nextIndex = node.nextIndex;
                node = this[i];

                isTrued = filter.call(node, node.value, i) === true;// filter function is true
                matrix[i] = isTrued ? matrix[i + 1] : i;
                node.nextIndex = matrix[i];
                node.next = this._data[node.nextIndex];
                node.first = node.nextIndex === nextIndex;// && isTrued;// is previous null and cur is true
            }
        }
    }

    function remove (list, index, length, isBefored) {
        var node = list[index],
            tail;
        if (isBefored) {
            if (length > 1) {
                up(node, list, length);
                delete list[length - 1];
            }
            else {
                delete list[index];
            }
        }
        else {
            if (length > 1) {
                tail = node.tail;
                list[index - 1].tail = tail;
                delete list[index];
            }
            else {
                delete list[index];
            }
        }
        return node;
    }

    /**
     * class LinkedList
     * {tail} and {head} are the basic elements of the linked list
     * {prev} and {next} are data pointers
     * support for array traversal, insert operations
    **/

    var LinkedList = function (data, options) {
        return new LinkedList.init(data, options);
    };
    LinkedList.init = function (data, options) {
        this.length = 0;
        this._data = data.slice();

        if (isFunction(options)) {
            this.filter = options;
        }
        else if (isObject(options)) {
            isFunction(options.filter) && (this.filter = options.filter);
        }
        matrix = [];
        linkedList.call(this, data);//isSimpled
        return this;
    };

    LinkedList.prototype = {
        constructor: LinkedList,
        push: function () {
            var args = [].slice.call(arguments);
            var length;
            var oldData,
                node;
            var j = this.length;

            for (var i = 0; i < args.length; i++) {
                length = this.length;
                if (length <= 0) {
                    linkedList.call(this, args.slice(0, 1));
                }
                else {
                    oldData = this[~-length];
                    oldData.tail = length;
                    this[this.length++] = node = insert(length, oldData, args[i]);
                    matrix.push(j + args.length - 1);
                }
                this._data.push(args[i]);
            }
            nextTo.call(this, node);

            return this.length;
        },
        pop: function () {
            var length = this.length;
            if (length <= 0)
                return;
            this.length--;
            return remove(this, this.length, length);
        },
        unshift: function () {
            var args = [].slice.call(arguments);
            var length;
            var oldData;
            // insert last, each next, modified first element
            for (var i = 0; i < args.length; i++) {
                length = this.length;
                if (length <= 0)
                    linkedList.call(this, args.slice(0, 1));
                else {
                    this.length++;
                    oldData = this[~-length];
                    oldData.tail = length;
                    
                    this[length] = insert(length, oldData, oldData.value);
                    down(this[0], this, length);
                    this[0] = insert(0, this[~-length], args[i]);
                }
            }
            return this.length;
        },
        shift: function () {
            var length = this.length;
            if (length <= 0)
                return;
            this.length--;
            return remove(this, 0, length, true);
        },
        splice: [].splice,
        forEach: function (callback) {
            [].forEach.call(this, function (d, i, values) {
                callback && callback.call(d, d.value, i, values);
            });
        },
        reverse: function () {
            var length = this.length;
            for (var i = 0; i < length >> 1; i++) {
                var left = this[i],
                    right = this[length - i - 1];
                var temp = left.value;
                left.value = right.value;
                right.value = temp;
            }
        },
        size: function () {
            return this.length;
        },
        empty: function () {
            return this.length <= 0;
        }
    };

    LinkedList.init.prototype = LinkedList.prototype;

    return LinkedList;
}).call(typeof window !== "undefined" ? window : this);