(function (global, Dalaba) {
    var Chart = Dalaba.Chart || {};

    var mathRound = Mathematics.round;

    var hasOwnProperty = Object.prototype.hasOwnProperty;

    var defaultOptions = {
        style: {
            fontSize: "12px",
            fontWeight: "normal",
            fontFamily: "\"Lucida Grande\", \"Lucida Sans Unicode\", Arial, Helvetica, sans-serif",
            lineHeight: "normal",
            cursor: "pointer",
            color: "#606060"
        },
        x: undefined,
        y: undefined,
        width: undefined,
        height: 30,
        margin: 0,
        layout: "horizontal",//horizontal or vertical,
        verticalAlign: "bottom",//top, bottom, middle
        align: "center",//left, right or center
        floating: false,
        borderWidth: 1,
        borderColor: "#ccc",
        backgroundColor: "#fff",// "rgba(51,92,173,0.05)"
        handles: [{
            backgroundColor: "#f2f2f2",
            borderColor: "#999",
            shadowBlur: 2,
            shadowColor: "rgba(0, 0, 0, 0.6)",
            shadowOffsetX: 1,
            shadowOffsetY: 0
        }, {
            backgroundColor: "#f2f2f2",
            borderColor: "#999",
            shadowBlur: 2,
            shadowColor: "rgba(0, 0, 0, 0.6)",
            shadowOffsetX: -1,
            shadowOffsetY: 0
        }]
    };
    var setShadow = function (context, options) {
        defined(options.shadowColor) && (context.shadowColor = options.shadowColor);
        isNumber(options.shadowBlur) && (context.shadowBlur = options.shadowBlur);
        isNumber(options.shadowOffsetX) && (context.shadowOffsetX = options.shadowOffsetX);
        isNumber(options.shadowOffsetY) && (context.shadowOffsetY = options.shadowOffsetY);
    };

    var Symbol = {
        rect: function (x, y, size, height, options) {
            var color = options.borderColor,
                w = size,
                h = 15;
            var linePixel = fixLinePixel(x, y, w, h);
            return function (context) {
                var bw = 1;
                context.save();
                context.fillStyle = color;
                setShadow(context, options);
                context.fillRect(x, y, bw, height);
                x = linePixel.x, y = linePixel.y;
                w = linePixel.width, h = linePixel.height;
                
                context.translate(-w / 2 + bw, (height - h) / 2 - 1);
                context.lineWidth = 1;
                context.strokeStyle = color;
                context.fillStyle = options.backgroundColor;
                context.beginPath();
                context.moveTo(x, y);//left top
                context.lineTo(x + w, y);//right top
                context.lineTo(x + w, y + h);//right bottom
                context.lineTo(x, y + h);//left bottom
                context.lineTo(x, y);//close path
                setShadow(context, options);
                context.fill();
                context.stroke();

                context.beginPath();
                context.moveTo(x + 3, y + 3);
                context.lineTo(x + 3, y + h - 3);
                context.moveTo(x + w - 3, y + 3);
                context.lineTo(x + w - 3, y + h - 3);
                context.stroke();
                context.restore();
                return {
                    left: x - w / 2 + bw,
                    top: y,
                    width: w,
                    height: h
                };
            };
        }
    };

    function RangeSelector () {
        this.init.apply(this, arguments);
    }
    RangeSelector.prototype = {
        init: function (canvas, options) {
            this.options = extend({}, defaultOptions);
            extend(this.options, options);

            this.canvas = canvas;
            this.context = canvas.getContext("2d");

            this.x = pack("number", this.options.x, 0);
            this.y = pack("number", this.options.y, this.options.borderWidth, 0);
            this.height = pack("number", this.options.height, defaultOptions.height);
            this.width = pack("number", this.options.width, this.height * 2);
            
            this.start = pack("number", Math.max(0, Math.min(100, parseFloat(options.start, 10)), 0), 0);
            this.end = pack("number", Math.max(0, Math.min(100, parseFloat(options.end, 10))), 100);
            if (this.start > this.end) {
                var t = this.start;
                this.start = this.end;
                this.end = t;
            }
            this.start += "%";
            this.end += "%";

            this.from = Numeric.percentage(this.width, this.start) + this.x;
            this.to = Numeric.percentage(this.width, this.end) + this.x;

            this.minValue = pack("number", options.min, 0);
            this.maxValue = pack("number", options.max, 0);

            this.range = [];
            this.target = -1;

            this.dragging = false;

            //this.setValue();
        },
        setWidth: function (width) {
            this.width = pack("number", width, 0);
            console.log(width)
            this.from = Numeric.percentage(this.width, this.start) + this.x;
            this.to = Numeric.percentage(this.width, this.end) + this.x;
        },
        setValue: function () {
            var width = this.width,
                x =  this.x;
            var minValue = this.minValue,
                maxValue = this.maxValue,
                startValue = minValue + (maxValue - minValue) * ((this.from - x) / width),
                endValue = minValue + (maxValue - minValue) * ((this.to - x) / width);
            //var percent = (maxValue - minValue) / (width);
            //sync start & end
            startValue = minValue + (maxValue - minValue) * parseFloat(this.start, 10) / 100;// (this.from - x) * percent;
            endValue = minValue + (maxValue - minValue) * parseFloat(this.end, 10) / 100;// (this.to - x) * percent;
            if(startValue > endValue){
                x = startValue;
                startValue = endValue;
                endValue = x;
            }
            this.startValue = startValue;
            this.endValue = endValue;
        },
        startToEnd: function (start, end) {
            this.start = start;
            this.end = end;
            this.setWidth(this.width);
            this.draw();
        },
        setOptions: function (options) {
            extend(this.options, options);

            switch (true) {
                case hasOwnProperty.call(options, "min"):
                case hasOwnProperty.call(options, "max"):
                case hasOwnProperty.call(options, "width"):
                case hasOwnProperty.call(options, "x"):
                case hasOwnProperty.call(options, "y"):
                    isNumber(options.min) && (this.minValue = options.min);
                    isNumber(options.max) && (this.maxValue = options.max);
                    isNumber(options.x) && (this.x = pack("number", options.x, 0), this.setWidth(this.width - pack("number", options.x)));
                    isNumber(options.y) && (this.y = pack("number", options.y, 0));
                    defined(options.width) && this.setWidth(options.width);
                break;
                default:
                    
                break;
            }
            if (hasOwnProperty.call(options, "start") && hasOwnProperty.call(options, "end")) {
                this.startToEnd(options.start, options.end);
            }
            return this;
        },
        drawPlot: function () {
            var options = this.options,
                borderWidth = pack("number", options.borderWidth, 1),
                borderColor = options.borderColor;
            var width = this.width,
                height = this.height,
                x = this.x,
                y = this.y - borderWidth;
            var context = this.context;
            var linePixel = fixLinePixel(x, y, width, height, borderWidth);

            context.save();
            context.fillStyle = options.backgroundColor;
            context.beginPath();
            context.moveTo(linePixel.x, linePixel.y);
            context.lineTo(linePixel.x + linePixel.width, linePixel.y);
            context.lineTo(linePixel.x + linePixel.width, linePixel.y + linePixel.height);
            context.lineTo(linePixel.x, linePixel.y + linePixel.height);
            context.closePath();
                
            if (borderWidth > 0) {
                context.strokeStyle = borderColor;
                context.lineWidth = borderWidth;
                context.stroke();
            }
            if (defined(options.backgroundColor)) {
                context.fill();
            }
            context.fillRect(linePixel.x, linePixel.y, 0, height);
            context.clip();
            context.restore();
        },
        drawNavigator: function () {
            var options = this.options,
                borderWidth = pack("number", options.borderWidth, 1),
                handles = (isArray(handles = options.handles) ? handles : [handles]),
                handle;
            var height = this.height,
                y = this.y;
            var context = this.context;
            var startX = this.from,// interpolate(this.start, 0, 100, x, width),
                endX = this.to;// interpolate(this.end, 0, 100, x, width);
            var z0 = {x: startX, y: y},
                z1 = {x: endX, y: y};
            if (startX > endX) {
                z0 = {x: endX, y: y};
                z1 = {x: startX, y: y};
            }
            context.save();
            context.fillStyle = "rgba(51,92,173,0.2)";
            context.fillRect(z0.x, y, z1.x - z0.x, height);
            handle = handles[0] || {};
            z0.viewport = handle.enabled !== false ? Symbol.rect(z0.x, z0.y, 8, height, handle)(context) : {};
            handle = handles[1] || handle;
            z1.viewport = handle.enabled !== false ? Symbol.rect(z1.x, z1.y, 8, height, handle)(context) : {};
            context.restore();
            this.range = [z0, z1];
        },
        drawSeries: function() {
            var options = this.options;
            var context = this.context;
            var tx,
                ty = this.y,
                width,
                height = this.height;
            var selector = this;
            var getDataValue = function (item) {
                var value = item;
                if (isArray(item)) {
                    value = { value: item[1] };
                }
                if (!isObject(item)) {
                    value = { value: item };
                }
                return isNumber(value.value, true) ? value.value : isString(value.value) ? Numeric.valueOf(value.value) : null;
            };
            var plotX = MIN_VALUE,
                plotWidth = plotX;

            if (hasOwnProperty.call(options, "series") && options.series.length) {
                options.series.forEach(function (series) {
                    plotX = Math.max(plotX, series.plotX);
                    plotWidth = mathMax(plotWidth, pack("number", series.plotWidth, selector.width));
                });
                this.x = plotX;
                this.setWidth(plotWidth);
            }
            tx = this.x;
            width = this.width / (options.series.length || 1);
            options.series.forEach(function (series, index) {
                var x, y;
                var data = series.data;
                var length = data.length,
                    i = 0, j;
                var dx = index * width;
                var minValue,
                    maxValue;
                var startX, startY, isNull = false;
                var size = width / ~-length,
                    value;

                while (value = getDataValue(data[i]), !isNumber(value) && ++i < length);
                while (value = getDataValue(data[length - 1]), !isNumber(value) && --length > 0);
                //console.log(i, length);
                minValue = maxValue = value = getDataValue(data[j = i]);
                for (j = i + 1; j < length; j++) {
                    value = getDataValue(data[j]);
                    isNumber(value) && (minValue > value && (minValue = value), maxValue < value && (maxValue = value));
                }
                if (maxValue - minValue === 0)
                    return;
                context.save();            
                context.beginPath();
                context.moveTo(
                    startX = tx + dx + i * size,
                    startY = ty + interpolate(getDataValue(data[i]), minValue, maxValue, height, 0)
                );
                for(; i < length; i++){
                    value = getDataValue(data[i]);
                    x = i * size + dx + tx;
                    if (!isNumber(value)) {
                        isNull = isNull || !isNull;
                        j = i + 1;
                        do {
                            value = getDataValue(data[j]);
                        } while (!isNumber(value) && j++ < length);
                        context.moveTo(j * size + dx + tx, ty + interpolate(value, minValue, maxValue, height, 0));
                    }
                    y = ty + interpolate(value, minValue, maxValue, height, 0);
                    context.lineTo(x, y);
                }
                context.lineWidth = 1;
                context.strokeStyle = "#afb8bc";
                context.stroke();
                isNull || (
                    context.lineTo(x, ty + height),
                    context.lineTo(startX, ty + height),
                    context.lineTo(startX, startY),
                    context.fillStyle = "#e2e4e5",
                    context.fill()
                );

                context.restore();
            });
        },
        getTarget: function (x, y) {
            var range = this.range,
                height = this.height,
                startZoom,
                endZoom,
                size;
            var target = -1;
            if(!this.range.length){
                return target;
            }
            startZoom = range[0].viewport;
            endZoom = range[1].viewport;
            size = range[1].x - range[0].x;
            if(Intersection.rect(
                {x: x, y: y},
                {x: range[0].x, y: this.y, width: range[0].x + size, height: this.y + height}
            )){
                target = 0;
            }
            if(Intersection.rect(
                {x: x, y: y},
                {x: startZoom.left, y: startZoom.top, width: startZoom.left + startZoom.width, height: startZoom.top + this.height}
            )){
                target = 1;
            }
            else if(Intersection.rect(
                {x: x, y: y},
                {x: endZoom.left, y: endZoom.top, width: endZoom.left + endZoom.width, height: endZoom.top + height}
            )){
                target = 2;
            }
            return target;
        },
        getCursor: function (x, y) {
            var cursor = null;
            var target = this.getTarget(x, y);
            if(target === 0)
                cursor = "move";
            if(target === 1 || target === 2)
                cursor = "ew-resize";
            this.hasRange = target > -1 && target < 3;
            return cursor;
        },
        getRangeValue: function () {
            var options = this.options,
                style = options.style || {},
                fontStyle = {
                    fontStyle: style.fontStyle || "normal",
                    fontSize: style.fontSize || "12px",
                    fontWeight: style.fontWeight || "normal",
                    fontFamily: style.fontFamily || "Arial",
                    lineHeight: style.lineHeight || "normal",
                    color: style.color
                };
            var height = this.height,
                y = this.y,
                fontSize = pack("number", parseFloat(fontStyle.fontSize, 10) * 0.8);
            var range = this.range,
                z0 = range[0].viewport,
                z1 = range[1].viewport;
            var startValue = parseFloat(this.start, 10),
                endValue = parseFloat(this.end, 10);
            if(startValue > endValue){
                var t = startValue;
                startValue = endValue;
                endValue = t;
            }
            startValue = pack("string",
                options.startValue,
                parseFloat(Numeric.toPrecision(this.startValue, 8), 10),
                mathRound(startValue, 3) + "%",
                "0"
            );
            endValue = pack("string",
                options.endValue,
                parseFloat(Numeric.toPrecision(this.endValue, 8), 10),
                mathRound(endValue, 3) + "%",
                "0"
            );
            var context = this.context;

            this.setValue();
            if (this.hasRange || this.dragging) {
                context.save();
                context.fillStyle = fontStyle.color;
                context.font = [fontStyle.fontStyle, fontStyle.fontWeight,
                    fontStyle.fontSize + "/" + fontStyle.lineHeight, fontStyle.fontFamily].join(" ");
                //context.textBaseline = "top";
                context.textAlign = "right";
                context.fillText(startValue, range[0].x - z0.width / 2, y + fontSize + (height - fontSize) / 2);
                context.textAlign = "left";
                context.fillText(endValue, range[1].x + z1.width / 2, y + fontSize + (height - fontSize) / 2);
                context.restore();
            }
        },
        draw: function () {
            this.drawPlot();
            this.drawSeries();
            this.drawNavigator();
            this.getRangeValue();
        },
        onStart: function(x, y, e){
            var target;
            var start = parseFloat(this.start, 10),
                end = parseFloat(this.end, 10),
                t;
            x = Event.normalize(e, this.canvas);
            y = x.y;
            x = x.x;
            this.dragging = (target = this.target = this.getTarget(x, y)) > -1 && target < 3;
            this.dx = x - this.range[0].x;
            if(this.from > this.to){
                t = this.from;
                this.from = this.to;
                this.to = t;
            }
            if(start > end){
                t = this.start;
                this.start = this.end;
                this.end = t;
            }
        },
        onDrag: function(x, y, callback){
            var width = this.width;
            var range = this.range,
                z0 = range[0],
                z1 = range[1],
                startZoom = z0.viewport,
                endZoom = z1.viewport;
            var start, end;
            var target = this.target;
            var size = z1.x - z0.x,
                dx, sx, ex;

            if (!this.dragging)
                return;

            if (target === 1) {
                dx = startZoom.left + (x - startZoom.left);
                this.from = Math.min(width + this.x, Math.max(this.x, dx));
                this.start = Math.max(0, Math.min(1, (dx - this.x) / width)) * 100 + "%";
            }
            else if (target === 2) {
                dx = endZoom.left + (x - endZoom.left);
                this.to = Math.min(width + this.x, Math.max(this.x, dx));
                this.end = Math.max(0, Math.min(1, (dx - this.x) / width)) * 100 + "%";
            }
            else if (target === 0) {
                dx = x - this.dx;// + this.ax;
                sx = dx;
                ex = dx + size;
                if (sx <= this.x){
                    sx = this.x;
                    ex = sx + size;
                }
                else if (ex >= this.width + this.x) {
                    ex = this.width + this.x;
                    sx = ex - size;
                }
                this.from = sx;
                this.to = ex;
                this.start = Math.max(0, Math.min(1, (sx - this.x) / width)) * 100 + "%";
                this.end = Math.max(0, Math.min(1, (ex - this.x) / width)) * 100 + "%";
            }
            start = parseFloat(this.start, 10), end = parseFloat(this.end, 10);
            if (start > end) {
                dx = start;
                start = end;
                end = dx;
            }

            target > -1 && target < 3 && callback && callback.call(this, this.startValue, this.endValue, start + "%", end + "%");
        },
        onDrop: function (x, y, callback) {
            this.target >-1 && this.target < 3 && callback && callback.call(this);
            this.dragging = false;
            this.target = -1;
            delete this.hasRange;
        }
    };

    if (defined(Chart)) {
        Chart.RangeSelector = RangeSelector;
    }
})(typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this, Dalaba);