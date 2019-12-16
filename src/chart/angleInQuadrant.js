(function(){
    var PI = Math.PI;
    var PI2 = PI * 2;

    var sortByAngle = function(a, b){
        return a.angle - b.angle;
    };
    var angleInQuadrant = function(angle){
        return 0 <= angle && angle < PI / 2
            ? 1
            : angle < PI
                ? 2
                : angle < PI * 1.5
                    ? 3
                    : 0;
    };
    function factoy(shapes, options){
        var quadrants = [[], [], [], []];
        var radius = options.radius || shapes[0].radius,
            maxRadius;
        var fontHeight = 0;

        shapes.forEach(function(shape){
            var angle =  shape.angle * PI / 180;
            angle %= PI2;
            angle < 0 && (angle += PI2);
            quadrants[angleInQuadrant(angle)].push({
                angle: angle,
                cx: shape.cx,
                cy: shape.cy,
                point: shape
            });
        });
        quadrants.forEach(function(item){
            item.sort(sortByAngle);
        });
        quadrants[1].reverse();
        quadrants[3].reverse();

        maxRadius = Math.max(
            radius + fontHeight,
            Math.min(radius / fontHeight, Math.max.apply(Math, quadrants.map(function(item){ return item.length; })))
        );
        quadrants.forEach(function(shapes, g){
            var length = shapes.length,
                j;
            var currentAngle = length * fontHeight,
                maxAngle = maxRadius,
                angle;
            var shape;

            for(j = 0; j < length; j++){
                shape = shapes[j];
                currentAngle -= fontHeight;
                angle = shape.angle;
                angle = Math.abs(maxRadius * Math.sin(angle));
                angle = Math.min(Math.max(angle, currentAngle), maxAngle);
                //maxAngle < angle ? (angle = maxAngle) : angle < currentAngle && (angle = currentAngle);
                shape._angle = angle;
                maxAngle = angle - fontHeight;
            }

            currentAngle = maxRadius - (length - 1) * fontHeight;
            maxAngle = 0;
            for(j = length - 1; j >= 0; --j){
                shape = shapes[j];
                currentAngle += fontHeight;
                angle = shape.angle;
                angle = Math.abs(maxRadius * Math.sin(angle));
                angle = Math.max(Math.min(angle, currentAngle), maxAngle);
                //angle < maxAngle ? (angle = maxAngle) : angle > currentAngle && (angle = currentAngle);
                maxAngle = angle + fontHeight;

                var textAlign = [1, 1, -1, -1],
                    textBaseline = [-1, 1, 1, -1];
                
                var midAngle = (angle + shape._angle) / 2,
                    toX = shape.cx + textAlign[g] * radius * Math.cos(Math.asin(Math.max(-1, Math.min(1, midAngle / maxRadius)))),
                    toY = shape.cy + midAngle * textBaseline[g];
                /*var x = shape.cx + Math.cos(shape.angle) * radius;
                if(g < 2 && toX < x || g < 1 && toX > x){
                    toX = x;
                }*/
                //console.log(g, shape);
                //toX += context.measureText(shape.text).width * [0, 0, -1, -1][g];//["start", "start", "end", "end"]
                //toY += [0, 6, 6, 0][g];//["bottom", "top", "top",  "bottom"]
                shape.point._textX = toX;
                shape.point._textY = toY;
                shape.point._quadrent = g;
                delete shape._angle;
            }
        });
    }
    return factoy;
})();