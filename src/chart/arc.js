(function() {
    var cos = Math.cos,
        sin = Math.sin,
        PI = Math.PI;
    /**
     * svg path a to canvas
     * @example
     * g.beginPath();
     * arc(g, x + l, y + t, [
     *  current[1],
     *  current[2],
     *  current[3],
     *  current[4],
     *  current[5],
     *  current[6] + l,
     *  current[7] + t
     * ], l, t);
     * x = current[6];
     * y = current[7];//next move
     * g.stroke();
    */
    var arc = (function() {
        var arcToSegmentsCache = {},
            segmentToBezierCache = {},
            join = Array.prototype.join,
            argsStr;

        // Copied from Inkscape svgtopdf, thanks!
        function arcToSegments(x, y, rx, ry, large, sweep, rotateX, ox, oy) {
            argsStr = join.call(arguments);
            //console.log(argsStr, arcToSegmentsCache)
            if (arcToSegmentsCache[argsStr]) {
                return arcToSegmentsCache[argsStr];
            }

            var th = rotateX * (PI / 180);
            var sin_th = sin(th);
            var cos_th = cos(th);
            rx = Math.abs(rx);
            ry = Math.abs(ry);
            var px = cos_th * (ox - x) * 0.5 + sin_th * (oy - y) * 0.5;
            var py = cos_th * (oy - y) * 0.5 - sin_th * (ox - x) * 0.5;
            var pl = (px * px) / (rx * rx) + (py * py) / (ry * ry);
            if (pl > 1) {
                pl = Math.sqrt(pl);
                rx *= pl;
                ry *= pl;
            }

            var a00 = cos_th / rx;
            var a01 = sin_th / rx;
            var a10 = (-sin_th) / ry;
            var a11 = (cos_th) / ry;
            var x0 = a00 * ox + a01 * oy;
            var y0 = a10 * ox + a11 * oy;
            var x1 = a00 * x + a01 * y;
            var y1 = a10 * x + a11 * y;

            var d = (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0);
            var sfactor_sq = 1 / d - 0.25;
            if (sfactor_sq < 0) sfactor_sq = 0;
            var sfactor = Math.sqrt(sfactor_sq);
            if (sweep == large) sfactor = -sfactor;
            var xc = 0.5 * (x0 + x1) - sfactor * (y1-y0);
            var yc = 0.5 * (y0 + y1) + sfactor * (x1-x0);

            var th0 = Math.atan2(y0 - yc, x0 - xc);
            var th1 = Math.atan2(y1 - yc, x1 - xc);

            var th_arc = th1-th0;
            if (th_arc < 0 && sweep == 1){
                th_arc += 2*PI;
            } else if (th_arc > 0 && sweep === 0) {
                th_arc -= 2 * PI;
            }

            var segments = Math.ceil(Math.abs(th_arc / (PI * 0.5 + 0.001)));
            var result = [];
            for (var i = 0; i < segments; i++) {
                var th2 = th0 + i * th_arc / segments;
                var th3 = th0 + (i + 1) * th_arc / segments;
                result[i] = [xc, yc, th2, th3, rx, ry, sin_th, cos_th];
            }

            return (arcToSegmentsCache[argsStr] = result);
        }

        function segmentToBezier(cx, cy, th0, th1, rx, ry, sin_th, cos_th) {
            argsStr = join.call(arguments);
            if(segmentToBezierCache[argsStr]){
                return segmentToBezierCache[argsStr];
            }

            var a00 = cos_th * rx;
            var a01 = -sin_th * ry;
            var a10 = sin_th * rx;
            var a11 = cos_th * ry;

            var cos_th0 = cos(th0);
            var sin_th0 = sin(th0);
            var cos_th1 = cos(th1);
            var sin_th1 = sin(th1);

            var th_half = 0.5 * (th1 - th0);
            var sin_th_h2 = sin(th_half * 0.5);
            var t = (8 / 3) * sin_th_h2 * sin_th_h2 / sin(th_half);
            var x1 = cx + cos_th0 - t * sin_th0;
            var y1 = cy + sin_th0 + t * cos_th0;
            var x3 = cx + cos_th1;
            var y3 = cy + sin_th1;
            var x2 = x3 + t * sin_th1;
            var y2 = y3 - t * cos_th1;

            return (segmentToBezierCache[argsStr] = [
                a00 * x1 + a01 * y1,  a10 * x1 + a11 * y1,
                a00 * x2 + a01 * y2,  a10 * x2 + a11 * y2,
                a00 * x3 + a01 * y3,  a10 * x3 + a11 * y3
            ]);
        }

        //<path d="A100{rx}, 100{ry}, 0{rotate}, 1{large}, 0{sweep}, 100{x}, 100{y}"></path>
        return function(g, x, y, coords){
            //x, y => g.moveTo(x, y)
            //var segs = arcToSegments(ex, ey, rx, ry, large, sweep, rot, x, y);
            //console.log(x, y, coords);
            ;(arcToSegments(
                coords[5],//ex
                coords[6],//ey
                coords[0],//rx
                coords[1],//ry
                coords[3],//large
                coords[4],//sweep,
                coords[2],//rotation
                x,
                y
            ) || []).forEach(function(item){
                g.bezierCurveTo.apply(g, segmentToBezier.apply(null, item));
            });
        };
    })();

    var angle2arc = function(cx, cy, radius, innerRadius, startAngle, endAngle, open) {
        var cosStart = cos(startAngle),
            sinStart = sin(startAngle),
            cosEnd = cos(endAngle = endAngle - 0.00000001),
            sinEnd = sin(endAngle),
            longArc = +(endAngle - startAngle > PI);

        return function(context) {
            var moveX, moveY;
            //outerRadius
            context.beginPath();
            context.moveTo(
                moveX = cx + radius * cosStart,
                moveY = cy + radius * sinStart
            );
            //arcTo
            arc(
                context,
                moveX, moveY,
                [
                    radius, radius,//cx, cy radius
                    0,//slanting
                    longArc,//long or short arc
                    1,//clockwise
                    cx + radius * cosEnd, cy + radius * sinEnd//close x, y
                ]
            );
            //innerRadius
            context[open ? "moveTo" : "lineTo"](
                moveX = cx + innerRadius * cosEnd,
                moveY = cy + innerRadius * sinEnd
            );
            arc(
                context,
                moveX, moveY,
                [
                    innerRadius, innerRadius,
                    0,//slanting
                    longArc,
                    0,//clockwise
                    cx + innerRadius * cosStart,
                    cy + innerRadius * sinStart
                ]
            );
            open || context.closePath();
        };
    };
    return {arc: arc, angle2arc: angle2arc};
})()