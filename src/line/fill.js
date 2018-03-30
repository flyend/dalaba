(function() {
    var find = function(points, start, end) {
        for(var k = end, b; k >= start && (b = points[k]).isNULL; k++);
            return k;
    };

    var each = function(points, call) {
        var n = points.length,
            i;
        var left = (i = 0),
            right = n;
        var point;

        while (left < right) {
            point = points[--right];
            if (point.isNULL) {
                i = right;
                n--;
                i ^ n && call(i + 1, n);
                n = i;
            }
        }
        !points[0].isNULL && call(0, n - 1);
    };

    var begin = function(context, points, start, end, draw, call) {
        var point = points[start];
        var n = end,
            i = start;

        context.moveTo(point.x, point.y);

        for (; i <= n || call(start, i); i++)
            draw(points[i]);
    };
    var stop = function(context, points, start, end, inverted, call) {
        var point = points[end -= 1];
        context.lineTo(inverted ? point.xLeft : point.x, point.yBottom);
        call(start, end);
    };
    var close = function(context, points, start, end, draw) {
        var i = end;
        for(; i > start; --i)
            draw(points[i], start, i);
    };

    var Fill = {
        line: function(context, points, options) {
            var inverted = options.inverted,
                type = options.type;
            each(points, function(start, end) {
                begin(context, points, start, end, function(point) {
                    context.lineTo(point.x, point.y);
                }, function(start, end) {
                    stop(context, points, start, end, inverted, function(start, end) {
                        close(context, points, ~-start, end, function(point) {
                            context.lineTo.apply(context, type === "arearange" ? [point.x, point.highY] : inverted ? [point.xLeft, point.y] : [point.x, point.yBottom]);
                        });
                    });
                });
            });
        },
        spline: function(context, points, options) {
            var inverted = options.inverted;
            each(points, function(start, end) {
                begin(context, points, start, end, function(point) {
                    context.bezierCurveTo(point.x1, point.y1, point.x2, point.y2, point.x, point.y);
                }, function(start, end) {
                    var startX = points[start];
                    stop(context, points, start, end, inverted, function(start, end) {
                        close(context, points, start, end, function(point, start, end) {
                            if (point.prevShape) {
                                var b = points[end - 1];
                                if (b) {
                                    if(b.isNULL){
                                        b = points[find(points, start, end)];
                                    }
                                    b = b.prevShape; 
                                }
                                else {
                                    b = startX;
                                }
                                context.bezierCurveTo(
                                    point.prevShape.x2,
                                    point.prevShape.y2,
                                    point.prevShape.x1,
                                    point.prevShape.y1,
                                    b.x,
                                    b.y
                                );
                            }
                        });
                    });
                });
            });
        },
        range: function(context, points, options) {
            Fill.line(context, points, options);
        }
    };
    return Fill;
})();