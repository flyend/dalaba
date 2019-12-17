function dfs (fromId, before, after) {
    var root = this.root;
    var id = root.id,
        parentId;
    var typeFn = "[object Function]";

    if (toString.call(fromId) !== typeFn) {
        root = this.get(fromId);
    }

    if (arguments.length < 3) {
        if (toString.call(fromId) !== typeFn) {
            root = this.get(fromId);
        }
        else {
            id = before, before = fromId, after = id;
            fromId = root.id;
        }
    }

    function dfs (indices, nodeId, parentId, parent, deep) {
        var edges = indices[nodeId] || [],
            n = edges.length, i;
        var edge;

        before && before.call(null, parent, n === 0, parentId, deep);

        for (i = 0; i < n; i++) {
            edge = edges[i];
            if (edge.id !== parentId) dfs(indices, edge.id, nodeId, edge, deep + 1);
        }

        after && after.call(null, parent, n === 0, parentId, deep);
    }

    if (indices[fromId]) {
        dfs(indices, fromId, root.pid, root, 0);
    }
    else if ((root = nodes[fromId]) != null) {
        before && before.call(null, root, false, root.parent, 0);// leaf node
        after && after.call(null, root, false, root.parent, 0);
    }
}