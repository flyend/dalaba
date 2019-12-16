(function () {
    require("./intersection");
    require("./distance");

    var splitSiblings = require("./split");

    var treeOp = require("./treeOp");

    var nativeMin = Math.min;
    var nativeMax = Math.max;

    function addNode (x, y, width, height) {
        return {
            x: x, y: y,
            width: width, height: height,
            children: null
        };
    }

    function factoy (Dalaba) {
        var extend = Dalaba.extend;
        var pack = Dalaba.pack;
        var isArray = Dalaba.isArray;

        var treeIsLeaf = function (node) {
            var childs = node.children;
            if (!isArray(childs)) return true;
            if (node.children.length === 0) return true;
            childs = childs[0].children;
            if (!isArray(childs)) return true;
            if (node.children.length === 0) return true;
            return false;
        };

        function updateBBox (newNode, node) {
            var newWidth, newHeight;
            var minX, minY;

            if (node.isRoot === true || node.x === Infinity) {
                node.x = newNode.x, node.y = newNode.y;
                node.width = newNode.width, node.height = newNode.height;
            }
            else {
                newWidth = newNode.x + newNode.width;
                newHeight = newNode.y + newNode.height;
                minX = nativeMin(node.x, newNode.x);
                minY = nativeMin(node.y, newNode.y);
                node.x = minX;
                node.y = minY;
                node.width = nativeMax(node.x + node.width, newWidth) - minX;
                node.height = nativeMax(node.y + node.height, newHeight) - minY;
            }
            return node;
        }

        function insertChild (node, parent) {
            node.parent = parent;
            if (!parent.children) parent.children = [];
            parent.children.push(node);
            updateBBox(node, parent);
        }
        function removeChild (node, parent) {
            var childs = parent.children || [];
            var i = childs.indexOf(node);
            childs.splice(i, 1);
        }

        var treeInserted = function (boundary) {
            var node = this.root;
            var newNode = extend({}, boundary);// clone new node
            var childs, child;
            var minNode, minDistance;
            var dist;
            var n, i;

            if (newNode.id != null) this.indices[newNode.id] = newNode;

            newNode.x = boundary.x, newNode.y = boundary.y;
            newNode.width = boundary.width, newNode.height = boundary.height;

            while (!treeIsLeaf(node)) {
                node = updateBBox(newNode, node);
                n = (childs = node.children || []).length;
                minDistance = Infinity;
                for (i = 0; i < n; i++) {
                    dist = distance(child = childs[i], newNode);
                    if (dist < minDistance) {
                        minDistance = dist;
                        minNode = child;
                    }
                }
                node = minNode;
            }
            insertChild(newNode, node);
            balanceTree(this.root, newNode, this.maxDepth);
        };

        function balanceTree (root, newNode, maxDepth) {
            var node = newNode;
            var siblings;
            var n, i;

            while (node.parent != null && node.parent.children.length > maxDepth) {
                node = node.parent;// 往上递归
                if (node.isRoot !== true) {
                    siblings = splitSiblings(node, insertChild);
                    removeChild(node, node.parent);
                    for (i = 0, n = siblings.length; i < n; i++) {
                        insertChild(siblings[i], node.parent);
                    }
                }
                else if (node === root) {
                    siblings = splitSiblings(node, insertChild);
                    for (i = 0, n = siblings.length; i < n; i++) {
                        insertChild(siblings[i], node);
                    }
                }
            }
        }

        var RTree = function (maxDepth) {
            this.maxDepth = pack("number", maxDepth, 4);
            this.root = addNode(null, null, null, null);
            this.root.isRoot = true;
            this.indices = {};
        };
        var prototypeRTree = {
            insert: treeInserted,
            search: function (boundary, node, transform) {
                var tr = {};
                if (node == null) node = this.root;
                if (transform == null) tr = {translate: [0, 0], scale: [1, 1]};
                else {
                    if (transform.translate != null) tr.translate = [pack("number", transform.translate[0]), pack("number", transform.translate[1])];
                    if (transform.zoom != null) tr.scale = [pack("number", transform.zoom, transform.zoom[0], 1), pack("number", transform.zoom, transform.zoom[1], 1)];
                    if (transform.scale != null) tr.scale = [pack("number", transform.scale, transform.scale[0], 1), pack("number", transform.scale, transform.scale[1], 1)];
                }
                return treeOp.search(boundary, node, tr);
            },
            remove: function () {
                // TODO
            },
            get: function (id) {
                var node = this.indices[id];
                return node == null ? null : node;
            },
            isleaf: treeIsLeaf,
            clear: function () {
                this.root = addNode(null, null, null, null);
                this.root.isRoot = true;
                this.indices = {};
            }
        };

        Object.assign(RTree.prototype, prototypeRTree);

        return RTree;
    }

    var exports = (function (global) {
        return {
            deps: function (Dalaba) {
                return factoy.call(global, Dalaba);
            }
        };
    })(this);

    if (typeof module === "object" && module.exports) {
        module.exports = exports;
    }
    else if (typeof define === "function" && define.amd) {
        define(function () {
            return exports;
        });
    }
    return exports;
})(typeof window !== "undefined" ? window : this)