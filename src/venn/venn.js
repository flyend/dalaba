(function(global, Chart){
    var listFilter = List.filter;

    function arcTo(context, paths){
        var arc = Chart.arc;
        var moveX, moveY;
        paths.forEach(function(path, i){
            if(i){
                arc(
                    context,
                    moveX, moveY,
                    path
                );
                moveY = (moveX = path.slice(-2))[1];
                moveX = moveX[0];
            }
            else{
                context.moveTo(moveX = path[0], moveY = path[1]);
            }
        });
    }

    function intersectedPoints(p1, p2, r1, r2){
        var dx = p2.x - p1.x,
            dy = p2.y - p1.y;
        var d = Math.sqrt(dx * dx + dy * dy);
            /*r1 = p1.radius,
            r2 = p2.radius;*/
        //两圆相交分如下几种情况：相离、相切、相交、包含。
        if(d >= r1 + r2 || d <= Math.abs(r1 - r2))
            return [];//相离相切的面积为零
        //包含的面积就是小圆的面积
        /*if(r2 - r1 >= d){
            return r1 * r1 * Math.PI;
        }*/
        //两圆交点
        var a = (r1 * r1 - r2 * r2 + d * d) / (2 * d),
            h = Math.sqrt(r1 * r1 - a * a);
        var x0 = p1.x + a * (dx) / d,
            y0 = p1.y + a * (dy) / d;
        var rx = -(dy) * (h / d),
            ry = -(dx) * (h / d);
        return [
            {x: x0 + rx, y: y0 - ry},//p1
            {x: x0 - rx, y: y0 + ry}//p2
        ];
    }
    /*
     * Overlap
    */
    var Overlap = {
        overlap: function(r1, r2, d){
            if(d >= r1 + r2)
                return 0;//相离、相切
            if(d <= Math.abs(r1 - r2))
                return Math.min(r1, r2) * Math.min(r1, r2) * PI;//包含
            //相交
            /*var w1 = r1 - (d * d - r2 * r2 + r1 * r1) / (2 * d);
            var w2 = r2 - (d * d + r2 * r2 - r1 * r1) / (2 * d);
            return Overlap.area(r1, w1) + Overlap.area(r2, w2);*/
            var a1 = (r1 * r1 + d * d - r2 * r2) / (2 * r1 * d),
                a2 = (r2 * r2 + d * d - r1 * r1) / (2 * r2 * d);
            a1 = Math.acos(a1);
            a2 = Math.acos(a2);
            return a1 * r1 * r1 + a2 * r2 * r2 - r1 * d * Math.sin(a1);
        },
        area: function(r, width){
            var integral;
            return (integral = function(r, x){
                var y = Math.sqrt(r * r - x * x);
                return x * y + r * r * Math.atan2(x, y);
            })(r, width - r) - integral(r, -r);
        }
    };
    /*
     * Union
    */
    var Union = {
        arcs: [],
        areas: NaN,
        points: {
            inner: [],
            intersector: []
        },
        area: function(nodes){
            var intersectPoints = [],
                innerPoints,
                point;
            var EPS = 1e-10;

            var length = nodes.length,
                i, j;
            for(i = 0; i < length; i++){
                for(j = i + 1; j < length; j++){
                    var a = nodes[i],
                        b = nodes[j];
                    intersectedPoints(a, b, a.radius, b.radius).forEach(function(item){
                        item.parentIndex = [i, j];
                        item.source = a;
                        item.target = b;
                        //item.color = ;//a + b
                        intersectPoints.push(item);
                    });
                }
            }
            innerPoints = arrayFilter(intersectPoints, function(item){
                for(i = 0; i < length; i++){
                    var a = item, b = nodes[i];
                    if(Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)) > b.radius + EPS)
                        return false;
                }
                return true;
            });
            var polygonArea = 0,
                arcArea = 0,
                arcs = this.arcs = [];
            //包含
            if(innerPoints.length > 1){
                var centroid = {x: 0, y: 0};
                length = innerPoints.length;
                for(i = 0; i < length; i++){
                    point = innerPoints[i];
                    centroid.x += point.x;
                    centroid.y += point.y;
                }
                centroid.x /= length;
                centroid.y /= length;
                for(i = 0; i < length; i++){
                    point = innerPoints[i];
                    point.angle = Math.atan2(point.x - centroid.x, point.y - centroid.y);
                }
                innerPoints.sort(function(a, b){ return b.angle - a.angle; });
                var p2 = innerPoints[innerPoints.length - 1],
                    p1,
                    arc;
                for(i = 0; i < length; i++){
                    p1 = innerPoints[i];
                    polygonArea += (p2.x + p1.x) * (p1.y - p2.y);
                    arc = null;
                    for(j = 0; j < p1.parentIndex.length; ++j){
                        if(p2.parentIndex.indexOf(p1.parentIndex[j]) > -1){
                            var node = nodes[p1.parentIndex[j]];
                            var a1 = Math.atan2(p1.x - node.x, p1.y - node.y),
                                a2 = Math.atan2(p2.x - node.x, p2.y - node.y),
                                sub = a2 - a1,
                                angle,
                                distance;
                            if(sub < 0)
                                sub += Math.PI * 2;
                            angle = a2 - sub / 2;

                            var middle = {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2},
                                current = {
                                    x: node.x + Math.sin(angle) * node.radius,
                                    y: node.y + Math.cos(angle) * node.radius
                                };
                            distance = Math.sqrt(
                                (middle.x - current.x) * (middle.x - current.x) +
                                (middle.y - current.y) * (middle.y - current.y)
                            );
                            //console.log(nodes[p2.parentIndex[j]], "000");
                            if(arc === null || arc.width > distance){
                                arc = {
                                    width: distance,
                                    p1: p1,
                                    p2: p2,
                                    node: node
                                };
                                //console.log(p1.source.color, p1.target.color)
                            }
                        }
                    }
                    arcs.push(arc);
                    arcArea += Overlap.area(arc.node.radius, arc.width);
                    //console.log(arcArea, arc);
                    p2 = p1;
                }
            }
            else{
                var minNode = nodes[0],
                    disjoint = false;
                length = nodes.length;
                for(i = 1; i < length; i++){
                    if(nodes[i].radius < minNode.radius)
                        minNode = nodes[i];
                }
                for(i = 0; i < length; i++){
                    if(Math.sqrt(
                        (nodes[i].x - minNode.x) * (nodes[i].x - minNode.x) +
                        (nodes[i].y - minNode.y) * (nodes[i].y - minNode.y)
                    )){
                        disjoint = true;
                        break;
                    }
                }
                if(disjoint){
                    arcArea = polygonArea = 0;
                }
                else{
                    arcArea = minNode.radius * minNode.radius * Math.PI;//包含
                    arcs.push({
                        node: minNode,
                        p1: {x: minNode.x, y: minNode.y + minNode.radius},
                        p2: {x: minNode.x - EPS, y: minNode.y + minNode.radius},
                        width: minNode.radius * 2
                    });
                }
            }

            this.areas = arcArea + polygonArea;
            this.points.inner = innerPoints;
            this.points.intersector = intersectPoints;

            polygonArea /= 2;
            return arcArea + polygonArea;
        }
    };
    /*
     * Subset
    */
    function Subset(data){
        var links = {};

        (this.nodes = listFilter(data, function(item){
            var f = typeof item.id !== "undefined";
            return f;
        })).forEach(function(item, i){
            item.x = item.y = 0;
            item.radius = Math.sqrt(item.value / Math.PI);
            links[i] = [];
        });
        (this.overlaps = listFilter(data, function(item){
            return typeof item.sets !== "undefined" && item.sets.length > 1;
        })).forEach(function(item){
            var a = item.sets[0],
                b = item.sets[1];
            //if(ids.sets.length !== 2)
            //    continue;
            links[a].push({node: b, value: item.value});//L => R
            links[b].push({node: a, value: item.value});//R => L
        });
        this.links = links;
        this.width = 0;
        this.height = 0;

        this.init();
    }
    Subset.prototype = {
        init: function(){
            var nodes = this.nodes,
                links = this.links;
            if(!nodes.length)
                return;
            var newNodes = [],
                link,
                weight;
            for(link in links){
                if(links.hasOwnProperty(link)){
                    weight = 0;
                    (links[link] || []).forEach(function(item){
                        weight += item.value;
                    });
                    newNodes.push({node: link, weight: weight});
                }
            }
            newNodes.sort(function(a, b){ return b.weight - a.weight; });//value max to min sort

            var visited = {},
                first = newNodes[0].node,
                points,
                overlap;
            var matrix = this.matrix();

            nodes[first].x = 0;
            nodes[first].y = 0;//set first node
            visited[first] = true;

            //console.log(nodes, links, matrix);

            for(var i = 1; i < newNodes.length; i++){
                link = newNodes[i].node;
                overlap = listFilter(links[link], function(item){
                    return item.node in visited;//TODO: 邻接矩阵访问模式
                }).sort(function(a, b){
                    return b.value - a.value;
                });
                if(overlap.length === 0){
                    console.log("error");
                }
                //cal a and b circle points
                points = this.union(matrix[link], overlap);
                
                //loss points
                var point = points[0],
                    best = 1e50,
                    loss;
                for(var j = 0; j < points.length; j++){
                    nodes[link].x = points[j].x;
                    nodes[link].y = points[j].y;
                    loss = this.loss();
                    if(loss < best){
                        best = loss;
                        point = points[j];
                    }
                }
                //best point to nodes
                visited[link] = true;
                nodes[link].x = point.x;
                nodes[link].y = point.y;
            }
        },
        union: function(matrix, overlap){
            var nodes = this.nodes;
            var points = [];

            for(var j = 0; j < overlap.length; j++){
                var node = overlap[j].node,
                    p1 = nodes[node],
                    m1 = matrix[node];
                points.push(
                    {x: p1.x + m1, y: p1.y},
                    {x: p1.x - m1, y: p1.y},
                    {x: p1.x, y: p1.y + m1},
                    {x: p1.x, y: p1.y - m1}
                );
                for(var k = j + 1; k < overlap.length; k++){
                    var o = overlap[k].node,
                        p2 = nodes[o],
                        m2 = matrix[o];
                    intersectedPoints(
                      {x: p1.x, y: p1.y},//a circle
                      {x: p2.x, y: p2.y},
                      m1,
                      m2
                    ).forEach(function(item){
                        points.push(item);
                    });
                }
            }
            return points;
        },
        matrix: function(){
            var nodes = this.nodes,
                overlaps = this.overlaps;

            var length = nodes.length,
                matrix = [];//new Array(length);//.fill(new Array(length).fill(0));

            for(var i = 0; i < length; i++){
                matrix.push([]);
                for(var j = 0; j < length; j++){
                    matrix[i].push(0);
                }
            }
            length = overlaps.length;
            for(i = 0; i < length; i++){
                var id = overlaps[i];
                if(id.sets.length !== 2)
                    continue;
                var a = id.sets[0], b = id.sets[1];
                var r1 = Math.sqrt(nodes[a].value / Math.PI),
                    r2 = Math.sqrt(nodes[b].value / Math.PI);
                var distance = Math.min(r1, r2) * Math.min(r1, r2) * Math.PI;
                var value = id.value;
                if(distance <= value){
                    distance = Math.abs(r2 - r1);
                }
                else{
                    distance = this.bisect(0, r1 + r2, function(d){
                        return Overlap.overlap(r1, r2, d) - value;
                    });
                }
                matrix[a][b] = matrix[b][a] = distance;//邻接矩阵
            }
            return matrix;
        },
        loss: function(nodes){
            var overlaps = this.overlaps;
            var loss = 0;
            nodes = nodes || this.nodes;
            for(var i = 0; i < overlaps.length; i++){
                var overlap = overlaps[i],
                    lap;

                if(overlap.sets.length === 2){
                  var a = nodes[overlap.sets[0]],
                      b = nodes[overlap.sets[1]];
                  var distance = Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
                  lap = Overlap.overlap(a.radius, b.radius, distance);
                }
                else{
                    //mutip sets
                    lap = Union.area(overlap.sets.map(function(i){
                        return nodes[i];
                    }));
                }
                //console.log(a, b)
                loss += (lap - overlap.value) * (lap - overlap.value);//lossFunction = ∑ (actualOverlapi - desiredOverlapi )^2 )
            }
            return loss;
        },
        //逼近
        bisect: function(a, b, callback){
            var maxInterations = 100,
                min = 1e-10,
                mid;
            var fA = callback(a),
                fB = callback(b),
                fM;
            var delta = b - a;
            if(fA * fB > 0){
                throw "points";
            }
            if(fA === 0) return a;
            if(fB === 0) return b;

            for(var i = 0; i < maxInterations; i++){
                delta /= 2;
                mid = a + delta;
                fM = callback(mid);
                if(fM * fA >= 0)
                    a = mid;
                if((Math.abs(delta) < min) || (fM === 0)){
                    return mid;
                }
            }
            return a + delta;
        },
        scale: function(width, height, padding){
            var nodes = this.nodes;
            var me = this;

            padding = padding || 1;

            var minMax = function(d){
                var max = Math.max.apply(Math, nodes.map(function(item){ return item[d] + item.radius; })),
                    min = Math.min.apply(Math, nodes.map(function(item){ return item[d] - item.radius; }));
                return {
                    min: min,
                    max: max
                };
            };

            //width -= 2*padding;
            //height -= 2*padding;

            var xRange = minMax("x"),
                yRange = minMax("y");
            var scaling = Math.min(
                width  / (xRange.max - xRange.min),
                height / (yRange.max - yRange.min)
            );

            nodes.forEach(function(item){
                item.radius = scaling * item.radius;
                item.x = padding + (item.x - xRange.min) * scaling;
                item.y = padding + (item.y - yRange.min) * scaling;
                me.width = Math.max(me.width, item.x + item.radius);
                me.height = Math.max(me.height, item.y + item.radius);
            });
            return this;
        },
        translate: function(x, y){
            this.nodes.forEach(function(item){
                item.x += (+x || 0);
                item.y += (+y || 0);
            });
        },
        shapes: function(series, options){
            var nodes = this.nodes,
                overlaps = this.overlaps;
            var shapes = [],
                deep = nodes.length;
            nodes.forEach(function(item, i){
                item.color = options.colors[i % options.colors.length];
            });
            overlaps.forEach(function(item){
                var maps = item.sets.map(function(i){ return nodes[i]; });
                Union.area(maps);
                var arcs = Union.arcs;
                if(arcs.length){
                    var moveX = arcs[0].p2.x,
                        moveY = arcs[0].p2.y;
                    var paths = [[moveX, moveY]];
                    
                    var arc = {
                        x: moveX,
                        y: moveY,
                        type: "arc"
                    };
                    
                    var rgba;
                    var name;
                    arcs.forEach(function(item){
                        var r = item.node.radius,
                            wide = item.width > r;                            
                        paths.push([r, r, 0, wide ? 1 : 0, 1, item.p1.x, item.p1.y]);

                        moveX = item.p1.x;
                        moveY = item.p1.y;

                        var sourceColor = Color.parse(item.p1.source.color);
                        var targetColor = Color.parse(item.p1.target.color);
                        
                        var sCR = sourceColor.r,
                            sCG = sourceColor.g,
                            sCB = sourceColor.b;
                            //sCA = Color.alpha(sourceColor);
                        var tCR = targetColor.r,
                            tCG = targetColor.g,
                            tCB = targetColor.b;
                        var addR = sourceColor.add(sCR, tCR),
                            addG = sourceColor.add(sCG, tCG),
                            addB = sourceColor.add(sCB, tCB);
                        rgba = Color.toString(0xff * 0.5 << 24 | addR << 16 | addG << 8 | addB);
                        name = item.p1.source.name + " & " + item.p1.target.name;
                    });
                    arc.name = name;
                    arc.value = item.value;
                    arc.path = paths;
                    arc.deep = deep++;//max
                    arc.color = rgba;
                    //console.log(rgba);
                    
                    shapes.push(arc);
                }
            });
            nodes.forEach(function(item, i){
                item.type = "circle";
                item.deep = i;
                shapes.push(item);
            });
            //console.log(shapes);
            return shapes;
        }
    };

    //reset deep
    function resetDeep(shapes){
        shapes.sort(function(a, b){ return a.deep - b.deep; });
    }
    

    function Venn(canvas, options){
        this.type = "venn";

        this.canvas = canvas;
        this.context = canvas.getContext("2d");

        this.series = [];
        this.shapes = [];
        this.init(options);
    }
    Venn.prototype = {
        constructor: Venn,
        init: function(options){
            var type = this.type;
            this.options = extend({}, options);
            this.series = arrayFilter(options.series, function(series){
                return series.type === type;
            });
            
            var venn = new Venn.Layout(type, this.series, this.options);
            this.shapes = venn.shapes;
            this.layout = venn;
        },
        draw: function(){
            var context = this.context,
                chart = this;
            this.shapes.forEach(function(series){
                var dataLabels = series.dataLabels || {},
                    style = dataLabels.style || {},
                    fontStyle = {
                        fontStyle: pack("string", style.fontStyle, "normal"),
                        fontWeight: pack("string", style.fontWeight, "normal"),
                        fontSize: pack("string", style.fontSize, "12px"),
                        fontFamily: pack("string", style.fontFamily, "Arial"),
                        lineHeight: pack("string", style.lineHeight, "normal"),
                        color: style.color || "#000"
                    };
                var shapes = series.shapes;
                shapes.forEach(function(shape){
                    chart.drawShape(context, shape, series);
                });
                if(dataLabels.enabled !== false){
                    shapes.forEach(function(item){
                        if(item.type === "circle"){
                            context.font = [
                                fontStyle.fontStyle,
                                fontStyle.fontWeight,
                                fontStyle.fontSize + "/" + fontStyle.lineHeight,
                                fontStyle.fontFamily || "Arial"
                            ].join(" ");
                            context.fillStyle = fontStyle.color;
                            context.fillText(item.name, item.x, item.y);
                        }
                    });
                }
            });
        },
        redraw: function(){
            this.shapes = this.layout.subgroup();
            this.draw();
        },
        animateTo: function(time, context){
            this.draw(context);
        },
        drawShape: function(context, shape, item){
            var dataLabels = item.dataLabels || {},
                style = dataLabels.style || {};
            context.save();
            context.beginPath();
            context.fillStyle = shape.color;
            if(shape.type === "circle"){
                context.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2, true);
            }
            else if(shape.type === "arc"){
                arcTo(context, shape.path);
            }
            context.fill();
            if(context !== this.context){
                this.shapes.forEach(function(item){
                    item.shapes.forEach(function(item){
                        if(item.type === "circle"){
                            context.font = [
                                "normal",
                                style.fontWeight || "normal",
                                style.fontSize,
                                style.fontFamily || "Arial"
                            ].join(" ");
                            context.fillStyle = style.color;
                            context.fillText(item.name, item.x, item.y);
                        }
                    });
                });
            }
            context.restore();
        },
        getShape: function(x, y){
            var series = this.shapes,
                shapes,
                shape,
                item,
                index = -1;
            var context = this.context;
            var ret = [];
            x *= DEVICE_PIXEL_RATIO, y *= DEVICE_PIXEL_RATIO;
            

            for(var j = 0; j < series.length; j++){
                index = -1;
                item = series[j];
                shapes = item.shapes;
                    
                shapes.sort(function(a, b){ return b.deep - a.deep; });
            
                for(var i = 0; i < shapes.length; i++){
                    shape = shapes[i];
                        
                    context.beginPath();
                    if(shape.type === "circle"){
                        context.arc(shape.x, shape.y, shape.radius, 0, PI2, true);
                    }
                    else if(shape.type === "arc"){
                        arcTo(context, shape.path);
                    }
                    //context.stroke();
                    //var distance = Math.sqrt((x - shape.x) * (x - shape.x) + (y - shape.y) * (y - shape.y));
                    if(context.isPointInPath(x, y)){
                        //distance < shape.radius
                        shape.$value = shape.value;
                        ret.push({shape: shape, series: item});
                        index = i;
                        break;
                    }
                }
                if(index !== -1){
                    var temp = shapes[shapes.length - 1];
                    shapes[shapes.length - 1] = (shape = shapes[index]);
                    shapes[index] = temp;
                }
                else{
                    resetDeep(shapes);//no selected, initial deep
                }
            }
            return ret;
        }
    };
    Venn.Layout = function(type, series, options){
        this.series = series;
        this.shapes = [];

        this.type = type;
        this.options = options;

        this.init();
    };
    Venn.Layout.prototype = {
        init: function(){
            this.shapes = this.subgroup();
        },
        subgroup: function(){
            var options = this.options,
                type = this.type;
            var series = this.series;
            
            options.panel.forEach(function(pane){
                var series = arrayFilter(pane.series, function(series){
                    return series.type === type && series.selected !== false;
                });
                series.forEach(function(series){
                    var //plotX = pack("number", series.plotX, 0),
                        plotY = pack("number", series.plotY, 0),
                        plotHeight = pack("number", series.plotHeight, 0),
                        plotWidth = pack("number", series.plotWidth, 0);

                    var subset = new Subset(series.data);
                        //nodes = subset.nodes;
                    var radius = series.size,
                        cx = series.x,
                        cy = series.y;
                    if(isNumber(radius)){
                        plotWidth = radius;
                        plotHeight = radius;
                    }
                    subset.scale(plotWidth, plotHeight);
                    !isNumber(cx) && (cx = (plotWidth - subset.width) / 2);
                    !isNumber(cy) && (cy = plotY + (plotHeight - subset.height) / 2);
                    
                    subset.translate(cx, cy);
                    //subset.scale(options.chart.width, options.chart.height);
                    series.shapes = subset.shapes(series, options);//me.shapes;
                    resetDeep(series.shapes);
                });
            });
            return series;
        }
    };

    (Chart.graphers = Chart.graphers || {}).venn = Chart.Venn = Venn;
    
})(typeof window !== "undefined" ? window : this, Dalaba.Chart);