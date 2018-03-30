(function(global, Chart){

    var SQRT3 = Math.sqrt(3);

    var lineSlope = function(p1, p2){
        var slope = p2.x - p1.x ? (p2.y - p1.y) / (p2.x - p1.x) : 0;//斜率
        return {
            slope: slope,
            b: p1.y - slope * p1.x
        };
    };

    /**
     * Class Funnel
    */

    function Funnel(canvas, options){
        this.type = "funnel";
        this.canvas = canvas;
        this.context = canvas.getContext("2d");

        this.series = [];
        this.shapes = [];
        
        this.init(options);
    }
    Funnel.prototype = {
        constructor: Funnel,
        init: function(options){
            var type = this.type;
            var seriesColors;
            this.options = extend({}, options);
            seriesColors = this.options.colors || [];
            this.series = arrayFilter(this.options.series || [], function(series){
                var shapes = series.shapes || [],
                    length = shapes.length,
                    j = 0;
                var minValue, maxValue, sumValue;
                var filter = series.type === type;
                if(filter){
                    series._diffValues = List.diff(series.shapes, series._shapes || [], function(a, b){
                        return a && b && a.value === b.value;
                    });
                    minValue = maxValue = sumValue = 0;
                    for(; j < length; j++){
                        var shape = shapes[j],
                            value;
                        !isNumber(value = shape.value) && (shape.value = null);
                        !defined(shape.name) && (shape.name = shape.value);
                        !defined(shape.color) && (shape.color = seriesColors[j % seriesColors.length]);
                        if(shape.value !== null && shape.selected !== false){
                            maxValue = Math.max(maxValue, value = Math.max(0, value));
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
            var funnel = new Funnel.Layout(type, this.series, this.options);
            this.shapes = funnel.shapes;
            this.layout = funnel;
        },
        draw: function(){
            var context = this.context,
                chart = this;
            this.shapes.forEach(function(series){
                series.shapes.forEach(function(shape){
                    chart.drawShape(context, shape, series);
                });
                series.shapes.forEach(function(shape){
                    chart.drawLabels(context, shape, series);
                });
            });
        },
        redraw: function(){
            this.layout.subgroup();
            this.draw();
        },
        animateTo: function(){
            var shapes = [];
            this.shapes.forEach(function(series){
                var newData = series.shapes,
                    oldData = series._shapes || [];
                var animators = [];
                series._diffValues.remove(function(newIndex){
                    var newShape = newData[newIndex],
                        mergeShape;
                    var points;
                    var startY, endY, nextY;
                    var temp = newShape.series;
                    delete newShape.series;
                    mergeShape = extend({}, newShape);
                    newShape.series = temp;
                    shapes.push([newShape, function(timer){
                        var fromY = newShape.points[0].y;
                        points = newShape.points.map(function(point){
                            return extend({}, point);
                        });
                        startY = points[0].y;
                        endY = points[points.length - 2].y;
                        nextY = points[points.length - 3].y;
                        if(points.length === 7){
                            points[0].y = points[1].y = points[6].y = fromY + (startY - fromY) * timer;
                            points[2].y = points[5].y = fromY + (endY - fromY) * timer;
                            points[3].y = points[4].y = fromY + (nextY - fromY) * timer;
                        }
                        else{
                            //points[0].y = points[1].y = points[4].y = fromY + (startY - fromY) * timer;
                            points[2].y = points[3].y = fromY + (endY - fromY) * timer;
                        }
                        mergeShape.points = points;
                    }]);
                    return mergeShape;
                }).add(function(newIndex){
                    var newShape = oldData[newIndex],
                        mergeShape;
                    var temp = newShape.series;
                    delete newShape.series;
                    mergeShape = extend({}, newShape);
                    newShape.series = temp;
                    return mergeShape;
                }).modify(function(newIndex, oldIndex){
                     var newShape = newData[newIndex],
                        oldShape = oldData[oldIndex],
                        mergeShape;
                    var points;
                    var startY, endY, nextY;
                    var temp;
                    
                    if(oldShape && newShape && newShape.selected !== false && newShape.value !== null){
                        temp = newShape.series;
                        delete newShape.series;
                        mergeShape = extend({}, newShape);
                        newShape.series = temp;
                        shapes.push([newShape, function(timer){
                            points = newShape.points.map(function(point){
                                return extend({}, point);
                            });
                            var opoints = oldShape.points.map(function(point){
                                return extend({}, point);
                            });
                            startY = points[0].y;
                            endY = points[points.length - 2].y;
                            nextY = points[points.length - 3].y;
                            var ostartY = opoints[0].y,
                                oendY = opoints[opoints.length - 2].y,
                                onextY = opoints[opoints.length - 3].y;
                            if(points.length === 7){
                                points[0].y = points[1].y = points[6].y = ostartY + (startY - ostartY) * timer;
                                points[2].y = points[5].y = oendY + (endY - oendY) * timer;
                                points[3].y = points[4].y = onextY + (nextY - onextY) * timer;
                            }
                            else{
                                //points[0].y = points[1].y = points[4].y = ostartY + (startY - ostartY) * timer;
                                points[2].y = points[3].y = oendY + (endY - oendY) * timer;
                            }
                            mergeShape.points = points;
                        }]);
                    }
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
        drawShape: function(context, shape, series){
            var borderWidth = pack("number", shape.borderWidth, series.borderWidth, 0),
                fillColor = shape.color || series.color;
            if(shape.selected !== false && shape.value !== null){
                fillColor = Color.parse(fillColor);
                fillColor.a = defined(shape.current) ? 0.75 : 1;

                context.save();
                context.fillStyle = Color.rgba(fillColor);
                context.beginPath();
                shape.points.forEach(function(point, i){
                    context[i ? "lineTo" : "moveTo"](point.x, point.y);
                });
                context.fill();

                (context.lineWidth = borderWidth) > 0 && (
                    context.strokeStyle = series.borderColor,
                    context.stroke()
                );
                context.restore();
            }
        },
        getShape: function(x, y){
            var ret = [];
            var series = this.shapes,
                length = series.length;
            var shapes, shape, item;

            function reset(shapes){
                shapes.forEach(function(item){
                    delete item.current;
                });
            }

            for(var i = 0; i < length; i++){
                item = series[i];
                reset(shapes = item.shapes);
                for(var j = 0; j < shapes.length; j++){
                    shape = shapes[j];
                    if(
                        shape.value !== null &&
                        shape.selected !== false &&
                        Intersection.polygon({x: x, y: y}, shape.points)
                    ){
                        shape.current = j;
                        shape.$value = "" + shape._value;
                        ret.push({shape: shape, series: item});
                        break;
                    }
                }
            }
            return ret;
        },
        drawLabels: function(context, shape, series){
            dataLabels.align(function(type, bbox){
                var t = pack("string", type, "center");
                var points = shape.points,
                    textArgs = shape.textArgs,
                    ls;
                var w2 = Math.abs(points[1].x - points[0].x),
                    w = bbox.width,
                    x = textArgs.x,
                    y = textArgs.y;
                if(this.inside === true){
                    x = points[0].x;
                }
                else{
                    if(this.distance > 0){
                        context.save();
                        context.beginPath();
                        context.moveTo(x, y);
                        context.lineTo(x += this.distance, y);
                        context.strokeStyle = shape.color;
                        context.stroke();
                        context.restore();
                    }
                    return x;
                }
                ls = lineSlope(points[4], points[3]);
                return {
                    left: (y - ls.b) / ls.slope,
                    center: x  + (w2 - w) / 2,
                    right: textArgs.x - w
                }[t];
            }).vertical(function(type, bbox){
                var points = shape.points,
                    shapeArgs = shape.shapeArgs;
                var h = bbox.height,
                    h2 = shapeArgs.height,
                    y = points[0].y;
                var t = pack("string", type, "top");
                if(this.inside !== true)
                    return shape.textArgs.y + h / 2;
                return {
                    top: y + h,
                    middle: y + h + (h2 - h) / 2,
                    bottom: y + h2
                }[t];
            }).call(shape, series, context);
        }
    };
    
    Funnel.Layout = function(type, series, options){
        this.series = series;
        this.shapes = [];

        this.type = type;
        this.options = options;

        this.init();
    };
    Funnel.Layout.prototype = {
        init: function(){
            this.shapes = this.subgroup();
        },
        neckWidth: function(series, plotX, plotY, plotWidth, plotHeight){
            var NECK_HEIGHT_FACTOR = pack("number",
                    Numeric.percentage(100, series.neckHeight) / 100,
                    0.75
                ),
                reversed = !!series.reversed,
                sorted = series.sorted;

            var seriesWidth = pack("number",
                    series.width,//absolute
                    Numeric.percentage(plotWidth, series.width),//percent
                    plotWidth//auto
                ),
                seriesHeight = pack("number",
                    series.height,
                    Numeric.percentage(plotHeight, series.height),
                    plotHeight
                ),
                size = Math.min(seriesWidth, seriesHeight);
            var cx = pack("number",
                    series.left,
                    Numeric.percentage(plotWidth, series.left),
                    plotX + (plotWidth - size) / 2//auto center
                ),
                cy = pack("number",
                    series.top,
                    Numeric.percentage(plotHeight, series.top),
                    plotY// + (plotHeight - seriesHeight) / 2
                );
            var nextHeight = reversed * seriesHeight,
                pointWidth = size;

            var turningHeight = SQRT3 * size * NECK_HEIGHT_FACTOR / 2,
                curTurningHeight = 0,
                turningFlag = false;
            var xTopLeft = cx;//pointWidth; //cx;

            var shapes = series.shapes,
                length = shapes.length,
                j = reversed ? length : -1;
            var sumValue = Math.max(pack("number", series.sumValue), 1e-8);

            (series.neck === true && (defined(sorted) && sorted !== false)) && shapes.sort(function(a, b){
               return a.value - b.value;
            });
            var al = 0;
            while (reversed ? j-- : ++j < length) {
                var shape = shapes[j],
                    value = shape.value,
                    percentage = value / sumValue;
                if (shape.isNULL || shape.selected === false || value < 0) {
                    value = percentage = 0;
                }
                var height = percentage * seriesHeight,
                    nextWidth = turningFlag ? 0 : height / SQRT3;

                var xTopRight = xTopLeft + pointWidth,
                    xBottomRight = xTopRight - nextWidth,
                    xBottomLeft = xTopLeft + nextWidth;
                var yTop = cy + nextHeight,
                    yBottom = yTop + height;

                var points = [
                    {x: xTopLeft, y: yTop},//top left
                    {x: xTopRight, y: yTop}//top right
                ];
                if (reversed) {
                    yBottom = nextHeight;
                    yTop = yBottom - height;

                    xBottomRight = al + pointWidth;
                    xTopLeft = al - nextWidth;
                    xTopRight = al + nextWidth;

                    points = [
                        {x: xBottomRight, y: yBottom},//left bottom
                        {x: al, y: yBottom},//right bottom
                        {x: xTopLeft, y: yTop},//right top
                        {x: xTopRight, y: yTop}//left top
                    ];
                    nextHeight -= height;
                }
                else {
                    //turn shape
                    if(!turningFlag && curTurningHeight + height > turningHeight) {
                        var minWidth = size * (1 - NECK_HEIGHT_FACTOR);
                        turningFlag = true;
                        nextWidth = (pointWidth - minWidth) / 2;
                        points = points.concat([
                            {x: xTopRight - nextWidth, y: yTop + turningHeight - curTurningHeight},
                            {x: xTopRight - nextWidth, y: yBottom},
                            {x: xTopLeft + nextWidth, y: yBottom},
                            {x: xTopLeft + nextWidth, y: yTop + turningHeight - curTurningHeight}
                        ]);
                        pointWidth = minWidth;
                        xBottomLeft = xTopLeft + nextWidth;
                    }
                    else{
                        curTurningHeight += height;
                        points.push(
                            {x: xBottomRight, y: yBottom},//bottom right
                            {x: xBottomLeft, y: yBottom}//bottom left
                        );
                        pointWidth = pointWidth - 2 * nextWidth;
                    }
                    nextHeight += height;
                    points.push({x: xTopLeft, y: yTop});//close path
                    xTopLeft = xBottomLeft;
                }

                extend(shape, {
                    x: xTopLeft,
                    y: yTop,
                    points: points,
                    total: series.sumValue,
                    percentage: percentage * 100,
                    shapeArgs: {
                        x: xTopLeft,
                        y: yTop,
                        height: height
                    },
                    textArgs: {
                        x: -9999,
                        y: -9999
                    }
                });
                
            }
        },
        neckHeight: function(series, plotX, plotY, plotWidth, plotHeight){
            var reversed = !!series.reversed,
                sorted = series.sorted;
            var seriesWidth = pack("number",
                    series.width,//absolute
                    Numeric.percentage(plotWidth, series.width),//percent
                    plotWidth//auto
                ),
                seriesHeight = pack("number",
                    series.height,
                    Numeric.percentage(plotHeight, series.height),
                    plotHeight
                ),
                size = Math.min(seriesWidth, seriesHeight);
            var cx = pack("number",
                    series.left,
                    Numeric.percentage(plotWidth, series.left),
                    plotX + (plotWidth - size) / 2//auto center
                ),
                cy = pack("number",
                    series.top,
                    Numeric.percentage(plotHeight, series.top),
                    plotY + (plotHeight - size) / 2 - 1
                );

            var shapes = series.shapes,
                length = shapes.length,
                j = reversed ? -1 : length,
                shape;

            var nextY = reversed ? cy : (cy + size),
                nextX = 0,
                nextX1 = 0;

            var pointHeight;

            sorted !== false && shapes.sort(function(a, b){
                return reversed
                    ? a.value - b.value
                    : b.value - a.value;
            });

            var lastShape, filterLength = 0;
            while(reversed ? ++j < length : j--){
                var filter = (shape = shapes[j]).selected !== false && shape.value !== null && shape.value >= 0;
                delete shape.isLast;
                if(filter){
                    lastShape || (lastShape = shape);
                    ++filterLength;
                }
            }
            pointHeight = size / filterLength;
            lastShape && (lastShape.isLast = true);

            j = reversed ? -1 : length;
            while(reversed ? ++j < length : j--){
                var value = (shape = shapes[j]).value,
                    percentage = value / series.maxValue;
                var points = [];
                var x, y, x1, y1, w = 0, h;
                var isEmpty = false;
                h = pointHeight;
                if(value === null || value < 0 || shape.selected === false){
                    value = h = 0;
                    isEmpty = true;
                }
                w = percentage * size;
                x = cx;
                x += (size - w) / 2;
                x1 = x + w;
                if(reversed){
                    y = nextY;
                    y1 = y + h;
                    points = [
                        {x: nextX, y: y},//left top
                        {x: nextX1, y: y},//right top
                        {x: x1, y: y1},//right bottom
                        {x: x, y: y1},//left bottom
                        {x: nextX, y: y}//close
                    ];
                    if(shape.isLast){
                        points = [
                            {x: x + w / 2, y: y},
                            {x: x + w / 2, y: y},
                            {x: x1, y: y1},
                            {x: x, y: y1},
                            {x: x + w / 2, y: y}
                        ];
                    }
                    nextY = y1;
                }
                else{
                    y = nextY - h;
                    y1 = y + h;
                    
                    points = [
                        {x: x, y: y},//left top
                        {x: x1, y: y},//right top
                    ];
                    if(shape.isLast){
                        points.push(
                            {x: x1 - w / 2, y: y1},//right bottom
                            {x: x1 - w / 2, y: y1}//repeat this x and y
                        );
                    }
                    else{
                        points.push(
                            {x: nextX1, y: y1},//right bottom
                            {x: nextX, y: y1}//left bottom
                        );
                    }
                    points.push({x: x, y: y});
                    nextY = y;
                }
                if(!isEmpty){
                    nextX1 = x1;
                    nextX = x;
                }

                extend(shape, {
                    points: points,
                    shapeArgs: {
                        x: x,
                        y: y,
                        height: pointHeight,
                        width: w
                    },
                    textArgs: {
                        x: -9999,
                        y: -9999
                    }
                });
            }
        },
        dataLabels: function(series){
            var shapes = series.shapes;
            shapes.forEach(function(shape){
                var points = shape.points || [],
                    shapeArgs = shape.shapeArgs;
                var ls;
                var x, y;
                if(points.length){
                    ls = lineSlope(points[2], points[1]);
                    //funnel shape
                    if(points.length >= 7){
                        ls = lineSlope(points[4], points[3]);
                    }
                    // //triangle shape
                    // else if(points.length <= 4){
                    //     ls = lineSlope(points[1], points[0]);
                    // }
                    y = (shapeArgs.y + shapeArgs.height / 2);
                    x = (y - ls.b) / ls.slope;
                    if(ls.slope === 0){
                        if(points.length >= 7){
                            x = points[3].x;
                            y = points[2].y;
                        }
                        else
                            x = points[2].x;//没有斜率
                    }
                    shape.textArgs.x = x;
                    shape.textArgs.y = y;
                }
            });
        },
        subgroup: function(){
            var options = this.options,
                type = this.type,
                width = options.chart.width,
                height = options.chart.height;
            var layout = this;
            options.panel.forEach(function(pane){
                var series = arrayFilter(pane.series, function(series){
                    return series.type === type;
                });
            
                series.forEach(function(series){
                    var plotX = pack("number", series.plotX, 0),
                        plotY = pack("number", series.plotY, 0),
                        plotWidth = pack("number", series.plotWidth, width, 0),
                        plotHeight = pack("number", series.plotHeight, height, 0);

                    layout[series.neck === true ? "neckHeight" : "neckWidth"].apply(layout, [
                        series, plotX, plotY, plotWidth, plotHeight
                    ]);
                    layout.dataLabels(series);
                });
            });
            return this.series;
        }
    };

    (Chart.graphers = Chart.graphers || {}).funnel = Chart.Funnel = Funnel;

})(typeof window !== "undefined" ? window : this, Dalaba.Chart);