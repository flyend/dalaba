(function(global, Chart){
    
    var relayout = require("./layout").deps(Dalaba.geo, Color);
    /*
     * Class Map
    */
    function Map(canvas, options) {
        this.type = "map";

        this.series = [];

        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        
        this.init(options);
    }
    Map.prototype = {
        constructor: Map,
        init: function(options) {
            var type = this.type;
            this.options = extend({}, options);

            this.series = arrayFilter(pack("array", this.options.series, []), function(item){
                var f = item.selected !== false
                    && (item.type === type);
                if(f){
                    var mapKey = {};
                    item.data.forEach(function(d){
                        if(defined(d.name)){
                            mapKey[d.name] = d;
                        }
                    });
                    item.mapKey = mapKey;
                }
                return f;
            });
            relayout(type, this.options);
        },
        draw: function(){
            var context = this.context,
                chart = this;
              
            this.series.forEach(function(series){
                var shapes = series.shapes;
                if(defined(series.mapData)){
                    shapes.forEach(function(shape){
                        chart.drawShape(context, shape, series);
                    });
                    shapes.forEach(function(shape){
                        chart.drawLabels(context, shape, series);
                    });
                }
            });
        },
        redraw: function(){
            relayout(this.type, this.options);
            this.draw();
        },
        drawShape: function(context, shape, series) {
            var borderWidth = pack("number", series.borderWidth, 0),
                borderColor = pack("string", series.borderColor, "#FFFFFF"),
                fillColor = series.fillColor || shape.color || "#f7f7f7";
            var points = shape.points;
            var shapeArgs = shape.shapeArgs;
            var gradient;

            if (fillColor.linearGradient || fillColor.radialGradient) {
                var s0 = (shapeArgs.maxX - shapeArgs.x) / 2,
                    s1 = (shapeArgs.maxY - shapeArgs.y) / 2;
                gradient = Color.parse(fillColor);
                fillColor = fillColor.radialGradient
                    ? gradient.radial(shapeArgs.x, shapeArgs.y, Math.sqrt(s0 * s0 + s1 * s1) / 4)
                    : gradient.linear(0, 0, s0, s1);
            }

            if (isNumber(shape.current) && shape.current !== -1) {
                !shape.isNULL
                    ? (fillColor = Color.parse(fillColor).alpha(0.75).rgba())
                    : (fillColor = "rgb(79, 134, 189)");
            }

            context.save();
            context.beginPath();
            points.forEach(function(point, i){
                context[i && !point.isNext ? "lineTo" : "moveTo"](point.x, point.y);
            });
            context.closePath();
            context.fillStyle = fillColor;

            if (defined(series.shadowColor)) {
                context.shadowColor = series.shadowColor;
                isNumber(series.shadowBlur) && (context.shadowBlur = series.shadowBlur);
                isNumber(series.shadowOffsetX) && (context.shadowOffsetX = series.shadowOffsetX);
                isNumber(series.shadowOffsetY) && (context.shadowOffsetY = series.shadowOffsetY);
            }

            context.fill();
            (context.lineWidth = borderWidth) > 0 && (
                context.strokeStyle = borderColor,
                context.stroke()
            );
            context.restore();
        },
        getShape: function(x, y){
            var series,
                shapes,
                shape;
            var ret = [];

            function reset(shapes){
                shapes.forEach(function(item){
                    delete item.current;
                });
            }

            for(var i = 0, n = this.series.length; i < n; i++){
                reset(shapes = (series = this.series[i]).shapes);
                for(var j = 0; j < shapes.length; j++){
                    shape = shapes[j];
                    if(Intersection.polygon({
                        x: x,
                        y: y
                    }, shape.points)){
                        shape.$value = shape.isNULL ? "--" : "" + shape.value;
                        ret.push({shape: shape, series: series});
                        shape.current = j;
                        break;
                    }
                }
            }
            var diffData = [],
                diffMaps = {};
            ret.forEach(function(item){
                var key = item.shape.name;
                if(!diffMaps.hasOwnProperty(key)){
                    diffMaps[key] = !0;
                    diffData.push(item);
                }
            });
            return diffData;
        },
        drawLabels: function(context, shape, series) {
            dataLabels.value(shape.name).align(function(type, bbox) {
                var x = shape.shapeArgs.x,
                    w = bbox.width;
                return x - w / 2;
            }).vertical(function(type, bbox) {
                var y = shape.shapeArgs.y,
                    h = bbox.height;
                return y + h / 2;
            }).call(shape, series, context);
        }
    };

    (Chart.graphers = Chart.graphers || {}).map = Chart.Map = Map;
    
})(typeof window !== "undefined" ? window : this, Dalaba.Chart);