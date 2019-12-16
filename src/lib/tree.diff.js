(function () {

    var TREE_POSITION_DISCONNECTED = 1;
    var TREE_POSITION_PRECEDING = 2;
    var TREE_POSITION_FOLLOWING = 4;
    var TREE_POSITION_CONTAINS = 8;
    var TREE_POSITION_CONTAINED_BY = 16;

    var toArray = function (data) {
        return data;
    };

    function factory (dfs, hammingDistance) {

        var compareTo = function (a, b) {
            var i0 = a.length,
                i1 = b.length;
            var aHash = a[i0 - 1].hash,
                bHash = b[i1 - 1].hash;
            //console.log(a, b, aHash, bHash);
            if (i0 === i1) {
                if (!hammingDistance(parseInt(aHash), parseInt(bHash)))
                    return 0;
            }
            else if (i0 > i1) {
                //a contain b
                if (bHash === aHash.slice(0, bHash.length))
                    return TREE_POSITION_CONTAINED_BY;
            }
            else {
                if (aHash === bHash.slice(0, aHash.length))
                    return TREE_POSITION_CONTAINS;
            }
            return TREE_POSITION_DISCONNECTED;
        };

        var diff = function (compare) {

            var path = function (root) {
                var path = [];
                var nodes = [];
                var newNode;
                var deep = 0,
                    hash = "";

                dfs(root, [function (node) {
                    newNode = extend({}, node);
                    //newNode.index = 0;
                    (newNode.children || []).forEach(function (d, i) {
                        d.index = i;
                    });
                    newNode.deep = deep++;
                    path.push(newNode);
                }, function () {
                    var uri = "",
                        pating = "";
                    var parent;
                    path.forEach(function (d) {
                        var index = d.index,
                            code = d.deep.toString(2);
                        var hasIndex = typeof index === "undefined";
                        !hasIndex && (code += index.toString(2));
                        pating += code;
                        if (!d.children) {
                            hash += pating;
                            //console.log(d.deep, code, index, hash, d.value, d.index, d.deep)
                        }
                        uri += d.deep + "" + (hasIndex ? "" : index) + "/";
                    });
                    
                    newNode = path.pop();
                    parent = path[path.length - 1];
                    nodes.push({
                        node: newNode.value,
                        deep: deep,
                        index: newNode.index,
                        isLeaf: !newNode.children || (newNode.children && !newNode.children.length),
                        //parent: parent,
                        uri: uri.slice(0, -1)
                    });
                    deep--;
                }]);
                path = null;
                nodes[nodes.length - 1].hash = hash;//后序遍历push最后一个节点为根节点
                //console.log(JSON.stringify(nodes.map(function (d) { return d.uri; }), null, 2));
                return toArray(nodes);
            };

            function diff (a, b) {
                if (!isFunction(arguments[2])) {
                    compare = arguments[2];
                }
                return compareTo(path(a), path(b));
            }


            return diff;
        };

        return diff(function (a, b) {
            return a.value === b.value;
        });
    }

    return {
        deps: function (dfs, bfs) {
            var diff = factory(dfs, bfs);
            /*console.log(diff(
                [{
                    value: 1,
                    children: [{
                        value: 2,
                        children: [{ value: 4 }, { value: 5, children: [{value: 7}, {value: 8}] }]
                    }, {
                        value: 3,
                        children: [{value: 6}]
                    }]
                }],
                [{
                    value: 1,
                    children: [{
                        value: 2,
                        children: [{ value: 4 }, { value: 5, children: [{value: 7}, {value: 8}] }]
                    }]
                }]
            ));*/

            return diff;
        }
    };
})()