(function (global) {
    var mathMin = Math.min;
    var mathMax = Math.max;
    var MAX_VALUE = Number.MAX_VALUE;

    var rescale = function (s) {
        return isNumber(s) && isFinite(s) ? Math.min(10, Math.max(s, 0)) : 1;
    };

    var setTransform = function (a, b, k) {
        return a * k + b;
    };

    var setBounds = function (bounds, x, y) {
        bounds[0][0] = mathMin(bounds[0][0], x);
        bounds[1][0] = mathMax(bounds[1][0], x);
        bounds[0][1] = mathMin(bounds[0][1], y);
        bounds[1][1] = mathMax(bounds[1][1], y);
        return bounds;
    };

    function factoy (geo, Color) {
        return function (type, options) {
            var defaultGeoPath = {};
            var Path = geo.Path;

            options.panel.forEach(function (pane) {
                var series = arrayFilter(pane.series, function (series) {
                    return series.type === type;
                });
                series.forEach(function (series) {
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
                    var scale = [1, 1],
                        translate = [0, 0];
                    var transform = series.transform,
                        scaleRadio = pack("number", transform.scale, 0.75),
                        translateX = transform.translate[0],
                        translateY = transform.translate[1];

                    if (defined(colorAxisOptions) && isArray(colorAxisOptions.stops)) {
                        colorAxisOptions.stops.forEach(function (stop) {
                            domain.push(stop[0]);
                            range.push(stop[1]);
                        });
                        lerp = Color.lerp(domain, range, Color.interpolate);
                    }
                        
                    if (defined(geoJson)) {
                        scale = [plotWidth / chartWidth * 0.9, plotHeight / chartHeight * 0.9];
                        translate = [plotX, plotY];
                        if (defined(series.scale)) {
                            isNumber(series.scale) && (scale = rescale(series.scale), scale = [scale, scale]);
                            if (isArray(series.scale)) {
                                scale = [rescale(series.scale[0]), rescale(series.scale[1])];
                            }
                        }
                        if (defined(series.translate)) {
                            translate = TRouBLe(series.translate).map(function (d, i) {
                                return d * [plotX, plotY][i];
                            });
                        }
                        var center = geoJson.cp;
                        //var projection = series.projection.call(series, center, scale, translate);
                        var bounds = [[MAX_VALUE, MAX_VALUE], [-MAX_VALUE, -MAX_VALUE]];
                        var centerX = 0,
                            centerY = 0;
                        //Path.size([chartWidth, chartHeight]).scale(scale).translate(translate).projection(projection).parse(geoJson, function (groups, feature) {
                        var projected = new Projection({
                            //scale: 450,
                            //center: [137, 38]
                        });
                        projected.size([plotWidth, plotHeight]).parse(geoJson, function (groups, feature) {
                            var points = [];
                            var count = 0;
                            var cx = 0,
                                cy = 0;
                            var properties = feature.properties || {};
                            var shape = {
                                key: properties.name,
                                name: properties.name,
                                code: properties.code || properties.id,
                                points: points
                            };
                            var cp = properties.cp;

                            groups.forEach(function (polygon, i) {
                                var x, y;
                                var length = polygon.length,
                                    j;
                                var point;
                                x = setTransform(polygon[j = 0][0], translateX, scaleRadio);
                                y = setTransform(polygon[j][1], translateY, scaleRadio);
                                bounds = setBounds(bounds, x, y);
                                i && points.push({x: x, y: y, isNext: true});
                                for (j = 1; j < length; j++) {
                                    point = polygon[j];
                                    x = setTransform(point[0], translateX, scaleRadio);
                                    y = setTransform(point[1], translateY, scaleRadio);
                                    cx += (x - cx) / ++count;
                                    cy += (y - cy) / count;
                                    points.push({x: x, y: y});
                                    bounds = setBounds(bounds, x, y);
                                }
                            });
                            if (defined(cp) && isNumber(cp[0], true) && isNumber(cp[1], true)) {
                                cp = projected.projection(cp);
                                cx = setTransform(cp[0], translateX, scaleRadio);
                                cy = setTransform(cp[1], translateY, scaleRadio);
                            }
                            shape.shapeArgs = {
                                x: cx, y: cy,
                                maxX: bounds[1][0],
                                maxY: bounds[1][1]
                            };

                            var data = series.mapKey[shape.name] || series.mapKey[shape.code],
                                value,
                                color;
                            if (!isObject(data)) {
                                data = {value: null};
                            }
                            if (!defined(data.color) && isNumber(value = data.value)) {
                                color = lerp && lerp(interpolate(value, minValue, maxValue, 0, 1));
                                shape.color = color || shape.color || series.color;
                            }
                            extend(shape, data);
                            shape.name = properties.name;
                            shapes.push(shape);
                        });
                        centerX = plotX + (plotWidth - (bounds[1][0] - bounds[0][0])) / 2 - bounds[0][0];
                        centerY = plotY + (plotHeight - (bounds[1][1] - bounds[0][1])) / 2 - bounds[0][1];

                        shapes.forEach(function (shape) {
                            shape.points.forEach(function (point) {
                                point.x += centerX;
                                point.y += centerY;
                            });
                            shape.shapeArgs.x += centerX;
                            shape.shapeArgs.y += centerY;
                        });
                        series.__transform__ = {
                            center: [centerX, centerY]
                        };
                        series.__projector__ = {
                            projection: function (point) { return projected.projection.call(projected, point); },
                            //scale: projection.scale(),
                            //translate: projection.translate(),
                            //center: projection.center()
                        };
                    }
                    series.shapes = shapes;
                });
            });
        };
    }
    return {
        deps: function () {
            return factoy.apply(global, [].slice.call(arguments, 0));
        }
    };
}).call(typeof window !== "undefined" ? window : this)