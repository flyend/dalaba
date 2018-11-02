(function (global) {
    var PI = Math.PI;
    var PI2 = PI * 2;

    var nativeSqrt = Math.sqrt;
    var nativeAtan2 = Math.atan2;
    var nativeRound = Math.round;
    var nativeMax = Math.max;
    var nativeMin = Math.min;

    function factoy (Vector) {

        var Intersection = {
            /*
             * Euclidean distance
             * Returns false or true
            */
            distance: function (p0, p1) {
                var x1 = p0.x,
                    y1 = p0.y;
                var x2 = p1.x,
                    y2 = p1.y;

                return nativeSqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
            },
            inBounds: function (x, y, rect) {
                return x >= rect.x && x < rect.width && y >= rect.y && y < rect.height;
            },
            line: function (p0, p1) {
                return this.distance(p0, p1) <= p1.width;
            },
            segment: function (p0, p1, p2) {
                var spx = p2.x - p1.x,
                    spy = p2.y - p1.y;
                var start = new Vector(p2.x, p2.y).sub(p1),// segment ent point --> start point
                    end = new Vector(p0.x, p0.y).sub(p1);// point --> start point
                var t;
                var dist;

                if (start.x === 0 && start.y === 0) {
                    return false;
                }
                t = end.dot(start) / start.square();
                
                if (t < 0) {
                    dist = p1;// start point
                }
                else if (t > 1) {
                    dist = p2;// end point
                }
                else {
                    dist = new Vector(p1.x + start.x * t, p1.y + start.y * t);
                }
                dist = new Vector(dist.x, dist.y).sub(p0).length();
                return dist <= 1;
            },
            circle: function (p0, p1) {
                var dx = p1.x - p0.x,
                    dy = p1.y - p0.y,
                    dr = p0.radius + p1.radius;
                return dr * dr - dx * dx - dy * dy < 0.001;
            },
            /*
             * Pie collision detection
             * Returns false or true
             * @param shapes is Shape{Object}, Contains the x, y, size, startAngle and endAngle
             * @param x and y is mouse event
             * @param checkin and checkout is callback
            */
            pie: function (p0, p1, sa) {
                var dx = p0.x - p1.x,
                    dy = p0.y - p1.y;
                var startAngle = p1.startAngle,
                    endAngle = p1.endAngle,
                    angle;

                var inPie = this.distance(p0, p1) <= p1.radius;

                sa = Dalaba.pack("number", sa, PI / 2);
                if (inPie && isNumber(p1.innerRadius, true))
                    inPie = this.distance(p0, p1) >= p1.innerRadius;

                if (inPie) {
                    angle = nativeAtan2(dy, dx) + sa;//顺、逆时针开始
                    
                    if (angle < 0)
                        angle += PI2;
                    if (angle > PI2)
                        angle -= PI2;
                    startAngle += sa, endAngle += sa;
                    if (angle >= startAngle && angle <= endAngle){
                        return inPie;
                    }
                }
                return false;
            },
            /*
             * Rect collision detection
             * Returns false or true
             * @param p0 is Point{Object}, Contains the x, y, size, startAngle and endAngle
             * @param p1 is Point{Object}, Contains the x, y, width, height. p1x = x + width, p1y = y + height
            */
            rect: function (p0, p1) {
                var rx = (p0.x - p1.x) * (p0.x - p1.width);
                var ry = (p0.y - p1.y) * (p0.y - p1.height);
                return rx <= 0.0 && ry <= 0.0;
            },
            aabb: function (p0, p1) {
                return !(
                    p1.x > p0.x + p0.width ||
                    p1.x + p1.width < p0.x ||
                    p1.y > p0.y + p0.height ||
                    p1.y + p1.height < p0.y
                );
            },
            polygon: function (p0, points) {
                var n = 0;
                for (var i = 0, length = points.length, j = length - 1; i < length; j = i, i++) {
                    var source = points[i],
                        target = points[j];
                    //点与多边形顶点重合或在多边形的边上
                    if (
                        (source.x - p0.x) * (p0.x - target.x) >= 0 &&
                        (source.y - p0.y) * (p0.y - target.y) >= 0 &&
                        (p0.x - source.x) * (target.y - source.y) === (p0.y - source.y) * (target.x - source.x)
                    ) {
                        return true;
                    }
                    //点与相邻顶点连线的夹角
                    var angle = nativeAtan2(source.y - p0.y, source.x - p0.x) - nativeAtan2(target.y - p0.y, target.x - p0.x);
                    //确保夹角不超出取值范围（-π 到 π）
                    if (angle >= PI)
                        angle -= PI2;
                    else if (angle <= -PI)
                        angle += PI2;
                    n += angle;
                }
                return nativeRound(n / PI) !== 0;//当回转数为 0 时，点在闭合曲线外部。
            }
        };
        /**
         * Dash Line
        */
        var arcDashLine = function (context, cx, cy, radius, startAngle, endAngle, dasharrays) {
            var length = pack("number", dasharrays && dasharrays[0], 1),
                offset = pack("number", dasharrays && dasharrays[1], 2);
            var size = PI / radius / (2 / length);
            var sa = startAngle,
                ea = sa + size;
            offset = PI / radius / (2 / offset);
            while (ea < endAngle) {
                context.beginPath();
                context.arc(cx, cy, radius, sa, ea, false);
                context.stroke();
                sa = ea + offset;
                ea = sa + size;
            }
        };
        var DashLine = {
            line: function (x, y, w, h, dasharray) {
                var dx = w - x,
                    dy = h - y,
                    length = nativeSqrt(dx * dx + dy * dy),
                    angle = nativeAtan2(dy, dx);
                var dal = dasharray.length,
                    di = 0;
                var isDraw = true;

                return function (context) {
                    context.save();
                    context.translate(x, y);
                    context.rotate(angle);

                    context.moveTo(x = 0, 0);
                    while (length > x) {
                        x += dasharray[di++ % dal];
                        if(x > length)
                            x = length;
                        context[isDraw ? "lineTo" : "moveTo"](x, 0);
                        isDraw = !isDraw;
                    }

                    context.stroke();
                    context.restore();
                };
            },
            arc: function (context, cx, cy, radius, startAngle, endAngle, type) {
                arcDashLine(context, cx, cy, radius, startAngle, endAngle, {
                    dot: [2, 6],
                    dash: [8, 6],
                    shortdash: [6, 2],
                    shortdot: [2, 2],
                    longdash: [16, 6]
                }[type] || [2, 6]);
            },
            solid: function (context, x, y, w, h) {
                //this.line(x, y, w, h, [w])(context);
                context.moveTo(x, y);
                context.lineTo(w, h);
                context.stroke();
            },
            dot: function (context, x, y, w, h) {
                this.line(x, y, w, h, [2, 6])(context);
            },
            dash: function (context, x, y, w, h) {
                this.line(x, y, w, h, [8, 6])(context);
            },
            shortdash: function (context, x, y, w, h) {
                this.line(x, y, w, h, [6, 2])(context);
            },
            shortsolid: function (context, x, y, w, h) {
                this.line(x, y, w, h, [6, 2])(context);
            },
            shortdot: function (context, x, y, w, h) {
                this.line(x, y, w, h, [2, 2])(context);
            },
            shortdashdot: function (context, x, y, w, h) {
                this.line(x, y, w, h, [6, 2, 2, 2])(context);
            },
            shortdashdotdot: function (context, x, y, w, h) {
                this.line(x, y, w, h, [6, 2, 2, 2, 2, 2])(context);
            },
            longdash: function (context, x, y, w, h) {
                this.line(x, y, w, h, [16, 6])(context);
            },
            dashdot: function (context, x, y, w, h) {
                this.line(x, y, w, h, [8, 6, 2, 6])(context);
            },
            longdashdot: function (context, x, y, w, h) {
                this.line(x, y, w, h, [16, 6, 2, 6])(context);
            },
            longdashdotdot: function (context, x, y, w, h) {
                this.line(x, y, w, h, [16, 6, 2, 6, 2, 6])(context);
            }
        };

        /**
        * Line
        **/
        var Line = {
            smooth: function(prevPoint, curPoint, nextPoint, inverted) {
                var smoothing = 1.5,
                    denom = smoothing + 1;
                var leftContX, leftContY, rightContX, rightContY;
                var x, y, prevX, prevY, nextX, nextY;
                var correction, ret = null;
                x = curPoint.x;
                y = curPoint.y;
                if (prevPoint && nextPoint) {
                    prevX = prevPoint.x;
                    prevY = prevPoint.y;
                    nextX = nextPoint.x;
                    nextY = nextPoint.y;

                    leftContX = (prevX + smoothing * x) / denom;
                    leftContY = (prevY + smoothing * y) / denom;
                    rightContX = (nextX + smoothing * x) / denom;
                    rightContY = (nextY + smoothing * y) / denom;

                    
                    if (inverted) {
                        correction = ((rightContX - leftContX) * (rightContY - y)) / (rightContY - leftContY) + x - rightContX;
                        leftContX += correction;
                        rightContX += correction;
                        if (leftContX > prevX && leftContX > x) {
                            leftContX = nativeMax(prevX, x);
                            rightContX = x * 2 - leftContX;
                        }
                        else if (leftContX < prevX && leftContX < x) {
                            leftContX = nativeMin(prevX, x);
                            rightContX = x * 2 - leftContX;
                        }
                        if (rightContX > nextX && rightContX > x) {
                            rightContX = nativeMax(nextX, x);
                            leftContX = x * 2 - rightContX;
                        }
                        else if (rightContX < nextX && rightContX < x) {
                            rightContX = nativeMin(nextX, x);
                            leftContX = x * 2 - rightContX;
                        }
                    }
                    else {
                        correction = ((rightContY - leftContY) * (rightContX - x)) / (rightContX - leftContX) + y - rightContY;
                        leftContY += correction;
                        rightContY += correction;
                        if (leftContY > prevY && leftContY > y) {
                            leftContY = nativeMax(prevY, y);
                            rightContY = y * 2 - leftContY;
                        }
                        else if (leftContY < prevY && leftContY < y) {
                            leftContY = nativeMin(prevY, y);
                            rightContY = y * 2 - leftContY;
                        }
                        if (rightContY > nextY && rightContY > y) {
                            rightContY = nativeMax(nextY, y);
                            leftContY = y * 2 - rightContY;
                        }
                        else if (rightContY < nextY && rightContY < y) {
                            rightContY = nativeMin(nextY, y);
                            leftContY = y * 2 - rightContY;
                        }
                    }
                    curPoint.rightContX = rightContX;
                    curPoint.rightContY = rightContY;
                }
                if (prevPoint) {
                    ret = {
                        x1: prevPoint.rightContX || prevPoint.x,
                        y1: prevPoint.rightContY || prevPoint.y,
                        x2: leftContX || x,
                        y2: leftContY || y,
                        x: x,
                        y: y
                    };
                }
                return ret;
            },
            Dash: DashLine
        };

        /**
         * Rect
        **/
        var Rect = {
            getRotationBound: function (width, height, angle) {
                var sin = Math.sin,
                    cos = Math.cos,
                    abs = Math.abs;
                if (angle === 0) {
                    return { width: width, height: height};
                }
                var x0 = abs(sin(angle = angle * Math.PI / 180) * width),
                    x1 = abs(cos(angle) * width);
                var y0 = abs(sin(angle) * height),
                    y1 = abs(cos(angle) * height);
                return {
                    width: x1 + y0,
                    height: x0 + y1
                };
            }
        };

        var Symbol = {
            rect: function (x, y, w, h, r) {
                r = r || 0;
                var linePixel = fixLinePixel(x, y, w - 1, h - 1);
                x  = linePixel.x, y = linePixel.y;
                w = linePixel.width, h = linePixel.height;
                return function (context) {
                    context.beginPath();
                    context.moveTo(x + r, y);
                    //top-right
                    context.lineTo(x + w - r, y);
                    context.bezierCurveTo(x + w, y, x + w, y, x + w, y + r);//top-right corner
                    //bottom-right
                    context.lineTo(x + w, y + h - r);
                    context.bezierCurveTo(x + w, y + h, x + w, y + h, x + w - r, y + h);//bottom-right corner
                    //bottom-left
                    context.lineTo(x + r, y + h);
                    context.bezierCurveTo(x, y + h, x, y + h, x, y + h - r);//bottom-left corner
                    //top-left
                    context.lineTo(x, y + r);
                    context.bezierCurveTo(x, y, x, y, x + r, y);//top-left corner
                    //context.closePath();
                    return {
                        x: x - 1,
                        y: y - 1,
                        width: w,
                        height: h
                    };
                };
            },
            circle: function (x, y, w, h) {
                return function (context) {
                    context.beginPath();
                    context.arc(x, y, w, 0, PI2, true);
                    return {
                        x: x,
                        y: y,
                        width: w,
                        height: h
                    };
                };
            },
            triangle: function (x, y, w, h) {
                return function (context) {
                    context.beginPath();
                    context.moveTo(x - w / 2, y + h / 2);
                    context.lineTo(x, y - h / 2);
                    context.lineTo(x + w / 2, y + h / 2);
                    context.closePath();
                    context.stroke()
                    return {
                        x: x,
                        y: y,
                        width: w,
                        height: h
                    };
                };
            },
            hexagon: function (x, y, w, h) {
                var sin = Math.sin, cos = Math.cos;
                var r = Math.max(w, h);
                return function (context) {
                    var i = -1, n = 6, a;
                    r /= 2;
                    context.beginPath();
                    context.moveTo(x + cos(0) * r, y + sin(0) * r);
                    while (++i < n) {
                        context.lineTo(
                            x + cos(a = i / n * PI2) * r,
                            y + sin(a) * r
                        );
                    }
                    context.closePath();
                };
            },
            diamond: function (x, y, w, h) {
                return function (context) {
                    context.beginPath();
                    context.moveTo(x - w / 2, y);
                    context.lineTo(x, y - h / 2);
                    context.lineTo(x + w / 2, y);
                    context.lineTo(x, y + h / 2);
                    context.lineTo(x - w / 2, y);
                    context.stroke();

                    return {
                        x: x,
                        y: y,
                        width: w,
                        height: h
                    };
                };
            },
            ellipse: function (x, y, w, h) {
                var cpw = 0.166 * w;
                return function (context) {
                    context.beginPath();
                    context.moveTo(x + w / 2, y);
                    context.bezierCurveTo(x + w + cpw, y, x + w + cpw, y + h, x + w / 2, y + h);
                    context.bezierCurveTo(x - cpw, y + h, x - cpw, y, x + w / 2, y);
                    context.closePath();
                };
            }
        };

        var Geometry = {
            Intersection: Intersection,
            Line: Line,
            Rect: Rect,
            Symbol: Symbol
        };
        return Geometry;
    }
    var exports = {
        deps: function () {
            return factoy.apply(global, [].slice.call(arguments));
        }
    };
    if (typeof module === "object" && module.exports) {
        module.exports = exports;
    }
    else if (typeof define === "function" && define.amd) {
        define(function () {
            return exports;
        });
    }
    return exports;
})(typeof window !== "undefined" ? window : this)