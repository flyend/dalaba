(function(global){

    function factoy(geo, Color){
        var rescale = function(s){
            return isNumber(s) && isFinite(s) ? Math.min(10, Math.max(s, 0)) : 1;
        };
        return function(type, options){
            var defaultGeoPath = {};
            var Path = geo.Path;

            options.panel.forEach(function(pane){
                var series = arrayFilter(pane.series, function(series){
                    return series.type === type;
                });
                series.forEach(function(series){
                    var geoJson = series.mapData,
                        geoPath = defaultGeoPath,
                        shapes = [];
                    var plotX = pack("number", series.plotX, 0),
                        plotY = pack("number", series.plotY, 0),
                        plotWidth = pack("number", series.plotWidth, 0),
                        plotHeight = pack("number", series.plotHeight, 0),
                        chartWidth = pack("number", series.chartWidth, plotWidth, 0),
                        chartHeight = pack("number", series.chartHeight, plotHeight, 0);

                    var colorAxisOptions = series._colorAxis,//[series.colorAxis | 0],
                        domain = [],
                        range = [],
                        lerp;
                    var minValue = colorAxisOptions.minValue,
                        maxValue = colorAxisOptions.maxValue;
                    var maxWidth = 0,
                        maxHeight = 0;
                    var scale = [1, 1],
                        translate = [0, 0];

                    if (defined(colorAxisOptions) && isArray(colorAxisOptions.stops)) {
                        colorAxisOptions.stops.forEach(function(stop){
                            domain.push(stop[0]);
                            range.push(stop[1]);
                        });
                        lerp = Color.lerp(domain, range, Color.interpolate);
                    }
                        
                    if (defined(geoJson)) {
                        scale = [plotWidth / chartWidth * 0.9, plotHeight / chartHeight * 0.9];
                        translate = [plotX, plotY];
                        if(defined(series.scale)){
                            isNumber(series.scale) && (scale = rescale(series.scale), scale = [scale, scale]);
                            if(isArray(series.scale)){
                                scale = [rescale(series.scale[0]), rescale(series.scale[1])];
                            }
                        }
                        if(defined(series.translate)){
                            isNumber(series.translate) && (translate = [plotX + pack("number", series.translate), plotY + pack("number", series.translate)]);
                            if(isArray(series.translate)){
                                translate = [plotX + pack("number", series.translate[0]), plotY + pack("number", series.translate[1])];
                            }
                        }
                        
                        Path.size([chartWidth, chartHeight]).scale(scale).translate(translate).parse(geoJson, function(groups, feature){
                            var points = [];
                            var count = 0;
                            var centerX = 0,
                                centerY = 0;
                            var shape = {
                                name: (feature.properties || {}).name,
                                points: points
                            };

                            groups.forEach(function(polygon, i) {
                                var x, y;
                                var length = polygon.length,
                                    j;
                                var point;
                                i && points.push({x: polygon[j = 0].x, y: polygon[j].y, isNext: true});
                                for(j = 1; j < length; j++){
                                    point = polygon[j];
                                    x = point.x;
                                    y = point.y;
                                    maxWidth = Math.max(x, maxWidth);
                                    maxHeight = Math.max(y, maxHeight);
                                    centerX += (x - centerX) / ++count;
                                    centerY += (y - centerY) / count;
                                    points.push({x: x, y: y});
                                }
                            });
                            shape.shapeArgs = {
                                x: centerX, y: centerY,
                                maxX: maxWidth,
                                maxY: maxHeight
                            };

                            var data = series.mapKey[shape.name],
                                value,
                                color;
                            if(!isObject(data)){
                                data = {value: null};
                            }
                            if(isNumber(value = data.value)){
                                color = lerp && lerp(interpolate(value, minValue, maxValue, 0, 1));
                                shape.color = color || series.color;
                            }
                            extend(shape, data);
                            shapes.push(shape);
                        });
                        shapes.forEach(function(shape) {
                            var cx = (chartWidth - maxWidth) / 2,
                                cy = (chartHeight - maxHeight) / 2 + plotY;
                            shape.points.forEach(function(point){
                                point.x += cx;
                                point.y += cy;
                            });
                            shape.shapeArgs.x += cx;
                            shape.shapeArgs.y += cy;
                        });
                        series._geo = {
                            path: Path,
                            size: geoPath.size,
                            x: geoPath.x,
                            y: geoPath.y,
                            center: geoPath.center
                        };
                    }
                    series.shapes = shapes;
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