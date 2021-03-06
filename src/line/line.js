(function (global, Chart) {

    var relayout = require("./layout").deps(Dalaba.Math, Numeric);

    var Linked = require("./linked");

    var Fill = require("./fill");
    
    var Renderer = {
        line: function (context, shapes, series, options) {
            var dashStyle = pack("string", series.dashStyle, "solid"),
                lineWidth = pack("number", series.lineWidth, 2),
                lineColor = series.lineColor || series.color;
            var step = series.step,
                type = series.type;
            var key = options.y || "y";
            if (series.selectionEnabled !== false && (!series.animationCompleted || series.selected !== false) && shapes.length) {
                context.save();
                if (type === "spline" || type === "areaspline") {
                    Linked.spline(context, shapes, {});
                }
                else if (type === "arearange") {
                    Linked.arearange(context, shapes, {
                        key: key,
                        dashStyle: dashStyle
                    });
                }
                else {
                    Linked[defined(step) ? "step" : "line"](context, shapes, {
                        step: step,
                        dashStyle: dashStyle
                    });//line step
                }
                (context.lineWidth = lineWidth) > 0 && (
                    context.shadowColor = series.shadowColor,
                    isNumber(series.shadowBlur) && (context.shadowBlur = series.shadowBlur),
                    isNumber(series.shadowOffsetX) && (context.shadowOffsetX = series.shadowOffsetX),
                    isNumber(series.shadowOffsetY) && (context.shadowOffsetY = series.shadowOffsetY),
                    context.strokeStyle = lineColor,
                    context.lineCap = "round",
                    context.lineJoin = "round",
                    context.stroke()
                );
                context.restore();
            }
        },
        area: function (context, shapes, series) {
            var type = series.type;
            var color = series.color,
                opacity = series.opacity,
                fillColor;
            if(!shapes.length || series.selected === false){
                return;
            }
            
            var minY = MAX_VALUE,
                maxY = -minY;
            var minX = null, maxX = null;

            shapes.forEach(function(shape, i) {
                var last = shapes[shapes.length - i - 1];
                if (isNumber(shape.yBottom) && shape.yBottom === shape.yBottom) {
                    minY = mathMin(minY, shape.yBottom);
                }
                maxY = mathMax(maxY, shape.y);
                if (minX === null && isNumber(shape.x, true)) {
                    minX = shape.x;
                }
                if (maxX === null && isNumber(last.x, true))
                    maxX = last.x;
            });
            

            if (defined(fillColor = series.fillColor) && shapes.length > 1) {
                if (Color.isColor(fillColor)) {
                    color = fillColor;
                }
                else if (defined(fillColor.linearGradient)) {
                    color = Color.parse(fillColor).linear(minX, minY, maxX, maxY);
                }
            }
            else {
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
        hover: function (context, shape, series) {
            var marker = series.marker || {},
                fillColor = shape.color || series.color,
                hoverColor = Color.parse(fillColor);
                hoverColor.a = 0.5;
            var onfill = function(x, y) {
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
                    onfill(shape.x, shape[key]);
                    context.restore();
                });
            }
            delete shape.current;
        }
    };
    /*
     * Class Line
    */
    function Line (canvas, options) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.type = "line";
        
        this.series = [];
        this.init(options);
    }
    Line.prototype = {
        constructor: Line,
        init: function (options) {
            var canvas = this.canvas,
                type = this.type;
            this.options = options;
            this.series = relayout(options.panels);
            this.panels = options.panels;

            this.series.forEach(function (series) {
                if (series.animationEnabled) {
                    var image = document.createElement("canvas"),
                        context = image.getContext("2d");
                    Chart.scale(
                        context,
                        pack("number", series.plotWidth + series.plotX, canvas.width),
                        pack("number", series.plotHeight + series.plotY, canvas.height),
                        DEVICE_PIXEL_RATIO
                    );
                    series._image = image;
                    if (type === "area" || type === "areaspline" || type === "arearange") {
                        Renderer.area(context, series.shapes, series);
                        if (type === "arearange") {
                            Renderer.line(context, series.shapes, series, {y: "highY"});
                        }
                    }
                    Renderer.line(context, series.shapes, series, { y: "y" });
                }
            });
            this.reflow();
        },
        reflow: function () {
            var context = this.context;
            var chart = this;
            this.series.forEach(function (series) {
                series.shapes.forEach(function (shape) {
                    chart.drawLabels(context, shape, series);
                });
            });
        },
        draw: function (initialize) {
            var context = this.context;
            var chart = this;

            if (initialize === true) {
                this.series.forEach(function (series) {
                    var shapes = series.shapes;
                    series._image && Clip[series.inverted ? "Vertical" : "Horizontal"](series._image, 0, 0, series._image.width, series._image.height).clip(context, pack("number", (shapes[0] || {}).timer, 1));
                });
            }
            else {
                this.series.forEach(function (series) {
                    Renderer.line(context, series.shapes, series, { y: "y" });
                });
                this.series.forEach(function (series) {
                    if (series.selectionEnabled !== false && (!series.animationCompleted || series.selected !== false)) {
                        series.shapes.forEach(function (shape) {
                            DataLabels.render(context, shape.dataLabel, series);//draw data labels
                        });
                    }
                });
                this.series.forEach(function (series) {
                    if (series.selectionEnabled !== false && (!series.animationCompleted || series.selected !== false)) {
                        series.shapes.forEach(function (shape) {
                            chart.drawMarker(context, shape, series, "y");//draw marker
                            Renderer.hover(context, shape, series, "y");//hover points
                        });
                    }
                });
            }
        },
        redraw: function (event) {
            relayout(this.panels, true);
            this.reflow();
        },
        animateTo: function () {
            var shapes = [];
            this.series.forEach(function (series) {
                var newData = series.shapes,
                    oldData = series._shapes || [];
                var previous = [];
                
                List.diff(newData, oldData, function (a, b) {
                    return a && b && a.value === b.value;
                }).add(function (newIndex) {

                }).remove(function (newIndex) {
                    var newShape = newData[newIndex];
                    var to;
                    newShape.animate({
                        timer: 0
                    }, to = {
                        value: newShape.value,
                        timer: 1,
                        x1: newShape.x1,
                        y1: newShape.y1,
                        x2: newShape.x2,
                        y2: newShape.y2,
                        x: newShape.x,
                        y: newShape.y,
                        highY: newShape.highY,
                        selected: series.selected
                    });
                    previous.push(to);
                    shapes.push(newShape);
                }).modify(function (newIndex, oldIndex) {
                    var newShape = newData[newIndex],
                        oldShape = oldData[oldIndex];
                    var to;
                    newShape.animate({
                        x: oldShape.x,
                        y: oldShape.y,
                        x1: oldShape.x1,
                        x2: oldShape.x2,
                        y1: oldShape.y1,
                        y2: oldShape.y2,
                        highY: oldShape.highY
                    }, to = {
                        value: newShape.value,
                        x: newShape.x,
                        y: newShape.y,
                        x1: newShape.x1,
                        x2: newShape.x2,
                        y1: newShape.y1,
                        y2: newShape.y2,
                        highY: newShape.highY,
                        selected: series.selected
                    });
                    series.selectionEnabled = !((series.selected === false) && (oldShape.selected === false));
                    previous.push(to);
                    shapes.push(newShape);
                }).each();
                series._shapes = previous;
            });
            return shapes;
        },
        drawShape: function (context, shape, series) {
            if (shape && !shape.isNULL) {
                Renderer.hover(context, shape.x, shape.y, series);
            }
        },
        drawLabels: function (context, shape, series) {
            var radius = pack("number", (shape.marker || {}).radius, (series.marker || {}).radius, 0);
            DataLabels.align(function (type, bbox) {
                var t = pack("string", type, "center"),
                    x = shape.x,
                    w = bbox.width;
                if (isNaN(x))
                    return -9999;
                return {
                    left: x - w - radius / 2,
                    center: x - w / 2,
                    right: x + radius / 2
                }[t];
            }).vertical(function (type, bbox) {
                var t = pack("string", type, "top"),
                    y = shape.y,
                    h = bbox.height;
                if (isNaN(y))
                    return -9999;
                return {
                    top: y - h - radius,
                    middle: y - h + radius,
                    bottom: y + radius
                }[t];
            }).call(shape, series, context);
        },
        drawMarker: function (context, shape, series) {
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

            [].slice.call(arguments, -2).forEach(function (key) {
                if(series.selected !== false & !shape.isNULL & usemarker){
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
        getShape: function (x, y, shared) {
            var series,
                shape,
                sl = this.series.length,
                i;
            var results = [],
                result,
                shapes;
            var kdtree;

            var inverted;

            var isInside = function (series) {
                return !(
                    x < pack("number", series.plotX, 0) ||
                    x > series.plotWidth + pack("number", series.plotX, 0) ||
                    y < pack("number", series.plotY, 0) ||
                    y > series.plotHeight + pack("number", series.plotY, 0)
                );
            };
            function reset (shapes) {
                shapes.forEach(function (item) {
                    delete item.current;
                });
            }

            for (i = 0; i < sl; i++) {
                series = this.series[i];
                if(series.selected !== false) {
                    shapes = series.shapes;
                    inverted = !!series.inverted;
                    if (isInside(series)) {
                        reset(shapes);
                        kdtree = KDTree(shapes, ["x", "y"]);
                        shape = kdtree.nearest({x: x, y: y}, function(a, b){
                            var dx = a.x - b.x,
                                dy = a.y - b.y;
                            return inverted ? dy * dy : dx * dx;
                        })[0];
                        kdtree.destroy();
                        if(defined(shape) && !shape.isNULL){
                            shape.current = shape.index;
                            result = {shape: shape, series: series};
                            results.push(result);
                        }
                    }
                }
            }
            if (shared === false) {
                shapes = results.map(function (item) { return item.shape; });
                reset(shapes);
                kdtree = KDTree(shapes, ["x", "y"]);
                shape = kdtree.nearest({x: x, y: y}, function(a, b){
                    var dx = a.x - b.x, dy = a.y - b.y;
                    return dx * dx + dy * dy;
                })[0];
                kdtree.destroy();

                if(defined(shape) && !shape.isNULL){
                    shape.current = shape.index;
                    result = {shape: shape, series: shape.series};
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
    for (type in (charts || (charts = {
        Line: Line,
        Spline: Spline,
        Area: Area,
        AreaSpline: AreaSpline,
        AreaRange: AreaRange
    }))) {
        graphers[type.toLowerCase()] = Chart[type] = charts[type];
    }

})(typeof window !== "undefined" ? window : this, Dalaba.Chart || {});