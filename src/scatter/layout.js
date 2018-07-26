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
            var allSeries = [];
            panels.forEach(function (pane) {
                pane.series.forEach(function (series) {
                    var plotX = pack("number", series.plotX, 0),
                        plotY = pack("number", series.plotY, 0),
                        plotWidth = pack("number", series.plotWidth, 0),
                        plotHeight = pack("number", series.plotHeight, 0);
                    var transform = series.transform,
                        translate = TRouBLe(transform.translate),
                        scale = pack("number", transform.scale, 1);
                    var projection = series.projection;
                    var seriesTarget;
                    if ((projection === "geo" || isObject(projection)) && defined(series.seriesTarget)) {
                        seriesTarget = seriesFind(series.seriesTarget, allseries);
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
                        var radius;
                        var key = j;
                        radius = pack("number",
                            //shape.radius,
                            series.radius,
                            isFunction(series.radius) && series.radius.call(shape, shape._source, value, series.minValue, series.maxValue, series),
                            5
                        );

                        if (isFunction(projection)) {
                            //投影数据需要x，y和value
                            x = projection([shape._x, shape._y]);
                            y = setTransform(x[1], translate[1], scale);
                            x = setTransform(x[0], translate[0], scale);
                            if (isObject(shape._source) && defined(shape._source.name))
                                shape.key = shape._source.name;
                            else
                                shape.key = series.name;
                            if (!defined(shape.dataLabel.value) && defined(shape.value))
                                shape.dataLabel.value = shape.value;
                        }
                        else {
                            // is arrays or objects
                            if (isNumber(shape._x, true) && isNumber(shape._y, true)) {
                                key = shape._x;
                                if (xAxisOptions.type === "categories") {
                                    x = plotX + interpolate(shape._x, xAxisOptions.minLength, xAxisOptions.maxLength, 0, plotWidth);
                                    x += plotWidth / mathMax(1, xAxisOptions.maxLength) / 2; // center;
                                }
                                else if (xAxisOptions.type === "linear") {
                                    x = plotX + interpolate(shape._x, xAxisOptions.minValue, xAxisOptions.maxValue, 0, plotWidth);
                                }
                                else {
                                    x = isNumber(shape._x) ? interpolate.apply(null, [shape._x, xAxisOptions.minValue, xAxisOptions.maxValue, 0, plotWidth]) : NaN;
                                    x += plotX;
                                }

                                if (yAxisOptions.type === "categories") {
                                    y = plotY + interpolate(shape._x, yAxisOptions.minLength, yAxisOptions.maxLength, plotHeight, 0);
                                    y -= plotHeight / mathMax(1, yAxisOptions.maxLength) / 2;
                                }
                                else {
                                    y = isNumber(shape._y, true) ? interpolate.apply(null, [parseFloat(shape._y, 10), minValue, maxValue].concat(
                                        reversed === true ? [0, plotHeight] : [plotHeight, 0]
                                    )) : NaN;
                                    y += plotY;
                                }

                                if (inverted === true) {
                                    tickHeight = plotHeight / mathMax(1, yAxisOptions.maxLength),
                                    x = plotX + interpolate(shape._source[1], xAxisOptions.minValue, xAxisOptions.maxValue, 0, plotWidth);
                                    if (yAxisOptions.type === "categories") {
                                        y = plotY + interpolate(shape._source[0], 0, yAxisOptions.maxLength, plotHeight, 0) - tickHeight / 2;
                                    }
                                    else {
                                        y = plotY + (~-length - j) * pointHeight;
                                    }
                                }
                            }
                            else {
                                //is number
                                x = j * tickWidth;
                                x += plotX;
                                y = interpolate.apply(null, [value, minValue, maxValue].concat(
                                    reversed === true ? [0, plotHeight] : [plotHeight, 0]
                                ));
                                y += plotY;
                                shape.dataLabel.value = value;
                            }
                            shape.name = series.name;
                            shape.key = getKey((inverted || yAxisOptions.type === "categories") ? yAxisOptions.categories : xAxisOptions.categories, key);
                        }
                        if (series.selected === false) {
                            radius = 0;
                        }

                        extend(shape, {
                            index: j
                        }, shape._source);
                        shape.x = x;
                        shape.y = y;
                        shape.radius = radius;
                    }
                });
                allSeries = allSeries.concat(pane.series);
            });
            return allSeries;
        };
    }
    return {
        deps: function () {
            return factoy.apply(global, [].slice.call(arguments));
        }
    };
}).call(typeof window !== "undefined" ? window : this)