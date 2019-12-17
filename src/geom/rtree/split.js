(function () {
    var hilbertcurves = require("./hilbertcurves");
    var bisect = require("./bisect"); // bisect([1, 2, 2, 2, 3, 4], 2);

    var nativeCeil = Math.ceil;

    function splitSiblings (node, insertChild) {
        var childs = node.children || [],
            child;
        var siblingLeft = addNode(null, null, null, null);// empty node, x, y, width, height
        var siblingRight = addNode(null, null, null, null);
        var n, i, j;
        var pivot;
        var x, y;
        var indexes = [];

        if (!(n = childs.length)) return [];
        pivot = n >> 1;
        
        for (i = 0; i < n; i++) {
            child = childs[i];
            x = nativeCeil(child.x + child.width / 2.0);
            y = nativeCeil(child.y + child.height / 2.0);
            child.__sorted = hilbertcurves(x, y);
            if (i) {
                j = bisect(indexes, child.__sorted, null, null, function (a, b) {
                    return a.__sorted - b;
                });
                indexes.splice(j, 0, child);
            }
            else indexes[i] = child;
        }
        // console.log(indexes.map(d => d.__sorted));

        for (i = 0; i < n; i++) {
            child = childs[i];
            insertChild(child, i <= pivot ? siblingLeft : siblingRight);
            delete child.__sorted;
        }
        node.children = indexes = null;
        child = null;
        return [siblingLeft, siblingRight];
    }
    return splitSiblings;
})();