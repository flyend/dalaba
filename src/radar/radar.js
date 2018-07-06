(function (global, Chart) {

    var relayout = require("./layout").deps(Numeric);

    var angle2arc = Chart.angle2arc;

    var lineSegment = function (context, points, options) {
        var dashStyle = pack("string", (options = options || {}).dashStyle, "solid");
        var length = (points || []).length, i, j;
        var x, y, moveX, moveY;
        var point;
        if (length) {
            point = points[i = 0];
            moveX = point.x, moveY = point.y;

            context.beginPath();
            context.moveTo(moveX, moveY);
            for (; i < length; i++) {
                point = points[i];

                if (point.isNULL) {
                    //find next point
                    for (j = i + 1; j < length; j++) {
                        if (!points[j].isNULL) {
                            x = points[j].x;
                            y = points[j].y;
                            break;
                        }
                    }
                    context.moveTo(moveX = x, moveY = y);
                }
                x = point.x, y = point.y;
                
                if (!point.isNULL) {
                    DashLine[dashStyle] && dashStyle !== "solid" ? DashLine[dashStyle](
                        context,
                        moveX, moveY,
                        moveX = x, moveY = y
                    ) : context.lineTo(x, y);
                }
            }
        }
    };

    /*
     * Class Scatter
    */
    function Radar (canvas, options) {
        this.type = "radar";

        this.canvas = canvas;
        this.context = canvas.getContext("2d");

        this.series = [];
        
        this.init(options);
    }
    Radar.prototype = {
        constructor: Radar,
        init: function (options) {
            var type = this.type,
                canvas = this.canvas;
            var chart = this;

            this.options = extend({}, options);
            this.series = arrayFilter(options.series, function (series) {
                return series.type === type;
            });
            relayout(type, this.options);

            if (canvas.nodeType === 1) {
                this.series.forEach(function(series){
                    if(series.animationEnabled){
                        var image = document.createElement("canvas"),
                            context = image.getContext("2d");

                        Chart.scale(context, canvas.width, canvas.height, DEVICE_PIXEL_RATIO);
                        series._image = image;
                        chart.drawLine(context, series.shapes, series);
                    }
                });
            }
            this.reflow();
        },
        reflow: function () {
            var context = this.context;
            var chart = this;
            this.series.forEach(function (series) {
                series.shapes.forEach(function (shape) {
                    chart.dataLabels(context, shape, series);
                });
            });
        },
        draw: function (initialize) {
            var context = this.context,
                chart = this;
            if (initialize === true) {
                this.series.forEach(function (series) {
                    var shapes = series.shapes;
                    var timer = (shapes[0] || {}).timer;
                    Clip.Quadrant(series._image, series.plotCenterX, series.plotCenterY, series.plotRadius * 2 + 10).angle(series._startAngle, series._endAngle).clip(context, timer);
                });
            }
            else {
                this.series.forEach(function (series) {
                    var shapes = series.shapes;
                    chart.drawLine(context, shapes, series);
                    shapes.forEach(function (shape) {
                        chart.drawShape(context, shape, series);
                    });
                    shapes.forEach(function (shape) {
                        DataLabels.render(context, shape.dataLabel, series);
                        chart.onHover(context, shape, series);
                    });
                });
            }
        },
        redraw: function () {
            relayout(this.type, this.options);
            this.reflow();
            this.draw();
        },
        getShape: function (x, y) {
            var series,
                shape,
                sl = this.series.length,
                dl,
                i,
                j;
            var results = [],
                shapes;

            var isInside = function (series) {
                var dx = x - series.plotCenterX,
                    dy = y - series.plotCenterY;
                return series.plotRadius * series.plotRadius - dx * dx - dy * dy >= 0.001;
            };
            var resetShape = function (shapes) {
                for (var j = 0, l = shapes.length; j < l;  j++) {
                    delete shapes[j].current;
                }
            };

            for (i = 0; i < sl; i++) {
                series = this.series[i];
                shapes = series.shapes;
                if (isInside(series)) {
                    //return results;
                    resetShape(shapes);
                    for (j = 0, dl = shapes.length; j < dl; j++) {
                        shape = shapes[j];
                        if (series.selected !== false && !shape.isNULL && Intersection.line(
                            {x: x, y: y},
                            {x: shape.x, y: shape.y, width: pack("number", (series.marker || {}).radius, 5) * 2}
                        )) {
                            shape.current = j;
                            results.push({shape: shape, series: series});
                            break;
                        }
                    }
                }
            }
            return results;
        },
        drawShape: function (context, shape, series) {
            var marker = pack("object", shape.marker, series.marker, {});
            var lineWidth = pack("number", marker.lineWidth, 0),
                lineColor = pack("string", marker.lineColor, shape.color, series.color, "#000"),
                fillColor = pack("string", marker.fillColor, shape.color, series.color, "#000"),
                radius = pack("number", marker.radius, 4);

            var usemarker = series.shapes.length * radius < series.plotRadius;
            if (defined(marker.enabled)) {
                usemarker = marker.enabled === true;
            }

            if (series.selected !== false & !shape.isNULL & usemarker) {
                context.save();
                context.fillStyle = fillColor;
                context.beginPath();
                context.arc(shape.x, shape.y, radius, 0, PI2, true);
                context.fill();
                (context.lineWidth = lineWidth) > 0 &&(context.strokeStyle = lineColor, context.stroke());
                context.restore();
            }
        },
        drawLine: function (context, shapes, series) {
            var lineWidth = pack("number", series.lineWidth, 2),
                lineColor = series.lineColor || series.color,
                fillColor = series.fillColor || series.color,
                radarType = series.radarType;
            context.save();
            context.beginPath();
            if (radarType === "area") {
                if (Color.isColor(fillColor)) {
                    fillColor = Color.parse(fillColor).alpha(0.75).rgba();
                }
                else if (defined(fillColor.radialGradient)) {
                    fillColor = Color.parse(fillColor).radial(series.cx, series.cy, series.radius);
                }
                lineSegment(context, shapes, series);
                context.fillStyle = fillColor;
                context.closePath();
                context.fill();
            }
            else {
                lineSegment(context, shapes, series);
                context.closePath();
            }

            (context.lineWidth = lineWidth) > 0 && (
                context.shadowColor = series.shadowColor,
                isNumber(series.shadowBlur) && (context.shadowBlur = series.shadowBlur),
                isNumber(series.shadowOffsetX) && (context.shadowOffsetX = series.shadowOffsetX),
                isNumber(series.shadowOffsetY) && (context.shadowOffsetY = series.shadowOffsetY),
                context.strokeStyle = lineColor,
                context.stroke()
            );
            context.restore();
        },
        onHover: function (context, shape, series) {
            var marker = series.marker || {},
                fillColor = shape.color || series.color,
                hoverColor;
            if (!shape.isNULL && isNumber(shape.current) && shape.current > -1) {
                hoverColor = Color.parse(fillColor);
                hoverColor.a = 0.5;
                context.save();
                context.fillStyle = Color.rgba(hoverColor);
                context.beginPath();
                context.arc(shape.x, shape.y, 8, 0, PI2);
                context.fill();

                context.fillStyle = fillColor;
                context.strokeStyle = marker.fillColor || "#fff";
                context.beginPath();
                context.arc(shape.x, shape.y, 3, 0, PI2);
                context.fill();
                context.stroke();
                context.restore();
            }
            delete shape.current;
        },
        dataLabels: function (context, shape, series) {
            var radius = pack("number", (shape.marker || {}).radius, (series.marker || {}).radius, 0);
            shape.dataLabel = DataLabels.align(function (type, bbox) {
                var t = pack("string", type, "center"),
                    //angle = shape.angle,
                    x = shape.x,
                    w = bbox.width;
                return {
                    left: x - w - radius / 2,
                    center: x - w / 2,
                    right: x + radius / 2
                }[t];
            }).vertical(function(type, bbox){
                var t = pack("string", type, "top"),
                    y = shape.y,
                    h = bbox.height;
                return {
                    top: y - radius,
                    middle: y - h + radius,
                    bottom: y + radius
                }[t];
            }).call(shape, series, context);
        },
        animateTo: function () {
            var shapes = [];
            this.series.forEach(function (series) {
                var newData = series.shapes,
                    oldData = series._shapes || [];
                var previous = [];
                List.diff(series.shapes, series._shapes || [], function (a, b) {
                    return a && b && a.value === b.value;
                }).remove(function (newIndex) {
                    var newShape = newData[newIndex];
                    var to;
                    newShape.animate({
                        timer: 0
                    }, to = {
                        value: newShape.value,
                        timer: 1,
                        x: newShape.x,
                        y: newShape.y
                    });
                    shapes.push(newShape);
                    previous.push(to);
                }).add(function (newIndex) {
                    var oldShape = oldData[newIndex],
                        to;
                    oldShape.animate({
                    }, to = {
                        value: oldShape.value
                    });
                    shapes.push(oldShape);
                    previous.push(to);
                }).modify(function (newIndex, oldIndex) {
                    var newShape = newData[newIndex],
                        oldShape = oldData[oldIndex],
                        from = { x: oldShape.x, y: oldShape.y },
                        to = { value: newShape.value, x: newShape.x, y: newShape.y };
                    newShape.animate(from, to);
                    shapes.push(newShape);
                    previous.push(to);
                }).each();
                series._shapes = previous;
            });
            return shapes;
        }
    };

    (Chart.graphers = Chart.graphers || {}).radar = Chart.Radar = Radar;

})(typeof window !== "undefined" ? window : this, Dalaba.Chart);