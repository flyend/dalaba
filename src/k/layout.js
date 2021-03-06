(function (global) {

    function factoy () {
        return function (panels, isResized) {
            var allseries = [];
            panels.forEach(function (pane) {
                pane.series.forEach(function (series) {
                    var plotX = pack("number", series.plotX, 0),
                        plotY = pack("number", series.plotY, 0),
                        plotWidth = pack("number", series.plotWidth),
                        plotHeight = pack("number", series.plotHeight);
                    var shapes = series.shapes,
                        shape;
                    var length = shapes.length,
                        j;
                    var tickWidth = plotWidth / length,
                        pointWidth = tickWidth / 2,
                        center = (tickWidth - pointWidth) / 2;
                    var color;


                    var yAxisOptions = series._yAxis || {},
                        yminValue = yAxisOptions.minValue,
                        ymaxValue = yAxisOptions.maxValue;
                   
                    var x, y, x1, y1, x2, y2, y3;
                    var open, close, high, low;//open, close, high, low
                    for (j = 0; j < length; j++) {
                        shape = shapes[j];
                        color = shape.color;
                        x = plotX + j * tickWidth + center;
                        x1 = x + pointWidth;
                        x2 = x1 - pointWidth / 2;
                        if (isObject(shape)) {
                            open = shape.open, close = shape.close;
                            high = shape.high, low = shape.low;
                        }
                        else open = close = high = low = 0;
                        
                        y = interpolate(open, yminValue, ymaxValue, plotHeight, 0) + plotY;//open
                        y1 = interpolate(close, yminValue, ymaxValue, plotHeight, 0) + plotY;//close
                        y2 = interpolate(high, yminValue, ymaxValue, plotHeight, 0) + plotY;//high
                        y3 = interpolate(low, yminValue, ymaxValue, plotHeight, 0) + plotY;//low
                        if (series.selected === false) {
                            y1 = y;
                        }
                        extend(shape, {
                            x: x,
                            y: y,
                            x1: x1,
                            y1: y1,
                            x2: x2,
                            y2: y2,
                            x3: x2,
                            y3: y3,
                            index: j,
                            name: series.name,
                            key: undefined,
                            color: Color.isColor(color) ? color : (open > close) ? color[0] : color[1]
                        });
                    }
                });
                allseries = allseries.concat(pane.series);
            });
            return allseries;
        };
    }
    return {
        deps: function () {
            return factoy.apply(global, [].slice.call(arguments));
        }
    };
}).call(typeof window !== "undefined" ? window : this)