(function(global, Chart) {

    var Symbol = require("./symbol");

    var Linked = require("./linked");

    var addLayout = require("./layout").deps(Linked);

    var diagramLinkArrow = function(context, from, to, s) {
        var x = from.x,
            y = from.y;
        var tx = to.x,
            ty = to.y;
        var theta = Math.atan2(ty - y, tx - x);

        if (x < tx) {
            theta = 0;
        }
        else if (x > tx) {
            theta = Math.PI;
        }
        context.save();
        context.translate(tx, ty);
        context.rotate(theta);
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(0, -s / 2);
        context.lineTo(0 + s, 0);
        context.lineTo(0, s / 2);
        context.fill();
        context.restore();
    };

    var Diagram = function(canvas, options) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.series = [];

        this.type = "diagram";

        this.init(options);

    }, diagramProto = Diagram.prototype;

    diagramProto = {
        constructor: Diagram,
        init: function(options) {            
            var panels = [],
                panel = options.panel;
            var n = panel.length, i = -1, j, nn;

            var newSeries = [],
                series;
            while (++i < n) {
                newSeries = [];
                for (j = 0, nn = panel[i].series.length; j < nn; j++) if ((series = panel[i].series[j]).type === this.type) {
                    newSeries.push(series);
                }
                panels.push({
                    series: newSeries
                });
            }
            this.series = newSeries;
            this.options = options;//update
            this.panels = panels;

            addLayout(panels);
        },
        draw: function() {
            var context = this.context,
                chart = this;
                
            this.series.forEach(function(series){
                var shapes = series.shapes;
                var selectedShapes = [];
                shapes.forEach(function(shape) {
                    if (shape.selected !== true) {
                        //chart.drawLink(context, shape, series);
                    }
                    else {
                        selectedShapes.push(shape);
                    }
                });
                /*
                selectedShapes.forEach(function(shape){
                    chart.drawLink(context, shape, series);
                });
                if(chart.actived.link) {
                    chart.drawPath(context, chart.actived.link, series);
                }*/
            });
            this.series.forEach(function(series) {
                
                series.shapes.forEach(function(shape){
                    chart.dataLabels(context, shape, series);
                    chart.drawLink(context, shape, series);
                });
                series.shapes.forEach(function(shape){
                    chart.drawShape(context, shape, series);
                });
            });
        },
        redraw: function() {
            addLayout(this.panels, 1);
            this.draw();
        },
        drawShape: function(context, shape, series) {
            var borderWidth = pack("number", shape.borderWidth, series.borderWidth, 0),
                borderColor = shape.borderColor || series.borderColor,
                fillColor = shape.color || series.fillColor,
                symbol = pack("string", series.symbol, shape.symbol, "square"),
                radius = shape.radius,
                width = shape.width,
                height = shape.height;

            var x = shape.x, y = shape.y;
            var linePixel = fixLinePixel(x, y, width, height, borderWidth);

            context.save();
            context.fillStyle = fillColor;
            (defined(shape.path) ? Symbol.path : Symbol[symbol] ? Symbol[symbol] : Symbol.square).apply(
                shape.path,
                [linePixel.x, linePixel.y, linePixel.width, linePixel.height, radius]
            )(context);
            context.fill();
            borderWidth > 0 && (context.lineWidth = borderWidth, context.strokeStyle = borderColor, context.stroke());
            context.restore();
        },
        drawLink: function(context, shape) {
            var linklines = shape.linklines || [],
                dirSize = linklines.dirSize;
            context.save();
            
            (shape.linklines || []).forEach(function(link) {
                context.beginPath();
                context.strokeStyle = shape.lineColor;
                context.moveTo(link.x, link.y);
                /*context.lineTo(link.x2, link.y2);
                context.lineTo(link.x3, link.y3);
                context.lineTo(link.x1, link.y1);*/
                context.bezierCurveTo(link.x2, link.y2, link.x3, link.y3, link.x1, link.y1);
                context.stroke();

                diagramLinkArrow(context, {
                    x: link.x,
                    y: link.y
                }, {
                    x: link.x1,
                    y: link.y1
                }, dirSize);
            });
            
            context.restore();
        },
        dataLabels: function(context, shape, series) {
            dataLabels.value(shape.value).align(function(type, bbox){
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
                var t = pack("string", type, "middle");
                return {
                    top: y + h,
                    middle: y + h + (h2 - h) / 2,
                    bottom: y + h2
                }[t];
            }).call(shape, series, context);
        },
        getShape: function(x, y) {
            var series, shapes, shape;
            var n = this.series.length, ii, i, j;
            var symbol;
            var inRanged = false;
            var results = [];

            for (i = 0; i < n; i++) {
                shapes = (series = this.series[i]).shapes;
                for (j = 0, ii = shapes.length; j < ii; j++) {
                    shape = shapes[j];
                    symbol = "square";//shape.symbol;
                    inRanged = false;
                    if (symbol === "square") {
                        inRanged = Intersection.rect(
                            {x: x, y: y},
                            {x: shape.x, y: shape.y, width: shape.x + shape.width, height: shape.y + shape.height}
                        );
                    }
                    else if (symbol === "circle" || symbol === "dount") {
                        inRanged = Intersection.distance(
                            {x: x, y: y},
                            {x: shape.x + shape.radius, y: shape.y + shape.radius}
                        ) <= shape.radius;
                    }
                    else if (symbol === "triangle" || symbol === "hexagon") {
                        inRanged = Intersection.polygon(
                            {x: x, y: y},
                            []
                        );
                    }
                    delete shape.current;
                    if (inRanged) {
                        shape.current = j;
                        results.push({
                            series: series,
                            shape: shape
                        });
                        break;
                    }
                }
            }
            return results;
        }
    };

    Diagram.prototype = diagramProto;

    (Chart.graphers = Chart.graphers || {}).diagram = Diagram;

})(typeof window !== "undefined" ? window : this, Dalaba.Chart);