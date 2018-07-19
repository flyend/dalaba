(function () {

    var setTransform = Numeric.lerp;

    var setBounds = function (bounds, x, y) {
        bounds[0][0] = mathMin(bounds[0][0], x);
        bounds[1][0] = mathMax(bounds[1][0], x);
        bounds[0][1] = mathMin(bounds[0][1], y);
        bounds[1][1] = mathMax(bounds[1][1], y);
        return bounds;
    };

    function factoy (geo, Color) {
        return function (panels, isResized) {
            var allseries = [];
            panels.forEach(function (pane) {
                pane.series.forEach(function (series) {
                    var geoJson = series.mapData,
                        shapes = [];
                    var plotX = pack("number", series.plotX, 0),
                        plotY = pack("number", series.plotY, 0),
                        plotWidth = pack("number", series.plotWidth, 0),
                        plotHeight = pack("number", series.plotHeight, 0);

                    var colorAxisOptions = series._colorAxis,//[series.colorAxis | 0],
                        domain = [],
                        range = [],
                        lerp;
                    var minValue = colorAxisOptions.minValue,
                        maxValue = colorAxisOptions.maxValue;
                    var transform = series.transform,
                        translate = transform.translate,
                        scaleRadio = Math.max(0, pack("number", transform.scale, 0.75));

                    var projection = series.projection,//series.getOptions()
                        projectAt;

                    var mapKey = {};

                    if (isObject(projection)) {
                        projectAt = extend({}, projection);//geoJson.cp;
                    }
                    else if (isFunction(projection)) {
                        projectAt = projection.call(series);//series.options.mapping
                    }

                    if (defined(colorAxisOptions) && isArray(colorAxisOptions.stops)) {
                        colorAxisOptions.stops.forEach(function (stop) {
                            domain.push(stop[0]);
                            range.push(stop[1]);
                        });
                        lerp = Color.lerp(domain, range, Color.interpolate);
                    }

                    (series.data || []).forEach(function (d) {
                        if (defined(d.name)) {
                            mapKey[d.name] = d;
                        }
                    });
                    
                    if (defined(geoJson)) {
                        var bounds = [[MAX_VALUE, MAX_VALUE], [-MAX_VALUE, -MAX_VALUE]];
                        var centerX = 0,
                            centerY = 0;
                        var projected = new Projection(projectAt);
                        var index = 0;
                        projected.size([plotWidth, plotHeight]).parse(geoJson, function (groups, feature) {
                            var points = [];
                            var count = 0;
                            var cx = 0,
                                cy = 0;
                            var properties = feature.properties || {};
                            var shape = {
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
                                x = setTransform(0, polygon[j = 0][0], scaleRadio);
                                y = setTransform(0, polygon[j][1], scaleRadio);
                                bounds = setBounds(bounds, x, y);
                                i && points.push({x: x, y: y, isNext: true});
                                for (j = 1; j < length; j++) {
                                    point = polygon[j];
                                    x = setTransform(0, point[0], scaleRadio);
                                    y = setTransform(0, point[1], scaleRadio);
                                    cx += (x - cx) / ++count;
                                    cy += (y - cy) / count;
                                    points.push({x: x, y: y});
                                    bounds = setBounds(bounds, x, y);
                                }
                                if (!i && feature.geometry.type === "Polygon") {
                                    points.push({x: points[0].x, y: points[0].y});
                                }
                            });
                            if (defined(cp) && isNumber(cp[0], true) && isNumber(cp[1], true)) {
                                cp = projected.point(projected.projection.call(projected, cp));
                                cx = setTransform(0, cp[0], scaleRadio);
                                cy = setTransform(0, cp[1], scaleRadio);
                            }
                            shape.shapeArgs = {
                                x: cx, y: cy,
                                maxX: bounds[1][0],
                                maxY: bounds[1][1]
                            };

                            var data = series.selected !== false && (mapKey[shape.name] || mapKey[shape.code]),
                                value,
                                color;
                            if (defined(data)) {
                                shape.index = index++;
                            }
                            if (!isObject(data)) {
                                data = {value: null};
                            }
                            if (!defined(data.color) && isNumber(value = data.value)) {
                                color = lerp && lerp(interpolate(value, minValue, maxValue, 0, 1));
                                shape.color = color || shape.color || series.color;
                            }
                            extend(shape, data);
                            shape.name = properties.name;
                            if (data.value !== null) {
                                shape.key = properties.name;
                            }
                            shape.series = series;
                            shapes.push(shape);
                        });
                        if (!defined(projectAt) || (projectAt && !defined(projectAt.translate))) {
                            if (defined(translate)) {
                                translate = TRouBLe(translate);
                                centerX = -bounds[0][0] + translate[0] + plotX;
                                centerY = -bounds[0][1] + translate[1] + plotY;
                            }
                            else {
                                centerX = plotX + (plotWidth - (bounds[1][0] - bounds[0][0])) / 2 - bounds[0][0];
                                centerY = plotY + (plotHeight - (bounds[1][1] - bounds[0][1])) / 2 - bounds[0][1];
                            }
                        }
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
                            projection: function (point) {
                                var p = projected.point(projected.projection.call(projected, point));
                                return [
                                    setTransform(0, p[0], scaleRadio) + centerX,
                                    setTransform(0, p[1], scaleRadio) + centerY
                                ];
                            }
                        };
                        series.getProjection = series.__projector__.projection;
                    }
                    series.shapes = shapes;
                });
                allseries = allseries.concat(pane.series);
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