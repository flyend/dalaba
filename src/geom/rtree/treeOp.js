(function () {
    function lerp (x, s, dx) {
        return dx + x * s;
    }
    function setTransform (node, transform) {
        var x = node.x, y = node.y;
        var width = node.width, height = node.height;
        var translate = transform.translate;
        var scale = transform.scale;

        return {
            x: lerp(x, scale[0], translate[0]),
            y: lerp(y, scale[1], translate[1]),
            width: lerp(width, scale[0], 0),
            height: lerp(height, scale[1], 0)
        };
    }
	var treeSearch = function (boundary, node) {
        function childrensOf (node) {
            var childs = node.children || [];
            if (childs.length === 0) return [node];
            return childs.map(childrensOf);
        }

        function dfs (boundary, node) {
            var childs = node.children || [],
                child;
            var n = childs.length, i;
            var nodes = [], childrens;

            if (contains(boundary, setTransform(node, {translate: translate, scale: scale})) || (!node.children || node.children.length === 0)) return childrensOf(node);

            for (i = 0; i < n; i++) {
                child = childs[i];
                if (intersects(boundary, setTransform(child, {translate: translate, scale: scale}))) {
                    childrens = dfs(boundary, child);
                    if (childrens.length) [].push.apply(nodes, childrens);
                }
            }
            return nodes;
        }
        return dfs(boundary, node);
    };
    return {
    	search: treeSearch
    };
})();