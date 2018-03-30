(function(global){

    function factoy(){
        var Layout = {};

        Layout = {
            shapes: function(type, options){
                options.panel.forEach(function(pane){
                    var series = arrayFilter(pane.series, function(series){
                        return series.type === type;
                    });
                    series.forEach(function(series){
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
                        for(j = 0; j < length; j++){
                            shape = shapes[j];
                            color = shape.color;
                            x = plotX + j * tickWidth + center;
                            x1 = x + pointWidth;
                            x2 = x1 - pointWidth / 2;
                            if(isArray(shape.source)){
                                open = shape.source[0], close = shape.source[1];
                                high = shape.source[2], low = shape.source[3];
                            }
                            else if(isObject(shape.source)){
                                open = shape.source.open, close = shape.source.close;
                                high = shape.source.high, low = shape.source.low;
                            }
                            else open = close = high = low = 0;
                            
                            y = interpolate(open, yminValue, ymaxValue, plotHeight, 0) + plotY;//open
                            y1 = interpolate(close, yminValue, ymaxValue, plotHeight, 0) + plotY;//close
                            y2 = interpolate(high, yminValue, ymaxValue, plotHeight, 0) + plotY;//high
                            y3 = interpolate(low, yminValue, ymaxValue, plotHeight, 0) + plotY;//low
                            if(series.selected === false){
                                y = y1 = y2 = y3 = -9999;
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
                                color: Color.isColor(color) ? color : (open > close) ? color[0] : color[1]
                            });
                        }
                    });
                });
            }
        };
        return Layout;
    }
    return {
        deps: function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
}).call(typeof window !== "undefined" ? window : this)