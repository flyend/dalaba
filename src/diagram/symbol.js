(function() {

    var Symbol = {
        dount: function(x, y, w, h) {
            var r = Math.min(w, h);
            return function(context){
                context.beginPath();
                context.arc(x, y + r / 2, r, 0, PI2, true);
                context.arc(x, y + r / 2, r * 0.4, 0, PI2, false);
            };
        },
        square: function(x, y, w, h, r){
            r = 6;//typeof r === "undefined" ? 0 : Math.min(r || 0, w, h);
            return function(context){
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
            };
        },
        triangle: function(x, y, w, h){
            return function(context){
                context.beginPath();
                context.moveTo(x, y + h / 2);
                context.lineTo(x + w / 2, y - h / 2);
                context.lineTo(x + w, y + h / 2);
                context.lineTo(x, y + h / 2);
            };
        },
        circle: function(x, y, w, h){
            //var cpw = 0.166 * w;
            return function(context){
                context.beginPath();
                /*context.moveTo(x + w / 2, y);
                context.bezierCurveTo(x + w + cpw, y, x + w + cpw, y + h, x + w / 2, y + h);
                context.bezierCurveTo(x - cpw, y + h, x - cpw, y, x + w / 2, y);*/
                context.arc(x + w / 2, y + w / 2, w / 2, 0, PI2);
                context.closePath();
            };
        },
        hexagon: function(x, y, w, h){
            var r = Math.max(w, h);
            return function(context){
                var i = -1, n = 6, a;
                var sin = Math.sin, cos = Math.cos;
                r /= 2;
                context.beginPath();
                context.moveTo(x + cos(0) * r + r, y + sin(0) * r + r);
                while(++i < n){
                    context.lineTo(
                        x + cos(a = i / n * PI2) * r + r,
                        y + sin(a) * r + r
                    );
                }
                context.closePath();
            };
        },
        path: function(x, y, w, h, r){
            var path = this;
            var arc = Chart.arc;
            return function(context){
                //context.stroke(new Path2D(path));
                var moveX, moveY,//line
                    centerX, centerY;//arc
                path = path.replace(/([MmZzLlHhVvCcSsQqTtAa])([^\s])/gm, "$1 $2")
                    .replace(/([^\s])([MmZzLlHhVvCcSsQqTtAa])/gm, "$1 $2");
                var tokens = path.split(/[\s+]/g),
                    length = tokens.length,
                    i = 0,
                    d;
                //console.log(tokens)

                context.save();
                context.translate(x, y + r / 2);
                context.beginPath();
                //Path.parse
                for(; i < length; i++){
                    d = tokens[i];
                    switch(d){
                        case "M":
                            context.moveTo(moveX = centerX = +tokens[++i], moveY = centerY = +tokens[++i]);
                        break;
                        case "L":
                            context.lineTo(moveX = +tokens[++i], moveY = +tokens[++i]);
                        break;
                        case "A":
                            arc(context,
                                moveX,//ex
                                moveY,//ey
                                [+tokens[++i],//rx
                                +tokens[++i],//ry
                                +tokens[++i],//large
                                +tokens[++i],//sweep
                                +tokens[++i],//rotation
                                moveX = +tokens[++i],//x
                                moveY = +tokens[++i]]//y
                            );
                        break;
                        case "Z":
                            moveX = centerX, moveY = centerY;
                            i++;
                            context.closePath();
                        break;
                    }
                }
                context.restore();
                //console.log(path)
            };
        }
    };
    return Symbol;
})();