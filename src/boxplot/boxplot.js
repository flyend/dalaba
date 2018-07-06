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

    function Boxplot (canvas, options) {
        this.type = "boxplot";

        this.shapes = [];

        this.canvas = canvas;
        this.context = canvas.getContext("2d");

        this.init(options);
	}
	Boxplot.prototype = {
        constructor: Boxplot,
		init: function (options) {
            var panels = [],
                panel = options.panel;
            var n = panel.length, i = -1, j, nn;

            var newSeries = [],
                series;
            this.series = [];

            while (++i < n) {
                newSeries = [];
                for (j = 0, nn = panel[i].series.length; j < nn; j++) if ((series = panel[i].series[j]).type === this.type) {
                    newSeries.push(series);
                    this.series = this.series.concat(series);
                }
                panels.push({
                    series: newSeries
                });
            }
            this.options = options;//update
            this.panels = panels;

            relayout(panels);
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
            //only render
            this.series.forEach(function (series) {
                if (series.animationEnabled && (!series.animationCompleted || series.selected !== false)) {
                    Clip.Rect(series.plotX, series.plotY - 1, series.plotWidth, series.plotHeight + 2).clip(context);
                    series.shapes.forEach(function (shape) {
                        chart.drawShape(context, shape, series);
                        delete shape.current;
                    });
                }
            });

            this.series.forEach(function (series) {
                if (series.animationEnabled && (!series.animationCompleted || series.selected !== false)) {
                    series.shapes.forEach(function (shape) {
                        (shape.boxDataLabels || []).forEach(function (_) {
                            DataLabels.render(context, _);
                        });
                    });
                }
            });
        },
        redraw: function () {
            relayout(this.panels, true);
            this.reflow();
            this.draw();
        },
        animateTo: function (initialize, isCurrented) {
            var shapes = [];
            this.series.forEach(function (series) {
                var newData = series.shapes,
                    oldData = series._shapes || [];
                var previous = [];
                List.diff(newData, oldData, function (a, b) {
                    return a && b && a.value === b.value;
                }).remove(function (newIndex) {
                    var newShape = newData[newIndex];
                    var startY = newShape.y2;// from start median point
                    var to;
                    newShape.animate({
                        y: startY,
                        y1: startY,
                        y3: startY,
                        y4: startY
                    }, to = {
                        value: newShape.value,
                        x: newShape.x, y: newShape.y,
                        x1: newShape.x1, y1: newShape.y1,
                        x2: newShape.x2, y2: newShape.y2,
                        x3: newShape.x3, y3: newShape.y3,
                        x4: newShape.x4, y4: newShape.y4,
                    });
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
                        to;
                    var from = {
                        x: oldShape.x, y: oldShape.y,
                        x1: oldShape.x1, y1: oldShape.y1,
                        x2: oldShape.x2, y2: oldShape.y2,
                        x3: oldShape.x3, y3: oldShape.y3,
                        x4: oldShape.x4, y4: oldShape.y4
                    };
                    to = {
                        value: newShape.value, 
                        x: newShape.x, y: newShape.y,
                        x1: newShape.x1, y1: newShape.y1,
                        x2: newShape.x2, y2: newShape.y2,
                        x3: newShape.x3, y3: newShape.y3,
                        x4: newShape.x4, y4: newShape.y4,
                        selected: series.selected
                    };
                    newShape.animate(from, to);
                    previous.push(to);
                    shapes.push(newShape);
                    series.animationEnabled = !((series.selected === false) && (oldShape.selected === false));
                }).each();
                series._shapes = previous;
            });
            return shapes;
        },
        drawShape: function (context, shape, series) {
            var x = shape.x, y = shape.y,
                x1 = shape.x1, y1 = shape.y1,
                x2 = shape.x2, y2 = shape.y2,
                x3 = shape.x3, y3 = shape.y3,
                x4 = shape.x4, y4 = shape.y4;
            var width = mathAbs(x1 - x),
                height = mathAbs(y - y1);
            var lineWidth = pack("number", shape.lineWidth, series.lineWidth, 1),
                borderWidth = pack("number", shape.borderWidth, series.borderWidth, 1),
                fillColor = shape.fillColor || series.fillColor || series.color,
                q1Color = shape.q1Color || series.q1Color,
                q1LineWidth = pack("number", shape.q1LineWidth, series.q1LineWidth, 0),
                q3Color = shape.q3Color || series.q3Color,
                q3LineWidth = pack("number", shape.q3LineWidth, series.q3LineWidth, 0),
                borderColor = series.borderColor || series.color;
            var whiskerWidth = pack("number", shape.whiskerWidth, series.whiskerWidth, lineWidth, 1),
                whiskerColor = shape.whiskerColor || series.whiskerColor || borderColor,
                whiskerLength;
            var states = series.states || {};
            var inverted = series.inverted;
            var linePixel;
            var center;

            if (isNumber(shape.current) && shape.current > -1 && (!defined(states.hover) || (defined(states.hover) && states.hover.enabled !== false))) {
                borderWidth = lineWidth = mathMax(1, mathMin(lineWidth, 1) * 2);
            }
            if (shape.isNULL) {
                return this;
            }
            delete shape.current;
            linePixel = fixPixelHalf(x, y, x1, y1, lineWidth);

            x = linePixel[0], y = linePixel[1];
            y1 = linePixel[3];
            x1 = fixPixelHalf(x1, lineWidth || 1)[0];
            x2 = fixPixelHalf(x2, lineWidth || 1)[0];
            x3 = fixPixelHalf(x3, lineWidth || 1)[0];
            x4 = fixPixelHalf(x4, lineWidth || 1)[0];
            y2 = fixPixelHalf(y2, lineWidth || 1)[0];
            y3 = fixPixelHalf(y3, lineWidth || 1)[0];
            y4 = fixPixelHalf(y4, lineWidth || 1)[0];

            if (series.selected !== false && !lineWidth && y === y1) {
                //y1 += 1;
            }

            context.save();
            if (inverted) {
                context.beginPath();
                context.moveTo(x2, y);
                context.lineTo(x, y);// q1 -> median
                context.lineTo(x, y1);
                context.lineTo(x2, y1);
                context.fillStyle = q1Color || fillColor;
                context.fill();
                (context.lineWidth = borderWidth) > 0 && (
                    context.strokeStyle = borderColor,
                    context.stroke()
                );
                context.beginPath();
                context.moveTo(x2, y1);
                context.lineTo(x1, y1);// median -> q3
                context.lineTo(x1, y);
                context.lineTo(x2, y);
                context.fillStyle = q3Color || fillColor;
                context.fill();
                (context.lineWidth = borderWidth) > 0 && (
                    context.strokeStyle = borderColor,
                    context.stroke()
                );

                context.beginPath();
                q1LineWidth > 0 && (context.moveTo(x, y), context.lineTo(x, y1));
                q3LineWidth > 0 && (context.moveTo(x1, y), context.lineTo(x1, y1));
                context.moveTo(x2, y);
                context.lineTo(x2, y1);// median
                context.moveTo(x3, y3);
                context.lineTo(x, y3);
                context.moveTo(x1, y3);
                context.lineTo(x4, y3);
                (context.lineWidth = lineWidth) > 0 && (
                    context.strokeStyle = borderColor,
                    context.stroke()
                );

                whiskerLength = pack("number",
                    shape.whiskerLength, Numeric.percentage(height, shape.whiskerLength) / height,
                    series.whiskerLength, Numeric.percentage(height, series.whiskerLength) / height,
                1);
                center = (height - height * whiskerLength) / 2;
                context.beginPath();
                context.moveTo(x3, y + center);// lower
                context.lineTo(x3, y2 - center);
                context.moveTo(x4, y + center);// upper
                context.lineTo(x4, y2 - center);
            }
            else {
                context.beginPath();
                context.moveTo(x, y2);// q1
                context.lineTo(x, y);// q1 -> median
                context.lineTo(x1, y);
                context.lineTo(x1, y2);
                //context.lineTo(x, y);
                context.fillStyle = q1Color || fillColor;
                context.fill();
                (context.lineWidth = borderWidth) > 0 && (
                    context.strokeStyle = borderColor,
                    context.stroke()
                );
                context.beginPath();
                context.moveTo(x, y2);// median -> q3
                context.lineTo(x, y1);
                context.lineTo(x1, y1);
                context.lineTo(x1, y2);
                //context.lineTo(x, y1);
                context.fillStyle = q3Color || fillColor;
                context.fill();
                (context.lineWidth = borderWidth) > 0 && (
                    context.strokeStyle = borderColor,
                    context.stroke()
                );
                context.beginPath();
                q1LineWidth > 0 && (context.moveTo(x, y), context.lineTo(x1, y));
                q3LineWidth > 0 && (context.moveTo(x, y1), context.lineTo(x1, y1));
                context.moveTo(x, y2);
                context.lineTo(x1, y2);// median
                context.moveTo(x3, y);// lower
                context.lineTo(x3, y3);
                context.moveTo(x3, y1);// upper
                context.lineTo(x3, y4);

                (context.lineWidth = lineWidth) > 0 && (
                    context.strokeStyle = borderColor,
                    context.stroke()
                );

                whiskerLength = pack("number",
                    shape.whiskerLength, Numeric.percentage(width, shape.whiskerLength) / width,
                    series.whiskerLength, Numeric.percentage(width, series.whiskerLength) / width,
                1);
                center = (width - width * whiskerLength) / 2;
                context.beginPath();
                context.moveTo(x + center, y3);
                context.lineTo(x1 - center, y3);// upper
                context.moveTo(x + center, y4);
                context.lineTo(x1 - center, y4);// lower
            }
            (context.lineWidth = whiskerWidth) > 0 && (context.strokeStyle = whiskerColor, context.stroke());
            context.restore();
        },
        dataLabels: function (context, shape, series) {
            var labelMaps =  {
                "0": { align: "left", valign: "middle", y: "y3" },// lower
                "1": { align: "right", valign: "middle", y: "y1" }, // q1
                "2": { align: "left", valign: "middle", y: "y2" }, // median
                "3": { align: "right", valign: "middle", y: "y" }, // q3
                "4": { align: "left", valign: "middle", y: "y4" } // upper
            };
            var inverted = series.inverted === true;
            var clamp = function (v, min, max) {
                if (v <= min)
                    return min;
                else if (v >= max)
                    return max;
                return v;
            };
            if (inverted) {
                labelMaps =  {
                    "0": { align: "left", valign: "middle", x: "x3", y: "y2" },// lower
                    "1": { align: "left", valign: "top", x: "x", y: "y" }, // q1
                    "2": { align: "center", valign: "middle", x: "x2", y: "y2" }, // median
                    "3": { align: "right", valign: "top", x: "x1", y: "y" }, // q3
                    "4": { align: "right", valign: "middle", x: "x4", y: "y2" } // upper
                };
            }
            shape.boxDataLabels = [];
            (shape.source || []).slice(0, 5).forEach(function (item, i) {
                var key = labelMaps[i] || {};
                var dataLabel = DataLabels.value(item).align(function (type, bbox) {
                    var w = bbox.width,
                        w2 = Math.abs(shape.x1 - shape.x);
                    var x = shape[key.x || "x"];
                    var offset = 5;

                    var t = pack("string", type, key.align, "center");
                    return {
                        left: [x - (w + offset), x - (w + offset)][+inverted],
                        center: [x + (w2 - w) / 2, x - w / 2][+inverted],
                        right: [x + w2 + offset, x + offset][+inverted]
                    }[t];
                }).vertical(function (type, bbox) {
                    var h = bbox.height,
                        h2 = Math.abs(shape.y1 - shape.y);
                    var t = pack("string", type, key.valign, "top");
                    var y = shape[key.y || "y"];
                    var offset = 5;
                    return {
                        top: [y - offset, y][+inverted],
                        middle: [(y + h / 2), y + h + offset][+inverted],
                        bottom: y + h + offset
                    }[t];
                }).call(shape, series, context);
                shape.boxDataLabels.push(dataLabel);
            });
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
            var inverted;
            var area;
            var flag;
            var intersectedPoints;

            var isInside = function (series) {
                return !(
                    x < series.plotX ||
                    x > series.plotWidth + series.plotX ||
                    y < series.plotY ||
                    y > series.plotHeight + series.plotY
                );
            };
            var resetShape = function (shapes) {
                for (var j = 0, l = shapes.length; j < l;  j++) {
                    delete shapes[j].current;
                }
            };

            for (i = 0; i < sl; i++) {
                shapes = (series = this.series[i]).shapes;
                resetShape(shapes);
                inverted = series.inverted;
                if (!isInside(series)) {
                    return results;
                }
                for (j = 0, dl = shapes.length; series.selected !== false && series.enableMouseTracking !== false && j < dl; j++) {
                    shape = shapes[j];
                    area = {x: shape.x, y: shape.y, width: shape.x1, height: shape.y1};
                    if (shared) {
                        inverted
                            ? (area.x = series.plotX, area.width = series.plotX + series.plotWidth)
                            : (area.y = series.plotY, area.height = series.plotHeight);
                    }
                    intersectedPoints = inverted ? [
                        [{x: shape.x1, y: shape.y3}, {x: shape.x4, y: shape.y3}],// upper line
                        [{x: shape.x, y: shape.y3}, {x: shape.x3, y: shape.y3}],// lower line
                        [{x: shape.x3, y: shape.y}, {x: shape.x3, y: shape.y2}],// lower whiskerLength
                        [{x: shape.x4, y: shape.y}, {x: shape.x4, y: shape.y2}]// upper whiskerLength
                    ] : [
                        [{x: shape.x3, y: shape.y1}, {x: shape.x3, y: shape.y4}], // upper line
                        [{x: shape.x3, y: shape.y}, {x: shape.x3, y: shape.y3}], // lower line
                        [{x: shape.x, y: shape.y3}, {x: shape.x1, y: shape.y3}],// lower whiskerLength
                        [{x: shape.x, y: shape.y4}, {x: shape.x1, y: shape.y4}] // upper whiskerLength
                    ];
                    flag = shape.isNULL;
                    while (!flag && intersectedPoints.length) if (flag = (Intersection.segment.apply(null,
                        [{x: x, y: y}].concat(intersectedPoints.pop())
                    ))) {
                        shape.current = j;
                        results.push({shape: shape, series: series});
                        break;
                    }
                    if (!flag && Intersection.rect(
                        {x: x, y: y},
                        area
                    )) {
                        shape.current = j;
                        results.push({shape: shape, series: series});
                        break;
                    }
                }
            }
            return results;
        },
        rangeTo: function (bounds) {
            var x = bounds[0][0],
                y = bounds[0][1],
                width = mathAbs(bounds[1][0]),
                height = mathAbs(bounds[1][1]);
            //包含 & 邻近, 相交//findNearestPointBy
            var series,
                shape,
                sl = this.series.length,
                dl,
                i,
                j;
            var results = [],
                shapes;
            var resetShape = function (shapes) {
                for (var j = 0, l = shapes.length; j < l;  j++) {
                    delete shapes[j].selected;
                }
            };

            for (i = 0; i < sl; i++) {
                shapes = (series = this.series[i]).shapes;
                resetShape(shapes);
                for (j = 0, dl = shapes.length; series.selected !== false && j < dl; j++) {
                    shape = shapes[j];
                    if (Intersection.aabb(
                        {x: x, y: y, width: width, height: height},
                        {x: shape.x, y: shape.y, width: mathAbs(shape.x - shape.x1), height: mathAbs(shape.y - shape.y1) }
                    )) {
                        shape.selected = j;
                        results.push({shape: shape, series: series});
                    }
                }
            }
            //console.log(results.length);
        }
    };

    (Chart.graphers = Chart.graphers || {}).boxplot = Chart.Boxplot = Boxplot;

})(typeof window !== "undefined" ? window : this, Dalaba.Chart);