(function(global){

    function factoy(Numeric){
        var interpolate = Numeric.interpolate;

        return function(type, options){

            var getKey = function(index, axis){
                var categories;
                if(isArray(categories = axis.categories) && categories.length){
                    return categories[index];
                }
                return index;
            };
            options.panel.forEach(function(pane){
                var series = arrayFilter(pane.series, function(series){
                    return series.type === type;
                });
                series.forEach(function(series){
                    var startAngle, endAngle;
                    var minValue, maxValue, logBase;
                    var polarAxisOptions = series._polarAxis || {};
                    var plotX = polarAxisOptions.center[0],
                        plotY = polarAxisOptions.center[1],
                        plotRadius = series.plotRadius;
                    startAngle = pack("number", polarAxisOptions.startAngle, -90) * PI / 180;
                    endAngle = pack("number", polarAxisOptions.endAngle, 360) * PI / 180;
                    logBase = pack("number", pack("object", polarAxisOptions.logarithmic, {}).base, 10);
                    maxValue = pack("number", polarAxisOptions.maxValue);
                    minValue = pack("number", polarAxisOptions.minValue);
                    //console.log(series.minValue, polarAxisOptions.minValue, series.maxValue, polarAxisOptions.maxValue);

                    var shapes = series.shapes,
                        length = shapes.length,
                        j = 0;
                    for(j = 0; j < length; j++){
                        var shape = series.shapes[j],
                            value = shape.value;
                        var x, y, angle, radius;
                        if(isArray(shape.source)){
                            angle = shape.source[0] * PI2 / 360 + startAngle;
                            radius = interpolate(shape.source[1], minValue, maxValue, 0, plotRadius);
                        }
                        else{
                            angle = j * PI2 / Math.max(1, length) + startAngle;
                            radius = interpolate(value, minValue, maxValue, 0, plotRadius);
                        }
                        if(series.selected === false || value === null){
                            radius = 0;//minValue = maxValue = 0;
                        }
                        
                        x = plotX + Math.cos(angle) * radius;
                        y = plotY + Math.sin(angle) * radius;

                        extend(shape, {
                            x: x,
                            y: y,
                            angle: angle,
                            index: j,
                            key: getKey(j, polarAxisOptions)
                        });
                        shape.series._startAngle = startAngle;
                        shape.series._endAngle = endAngle;
                    }
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