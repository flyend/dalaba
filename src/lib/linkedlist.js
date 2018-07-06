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
        return toString.call(v) === "[Object object]";
    };

    var linkedList = function (data) {
        var n = data.length,
            i;
        var d = data[i = 0];

        var nodes;

        if (!(n = data.length)) {
            return [];
        }
        var node;
        nodes = [node = {
            value: isObject(d) ? d.value : d,
            head: -1,// null,
            next: -1,// null
            index: 0
        }];

        for (i = 1; i < n; i++) {
            d = data[i];
            /*if (!isObject(d)) {
                d = { value: d };
            }
            d.index = i;

            node.next = i;//d;
            d.head = node.index;
            d.next = null;*/
            nodes.push(node = insert(i, node, d, false));
        }
        return nodes;
    };

    function insert (index, oldData, newData, isBefored) {
        if (!isObject(newData)) {
            newData = { value: newData };
        }
        if (isBefored === true) {

        }
        else {
            newData.index = index;
            oldData.next = index;
            newData.head = oldData.index;
            newData.next = null;
        }
        return newData;
    }

    var LinkedList = function (data, options) {
        return new LinkedList.init(data, options);
    };
    LinkedList.init = function (data, isSimpled) {
        this.data = data || [];
        this.length = this.data.length;
        this.nodes = linkedList(this.data, isSimpled);
        return this;
    };

    LinkedList.prototype = {
        push: function (value) {
            var index = this.nodes.length;
            this.length = this.nodes.push(insert(index, this.nodes[~-index], value));
        },
        pop: function () {
        },
        unshift: function () {
            return this[0];
        },
        shift: function () {

        },
        splice: [].splice,
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