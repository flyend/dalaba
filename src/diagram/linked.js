(function() {

    var hasProps = ({}).hasOwnProperty;

    var abs = Math.abs;
    var max = Math.max;
    var min = Math.min;

    var curveStep = function(source, target, options) {
        var lineWidth = pack("number", options.lineWidth, 0);

        var positions = {};

        var x, y, x1, y1, x2, y2, x3, y3;
        var dx, dy;
        if (source && target) {
            var smoothing = 0.5;
            var points = [
                {x: source.x + source.width * smoothing, y: source.y + source.height},//source bottom
                {x: source.x + source.width * smoothing, y: source.y},//source top
                null,
                null,
                {x: target.x + target.width * smoothing, y: target.y + target.height},//target bottom
                {x: target.x + target.width * smoothing, y: target.y}//target top
            ];
            x = points[0].x;
            y = points[0].y;
            x1 = points[4].x;
            y1 = points[5].y;

            if (source.y < target.y) {
                y = points[0].y;
            }
            else {
                y = points[1].y;
                y1 = points[4].y;
            }
            var ratio = 0.2;
            if (source.x > target.x) {
                ratio = 0.8;
            }
            dy = max(abs(y - y1) * ratio, lineWidth);
            y2 = y + dy;
            x3 = x1;
            y3 = y + dy;
            if (source.y > target.y) {
                y2 = y3 = y - dy;
            }

            //console.log(x, y, dy);
            positions = {
                x: x, y: y, x0: x, y0: y,
                x1: x1, y1: y1,//to
                x2: x, y2: y2,
                x3: x3, y3: y3
            };
        }
        return positions;
    };

    var curveBasis = function(source, target, options) {
        if (!source || !target)
            return {};

        var lineWidth = (options.lineWidth || 1) - 1,
            sourceSpacing = lineWidth + (options.sourceSpacing || 0),
            targetSpacing = lineWidth + (options.targetSpacing || 0);

        var smoothing = 0.5; 
        var abox = {x: source.x, y: source.y, width: source.width, height: source.height},
            bbox = {x: target.x, y: target.y, width: target.width, height: target.height};
        
        var points = [
            {x: abox.x + abox.width * smoothing, y: abox.y - sourceSpacing},//source right
            {x: abox.x + abox.width * smoothing, y: abox.y + abox.height + sourceSpacing},//source bottom
            {x: abox.x - sourceSpacing, y: abox.y + abox.height * smoothing},//source left
            {x: abox.x + abox.width + sourceSpacing, y: abox.y + abox.height * smoothing},//source top

            {x: bbox.x + bbox.width * smoothing, y: bbox.y - targetSpacing},//target right
            {x: bbox.x + bbox.width * smoothing, y: bbox.y - targetSpacing},//target bottom
            {x: bbox.x - targetSpacing, y: bbox.y + bbox.height * smoothing},//target left
            {x: bbox.x + bbox.width + targetSpacing, y: bbox.y + bbox.height * smoothing}//target top
        ];

        var distance = [],
            links = [],
            maps = {};//i ==> j
        var dx, dy;
        var x, y, x2, y2, x3, y3, x1, y1;

        var detected = function(i, j, equalx, equaly) {
            return ((i ^ 3 & (j ^ 2)) > 0 | equalx) // left
                & ((i ^ 2 & (j ^ 3)) > 0 | !equalx) // right
                & ((i ^ 1 & (j ^ 0)) > 0 | equaly) // top
                & ((i ^ 0 & (j ^ 1)) > 0 | !equaly); //bottom
        };

        for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
            var a = points[i],
                b = points[j + 4];
            var equalx = a.x < b.x,
                equaly = a.y < b.y;
            if ((i === j) | detected(i, j, equalx, equaly)) {
                maps[distance[distance.push((dx = abs(a.x - b.x)) + (dy = abs(a.y - b.y))) - 1]] = [i, j + 4];
            }
        }
        
        if (distance.length === 0) {
            links = [0, 4];//start - end
        }
        else {
            links = maps[min.apply(Math, distance)];//i ==> j
        }
        x = points[links[0]].x;//i ==> j point
        y = points[links[0]].y;//move point
        x1 = points[links[1]].x;//j
        y1 = points[links[1]].y;//end point

        dx = max(abs(x1 - x) / 2, lineWidth);// middle point min
        dy = max(abs(y1 - y) / 2, lineWidth);

        x2 = [x, x, x - dx, x + dx][links[0]];//control point p1
        y2 = [y - dy, y + dy, y, y][links[0]];

        x3 = [x1, x1, x1 - dx, x1 + dx][links[1] - 4];//p2
        y3 = [y + dy, y - dy, y1, y1][links[1] - 4];

        return {
            x: x, y: y,
            x1: x1, y1: y1,//to
            x2: x2, y2: y2,
            x3: x3, y3: y3,
        };
    };

    var data = [];
    var srcdata = [];

    function merged(data) {
        var n = data.length,
            i = -1;
        var node;

        var maps = {};

        var ret = [];

        while (++i < n) if ((node = data[i]) && defined(node.source)) {
            maps[node.source] = 1;
            ret.push({
                source: node.source,
                target: node.target,
                index: i
            });
        }
        i = -1;
        while (++i < n) if ((node = data[i]) && defined(node.target) && !(hasProps.call(maps, node.target)) && (maps[node.target] = 1)) {
            ret.push({
                source: node.target,
                target: null,
                index: i
            });
        }
        return ret;
    }


    function adjacency(_) {
        data = merged(srcdata = _ || []);
        
        return adjacency;
    }
    var matrix = [];

    var nodes = [];

    var sourcelinks = {};

    adjacency.matrix = function() {
        var n = data.length,
            i, j;
        var a, b;
        var source, target;
        
        sourcelinks = {};

        for (i = 0; i < n; i++) matrix[i] = new Array(n).fill(-1);

        for (i = 0; i < n; i++) {
            for (j = 0; j < n; j++) {
                a = data[i], b = data[j];
                target = a.target, source = b.source;

                //a target, no self
                if (i ^ j && target === source) {
                    if (!(hasProps.call(sourcelinks, a.source))) {
                        sourcelinks[a.source] = [{name : b.source, index: j, source: a, target: b}];
                    }
                    else {
                        var clusters = sourcelinks[a.source];
                        clusters.push({name: b.source, index: i, source: clusters[clusters.length - 1].source, target: b});
                    }

                    //console.log(data[i].source, target, source, target === source, i, j);
                    matrix[i][j] = j;
                    matrix[j][i] = i;//matrix[i][j];
                }
            }
        }
        return adjacency;
    };
    adjacency.nodes = function() {
        var n = data.length,
            i = -1;
        var maps = {},
            node;
        nodes = [];

        adjacency.matrix();
        while (++i < n) if ((node = data[i]) && !(hasProps.call(maps, node.source)) && (maps[node.source] = 1)) {
            var item = srcdata[node.index];
            item.source = node.source;
            item.target = node.target;
            item.sourcelinks = sourcelinks[item.source] || [];
            nodes.push(item);
        }
        return nodes;
    };

    adjacency.links = function() {
        nodes.forEach(function(node) {
            var lines = [];
            var sw = node.width,
                sh = node.height;
            var dirSize = Math.max(2, Math.min(10, pack("number", Math.min(node.width, node.height), node.radius, 5) / 2));

            node.sourcelinks.forEach(function(link) {
                var source = srcdata[link.source.index];// link.source;
                var target = srcdata[link.target.index];// link.target;
                lines.push(curveBasis({
                    x: source.x,
                    y: source.y,
                    width: sw, height: sh
                }, {
                    x: target.x,
                    y: target.y,
                    width: sw, height: sh
                }, {
                    lineWidth: 1,
                    sourceSpacing: 0,
                    targetSpacing: dirSize
                }));
            });
            node.linklines = lines;
            node.linklines.dirSize = dirSize;
        });
    };

    

    return adjacency;
})();