(function(global, Chart){
    var relativeLength = Numeric.percentage;

    var angle2arc = Chart.angle2arc;

    function Pie (canvas, options) {
        this.type = "pie";

        this.series = [];
        this.canvas = canvas;
        this.context = canvas.getContext("2d");

        this.init(options);
    }
    Pie.prototype = {
        constructor: Pie,
        init: function (options) {
            var type = this.type;
            var seriesColors;
            this.options = extend({}, options);
            seriesColors = this.options.colors || [];
            this.series = arrayFilter(this.options.series || [], function (series) {
                var shapes = series.shapes || [],
                    length = shapes.length,
                    j = 0;
                var value, minValue, maxValue, sumValue;
                var filter = series.type === type;
                if(filter){
                    series._diffValues = List.diff(series.shapes, series._shapes || [], function (a, b) {
                        return a && b && a.value === b.value;
                    });
                    minValue = maxValue = sumValue = 0;
                    for(; j < length; j++){
                        var shape = shapes[j];
                        value = Math.max(0, shape.value);
                        
                        !defined(shape.color) && (shape.color = seriesColors[j % seriesColors.length]);
                        if(isNumber(value) && shape.selected !== false){
                            maxValue = Math.max(maxValue, value);
                            minValue = Math.min(minValue, value);
                            sumValue += value;
                        }
                    }
                    series.maxValue = maxValue;
                    series.minValue = minValue;
                    series.sumValue = sumValue;
                }
                return filter;
            });
            var pie = new Pie.Layout(type, this.series, this.options);
            this.shapes = pie.shapes;
            this.layout = pie;
        },
        draw: function () {
            var context = this.context;
            var chart = this;

            this.shapes.forEach(function(series){
                var shapes = series.shapes;
                shapes.forEach(function(shape){
                    chart.drawShape(context, shape, series);
                });
                shapes.forEach(function(shape){
                    chart.drawLabels(context, shape, series);
                });
            });
        },
        reflow: function () {

        },
        redraw: function () {
            this.shapes = this.layout.subgroup();
            this.draw();
        },
        animateTo: function () {
            var shapes = [];
            this.shapes.forEach(function(series){
                var newData = series.shapes,
                    oldData = series._shapes || [];
                var fromAngle = pack("number", series.startAngle * PI / 180, -PI / 2),
                    startAngle,
                    endAngle;
                var animators = [];
                series._diffValues.add(function(newIndex) {
                    var oldShape = oldData[newIndex],
                        newShape = newData[newIndex] || {},
                        mergeShape;
                    
                    mergeShape = {
                        shapeArgs: extend({}, newShape.shapeArgs),
                        textArgs: extend({}, newShape.textArgs),
                        connectorPoints: newShape.connectorPoints,
                        angle: newShape.angle,
                        color: newShape.color,
                        value: newShape.value,
                        _value: newShape._value,
                        percentage: newShape.percentage
                    };
                    //startAngle => endAngle
                    shapes.push([oldShape, function(timer){
                        startAngle = oldShape.shapeArgs.startAngle;
                        endAngle = oldShape.shapeArgs.endAngle;
                        mergeShape.shapeArgs.startAngle = startAngle * (1 - timer) + (endAngle) * timer;
                        //newShape.shapeArgs.endAngle = endAngle * (1 - timer) - (endAngle - startAngle) / 2 * timer;
                        mergeShape.textArgs.x = -9999;
                        mergeShape.textArgs.y = -9999;
                    }]);
                    return mergeShape;
                }).modify(function(newIndex, oldIndex){
                    var newShape = newData[newIndex],
                        oldShape = oldData[oldIndex],
                        mergeShape;
                    //console.log(newShape.textArgs)
                    if(newShape && oldShape && (newShape.shapeArgs && oldShape.shapeArgs)){
                        /*mergeShape = extend({}, newShape, {
                            shapeArgs: {
                                startAngle: oldShape.shapeArgs.startAngle,
                                endAngle: oldShape.shapeArgs.endAngle,
                            },
                            textArgs: {
                                x: oldShape.textArgs.x,
                                y: oldShape.textArgs.y
                            }
                        });*/
                        mergeShape = {
                            shapeArgs: extend({}, newShape.shapeArgs),
                            textArgs: extend({}, newShape.textArgs),
                            connectorPoints: newShape.connectorPoints,
                            color: newShape.color,
                            value: newShape.value,
                            _value: newShape._value,
                            percentage: newShape.percentage
                        };
                        mergeShape.shapeArgs.startAngle = oldShape.shapeArgs.startAngle;
                        mergeShape.shapeArgs.endAngle = oldShape.shapeArgs.endAngle;
                        //console.log( newShape.shapeArgs)
                        shapes.push([newShape, function(timer){
                            var oldStartAngle = oldShape.shapeArgs.startAngle,
                                oldEndAngle = oldShape.shapeArgs.endAngle;
                            var newStartAngle = newShape.shapeArgs.startAngle,
                                newEndAngle = newShape.shapeArgs.endAngle;

                            mergeShape.shapeArgs.startAngle = oldStartAngle + (newStartAngle - oldStartAngle) * timer;
                            mergeShape.shapeArgs.endAngle = oldEndAngle + (newEndAngle - oldEndAngle) * timer;
                            mergeShape.textArgs.x = oldShape.textArgs.x + (newShape.textArgs.x - oldShape.textArgs.x) * timer;
                            mergeShape.textArgs.y = oldShape.textArgs.y + (newShape.textArgs.y - oldShape.textArgs.y) * timer;
                            //console.log( mergeShape.shapeArgs.startAngle,  mergeShape.shapeArgs.endAngle)
                        }]);
                    }
                    return mergeShape;
                }).remove(function(newIndex){//add
                    var newShape = newData[newIndex],
                        mergeShape;
                    mergeShape = {
                        shapeArgs: extend({}, newShape.shapeArgs),
                        textArgs: extend({}, newShape.textArgs),
                        connectorPoints: newShape.connectorPoints,
                        angle: newShape.angle,
                        color: newShape.color,
                        value: newShape.value,
                        _value: newShape._value,
                        percentage: newShape.percentage
                    };

                    shapes.push([newShape, function(timer){
                        startAngle = newShape.shapeArgs.startAngle;
                        endAngle = newShape.shapeArgs.endAngle;
                        if(oldData[newIndex - 1]){
                            mergeShape.shapeArgs.startAngle = endAngle + (startAngle - endAngle) * timer;
                            mergeShape.textArgs.x = newShape.textArgs.x;
                            mergeShape.textArgs.y = newShape.textArgs.y;
                        }
                        else{
                            mergeShape.shapeArgs.startAngle = fromAngle + (startAngle - fromAngle) * timer;
                            mergeShape.shapeArgs.endAngle = fromAngle + (endAngle - fromAngle) * timer;
                        }
                    }]);
                    return mergeShape;
                }).each(function(mergeShape){
                    mergeShape && animators.push(mergeShape);
                });
                series._animators = animators;
                series._shapes = series.shapes;
            });
            return shapes;
        },
        onFrame: function(context){
            var chart = this;
            this.shapes.forEach(function(series){
                var animators = series._animators;
                animators.forEach(function(shape){
                    chart.drawShape(context, shape, series);
                    chart.drawLabels(context, shape, series);
                });
            });
        },
        drawState: function(context, shape, series){
            var shapeArgs = shape.shapeArgs,
                x = shapeArgs.x,
                y = shapeArgs.y,
                radius = shapeArgs.radius,
                startAngle = shapeArgs.startAngle,
                endAngle = shapeArgs.endAngle;
            var color = pack("string", shape.color, series.color, "#000");
            context.save();
            context.beginPath();
            angle2arc(
                x,
                y,
                radius + (radius * 0.05),
                radius,
                startAngle,
                endAngle,
                false//close path
            )(context);
            context.fillStyle = Color.parse(color).alpha(0.2).rgba();
            context.fill();
            context.restore();
        },
        drawShape: function (context, shape, series) {
            var color = pack("string", shape.color, series.color, "#000");
            var borderWidth = pack("number", series.borderWidth, 0),
                borderColor = pack("string", series.borderColor, "#FFFFFF");

            var shapeArgs = shape.shapeArgs,
                x = shapeArgs.x,
                y = shapeArgs.y,
                startAngle = shapeArgs.startAngle,
                endAngle = shapeArgs.endAngle,
                middleAngle;
            
            //color = Color.parse(color);
            if(defined(shape.current)){
                color = Color.parse(color).alpha(0.7);
                color.r = Math.min(0xff, color.r + 20);
                color.g = Math.min(0xff, color.g + 20);
                color.b = Math.min(0xff, color.b + 20);
                color = Color.rgba(color);
            }

            if(shape.sliced === true){
                middleAngle = (startAngle + endAngle) / 2;
                x += Math.cos(middleAngle) * 10;
                y += Math.sin(middleAngle) * 10;
            }
            
            context.save();
            context.fillStyle = color;
            angle2arc(
                x,
                y,
                shapeArgs.radius,
                shapeArgs.innerRadius,
                startAngle,
                endAngle,
                false//close path
            )(context);
            series.nofill !== true && context.fill();            
            (context.lineWidth = pack("number", borderWidth)) > 0 && (context.strokeStyle = borderColor, context.stroke());
            if(defined(shape.state)){
                this.drawState(context, shape, series);
            }
            context.restore();
        },
        drawLabels: function(context, shape, series){
            var shapeLabels = shape.dataLabels || {},
                dataLabels = pack("object", shape.dataLabels, series.dataLabels, {}),
                enabled = shapeLabels.enabled || dataLabels.enabled,
                style = shapeLabels.style || series.dataLabels.style || {},
                fontStyle = {
                    fontStyle: pack("string", style.fontStyle, "normal"),
                    fontSize: pack("string", style.fontSize, "12px"),
                    fontWeight: pack("string", style.fontWeight, "normal"),
                    fontFamily: pack("string", style.fontFamily, "Arial"),
                    lineHeight: pack("string", style.lineHeight, "normal")
                },
                isInside = !!shapeLabels.inside || !!dataLabels.inside || series.shapes.length === 1;

            var textArgs = shape.textArgs,
                connectorPoints = shape.connectorPoints,
                formatText;
            var fillText = function(item, x, y, reversed){
                var value = item._value,
                    formatter = dataLabels.formatter;
                function setVertical(y, h){
                    return {
                        top: y - h,
                        bottom: y + h,
                        middle: y + h / 2
                    };
                }
                function setAlign(x, w){
                    return {
                        left: x - w * !reversed,
                        right: x - w * reversed,
                        center: x - w / 2 * !reversed,
                    };
                }
                if(isFunction(formatter)){
                    value = formatter.call({
                        name: item.name,
                        value: value,
                        total: item.total,
                        percentage: item.percentage,
                        point: item,
                        series: item.series,
                        color: item.color
                    }, item);
                }
                if(defined(value)){
                    var tag = Text.HTML(Text.parseHTML(value), context, fontStyle);
                    var bbox = tag.getBBox();
                    var w = bbox.width,
                        h = bbox.height;
                    if(isInside){
                        x = x - w * reversed;
                        y += h / 2;
                    }
                    else{
                        x = pack("number",
                            setAlign(x, w)[pack("string", dataLabels.align, "right")],
                            x
                        );

                        y = pack("number",
                            setVertical(y, h)[pack("string", dataLabels.verticalAlign, "middle")],
                            y - h / 2
                        );
                    }

                    context.save();
                    context.fillStyle = style.color;
                    context.font = [
                        fontStyle.fontStyle,
                        fontStyle.fontWeight,
                        fontStyle.fontSize,
                        fontStyle.fontFamily
                    ].join(" ");
                    context.translate(x, y);
                    tag.toCanvas(context);
                    context.restore();
                }
                return value;
            };
            if(shape.value !== null && shape.selected !== false && enabled === true){
                if(series.shapes.length === 1 && !shape.shapeArgs.innerRadius && isInside){
                    context.save();
                    context.textAlign = "center";
                    fillText(shape, textArgs.x, textArgs.y, false);
                    context.restore();
                }
                else if(isInside){
                    context.save();
                    context.textAlign = "center";// reversed ? "left" : "right";
                    fillText(shape, textArgs.x, textArgs.y, false);
                    context.restore();
                }
                else{
                    if(shape.visibility !== true){
                        formatText = fillText(shape, textArgs.x, textArgs.y, textArgs["text-anchor"] === "end");
                        if(defined(formatText) && dataLabels.distance > 0 && dataLabels.connectorWidth > 0){
                            context.save();
                            context.strokeStyle = shape.color;
                            context.lineWidth = dataLabels.connectorWidth;
                            context.beginPath();
                            (connectorPoints || []).forEach(function(point, i){
                                context[i ? "lineTo" : "moveTo"](point.x, point.y);
                            });
                            context.stroke();
                            context.restore();
                        }
                    }
                }
            }
        },
        setSliced: function(shapes){
            shapes.forEach(function(item){
                var currentShape = item.shape,
                    series = item.series;
                series.shapes.forEach(function(shape){
                    shape !== currentShape && (delete shape.sliced);
                });
                currentShape.sliced = !currentShape.sliced;
            });
        },
        getShape: function (x, y) {
            var series = this.shapes,
                length = series.length,
                index = -1;
            var context = this.context;
            var shapes, shape, item;
            var ret = [];
            function remove(item){
                delete item.current;
            }
            function reset(shapes){
                shapes.forEach(function(item){
                    remove(item);
                });
            }

            x *= DEVICE_PIXEL_RATIO;
            y *= DEVICE_PIXEL_RATIO;

            for(var i = 0; i < length; i++){
                item = series[i];
                reset(shapes = item.shapes);
                index = -1;
                for(var j = 0; j < shapes.length; j++){
                    shape = shapes[j];
                    this.drawShape(context, shape, {nofill: true});
                    if(context.isPointInPath(x, y)){
                        shape.$value = "" + shape._value;
                        ret.push({shape: shape, series: item});
                        index = j;
                        break;
                    }
                }
                if(index !== -1){
                    shapes[index].current = index;
                }
                else{
                    reset(shapes);//no selected
                }
            }
            //console.log(ret);
            return ret;
        }
    };
    Pie.Layout = function(type, series, options){
        this.type = type;
        this.options = options;
        this.series = series.slice(0);

        this.init();
    };
    Pie.Layout.prototype = {
        init: function(){
            this.shapes = this.subgroup();
        },
        subgroup: function () {
            var options = this.options,
                type = this.type,
                minRadius = 10;
            var layout = this;
            var shapes = [];
            options.panel.forEach(function(pane){
                var series = arrayFilter(pane.series, function(series){
                    return series.type === type;
                });
                series.forEach(function(series){
                    var plotX = pack("number", series.plotX, 0),
                        plotY = pack("number", series.plotY, 0),
                        plotWidth = pack("number", series.plotWidth, 0),
                        plotHeight = pack("number", series.plotHeight, 0);

                    var total = series.sumValue,
                        maxValue = series.maxValue;
                    var dataLabels = series.dataLabels || {},
                        distance = pack("number", dataLabels.distance, 0),
                        fontStyle = pack("object", dataLabels.style, {}),
                        fontSize = pack("number", parseInt(fontStyle.fontSize, 10), 12);
                    var roseType = series.roseType;

                    var startAngle = -90,//default -Math.PI/2
                        endAngle = 360 - 90,//Math.PI*2
                        diffAngle = endAngle - startAngle;
                    if(defined(series.startAngle)){
                        startAngle = series.startAngle;
                        endAngle = startAngle + endAngle + 90;
                    }
                    if(defined(series.endAngle)){
                        endAngle = series.endAngle;
                    }
                    /*data.sort(function(a, b){
                        return b.value - a.value;
                    });*/
                    if(!total){
                        total = 1;//all is 0
                    }
                    var radius = 0,
                        innerSize = 0,
                        center = defined(series.center) ? series.center : [plotWidth / 2, plotHeight / 2];
                    var cx = pack("number", relativeLength(plotWidth, center[0]), center[0], plotWidth / 2),
                        cy = pack("number", relativeLength(plotHeight, center[1]), center[1], plotHeight / 2);
                    cx += plotX;
                    cy += plotY;
                    //var connectorOffset = (dataLabels.distance) * 2 + fontSize;
                    if(dataLabels.enabled === false || dataLabels.inside === true){
                        //connectorOffset = 0;
                    }
                    if(distance > 0 && dataLabels.inside !== true){
                        plotHeight -= distance * 2;
                        plotHeight -= fontSize;
                    }
                    //
                    //plotWidth -= bbox.width * 2 - distance * 2 + dataLabels.connectorPadding * 2;
                    radius = Math.min(plotWidth / 2, plotHeight / 2);
                    if(defined(series.size)){
                        radius = Math.max(pack("number", series.size, relativeLength(radius, series.size), minRadius), minRadius);
                    }
                    
                    if(defined(series.innerSize)){
                        innerSize = pack("number", series.innerSize, relativeLength(radius, series.innerSize));
                        innerSize = Math.min(innerSize, radius - 1);
                    }

                    startAngle = Math.PI / 180 * (startAngle);
                    endAngle = Math.PI / 180 * ((endAngle || startAngle + 360 - 90));
                    diffAngle = endAngle - startAngle;
                    //calculator value

                    var nextvalue = 0;
                    for(var j = 0, jj = series.shapes.length; j < jj; j++){
                        var shape = series.shapes[j],
                            value = shape.value,
                            percentage = value / total,
                            start,
                            end;
                        var radii = radius;
                        var isRoseArea = roseType === "area";
                        
                        if(value === null || shape.selected === false || value < 0){
                            value = percentage = 0;
                        }
                        if(roseType === true || roseType === "radius" || isRoseArea){
                            radii = interpolate(value, 0, maxValue, innerSize, radius);
                            isRoseArea && (percentage = 1 / jj);
                        }
                        
                        angle = (end + start) / 2;
                        //only one data
                        //if(percentage === 1 || percentage === 0){}
                        start = startAngle + nextvalue * diffAngle;
                        nextvalue += percentage;
                        end = startAngle + nextvalue * diffAngle;

                        var angle = (start + end) / 2,
                            half;
                        if(angle > PI * 1.5)
                            angle -= PI2;
                        else if(angle < -PI / 2)
                            angle += PI2;
                        half = angle < -PI / 2 || angle > PI / 2 ? 1 : 0;
                        extend(shape, {
                            shapeArgs: {
                                x: cx,
                                y: cy,
                                radius: radii,
                                innerRadius: innerSize,
                                startAngle: start,
                                endAngle: end
                            },
                            textArgs: {
                                x: NaN,
                                y: NaN
                            },
                            transX: 0,
                            transY: 0,//sliced pull
                            center: center,
                            percentage: percentage * 100,
                            total: total,
                            angle: angle,
                            half: half,
                            radius: radius
                        });

                    }
                    //dataLabels
                    series.shapes.length && layout.labels(series.shapes, series);
                    shapes.push(series);
                });
            });
            return shapes;
        },
        labels: function (shapes, series) {
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
            var dataLabels = series.dataLabels || {},
                style = dataLabels.style || {},
                distance = pack("number", dataLabels.distance, 0),
                lineHeight = pack("number", Math.ceil(parseFloat(style.lineHeight), 10), 12),
                isInside = !!dataLabels.inside || shapes.length === 1,
                skipOverlapLabels = !!dataLabels.skipOverlapLabels,
                manageLabelOverflow = !!dataLabels.manageLabelOverflow,
                isSmartLineSlanted = !!dataLabels.isSmartLineSlanted;

            var positions = [
                shapes[0].shapeArgs.x,//x 
                shapes[0].shapeArgs.y,//y
                shapes[0].radius,//size
                shapes[0].shapeArgs.innerRadius || 0//innerSize
            ];
            var centerX = positions[0],
                centerY = positions[1],//L=x
                radius = positions[2],
                innerRadius = positions[3];
            var labelsRadius = series.labelsRadius || (radius + distance / 2);
            var fontSize = pack("number", parseInt(style.fontSize, 10), 12);
            var labelsMaxInQuadrant = series.labelsMaxInQuadrant || Math.floor(labelsRadius / parseInt(fontSize, 10));

            var connectorPadding = pack("number", dataLabels.connectorPadding, 15),
                connectorPaddings = [connectorPadding, connectorPadding, -connectorPadding, -connectorPadding];

            var fourQuadrants = [[], [], [], []];
            
            //one data and inside
            if(shapes.length === 1 && !innerRadius && isInside){
                //shape.slicedTranslation = [z, C];//canvasLeft, canvasTop
                shapes[0].textArgs = {
                    x: centerX,
                    y: centerY,
                    "text-anchor": "center"
                };
            }
            //inside
            else if (isInside) {
                shapes.forEach(function (shape) {
                    if(shape.value !== null && dataLabels.enabled === true || isObject(shape.dataLabels) && shape.dataLabels.enabled === true){
                        //var halfRadius = innerRadius;// + (radius - innerRadius) / 1.5;//radius center
                        //var quadrants = angleToQuadrant(shape.angle);
                        var isLabelInside = true;//inner
                        var middleAngle = (shape.shapeArgs.startAngle + shape.shapeArgs.endAngle) / 2;
                        var radius = shape.shapeArgs.radius;
                        var dx = Math.cos(middleAngle),
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
                        shape.textArgs = {
                            x: textX,
                            y: textY,
                            "text-anchor": "center"
                        };
                    }
                });
            }
            else {
                var point;
                var maxAngle, midAngle, currentAngle;
                var quadrants;
                
                shapes.forEach(function(shape){
                    if(dataLabels.enabled === true || isObject(shape.dataLabels) && shape.dataLabels.enabled === true){
                        var angle = shape.angle % (Math.PI * 2);
                            0 > angle && (angle = Math.PI * 2 + angle);
                        var ga = 0 <= angle && angle < Math.PI / 2 ? 1 : angle < Math.PI ? 2 : angle < Math.PI * 1.5 ? 3 : 0;
                        fourQuadrants[ga].push({
                            point: shape,
                            angle: angle
                        });
                    }
                });
                for(var k = 4; k--; ){
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
                var maxInQuadrant = Math.max(
                    Math.min(
                        Math.max(fourQuadrants[0].length, fourQuadrants[1].length, fourQuadrants[2].length, fourQuadrants[3].length),
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
                        
                        angle = Math.abs(maxInQuadrant * Math.sin(shape.angle)),
                        angle < maxAngle ? (angle = maxAngle) : angle > labelQuadrant && (angle = labelQuadrant);

                        maxAngle = angle + fontSize;
                        var borderWidth = void 0 === point.clearance ?
                            Math.ceil(pack("number", parseFloat(series.borderWidth, 10), 12)) * 2
                            : Math.ceil(pack("number", parseFloat(series.borderWidth, 10), point.clearance, 0)) * 2;
                        
                        var toY = (angle + quadrants[k].oriY) / 2;
                        centerX = point.shapeArgs.x;
                        centerY = point.shapeArgs.y;
                        radius = point.shapeArgs.radius;
                        angle = centerX + ([1, 1, -1, -1][g]) * labelsRadius * Math.cos(Math.asin(Math.max(-1, Math.min(toY / maxInQuadrant, 1))));
                        toY *= [-1, 1, 1, -1][g];//d
                        toY += centerY;
                        var x = centerX + radius * Math.cos(shape.angle),
                            y = centerY + radius * Math.sin(shape.angle),
                            dx = Math.cos(midAngle = (point.shapeArgs.startAngle + point.shapeArgs.endAngle) / 2),
                            dy = Math.sin(midAngle);

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

                        point.textArgs = {
                            x: toX + (dx >= 0 || -1) * (3 + distance),
                            y: toY,
                            "text-anchor": textAnchor
                        };
                    }
                }
            }
        }
    };

    (Chart.graphers = Chart.graphers || {}).pie = Chart.Pie = Pie;
    
})(typeof window !== "undefined" ? window : this, Dalaba.Chart);