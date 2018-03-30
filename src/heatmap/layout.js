(function(global){

    var xy = function(a, b, c, d){
        return function(x){
            return interpolate(x, a, b, c, d);
        };
    };
    var getData = function(item){
        var value = item;
        if(isObject(item)){
            value = [item.x, item.y, item.value, item.color];
        }
        else if(isNumber(item)){
            value = [item];
        }
        return value;
    };

    function factoy(Numeric){
        var interpolate = Numeric.interpolate;

        return function(type, options) {
            var getXY = function(shape, f0, f1){
                var x, y, data, value;
                data = getData(shape.source);
                x = data[0], y = data[1], value = data[2];
                
                x = f0(x);
                y = f1(y);
                return {x: x, y: y, value: value};
            };
            var addCircle = function(shape, series, f0, f1, f2){
                var radius = series.radius;
                var x = getXY(shape, f0, f1),
                    y = x.y,
                    value = x.value;
                x = x.x;

                extend(shape, {
                    x0: x - radius / 2,
                    y0: y - radius / 2,
                    x1: x + radius,
                    y1: y + radius,
                    width: radius,
                    height: radius,
                    blur: series.blur,
                    alpha: f2(value, series.minValue, series.maxValue)
                });
            };
            var addRect = function(shape, series, f0, f1, f2){
                var tickWidth = series.tickWidth, tickHeight = series.tickHeight;
                var x = getXY(shape, f0, f1),
                    y = x.y,
                    value = x.value;
                x = x.x;
                extend(shape, {
                    x0: x,
                    y0: y,
                    x1: x + tickWidth,
                    y1: y + tickHeight,
                    width: tickWidth,
                    height: tickHeight,
                    color: f2(value, series.minValue, series.maxValue)
                });
            };
            options.panel.forEach(function(pane){
                var series = arrayFilter(pane.series, function(series){
                    return series.type === type;
                });
                var newData = partition(series, function(a, b){
                    return a.radius !== null && b.radius !== null;
                });
                newData.forEach(function(item){
                    item.forEach(function(series){
                        var plotX = pack("number", series.plotX, 0),
                            plotY = pack("number", series.plotY, 0),
                            plotWidth = pack("number", series.plotWidth, 0),
                            plotHeight = pack("number", series.plotHeight, 0);
                        var coordinate = series.coordinate,
                            shapes = series.shapes;
                        var xAxisOptions = series._xAxis || {},
                            yAxisOptions = series._yAxis || {},
                            maxValue = yAxisOptions.maxValue,
                            minValue = yAxisOptions.minValue;
                        var minX = pack("number", xAxisOptions.plot.x[0], minValue, 0),
                            maxX = pack("number", xAxisOptions.plot.x[1], maxValue, 0),
                            minY = pack("number", yAxisOptions.plot.y[0], minValue, 0),
                            maxY = pack("number", yAxisOptions.plot.y[1], maxValue, 0);

                        var colorAxisOptions = series._colorAxis || {},// colorAxis[series.colorAxis | 0],
                            stops = colorAxisOptions.stops || [[0, "#313695"], [1, "#a50026"]],
                            domain = [],
                            range = [],
                            lerp;
                                    
                        if(isArray(stops)){
                            stops.forEach(function(stop){
                                domain.push(stop[0]);
                                range.push(stop[1]);
                            });
                            lerp = Color.lerp(domain, range, Color.interpolate);
                        }
                        var tickWidth = plotWidth / ((maxX - minX) + 1),
                            tickHeight = plotHeight / ((maxY - minY) + 1);
                        
                        shapes.forEach(function(shape, i){
                            if(defined(coordinate) || isObject(shape.source)){
                                addCircle(shape, {
                                    minValue: series.minValue,
                                    maxValue: series.maxValue,
                                    radius: pack("number", shape.radius, series.radius, 0.1),
                                    blur: pack("number", series.blur, 0.05)
                                }, function(x){
                                    return xy(xAxisOptions.minValue, xAxisOptions.maxValue, 0, plotWidth)(x) + plotX;
                                }, function(x){
                                    return xy(yAxisOptions.minValue, yAxisOptions.maxValue, 0, plotHeight)(x) + plotY;
                                }, function(x, min, max){
                                    return Math.max((x - min) / (max - min), 0.01) || 0;
                                });
                            }
                            else{
                                if(isArray(shape.source)){
                                    addRect(shape, {
                                        minValue: yAxisOptions.plot.value[0],
                                        maxValue: yAxisOptions.plot.value[1],
                                        tickWidth: tickWidth,
                                        tickHeight: tickHeight
                                    }, function(x){
                                        return xy(minX, maxX + 1, 0, plotWidth)(x) + plotX;
                                    }, function(x){
                                        return xy(minY - 1, maxY, plotHeight, 0)(x) + plotY;
                                    }, function(x, min, max){
                                        return (lerp && isNumber(x)) ? lerp(interpolate(x, min, max, 0, 1)) : "#000";
                                    });
                                }
                                else{
                                    maxX = pack("number", xAxisOptions.categories && xAxisOptions.categories.length, 6);
                                    maxY = pack("number", yAxisOptions.categories && yAxisOptions.categories.length, 5);
                                    tickWidth = plotWidth / (maxX);
                                    tickHeight = plotHeight / (maxY);

                                    addRect(shape, {
                                        minValue: yAxisOptions.plot.value[0],
                                        maxValue: yAxisOptions.plot.value[1],
                                        tickWidth: tickWidth,
                                        tickHeight: tickHeight
                                    }, function(){
                                        return xy(0, maxX, 0, plotWidth)(i % maxX) + plotX;
                                    }, function(){
                                        return xy(-1, maxY - 1, plotHeight, 0)(i % maxY) + plotY;
                                    }, function(x, min, max){
                                        return (lerp && isNumber(shape.value)) ? lerp(interpolate(shape.value, min, max, 0, 1)) : "#000";
                                    });
                                }
                            }
                        });
                    });
                });
            });
        };
    }
    return {
        deps: function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
}).call(typeof window !== "undefined" ? window : this)