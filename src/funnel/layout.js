(function (global) {

    var neckHeight = function (series, plotX, plotY, plotWidth, plotHeight) {
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
            size = mathMin(seriesWidth, seriesHeight);
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
        var maxValue = MIN_VALUE;

        var shapes = series.shapes,
            length = shapes.length,
            j = reversed ? -1 : length,
            shape;

        var nextY = reversed ? cy : (cy + size),
            nextX = 0,
            nextX1 = 0;

        var pointHeight;

        sorted !== false && shapes.sort(function (a, b) {
            return reversed
                ? a.value - b.value
                : b.value - a.value;
        });

        var lastShape, filterLength = 0;
        while (reversed ? ++j < length : j--) {
            var filter = (shape = shapes[j]).selected !== false && !shape.isNULL && shape.value >= 0;
            delete shape.isLast;
            if (filter) {
                lastShape || (lastShape = shape);
                isNumber(shape.value, true) && (maxValue = mathMax(shape.value, maxValue));
                ++filterLength;
            }
        }
        pointHeight = size / filterLength;
        lastShape && (lastShape.isLast = true);

        j = reversed ? -1 : length;
        while (reversed ? ++j < length : j--) {
            var value = (shape = shapes[j]).value,
                percentage = value / maxValue;
            var points = [];
            var x, y, x1, y1, w = 0, h;
            var isEmpty = false;
            h = pointHeight;
            if (shape.isNULL || value < 0 || shape.selected === false) {
                value = h = 0;
                isEmpty = true;
            }
            w = percentage * size;
            x = cx;
            x += (size - w) / 2;
            x1 = x + w;
            if (reversed) {
                y = nextY;
                y1 = y + h;
                points = [
                    {x: nextX, y: y},//left top
                    {x: nextX1, y: y},//right top
                    {x: x1, y: y1},//right bottom
                    {x: x, y: y1},//left bottom
                    {x: nextX, y: y}//close
                ];
                if (shape.isLast) {
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
            else {
                y = nextY - h;
                y1 = y + h;
                
                points = [
                    {x: x, y: y},//left top
                    {x: x1, y: y},//right top
                ];
                if (shape.isLast) {
                    points.push(
                        {x: x1 - w / 2, y: y1},//right bottom
                        {x: x1 - w / 2, y: y1}//repeat this x and y
                    );
                }
                else {
                    points.push(
                        {x: nextX1, y: y1},//right bottom
                        {x: nextX, y: y1}//left bottom
                    );
                }
                points.push({x: x, y: y});
                nextY = y;
            }
            if (!isEmpty) {
                nextX1 = x1;
                nextX = x;
            }

            extend(shape, {
                points: points,
                x: x,
                y: y,
                height: pointHeight,
                width: w,
                textX: -9999,
                textY: -9999,
                index: j
            });
        }
    };

    var neckWidth = function (series, plotX, plotY, plotWidth, plotHeight) {
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
            size = mathMin(seriesWidth, seriesHeight);
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
            j = -1;
        var sumValue = mathMax(pack("number", series.sumValue), 1e-8);
        var shape, value;
        var percentage;

        (series.neck === true && (defined(sorted) && sorted !== false)) && shapes.sort(function (a, b) {
           return a.value - b.value;
        });
        while (++j < length) if ((shape = shapes[j]).selected === false && isNumber(value = shape.value, true) && value > 0) sumValue -= value;
        j = reversed ? length : -1;
        var al = 0;
        while (reversed ? j-- : ++j < length) {
            shape = shapes[j];
            value = shape.value;
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
                height: height,
                points: points,
                total: sumValue,
                percentage: percentage * 100,
                textX: -9999,
                textY: -9999,
                index: j
            });
            
        }
    };

    function factory (lineSlope) {
        var dataLabels = function (series) {
            series.shapes.forEach(function (shape) {
                var points = shape.points || [];
                var ls;
                var x, y;
                if (points.length) {
                    ls = lineSlope(points[2], points[1]);
                    //funnel shape
                    if (points.length >= 7) {
                        ls = lineSlope(points[4], points[3]);
                    }
                    // //triangle shape
                    // else if(points.length <= 4){
                    //     ls = lineSlope(points[1], points[0]);
                    // }
                    y = (shape.y + shape.height / 2);
                    x = (y - ls.b) / ls.slope;
                    if (ls.slope === 0) {
                        if (points.length >= 7) {
                            x = points[3].x;
                            y = points[2].y;
                        }
                        else
                            x = points[2].x;//没有斜率
                    }
                    shape.textX = x;
                    shape.textY = y;
                }
            });
        };
        return function (panels, isResized) {
            panels.forEach(function (pane) {
                pane.series.forEach(function (series) {
                    var plotX = pack("number", series.plotX),
                        plotY = pack("number", series.plotY),
                        plotWidth = pack("number", series.plotWidth),
                        plotHeight = pack("number", series.plotHeight);
                    var args = [
                        series, plotX, plotY, plotWidth, plotHeight
                    ];
                    series.neck === true ? neckHeight.apply(null, args) : neckWidth.apply(null, args);
                    dataLabels(series);
                });
            });
        };
    }

    return {
        deps: function () {
            return factory.apply(global, [].slice.call(arguments, 0));
        }
    };
}).call(typeof window !== "undefined" ? window : this)