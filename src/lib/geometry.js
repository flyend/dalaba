(function (global) {
    function factoy (global, Dalaba) {
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

                return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
            },
            line: function (p0, p1) {
                return this.distance(p0, p1) <= p1.width;
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
            pie: function (p0, p1) {
                var PI2 = Math.PI * 2;
                var dx = p0.x - p1.x,
                    dy = p0.y - p1.y;

                var inPie = this.distance(p0, p1) <= p1.radius;
                if(inPie && typeof p1.innerRadius === "number")
                    inPie = this.distance(p0, p1) >= p1.innerRadius;

                if(inPie){
                    var angle = Math.atan2(dy, dx) + Math.PI / 2;//顺、逆时针开始
                    if(angle < 0)
                        angle += PI2;
                    if(angle > PI2)
                        angle -= PI2;
                    if(angle >= p1.startAngle && angle <= p1.endAngle){
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
            aabb: function (x1, y1, w1, h1, x2, y2, w2, h2) {
                return !(
                    x2 > x1 + w1 ||
                    x2 + w2 < x1 ||
                    y2 > y1 + h1 ||
                    y2 + h2 < y1
                );
            },
            polygon: function (p0, points) {
                var n = 0;
                for(var i = 0, length = points.length, j = length - 1; i < length; j = i, i++){
                    var source = points[i],
                        target = points[j];
                    //点与多边形顶点重合或在多边形的边上
                    if(
                        (source.x - p0.x) * (p0.x - target.x) >= 0 &&
                        (source.y - p0.y) * (p0.y - target.y) >= 0 &&
                        (p0.x - source.x) * (target.y - source.y) === (p0.y - source.y) * (target.x - source.x)
                    ){
                        return true;
                    }
                    //点与相邻顶点连线的夹角
                    var angle = Math.atan2(source.y - p0.y, source.x - p0.x) - Math.atan2(target.y - p0.y, target.x - p0.x);
                    //确保夹角不超出取值范围（-π 到 π）
                    if(angle >= Math.PI)
                        angle -= Math.PI * 2;
                    else if(angle <= -Math.PI)
                        angle += Math.PI * 2;
                    n += angle;
                }
                return Math.round(n / Math.PI) !== 0;//当回转数为 0 时，点在闭合曲线外部。
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
                    length = Math.sqrt(dx * dx + dy * dy),
                    angle = Math.atan2(dy, dx);
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
                if(prevPoint && nextPoint){
                    prevX = prevPoint.x;
                    prevY = prevPoint.y;
                    nextX = nextPoint.x;
                    nextY = nextPoint.y;

                    leftContX = (prevX + smoothing * x) / denom;
                    leftContY = (prevY + smoothing * y) / denom;
                    rightContX = (nextX + smoothing * x) / denom;
                    rightContY = (nextY + smoothing * y) / denom;

                    
                    if(inverted){
                        correction = ((rightContX - leftContX) * (rightContY - y)) / (rightContY - leftContY) + x - rightContX;
                        leftContX += correction;
                        rightContX += correction;
                        if(leftContX > prevX && leftContX > x){
                            leftContX = Math.max(prevX, x);
                            rightContX = x * 2 - leftContX;
                        }
                        else if(leftContX < prevX && leftContX < x){
                            leftContX = Math.min(prevX, x);
                            rightContX = x * 2 - leftContX;
                        }
                        if(rightContX > nextX && rightContX > x){
                            rightContX = Math.max(nextX, x);
                            leftContX = x * 2 - rightContX;
                        }
                        else if(rightContX < nextX && rightContX < x){
                            rightContX = Math.min(nextX, x);
                            leftContX = x * 2 - rightContX;
                        }
                    }
                    else{
                        correction = ((rightContY - leftContY) * (rightContX - x)) / (rightContX - leftContX) + y - rightContY;
                        leftContY += correction;
                        rightContY += correction;
                        if(leftContY > prevY && leftContY > y){
                            leftContY = Math.max(prevY, y);
                            rightContY = y * 2 - leftContY;
                        }
                        else if(leftContY < prevY && leftContY < y){
                            leftContY = Math.min(prevY, y);
                            rightContY = y * 2 - leftContY;
                        }
                        if(rightContY > nextY && rightContY > y){
                            rightContY = Math.max(nextY, y);
                            leftContY = y * 2 - rightContY;
                        }
                        else if(rightContY < nextY && rightContY < y){
                            rightContY = Math.min(nextY, y);
                            leftContY = y * 2 - rightContY;
                        }
                    }
                    curPoint.rightContX = rightContX;
                    curPoint.rightContY = rightContY;
                }
                if(prevPoint){
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
                }
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
        deps: function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [global].concat(args));
        }
    };
    if(typeof module === "object" && module.exports){
        module.exports = exports;
    }
    else if(typeof define === "function" && define.amd){
        define(function(){
            return exports;
        });
    }
    return exports;
})(typeof window !== "undefined" ? window : this)