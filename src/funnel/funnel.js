(function (global, Chart) {

    var lineSlope = function (p1, p2) {
        var slope = p2.x - p1.x ? (p2.y - p1.y) / (p2.x - p1.x) : 0;//斜率
        return {
            slope: slope,
            b: p1.y - slope * p1.x
        };
    };

    var relayout = require("./layout").deps(lineSlope);

    function Funnel (canvas, options) {
        this.type = "funnel";
        this.canvas = canvas;
        this.context = canvas.getContext("2d");

        this.series = [];
        
        this.init(options);
    }
    Funnel.prototype = {
        constructor: Funnel,
        init: function (options) {
            this.options = options;
            this.panels = options.panels;
            this.series = relayout(this.panels);
            this.reflow();
        },
        reflow: function () {
            var context = this.context;
            var chart = this;
            this.series.forEach(function (series ){
                series.shapes.forEach(function (shape) {
                    chart.dataLabels(context, shape, series);
                });
            });
        },
        draw: function () {
            var context = this.context,
                chart = this;
            this.series.forEach(function (series) {
                series.shapes.forEach(function (shape) {
                    chart.drawShape(context, shape, series);
                });
                series.shapes.forEach(function (shape) {
                    chart.drawLabels(context, shape, series);
                });
            });
        },
        redraw: function () {
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
                }).remove(function (newIndex) {
                    var newShape = newData[newIndex],
                        to;
                    var points = newShape.points,
                        length = points.length;
                    var startY = points[0].y,
                        endY = points[length - 2].y,
                        nextY = points[length - 3].y;
                    newShape.animate({
                        points: points.map(function (d, i) {
                            var ret = { x: d.x, y: d.y };
                            if (length === 7) {
                                ret.y = startY;
                            }
                            else {
                                if (i === 2 || i === 3) {
                                    ret.y = startY;
                                }
                            }
                            return ret;
                        })
                    }, to = {
                        value: newShape.value,
                        points: points.map(function (d, i) {
                            var ret = { x: d.x, y: d.y };
                            if (length === 7) {
                                (i === 0 || i === 1 || i === 6) && (ret.y = startY);
                                (i === 2 || i === 5) && (ret.y = endY);
                                (i === 3 || i === 4) && (ret.y = nextY);
                            }
                            else {
                                if (i === 2 || i === 3) {
                                    d.y = endY;
                                }
                            }
                            return ret;
                        })
                    });
                    shapes.push(newShape);
                    previous.push(to);
                }).add(function (newIndex) {

                }).modify(function (newIndex, oldIndex) {
                    var newShape = newData[newIndex],
                        oldShape = oldData[oldIndex],
                        to;
                    var points = newShape.points,
                        opoints = oldShape.points,
                        length = points.length,
                        ol = opoints.length;
                    var startY = points[0].y,
                        ostartY = opoints[0].y,
                        endY = points[length - 2].y,
                        oEndY = opoints[ol - 2].y,
                        nextY = points[length - 3].y,
                        onextY = opoints[ol - 3].y;

                    newShape.animate({
                        points: points.map(function (d, i) {
                            var ret = { x: d.x, y: d.y };
                            if (length === 7) {
                                (i === 0 || i === 1 || i === 6) && (ret.y = ostartY);
                                (i === 2 || i === 5) && (ret.y = oEndY);
                                (i === 3 || i === 4) && (ret.y = onextY);
                            }
                            else {
                                (i === 2 || i === 3) && (ret.y = oEndY);
                            }
                            return ret;
                        })
                    }, to = {
                        value: newShape.value,
                        points: points.map(function (d, i) {
                            var ret = { x: d.x, y: d.y };
                            if (length === 7) {
                                (i === 0 || i === 1 || i === 6) && (ret.y = startY);
                                (i === 2 || i === 5) && (ret.y = endY);
                                (i === 3 || i === 4) && (ret.y = nextY);
                            }
                            else {
                                (i === 2 || i === 3) && (ret.y = endY);
                            }
                            return ret;
                        })
                    });
                    previous.push(to);
                    shapes.push(newShape);

                }).each();
                series._shapes = previous;
            });
            return shapes;
        },
        drawShape: function (context, shape, series) {
            var borderWidth = pack("number", shape.borderWidth, series.borderWidth, 0),
                fillColor = shape.color || series.color;
            var points = shape.points;

            if (shape.selected !== false && !shape.isNULL) {
                fillColor = Color.parse(fillColor);
                fillColor.a = defined(shape.current) ? 0.75 : 1;

                context.save();
                context.fillStyle = Color.rgba(fillColor);
                context.beginPath();
                points.forEach(function (point, i) {
                    context[i ? "lineTo" : "moveTo"](point.x, point.y);
                });
                context.fill();

                (context.lineWidth = borderWidth) > 0 && (
                    context.strokeStyle = series.borderColor,
                    context.stroke()
                );
                context.restore();
            }
        },
        getShape: function (x, y) {
            var ret = [];
            var series = this.series,
                length = series.length;
            var shapes, shape, item;

            function reset (shapes) {
                shapes.forEach(function (item) {
                    delete item.current;
                });
            }

            for (var i = 0; i < length; i++) {
                item = series[i];
                reset(shapes = item.shapes);
                for (var j = 0; j < shapes.length; j++){
                    shape = shapes[j];
                    if (
                        !shape.isNULL &&
                        shape.selected !== false &&
                        Intersection.polygon({x: x, y: y}, shape.points)
                    ) {
                        shape.current = j;
                        shape.$value = "" + shape._value;
                        ret.push({shape: shape, series: item});
                        break;
                    }
                }
            }
            return ret;
        },
        dataLabels: function (context, shape, series) {
            var labelAttr = {};
            shape.dataLabel = DataLabels.align(function (type, bbox) {
                var t = pack("string", type, "center");
                var points = shape.points,
                    ls;
                var w2 = Math.abs(points[1].x - points[0].x),
                    w = bbox.width,
                    x = shape.textX,
                    y = shape.textY;
                labelAttr.distance = this.distance;
                labelAttr.inside = this.inside;
                if (this.inside === true) {
                    x = points[0].x;
                }
                else {
                    return x + this.distance;
                }
                ls = lineSlope(points[4], points[3]);
                return {
                    left: (y - ls.b) / ls.slope,
                    center: x  + (w2 - w) / 2,
                    right: textX - w
                }[t];
            }).vertical(function (type, bbox) {
                var points = shape.points;
                var h = bbox.height,
                    h2 = shape.height,
                    y = points[0].y;
                var textY = shape.textY;
                var t = pack("string", type, "top");
                labelAttr.inside = this.inside;
                if (this.inside !== true)
                    return textY + h / 2;
                return {
                    top: y + h,
                    middle: y + h + (h2 - h) / 2,
                    bottom: y + h2
                }[t];
            }).call(shape, series, context);
            extend(shape.dataLabel, labelAttr);
        },
        drawLabels: function (context, shape, series) {
            var dataLabel = shape.dataLabel;
            var x = shape.textX,
                y = shape.textY;
            var distance = dataLabel.distance;
            if (!shape.isNULL && distance > 0) {
                context.save();
                context.beginPath();
                context.moveTo(x, y);
                context.lineTo(x += distance, y);
                context.strokeStyle = shape.color;
                context.stroke();
                context.restore();
            }
            DataLabels.render(context, dataLabel, series);
        }
    };

    (Chart.graphers = Chart.graphers || {}).funnel = Chart.Funnel = Funnel;

})(typeof window !== "undefined" ? window : this, Dalaba.Chart);