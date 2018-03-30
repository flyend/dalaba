(function(global, Chart){

    var relayout = require("./layout").deps(Dalaba.Math, Numeric);

    var Linked = require("./linked");

    var Fill = require("./fill");

    var smooth = Geometry.Line.smooth;

    var setPoint = function(points, start, end, inverted){
        var segment = points.slice(start, end),//[start, end)
            point,
            bezierCurve;
        for (var k = 0; k < end - start; k++) {
            bezierCurve = smooth(
                segment[k - 1],//prev point
                point = points[start + k],
                segment[k + 1],//next point
                inverted
            );
            if (bezierCurve) {
                point.x1 = bezierCurve.x1;
                point.y1 = bezierCurve.y1;
                point.x2 = bezierCurve.x2;
                point.y2 = bezierCurve.y2;
                point.x = bezierCurve.x;
                point.y = bezierCurve.y;
            }
        }
    };
    
    var Renderer = {
        pointSpline: function(points, series){
            var start = 0, end = points.length;
            var left = 0, right = end;
            while (left < right) {
                var point = points[left];
                if (point.isNULL) {
                    end = left;
                    if (start !== end && end - start > 2) {
                        setPoint(points, start, end, !!series.inverted);
                    }
                    for (var k = end; k < right; k++) if (!points[k].isNULL) {
                        end = k;
                        break;
                    }
                    start = end;
                }
                left++;
            }
            if (!points[left - 1].isNULL && left - start > 2) {
                setPoint(points, start, left, !!series.inverted);
            }
        },
        line: function(context, shapes, series, options){
            var dashStyle = pack("string", series.dashStyle, "solid"),
                lineWidth = pack("number", series.lineWidth, 2),
                step = series.step,
                type = series.type;
            var key = options.y || "y";
            //console.log(series.state)
            if(shapes.length){
                context.save();
                if(type === "spline" || type === "areaspline"){
                    Linked.spline(context, shapes, {});
                }
                else if(type === "arearange"){
                    Linked.arearange(context, shapes, {
                        key: key,
                        dashStyle: dashStyle
                    });
                }
                else{
                    Linked[defined(step) ? "step" : "line"](context, shapes, {
                        step: step,
                        dashStyle: dashStyle,
                        //onStep: function(shape){ }
                    });//line step
                }
                series.selected !== false && (lineWidth) > 0 && (
                    context.shadowColor = series.shadowColor,
                    isNumber(series.shadowBlur) && (context.shadowBlur = series.shadowBlur),
                    isNumber(series.shadowOffsetX) && (context.shadowOffsetX = series.shadowOffsetX),
                    isNumber(series.shadowOffsetY) && (context.shadowOffsetY = series.shadowOffsetY),
                    context.strokeStyle = series.lineColor || series.color,
                    context.lineCap = "round",
                    context.lineJoin = "round",
                    context.lineWidth = lineWidth,// + 1 * !!series.state,
                    context.stroke()
                );
                context.restore();
            }
        },
        area: function(context, shapes, series){
            var type = series.type;
            var color = series.color,
                opacity = series.opacity,
                fillColor;
            if(!shapes.length || series.selected === false){
                return;
            }
            
            var minY = Number.MAX_VALUE,
                maxY = -minY;
            var minX = null, maxX = null;

            shapes.forEach(function(shape, i) {
                var last = shapes[shapes.length - i - 1];
                if(isNumber(shape.yBottom) && shape.yBottom === shape.yBottom){
                    minY = Math.min(minY, shape.yBottom);
                }
                maxY = Math.max(maxY, shape.y);
                if (minX === null && isNumber(shape.x, true)) {
                    minX = shape.x;
                }
                if (maxX === null && isNumber(last.x, true))
                    maxX = last.x;
            });
            

            if(defined(fillColor = series.fillColor) && shapes.length > 1){
                if(Color.isColor(fillColor)){
                    color = fillColor;
                }
                else if(defined(fillColor.linearGradient)) {
                    color = Color.parse(fillColor).linear(minX, minY, maxX, maxY);
                }
            }
            else{
                color = Color.parse(color).alpha(pack("number", opacity, 0.75)).rgba();
            }

            context.save();
            context.beginPath();
            
            Fill[{
                areaspline: "spline",
                arearange: "range"
            }[type] || "line"](context, shapes, {
                inverted: !!series.inverted,
                type: type
            });
            context.globalCompositeOperation = pack("string", series.blendMode, "source-over");//multiply
            //context.globalAlpha = .5;
            context.fillStyle = color;
            context.fill();
            context.restore();
        },
        hover: function(context, shape, series){
            var marker = series.marker || {},
                fillColor = shape.color || series.color,
                hoverColor = Color.parse(fillColor);
                hoverColor.a = 0.5;
            var fill = function(x, y) {
                context.fillStyle = Color.rgba(hoverColor);
                context.beginPath();
                context.arc(x, y, 8, 0, PI2);
                context.fill();

                context.fillStyle = fillColor;
                context.strokeStyle = marker.fillColor || "#fff";
                context.beginPath();
                context.arc(x, y, 3, 0, PI2);
                context.fill();
                context.stroke();
            };
            if (marker.enabled !== false && isNumber(shape.current) && shape.current !== -1) {
                [].slice.call(arguments, -2).forEach(function(key) {
                    context.save();
                    fill(shape.x, shape[key]);
                    context.restore();
                });
            }
            delete shape.current;
        },
        xClip: function(t, context, canvas, x, y){
            if(0 !== t){
                context.save();
                t > 0 && context.drawImage(
                    canvas,
                    x, y, canvas.width * t, canvas.height,
                    x, y, canvas.width * t / DEVICE_PIXEL_RATIO, canvas.height / DEVICE_PIXEL_RATIO
                );
                context.restore();
            }
        },
        yClip: function(t, context, canvas, x, y){
            if(0 !== t){
                context.save();
                t > 0 && context.drawImage(
                    canvas,
                    x, y, canvas.width, canvas.height * t,
                    x, y, canvas.width / DEVICE_PIXEL_RATIO, canvas.height * t / DEVICE_PIXEL_RATIO
                );
                context.restore();
            }
        }
    };
    /*
     * Class Line
    */
    function Line(canvas, options) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.type = "line";
        
        this.series = [];
        this.shapes = [];
        this.init(options);
	}
	Line.prototype = {
        constructor: Line,
		init: function(options) {
            var canvas = this.canvas,
                type = this.type,
                animation = (options.chart || {}).animation;
            var panels = [],
                panel = options.panel;
            var n = panel.length,
                i = -1,
                nn, j;
            var series = [], newSeries;

            while (++i < n) {
                newSeries = [];
                for (j = 0, nn = panel[i].series.length; j < nn; j++) if ((series = panel[i].series[j]).type === this.type) {
                    newSeries.push(series);
                    series._diffValues = List.diff(series.shapes, series._shapes || [], function(a, b) {
                        return a && b && a.value === b.value;
                    });
                }
                panels.push({series: newSeries});
            }
            this.options = options;
            this.panels = panels;
            this.series = newSeries;

            relayout(panels, options);

            if ((animation === true || (animation && animation.enabled !== false))
                    && canvas.nodeType === 1) {

                this.series.forEach(function(series) {
                    var image = document.createElement("canvas"),
                        context = image.getContext("2d");
                    Chart.scale(
                        context,
                        pack("number", series.plotWidth + series.plotX, canvas.width),
                        pack("number", series.plotHeight + series.plotY, canvas.height),
                        DEVICE_PIXEL_RATIO
                    );
                    series._image = image;
                    if(type === "area" || type === "areaspline" || type === "arearange"){
                        Renderer.area(context, series.shapes, series);
                        if(type === "arearange"){
                            Renderer.line(context, series.shapes, series, {
                                y: "highY"
                            });
                        }
                    }
                    Renderer.line(context, series.shapes, series, {
                        y: "y"
                    });
                });
            }
        },
        draw: function() {
            var context = this.context,
                chart = this;
            this.series.forEach(function(series){
                var shapes = series.shapes;
                //draw line
                Renderer.line(context, shapes, series, {
                    y: "y",
                    //addMarker: function(shape){}
                });
                shapes.forEach(function(shape){
                    chart.drawMarker(context, shape, series, "y");//draw marker
                    chart.drawLabels(context, shape, series);//draw data labels
                    Renderer.hover(context, shape, series, "y");//hover points
                });
            });
        },
        redraw: function() {
            relayout(this.panels, this.options);
            this.draw();
        },
        animateTo: function(context, initialize){
            var chart = this;
            var shapes = [];
            chart.series.forEach(function(series){
                var newData = series.shapes,
                    oldData = series._shapes || [];
                var animators = [];
                if(initialize === true){
                    var mergeShape = series;
                    shapes.push([series, function(timer){
                        mergeShape._timer = timer;
                    }]);
                    animators.push(mergeShape);
                }
                else{
                    series._diffValues.add(function(newIndex){
                        var oldShape = oldData[newIndex],
                            mergeShape = {
                                value: oldShape.value,
                                _value: oldShape._value,
                                isNULL: oldShape.isNULL,
                                color: oldShape.color,
                                x: oldShape.x,
                                y: oldShape.y,
                                x1: oldShape.x1,
                                y1: oldShape.y1,
                                x2: oldShape.x2,
                                y2: oldShape.y2,
                                highY: oldShape.highY,
                                yBottom: oldShape.yBottom,
                                marker: oldShape.marker,
                                dataLabels: oldShape.dataLabels
                            };
                        if(defined(oldShape.prevShape)){
                            mergeShape.prevShape = {
                                x: oldShape.prevShape.x,
                                y: oldShape.prevShape.y,
                                x1: oldShape.prevShape.x1,
                                y1: oldShape.prevShape.y1,
                                x2: oldShape.prevShape.x2,
                                y2: oldShape.prevShape.y2,
                                highY: oldShape.prevShape.highY
                            };
                        }
                        //timer = Math.min(1, countLength * timer);
                        //console.log(item, newData[item.newIndex].value)
                        if(oldShape.value === oldData[0].value){
                            //mergeShape.x = mergeShape.x * timer;// oldShape.x1 - (oldShape.x1 - oldShape.x0) * timer;//forward
                        }
                        else/* if(oldShape.value === oldData[oldData.length - 1].value)*/{
                            
                        }
                        mergeShape.x = NaN;// oldShape.x + (newShape.x - oldShape.x) * timer;//back
                        //mergeShape.y = oldShape.y + (newShape.y - oldShape.y) * timer;
                        animators.push(mergeShape);
                    }).remove(function(newIndex){
                        var newShape, oldShape,
                            mergeShape;
                        newShape = newData[newIndex];
                        oldShape = oldData[newIndex];
                        mergeShape = {
                            value: newShape.value,
                            _value: newShape._value,
                            isNULL: newShape.isNULL,
                            color: newShape.color,
                            x: newShape.x,
                            y: newShape.y,
                            x1: newShape.x1,
                            y1: newShape.y1,
                            x2: newShape.x2,
                            y2: newShape.y2,
                            highY: newShape.highY,
                            yBottom: newShape.yBottom,
                            marker: newShape.marker,
                            dataLabels: newShape.dataLabels
                        };
                        if(defined(newShape.prevShape)){
                            mergeShape.prevShape = {
                                x: newShape.prevShape.x,
                                y: newShape.prevShape.y,
                                x1: newShape.prevShape.x1,
                                y1: newShape.prevShape.y1,
                                x2: newShape.prevShape.x2,
                                y2: newShape.prevShape.y2,
                                highY: newShape.prevShape.highY
                            };
                        }
                        shapes.push([newShape, function(timer){
                            var xGap = series.plotWidth / newData.length * (newData.length - oldData.length),
                                xStart,
                                xEnd;
                            xEnd = newData[newData.length - 1].x;
                            xStart = xEnd - xGap;
                            xGap -= series.plotX;

                            xStart = xStart + (xEnd - xStart) * timer;
                            xEnd = xEnd - xStart;
                            
                            mergeShape.x1 = newShape.x1;// + xGap * (1 - timer);
                            mergeShape.y1 = newShape.y1;
                            mergeShape.x2 = newShape.x2;// + xGap * (1 - timer);
                            mergeShape.y2 = newShape.y2;
                            mergeShape.x = newShape.x;// + xGap * (1 - timer);
                            mergeShape.y = newShape.y;
                        }]);
                        animators.push(mergeShape);
                    }).modify(function(newIndex, oldIndex){
                        var newShape = newData[newIndex],
                            oldShape = oldData[oldIndex],
                            mergeShape;
                        
                        if(oldShape && newShape){
                            mergeShape = {
                                value: newShape.value,
                                _value: newShape._value,
                                isNULL: newShape.isNULL,
                                color: newShape.color,
                                x: oldShape.x,
                                y: oldShape.y,
                                x1: oldShape.x1,
                                y1: oldShape.y1,
                                x2: oldShape.x2,
                                y2: oldShape.y2,
                                highY: oldShape.highY,
                                yBottom: newShape.yBottom,
                                marker: newShape.marker,
                                dataLabels: newShape.dataLabels
                            };
                            if(defined(newShape.prevShape)){
                                mergeShape.prevShape = {
                                    x: newShape.prevShape.x,
                                    y: newShape.prevShape.y,
                                    x1: newShape.prevShape.x1,
                                    y1: newShape.prevShape.y1,
                                    x2: newShape.prevShape.x2,
                                    y2: newShape.prevShape.y2,
                                    highY: newShape.prevShape.highY
                                };
                            }
                            shapes.push([newShape, function(timer){
                                var x = (oldShape.x || newShape.x) + (newShape.x - (oldShape.x || newShape.x)) * timer;
                                var y = (oldShape.y || newShape.y) + (newShape.y - (oldShape.y || newShape.y)) * timer;
                                var y1 = (oldShape.y1 || newShape.y1) + (newShape.y1 - (oldShape.y1 || newShape.y1)) * timer;
                                var y2 = (oldShape.y2 || newShape.y2) + (newShape.y2 - (oldShape.y2 || newShape.y2)) * timer;
                                var x1 = (oldShape.x1 || newShape.x1) + (newShape.x1 - (oldShape.x1 || newShape.x1)) * timer;
                                var x2 = (oldShape.x2 || newShape.x2) + (newShape.x2 - (oldShape.x2 || newShape.x2)) * timer;
                                var highY = (oldShape.highY || newShape.highY) + (newShape.highY - (oldShape.highY || newShape.highY)) * timer;

                                mergeShape.x = x;
                                mergeShape.y = y;
                                //console.log(oldShape.y, newShape.y)
                                mergeShape.x1 = x1;
                                mergeShape.x2 = x2;
                                mergeShape.y1 = y1;
                                mergeShape.y2 = y2;
                                mergeShape.highY = highY;
                            }]);
                            animators.push(mergeShape);
                        }
                    }).each();
                }
                series._animators = animators;
                series._shapes = series.shapes;
            });
            return shapes;
        },
        onFrame: function(context, initialize){
            var chart = this;
            this.series.forEach(function(series){
                var animators = series._animators;
                if(initialize === true){
                    animators.forEach(function(series){
                        series._image && Renderer[series.inverted ? "yClip" : "xClip"](series._timer, context, series._image, 0, 0);
                    });
                }
                else{
                    if(series.type === "area" || series.type === "areaspline" || series.type === "arearange"){
                        Renderer.area(context, animators, series);
                        if(series.type === "arearange"){
                            Renderer.line(context, animators, series, {
                                y: "highY"
                            });
                        }
                    }
                    Renderer.line(context, animators, series, {
                        y: "y"
                    });
                    animators.forEach(function(shape){
                        chart.drawMarker.apply(null, [context, shape, series].concat(series.type === "arearange" ? ["y", "highY"] : ["y"]));
                        chart.drawLabels(context, shape, series);
                    });
                }
            });
        },
        drawShape: function(context, shape, series){
            if(shape && shape.value !== null){
                Renderer.hover(context, shape.x, shape.y, series);
            }
        },
        drawLabels: function(context, shape, series){
            var radius = pack("number", (shape.marker || {}).radius, (series.marker || {}).radius, 0);
            dataLabels.align(function(type, bbox){
                var t = pack("string", type, "center"),
                    x = shape.x,
                    w = bbox.width;
                if(isNaN(x))
                    return -9999;
                return {
                    left: x - w - radius / 2,
                    center: x - w / 2,
                    right: x + radius / 2
                }[t];
            }).vertical(function(type, bbox){
                var t = pack("string", type, "top"),
                    y = shape.y,
                    h = bbox.height;
                if(isNaN(y))
                    return -9999;
                return {
                    top: y - h - radius,
                    middle: y - h + radius,
                    bottom: y + radius
                }[t];
            }).call(shape, series, context);
        },
        drawMarker: function(context, shape, series){
            var seriesMarker = series.marker || {},
                shapeMarker = shape.marker || {};
            var lineWidth = pack("number", shapeMarker.lineWidth, seriesMarker.lineWidth, 0),
                lineColor = pack("string", shapeMarker.lineColor, seriesMarker.lineColor, shape.color, "#000"),
                fillColor = pack("string", shapeMarker.fillColor, seriesMarker.fillColor, shape.color, "#000"),
                radius = pack("number", shapeMarker.radius, seriesMarker.radius, 4);

            var usemarker = radius * radius <= series.plotWidth / series.shapes.length;
            if(defined(shapeMarker.enabled) || defined(seriesMarker.enabled)){
                usemarker = shapeMarker.enabled === true || seriesMarker.enabled === true;
            }

            [].slice.call(arguments, -2).forEach(function(key){
                if(series.selected !== false & shape.value !== null & usemarker){
                    context.save();
                    context.fillStyle = fillColor;
                    context.beginPath();
                    context.arc(shape.x, shape[key], radius, 0, PI2, true);
                    context.fill();
                    lineWidth > 0 && (context.lineWidth = lineWidth, context.strokeStyle = lineColor, context.stroke());
                    context.restore();
                }
            });
        },
        getShape: function(x, y, shared){
            var series,
                shape,
                sl = this.series.length,
                i;
            var results = [],
                result,
                shapes;
            var kdtree;

            var inverted;

            var isInside = function(series){
                return !(
                    x < pack("number", series.plotX, 0) ||
                    x > series.plotWidth + pack("number", series.plotX, 0) ||
                    y < pack("number", series.plotY, 0) ||
                    y > series.plotHeight + pack("number", series.plotY, 0)
                );
            };
            function reset(shapes){
                shapes.forEach(function(item){
                    delete item.current;
                });
            }

            for(i = 0; i < sl; i++){
                series = this.series[i];
                if(series.selected !== false){
                    shapes = series.shapes;
                    inverted = !!series.inverted;
                    if(isInside(series)){
                        reset(shapes);
                        kdtree = KDTree(shapes);
                        shape = kdtree.nearest({x: x, y: y}, function(a, b){
                            var dx = a.x - b.x,
                                dy = a.y - b.y;
                            return inverted ? dy * dy : dx * dx;
                        })[0];
                        kdtree.destroy();
                        if(defined(shape) && !shape.isNULL){
                            shape.current = shape.index;
                            result = {shape: shape, series: series};
                            result.shape.$value = shape._value;
                            if(series.type === "arearange"){
                                result.shape.$value = shape.source[1] + "," + (shape._value);
                            }
                            results.push(result);
                        }
                    }
                }
            }
            if(shared === false){
                shapes = results.map(function(item){ return item.shape; });
                reset(shapes);
                kdtree = KDTree(shapes);
                shape = kdtree.nearest({x: x, y: y}, function(a, b){
                    var dx = a.x - b.x, dy = a.y - b.y;
                    return dx * dx + dy * dy;
                })[0];
                kdtree.destroy();

                if(defined(shape) && !shape.isNULL){
                    shape.current = shape.index;
                    result = {shape: shape, series: shape.series};
                    result.shape.$value = "" + shape._value;
                    if(shape.series.type === "arearange"){
                        result.shape.$value = shape._value + "," + (shape.source[2]);
                    }
                    return [result];
                }
            }
            return results;
        }
    };

    var Spline = require("spline").deps(Dalaba, Line);

    var Area = require("area").deps(Dalaba, Line, Renderer.area);

    var AreaSpline = require("areaspline").deps(Dalaba, Area);

    var AreaRange = require("arearange").deps(Dalaba, AreaSpline);
    
    var graphers = (Chart.graphers = Chart.graphers || {}),
        charts,
        type;
    for(type in (charts || (charts = {
        Line: Line,
        Spline: Spline,
        Area: Area,
        AreaSpline: AreaSpline,
        AreaRange: AreaRange
    }))){
        graphers[type.toLowerCase()] = Chart[type] = charts[type];
    }

})(typeof window !== "undefined" ? window : this, Dalaba.Chart || {});