(function (global) {

    var setTransform = function (a, b, k) {
        return a * k + b;
    };

    var seriesFind = function (key, series) {
        var n = series.length,
            i = -1;
        if (!defined(key)) 
            return null;

        while (++i < n && (key !== series[i].id));

        return i < n ? series[i] : null;
    };

    function factoy (Numeric) {
        var interpolate = Numeric.interpolate;

        return function (type, options) {
            options.panel.forEach(function (pane) {
                var series = arrayFilter(pane.series, function (series) {
                    return series.type === type;
                });

                series.forEach(function (series) {
                    var plotX = pack("number", series.plotX, 0),
                        plotY = pack("number", series.plotY, 0),
                        plotWidth = pack("number", series.plotWidth, 0),
                        plotHeight = pack("number", series.plotHeight, 0);
                    var transform = series.transform,
                        translateX = transform.translate[0],
                        translateY = transform.translate[1],
                        scale = pack("number", transform.scale, 0.75);
                    var projection = series.projection;
                    var center = [0, 0];
                    var seriesTarget = seriesFind(series.seriesTarget, pane.series);
                    if (projection === "geo" && seriesTarget !== null) {
                        projection = null;
                        if (defined(seriesTarget.__projector__)) {
                            projection = function (point) { return seriesTarget.__projector__.projection(point); };
                        }
                    }
                    else if (isFunction(projection)) {
                        projection = projection.call(series);
                    }
                    if (defined(seriesTarget && seriesTarget.__transform__)) {
                        center = seriesTarget.__transform__.center;
                    }

                    var xAxisOptions, yAxisOptions;
                    var minValue, maxValue, logBase;
                    var reversed;

                    var pointWidth;

                    var shapes = series.shapes,
                        length = shapes.length;
                    var j = 0;
                    for (j = 0; j < length; j++) {
                        var shape = series.shapes[j],
                            value = shape.value;
                        var x, y;
                        var tx = translateX,
                            ty = translateY;
                        var radius;

                        xAxisOptions = series._xAxis || {};
                        yAxisOptions = series._yAxis || {};
                        logBase = pack("number", pack("object", yAxisOptions.logarithmic, {}).base, 10),
                        maxValue = pack("number", series.max, yAxisOptions.maxValue);
                        minValue = pack("number", series.min, yAxisOptions.minValue);
                        reversed = yAxisOptions.reversed;

                        pointWidth = plotWidth / (Math.max(1, length - 1));
                        if (projection) {
                            x = projection([shape._x, shape._y]);
                            tx += center[0];
                            ty += center[1];                            
                            y = setTransform(x[1], ty, scale);
                            x = setTransform(x[0], tx, scale);
                            radius = pack("number",
                                shape.radius,
                                series.radius,
                                isFunction(series.radius) && series.radius.call(shape, shape.source, value, series.minValue, series.maxValue, series),
                                5
                            );
                        }
                        else {
                            radius = pack("number",
                                shape.radius,
                                series.radius,
                                isFunction(series.radius) && series.radius.call(shape, shape.source, value, series.minValue, series.maxValue),
                                5
                            );
                            if (isArray(shape.source) && shape.source.length > 1) {
                                x = isNumber(shape.source[0]) ? interpolate.apply(null, [shape.source[0], xAxisOptions.minValue, xAxisOptions.maxValue, 0, plotWidth]) : NaN;
                                x += plotX;
                                y = isNumber(shape.source[1]) ? interpolate.apply(null, [shape.source[1], minValue, maxValue].concat(
                                    reversed === true ? [0, plotHeight] : [plotHeight, 0]
                                )) : NaN;
                                y += plotY;
                            }
                            else if (isNumber(shape._x) && isNumber(shape._y)) {
                                x = interpolate.apply(null, [shape._x, xAxisOptions.minValue, xAxisOptions.maxValue, 0, plotWidth]);
                                x += plotX;
                                y = interpolate.apply(null, [shape._y, minValue, maxValue].concat(
                                    reversed === true ? [0, plotHeight] : [plotHeight, 0]
                                ));
                                y += plotY;
                            }
                            else {
                                x = j * pointWidth;
                                x += plotX;
                                y = interpolate.apply(null, [value, minValue, maxValue].concat(
                                    reversed === true ? [0, plotHeight] : [plotHeight, 0]
                                ));
                                y += plotY;
                            }
                        }
                        if (series.selected === false) {
                            radius = 0;
                        }
                        shape.radius = radius;
                        shape.key = shape.name;
                        extend(shape, {
                            cx: x,
                            cy: y,
                            radius: radius
                        }, shape.source);
                    }
                });
            });
        };
    }
    return {
        deps: function() {
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
}).call(typeof window !== "undefined" ? window : this)