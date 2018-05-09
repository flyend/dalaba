(function (global, Chart) {

    var relayout = require("./layout").deps(Numeric);

    var LineSegment = Chart.LineSegment;

    var angle2arc = Chart.angle2arc;

    var Clip = function (canvas) {
        var cx, cy, cr;
        //var image = canvas.getContext("2d");
        var angle;
        return {
            ploar: function(x, y, r){
                cx = x, cy = y, cr = r;
                return this;
            },
            angle: function(a){
                //image.save();
                //image.clearRect(0, 0, canvas.width, canvas.height);
                /*angle2arc(
                    cx, cy,
                    cr, 0,
                    angle[0], angle[1],
                    false//close path
                )(image);
                image.clip();*/
                angle = a;
                return this;
            },
            clip: function(context){
                context.save();
                //image.clearRect(0, 0, canvas.width, canvas.height);
                angle2arc(
                    cx, cy,
                    cr / 2, 0,
                    angle[0], angle[1],
                    false//close path
                )(context);
                //context.fill();
                context.clip();
                context.drawImage(
                    canvas,
                    0, 0, canvas.width, canvas.height,
                    0, 0, canvas.width / DEVICE_PIXEL_RATIO, canvas.height / DEVICE_PIXEL_RATIO
                );
                context.restore();
            }
        };
    };

    /*
     * Class Scatter
    */
    function Radar (canvas, options) {
        this.type = "radar";

        this.canvas = canvas;
        this.context = canvas.getContext("2d");

        this.series = [];
        
        this.init(options);
    }
    Radar.prototype = {
        constructor: Radar,
        init: function (options) {
            var type = this.type,
                canvas = this.canvas;
            var chart = this;

            this.options = extend({}, options);
            this.series = arrayFilter(options.series, function(series){
                var filter = series.type === type;
                if(filter){
                    series._diffValues = List.diff(series.shapes, series._shapes || [], function(a, b){
                        return a && b && a.value === b.value;
                    });
                }
                return filter;
            });
            relayout(type, this.options);

            if(canvas.nodeType === 1){
                this.series.forEach(function(series){
                    if(series.animationEnabled){
                        var image = document.createElement("canvas"),
                            context = image.getContext("2d");

                        Chart.scale(context, canvas.width, canvas.height, DEVICE_PIXEL_RATIO);
                        series._image = image;
                        chart.drawLine(context, series.shapes, series);
                    }
                });
            }
            this.reflow();
        },
        reflow: function () {
            var context = this.context;
            var chart = this;
            this.series.forEach(function (series) {
                series.shapes.forEach(function (shape) {
                    chart.dataLabels(context, shape, series);
                });
            });
        },
        draw: function () {
            var context = this.context,
                chart = this;
            this.series.forEach(function (series) {
                chart.drawLine(context, series.shapes, series);
                if (series.selected !== false) {
                    series.shapes.forEach(function (shape) {
                        chart.drawShape(context, shape, series);
                    });
                    series.shapes.forEach(function (shape) {
                        DataLabels.render(context, shape, series);
                        chart.onHover(context, shape, series);
                    });
                }
            });
        },
        redraw: function () {
            relayout(this.type, this.options);
            this.reflow();
            this.draw();
        },
        getShape: function (x, y) {
            var series,
                shape,
                sl = this.series.length,
                dl,
                i,
                j;
            var results = [],
                shapes;

            var isInside = function(series){
                var dx = x - series.plotCenterX,
                    dy = y - series.plotCenterY;
                return series.plotRadius * series.plotRadius - dx * dx - dy * dy >= 0.001;
            };
            var resetShape = function(shapes){
                for(var j = 0, l = shapes.length; j < l;  j++){
                    delete shapes[j].current;
                }
            };

            for(i = 0; i < sl; i++){
                series = this.series[i];
                shapes = series.shapes;
                if(isInside(series)){
                    //return results;
                    resetShape(shapes);
                    for(j = 0, dl = shapes.length; j < dl; j++){
                        shape = shapes[j];
                        if(series.selected !== false && !shape.isNULL && Intersection.line(
                            {x: x, y: y},
                            {x: shape.x, y: shape.y, width: pack("number", (series.marker || {}).radius, 5) * 2}
                        )){
                            shape.current = j;
                            results.push({shape: shape, series: series});
                            break;
                        }
                    }
                }
            }
            return results;
        },
        drawShape: function (context, shape, series){
            var marker = pack("object", shape.marker, series.marker, {});
            var lineWidth = pack("number", marker.lineWidth, 0),
                lineColor = pack("string", marker.lineColor, shape.color, series.color, "#000"),
                fillColor = pack("string", marker.fillColor, shape.color, series.color, "#000"),
                radius = pack("number", marker.radius, 4);

            var usemarker = series.shapes.length * radius < series.radius;
            if(defined(marker.enabled) || defined(marker.enabled)){
                usemarker = marker.enabled === true;
            }
            if(series.selected !== false & shape.value !== null & usemarker){
                context.save();
                context.fillStyle = fillColor;
                context.beginPath();
                context.arc(shape.x, shape.y, radius, 0, PI2, true);
                context.fill();
                (context.lineWidth = lineWidth) > 0 &&(context.strokeStyle = lineColor, context.stroke());
                context.restore();
            }
        },
        drawLine: function (context, shapes, series){
            var lineWidth = pack("number", series.lineWidth, 2),
                lineColor = series.lineColor || series.color,
                fillColor = series.fillColor || series.color,
                radarType = series.radarType;
            context.save();
            context.beginPath();
            if(radarType === "area"){
                if(Color.isColor(fillColor)){
                    fillColor = Color.parse(fillColor).alpha(0.75).rgba();
                }
                else if(defined(fillColor.radialGradient)){
                    fillColor = Color.parse(fillColor).radial(series.cx, series.cy, series.radius);
                }
                LineSegment.none(context, shapes, series);
                context.fillStyle = fillColor;
                context.closePath();
                context.fill();
            }
            else{
                LineSegment.none(context, shapes, series);
                context.closePath();
            }

            (context.lineWidth = lineWidth) > 0 && (
                context.shadowColor = series.shadowColor,
                isNumber(series.shadowBlur) && (context.shadowBlur = series.shadowBlur),
                isNumber(series.shadowOffsetX) && (context.shadowOffsetX = series.shadowOffsetX),
                isNumber(series.shadowOffsetY) && (context.shadowOffsetY = series.shadowOffsetY),
                context.strokeStyle = lineColor,
                context.stroke()
            );
            context.restore();
        },
        onHover: function (context, shape, series){
            var marker = series.marker || {},
                fillColor = shape.color || series.color,
                hoverColor;
            if(!shape.isNULL && isNumber(shape.current) && shape.current > -1){
                hoverColor = Color.parse(fillColor);
                hoverColor.a = 0.5;
                context.save();
                context.fillStyle = Color.rgba(hoverColor);
                context.beginPath();
                context.arc(shape.x, shape.y, 8, 0, PI2);
                context.fill();

                context.fillStyle = fillColor;
                context.strokeStyle = marker.fillColor || "#fff";
                context.beginPath();
                context.arc(shape.x, shape.y, 3, 0, PI2);
                context.fill();
                context.stroke();
                context.restore();
            }
            delete shape.current;
        },
        dataLabels: function (context, shape, series) {
            var radius = pack("number", (shape.marker || {}).radius, (series.marker || {}).radius, 0);
            shape.dataLabel = DataLabels.align(function (type, bbox) {
                var t = pack("string", type, "center"),
                    //angle = shape.angle,
                    x = shape.x,
                    w = bbox.width;
                return {
                    left: x - w - radius / 2,
                    center: x - w / 2,
                    right: x + radius / 2
                }[t];
            }).vertical(function(type, bbox){
                var t = pack("string", type, "top"),
                    y = shape.y,
                    h = bbox.height;
                return {
                    top: y - radius,
                    middle: y - h + radius,
                    bottom: y + radius
                }[t];
            }).call(shape, series, context);
        },
        animateTo: function(context, initialize){
            var chart = this;
            var shapes = [];
            chart.series.forEach(function(series){
                var newData = series.shapes,
                    oldData = series._shapes || [];
                var animators = [];
                if(initialize === true){
                    var mergeShape = series;
                    mergeShape._timer = 0;
                    shapes.push([series, function(timer){
                        mergeShape._timer = timer;
                    }]);
                    animators.push(mergeShape);
                }
                else{
                    series._diffValues.remove(function(newIndex){
                        var newShape = newData[newIndex],
                            mergeShape = {
                                x: newShape.x,
                                y: newShape.y,
                                color: newShape.color,
                                value: newShape.value,
                                _value: newShape._value,
                                isNULL: newShape.isNULL
                            };
                        shapes.push([newShape, function(timer){
                            mergeShape.radius = newShape.radius * timer;
                        }]);
                        animators.push(mergeShape);
                    }).add(function(newIndex){
                        var oldShape = oldData[newIndex],
                            mergeShape = {
                                x: oldShape.x,
                                y: oldShape.y,
                                color: oldShape.color,
                                _value: oldShape._value,
                                value: oldShape.value,
                                isNULL: oldShape.isNULL
                            };
                        shapes.push([oldShape, function(timer){
                            //mergeShape.x = NaN;
                            mergeShape.radius = oldShape.radius - oldShape.radius * timer;
                        }]);
                        animators.push(mergeShape);
                    }).modify(function(newIndex, oldIndex){
                        var newShape = newData[newIndex],
                            oldShape = oldData[oldIndex],
                            mergeShape;
                        if(oldShape && newShape){
                            mergeShape = {
                                x: oldShape.x,
                                y: oldShape.y,
                                color: newShape.color,
                                _value: newShape._value,
                                value: newShape.value,
                                isNULL: newShape.isNULL
                            };
                            shapes.push([newShape, function(timer){
                                mergeShape.x = oldShape.x + (newShape.x - oldShape.x) * timer;
                                mergeShape.y = oldShape.y + (newShape.y - oldShape.y) * timer;
                                mergeShape.radius = oldShape.radius + (newShape.radius - oldShape.radius) * timer;
                            }]);
                            animators.push(mergeShape);
                        }
                    }).each();
                }
                series._animators = animators;
                series._shapes = series.shapes;
            });
            return shapes;
        },
        onFrame: function (context, initialize) {
            var chart = this;
            this.series.forEach(function (series) {
                var animator = series._animators;
                if (initialize === true) {
                    animator.forEach(function (series) {
                        series._image && Clip(series._image)
                            .ploar(series.plotCenterX, series.plotCenterY, series.plotRadius * 2 + 10)
                            .angle([series._startAngle, series._endAngle * (series._timer) + series._startAngle])
                            .clip(context);
                    });
                }
                else {
                    chart.drawLine(context, animator, series);
                    animator.forEach(function (mergeShape) {
                        chart.drawShape(context, mergeShape, series);
                        DataLabels.render(context, mergeShape, series);
                    });
                }
            });
        }
    };

    (Chart.graphers = Chart.graphers || {}).radar = Chart.Radar = Radar;

})(typeof window !== "undefined" ? window : this, Dalaba.Chart);