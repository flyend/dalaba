(function (global, Chart) {

    var Symbol = Geometry.Symbol;

    var relayout = require("./layout").deps(Numeric);

    var extent = function (series) {
        var a, b;
        var n = series.length,
            i = 0;
        var l = 0,
            r = n - 1;
        a = series[i];
        b = series[n - 1];
       
        while (++i < n) {
            if (a.selected === false) a = series[++l];
            if (b.selected === false) b = series[--r];
        }
        return [a, b];
    };

    /*
     * Class Column
    */
    function Column (canvas, options) {
        this.type = "column";

        this.shapes = [];

        this.canvas = canvas;
        this.context = canvas.getContext("2d");

        this.init(options);
	}
	Column.prototype = {
        constructor: Column,
		init: function (options) {
            this.options = options;//update
            this.series = relayout(options.panels);
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
            //only render
            this.series.forEach(function (series) {
                context.save();
                Symbol.rect(series.plotX, series.plotY - 1, series.plotWidth, series.plotHeight + 2)(context);
                //context.stroke();
                context.clip();
            
                series.shapes.forEach(function (shape) {
                    chart.drawShape(series.context || context, shape, series);
                    delete shape.current;
                });
                context.restore();
            });

            this.series.forEach(function (series) {
                if (series.state) {
                    chart.drawState(context, series);
                }
                series.shapes.forEach(function (shape) {
                    DataLabels.render(series.context || context, shape.dataLabel);
                });
            });
        },
        redraw: function () {
            relayout(this.options.panels, 1);
            this.reflow();
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
                    var to = { value: newShape.value, x0: newShape.x0, y0: newShape.y0, x1: newShape.x1, y1: newShape.y1 },
                        from = {};
                    if (series.type === "bar") {
                        from.x1 = newShape.x0;
                        to.x1 = newShape.x1, to.y1 = newShape.y1;
                    }
                    else {
                        from.y1 = newShape.y0;
                        to.y1 = newShape.y1;
                    }
                    newShape.animate(from, to);
                    previous.push(to);
                    shapes.push(newShape);
                }).add(function (newIndex) {
                    var oldShape = oldData[newIndex],
                        to;
                    oldShape.animate({
                        x1: oldShape.x0,// - (oldShape.x1 - oldShape.x0),
                        y1: oldShape.y0// - (oldShape.y1 - oldShape.y0)
                    }, to = {
                        value: oldShape.value,
                        x1: oldShape.x1,
                        y1: oldShape.y1
                    });
                    shapes.push(oldShape);
                    previous.push(to);
                }).modify(function (newIndex, oldIndex) {
                    var newShape = newData[newIndex], oldShape = oldData[oldIndex],
                        to = { value: newShape.value };
                    var from = {};
                    from = { x0: oldShape.x0, x1: oldShape.x1, y0: oldShape.y0, y1: oldShape.y1 };
                    if (series.selected === false) {
                        from.x0 = oldShape.x0;
                        to.x0 = newShape.x0;
                        from.x1 = oldShape.x1;
                        to.x1 = newShape.x1;
                        to.y0 = oldShape.y0;
                        to.y1 = oldShape.y1;
                    }
                    else {
                        to = { value: newShape.value, x0: newShape.x0, x1: newShape.x1, y0: newShape.y0, y1: newShape.y1 };
                    }
                    if (!newShape.isNULL && oldShape.value !== null) {
                        newShape.animate(from, to);
                    }
                    previous.push(to);
                    shapes.push(newShape);
                }).each();
                series._shapes = previous;
            });
            return shapes;
        },
        drawState: function () { },
        drawShape: function (context, shape, series) {
            var x0 = shape.x0,
                y0 = shape.y0,
                x1 = shape.x1,
                y1 = shape.y1;
            var borderWidth = pack("number", series.borderWidth, 0),
                borderColor = pack("string", series.borderColor, "#FFFFFF"),
                borderRadius = series.borderRadius,
                opacity = series.opacity;
            var rotation = pack("number", shape.rotation, 0);
            var color = shape.color;

            if (series.selected === false) {
                borderWidth = borderRadius = 0;
            }
            if (isObject(color) && defined(color.stops) && isArray(color.stops)){
                var linearGradient = context.createLinearGradient(Math.abs(x1 - x0), y1, Math.abs(x1 - x0), y0);
                color.stops.forEach(function (item) {
                    if(isNumber(item[0]) && typeof item[1] === "string")
                        linearGradient.addColorStop(item[0], item[1]);
                });
                color = linearGradient;
            }
            else {
                color = Color.parse(color);
                if (isNumber(opacity, true)) {
                    color.a = mathMax(0, mathMin(1, opacity));
                }
                if (defined(shape.current)) {
                    color.a = 0.55;
                }
                color = Color.rgba(color);
            }

            context.save();
            borderRadius = TRouBLe(borderRadius).map(function (d) { return d * 2; });
            context.beginPath();
            context.moveTo(x0 + pack("number", borderRadius[0], 0), y1);//left-top
            context.lineTo(x1 - pack("number", borderRadius[1], 0), y1);//right-top
            context.bezierCurveTo(x1, y1, x1, y1, x1, y1 + pack("number", borderRadius[1], 0));//right-top corner
            context.lineTo(x1, y0);//right-bottom, height
            context.lineTo(x0, y0);//left-bottom
            context.lineTo(x0, y1 + pack("number", borderRadius[0], 0));//left-top
            context.bezierCurveTo(x0, y1, x0, y1, x0 + pack("number", borderRadius[0], 0), y1);//left-top corner

            if (defined(series.shadowColor)) {
                context.shadowColor = series.shadowColor;
                isNumber(series.shadowBlur) && (context.shadowBlur = series.shadowBlur);
                isNumber(series.shadowOffsetX) && (context.shadowOffsetX = series.shadowOffsetX);
                isNumber(series.shadowOffsetY) && (context.shadowOffsetY = series.shadowOffsetY);
            }
            context.fillStyle = color;
            context.fill();
            if (borderWidth > 0) {
                context.beginPath();
                context.lineWidth = borderWidth;
                context.strokeStyle = borderColor;
                context.moveTo(x0 + borderWidth / 2, y1 - borderWidth / 2);
                context.lineTo(x1 - borderWidth / 2, y1 - borderWidth / 2);//bottom
                context.lineTo(x1 - borderWidth / 2, y0 + borderWidth / 2);//right
                context.lineTo(x0 + borderWidth / 2, y0 + borderWidth / 2);//top
                context.lineTo(x0 + borderWidth / 2, y1);//left
                context.stroke();
            }
            context.restore();
        },
        dataLabels: function (context, shape, series) {
            var isColumn = series.type === "column";
            shape.dataLabel = DataLabels.align(function (type, bbox) {
                var w = bbox.width,
                    w2 = Math.abs(shape.x1 - shape.x0);
                var offset = 0;
                var t = pack("string", type, isColumn ? "center" : "right");
                if (!defined(type)) {
                    !isColumn && isNumber(shape.value) && shape.value < 0 && (offset = w);
                }
                return {
                    left: shape.x0,
                    center: shape.x0 + (w2 - w) / 2,
                    right: shape.x1 - w * (isColumn) - offset
                }[t];
            }).vertical(function (type, bbox) {
                var h = bbox.height,
                    h2 = Math.abs(shape.y1 - shape.y0);
                var offset = 0;
                var t = pack("string", type, isColumn ? "top" : "middle");
                if (!defined(type)) {
                    isColumn && isNumber(shape.value) && shape.value < 0 && (offset = h);
                }
                return {
                    top: shape[isColumn ? "y1" : "y0"] + offset,
                    middle: (shape[isColumn ? "y1" : "y0"] + h) + (h2 - h) / 2,//start + center
                    bottom: shape[isColumn ? "y0" : "y1"]
                }[t];
            }).call(shape, series, context);
        },
        getShape: function (x, y, shared) {
            var series = this.series,
                length = series.length;
            var plotY, plotHeight;

            var shapes, shape, item, area,
                first,
                last;
            var results = [], result;

            function reset (shapes) {
                /*shapes.forEach(function (item) {
                    delete item.current;
                });*/
            }
            var isInside = function (series) {
                return !(
                    x < series.plotX ||
                    x > series.plotWidth + series.plotX ||
                    y < series.plotY ||
                    y > series.plotHeight + series.plotY
                );
            };
            var groups = partition(this.series, function (a, b) {
                return a.panelIndex === b.panelIndex;
            });

            for (var k = 0; k < groups.length; k++) {
                var group = groups[k];
                var parent = extent(group);
                first = parent[0];
                last = parent[1];

                for (var i = 0; i < groups[k].length; i++) if ((item = group[i]).selected !== false) {
                    plotY = item.plotY;
                    plotHeight = item.plotHeight;
                    
                    if (!isInside(item)) {
                        //return results;
                    }
                    reset(shapes = item.shapes);

                    for (var j = 0; j < shapes.length; j++) {
                        shape = shapes[j] || {};
                        if (shape.isNULL) {
                            continue;
                        }
                        area = {
                            x: shape.x0,
                            y: shape.y0,
                            width: shape.x1,
                            height: shape.y1
                        };
                        
                        if (shared) {
                            area = {
                                x: first.shapes[j].x0,// - shape.margin,
                                y: plotY,// shape.y0,
                                width: last.shapes[j].x1,// + shape.margin,
                                height: plotY + plotHeight// shape.y1
                            };
                        }
                        if (Intersection.rect({x: x, y: y}, area)) {
                            result = {shape: shape, series: item};
                            result.shape.$value = "" + shape._value;
                            results.push(result);
                            shape.current = j;
                            if (!shared) {
                                return results;
                            }
                        }
                    }
                }
            }
            return results;
        }
    };

    var graphers = (Chart.graphers = Chart.graphers || {}),
        charts,
        type;
    for (type in (charts || (charts = {
        Column: Column,
        Bar: require("./bar").deps(Column)
    }))) {
        graphers[type.toLowerCase()] = Chart[type] = charts[type];
    }

})(typeof window !== "undefined" ? window : this, Dalaba.Chart);