(function (global) {
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
        return function (panels, isResized) {
            var allseries = [];
            panels.forEach(function (pane) {
                pane.series.forEach(function (series, i) {
                    var plotX = pack("number", series.plotX, 0),
                        plotY = pack("number", series.plotY, 0),
                        plotWidth = pack("number", series.plotWidth, 0),
                        plotHeight = pack("number", series.plotHeight, 0);
                    /*var transform = series.transform,
                        translate = transform.translate,
                        scale = pack("number", transform.scale, 0.75);*/

                    var yAxisOptions = series._yAxis || {},
                        xAxisOptions = series._xAxis || {},
                        yminValue = yAxisOptions.minValue,
                        ymaxValue = yAxisOptions.maxValue;
                    var inverted = series.inverted === true;

                    var pointWidth;

                    var shapes = series.shapes,
                        length = shapes.length,
                        groupLength = pane.series.length,
                        j = 0;
                    var tickWidth = plotWidth / length,
                        tickHeight = plotHeight / length,
                        pointWidth = tickWidth / (groupLength << 1),
                        pointHeight = tickHeight / (groupLength << 1),
                        center;
                    var nodePadding = (inverted ? pointWidth : pointHeight) * 0.2;

                    pointWidth = mathMin(pointWidth, pack("number", series.maxPointWidth, pointWidth));
                    pointHeight = mathMin(pointHeight, pack("number", series.maxPointHeight, series.maxPointWidth, pointHeight));

                    var x, y, x1, y1, x2, y2, x3, y3, x4, y4;
                    var q1, q3, median, lower, upper;

                    for (; j < length; j++) {
                        var shape = series.shapes[j];
                        if (!shape.isNULL) {
                            lower = shape.low;
                            q1 = shape.q1;
                            median = shape.median;
                            q3 = shape.q3;
                            upper = shape.high;
                        }
                        else q1 = q3 = median = lower = upper = 0;

                        if (inverted) {
                            yminValue = xAxisOptions.minValue;
                            ymaxValue = xAxisOptions.maxValue;
                            center = (tickHeight - (pointHeight * groupLength + nodePadding * ~-groupLength)) / 2;
                            y = plotY + (~-length - j) * tickHeight + i * (pointHeight + nodePadding) + center;
                            y1 = y2 = y + pointHeight;
                            y3 = y4 = y1 - pointHeight / 2;

                            x = interpolate(q1, yminValue, ymaxValue, 0, plotWidth) + plotX;//q1
                            x1 = interpolate(q3, yminValue, ymaxValue, 0, plotWidth) + plotX;//q3
                            x2 = interpolate(median, yminValue, ymaxValue, 0, plotWidth) + plotX;//median
                            x3 = interpolate(lower, yminValue, ymaxValue, 0, plotWidth) + plotX;//low
                            x4 = interpolate(upper, yminValue, ymaxValue, 0, plotWidth) + plotX;// upper
                            if (series.selected === false) {
                                y1 = y2 = y3 = y4 = y;
                            }
                        }
                        else {
                            center = (tickWidth - (pointWidth * groupLength + nodePadding * ~-groupLength)) / 2;
                            x = plotX + j * tickWidth + i * (pointWidth + nodePadding) + center;
                            x1 = x2 = x + pointWidth;
                            x3 = x4 = x1 - pointWidth / 2;
                            
                            y = interpolate(q1, yminValue, ymaxValue, plotHeight, 0) + plotY;//q1
                            y1 = interpolate(q3, yminValue, ymaxValue, plotHeight, 0) + plotY;//q3
                            y2 = interpolate(median, yminValue, ymaxValue, plotHeight, 0) + plotY;//median
                            y3 = interpolate(lower, yminValue, ymaxValue, plotHeight, 0) + plotY;//low
                            y4 = interpolate(upper, yminValue, ymaxValue, plotHeight, 0) + plotY;// upper
                            if (series.selected === false) {
                                x1 = x2 = x3 = x4 = x;
                            }
                        }

                        extend(shape, {
                            x: x, y: y,
                            x1: x1, y1: y1,// (InterQuartile Range, IQR) Box height
                            x2: x2, y2: y2,// median
                            x3: x3, y3: y3,// lower
                            x4: x4, y4: y4,// upper
                            index: j,
                            name: series.name,
                            key: getKey(inverted ? yAxisOptions.categories : xAxisOptions.categories, j)
                        });
                    }
                    allseries = allseries.concat(series);
                });
            });
            return allseries;
        };
    }

    return {
        deps: function () {
            return factoy.apply(global, [].slice.call(arguments, 0));
        }
    };
}).call(typeof window !== "undefined" ? window : this)