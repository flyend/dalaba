(function (global, Chart) {
    var relayout = require("./layout").deps(Numeric);
    /*
     * Class Scatter
    */
    function Scatter (canvas, options) {
        this.type = "scatter";

        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        
        this.init(options);
    }
    Scatter.prototype = {
        constructor: Scatter,
        init: function (options) {
            this.options = options;//update
            this.panels = options.panels;
            this.series = relayout(this.panels, false, options.series);
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
        draw: function () {
            var context = this.context,
                chart = this;
            this.series.forEach(function (series) {
                series.shapes.forEach(function (shape) {
                    chart.drawShape(context, shape, series);
                });
                series.shapes.forEach(function (shape) {
                    if (isNumber(shape.current) && shape.current > -1) {
                        chart.drawShape(context, shape, series);
                    }
                    DataLabels.render(context, shape.dataLabel, series);
                });
            });
        },
        redraw: function (event) {
            relayout(this.panels, event.type === "resize", this.options.series);
            if (event.type === "resize") {
                //this.reflow();
            }
            this.reflow();
        },
        drawShape: function (context, shape, series) {
            var borderWidth = pack("number", series.borderWidth, 0),
                borderColor = series.borderColor,
                fillColor = shape.color || series.color,
                opacity = Numeric.clamp(pack("number", shape.opacity, series.opacity, 1), 0, 1),
                shadowBlur = pack("number", shape.shadowBlur, series.shadowBlur, 0),
                shadowOffsetX = pack("number", shape.shadowOffsetX, series.shadowOffsetX, 0),
                shadowOffsetY = pack("number", shape.shadowOffsetY, series.shadowOffsetY, 0),
                shadowColor = shape.shadowColor || series.shadowColor,
                marker = shape.marker || series.marker || {},
                states = (series.states || {}).hover;
            var radius = shape.radius,
                cx = shape.x,
                cy = shape.y,
                width, height;
            var symbol = pack("string", marker && marker.symbol, "circle");

            var color = fillColor;
            //cy += radius
            width = radius;
            height = radius;
            if (shape.isNULL) {
                return this;
            }

            if (defined(fillColor.radialGradient)) {
                color = Color.parse(fillColor);
                fillColor = color.radial(cx, cy, radius);
                color = color.color;
            }
            if (opacity < 1) {
                color = fillColor = Color.parse(fillColor).alpha(opacity).rgba();
            }
            
            if (isNumber(shape.current) && shape.current > -1) {
                context.save();
                context.fillStyle = (states || {}).color || Color.parse(color).alpha(0.25).rgba();
                width += mathMin(2, width * 0.1);
                height += mathMin(2, height * 0.1);
                Geometry.Symbol[symbol]
                ? Geometry.Symbol[symbol](cx, cy, width, height)(context)
                : (context.beginPath(), context.arc(cx, cy, width, 0, PI2, true));
                context.fill();
                context.restore();
            }
            
            context.save();
            context.fillStyle = fillColor;
            Geometry.Symbol[symbol]
                ? Geometry.Symbol[symbol](cx, cy, width, height)(context)
                : (context.beginPath(), context.arc(cx, cy, width, 0, PI2, true));
            borderWidth > 0 && (context.lineWidth = borderWidth, context.strokeStyle = borderColor, context.stroke());
            if (shadowBlur > 0) {
                context.shadowColor = shadowColor;
                context.shadowBlur = shadowBlur;
                context.shadowOffsetX = shadowOffsetX;
                context.shadowOffsetY = shadowOffsetY;
            }
            context.fill();
            context.restore();
        },
        dataLabels: function (context, shape, series) {
            var radius = shape.radius;
            if (defined(shape.dataLabel.value)) {
                DataLabels.value(shape.dataLabel.value);
            }
            DataLabels.align(function (type, bbox, options) {
                var x = shape.x;
                var t = pack("string", type, "center");
                var margin = 5;
                return {
                    left: x - radius - bbox.width - margin,
                    center: x - bbox.width / 2,
                    right: x + radius + margin
                }[t];
            }).vertical(function (type, bbox) {
                var y = shape.y;
                var t = pack("string", type, "middle");
                var margin = 5;
                return {
                    top: y - radius - margin,
                    middle: y + bbox.height / 2,// start center
                    bottom: y + radius + bbox.height + margin
                }[t];
            }).call(shape, series, context);
        },
        animateTo: function (initialize) {
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
                    newShape.animate({
                        radius: initialize ? 0 : newShape.radius
                    }, to = {
                        value: newShape.value,
                        radius: newShape.radius,
                        x: newShape.x,
                        y: newShape.y
                    });
                    
                    previous.push(to);
                    shapes.push(newShape);
                }).add(function (newIndex) {
                    var oldShape = oldData[newIndex],
                        to;
                    oldShape.animate({
                        radius: oldShape.radius
                    }, to = {
                        value: oldShape.value,
                        radius: 0
                    });
                    shapes.push(oldShape);
                    previous.push(to);
                }).modify(function (newIndex, oldIndex) {
                    var newShape = newData[newIndex],
                        oldShape = oldData[oldIndex];
                    var from = {
                        x: oldShape.x,
                        y: oldShape.y,
                        radius: oldShape.radius
                    }, to = {
                        value: newShape.value,
                        x: newShape.x,
                        y: newShape.y,
                        radius: newShape.radius
                    };
                    newShape.animate(from, to);

                    previous.push(to);
                    shapes.push(newShape);
                }).each();
                series._shapes = previous;
            });
            return shapes;
        },
        getShape: function (x, y, shared) {
            var series,
                shape,
                sl = this.series.length,
                dl,
                i,
                j;
            var results = [],
                shapes;
            var resetShape = function (shapes) {
                for(var j = 0, l = shapes.length; j < l;  j++){
                    delete shapes[j].current;
                }
            };

            for (i = 0; i < sl; i++) {
                shapes = (series = this.series[i]).shapes;
                resetShape(shapes);
                /*if (!isInside(series)) {
                    return results;
                }*/
                for (j = 0, dl = shapes.length; series.enableMouseTracking !== false && j < dl; j++) {
                    shape = shapes[j];
                    if (series.selected === false) {
                        continue;
                    }
                    if (Intersection.line(
                        {x: x, y: y},
                        {x: shape.x, y: shape.y, width: shape.radius}
                    )) {
                        shape.current = j;
                        results.push({shape: shape, series: series});
                        break;
                    }
                }
            }
            return results;
        }
    };

    (Chart.graphers = Chart.graphers || {}).scatter = Chart.Scatter = Scatter;

})(typeof window !== "undefined" ? window : this, Dalaba.Chart);