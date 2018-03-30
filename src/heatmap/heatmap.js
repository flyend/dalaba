(function(global, Chart){
    var listFilter = List.filter,
        listFill = List.fill;
    var relayout = require("./layout").deps(Numeric);

    var Renderer = {
        gradient: function(fillColor){
            var canvas = document.createElement("canvas"),
                context = canvas.getContext("2d");
            var color, linearGradient;
            canvas.width = 256;
            canvas.height = 1;
            //Chart.scale(context, width, height, 1);
            if(defined(fillColor)){
                if(Color.isColor(fillColor)){
                    color = fillColor;
                }
                else if(defined(linearGradient = fillColor.linearGradient)){
                    var x1 = (linearGradient.x1 | 0),
                        y1 = (linearGradient.y1 | 0),
                        x2 = (linearGradient.x2 | 0),
                        y2 = (linearGradient.y2 | 0);
                    color = context.createLinearGradient(x1, y1, x2, y2);
                    (fillColor.stops).forEach(function(item){
                        color.addColorStop(item[0], item[1]);
                    });
                }
            }
            context.fillStyle = color;
            context.fillRect(0, 0, 256, 1);
            return context.getImageData(0, 0, 256, 1).data;
        },
        node: function(radius, blur){
            //var r2 = radius + radius * blur;
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            //canvas.width = canvas.height = radius * 2;
            Chart.scale(context, radius, radius, DEVICE_PIXEL_RATIO);

            if(blur == 1){
                context.fillStyle = "rgba(0,0,0,1)";
                context.beginPath();
                context.arc(radius / 2, radius / 2, radius / 2, 0, 2 * Math.PI, true);
                context.closePath();
                context.fill();
            }
            else{
                var g = context.createRadialGradient(
                    radius / 2, radius / 2,//start cx & cy
                    radius / 2 * blur,//start r
                    radius / 2, radius / 2,//end cx & cy
                    radius / 2//end r
                );
                g.addColorStop(0, "rgba(0,0,0,1)");
                g.addColorStop(1, "rgba(0,0,0,0)");
                context.fillStyle = g;
                context.fillRect(0, 0, radius, radius);
            }
            return canvas;
        },
        shadow: function(shapes, series, width, height){
            var canvas = document.createElement("canvas"),
                context = canvas.getContext("2d");
            var nodeCache = {};

            Chart.scale(context, width, height, DEVICE_PIXEL_RATIO);
            
            shapes.forEach(function(shape){
                var x = shape.x0,
                    y = shape.y0,
                    radius = shape.radius || series.radius || 0.1,
                    blur = series.blur || 0.05;
                var node;
                if(!nodeCache[radius]){
                    node = nodeCache[radius] = Renderer.node(radius, blur);
                }
                else
                    node = nodeCache[radius];
                
                context.globalAlpha = shape.alpha;
                //context.fillRect(0, 0, shadow.width, shadow.height);
                /*context.beginPath();
                context.arc(x + viewport.left, y + viewport.top, radius, 0, Math.PI * 2);
                context.fill();*/
                context.drawImage(
                    node,
                    x,
                    y,
                    node.width / DEVICE_PIXEL_RATIO,
                    node.height / DEVICE_PIXEL_RATIO
                );
            });
            return canvas;
        },
        buffer: function(canvas, series){
            var opacity = 0;
            var useGradient = false;
            var context = canvas.getContext("2d");

            var colors = Renderer.gradient(series.fillColor);

            var buffer = context.getImageData(0, 0, canvas.width, canvas.height);
            var pixels = buffer.data,
                length = pixels.length;
            
            for(var i = 3; i < length; i += 4){
                var pixel = pixels[i];
                var index = pixel << 2;
                if(index){
                    var r = colors[index],
                        g = colors[index + 1],
                        b = colors[index + 2],
                        a;
                    if(opacity > 0){
                        a = opacity;
                    }
                    else{
                        a = Math.min(0xff, Math.max(pixel, 0));
                    }
                    pixels[i] = useGradient ? colors[index + 3] : a;//a
                    pixels[i - 1] = b;
                    pixels[i - 2] = g;
                    pixels[i - 3] = r;
                }
            }
            //buffer.data = pixels;
            context.putImageData(buffer, 0, 0);
            return canvas;
        }
    };

    function Heatmap(canvas, options){
        this.type = "heatmap";

        this.canvas = canvas;
        this.context = canvas.getContext("2d");

        this.series = [];
        this.init(options);
    }
    Heatmap.prototype = {
        constructor: Heatmap,
        init: function(options){
            var type = this.type;
            this.options = extend({}, options);
            this.series = listFilter(pack("array", options.series, []), function(series){
                return series.selected !== false && series.type === type;
            });
            this.tables = new Array(listFill(Math.ceil(options.chart.width), []));
            
            relayout(type, this.options);
        },
        draw: function(){
            var context = this.context,
                chart = this;
            var options = this.options;
            var width = options.chart.width,
                height = options.chart.height,
                left = options.chart.spacing[3],
                top = options.chart.spacing[0];

            this.series.forEach(function(series){
                var shapes = series.shapes;
                if(defined(series.coordinate) || isObject(shapes[0].source)){
                    var shadow = Renderer.buffer(
                        Renderer.shadow(shapes, series, width + left, height + top),
                        series
                    );
                    context.save();
                    context.drawImage(
                        shadow,
                        0,
                        0,
                        shadow.width / DEVICE_PIXEL_RATIO,
                        shadow.height / DEVICE_PIXEL_RATIO
                    );
                    context.restore();
                }
                else{
                    shapes.forEach(function(shape){
                        chart.drawShape(context, shape, series);
                    });
                    shapes.forEach(function(shape){
                        chart.dataLabels(context, shape, series);
                    });
                }
            });
        },
        redraw: function(){
            relayout(this.type, this.options);
            this.draw();
        },
        drawShape: function(context, shape, series){
            var x0 = shape.x0,
                y0 = shape.y0,
                x1 = shape.x1,
                y1 = shape.y1;
            var setBorder = function(borderWidth, borderColor){
                context.beginPath();
                context.lineWidth = borderWidth;
                context.strokeStyle = borderColor;
                context.moveTo(x0 + borderWidth / 2, y0);
                context.lineTo(x0 + borderWidth / 2, y1 - borderWidth / 2);//bottom
                context.lineTo(x1 - borderWidth / 2, y1 - borderWidth / 2);//right
                context.lineTo(x1 - borderWidth / 2, y0 + borderWidth / 2);//top
                context.lineTo(x0 + borderWidth / 2, y0 + borderWidth / 2);//left
                context.stroke();
            };
            if(shape.value === null){
                return;
            }
            var color = shape.color;
            if(isObject(color) && defined(color.stops) && isArray(color.stops)){
                var linearGradient = context.createLinearGradient(Math.abs(x1 - x0), y1, Math.abs(x1 - x0), y0);
                color.stops.forEach(function(item){
                    if(isNumber(item[0]) && typeof item[1] === "string")
                        linearGradient.addColorStop(item[0], item[1]);
                });
                color = linearGradient;
            }
            
            context.save();
            context.fillStyle = color;
            context.beginPath();
            context.moveTo(x0, y0);
            context.lineTo(x0, y1);
            context.lineTo(x1, y1);
            context.lineTo(x1, y0);
            context.lineTo(x0, y0);
            //context.fillRect(x0, y0, Math.abs(x0 - x1), Math.abs(y1 - y0));
            context.fill();
            if(defined(shape.current)){
                setBorder(series.borderWidth || 1, series.borderColor);
            }
            if(defined(series.borderWidth) && series.borderWidth > 0){
                setBorder(series.borderWidth, series.borderColor);
            }
            context.restore();
        },
        dataLabels: function(context, shape, series){
            dataLabels.align(function(type, bbox){
                var t = pack("string", type, "center");
                var w = bbox.width,
                    w2 = Math.abs(shape.x1 - shape.x0);
                return {
                    left: shape.x0,
                    center: shape.x0 + (w2 / 2) - w / 2,
                    right: shape.x1 - w
                }[t];
            }).vertical(function(type, bbox){
                var t = pack("string", type, "middle");
                var h = bbox.height,
                    h2 = Math.abs(shape.y1 - shape.y0);
                return {
                    top: shape.y0 + h,
                    middle: shape.y0 + h + (h2 - h) / 2,
                    bottom: shape.y1
                }[t];
            }).call(shape, series, context);
        },
        getShape: function(x, y){
            var series = this.series,
                length = series.length,
                shapeLength;
            var shapes, shape, item;
            var ret = [];
            function reset(shapes){
                shapes.forEach(function(item){
                    delete item.current;
                });
            }
            //[i / M + i % N]
            //var xy = ~~(x / width + y % height);
            if(defined(this.tables[x]) && defined(this.tables[x][y]))
                return this.tables[x][y];

            for(var i = 0; i < length; i++){
                item = series[i];
                reset(shapes = item.shapes);
                shapeLength = shapes.length;
                for(var j = 0; j < shapeLength; j++){
                    shape = shapes[j];
                    if(shape.value === null){
                        continue;
                    }
                    if(Intersection.rect(
                        {x: x, y: y},
                        {x: shape.x0, y: shape.y0, width: shape.x1, height: shape.y1}
                    )){
                        shape.current = j;
                        if(isNumber(shape._x) && isNumber(shape._y)){
                            shape.$value = shape._x + ", " + shape._y + ", " + shape.value;
                        }
                        else{
                            shape.$value = shape.value;
                        }
                        ret.push({
                            shape: shape,
                            series: item
                        });
                        if(defined(this.tables[x]))
                            this.tables[x][y] = ret;
                        return ret;                        
                    }
                }
            }
            return ret;
        }
    };

    (Chart.graphers = Chart.graphers || {}).heatmap = Chart.Heatmap = Heatmap;
})(typeof window !== "undefined" ? window : this, Dalaba.Chart);