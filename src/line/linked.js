(function(){
    var next = function(points, i, n) {
        var point;
        while(point = points[i], point.isNULL && i < ~-n) ++i;
            return i;
    };
    var back = function(points, i, n) {
        var point;
        while(point = points[n - 1], point.isNULL && --n > i);
            return n;
    };
    var find = function(points, s, e) {
        var j = s, point;
        do {
            point = points[j];
        } while(point.isNULL && j++ < e);
        return j;
    };
    var each = function(context, points, step) {
        var length = points.length,
            i = next(points, 0, length),
            j;
        var point;
        var moveX, moveY;
        length = back(points, i, length);
        point = points[i];

        context.beginPath();
        context.moveTo(moveX = point.x, moveY = point.y);
        for(; i < length; i++){
            point = points[i];
            if(point.isNULL){
                j = find(points, j = i + 1, length);
                point = points[j];
                context.moveTo(moveX = point.x, moveY = point.y);
            }
            step(point, i, moveX, moveY);
        }
    };

    var Linked = {
        line: function(context, points, options) {
            var dashStyle = options.dashStyle,
                onStep = options.onStep;
            var length = points.length,
                i = next(points, 0, length),//[a, b-1)
                j;
            var point;
            var x, y, moveX, moveY;
            length = back(points, i, length);//(b, a]
            point = points[i];

            context.beginPath();
            context.moveTo(moveX = point.x, moveY = point.y);
            for (; i < length; i++) {
                point = points[i];
                if (point.isNULL) {
                    j = find(points, j = i + 1, length);
                    point = points[j];
                    context.moveTo(moveX = point.x, moveY = point.y);
                }
                //step(point, i, moveX, moveY);
                x = point.x, y = point.y;
                DashLine[dashStyle] && dashStyle !== "solid" ? DashLine[dashStyle](
                    context,
                    moveX, moveY,
                    moveX = x, moveY = y
                ) : context.lineTo(x, y);
                onStep && onStep(point);
            }
        },
        spline: function(context, points, options) {
            var onStep = options.onStep;
            var length = points.length,
                i = next(points, 0, length),
                j;
            var x, y, x1, y1, x2, y2;
            var point;
            length = back(points, i, length);
            point = points[i];

            context.beginPath();
            context.moveTo(point.x, point.y);
            for (; i < length; i++) {
                point = points[i];
                x = point.x, y = point.y;
                x1 = point.x1, y1 = point.y1;
                x2 = point.x2, y2 = point.y2;
                if (point.isNULL) {
                    j = find(points, j = i + 1, length);
                    point = points[j];
                    x = x1 = x2 = point.x;
                    y = y1 = y2 = point.y;
                    context.moveTo(x, y);
                }
                else context.bezierCurveTo(x1, y1, x2, y2, x, y);
                onStep && onStep(point);
            }
        },
        step: function(context, points, options) {
            var type = options.step,
                onStep = options.onStep;
            each(context, points, function(point, i) {
                var curt = points[i],
                    prev = points[i - 1];
                if (prev && !prev.isNULL && !curt.isNULL) {
                    switch (type) {
                        case "right":
                            context.lineTo(prev.x, curt.y);
                        break;
                        case "center":
                            context.lineTo((prev.x + curt.x) / 2, prev.y);
                            context.lineTo((prev.x + curt.x) / 2, curt.y);
                        break;
                        default:
                            context.lineTo(curt.x, prev.y);
                        break;
                    }
                    context.lineTo(curt.x, curt.y);
                    onStep && onStep(curt);
                }
            });
        },
        arearange: function(context, points, options){
            var onStep = options.onStep;
            var length = points.length,
                i = next(points, 0, length),
                j;
            var point;
            var x, y, moveX, moveY;
            var key = options.key,
                dashStyle = options.dashStyle;
            length = back(points, i, length);
            point = points[i];

            context.beginPath();
            context.moveTo(moveX = point.x, moveY = point[key]);
            for(; i < length; i++){
                point = points[i];
                if(point.isNULL){
                    j = find(points, j = i + 1, length);
                    point = points[j];
                    context.moveTo(moveX = point.x, moveY = point[key]);
                }
                x = point.x, y = point[key];
                DashLine[dashStyle] && dashStyle !== "solid" ? DashLine[dashStyle](
                    context,
                    moveX, moveY,
                    moveX = x, moveY = y
                ) : context.lineTo(x, y);
                onStep && onStep(point);
            }
        }
    };
    return Linked;
})();