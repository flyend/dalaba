(function (global, Chart) {
    var Layout = require("./layout").deps(Dalaba.Numeric);

    var xClip = function(t, context, canvas, x, y){
        if(0 !== t){
            context.save();
            t > 0 && context.drawImage(
                canvas,
                x, y, canvas.width * t, canvas.height,
                x, y, canvas.width * t / DEVICE_PIXEL_RATIO, canvas.height / DEVICE_PIXEL_RATIO
            );
            context.restore();
        }
    };

    var lerpArrays = function(a0, a1, t){
        var ret = [];
        a0.forEach(function(a, i){
            var b = a1[i];
            ret.push(a * (1 - t) + b * t);
        });
        return ret;
    };

    var parseGradient = function (context, x, y, width, height, options) {
        var linearGradient = options.linearGradient,
            x1 = linearGradient.x1,
            y1 = linearGradient.y1,
            x2 = linearGradient.x2,
            y2 = linearGradient.y2,
            stops = options.stops || [];
        var xx = (x1 ^ x2),
            yy = !(y1 ^ y2);
        var gradient = context.createLinearGradient(
            x + width * xx,
            y + height * yy,
            x + width * xx,
            y + height * !yy
        );
        stops.forEach(function(item){
            if(isNumber(item[0]) && typeof item[1] === "string")
                gradient.addColorStop(item[0], item[1]);
        });
        return gradient;
    };

    function Sankey (canvas, options) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.type = "sankey";
        
        this.series = [];
        this.init(options);
    }
    Sankey.prototype = {
        constructor: Sankey,
        init: function (options) {
            var canvas = this.canvas,
                type = this.type,
                chart = this;
            this.actived = {};
            this.options = extend({}, options);
            this.series = arrayFilter(pack("array", options.series, []), function(series){
                var filter = series.type === type;
                return filter;
            });
            
            Layout(type, options);

            if (canvas.nodeType === 1) {
                this.series.forEach(function(series){
                    if(series.animationEnabled){
                        var image = document.createElement("canvas"),
                            context = image.getContext("2d");
                        var shapes = series.shapes;
                        var selectedShapes = [];
                        Chart.scale(
                            context,
                            pack("number", series.plotWidth + series.plotX, canvas.width),
                            pack("number", series.plotHeight + series.plotY, canvas.height),
                            DEVICE_PIXEL_RATIO
                        );
                        series._image = image;
                        shapes.forEach(function(shape) {
                            if (shape.selected !== true) {
                                chart.drawLink(context, shape, series);
                            }
                            else {
                                selectedShapes.push(shape);
                            }
                        });
                        selectedShapes.forEach(function(shape) {
                            chart.drawLink(context, shape, series);
                        });
                        shapes.forEach(function(shape){
                            chart.drawShape(context, shape, series);
                        });
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
        draw: function() {
            var context = this.context,
                chart = this;
                
            this.series.forEach(function(series) {
                var shapes = series.shapes;
                var selectedShapes = [];
                shapes.forEach(function(shape) {
                    if (shape.selected !== true) {
                        chart.drawLink(context, shape, series);
                    }
                    else {
                        selectedShapes.push(shape);
                    }
                });
                selectedShapes.forEach(function(shape){
                    chart.drawLink(context, shape, series);
                });
                if(chart.actived.link) {
                    chart.drawPath(context, chart.actived.link, series);
                }
            });
            this.series.forEach(function(series) {
                series.nodes.forEach(function(shape) {
                    chart.drawShape(context, shape, series);
                });
                series.nodes.forEach(function(shape) {
                    DataLabels.render(context, shape, series);
                });
            });
        },
        redraw: function() {
            Layout(this.type, this.options);
            this.reflow();
            this.draw();
        },
        drawShape: function(context, shape, series) {
            var x = shape.x, y = shape.y,
                width = shape.width,
                height = shape.height;
            var borderWidth = pack("number", shape.borderWidth, series.borderWidth, 0),
                borderColor = shape.borderColor || series.borderColor,
                fillColor = shape.fillColor || series.fillColor || shape.color || series.color;
            var hover = (series.states || {}).hover,
                hoverColor;

            if (isFunction(hover)) {
                hover = hover.call(shape, shape, series);
            }
            if (!defined(hover)) {
                hover = {};
            }
            hoverColor = hover.color;

            if (defined(fillColor.linearGradient) && isNumber(width) && isNumber(height)) {
                fillColor = parseGradient(context, x, y, width, height, fillColor);
            }

            if (shape === this.actived.shape) {
                if(defined(hoverColor)) {
                    fillColor = defined(hoverColor.linearGradient) ? parseGradient(context, x, y, width, height, hoverColor) : hoverColor;
                }
                else{
                    fillColor = Color.parse(fillColor);
                    fillColor.a = 0.75;
                    fillColor = Color.rgba(fillColor);
                }
            }
            context.save();
            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(x + width, y);
            context.lineTo(x + width, y + height);
            context.lineTo(x, y + height);
            context.closePath();

            borderWidth > 0 && (context.lineWidth = borderWidth, context.strokeStyle = borderColor, context.stroke());
            context.fillStyle = fillColor;
            context.fill();
            context.restore();
        },
        drawPath: function (context, link, series) {
            var shapes = series.shapes,
                shape = shapes[link.index] || {};
            var lineColor = shape.lineColor || series.lineColor || "#eee",
                lineWidth = pack("number", shape.lineWidth, series.lineWidth);
            var hover = (series.states || {}).hover,
                hoverLineColor;

            if (isFunction(hover)) {
                hover = hover.call(shape, shape, series);
            }
            if (!defined(hover)) {
                hover = {};
            }
            hoverLineColor = hover.lineColor;
            
            var from = link.from,
                to = link.to;

            if(link === this.actived.link) {
                if (defined(hoverLineColor)){
                    lineColor = hoverLineColor;
                }
                else {
                    lineColor = Color.parse(lineColor);
                    lineColor.a = 0.55;
                    lineColor = Color.rgba(lineColor);
                }
            }
            context.beginPath();
            context.moveTo(from[0], from[1]);
            context.bezierCurveTo.apply(context, from.slice(2));
            if(to){
                context.lineTo(to[0], to[1]);
                context.bezierCurveTo.apply(context, to.slice(2));
            }
            context.fillStyle = lineColor;
            context.fill();
            lineWidth > 0 || (link.size < 1) && (
                context.strokeStyle = lineColor,
                context.stroke()
            );
        },
        drawLink: function(context, shape, series) {
            var chart = this;
            context.save();
            (shape.linkArgs || []).forEach(function(link) {
                chart.drawPath(context, link, series);
            });
            context.restore();
        },
        dataLabels: function (context, shape, series) {
            shape.dataLabel = DataLabels.value(shape.value).align(function (type, bbox){
                var x = shape.x,
                    w = bbox.width,
                    w2 = shape.width;
                var t = pack("string", type,  "center");
                return {
                    left: x,
                    center: x + (w2 - w) / 2,
                    right: x + w2 - w
                }[t];
            }).vertical(function(type, bbox){
                var y = shape.y,
                    h = bbox.height,
                    h2 = shape.height;
                var t = pack("string", type, "top");
                return {
                    top: y + h,
                    middle: y +  (h2 - h) / 2,
                    bottom: y + h2
                }[t];
            }).call(shape, series, context);
        },
        animateTo: function(context, initialize){
            var chart = this;
            var shapes = [];
            chart.series.forEach(function(series){
                var animators = [];
                if(initialize === true){
                    var mergeShape = series;
                    shapes.push([series, function(timer){
                        mergeShape._timer = timer;
                    }]);
                    animators.push(mergeShape);
                }
                else if(defined(series.transform)){
                    series.nodes.forEach(function(newShape, newIndex){
                        var oldShape = series._nodes[newIndex],
                            mergeShape;
                        var x, y, width, height;
                        var linkArgs;

                        if(oldShape && newShape){
                            mergeShape = {
                                width: oldShape.width,
                                height: oldShape.height,
                                x: oldShape.x,
                                y: oldShape.y,
                                color: newShape.color,
                                lineColor: newShape.lineColor,
                                fillColor: newShape.fillColor,
                                _value: newShape._value,
                                selected: oldShape.selected,
                                text: newShape.text,
                                source: newShape.source,
                                value: newShape.value,
                                linkArgs: oldShape.linkArgs,
                                shape: newShape
                            };
                            
                            shapes.push([newShape, function(timer){
                                linkArgs = [];
                                width = oldShape.width + (newShape.width - oldShape.width) * timer;
                                height = oldShape.height + (newShape.height - oldShape.height) * timer;
                                x = oldShape.x + (newShape.x - oldShape.x) * timer;
                                y = oldShape.y + (newShape.y - oldShape.y) * timer;

                                (oldShape.linkArgs || []).forEach(function(oldLink, i){
                                    var newLink = newShape.linkArgs[i];
                                    if(newLink){
                                        linkArgs.push({
                                            from: lerpArrays(oldLink.from, newLink.from, timer),
                                            to: lerpArrays(oldLink.to, newLink.to, timer),
                                            lineColor: oldLink.lineColor,
                                            empty: oldLink.empty,
                                            index: newLink.index
                                        });
                                    }
                                });

                                mergeShape.width = width;
                                mergeShape.height = height;
                                mergeShape.x = x;
                                mergeShape.y = y;
                                mergeShape.linkArgs = linkArgs;
                            }]);
                        }
                        if(mergeShape)
                            animators.push(mergeShape);
                    });
                }
                series._shapes = series.shapes;
                series._nodes = series.nodes;
                series._animators = animators;
            });
            return shapes;
        },
        onFrame: function (context, initialize) {
            var chart = this;
            this.series.forEach(function (series ){
                var animators = series._animators;
                if(initialize === true){
                    animators.forEach(function (series ){
                        series._image && xClip(series._timer, context, series._image, 0, 0);
                    });
                }
                else{
                    animators.forEach(function (shape) {
                        chart.drawLink(context, shape, series);
                    });
                    animators.forEach(function (shape) {
                        chart.drawShape(context, shape, series);
                        DataLabels.render(context, shape, series);
                    });
                }
            });
        },
        onStart: function () {
            this.series.forEach(function(series){
                var transform = series.transform;
                if(defined(transform) && defined(transform.translate)){
                    transform._translate = transform.translate;
                }
            });
        },
        onDrag: function(x, y) {
            this.actived = {};
            this.series.forEach(function(series) {
                var transform = series.transform || {},
                    translate = transform._translate;
                if(defined(translate)){
                    transform.translate = [translate[0] + x, translate[1] + y];
                }
            });
            Layout(this.type, this.options);
        },
        getShape: function(x, y) {
            var length = this.series.length,
                i = 0,
                j;
            var series, shapes, shape;
            var nodes;
            var context = this.context;
            var results = [], result;

            for(; i < length && (series = this.series[i]).selected !== false; i++){
                nodes = series.nodes;
                delete this.actived.shape;
                for(j = 0; j < nodes.length; j++){
                    shape = nodes[j];
                    if(!shape.isNULL && Intersection.rect(
                        {x: x, y: y}, 
                        {x: shape.x, y: shape.y, width: shape.x + shape.width, height: shape.y + shape.height}
                    )){
                        result = {shape: shape, series: series};
                        result.shape.$value = "" + shape._value;
                        result.shape.shape = "node";
                        results.push(result);
                        this.actived.shape = shape;
                        break;
                    }
                }
            }
            
            for (i = 0; i < length; i++) {
                shapes = series.shapes;
                delete this.actived.link;
                label: for(j = 0; j < shapes.length; j++) {
                    shape = shapes[j];
                    var linkArgs = shape.linkArgs || [];
                    for (var z = 0; z < linkArgs.length; z++) {
                        var link = linkArgs[z];
                        var from = link.from,
                            to = link.to;
                        context.beginPath();
                        context.moveTo(from[0], from[1]);
                        context.bezierCurveTo.apply(context, from.slice(2));
                        if (to) {
                            context.lineTo(to[0], to[1]);
                            context.bezierCurveTo.apply(context, to.slice(2));
                        }
                        context.closePath();
                        if (context.isPointInPath(x * DEVICE_PIXEL_RATIO, y * DEVICE_PIXEL_RATIO)) {
                            this.actived.link = link;
                            result = {shape: {
                                shape: "line",
                                $value: shape._value,
                                target: link.target,
                                source: link.source,
                                weight: link.weight,
                                empty: link.empty,
                                sourceLinks: shape.sourceLinks,
                                targetLinks: shape.targetLinks,
                                linkArgs: shape.linkArgs,
                                index: z
                            }, series: series};
                            results.push(result);
                            break label;
                        }
                    }
                }
            }
            return results;
        }
    };

    (Chart.graphers = Chart.graphers || {}).sankey = Sankey;
    
})(typeof window !== "undefined" ? window : this, Dalaba.Chart)