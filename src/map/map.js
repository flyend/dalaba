(function (global, Chart) {
    
    var relayout = require("./layout").deps(Dalaba.geo, Color);
    /*
     * Class Map
    */
    function Map (canvas, options) {
        this.type = "map";

        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        
        this.init(options);
    }
    Map.prototype = {
        constructor: Map,
        init: function (options) {
            this.options = options;
            this.panels = options.panels;
            this.series = relayout(this.panels);
            this.reflow();
        },
        reflow: function () {
            var context = this.context,
                chart = this;
              
            this.series.forEach(function (series) {
                var shapes = series.shapes;
                if (defined(series.mapData)) {
                    shapes.forEach(function (shape) {
                        chart.drawLabels(context, shape, series);
                    });
                }
            });
        },
        draw: function () {
            var context = this.context,
                chart = this;
            this.series.forEach(function (series) {
                var shapes = series.shapes;
                if (defined(series.mapData)) {
                    shapes.forEach(function (shape) {
                        chart.drawShape(context, shape, series);
                    });
                    shapes.forEach(function (shape) {
                        DataLabels.render(context, shape.dataLabel, series);
                    });
                }
            });
        },
        redraw: function () {
            relayout(this.panels, true);
            this.reflow();
        },
        drawShape: function (context, shape, series) {
            var borderWidth = pack("number", series.borderWidth, 0),
                borderColor = pack("string", series.borderColor, "#FFFFFF"),
                fillColor = shape.color || series.fillColor || "#f7f7f7";
            var states = series.states || {},
                stateHover = states.hover,
                stateSelected = states.selected;
            var tooltip = series.tooltip;
            var points = shape.points;
            var shapeArgs = shape.shapeArgs;
            var gradient;
            var render = function () {
                context.beginPath();
                points.forEach(function (point, i) {
                    context[i && !point.isNext ? "lineTo" : "moveTo"](point.x, point.y);
                });
                //context.closePath();
            };

            if (fillColor.linearGradient || fillColor.radialGradient) {
                var s0 = (shapeArgs.maxX - shapeArgs.x) / 2,
                    s1 = (shapeArgs.maxY - shapeArgs.y) / 2;
                gradient = Color.parse(fillColor);
                fillColor = fillColor.radialGradient
                    ? gradient.radial(shapeArgs.x, shapeArgs.y, Math.sqrt(s0 * s0 + s1 * s1) / 4)
                    : gradient.linear(0, 0, s0, s1);
            }
            if (tooltip.enabled !== false && fillColor !== "none" && isNumber(shape.current) && shape.current !== -1) {
                if (!shape.isNULL) {
                    fillColor = Color.parse(fillColor).alpha(0.75).rgba();
                }
                else {
                    fillColor = "rgb(79, 134, 189)";
                }
                // TODO : state hover callback
                if (shape.selected !== true && stateHover) {
                    isNumber(stateHover.borderWidth) && (borderWidth = stateHover.borderWidth);
                    defined(stateHover.borderColor) && (borderColor = stateHover.borderColor);
                    defined(stateHover.fillColor) && (fillColor = stateHover.fillColor);
                }
            }
            if (stateSelected && shape.selected === true) {
                isNumber(stateSelected.borderWidth) && (borderWidth = stateSelected.borderWidth);
                defined(stateSelected.borderColor) && (borderColor = stateSelected.borderColor);
                defined(stateSelected.fillColor) && (fillColor = stateSelected.fillColor);
            }

            context.save();
            render();
            if (fillColor !== "none") {
                context.fillStyle = fillColor;
                context.fill();
            }
            if (borderWidth > 0) {
                context.lineWidth = borderWidth;
                context.strokeStyle = borderColor;
                context.stroke();
            }
            context.restore();
            if (defined(series.shadowColor)) {
                context.save();
                context.shadowColor = series.shadowColor;
                isNumber(series.shadowBlur) && (context.shadowBlur = series.shadowBlur);
                isNumber(series.shadowOffsetX) && (context.shadowOffsetX = series.shadowOffsetX);
                isNumber(series.shadowOffsetY) && (context.shadowOffsetY = series.shadowOffsetY);
                context.fillStyle = series.shadowFillColor || fillColor || "rgba(255, 255, 255, 1)";
                context.fill();
                context.restore();
            }
        },
        getShape: function (x, y) {
            var series,
                shapes,
                shape;
            var ret = [];
            var enableMouseTracking = true;

            function reset (shapes) {
                shapes.forEach(function (item) {
                    delete item.current;
                });
            }
            //x=543;

            for (var i = 0, n = this.series.length; i < n; i++) {
                reset(shapes = (series = this.series[i]).shapes);
                enableMouseTracking = !(series.tooltip.enabled === false || series.enableMouseTracking === false);
                for (var j = 0; enableMouseTracking && j < shapes.length; j++) {
                    shape = shapes[j];
                    if (Intersection.polygon({
                        x: x,
                        y: y
                    }, shape.points)) {
                        shape.$value = shape.isNULL || !isNumber(shape.value, true) ? "--" : "" + shape.value;
                        ret.push({shape: shape, series: series});
                        shape.current = j;
                        break;
                    }
                }
            }
            var diffData = [],
                diffMaps = {};
            ret.forEach(function (item) {
                var key = item.shape.name;
                if (!diffMaps.hasOwnProperty(key)) {
                    diffMaps[key] = !0;
                    diffData.push(item);
                }
            });
            return diffData;
        },
        drawLabels: function (context, shape, series) {
            DataLabels.value(shape.name).align(function (type, bbox) {
                var x = shape.shapeArgs.x,
                    w = bbox.width;
                return x - w / 2;
            }).vertical(function (type, bbox) {
                var y = shape.shapeArgs.y,
                    h = bbox.height;
                return y + h / 2;
            }).call(shape, series, context);
        }
    };

    (Chart.graphers = Chart.graphers || {}).map = Chart.Map = Map;
    
})(typeof window !== "undefined" ? window : this, Dalaba.Chart);