(function(global){

    function factoy (Numeric) {
        var interpolate = Numeric.interpolate;

        return function (panels, isResized) {
            var allseries = [];
            var getKey = function (index, axis) {
                var categories;
                if (isArray(categories = axis.categories) && categories.length) {
                    return categories[index];
                }
                return index;
            };
            panels.forEach(function (pane) {
                pane.series.forEach(function (series) {
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

                    var shapes = series.shapes,
                        length = shapes.length,
                        j = 0;
                    for (j = 0; j < length; j++) {
                        var shape = series.shapes[j],
                            value = shape.value;
                        var x, y, angle, radius;
                        if (isArray(shape._source)) {
                            angle = shape._x * PI2 / 360 + startAngle;
                            radius = interpolate(shape._y, minValue, maxValue, 0, plotRadius);
                        }
                        else {
                            angle = j * PI2 / Math.max(1, length) + startAngle;
                            radius = interpolate(value, minValue, maxValue, 0, plotRadius);
                        }
                        if (series.selected === false || shape.isNULL) {
                            radius = 0;
                        }
                        
                        x = plotX + mathCos(angle) * radius;
                        y = plotY + mathSin(angle) * radius;

                        extend(shape, {
                            x: x,
                            y: y,
                            angle: angle,
                            index: j,
                            key: getKey(j, polarAxisOptions)
                        });
                        shape.series._startAngle = startAngle;
                        shape.series._endAngle = endAngle;
                        if (!defined(shape.name)) {
                            shape.name = series.name;
                        }
                    }
                });
                allseries = allseries.concat(pane.series);
            });
            return allseries;
        };
    }
    return {
        deps: function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
}).call(typeof window !== "undefined" ? window : this)