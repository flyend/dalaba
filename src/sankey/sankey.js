(function (global, Chart) {
    var relayout = require("./layout").deps();

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
        stops.forEach(function (item) {
            if (isNumber(item[0]) && typeof item[1] === "string")
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
            this.options = extend({}, options);
            var canvas = this.canvas;
            var chart = this;

            var panels = [],
                panel = options.panel;
            var n = panel.length, i = -1, j, nn;

            var newSeries = [],
                series;
            this.series = [];

            while (++i < n) {
                newSeries = [];
                for (j = 0, nn = panel[i].series.length; j < nn; j++) if ((series = panel[i].series[j]).type === this.type) {
                    newSeries.push(series);
                    this.series = this.series.concat(series);
                }
                panels.push({
                    series: newSeries
                });
            }
            this.options = options;//update
            this.panels = panels;
            this.actived = {};
            
            relayout(panels);

            if (canvas.nodeType === 1) {
                this.series.forEach(function (series) {
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
                        shapes.forEach(function (shape) {
                            if (shape.selected !== true) {
                                chart.drawLink(context, shape, series);
                            }
                            else {
                                selectedShapes.push(shape);
                            }
                        });
                        selectedShapes.forEach(function (shape) {
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
        draw: function (initialize) {
            var context = this.context,
                chart = this;
            if (initialize === true) {
                this.series.forEach(function (series) {
                    var shapes = series.shapes;
                    series._image && shapes[0] && Clip.Horizontal(series._image, 0, 0, series._image.width, series._image.height).clip(context, shapes[0].timer);
                });
            }
            else {
                this.series.forEach(function (series) {
                    var shapes = series.shapes;
                    var selectedShapes = [];
                    shapes.forEach(function (shape) {
                        if (shape.selected !== true) {
                            chart.drawLink(context, shape, series);
                        }
                        else {
                            selectedShapes.push(shape);
                        }
                    });
                    selectedShapes.forEach(function (shape) {
                        chart.drawLink(context, shape, series);
                    });
                    if (chart.actived.link) {
                        chart.drawPath(context, chart.actived.link, series);
                    }
                });
                this.series.forEach(function (series) {
                    series.nodes.forEach(function(shape) {
                        chart.drawShape(context, shape, series);
                    });
                    series.nodes.forEach(function (shape) {
                        DataLabels.render(context, shape.dataLabel, series);
                    });
                });
            }
        },
        redraw: function () {
            relayout(this.panels, true);
            this.reflow();
            this.draw();
        },
        drawShape: function (context, shape, series) {
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

            if (link === this.actived.link) {
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
            if (to) {
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
        drawLink: function (context, shape, series) {
            var chart = this;
            var linkArgs = shape.linkArgs || [];
            context.save();
            linkArgs.forEach(function (link) {
                chart.drawPath(context, link, series);
            });
            context.restore();
        },
        dataLabels: function (context, shape, series) {
            shape.dataLabel = DataLabels.value(shape.value).align(function (type, bbox) {
                var x = shape.x,
                    w = bbox.width,
                    w2 = shape.width;
                var t = pack("string", type,  "center");
                return {
                    left: x,
                    center: x + (w2 - w) / 2,
                    right: x + w2 - w
                }[t];
            }).vertical(function (type, bbox) {
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
        animateTo: function (initialize) {
            var shapes = [];
            this.series.forEach(function (series) {
                var previous = [];
                if (initialize === true) {
                    series.shapes[0].animate({ timer: 0}, { timer: 1});
                    shapes.push(series.shapes[0]);
                }
                else if (defined(series.transform)) {
                    series.nodes.forEach(function (newShape, newIndex) {
                        var oldShape = series._nodes[newIndex],
                            to;
                        if (oldShape) {
                            newShape.animate({
                                x: oldShape.x,
                                y: oldShape.y,
                                width: oldShape.width,
                                height: oldShape.height,
                                timer: 0,
                                linkArgs: oldShape.linkArgs.map(function (d) {
                                    return { from: d.from, to: d.to };
                                })
                            }, to = {
                                value: newShape.value,
                                x: newShape.x,
                                y: newShape.y,
                                width: newShape.width,
                                height: newShape.height,
                                timer: 1,
                                linkArgs: newShape.linkArgs.map(function (d) {
                                    return { from: d.from, to: d.to };
                                })
                            });
                            shapes.push(newShape);
                            previous.push(to);
                        }
                    });
                }
                series._nodes = series.nodes;
            });
            return shapes;
        },
        onStart: function () {
            this.series.forEach(function (series) {
                var transform = series.transform;
                if (defined(transform) && defined(transform.translate)) {
                    transform._translate = transform.translate;
                }
            });
        },
        onDrag: function (x, y) {
            this.actived = {};
            this.series.forEach(function (series) {
                var transform = series.transform || {},
                    translate = transform._translate;
                if (defined(translate)) {
                    transform.translate = [translate[0] + x, translate[1] + y];
                }
            });
            this.reflow();
            relayout(this.panels);
        },
        getShape: function (x, y) {
            var length = this.series.length,
                i = 0,
                j;
            var series, shapes, shape;
            var nodes;
            var context = this.context;
            var results = [], result;

            for (; i < length && (series = this.series[i]).selected !== false; i++) {
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
                label: for (j = 0; j < shapes.length; j++) {
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