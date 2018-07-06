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
    var getKey = function(categories, index) {
        var key;
        if (isArray(categories) && index < categories.length) {
            if (defined(categories[index]))
                key = categories[index];
        }
        else {
            key = index;
        }
        return key;
    };

    function factoy () {
        return function (panels, isResized, allseries) {
            panels.forEach(function (pane) {
                pane.series.forEach(function (series) {
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
                    var seriesTarget;
                    if (projection === "geo" && defined(series.seriesTarget)) {
                        var seriesTarget = seriesFind(series.seriesTarget, allseries);
                        if (seriesTarget !== null) {
                            projection = null;
                            if (defined(seriesTarget.__projector__)) {
                                projection = function (point) { return seriesTarget.__projector__.projection(point); };
                            }
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
                    var inverted = series.inverted;

                    xAxisOptions = series._xAxis || {};
                    yAxisOptions = series._yAxis || {};
                    logBase = pack("number", pack("object", yAxisOptions.logarithmic, {}).base, 10),
                    maxValue = pack("number", series.max, yAxisOptions.maxValue);
                    minValue = pack("number", series.min, yAxisOptions.minValue);
                    reversed = yAxisOptions.reversed;

                    var shapes = series.shapes,
                        length = shapes.length,
                        j = 0;

                    var tickWidth = plotWidth / mathMax(1, length - 1),
                        tickHeight = plotHeight / mathMax(1, length - 1),
                        pointHeight = tickHeight / 2;

                    for (j = 0; j < length; j++) {
                        var shape = shapes[j],
                            value = shape.value;
                        var x, y;
                        var tx = translateX,
                            ty = translateY;
                        var radius;
                        var key = j;
                        radius = pack("number",
                            //shape.radius,
                            series.radius,
                            isFunction(series.radius) && series.radius.call(shape, shape.source, value, series.minValue, series.maxValue, series),
                            5
                        );
                        if (isFunction(projection)) {
                            x = projection([shape._x, shape._y]);
                            tx += center[0];
                            ty += center[1];                            
                            y = setTransform(x[1], ty, scale);
                            x = setTransform(x[0], tx, scale);
                            
                        }
                        else {
                            if (isArray(shape.source) && shape.source.length > 1) {
                                key = shape.source[0];
                                if (xAxisOptions.type === "categories") {
                                    x = plotX + interpolate(shape.source[0], xAxisOptions.minLength, xAxisOptions.maxLength, 0, plotWidth);
                                    x += plotWidth / mathMax(1, xAxisOptions.maxLength) / 2; // center;
                                }
                                else if (xAxisOptions.type === "linear") {
                                    x = plotX + interpolate(shape.source[0], xAxisOptions.minValue, xAxisOptions.maxValue, 0, plotWidth);
                                }
                                else {
                                    x = isNumber(shape.source[0]) ? interpolate.apply(null, [shape.source[0], xAxisOptions.minValue, xAxisOptions.maxValue, 0, plotWidth]) : NaN;
                                    x += plotX;
                                }

                                if (yAxisOptions.type === "categories") {
                                    y = plotY + interpolate(shape.source[0], yAxisOptions.minLength, yAxisOptions.maxLength, plotHeight, 0);
                                    y -= plotHeight / mathMax(1, yAxisOptions.maxLength) / 2;
                                }
                                else {
                                    y = isNumber(shape.source[1], true) ? interpolate.apply(null, [parseFloat(shape.source[1], 10), minValue, maxValue].concat(
                                        reversed === true ? [0, plotHeight] : [plotHeight, 0]
                                    )) : NaN;
                                    y += plotY;
                                }

                                if (inverted === true) {
                                    tickHeight = plotHeight / mathMax(1, yAxisOptions.maxLength),
                                    center = tickHeight / 2;
                                    x = plotX + interpolate(shape.source[1], xAxisOptions.minValue, xAxisOptions.maxValue, 0, plotWidth);
                                    if (yAxisOptions.type === "categories") {
                                        y = plotY + interpolate(shape.source[0], 0, yAxisOptions.maxLength, plotHeight, 0) - center;
                                    }
                                    else {
                                        y = plotY + (~-length - j) * pointHeight;
                                    }
                                }
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
                                x = j * tickWidth;
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

                        extend(shape, {
                            index: j
                        }, shape.source);
                        shape.x = x;
                        shape.y = y;
                        shape.radius = radius;
                        shape.key = getKey((inverted || yAxisOptions.type === "categories") ? yAxisOptions.categories : xAxisOptions.categories, key);
                    }
                });
            });
        };
    }
    return {
        deps: function () {
            return factoy.apply(global, [].slice.call(arguments));
        }
    };
}).call(typeof window !== "undefined" ? window : this)