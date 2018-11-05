(function () {

    var TREE_POSITION_DISCONNECTED = 1;
    var TREE_POSITION_CONTAINS = 2;
    var TREE_POSITION_INTERSECTED = 4;
    //var TREE_POSITION_DISCONNECTED = 8;

    var toArray = function (data) {
        return data;
    };

    function factory (dfs, hammingDistance) {

        var compareTo = function (a, b) {
            var i0 = a.length,
                i1 = b.length;
            //console.log(a, b, a[i0 - 1].hash, b[i1 - 1].hash)
            if (i0 === i1) {
                /*var adistance = [];
                a.forEach(function (d, i) {
                    var buri = b[i].uri;
                    if (buri === d.uri && a.value === b.value) {

                    }
                })*/
                if (!hammingDistance(parseInt(a[i0 - 1].hash), parseInt(b[i1 - 1].hash)))
                    return TREE_POSITION_INTERSECTED;
                else return TREE_POSITION_DISCONNECTED;
            }
        };

        var diff = function (compare) {
            var deep = function (root) {

            };

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

            diff.equals = function () {

            };


            return diff;
        };

        return diff(function (a, b) {
            return a.value === b.value;
        });
    }

    return {
        deps: function (dfs, bfs) {
            var diff = factory(dfs, bfs);
            console.log(diff(
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
                        children: [{ value: 4 }/*, { value: 5, children: [{value: 7}, {value: 8}] }*/]
                    }]
                }]
            ));

            return diff;
        }
    };
})()