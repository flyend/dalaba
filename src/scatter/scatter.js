(function (global, Chart) {
    var relayout = require("./layout").deps(Numeric);
    /*
     * Class Scatter
    */
    function Scatter (canvas, options) {
        this.type = "scatter";

        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        
        this.init(options);
    }
    Scatter.prototype = {
        constructor: Scatter,
        init: function (options) {
            var type = this.type;
            this.options = extend({}, options);

            this.series = arrayFilter(options.series, function (series) {
                var filter = series.type === type;
                if(filter){
                    series._diffValues = List.diff(series.shapes, series._shapes || [],  function(a, b){
                        return a && b && a.value === b.value;
                    });
                }
                return filter;
            });
            relayout(type, this.options);
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
        draw: function(){
            var context = this.context,
                chart = this;
            this.series.forEach(function(series){
                series.shapes.forEach(function(shape){
                    chart.drawShape(context, shape, series);
                });
                series.shapes.forEach(function(shape){
                    if (isNumber(shape.current) && shape.current > -1) {
                        chart.drawShape(context, shape, series);
                    }
                    DataLabels.render(context, shape, series);
                });
            });
        },
        redraw: function(){
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
                return !(
                    x < pack("number", series.plotX, 0) ||
                    x > series.plotWidth + pack("number", series.plotX, 0) ||
                    y < pack("number", series.plotY, 0) ||
                    y > series.plotHeight + pack("number", series.plotY, 0)
                );
            };
            var resetShape = function(shapes){
                for(var j = 0, l = shapes.length; j < l;  j++){
                    delete shapes[j].current;
                }
            };

            for(i = 0; i < sl; i++){
                shapes = (series = this.series[i]).shapes;
                resetShape(shapes);
                if(!isInside(series)){
                    return results;
                }
                for(j = 0, dl = shapes.length; j < dl; j++){
                    shape = shapes[j];
                    if(series.selected === false){
                        continue;
                    }
                    if(Intersection.line(
                        {x: x, y: y},
                        {x: shape.cx, y: shape.cy, width: shape.radius}
                    )){
                        shape.current = j;
                        results.push({shape: shape, series: series});
                        break;
                    }
                }
            }
            return results;
        },
        drawShape: function (context, shape, series) {
            var borderWidth = pack("number", series.borderWidth, 0),
                borderColor = series.borderColor,
                fillColor = shape.color || series.color,
                radius = shape.radius,
                opacity = Numeric.clamp(pack("number", shape.opacity, series.opacity, 1), 0, 1),
                shadowBlur = pack("number", shape.shadowBlur, series.shadowBlur, 0),
                shadowOffsetX = pack("number", shape.shadowOffsetX, series.shadowOffsetX, 0),
                shadowOffsetY = pack("number", shape.shadowOffsetY, series.shadowOffsetY, 0),
                shadowColor = shape.shadowColor || series.shadowColor;
            var cx = shape.cx, cy = shape.cy;
            var color = fillColor;

            if(defined(fillColor.radialGradient)){
                color = Color.parse(fillColor);
                fillColor = color.radial(cx, cy, radius);
                color = color.color;
            }
            if (opacity < 1) {
                color = fillColor = Color.parse(fillColor).alpha(opacity).rgba();
            }
            
            if (isNumber(shape.current) && shape.current > -1) {
                var cr = radius + 3;
                context.save();
                context.fillStyle = Color.parse(color).alpha(0.25).rgba();
                context.beginPath();
                context.arc(cx, cy, cr, 0, PI * 2, true);
                context.fill();
                context.restore();
            }
            
            context.save();
            context.fillStyle = fillColor;
            context.beginPath();
            radius > 0 && context.arc(cx, cy, radius, 0, PI2, true);
            borderWidth > 0 && (context.lineWidth = borderWidth, context.strokeStyle = borderColor, context.stroke());
            if (shadowBlur > 0) {
                context.shadowColor = shadowColor;
                context.shadowBlur = shadowBlur;
                context.shadowOffsetX = shadowOffsetX;
                context.shadowOffsetY = shadowOffsetY;
            }
            context.fill();
            context.restore();
        },
        dataLabels: function (context, shape, series) {
            var radius = shape.radius;
            shape.dataLabel = DataLabels.align(function (type, bbox) {
                var x = shape.cx;
                var t = pack("string", type, "center");
                return {
                    left: x - bbox.width,
                    center: x - bbox.width / 2,
                    right: x
                }[t];
            }).vertical(function (type, bbox) {
                var y = shape.cy;
                var t = pack("string", type, "top");
                return {
                    top: y - radius,
                    middle: y + radius,
                    bottom: y + bbox.height * 2 + radius
                }[t];
            }).call(shape, series, context);
        },
        animateTo: function (context, initialize) {
            var shapes = [];
            this.series.forEach(function (series){
                var newData = series.shapes,
                    oldData = series._shapes || [];
                var animators = [];
                if(initialize === true){
                    newData.forEach(function (shape) {
                        var mergeShape = {
                            cx: shape.cx,
                            cy: shape.cy,
                            color: shape.color,
                            shape: shape
                        };
                        shapes.push([shape, function (timer) {
                            mergeShape.radius = shape.radius * timer;
                        }]);
                        animators.push(mergeShape);
                    });
                }
                else {
                    series._diffValues.remove(function (newIndex) {
                        var newShape = newData[newIndex],
                            mergeShape;

                        mergeShape = {
                            cx: newShape.cx,
                            cy: newShape.cy,
                            value: newShape.radius,
                            shape: newShape,
                            dataLabel: newShape.dataLabel
                        };
                        shapes.push([newShape, function (timer) {
                            mergeShape.radius = newShape.radius * timer;
                        }]);
                        animators.push(mergeShape);
                    }).add(function(newIndex){
                        var oldShape = oldData[newIndex],
                            mergeShape;
                        mergeShape = {
                            cx: oldShape.cx,
                            cy: oldShape.cy,
                            color: oldShape.color,
                            value: oldShape.value,
                            shape: oldShape,
                            dataLabel: oldShape.dataLabel
                        };
                        shapes.push([oldShape, function (timer) {
                            mergeShape.radius = oldShape.radius - oldShape.radius * timer;
                        }]);
                        animators.push(mergeShape);
                    }).modify(function (newIndex, oldIndex) {
                        var newShape = newData[newIndex],
                            oldShape = oldData[oldIndex],
                            mergeShape;
                        if(oldShape && newShape){
                            mergeShape = {
                                color: newShape.color,
                                value: newShape.value,
                                shape: newShape,
                                dataLabel: newShape.dataLabel
                            };
                            shapes.push([newShape, function(timer){
                                mergeShape.cx = oldShape.cx + (newShape.cx - oldShape.cx) * timer;
                                mergeShape.cy = oldShape.cy + (newShape.cy - oldShape.cy) * timer;
                                mergeShape.radius = oldShape.radius + (newShape.radius - oldShape.radius) * timer;
                            }]);
                            animators.push(mergeShape);
                        }
                    }).each();
                }
                series._shapes = series.shapes;
                series._animators = animators;
            });
            return shapes;
        },
        onFrame: function (context) {
            var chart = this;
            this.series.forEach(function (series ){
                var animators = series._animators;
                animators.forEach(function (shape) {
                    chart.drawShape(context, shape, series);
                    DataLabels.render(context, shape.shape, series);
                });
            });
        }
    };

    (Chart.graphers = Chart.graphers || {}).scatter = Chart.Scatter = Scatter;

})(typeof window !== "undefined" ? window : this, Dalaba.Chart);