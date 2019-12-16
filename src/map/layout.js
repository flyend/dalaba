(function () {
    function compose (origin, angle, sx, sy, translate) {
        var dx = translate[0], dy = translate[1];
        var ox = origin[0], oy = origin[1];
        var sin = Math.sin(angle), cos = Math.cos(angle);

        /**
         * ------ mat2D ------
            sx, 0,
            0,  sy,
            dx, dy
        **/

        return [
            sx *  cos, sy * sin,
            -sx * sin, sy * cos,
            ox * sx * cos - oy * sx * sin + dx,
            oy * sy * sin + oy * sy * cos + dy
        ];
    }

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
                        scaleRadio = isArray(transform.scale) ? transform.scale : isNumber(transform.scale, true) ? [transform.scale, transform.scale] : [0.75, 0.75],
                        scaleRadioX = Math.max(0, pack("number", scaleRadio[0], 0.75)),
                        scaleRadioY = Math.max(0, pack("number", scaleRadio[1], 0.75));

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

                    (series.shapes || []).forEach(function (d) {
                        if (defined(d.name)) {
                            mapKey[d.name] = d;
                        }
                    });
                    
                    if (defined(geoJson)) {
                        var bounds = [[MAX_VALUE, MAX_VALUE], [-MAX_VALUE, -MAX_VALUE]];
                        var centerX = 0,
                            centerY = 0;
                        var projected = new Projection(projectAt);
                        var matrix;
                        var index = 0;

                        projected.size([plotWidth, plotHeight]).parse(geoJson, function (groups, feature) {
                            var points = [];
                            var count = 0;
                            var cx = 0,
                                cy = 0;
                            var properties = feature.properties || {};

                            var shape = mapKey[properties.name] || mapKey[properties.code];

                            var value, color;

                            if (isObject(shape)) {
                                shape.index = index++;
                                shape.key = properties.name;
                            }
                            else {
                                shape = { value: null };
                            }
                            if (!defined(shape.name))
                                shape.name = properties.name;
                            shape.code = properties.code || properties.id;
                            shape.points = points;
                            var cp = properties.cp;
                            
                            groups.forEach(function (polygon) {
                                var x, y;
                                var length = polygon.length,
                                    j;
                                var point;
                                if (length) {
                                    x = polygon[j = 0][0];
                                    y = polygon[j][1];
                                    bounds = setBounds(bounds, x, y);
                                    
                                    //i && points.push({x: x, y: y, isNext: true});
                                    for (j = 0; j < length; j++) {
                                        point = polygon[j];
                                        x = point[0];
                                        y = point[1];
                                        cx += (x - cx) / ++count;
                                        cy += (y - cy) / count;
                                        points.push({x: x, y: y, isNext: point.moved});
                                        bounds = setBounds(bounds, x, y);
                                    }
                                }
                            });
                            if (defined(cp) && isNumber(cp[0], true) && isNumber(cp[1], true)) {
                                cp = projected.point(projected.projection.call(projected, cp));
                                cx = cp[0];
                                cy = cp[1];
                            }
                            shape.shapeArgs = {
                                x: cx, y: cy,
                                maxX: bounds[1][0],
                                maxY: bounds[1][1]
                            };
                            if (series.selected !== false && isNumber(value = shape.value, true)) {
                                color = lerp && lerp(interpolate(value, minValue, maxValue, 0, 1));
                                shape.color = color || shape.color || series.color;
                            }
                            shape.series = series;
                            shapes.push(shape);
                        });
                        if (!defined(projectAt) || (projectAt && !defined(projectAt.translate))) {
                            if (defined(translate)) {
                                //translate = TRouBLe(translate);
                                //centerX = -bounds[0][0] + plotX;
                                //centerY = -bounds[0][1] + plotY;
                            }
                            centerX = plotX + (plotWidth - (bounds[1][0] - bounds[0][0])) / 2 - bounds[0][0];
                            centerY = plotY + (plotHeight - (bounds[1][1] - bounds[0][1])) / 2 - bounds[0][1];
                        }
                        
                        shapes.forEach(function (shape) {
                            shape.points.forEach(function (point) {
                                matrix = compose([point.x + centerX, point.y + centerY], 0, scaleRadioX, scaleRadioY, translate || [-centerX, centerY]);
                                point.x = matrix[4], point.y = matrix[5];
                            });
                            matrix = compose([shape.shapeArgs.x + centerX, shape.shapeArgs.y + centerY], 0, scaleRadioX, scaleRadioY, translate || [-centerX, centerY]);
                            shape.shapeArgs.x = matrix[4];
                            shape.shapeArgs.y = matrix[5];
                        });
                        series.__transform__ = {
                            center: [centerX, centerY]
                        };
                        series.__projector__ = {
                            projection: function (point) {
                                var p = projected.point(projected.projection.call(projected, point));
                                matrix = compose([p[0] + centerX, p[1] + centerY], 0, scaleRadioX, scaleRadioY, translate || [-centerX, centerY]);
                                return [matrix[4], matrix[5]];
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