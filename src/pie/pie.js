(function (global, Chart) {
    var relativeLength = Numeric.percentage;

    var angle2arc = Chart.angle2arc;

    var relayout = require("./layout").deps(Numeric);

    function Pie (canvas, options) {
        this.type = "pie";

        this.canvas = canvas;
        this.context = canvas.getContext("2d");

        this.init(options);
    }
    Pie.prototype = {
        constructor: Pie,
        init: function (options) {
            this.options = options;
            this.series = relayout(options.panels);
            this.panels = options.panels;
        },
        draw: function () {
            var context = this.context;
            var chart = this;

            this.series.forEach(function (series) {
                var shapes = series.shapes;
                shapes.forEach(function (shape) {
                    chart.drawShape(context, shape, series);
                });
                shapes.forEach(function (shape) {
                    chart.drawLabels(context, shape, series);
                });
            });
        },
        reflow: function () {
        },
        redraw: function () {
            relayout(this.panels, true);
            this.draw();
        },
        animateTo: function () {
            var shapes = [];
            this.series.forEach(function (series) {
                var newData = series.shapes,
                    oldData = series._shapes || [];
                var previous = [];
                var fromAngle = pack("number", (newData[0] && newData[0].startAngle), -PI / 2);

                List.diff(newData, oldData, function (a, b) {
                    return a && b && a.value === b.value;
                }).add(function (newIndex) {
                    var oldShape = oldData[newIndex],
                        newShape = newData[newIndex] || {};
                    var to;
                    oldShape.animate({
                        startAngle: oldShape.startAngle
                    }, to = {
                        value: oldShape.value,
                        startAngle: newShape.startAngle
                    });
                    previous.push(to);
                    shapes.push(oldShape);
                }).modify(function (newIndex, oldIndex) {
                    var newShape = newData[newIndex],
                        oldShape = oldData[oldIndex];
                    var to;
                    if (newShape && oldShape) {                        
                        newShape.animate({
                            startAngle: oldShape.startAngle,
                            endAngle: oldShape.endAngle,
                            textX: oldShape.textX,
                            textY: oldShape.textY
                        }, to = {
                            value: oldShape.value,
                            startAngle: newShape.startAngle,
                            endAngle: newShape.endAngle,
                            textX: newShape.textX,
                            textY: newShape.textY
                        });
                        previous.push(to);
                        shapes.push(newShape);
                    }
                }).remove(function (newIndex) {//add
                    var newShape = newData[newIndex];
                    var from = {
                        startAngle: fromAngle,
                        endAngle: fromAngle
                    }, to;
                    //no init
                    if (oldData[newIndex - 1]) {
                        newShape.animate({
                            startAngle: newShape.endAngle
                        }, to = {
                            value: newShape.value,
                            startAngle: newShape.startAngle,
                            endAngle: newShape.endAngle,
                            textX: newShape.textX,
                            textY: newShape.textY
                        });
                    }
                    else {
                        newShape.animate(from, to = {
                            value: newShape.value,
                            startAngle: newShape.startAngle,
                            endAngle: newShape.endAngle,
                            textX: newShape.textX,
                            textY: newShape.textY
                        });
                    }
                    previous.push(to);
                    shapes.push(newShape);
                }).each();
                series._shapes = previous;
            });
            return shapes;
        },
        drawState: function (context, shape, series) {
            var x = shape.x,
                y = shape.y,
                radius = shape.radius,
                startAngle = shape.startAngle,
                endAngle = shape.endAngle;
            var color = pack("string", shape.color, series.color, "#000");
            context.save();
            context.beginPath();
            angle2arc(
                x,
                y,
                radius + (radius * 0.05),
                radius,
                startAngle,
                endAngle,
                false//close path
            )(context);
            context.fillStyle = Color.parse(color).alpha(0.2).rgba();
            context.fill();
            context.restore();
        },
        drawShape: function (context, shape, series) {
            var color = pack("string", shape.color, series.color, "#000");
            var borderWidth = pack("number", series.borderWidth, 0),
                borderColor = pack("string", series.borderColor, "#FFFFFF");
            var x = shape.x,
                y = shape.y,
                startAngle = shape.startAngle,
                endAngle = shape.endAngle,
                middleAngle;

            if (defined(shape.current)) {
                color = Color.parse(color).alpha(0.7);
                color = Color.rgba(color);
            }

            if (shape.sliced === true) {
                middleAngle = (startAngle + endAngle) / 2;
                x += mathCos(middleAngle) * 10;
                y += mathSin(middleAngle) * 10;
            }
            
            context.save();
            context.fillStyle = color;
            angle2arc(
                x,
                y,
                shape.radius,
                shape.innerRadius,
                startAngle,
                endAngle,
                false//close path
            )(context);
            series.nofill !== true && context.fill();            
            (context.lineWidth = pack("number", borderWidth)) > 0 && (context.strokeStyle = borderColor, context.stroke());
            if (defined(shape.state)) {
                this.drawState(context, shape, series);
            }
            context.restore();
        },
        drawLabels: function (context, shape, series) {
            var shapeLabels = shape.dataLabels || {},
                dataLabels = pack("object", shape.dataLabels, series.dataLabels, {}),
                enabled = shapeLabels.enabled || dataLabels.enabled,
                style = shapeLabels.style || series.dataLabels.style || {},
                fontStyle = {
                    fontStyle: pack("string", style.fontStyle, "normal"),
                    fontSize: pack("string", style.fontSize, "12px"),
                    fontWeight: pack("string", style.fontWeight, "normal"),
                    fontFamily: pack("string", style.fontFamily, "Arial"),
                    lineHeight: pack("string", style.lineHeight, "normal")
                },
                isInside = !!shapeLabels.inside || !!dataLabels.inside || series.shapes.length === 1;
            var textX = shape.textX,
                textY = shape.textY,
                connectorPoints = shape.connectorPoints,
                formatText;
            var fillText = function (item, x, y, reversed) {
                var value = item.value,
                    formatter = dataLabels.formatter;
                function setVertical(y, h){
                    return {
                        top: y - h,
                        bottom: y + h,
                        middle: y + h / 2
                    };
                }
                function setAlign(x, w){
                    return {
                        left: x - w * !reversed,
                        right: x - w * reversed,
                        center: x - w / 2 * !reversed,
                    };
                }
                if (isString(item)) {
                    value = item;
                }
                if (isObject(item._source) && isString(item._source.value)) {
                    value = item._source.value;
                }
                if (isFunction(formatter)) {
                    value = formatter.call({
                        name: item.name,
                        value: value,
                        total: item.total,
                        percentage: item.percentage,
                        point: item,
                        series: item.series,
                        color: item.color
                    }, item);
                }
                if (defined(value)) {
                    var tag = Text.HTML(Text.parseHTML(value), context, fontStyle);
                    var bbox = tag.getBBox();
                    var w = bbox.width,
                        h = bbox.height;
                    if (isInside) {
                        x = x - w * reversed;
                        y += h / 2;
                    }
                    else {
                        x = pack("number",
                            setAlign(x, w)[pack("string", dataLabels.align, "right")],
                            x
                        );

                        y = pack("number",
                            setVertical(y, h)[pack("string", dataLabels.verticalAlign, "middle")],
                            y - h / 2
                        );
                    }

                    context.save();
                    context.fillStyle = style.color;
                    context.font = [
                        fontStyle.fontStyle,
                        fontStyle.fontWeight,
                        fontStyle.fontSize,
                        fontStyle.fontFamily
                    ].join(" ");
                    context.translate(x, y);
                    tag.toCanvas(context);
                    context.restore();
                }
                return value;
            };
            if (shape.value !== null && shape.selected !== false && enabled === true) {
                if (series.shapes.length === 1 && !shape.innerRadius && isInside) {
                    context.save();
                    context.textAlign = "center";
                    fillText(shape, textX, textY, false);
                    context.restore();
                }
                else if (isInside) {
                    context.save();
                    context.textAlign = "center";// reversed ? "left" : "right";
                    fillText(shape, textX, textY, false);
                    context.restore();
                }
                else {
                    if (shape.visibility !== true) {
                        formatText = fillText(shape, textX, textY, shape.textAnchor === "end");
                        if (defined(formatText) && dataLabels.distance > 0 && dataLabels.connectorWidth > 0) {
                            context.save();
                            context.strokeStyle = shape.color;
                            context.lineWidth = dataLabels.connectorWidth;
                            context.beginPath();
                            (connectorPoints || []).forEach(function (point, i) {
                                context[i ? "lineTo" : "moveTo"](point.x, point.y);
                            });
                            context.stroke();
                            context.restore();
                        }
                    }
                }
            }
        },
        setSliced: function (shapes) {
            shapes.forEach(function (item) {
                var currentShape = item.shape,
                    series = item.series;
                series.shapes.forEach(function(shape){
                    shape !== currentShape && (delete shape.sliced);
                });
                currentShape.sliced = !currentShape.sliced;
            });
        },
        getShape: function (x, y) {
            var series = this.series,
                length = series.length,
                index = -1;
            var context = this.context;
            var shapes, shape, item;
            var ret = [];
            function remove (item) {
                delete item.current;
            }
            function reset (shapes) {
                shapes.forEach(function (item) {
                    remove(item);
                });
            }

            x *= DEVICE_PIXEL_RATIO;
            y *= DEVICE_PIXEL_RATIO;

            for (var i = 0; i < length; i++) {
                item = series[i];
                reset(shapes = item.shapes);
                index = -1;
                for (var j = 0; j < shapes.length; j++) {
                    shape = shapes[j];
                    this.drawShape(context, shape, {nofill: true});
                    if (context.isPointInPath(x, y)) {
                        shape.$value = "" + shape._value;
                        ret.push({shape: shape, series: item});
                        index = j;
                        break;
                    }
                }
                if (index !== -1) {
                    shapes[index].current = index;
                }
                else {
                    reset(shapes);//no selected
                }
            }
            return ret;
        }
    };

    (Chart.graphers = Chart.graphers || {}).pie = Chart.Pie = Pie;
    
})(typeof window !== "undefined" ? window : this, Dalaba.Chart);