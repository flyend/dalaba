(function (global, Chart) {
    var relayout = require("./layout").deps(Dalaba);

    var isInside = function (x, y, series) {
        return !(
            x < pack("number", series.plotX, 0) ||
            x > series.plotWidth + pack("number", series.plotX, 0) ||
            y < pack("number", series.plotY, 0) ||
            y > series.plotHeight + pack("number", series.plotY, 0)
        );
    };

    function K (canvas, options) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.type = "candlestick";
        
        this.series = [];
        this.init(options);
    }
    K.prototype = {
        constructor: K,
        init: function (options) {
            var canvas = this.canvas,
                type = this.type,
                animation = (options.chart || {}).animation;
            var panels = [],
                panel = options.panel;
            var n = panel.length,
                i = -1,
                nn, j;
            var newSeries, series;
            var chart = this;

            this.series = [];

            while (++i < n) {
                newSeries = [];
                for (j = 0, nn = panel[i].series.length; j < nn; j++) if ((series = panel[i].series[j]).type === this.type) {
                    newSeries.push(series);
                    this.series = this.series.concat(series);
                }
                panels.push({series: newSeries});
            }
            this.options = options;
            this.panels = panels;

            relayout(panels, options);

            if (canvas.nodeType === 1) {
                this.series.forEach(function (series) {
                    if(series.animationEnabled){
                        var image = document.createElement("canvas"),
                            context = image.getContext("2d");
                        Chart.scale(
                            context,
                            pack("number", series.plotWidth + series.plotX, canvas.width),
                            pack("number", series.plotHeight + series.plotY, canvas.height),
                            DEVICE_PIXEL_RATIO
                        );
                        series._image = image;
                        series.shapes.forEach(function(shape){
                            chart.drawShape(context, shape, series);
                        });
                    }
                });
            }
        },
        draw: function (initialize) {
            var context = this.context,
                chart = this;
            if (initialize === true) {
                this.series.forEach(function (series) {
                    var shapes = series.shapes;
                    series._image && Clip[series.inverted ? "Vertical" : "Horizontal"](series._image, 0, 0, series._image.width, series._image.height).clip(context, pack("number", shapes[0].timer, 1));
                });
            }
            else {
                this.series.forEach(function (series) {
                    var shapes = series.shapes;
                    if (series.animationEnabled && (!series.animationCompleted || series.selected !== false)) {
                        shapes.forEach(function (shape) {
                            chart.drawShape(context, shape, series);
                        });
                    }
                });
            }
        },
        redraw: function () {
            relayout(this.panels, true);
            this.draw();
        },
        drawShape: function (context, shape, series) {
            var x = shape.x, y = shape.y,
                x1 = shape.x1, y1 = shape.y1,
                x2 = shape.x2, y2 = shape.y2,
                y3 = shape.y3,
                w = mathAbs(shape.x1 - shape.x);
            var lineWidth = pack("number", shape.lineWidth, series.lineWidth, 1),
                fillColor = shape.fillColor || series.fillColor || shape.color || series.color,
                borderColor = shape.color || series.color,
                lineColor = shape.lineColor || series.lineColor;
            var isUP = y1 > y,
                linePixel;

            if (isNumber(shape.current) && shape.current > -1) {
                lineWidth = mathMax(1, mathMin(lineWidth, 1) * 2);
            }
            delete shape.current;
            linePixel = fixPixelHalf(x, y, x1, y1, lineWidth);

            x = linePixel[0], y = linePixel[1];
            x1 = linePixel[2], y1 = linePixel[3];
            x2 = fixPixelHalf(x2, lineWidth || 1)[0];

            var addStroke = function (lineWidth, color) {
                (context.lineWidth = lineWidth) > 0 && (
                    context.strokeStyle = Color.isColor(color) ? color : isUP ? color[0] : color[1],
                    context.stroke()
                );
            };
            if (series.selected !== false && !lineWidth && y === y1) {
                y1 += 1;
            }

            context.save();
            context.beginPath();
            context.moveTo(x, y);//open
            context.lineTo(x, y1);//close
            context.lineTo(x + w, y1);//close
            context.lineTo(x + w, y);//open
            context.lineTo(x, y);
            //context.rect(x, y, w, y1 - y);
            context.fillStyle = fillColor;
            context.fill();
            addStroke(lineWidth, borderColor);
            //high or low
            [y2, y3].forEach(function (p) {
                context.beginPath();
                context.moveTo(x2, isUP ? y : y1);//open
                context.lineTo(x2, p);
                series.selected !== false && addStroke(lineWidth || 1, lineColor);
            });
            
            context.restore();
        },
        animateTo: function (initialize) {
            var chart = this;
            var shapes = [];
            chart.series.forEach (function (series) {
                var newData = series.shapes,
                    oldData = series._shapes || [];
                var previous = [];
                List.diff(newData, oldData, function (a, b) {
                    return a && b && a.open === b.open && a.close === b.close && a.low === b.low && a.high === b.high;
                }).add(function () {
                    return null;
                }).remove(function (newIndex) {
                    var newShape = newData[newIndex];
                    var to;
                    newShape.animate({
                        y1: newShape.y,
                        timer: 0
                    }, to = {
                        open: newShape.open,
                        close: newShape.close,
                        low: newShape.low,
                        high: newShape.high,
                        x: newShape.x, y: newShape.y,
                        x1: newShape.x1, y1: newShape.y1,
                        x2: newShape.x2, y2: newShape.y2,
                        timer: 1
                    });
                    previous.push(to);
                    shapes.push(newShape);
                }).modify(function (newIndex, oldIndex) {
                    var newShape = newData[newIndex],
                        oldShape = oldData[oldIndex],
                        mergeShape;
                    var to;
                    newShape.animate({
                        x: oldShape.x, y: oldShape.y,
                        x1: oldShape.x1, y1: oldShape.y1,
                        x2: oldShape.x2, y2: oldShape.y2
                    }, to = {
                        open: newShape.open,
                        close: newShape.close,
                        low: newShape.low,
                        high: newShape.high,
                        x: newShape.x, y: newShape.y,
                        x1: newShape.x1, y1: newShape.y1,
                        x2: newShape.x2, y2: newShape.y2,
                        selected: series.selected
                    });
                    previous.push(to);
                    shapes.push(newShape);
                    series.animationEnabled = !((series.selected === false) && (oldShape.selected === false));
                }).each();
                series._shapes = previous;
            });
            return shapes;
        },
        getShape: function (x, y) {
            var length = this.series.length,
                i = 0;
            var series, shapes, shape;
            var kdtree;
            var reset = function(shapes){
                shapes.forEach(function(item){
                    delete item.current;
                });
            };
            var results = [];

            for (; i < length && (series = this.series[i]).selected !== false; i++) {
                if(!isInside(x, y, series)){
                    return results;
                }
                reset(shapes = series.shapes);
                kdtree = KDTree(shapes);
                shape = kdtree.nearest({x: x, y: y}, function(a, b){
                    var dx = a.x - b.x;
                    return dx * dx;
                })[0];
                kdtree.destroy();
                if(shape && !shape.isNULL){
                    shape.current = shape.index;
                    results.push({shape: shape, series: series});
                }
                
            }
            return results;
        }
    };

    (Chart.graphers = Chart.graphers || {}).candlestick = K;
    
})(typeof window !== "undefined" ? window : this, Dalaba.Chart)