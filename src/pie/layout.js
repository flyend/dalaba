(function (global) {
    var sortByValue = function (a, b) {
        return a.point.value - b.point.value;
    };
    var sortByAngle = function (a, b) {
        return a.angle - b.angle;
    };
    var angleToQuadrant = function (angle) {
        angle = angle % (PI2);
        0 > angle && (angle = PI2 + angle);
        return 0 <= angle && angle < Math.PI / 2 ? 1 : angle < Math.PI ? 2 : angle < Math.PI * 1.5 ? 3 : 0;
    };

    var addDataLabels = function (shapes, series) {
        var dataLabels = series.dataLabels || {},
            style = dataLabels.style || {},
            distance = pack("number", dataLabels.distance, 0),
            lineHeight = pack("number", mathCeil(parseFloat(style.lineHeight), 10), 12),
            isInside = !!dataLabels.inside || shapes.length === 1,
            skipOverlapLabels = !!dataLabels.skipOverlapLabels,
            manageLabelOverflow = !!dataLabels.manageLabelOverflow,
            isSmartLineSlanted = !!dataLabels.isSmartLineSlanted;

        var shapeArgs = shapes[0];

        var centerX = shapeArgs.x, centerY = shapeArgs.y,//L=x
            radius = shapeArgs.radius, innerRadius = shapeArgs.innerRadius;

        var labelsRadius = series.labelsRadius || (radius + distance / 2);
        var fontSize = pack("number", parseInt(style.fontSize, 10), 12);
        var labelsMaxInQuadrant = series.labelsMaxInQuadrant || Math.floor(labelsRadius / parseInt(fontSize, 10));

        var connectorPadding = pack("number", dataLabels.connectorPadding, 15),
            connectorPaddings = [connectorPadding, connectorPadding, -connectorPadding, -connectorPadding];

        var fourQuadrants = [[], [], [], []];
        
        //one data and inside
        if (shapes.length === 1 && !innerRadius && isInside) {
            shapes[0].textX = centerX;
            shapes[0].textY = centerY;
            shapes[0].textAnchor = "center";
        }
        //inside
        else if (isInside) {
            shapes.forEach(function (shape) {
                if (shape.value !== null && dataLabels.enabled === true || isObject(shape.dataLabels) && shape.dataLabels.enabled === true) {
                    //var halfRadius = innerRadius;// + (radius - innerRadius) / 1.5;//radius center
                    //var quadrants = angleToQuadrant(shape.angle);
                    var isLabelInside = true;//inner
                    var middleAngle = (shape.startAngle + shape.endAngle) / 2;
                    var radius = shape.radius;
                    var dx = mathCos(middleAngle),
                        dy = Math.sin(middleAngle),
                        x1 = (isLabelInside ? (radius + innerRadius) / 2 * dx : radius * dx) + centerX,
                        y1 = (isLabelInside ? (radius + innerRadius) / 2 * dy : radius * dy) + centerY;

                    var textX = x1 + dx * 4,
                        textY = y1 + dy * 4;
                    //var reversed = quadrants >= 2;

                    if (shape.sliced) {
                        //var slicedTranslation = shape.slicedTranslation;
                        //x += ma[0] - positions[0];//canvasLeft;
                        //y += ma[1] - positions[1];
                    }
                    shape.textX = textX;
                    shape.textY = textY;
                    shape.textAnchor = "center";
                }
            });
        }
        else {
            var point;
            var maxAngle, midAngle, currentAngle;
            var quadrants;
            
            shapes.forEach(function (shape) {
                if (dataLabels.enabled === true || isObject(shape.dataLabels) && shape.dataLabels.enabled === true) {
                    var angle = shape.angle % (Math.PI * 2);
                        0 > angle && (angle = Math.PI * 2 + angle);
                    var ga = 0 <= angle && angle < Math.PI / 2 ? 1 : angle < Math.PI ? 2 : angle < Math.PI * 1.5 ? 3 : 0;
                    fourQuadrants[ga].push({
                        point: shape,
                        angle: angle
                    });
                }
            });
            for (var k = 4; k--; ) {
                var v;
                if(skipOverlapLabels && (v = fourQuadrants[k].length - labelsMaxInQuadrant, 0 < v)){
                    fourQuadrants[k].sort(sortByValue);
                    quadrants = fourQuadrants[k].splice(0, v);
                    for(v = 0; v < quadrants.length; v++){
                        point = quadrants[v].point;
                        point.visibility = true;
                    }
                }
                fourQuadrants[k].sort(sortByAngle);
            }
            var maxInQuadrant = mathMax(
                mathMin(
                    mathMax(fourQuadrants[0].length, fourQuadrants[1].length, fourQuadrants[2].length, fourQuadrants[3].length),
                    labelsMaxInQuadrant
                ) * fontSize,
                labelsRadius + fontSize
            );
            var quadrantsTop = fourQuadrants[0].concat(fourQuadrants[1]);
            var quadrantsBottom = fourQuadrants[2].concat(fourQuadrants[3]);
            maxAngle = Number.POSITIVE_INFINITY;
            for(k = quadrantsTop.length - 1; 0 <= k; k--){
                point = quadrantsTop[k].point;
                delete point.clearance;
                delete point.clearanceShift;
                currentAngle = Math.abs(maxInQuadrant * Math.sin(point.angle));
                if(Math.abs(maxAngle - currentAngle) < 2 * lineHeight){
                    point.clearance = 0;
                    quadrantsTop[k + 1].point.clearanceShift = lineHeight / 2;
                }
                maxAngle = currentAngle;
            }
            maxAngle = Number.POSITIVE_INFINITY;
            for(k = 0; k < quadrantsBottom.length; k++){
                point = quadrantsBottom[k].point;
                delete point.clearance;
                delete point.clearanceShift;
                currentAngle = Math.abs(maxInQuadrant * Math.sin(point.angle));
                if(Math.abs(maxAngle - currentAngle) < 2 * lineHeight){
                    point.clearance = 0;
                    quadrantsBottom[k - 1].point.clearanceShift = lineHeight / 2;
                }
                maxAngle = currentAngle;
            }

            fourQuadrants[1].reverse();
            fourQuadrants[3].reverse();

            for(var g = 4; g--; ){
                quadrants = fourQuadrants[g];
                var labelQuadrant = quadrants.length;
                var angle;

                skipOverlapLabels || (fontSize = labelQuadrant > labelsMaxInQuadrant ? maxInQuadrant / labelQuadrant : parseInt(fontSize, 10), fontSize / 2);
                currentAngle = labelQuadrant * fontSize;
                maxAngle = maxInQuadrant;
                for(k = 0; k < labelQuadrant; k += 1, currentAngle -= fontSize){
                    angle = Math.abs(maxInQuadrant * Math.sin(quadrants[k].angle));
                    maxAngle < angle ? (angle = maxAngle) : angle < currentAngle && (angle = currentAngle);
                    maxAngle = (quadrants[k].oriY = angle) - fontSize;
                }
                var textAnchor = ["start", "start", "end", "end"][g];
                labelQuadrant = maxInQuadrant - (labelQuadrant - 1) * fontSize;
                maxAngle = 0;
                for(k = quadrants.length - 1; 0 <= k; --k, labelQuadrant += fontSize){
                    var shape = quadrants[k];
                    point = quadrants[k].point;
                    if(isObject(shape.dataLabels))
                        dataLabels = shape.dataLabels;
                    
                    angle = Math.abs(maxInQuadrant * mathSin(shape.angle)),
                    angle < maxAngle ? (angle = maxAngle) : angle > labelQuadrant && (angle = labelQuadrant);

                    maxAngle = angle + fontSize;
                    var borderWidth = void 0 === point.clearance ?
                        mathCeil(pack("number", parseFloat(series.borderWidth, 10), 12)) * 2
                        : mathCeil(pack("number", parseFloat(series.borderWidth, 10), point.clearance, 0)) * 2;
                    
                    var toY = (angle + quadrants[k].oriY) / 2;
                    centerX = point.x;
                    centerY = point.y;
                    radius = point.radius;
                    angle = centerX + ([1, 1, -1, -1][g]) * labelsRadius * mathCos(Math.asin(mathMax(-1, mathMin(toY / maxInQuadrant, 1))));
                    toY *= [-1, 1, 1, -1][g];//d
                    toY += centerY;
                    var x = centerX + radius * mathCos(shape.angle),
                        y = centerY + radius * mathSin(shape.angle),
                        dx = mathCos(midAngle = (point.startAngle + point.endAngle) / 2),
                        dy = mathSin(midAngle);

                    (2 > g && angle < x || 1 < g && angle > x) && (angle = x);
                    var toX = angle + connectorPaddings[g];
                    //var textX = toX + connectorPaddings[g];

                    if(manageLabelOverflow){
                        var textHeight = lineHeight + borderWidth;
                        void 0 === point.clearance && textHeight > fontSize && (toY += fontSize);
                    }
                    if(point.sliced){
                        var fa = point.transX;
                        var ka = point.transY;
                        toX += fa;
                        angle += fa;
                        x += fa;
                        y += ka;
                        //textX += fa;
                    }
                    var r = connectorPadding + point.radius - radius,
                        x1 = x + dx * r,
                        x2 = toX + (dx >= 0 || -1) * (distance);// + (dx >= 0 || -1) * distance;
                        //y1 = y + dy * r,
                        //y2 = y1;
                    // point.connectorPoints = [
                    //     {x: x, y: y},
                    //     {x: !isSmartLineSlanted ? angle : x, y: toY},
                    //     {x: toX, y: toY}
                    // ];
                    point.connectorPoints = [
                        {x: x, y: y}, {x: x1, y: toY}, {x: x2, y: toY}
                    ];

                    point.textX = toX + (dx >= 0 || -1) * (3 + distance);
                    point.textY = toY;
                    point.textAnchor = textAnchor;
                }
            }
        }
    };

    function factoy () {
        var minRadius = 10;
        return function (panels, isResized) {
            panels.forEach(function (pane) {
                pane.series.forEach(function (series) {
                    var plotX = pack("number", series.plotX, 0),
                        plotY = pack("number", series.plotY, 0),
                        plotWidth = pack("number", series.plotWidth, 0),
                        plotHeight = pack("number", series.plotHeight, 0);

                    var sumValue = series.sumValue,
                        maxValue = series.maxValue;
                    var dataLabels = series.dataLabels || {},
                        distance = pack("number", dataLabels.distance, 0),
                        fontStyle = pack("object", dataLabels.style, {}),
                        fontSize = pack("number", parseInt(fontStyle.fontSize, 10), 12);
                    var roseType = series.roseType;

                    var startAngle = 0,//default -Math.PI/2
                        endAngle = 360,//Math.PI*2
                        diffAngle = endAngle - startAngle;
                    if (isNumber(series.startAngle, true)) {
                        startAngle = series.startAngle;
                        //endAngle = startAngle + endAngle;
                    }
                    if (isNumber(series.endAngle, true)) {
                        endAngle = series.endAngle;
                    }
                    startAngle -= 90;
                    endAngle -= 90;

                    var radius = 0,
                        innerSize = 0,
                        center = defined(series.center) ? series.center : [plotWidth / 2, plotHeight / 2];
                    var cx = pack("number", relativeLength(plotWidth, center[0]), center[0], plotWidth / 2),
                        cy = pack("number", relativeLength(plotHeight, center[1]), center[1], plotHeight / 2);
                    cx += plotX;
                    cy += plotY;
                    //var connectorOffset = (dataLabels.distance) * 2 + fontSize;
                    if (dataLabels.enabled === false || dataLabels.inside === true) {
                        //connectorOffset = 0;
                    }
                    if (distance > 0 && dataLabels.inside !== true) {
                        plotHeight -= distance * 2;
                        plotHeight -= fontSize;
                    }
                    //
                    //plotWidth -= bbox.width * 2 - distance * 2 + dataLabels.connectorPadding * 2;
                    radius = mathMin(plotWidth / 2, plotHeight / 2);
                    if (defined(series.size)) {
                        radius = mathMax(pack("number", series.size, relativeLength(radius, series.size), minRadius), minRadius);
                    }
                    
                    if (defined(series.innerSize)) {
                        innerSize = pack("number", series.innerSize, relativeLength(radius, series.innerSize));
                        innerSize = mathMin(innerSize, radius - 1);
                    }

                    startAngle = PI / 180 * startAngle;
                    endAngle = PI / 180 * endAngle;// ((endAngle || startAngle + 360 - 90));
                    diffAngle = endAngle - startAngle;
                    //calculator value

                    var nextvalue = 0;
                    var shapes = series.shapes,
                        shape;
                    var length = shapes.length,
                        j = -1;
                    sumValue = 0;

                    while (++j < length) if (!(shape = shapes[j]).isNULL && shape.selected !== false) sumValue += shape.value;

                    if (!sumValue) {
                        sumValue = 1;//all is 0
                    }

                    for (j = 0; j < length; j++) {
                        var value = (shape = shapes[j]).value,
                            percentage = value / sumValue,
                            start,
                            end;
                        var radii = radius;
                        var isRoseArea = roseType === "area";

                        if (value === null || shape.selected === false || value < 0) {
                            value = percentage = 0;
                        }
                        if (roseType === true || roseType === "radius" || isRoseArea) {
                            radii = interpolate(value, 0, maxValue, innerSize, radius);
                            isRoseArea && (percentage = 1 / length);
                        }
                        
                        angle = (end + start) / 2;
                        //only one data
                        start = startAngle + nextvalue * diffAngle;
                        nextvalue += percentage;
                        end = startAngle + nextvalue * diffAngle;

                        var angle = (start + end) / 2,
                            half;
                        if (angle > PI * 1.5)
                            angle -= PI2;
                        else if (angle < -PI / 2)
                            angle += PI2;
                        half = angle < -PI / 2 || angle > PI / 2 ? 1 : 0;
                        extend(shape, {
                            x: cx,
                            y: cy,
                            radius: radii,
                            innerRadius: innerSize,
                            startAngle: start,
                            endAngle: end,
                            textX: NaN,
                            textY: NaN,
                            transX: 0,
                            transY: 0,//sliced pull
                            center: center,
                            percentage: percentage * 100,
                            total: sumValue,
                            angle: angle,
                            half: half,
                            radius: radius
                        });
                    }
                    series.shapes.length && addDataLabels(series.shapes, series);
                });
            });
        }
    }
    return {
        deps: function () {
            return factoy.apply(global, [].slice.call(arguments, 0));
        }
    };
}).call(typeof window !== "undefined" ? window : this)