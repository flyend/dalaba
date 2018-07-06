(function (global, Dalaba) {

    var Chart = Dalaba.Chart;

    var Animate = Chart.Animate;

    var angle2arc = Chart.angle2arc;

    var stringPad = Formatter.String.padding;

    var numberFormat = Formatter.String.numberFormat;

    var ONE_DAY = 864E5;
    /*millisecond:"%A, %b %e, %H:%M:%S.%L",
    second:"%A, %b %e, %H:%M:%S",
    minute:"%A, %b %e, %H:%M",
    hour:"%A, %b %e, %H:%M",
    day:"%A, %b %e, %Y",
    week:"Week from %A, %b %e, %Y",
    month:"%B %Y",
    year:"%Y"*/

    var dateTypes = {
        millisecond: {
            interval: 1,
            format: function (timestamp) {
                var date = new Date(timestamp);
                return [
                    stringPad(date.getMinutes(), "0"), ":",
                    stringPad(date.getSeconds(), "0"), ".",
                    ("" + date.getMilliseconds()).substr(0, 3)
                ].join("");
            },
        },
        second: {
            interval: 1E3,
            format: function (timestamp) {
                var date = new Date(timestamp);
                return [
                    stringPad(date.getHours(), "0"), ":",
                    stringPad(date.getMinutes(), "0"), ":",
                    stringPad(date.getSeconds(), "0")
                ].join("");
            }
        },
        minute: {
            interval: 6E4,
            format: function (timestamp){
                var date = new Date(timestamp);
                return [
                    stringPad(date.getHours(), "0"), ":",
                    stringPad(date.getMinutes(), "0")
                ].join("");
            }
        },
        hour: {
            interval: 36E5,
            format: function(timestamp){
                var date = new Date(timestamp);
                return [
                    stringPad(date.getHours(), "0"), ":",
                    stringPad(date.getMinutes(), "0"),
                    //stringPad(date.getSeconds(), "0")
                ].join("");
            }
        },
        day: {
            interval: ONE_DAY,
            format: function (timestamp){
                var date = new Date(timestamp),
                    year = date.getFullYear(),
                    month = date.getMonth(),
                    day = date.getDate();
                return [
                    year, "/",
                    stringPad(month + 1, "0"), "/",
                    stringPad(day, "0")
                ].join("");
            }
        },
        week: {
            interval: 7 * ONE_DAY,
            format: function (timestamp){
                var date = new Date(timestamp),
                    year = date.getFullYear(),
                    day = date.getDate(),
                    week = date.getDay() === 0 ? 7 : date.getDay();
                date.setDate(date.getDate() + 4 - week);
                week = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 1, -6)) / ONE_DAY);
                week = ~~(week / 7) + 1;
                return [
                    year, "W",
                    stringPad(week, "0"), "D",
                    stringPad(day, "0")
                ].join("");
            }
        },
        month: {
            interval: 30 * ONE_DAY,
            format: function (timestamp) {
                var date = new Date(timestamp),
                    year = date.getFullYear(),
                    month = date.getMonth();
                return [
                    year, "/",
                    stringPad(month + 1, "0"),
                ].join("");
            }
        },
        year: {
            interval: 365 * ONE_DAY,
            format: function (timestamp) {
                var date = new Date(timestamp);
                return date.getFullYear();
            }
        }
    };

    var lg10ln = function (n) {
        return Math.pow(10, Math.floor(Math.log(n) / Math.LN10));
    };

    var numberic2value = function (value, numericSymbols) {
        var i = numericSymbols.length;
        var ret,
            multi;
        var v = Math.abs(value);
        if (i && v >= 1000) {
            while (i-- && !defined(ret)) {
                multi = Math.pow(1000, i + 1);
                if (v >= multi && numericSymbols[i] !== null) {
                    ret = numberFormat((v * 10) % multi === 0 ? v / multi : (Math.round(v / multi * 100) / 100), null) + numericSymbols[i];
                }
            }
            if (defined(ret)) {
                ret = (value < 0 ? "-" : "") + ret;
            }
        }
        else if (!defined(ret)) {
            ret = numberFormat(value, null, undefined);
        }
        return ret;
    };
    var date2value = function (value, type) {
        var format = dateTypes[type];
        return format.format ? format.format(value) : value;
    };

    var symbolCallout = function (x, y, w, h, options) {
        var arrow = options.arrowLength || 10,
            anchor = options.anchor ||  "left";
        var path = [
            {x: x, y: y},//left(O)
            {x: x + w, y: y},//top
            {x: x + w, y: y + h},//right
            {x: x, y: y + h},//bottom
            {x: x, y: y + h / 2 + arrow},//triangle left bottom(2/3), default left
            {x: x - arrow, y: y + h / 2},//triangle left middle(2)
            {x: x, y: y + h / 2 - arrow},//triangle left top(1/3)
            {x: x, y: y}//left(O)
        ];
        if (anchor === "top") {
            path.splice(1, path.length, 
                {x: x + w / 2 - arrow, y: y},//triangle top left
                {x: x + w / 2, y: y - arrow},//triangle top middle
                {x: x + w / 2 + arrow, y: y},//triangle top right
                {x: x + w, y: y},
                {x: x + w, y: y + h},
                {x: x, y: y + h},
                {x: x, y: y}
            );
        }
        else if (anchor === "bottom") {
            path.splice(3, path.length,
                {x: x + w / 2 + arrow, y: y + h},
                {x: x + w / 2, y: y + h + arrow},
                {x: x + w / 2 - arrow, y: y + h},
                {x: x, y: y + h},
                {x: x, y: y}
            );
        }
        return function (context) {
            context.beginPath();
            context.moveTo((path[0].x), (path[0].y));
            path.forEach(function (p) {
                context.lineTo((p.x), (p.y));
            });
        };
    };

    var defaultOptions = {
        enabled: true,
        type: "linear",
        title: {
            align: "middle",//"low", "middle" by default, "high"
            enabled: true,
            margin: 5,
            offset: undefined,
            rotation: 0,
            style: {
                fontWeight: "normal",
                fontSize: "12px",
                color: "#707070"
            },
            text: "Axis Values",
            x: 0,
            y: 0
        },
        labels: {
            align: "center",
            verticalAlign: undefined,
            style: {
                fontSize: "12px",
                fontWeight: "normal",
                color: "#606060"
            },
            padding: 5,
            autoRotation: -45,
            formatter: undefined,
            //step: hasTouch ? 3 : undefined,
            size: 30,
            x: 0,
            y: 0
        },
        logarithmic: {
            base: 10
        },
        lineColor: "rgba(0,0,0,.5)",
        lineWidth: 1,
        gridLineColor: "rgba(0,0,0,.2)",
        gridLineWidth: 1,
        gridLineDashStyle: "solid",
        min: undefined,
        max: undefined,
        tickInterval: 1,
        tickLength: 6,
        tickWidth: 1,
        opposite: false,
        reversed: false,
        lang: {
            numericSymbols: ["k", "M", "G", "T", "P", "E"],
            decimalPoint: "."
        },
        x: 0,
        y: 0,
        layout: "vertical",
        verticalAlign: "top",
        floating: undefined,
        angleOptions: {

        }
    };

    function Axis () {
        this.init.apply(this, arguments);
    }
    Axis.prototype = {
        constructor: Axis,
        Item: function () {
            var options = this.options,
                labels = options.labels || {},
                autoRotation = pack("number", labels.autoRotation, -45),
                tickLength = pack("number", options.tickLength, 0),
                tickWidth = pack("number", options.tickWidth, 0),
                lineWidth = pack("number", options.lineWidth, 0),
                gridLineWidth = pack("number", options.gridLineWidth, 0),
                gridLineInterpolation = options.gridLineInterpolation,
                opposite = !!options.opposite,
                crosshair = options.crosshair,
                style = pack("object", labels.style, {}),
                fontStyle = {
                    fontStyle: style.fontStyle || "normal",
                    fontWeight: style.fontWeight || "normal",
                    fontSize: style.fontSize || "12px",
                    fontFamily: style.fontFamily || "Arial",
                    lineHeight: style.lineHeight || "normal",
                    color: style.color
                };
            var isCategories = this.type !== "linear" && defined(options.categories) && !!options.categories.length;
            if (fontStyle.fontFamily === "inherit") {
                fontStyle.fontFamily = getStyle(this.canvas, "font-family") || "Arial";
            }

            var context = this.context,
                name = this.name;
            var minRange = this.minRange,
                maxRange = this.maxRange;
            var tx = pack("number", options.x),
                ty = pack("number", options.y);
            var axis = this;

            var setAlign = function (x, maxLabelWidth, width) {
                return {
                    left: x - (maxLabelWidth - width),
                    center: x,
                    right: x + (maxLabelWidth - width)
                };
            };
            var lineTo = function (context, x, y, w, h, options) {
                var lineWidth = options.lineWidth || 1,
                    dashStyle = (options.dashStyle || "solid").toLowerCase();
                context.beginPath();
                context.lineWidth = lineWidth;
                context.strokeStyle = options.lineColor;
                if (defined(DashLine[dashStyle]) && dashStyle !== "solid") {
                    DashLine[dashStyle](context, x, y, w, h);
                }
                else {
                    context.moveTo(x, y);
                    context.lineTo(w, h);
                    context.stroke();
                }
            };

            function tick () {

            }
            tick.line = function () {
                var tx = pack("number", options.x, 0),
                    ty = pack("number", options.y, 0);
                var lineColor = options.lineColor,
                    lineDashStyle = options.lineDashStyle;
                var zeroAxis = axis.zeroAxis,
                    linePixel;
                var center = options.center,
                    radius = options.size,
                    cx, cy;
                var startAngle = pack("number", options.startAngle, -90);
                
                context.save();
                if (lineWidth > 0) {
                    linePixel = fixLinePixel(tx, ty - tickWidth / 2, tx, ty + maxRange + tickWidth, lineWidth);
                    if (name === "xAxis") {
                        linePixel = fixLinePixel(tx, ty, tx + maxRange, ty + lineWidth, lineWidth);
                    }
                    if (name === "yAxis" || name === "xAxis") {
                        lineTo.apply(null, [context, linePixel.x, linePixel.y].concat(
                            name === "yAxis"
                            ? [linePixel.x, linePixel.height]
                            : [linePixel.width, linePixel.y]
                        , [{
                            lineWidth: lineWidth,
                            lineColor: lineColor,
                            dashStyle: lineDashStyle
                        }]));
                        if (!zeroAxis.hidden && false) {
                            linePixel = fixLinePixel.apply(null,
                                name === "xAxis"
                                ? [tx + zeroAxis.x, ty, tx + zeroAxis.x, ty - options.height * !opposite, 1]
                                : [tx, ty + zeroAxis.y, tx + options.width * !opposite, ty + zeroAxis.y, 1]
                            );
                            lineTo.apply(null, [context, linePixel.x, linePixel.y].concat(
                                name === "xAxis"
                                    ? [linePixel.x, linePixel.height]
                                    : [linePixel.width, linePixel.y]
                                , [{
                                    lineWidth: lineWidth,
                                    lineColor: Color.parse(lineColor).alpha(0.45).rgba()
                                }]
                            ));
                        }
                    }
                    else if (name === "polarAxis" && center) {
                        cx = center[0], cy = center[1];
                        context.beginPath();
                        if (gridLineInterpolation === "polygon") {
                            axis.ticks.forEach(function (tick, i) {
                                context[i ? "lineTo" : "moveTo"](
                                    MathCos(tick.angle * PI / 180) * radius + cx,
                                    MathSin(tick.angle * PI / 180) * radius + cy
                                );
                            });
                            context.closePath();
                        }
                        else {
                            if (defined(lineDashStyle)) {
                                DashLine.arc(context, cx, cy, radius, 0, PI2, lineDashStyle);
                            }
                            else {
                                context.arc(cx, cy, radius, 0, PI2);
                            }
                        }
                        context.lineWidth = lineWidth;
                        context.strokeStyle = lineColor;
                        context.stroke();
                    }
                    else if (name === "radiusAxis" && center) {
                        cx = center[0], cy = center[1];
                        startAngle = startAngle * PI / 180;
                        context.moveTo(cx, cy);
                        context.lineTo(Math.cos(startAngle) * radius + cx, Math.sin(startAngle) * radius + cy);
                        context.lineWidth = lineWidth;
                        context.strokeStyle = lineColor;
                        context.stroke();
                    }
                }
                context.restore();
            };
            tick.crosshair = function (tick) {
                var x, x1, y, y1, size;
                var width = options.width,
                    height = options.height;
                var color, margin;
                if (defined(crosshair) && tick) {
                    x = tick.x + tx, y = tick.y + ty, y1 = y - (size = tick.size), x1 = x - size;
                    color = crosshair.color || "rgba(41, 121, 255, 0.08)";
                    margin = mathMin(size, mathMax(0, pack("number", crosshair.margin, Numeric.percentage(size, crosshair.margin), 0)));
                    context.save();
                    context.beginPath();
                    ({
                        "xAxis": [[x - margin, ty], [x - margin, ty - height], [x1 + margin, ty - height], [x1 + margin, ty]],
                        "yAxis": [[x, y - margin], [x + width, y - margin], [x + width, y1 + margin], [x, y1 + margin]]
                    }[axis.name] || []).forEach(function (point, i) {
                        context[i ? "lineTo" : "moveTo"].apply(context, point);
                    });
                    context.closePath();
                    context.fillStyle = color;
                    context.fill();
                    //context.stroke()
                    context.restore();
                }
            };
            tick.plotLines = function () {
                var plotLines = isArray(options.plotLines) ? options.plotLines : [];
                var values = axis.values;
                var maxRange = axis.maxRange;
                var linePixel;
                var labelHTML = "";
                var center = function (p0) {
                    return p0;//isCategories && this.ticks.length ? p0 + (this.ticks[0].size - lineWidth) / 2 : p0;
                };
                var setAlign = function (type, x, bbox) {
                    var w2 = options.width,
                        w = bbox.width;
                    if (axis.name === "xAxis") {
                        w2 = bbox.width;
                        w *= 2;
                    }
                    return {
                        left: x,
                        center: x + (w2 - w) / 2,
                        right: x + w2 - w
                    }[type] || x;
                };
                var setVAlign = function (type, y, bbox) {
                    var h2 = pack("number", options.height, bbox.height * 2),
                        h = bbox.height;
                    if (axis.name === "xAxis") {
                        h2 = options.height;
                        h = -h;
                    }
                    return {
                        top: y,
                        middle: y + (h2 - h) / 2,
                        bottom: y + h2 - h
                    }[type] || y;
                };

                var filterPlotlines = function (plotLines, notValues) {
                    return arrayFilter(plotLines, function (line) {
                        var f;
                        return !(f = isNumber(line.value, true) || line.defaultZero === true) && notValues.push(line), f;
                    });
                };

                var addPlotline = function (d, linePixel) {
                    var lineWidth = pack("number", d.width, 1),
                        label = d.label,
                        value = d.value;
                    var style, fontStyle;
                    var x, y;
                    var bbox;
                    
                    x = linePixel.x, y = linePixel.y;

                    if (lineWidth > 0 && caller[2](linePixel)) {
                        lineTo(context, x, y, linePixel[caller[0][0]], linePixel[caller[0][1]], {
                            lineColor: d.color,
                            lineWidth: lineWidth,
                            dashStyle: d.dashStyle
                        });
                    }
                    if (label && defined(label.text)) {
                        style = label.style || {};
                        fontStyle = {
                            fontStyle: style.fontStyle || "normal",
                            fontWeight: style.fontWeight || "normal",
                            fontSize: style.fontSize || "12px",
                            fontFamily: style.fontFamily || "Arial",
                            lineHeight: style.lineHeight || "normal",
                            color: style.color
                        };
                        if (label.useHTML === true) {
                            if (label.dom) {
                                label.dom.innerHTML = label.text;
                                setStyle(label.dom, label.style || {});
                                bbox = label.dom.getBoundingClientRect();
                                setStyle(label.dom, {
                                    position: "absolute",
                                    left: setAlign(label.align, x, bbox) + pack("number", label.x) + "px",
                                    top: setVAlign(label.verticalAlign, y - bbox.height, bbox) + pack("number", label.y) + "px"
                                });
                            }
                        }
                        else {
                            context.font = [
                                fontStyle.fontStyle,
                                fontStyle.fontWeight,
                                fontStyle.fontSize + "/" + fontStyle.lineHeight,
                                fontStyle.fontFamily
                            ].join(" ");
                            bbox = Text.measureText(label.text, fontStyle);
                            context.fillStyle = fontStyle.color;
                            context.fillText(
                                label.text,
                                setAlign(label.align, x, bbox) + pack("number", label.x),
                                setVAlign(label.verticalAlign, y, bbox) + pack("number", label.y)
                            );
                        }
                    }
                };

                var notPlotlines, plotlines = filterPlotlines(plotLines, notPlotlines = []);

                var caller = {
                    xAxis: [
                        ["x", "height"],// props
                        axis.type === "linear"
                            ? [values[0], values[~-values.length], tx, tx + maxRange]
                            : [0, plotLines.length, tx, maxRange + tx],// lerp
                        function (p) { return mathFloor(p.x - 0.5) <= mathCeil(maxRange + tx) && mathCeil(p.x + 0.5) >= mathFloor(tx); }, // inside bound
                        function (p0, lineWidth) { p0 = center.call(axis, p0, lineWidth); return [p0, ty - options.height, p0, ty, lineWidth]; },
                        [tx, tx + maxRange]
                    ],
                    yAxis: [
                        ["width", "y"],
                        axis.type === "linear"
                            ? [values[0], values[~-values.length], maxRange + ty, ty]
                            : [0, plotLines.length, maxRange + ty, ty],
                        function (p) { return mathFloor(p.y - 0.5) <= mathCeil(maxRange + ty) && mathCeil(p.y - 0.5) >= mathFloor(ty); },
                        function (p0, lineWidth) { return [tx, p0, tx + options.width, p0, lineWidth]; },
                        [maxRange + ty, ty]
                    ]
                }[axis.name];

                context.save();
                if (caller && plotLines.length) {
                    notPlotlines.forEach(function (d, i) {
                        linePixel = fixLinePixel.apply(null, caller[3](interpolate.apply(null,
                            [i, 0, ~-notPlotlines.length].concat(caller[4])
                        ), lineWidth));
                        addPlotline(d, linePixel);
                    });
                    plotlines.forEach(function (d, i) {
                        if (values.length) {
                            linePixel = fixLinePixel.apply(null, caller[3](interpolate.apply(null,
                                [d.defaultZero === true ? 0 : d.value, values[0], values[~-values.length]].concat(caller[4])
                            ), lineWidth));
                            addPlotline(d, linePixel);
                        }
                    });
                }
                context.restore();
            };
            tick.xAxis = function (item) {
                var tx = pack("number", options.x),
                    ty = pack("number", options.y),
                    y = ty + item.y,
                    x = tx + item.x;
                var dashStyle = pack("string", options.gridLineDashStyle, "solid"),
                    opposite = !!options.opposite;
                var linePixel;

                x = Math.max(0, x);
                context.save();
                //tick
                if (tickWidth > 0) {                    
                    if (!item.isFirst || options.startOnTick === true) {
                        linePixel = fixLinePixel(x, y, x, y - tickLength * (opposite || -1), tickWidth);
                    }
                    if (item.isLast && options.endOnTick === true) {
                        linePixel = fixLinePixel(x + maxRange, y, x + maxRange, y + tickLength * (opposite || -1), tickWidth);
                    }
                    if (linePixel) {
                        lineTo(context, linePixel.x, linePixel.y, linePixel.x, linePixel.height, {
                            lineWidth: tickWidth,
                            lineColor: options.tickColor
                        });
                    }
                }
                //grid line
                if (gridLineWidth > 0 && !item.isFirst && (!item.isLast || isCategories) && isNumber(options.height, true)) {
                    linePixel = fixLinePixel(
                        x,
                        ty,
                        x,
                        ty - (options.height * (!opposite || -1)),//Math.min(y + options.height, options.height) * (opposite || -1),
                        gridLineWidth
                    );
                    lineTo(context, linePixel.x, linePixel.y, linePixel.x, linePixel.height, {
                        lineWidth: gridLineWidth,
                        lineColor: options.gridLineColor,
                        dashStyle: dashStyle
                    });
                }
                context.restore();
            };
            tick.yAxis = function (item) {
                var tx = pack("number", options.x, 0),
                    ty = pack("number", options.y, 0),
                    y = ty + item.y,
                    x = tx + item.x;
                var linePixel;
                y = Math.max(0, y);

                context.save();
                if (tickWidth > 0) {
                    if (!item.isFirst || options.startOnTick === true) {
                        linePixel = fixLinePixel(x, y, x + tickLength * (opposite || -1), y, tickWidth);
                    }
                    if (item.isLast && options.endOnTick === true) {
                        linePixel = fixLinePixel(x, ty, x - tickLength * (opposite || -1), ty, tickWidth);
                    }
                    linePixel && lineTo(context, linePixel.x, linePixel.y, linePixel.width, linePixel.y, {
                        lineWidth: tickWidth,
                        lineColor: options.tickColor
                    });
                }
                //grid line
                if (gridLineWidth > 0 && /*!item.isFirst && */defined(options.width)) {
                    linePixel = fixLinePixel(
                        tx, y,
                        tx + (options.width * (!opposite || -1)), y,
                        gridLineWidth
                    );
                    lineTo(context, linePixel.x, linePixel.y, linePixel.width, linePixel.y, {
                        lineWidth: gridLineWidth,
                        lineColor: options.gridLineColor,
                        dashStyle: pack("string", options.gridLineDashStyle, "solid").toLowerCase()
                    });
                }
                context.restore();
            };
            tick.colorAxis = function (item) {
                var tx = pack("number", options.x, 0),
                    ty = pack("number", options.y, 0);
                    //y = ty + item.y,
                    //x = tx + item.x;
                var stops = options.stops,
                    linearGradient,
                    isHorizontal = options.layout === "horizontal";
                if (item.isFirst) {
                    if (!defined(stops)) {
                        stops = [
                            [0, "#EFEFFF"],
                            [1, "#102D4C"]
                        ];
                    }
                    var x0 = tx,//options.x,
                        y0 = ty,//options.y,
                        x1 = tickLength,
                        y1 = mathAbs(maxRange - minRange);//vertical
                    if (isHorizontal) {
                        x1 = mathAbs(maxRange - minRange);
                        y1 = tickLength;
                    }
                    linearGradient = context.createLinearGradient.apply(context, [x0, y0].concat(isHorizontal ? [x1, y0] : [x0, y1]));
                    for(var j = 0; j < stops.length; j++){
                        var stop = stops[j];
                        if(isNumber(stop[0]) && typeof stop[1] === "string")
                            linearGradient.addColorStop(stop[0], stops[isHorizontal ? j : stops.length - j - 1][1]);
                    }
                    context.save();
                    context.fillStyle = linearGradient;
                    context.strokeStyle = options.lineColor;
                    context.lineWidth = options.lineWidth;
                    context.beginPath();
                    if(isHorizontal){
                        /*context.moveTo(0, y);
                        context.lineTo(x, y);
                        context.lineTo(x, tickLength);
                        context.lineTo(0, tickLength);*/
                        //context.fillRect(x0, y0, x1, y1);
                    }
                    else{
                        /*context.moveTo(x, 0);
                        context.lineTo(x, y);
                        context.lineTo(x + tickLength, y);
                        context.lineTo(x + tickLength, 0);*/
                        
                    }
                    context.fillRect(x0, y0, x1, y1);
                    //context.closePath();
                    context.fill();
                    //context.fillRect(x0, y0, x1, y1);
                    if(defined(options.lineWidth) && options.lineWidth > 0)
                        context.stroke();
                    context.restore();
                }
            };
            tick.polarAxis = function (item) {
                var gridDashStyle = options.gridLineDashStyle,
                    gridLineColor = options.gridLineColor;
                var cx = item.cx,
                    cy = item.cy,
                    innerRadius = item.innerRadius,
                    radius = item.radius,
                    angle = item.angle * PI / 180;
                var x, y;
                //tick
                if (tickWidth > 0) {
                    context.save();
                    context.beginPath();
                    context.lineWidth = tickWidth;
                    //context.strokeStyle = options.tickColor;
                    context.fillStyle = options.tickColor;
                    context.translate(cx, cy);
                    context.rotate(angle);
                    context.fillRect(radius, 0, tickLength, tickWidth);
                    /*context.moveTo(x, y);
                    context.lineTo(Math.cos(angle) * tickLength + x, Math.sin(angle) * tickLength + y);
                    */
                    context.restore();
                }
                if(innerRadius > 0 && gridLineWidth > 0/* && !item.isFirst*/){
                    //var linePixel = fixLinePixel(cx, cy, x, y, gridLineWidth);
                    context.save();
                    x = cx + Math.cos(angle) * radius;
                    y = cy + Math.sin(angle) * radius;
                    lineTo(context, cx, cy, x, y, {
                        lineWidth: gridLineWidth,
                        lineColor: gridLineColor
                    });
                    context.stroke();
                    context.restore();
                }
            };
            tick.radiusAxis = function (item) {
                var tickWidth = pack("number", options.tickWidth, 1),
                    tickColor = options.tickColor,
                    gridLineInterpolation = options.gridLineInterpolation,
                    gridDashStyle = options.gridLineDashStyle,
                    gridLineColor = options.gridLineColor;
                var length = options.length;
                //var ticks = axis.ticks;

                var cx = item.cx,
                    cy = item.cy,
                    //radius = item.radius,
                    innerRadius = item.innerRadius,
                    //angle = item.angle * PI / 180,
                    startAngle = item.startAngle * PI / 180;

                //tick
                if(tickWidth > 0){
                    context.save();
                    //context.fillStyle = tickColor;
                    //context.translate(cx, cy);
                    //context.rotate(startAngle);
                    //context.translate(innerRadius - tickWidth, 0);
                    //context.fillRect(0, 0, tickWidth, -tickLength);
                    context.transform(
                        Math.cos(startAngle), Math.sin(startAngle),
                        -Math.sin(startAngle), Math.cos(startAngle),
                        cx,
                        cy
                    );
                    context.moveTo(innerRadius, 0);
                    context.lineTo(innerRadius, tickLength);

                    context.strokeStyle = tickColor;
                    context.stroke();
                    context.restore();
                }
                if (innerRadius > 0 && gridLineWidth > 0 && !item.isFirst) {
                    context.save();
                    context.beginPath();
                    context.lineWidth = gridLineWidth;
                    context.strokeStyle = gridLineColor;
                    if (gridLineInterpolation === "polygon") {
                        for (var i = 0; i < length; i++) {
                            var ratio = i / length,
                                angle = (ratio * PI2) + startAngle;
                            context[i ? "lineTo" : "moveTo"](
                                Math.cos(angle) * innerRadius + cx,
                                Math.sin(angle) * innerRadius + cy
                            );
                        }
                        context.closePath();
                    }
                    else {
                        if (defined(gridDashStyle) && gridDashStyle !== "solid") {
                            DashLine.arc(context, cx, cy, innerRadius, 0, PI2, gridDashStyle);
                        }
                        else {
                            context.arc(cx, cy, innerRadius, 0, PI2);//context.setLineDash([5, 15]);
                        }
                    }
                    context.stroke();
                    context.restore();
                }
            };
            tick.adjustLabel = function (tick, i, params) {
                var opposite = !!options.opposite,
                    tickWidth = tick.size,
                    tickLength = options.tickLength,
                    logarithmic = options.logarithmic,
                    layout = options.layout,
                    tx = pack("number", options.x, 0),
                    ty = pack("number", options.y, 0);
                var type = axis.type;
                
                var isRotation = params.isRotation,
                    isCenter = params.isCenter,
                    isCategories = defined(options.categories) && !!options.categories.length;
                
                var angle = labels.rotation;
                var maxLabelWidth = axis.labelWidth;
                
                if (opposite === true) {
                    tickLength = -tickLength;
                }
                if (!isNumber(angle, true)) {
                    angle = (isRotation && name === "xAxis") ? autoRotation : 0;//default angle
                }
                isCenter = isCenter && isCategories;
                var x = tick.x,
                    y = tick.y;

                var cx = tick.cx,
                    cy = tick.cy,
                    radius = tick.radius;
                var text = tick.text;
                if (defined(text.ellipse)) {
                    var height = text.height,
                        width = text.width;

                    if (name === "yAxis") {
                        if(opposite === true){
                            width = 0;
                        }
                        y = mathMax(0, y);
                        if (isCategories) {
                            y -= tick.size / 2;
                        }
                        x = x - width - tickLength;
                        x = setAlign(x, maxLabelWidth, text.width)[pack("string", labels.align, "center")];
                    }
                    else if (name === "xAxis") {
                        x = mathMax(0, x);
                        if(isCenter){
                            x = x + (tickWidth - width) / 2;
                        }
                        else{
                            x = x - width / 2;
                        }
                        y = y + tickLength + pack("number", text.firstHeight, text.height);
                        if(opposite === true){
                            y = y - height / 2 + tickLength;
                        }
                    }

                    if ((name === "xAxis" || name === "yAxis") && isNumber(angle, true) || (isRotation && name === "xAxis")) {
                        var quadr1 = function (tick, name) {
                            return {
                                xAxis: [
                                    tick.x + (isCategories ? (tick.size - text.width) / 2 : -text.width / 2),
                                    tick.y + text.height + tickLength
                                ],
                                yAxis: [
                                    tick.x + (-text.width * !opposite) - tickLength,
                                    tick.y - (isCategories ? (tick.size - text.height) / 2 : -text.height / 2)
                                ]
                            }[name];
                        };
                        var quadr2 = function (tick, name) {
                            return {
                                xAxis: [
                                    (type === "categories")
                                        ? tick.x + tick.size / 2 - (text.width / 2) * !opposite //(text.width - tick.size) / 2
                                        : tick.x + text.width / 4,
                                    tick.y + (text.height * !opposite) + tickLength
                                ],
                                yAxis: [
                                    tick.x - tickLength,
                                    tick.y - (tick.size - text.height) / 2
                                ]
                            }[name];
                        };
                        var quadr4 = function (tick, name) {
                            return {
                                xAxis: [
                                    tick.x - text.width / 2,
                                    tick.y + tickLength
                                ],
                                yAxis: [
                                    tick.x - text.width - tickLength,
                                    tick.y - text.height / 2
                                ]
                            }[name];
                        };
                        var quadr3 = function (tick, name) {
                            return {
                                xAxis: [
                                    tick.x + text.width / 2,
                                    tick.y + text.height
                                ],
                                yAxis: [
                                    tick.x - tickLength,
                                    tick.y - text.height / 2 - (tick.size - text.height) / 2
                                ]
                            }[name];
                        };
                        angle %= 360;
                        if (angle < 0) {
                            angle = 360 + angle;
                        }
                        
                        var quadr = [quadr1, quadr4, quadr3, quadr2][Numeric.indexOfRange([0, 90, 180, 270, 360], angle)];
                        if (quadr && (quadr = quadr(tick, name))) {
                            y = quadr[1];
                            x = quadr[0];
                        }
                    }
                    var color = Color.parse(fontStyle.color);
                    color.a = mathMax(0, mathMin(pack("number", tick.opacity, 1), 1));
                    context.save();
                    context.beginPath();
                    context.fillStyle = Color.rgba(color);
                    context.textAlign = "start";
                    context.textBaseline = "alphabetic";
                    context.font = [
                        fontStyle.fontStyle,
                        fontStyle.fontWeight,
                        fontStyle.fontSize + "/" + fontStyle.lineHeight,
                        fontStyle.fontFamily
                    ].join(" ");
                    if (name === "colorAxis") {
                        ((text.isLast) && (layout !== "horizontal"
                            ? (x = tick.x + (tickLength - text.width) / 2, y = minRange - 2)
                            : (x = tick.x, y = tick.y + text.height + (tickLength - text.height) / 2), !0)
                        ||
                        (text.isFirst) && (layout !== "horizontal"
                            ? (x = tick.x + (tickLength - text.width) / 2, y = maxRange + text.height + 2)
                            : (x = tick.x - text.width - 2, y = tick.y + text.height + (tickLength - text.height) / 2), !0)
                        ) && (
                            context.translate(tx + x + pack("number", labels.x, 0), ty + y + pack("number", labels.y, 0)),
                            context.fillText(text.ellipse, 0, 0)
                        );
                    }
                    else {
                        var tag = Text.HTML(Text.parseHTML(text.ellipse), context, fontStyle),
                        bbox = Text.measureText(text.ellipse, style);
                        if (name === "polarAxis") {
                            if (mathAbs(x - cx) / radius < 0.3) {
                                x -= bbox.width / 2;
                            }
                            else if (x <= cx){
                                x -= bbox.width;
                            }
                            if (mathAbs(y - cy) / radius < 0.3) {
                                y += bbox.height / 2;//0,180
                            }
                            else if (y > cy) {
                                y += bbox.height;
                            }
                        }
                        else if (name === "radiusAxis") {
                            context.translate(tick.cx, tick.cy);
                            context.rotate(tick.startAngle * PI / 180);
                            x = (tick.radius - tick.innerRadius) - text.width / 2;
                            y = tickLength + text.height;
                            angle = 0;
                        }

                        context.translate(tx + x + pack("number", labels.x, 0), ty + y + pack("number", labels.y, 0));
                        context.rotate(angle * PI / 180, angle * PI / 180);
                        //context.translate(-bbox.width, -text.height);
                        tag.toCanvas(context);
                        //context.fillText(text.ellipse, 0, 0);
                    }
                    if (type === "logarithmic" && isNumber(logarithmic.base) && defined(logarithmic.pow)) {
                        var dm = 1,
                            powN;
                        if (isNumber(options.tickAmount) && options.tickAmount > 1) {
                            dm = axis.maxDomain / ~-options.tickAmount;
                        }
                        powN  = mathRound(axis.startValue + dm * i, 1);
                        context.scale(0.8, 0.8);
                        context.fillText(
                            powN,
                            !opposite ? width - context.measureText(powN).width / 2 : text.width * 0.8,
                            0 
                        );
                    }
                    context.restore();
                }
            };
            tick.render = function (item) {
                return ({
                    xAxis: this.xAxis,
                    yAxis: this.yAxis,
                    colorAxis: this.colorAxis,
                    polarAxis: this.polarAxis,
                    radiusAxis: this.radiusAxis
                }[name] || function () {})(item), this;
            };
            return tick;
        },
        init: function (canvas, options) {
            this.options = extend({}, defaultOptions);
            var axisOptions = extend(this.options, options);

            this.type = isArray(axisOptions.categories) ? "categories" : axisOptions.type;//linear, categories, logarithmic or datetime
            this.name = axisOptions.name || "xAxis";
            this.startValue = 0;
            this.endValue = 0;
            this.minValue = 0;
            this.maxValue = 0;

            this.minRange = (axisOptions.range = axisOptions.range || [])[0];
            this.maxRange = axisOptions.range[1];
            this.labelWidth = 0;
            this.labelHeight = 0;
            this.isRotation = false;

            this.shapes = [];// z sort

            this.ticks = [];
            this._ticks = [];
            this.tickPositions = [];
            this.tickPositioner = [];
            this.values = [];
            this.tickInterval = 5;
            this.tickGap = 1;//define categroies
            this.zeroAxis = {
                hidden: true,
                x: 0,
                y: 0
            };

            this.canvas = canvas;
            this.context = canvas.getContext("2d");

            !~("logarithmic categories datetime".indexOf(this.type)) && (this.type = "linear");
            this.setTitle();
            this.setPlotLines();
        },
        translate: function (x, y) {
            var options = this.options;
            options.x = x;
            options.y = y;
            return this;
        },
        domain: function (min, max) {
            var options = this.options;
            return arguments.length ? (options.domain[0] = min, options.domain[1] = max, this) : options.domain;
        },
        range: function () {
            if (arguments.length) {
                this.minRange = arguments[0];
                this.maxRange = defined(this.minRange) ? (arguments[1] || 0) : (this.minRange = 0);
                return this;
            }
            else {
                return [this.minRange, this.maxRange];
            }
        },
        nice: function (minDomain, maxDomain, m) {
            var min = minDomain,
                max = maxDomain,
                dm;
            dm = (min > max && (dm = min, min = max, max = dm), max - min);
            if (!defined(m))
                m = 10;

            var step = lg10ln(dm / m);
            var decimal = m / dm * step;

            if (decimal <= 0.15) {
                step *= 10;
            }
            else if (decimal <= 0.35) {
                step *= 5;
            }
            else if (decimal <= 0.75) {
                step *= 2;
            }
            min = Math.floor(min / step) * step;
            max = Math.ceil(max / step) * step;
            if (minDomain > maxDomain) {
                dm = min;
                min = max;
                max = dm;
            }
            return {
                min: min,
                max: max,
                step: step
            };
        },
        /*
         * Returns linear value
         * tickAmount > interval
        */
        getLinearTicks: function (startValue, endValue) {
            var options = this.options,
                interval = options.interval,
                tickAmount = options.tickAmount,
                tickInterval = this.tickInterval;
            var ticks = [];
            var min = startValue,
                max = endValue,
                dm,
                i = 0;
            var floor = Math.floor,
                ceil = Math.ceil,
                abs = Math.abs;
            var eps = Math.pow(10, 16);
            
            var v;
            dm = (min > max && (dm = min, min = max, max = dm), max - min);

            var step = lg10ln(dm / tickInterval);
            var decimal = tickInterval / dm * step;

            if (decimal <= 0.15) {
                step *= 10;
            }
            else if (decimal <= 0.35) {
                step *= 5;
            }
            else if(decimal <= 0.75){
                step *= 2;
            }
            if (step === Infinity) {
                return ticks;
            }
            //domain[i0] = parseFloat(toPrecision(Math.floor(min / step) * step), 10);
            //domain[i1] = Math.ceil(max / step) * step;

            if(isNumber(tickAmount)){
                var ln10;//Math.pow(10, Math.round(Math.log(dm) / Math.LN10) - 1);
                tickInterval = Math.max(1, tickAmount - 1);
                min *= tickAmount;
                max *= tickAmount;
                dm = abs(min - max) / tickInterval;
                ln10 = lg10ln(dm);
                min = floor((min) / ln10) * ln10;
                max = ceil((max) / ln10) * ln10;
                while(i < tickAmount){
                    dm = abs(max - min) / tickAmount;
                    dm /= tickInterval;
                    v = min / tickAmount + (dm * i++);
                    //v = (Math.floor(min / ln10) * ln10/*start*/) + (Math.ceil((dm / tickInterval) / ln10) * ln10/*step*/) * i++;
                    ticks.push(parseFloat(toPrecision(v), 10));
                }
            }
            else{
                var start, stop;
                var bit;

                if(isNumber(interval)){
                    start = min, stop = max;
                    step = Math.min(Math.abs(max - min) / 2, interval);
                    v = start;
                    while((step < 0 ? v >= stop : v <= stop)){
                        v = start + step * i++;
                        ticks.push(v);
                    }
                }
                else{
                    min = floor(floor(min / step) * step * eps) / eps;
                    max = floor(ceil(max / step) * step * eps) / eps;
                    
                    start = parseFloat(toPrecision(min, 10), 16);//Math.ceil(min / step) * step, 16), 10);//min
                    stop = ceil(max / step) * step + step * 0.5;//max
                    bit = 1;
                    while(abs(step) * bit % 1)
                        bit *= 10;
                    start *= bit, stop *= bit, step *= bit;
                    while((v = start + step * i++, step < 0 ? v > stop : v < stop)){
                        ticks.push(v / bit);
                    }
                }
            }
            if (defined(options.startValue)) {
                startValue !== ticks[0] && (ticks[0] = (parseFloat(toPrecision(startValue, 10), 10)));
            }
            if (defined(options.endValue)) {
                endValue !== ticks[ticks.length - 1] && (ticks[ticks.length - 1] = parseFloat(toPrecision(endValue, 10), 10));
            }
            return ticks;
        },
        getCategoriesTicks: function (startValue, endValue, maxLength) {
            var options =  this.options,
                tickAmount = options.tickAmount;
            var start = mathMax(1, startValue),
                end = mathMax(endValue, start, maxLength);
            var ticks = [];
            var i;
            if (start === end) return [];

            if (isNumber(tickAmount, true) && (tickAmount = mathMax(1, ~~tickAmount))) for (i = 0; i < tickAmount; i++) {
                ticks.push(start + i);
            }
            else for (i = start; i <= end; i += 1) {
                ticks.push(i);
            }
            return ticks;
        },
        getLogTicks: function (startValue, endValue, base) {
            var options = this.options,
                tickAmount = options.tickAmount;
            var ticks = [];
            var min = startValue,
                max = endValue,
                dm;
            dm = (min > max && (dm = min, min = max, max = dm), max - min);
            
            var positive = min >= 0 && max >= 0;

            var start = Math.floor(parseFloat(toPrecision(min), 10)),
                end = 1 + Math.ceil(parseFloat(toPrecision(max), 10));
            var i;

            //console.log(start, end, min, max, positive)
            if (isNumber(tickAmount)){
                tickAmount = Math.max(tickAmount, 1);
                for(i = 0; i < tickAmount; i++){
                    var v = mathPow(i, base, positive);
                    ticks.push(parseFloat(toPrecision(v, 15), 10));
                }
            }
            else {
                if (isFinite(start) && isFinite(end)) {
                    dm = 1 + Math.ceil(max);// end - start;
                    for (i = 0; i < dm; i++) {
                        ticks.push(mathPow(i, base, positive));
                    }
                    /*for(; i < interval; i++){
                        ticks.push(mathPow(i, base, positive));
                    }*/
                }
            }
            return ticks;
        },
        getTimeTicks: function (startValue, endValue) {
            var options = this.options,
                tickAmount = options.tickAmount;// Math.max(1, ~~pack("number", options.tickAmount, 1));
            var min = startValue,
                max = endValue;
            var start,
                end,
                dm;
            var startYear;
            
            var interval = (dateTypes[options.dateType] || {}).interval || ONE_DAY;

            var getTime = function(year, month, day, hour, minute, seconds){
                return new Date(
                    year,
                    month,
                    pack("number", day, 1),
                    pack("number", hour, 0),
                    pack("number", minute, 0),
                    pack("number", seconds, 0)
                ).getTime();
            };
            var getTimeInterval = function(time, i, year, month, date){
                if(interval === dateTypes.year.interval){
                    time = getTime(year + i, 0);
                }
                else if(interval === dateTypes.month.interval){
                    time = getTime(year, month + i);
                }
                else if(interval === dateTypes.day.interval){
                    time = getTime(year, month, date + i);
                }
                else if(interval === dateTypes.week.interval){
                    time = getTime(year, month, date + i * 7);
                }
                else{
                    time += interval;
                }
                return time;
            };
            var ticks = [];
            var i = 1;
            if(
                (start = new Date(min)).toString() !== "Invalid Date" &&
                (end = new Date(max)).toString() !== "Invalid Date"){
                (start.getTime() > end.getTime() &&
                    (dm = start, start = end, end = dm));
            }
            else{
                return ticks;
            }
            
            start.setMilliseconds(interval >= dateTypes.second.interval ? 0 : start.getMilliseconds());
            if(interval >= dateTypes.second.interval){
                start.setSeconds(interval >= dateTypes.minute.interval ? 0 : start.getSeconds());
            }
            if(interval >= dateTypes.minute.interval){
                start.setMinutes(interval >= dateTypes.hour.interval ? 0 : start.getMinutes());
            }
            if(interval >= dateTypes.hour.interval){
                start.setHours(interval >= dateTypes.day.interval ? 0 : start.getHours());
            }
            if(interval >= dateTypes.day.interval){
                start.setDate(interval >= dateTypes.month.interval ? 1 : start.getDate());
            }
            if(interval >= dateTypes.month.interval){
                start.setDate(interval > dateTypes.year.interval ? 0 : start.getMonth());
                startYear = start.getFullYear();
            }
            if(interval > dateTypes.year.interval){
                start.setFullYear(startYear);
            }
            startYear = start.getFullYear();

            var time = start.getTime(),
                month = start.getMonth(),
                date = start.getDate();
            end = end.getTime();

            if (isNumber(tickAmount)) {
                tickAmount = Math.max(1, ~~tickAmount);
                dm = Math.floor((end - time) / tickAmount);
                while(i <= tickAmount){
                    var t = getTimeInterval(time, i, startYear, month, date);
                    t = t + (dm * i);
                    ticks.push(t);
                    i++;
                }
            }
            else{
                ticks.push(time);
                while (time < end) {
                    ticks.push(time = getTimeInterval(time, i, startYear, month, date));
                    i++;
                }
            }
            return ticks;
        },
        getPolarTicks: function () {
            var options = this.options,
                tickAmount = options.tickAmount;
            var startValue = 0,
                endValue = 360;
            var step;
            var ticks = [];
            if (!isNumber(tickAmount)) {
                tickAmount = 12;
            }
            step = endValue / tickAmount;
            for (var i = 0; i < tickAmount; i++) {
                ticks.push(startValue + parseFloat(toPrecision(i * step, 10), 10));
            }
            return ticks;
        },
        setTickInterval: function () {
            var options = this.options,
                categories = options.categories,
                tickPositions = options.tickPositions,
                tickPositioner = options.tickPositioner,
                tickAmount = options.tickAmount,
                logBase = pack("number", pack("object", options.logarithmic, {}).base, 10),
                type = this.type;
            var domain = options.domain,
                minDomain = domain[0],
                maxDomain = domain[1],
                dm;
            var minValue = options.minValue,
                maxValue = options.maxValue,
                startValue = options.startValue,
                endValue = options.endValue;
            var minLength = 0, maxLength = 0;
            var values = [];
            var ticks;
            var sorted = function (values) {
                return values.length && values.sort(function (a, b) {
                    return a - b;
                }).slice(0), values;
            };
            var valid = function (values) {
                var ret = [];
                values.forEach(function (d) {
                    isNumber(d, true) && ret.push(d);
                });
                return ret;
            };

            startValue = Math.min(100, Math.max(0, pack("number", parseFloat(startValue, 10), 0))) / 100;
            endValue = Math.min(100, Math.max(0, pack("number", parseFloat(endValue, 10), 100))) / 100;

            startValue > endValue && (dm = startValue, startValue = endValue, endValue = dm);
            minDomain > maxDomain && (dm = minDomain, minDomain = maxDomain, maxDomain = dm);
            startValue = minDomain + (maxDomain - minDomain) * startValue;
            endValue = minDomain + (maxDomain - minDomain) * endValue;

            if (isArray(tickPositions) && tickPositions.length) {
                ticks = sorted(values = valid(tickPositions));
            }
            else if (isFunction(tickPositioner)) {
                values = tickPositioner.call({
                    min: minValue, max: maxValue,
                    dataMin: minValue, dataMax: maxValue
                });
                if (!isArray(values)) values = [];
                ticks = sorted(values = valid(values));
            }
            else {
                ticks = type === "logarithmic"
                ? this.getLogTicks(minValue, maxValue, logBase)
                : type === "datetime"
                    ? this.getTimeTicks(minDomain, maxDomain)
                    /*: type === "categories"
                        ? this.getCategoriesTicks(minDomain, maxDomain)*/
                        : this.getLinearTicks(minValue, maxValue);//min & max value
                if (type === "linear") {
                    values = this.getLinearTicks(minDomain, maxDomain);
                }
                else if (type === "logarithmic") {
                    values = this.getLogTicks(minDomain, maxDomain, logBase);
                }
                else if (type === "categories" || (isArray(categories))) {
                    values = this.getCategoriesTicks(minDomain, maxDomain, options.length);
                    minLength = 0;
                    maxLength = values.length;
                }
                else if (type === "datetime") {
                    values = this.getTimeTicks(startValue, endValue);
                }
                else if (this.name === "polarAxis") {
                    values = this.getPolarTicks();
                }
                else {
                    if (!isNumber(tickAmount) && this.name === "polarAxis" && options.gridLineInterpolation === "polygon") {
                        tickAmount = options.length;
                    }
                    values = this.getLinearTicks(minDomain, maxDomain);//startValue, endValue);
                }
            }
            
            if (options.reversed === true) {
                values.reverse();
            }

            if (values.length >= 1) {
                this.startValue = values[0];
                this.endValue = values[values.length - 1];
            }
            if (ticks.length > 1) {
                this.minValue = ticks[0];
                this.maxValue = ticks[ticks.length - 1];
            }
            else {
                this.minValue = minValue;
                this.maxValue = maxValue;
            }
            if (type === "logarithmic") {
                this.minValue = mathLog(this.minValue, logBase);
                this.maxValue = mathLog(this.maxValue, logBase);
            }
            this.minLength = minLength;
            this.maxLength = maxLength;
            //console.log(values, type, this.name, ticks, this.minValue, this.maxValue, maxDomain);
            return this.values = values;
        },
        setLabels: function () {
            var options = this.options,
                layout = options.layout || {},
                tickLength = pack("number", options.tickLength),
                hasCategories = options.categories && isArray(options.categories) && !!options.categories.length;

            var maxRange = this.maxRange,
                minRange = this.minRange,
                startValue = this.startValue,
                endValue = this.endValue;
            var ticks = arrayFilter(this.ticks, function (tick) { return tick.visibled; }),
                type = this.type,
                name = this.name;
            var size = 0,
                length;
            var axis = this;
            var values = this.values;
            var firstTick;

            var startAngle = pack("number", options.startAngle, -90),
                center = (
                    center = pack("array", options.center, ["50%", "50%"]),
                    center.length < 2 && (center[1] = center[0]), center
                ),
                radius = maxRange;//polar axis
            center[0] = pack("number", center[0], Numeric.percentage(options.width, center[0]));
            center[1] = pack("number", center[1], Numeric.percentage(options.height, center[1]));
            this.tickPositioner = []

            axis.zeroAxis.hidden = type === "categories"
                    || !(startValue <= 0 && endValue > 0)
                    || (name !== "xAxis" && name !== "yAxis");
            if (length = ticks.length) {
                size = mathMax(minRange, maxRange, 1) / (length);
                ticks.forEach(function (tick, i) {
                    if (name === "xAxis") {
                        size = maxRange / mathMax(1, length - 1);
                        tick.y = 0;
                        if (type === "categories") {
                            size = maxRange / (length - !hasCategories);
                            tick.x = hasCategories ? i * size : interpolate(tick.value, startValue, endValue, minRange, maxRange);
                        }
                        else {
                            tick.x = interpolate(tick.value, startValue, endValue, minRange, maxRange);
                        }
                        if (tick.value === 0)
                            axis.zeroAxis.x = tick.x;
                    }
                    else if (name === "yAxis") {
                        tick.x = 0;
                        if (type === "logarithmic") {
                            size = mathMax(minRange, maxRange, 1) / (mathMax(1, length - 1));
                            tick.y = (length - i - 1) * size;
                        }
                        else if (type === "categories"){
                            size = maxRange / (length - !hasCategories);
                            tick.y = (length - i - !hasCategories) * size;
                        }
                        else {
                            tick.y = interpolate(tick.value, startValue, endValue, maxRange, minRange);
                        }
                        if (tick.value === 0)
                            axis.zeroAxis.y = tick.y;
                    }
                    else if (name === "colorAxis") {
                        if (layout === "vertical") {
                            tick.x = 0;
                            tick.y = interpolate(tick.value, startValue, endValue, maxRange, minRange);
                        }
                        else {
                            tick.x = interpolate(tick.value, endValue, startValue, maxRange, minRange);
                            tick.y = 0;
                        }
                    }
                    else if (name === "polarAxis" || name === "radiusAxis") {
                        var ratio = i / mathMax(1, length - (name === "radiusAxis")),
                            innerRadius = radius - radius * ratio,
                            angle = ratio * 360 + startAngle, //(ratio * PI2) + (startAngle / 180 * PI);
                            delta = angle * PI / 180;
                        var cx = center[0],// (options.width - innerRadius * 2),
                            cy = center[1];// (options.height - innerRadius * 2);
                        tick.cx = cx;
                        tick.cy = cy;
                        tick.x = mathCos(delta) * (radius + (name === "polarAxis") * (tickLength + 3)) + cx;
                        tick.y = mathSin(delta) * (radius + (name === "polarAxis") * (tickLength + 3)) + cy;
                        tick.angle = angle;
                        tick.radius = radius;
                        tick.innerRadius = innerRadius;
                        tick.startAngle = startAngle;
                    }
                    tick.size = size;
                    if (!i) {
                        firstTick = tick;
                    }
                    else {
                        tick.size = mathAbs(tick[name === "xAxis" ? "x" : "y"] - firstTick[name === "xAxis" ? "x" : "y"]);
                        firstTick = tick;
                    }
                });
                ticks.length && firstTick && (ticks[0].size = firstTick.size);
            }
            length = values.length;
            for (var i = 0; i < length; i++) {
                size = maxRange / (length - !hasCategories);
                this.tickPositioner.push(
                    name === "yAxis"
                        ? { x: 0, y: i * size, size: size }
                        : { x: i * size, y: 0, size: size }
                );
            }
            //this.scale();
        },
        scale: function (minRange, maxRange) {
            var options = this.options,
                labels = options.labels || {},
                autoRotation = pack("number", labels.autoRotation, -45),
                categories = pack("array", options.categories, []),
                tickLength = pack("number", options.tickLength, 0),
                logarithmic = options.logarithmic || {},
                step = labels.step,
                maxWidth = labels.maxWidth,
                angle = labels.rotation,
                tickInterval = options.tickInterval,
                tickAmount = options.tickAmount,
                style = pack("object", labels.style, {}),
                fontStyle = {
                    fontStyle: pack("string", style.fontStyle, "normal"),
                    fontWeight: pack("string", style.fontWeight, "normal"),
                    fontSize: pack("string", style.fontSize, "12px"),
                    fontFamily: pack("string", style.fontFamily, "Arial"),
                    lineHeight: pack("string", style.lineHeight, "normal")
                };

            var minTickWidth = 60;
            var labelWidth = 0,
                labelHeight = 0;
            var size = 0;

            var ticks = [];
            var values = this.values,
                tickPositions = this.tickPositions;
            var hasCategories = this.type === "categories";// isArray(categories) && categories.length;
            var isRotation = isNumber(angle, true) &&  angle !== 0;

            var axis = this;
            var context = this.context,
                type = this.type,
                name = this.name;

            var length = values.length;
            var visibleLength = 0;

            if (fontStyle.fontFamily === "inherit") {
                fontStyle.fontFamily = getStyle(this.canvas, "font-family") || "Arial";
            }

            if (name === "yAxis" && length) {
                minTickWidth = mathMax(10, Text.measureText(hasCategories ? categories[0] : values[0], fontStyle).height * 2);
            }

            if (!isNumber(tickInterval))
                tickInterval = 1;
            if (!isNumber(step)) {
                if (isNumber(tickAmount)) {
                    tickInterval = 1;
                }
                else if (type === "logarithmic") {
                    tickInterval = 1;//no auto
                }
                else if (name === "colorAxis") {
                    tickInterval = 1;
                }
                else if (~~(maxRange / length) <= minTickWidth) {
                    tickInterval = mathRound((length) / maxRange * minTickWidth);
                }
            }
            else {
                tickInterval = step;
            }
            tickInterval = mathMax(tickInterval, 1);
            for (var i = 0, j = 0; i < length; i++) {
                var value = values[i];
                var tick = {
                    isFirst: i === 0,
                    isLast: i === length - 1,
                    //size: size,
                    value: value,
                    gap: mathAbs(value - (values[i + 1] || value)),
                    visibled: i % tickInterval === 0
                };
                tickPositions[i] = hasCategories && categories[i - 1] || value;
                //if (i % tickInterval === 0) {
                    j++;
                    tick.enabled = true;
                    ticks.push(tick);
                //}
                if (tick.visibled) {
                    tick.__proto__ = new Animate();
                    visibleLength++;
                }
            }
            if (length = ticks.length) {
                size = (maxRange - minRange) / visibleLength;
                ticks.forEach(function (tick, i) {
                    var text = axis.labelFormatter(tick.value, {
                        isFirst: !i,
                        isLast: !(length - i - 1),
                        index: i
                    }), ellipse = text,
                    bbox,
                    tag;
                    
                    context.save();
                    context.font = [
                        fontStyle.fontStyle,
                        fontStyle.fontWeight,
                        fontStyle.fontSize,// + "/" + (fontStyle.lineHeight),
                        fontStyle.fontFamily
                    ].join(" ");
                    tag = Text.HTML(Text.parseHTML(text), context, {
                        fontStyle: fontStyle.fontStyle,
                        fontWeight: fontStyle.fontWeight,
                        fontSize: fontStyle.fontSize,
                        lineHeight: fontStyle.lineHeight,
                        fontFamily: fontStyle.fontFamily,
                        rotation: pack("number", angle)
                    });
                    bbox = tag.getBBox();
                    if (isNumber(maxWidth, true)) {
                        bbox.width = maxWidth;
                    }
                    var tickSize = size - 4 * (name === "xAxis"),//margin
                        dm;
                    
                    if (name === "xAxis" || name === "yAxis") {
                        if (isNumber(maxWidth)) {
                            maxWidth < bbox.width && (ellipse = Text.multipText("" + text, maxWidth));
                        }
                        else {
                            (bbox.width > tickSize) && (ellipse = Text.multipText("" + text, tickSize));
                        }
                    }
                    tag = Text.HTML(Text.parseHTML(ellipse), context, {
                        fontStyle: fontStyle.fontStyle,
                        fontWeight: fontStyle.fontWeight,
                        fontSize: fontStyle.fontSize,
                        lineHeight: fontStyle.lineHeight,
                        fontFamily: fontStyle.fontFamily,
                        rotation: pack("number", angle)
                    });
                    bbox = tag.getBBox();
                    //bbox.width = context.measureText(ellipse).width;
                    if (isNumber(logarithmic.base, true) && defined(logarithmic.pow)) {
                        dm = 1;
                        if (isNumber(options.tickAmount) && options.tickAmount > 1) {
                            dm = axis.maxDomain / ~-options.tickAmount;
                        }
                        bbox.width += context.measureText(mathRound(i * dm, 1)).width * 0.7;
                    }
                    if (tick.visibled)
                        isRotation = isRotation || (name === "xAxis" && bbox.width >= tickSize);//margin
                    context.restore();
                    tick.text = {
                        name: text,
                        ellipse: ellipse,
                        width: bbox.width,
                        height: bbox.height,
                        isFirst: !i,
                        isLast: !(length - i - 1)
                    };
                });
                
                ticks.forEach(function (tick) {
                    var text = tick.text,
                        bbox,
                        tag;
                    if (name === "xAxis") {
                        //after rotate bbox
                        bbox = Text.measureText(text.ellipse, {
                            fontStyle: fontStyle.fontStyle,
                            fontWeight: fontStyle.fontWeight,
                            fontSize: fontStyle.fontSize,
                            lineHeight: fontStyle.lineHeight,
                            fontFamily: fontStyle.fontFamily,
                            rotation: pack("number", angle, isRotation ? autoRotation : 0)
                        });
                        text.firstHeight = bbox.height;
                        tag = Text.HTML(Text.parseHTML(text.ellipse), context, {
                            fontStyle: fontStyle.fontStyle,
                            fontWeight: fontStyle.fontWeight,
                            fontSize: fontStyle.fontSize,
                            lineHeight: fontStyle.lineHeight,
                            fontFamily: fontStyle.fontFamily,
                            rotation: pack("number", angle, isRotation ? autoRotation : 0)
                        });
                        bbox = tag.getBBox();
                        text.width = bbox.width;
                        text.height = bbox.height;
                    }
                    if (labels.enabled !== false) {
                        labelWidth = mathMax(labelWidth, text.width);
                        labelHeight = mathMax(labelHeight, text.height);
                    }
                });
                if (!isNumber(angle, true)) {
                    angle = 0;//this.name !== "yAxis" ? -45 : 0;//default angle
                    if (name === "xAxis" && isRotation)
                        angle = autoRotation;//x axis rotation 45
                }
                angle = angle * PI / 180;
                //labelWidth += !isRotation * options.tickLength;
                labelHeight += /*!isRotation **/ tickLength;
            }
            if (name === "yAxis") {
                labelWidth += tickLength;
            }
            else if (name === "xAxis") {
                //labelHeight += tickLength;
            }
            this.labelWidth = labelWidth * !labels.floating;
            this.labelHeight = labelHeight * !labels.floating;
            this.isRotation = isRotation;
            this.ticks = ticks;
            if (name === "yAxis") {
                this.textBoxSize = this.labelWidth + this.titleWidth;
            }
            else if (name === "xAxis") {
                this.textBoxSize = this.labelHeight + this.titleHeight;
            }
        },
        setTitle: function (rendered) {
            var options = this.options,
                opposite = options.opposite,
                context = this.context;
            var title = options.title || {},
                rotation = title.rotation,
                verticalAlign = title.verticalAlign,
                labels = options.labels || {},
                margin = pack("number", title.margin, 0),
                style = title.style || {},
                fontStyle = {
                    fontWeight: style.fontWeight || "normal",
                    fontStyle: style.fontStyle || "normal",
                    fontFamily: style.fontFamily || (labels.style || {}).fontFamily || "Arial",
                    fontSize: style.fontSize || "12px",
                    lineHeight: style.lineHeight || "normal",
                    color: style.color
                },
                bbox;
            var x = pack("number", options.x, 0) + pack("number", title.x, 0),
                y = pack("number", options.y, 0) + pack("number", title.y, 0);
            var isRotation = defined(rotation) && isNumber(rotation, true) && rotation !== 0;
            var angle = 270 * PI / 180;
            var axis = this;

            var swap = function (a, b) {
                var t = a;
                a = b;
                b = t;
                return { w: a, h: b};
            };

            var condExpr = [
                [isRotation && verticalAlign === "top", function (x, y, w, h) {
                    var box = swap(bbox.width, bbox.height + margin);
                    x -= (axis.labelWidth + margin) * (opposite !== true || -1);
                    y += w;
                    return {
                        x: x, y: y,
                        width: box.w, height: box.h
                    };
                }],
                [isRotation && verticalAlign === "bottom", function (x, y, w, h) {
                    var box = swap(bbox.width, bbox.height + margin);
                    y += axis.maxRange;
                    x -= (axis.labelWidth + margin) * (opposite !== true || -1);
                    w += axis.labelWidth + margin;
                    
                    return {
                        x: x, y: y,
                        width: box.w, height: box.h
                    };
                }],
                [isRotation, function (x, y, w, h) {
                    var box = swap(bbox.width, bbox.height + margin);
                    y += w + (axis.maxRange - w) / 2;
                    x -= (axis.labelWidth + margin) * (opposite !== true || -1);
                    w += axis.labelWidth + margin;
                    
                    return {
                        x: x, y: y,
                        width: box.w, height: box.h
                    };
                }],
                [!isRotation && verticalAlign === "bottom", function (x, y, w, h) {
                    x -= w * (opposite === true);
                    y += axis.maxRange;
                    h = w = 0;
                    return {
                        x: x, y: y,
                        width: w, height: h
                    };
                }],
                [!isRotation && verticalAlign === "middle", function (x, y, w, h) {
                    x -= w * (opposite === true);
                    y += axis.maxRange - (axis.maxRange - h) / 2;
                    h = w = 0;
                    return {
                        x: x, y: y,
                        width: w, height: h
                    };
                }],
                [!isRotation, function (x, y, w, h) {
                    x -= w * (opposite === true);
                    y -= margin;
                    h += margin;// title margin top
                    w = 0;
                    return {
                        x: x, y: y,
                        width: w, height: h
                    };
                }]
            ];

            var position = function (name, pos, bbox, options) {
                return ({
                    yAxis: function (pos, bbox) {
                        var x = pos.x, y = pos.y;
                        var w = bbox.width, h = bbox.height;
                        var isTrued = false, func;
                        for (var i = 0; !isTrued && i < condExpr.length; i++) isTrued = (func = condExpr[i])[0];
                            
                        return func[1](x, y, w, h);
                    },
                    xAxis: function (pos, bbox) {
                        var x = pos.x, y = pos.y;
                        var w = bbox.width, h = bbox.height;
                        y += bbox.height;
                        y += axis.labelHeight + margin;
                        x += (axis.maxRange - w) / 2;

                        return {
                            x: x, y: y,
                            width: w, height: h + margin
                        };
                    }
                }[name] || noop)(pos, bbox);
            };
            this.titleWidth = 0;
            this.titleHeight = 0;
            if (context && options.enabled !== false && title.enabled !== false && defined(title.text)) {
                context.save();
                context.textAlign = "start";
                context.textBaseline = "alphabetic";
                context.fillStyle = fontStyle.color;
                context.font = [
                    fontStyle.fontStyle,
                    fontStyle.fontWeight,
                    fontStyle.fontSize + "/" + fontStyle.lineHeight,
                    fontStyle.fontFamily
                ].join(" ");
                bbox = Text.measureText(title.text, fontStyle);

                var box = position(this.name, {x: x, y: y}, bbox, options);
                if (defined(box)) {
                    x = box.x, y = box.y;
                    if (rendered === true) {
                        if (isRotation) {
                            context.translate(x, y);
                            context.rotate(angle);
                            x = y = 0;
                        }
                        context.fillText(title.text, x, y);
                    }

                    this.titleWidth = box.width;
                    this.titleHeight = box.height;
                }
                context.restore();
            }
            this.titleRotation = isRotation;
        },
        setPlotLine: function (x, y, props) {
            var options = this.options,
                fontStyle = {
                    fontSize: "14px",
                    fontWeight: "bold",
                    fontFamily: "Arial",
                    color: "#666"
                },
                arrow = pack("number", props.arrowLength, 5),
                padding = 8,
                w, h,
                text,
                bbox;
            var context = this.context;
            var axis = this;

            text = Numeric.toPrecision(props.value);//.toFixed(2);
            bbox = Text.measureText(text, fontStyle);
            w = bbox.width + padding * 2;
            h = bbox.height + padding;
            if(props.anchor === "bottom"){
                x = Math.min(x, axis.maxRange - w + options.x), y -= (h + arrow);
            }
            else if(props.anchor === "left"){
                x += arrow, y = Math.min(y, axis.maxRange - h + options.y);
            }
            else if(props.anchor === "top"){
                x = Math.min(x, axis.maxRange - w + options.x), y += arrow;
            }
            context.save();
            context.textAlign = "start";
            context.textBaseline = "alphabetic";
            context.fillStyle = "rgba(251, 251, 251, .85)";
            symbolCallout(x, y, w, h, {
                arrowLength: arrow,
                anchor: props.anchor
            })(context);
            (context.lineWidth = 1) && (context.strokeStyle = props.color, context.stroke());
            context.fill();
            context.fillStyle = fontStyle.color;
            context.font = fontStyle.fontWeight + " " + fontStyle.fontSize + " " + fontStyle.fontFamily;
            context.fillText(text, x + padding, y + bbox.height + arrow);
            context.restore();
        },
        setPlotLines: function () {
            var container = this.canvas.parentNode;
            (this.options.plotLines || []).forEach(function (d) {
                var label = d.label;
                if (container && defined(label) && label.useHTML === true) {
                    var dom = document.createElement("div");
                    if (defined(label.className)) {
                        dom.setAttribute("class", label.className);
                    }
                    label.dom = dom;
                    container.appendChild(dom);
                }
            });
        },
        setGrid: function (tick, i, ticks) {
            var options = this.options,
                gridLineInterpolation = options.gridLineInterpolation;
            var context = this.context,
                name = this.name;
            var sin = Math.sin, cos = Math.cos;

            var fillArea = function (x, y, w, h, color) {
                context.fillStyle = color;
                context.fillRect(x, y, w, h);
            };
            var fillRadius = function (tick, color) {
                var x = tick.cx,
                    y = tick.cy,
                    innerRadius = tick.innerRadius,
                    startAngle = tick.startAngle;
                var size = Math.abs(ticks[0].innerRadius - ticks[1].innerRadius);
                var length = options.length,
                    i;
                var ratio, angle;

                context.fillStyle = color;
                context.beginPath();
                if(gridLineInterpolation === "polygon"){
                    for(i = 0; i <= length; i++){
                        ratio = i / length;
                        angle = (ratio * PI2) + startAngle;
                        context[i ? "lineTo" : "moveTo"](
                            cos(angle) * innerRadius + x,
                            sin(angle) * innerRadius + y
                        );
                    }
                    context.lineTo(cos(angle) * (innerRadius - size) + x, sin(angle) * (innerRadius - size) + y);
                    for(i = length; i >= 0; i--){
                        ratio = i / length;
                        angle = (ratio * PI2) + startAngle;
                        context["lineTo"](
                            cos(angle) * (innerRadius - size) + x,
                            sin(angle) * (innerRadius - size) + y
                        );
                    }
                }
                else{
                    angle2arc(
                        x,
                        y,
                        innerRadius,
                        innerRadius - size,
                        0,
                        PI2,
                        false//close path
                    )(context);
                }
                context.fill();
            };
            //alternate grid color
            if (defined(options.alternateGridColor) && ticks.length > 1) {
                context.save();
                context.translate(options.x, options.y);
                if(name === "xAxis"){
                    ((i % 2) & !tick.isLast) && fillArea(
                        tick.x + 0.5,
                        tick.y - options.height,
                        Math.abs(ticks[0].x - ticks[1].x),//tick.size,
                        options.height - 0.5,
                        options.alternateGridColor
                    );
                }
                else if (name === "yAxis") {
                    (!(i % 2) && !tick.isLast) && fillArea(
                        tick.x + 0.5,
                        tick.y - Math.abs(ticks[0].y - ticks[1].y),
                        options.width,
                        Math.abs(ticks[0].y - ticks[1].y),
                        options.alternateGridColor
                    );
                }
                else if (name === "radiusAxis") {
                    (!(i % 2) && !tick.isLast) && fillRadius(tick, options.alternateGridColor);
                }
                context.restore();
            }
        },
        setCrosshair: function (x, y) {
            var options = this.options,
                crosshair = options.crosshair;
            var tx = pack("number", options.x),
                ty = pack("number", options.y);
            var tickPositioner = this.tickPositioner.slice(0),
                tick;
            var n = tickPositioner.length,
                i = 0;
            var intersected = {
                yAxis: function (point, prev, tick) {
                    return point.x >= tx && point.x <= options.width + tx && point.y >= ty && point.y > prev.y + ty && point.y < tick.y + ty;
                },
                xAxis: function (point, prev, tick) {
                    return point.y >= (ty - options.height) && point.y <= ty && point.x >= tx && point.x - tx > prev.x && point.x - tx < tick.x;
                }
            };
            this.crosshair = null;
            if (defined(crosshair) && isNumber(x, true) && isNumber(y, true) && n) {
                if (this.type === "categories") {
                    tickPositioner.push({
                        x: this.name === "yAxis" ? tickPositioner[0].x : tickPositioner[~-n].x + tickPositioner[0].size,
                        y: this.name === "yAxis" ? tickPositioner[~-n].y + tickPositioner[0].size : tickPositioner[~-n].y,
                        size: tickPositioner[0].size
                    });
                }
                n = tickPositioner.length;

                for (i = 1; i < n; i++) {
                    tick = tickPositioner[i];
                    if (intersected[this.name] && intersected[this.name]({ x: x, y: y }, tickPositioner[i - 1], tick)) {
                        this.crosshair = {
                            zIndex: 2,
                            shape: tick
                        };
                        break;
                    }
                }
            }
            return this;
        },
        setOptions: function (options) {
            var domain, range;
            extend(this.options, options);
            if (defined(domain = options.domain)) {
                this.setTickInterval();
            }
            if (defined(range = options.range)) {
                this.minRange = range[0];
                this.maxRange = range[1] || range[0];

                this.setLabels();
            }
            return this;
        },
        labelFormatter: function (value, params) {
            var options = this.options,
                numericSymbols = pack("array", options.lang.numericSymbols, []),
                formatter = (options.labels || {}).formatter,
                logarithmic = pack("object", options.logarithmic, {}),
                ret;//tickPositions
            params = params || {};
            var type = this.type;
            if (isArray(options.categories) || type === "categories") {
                ret = pack("array", options.categories, [])[~-value];
                !defined(ret) && (ret = value);
                this.tickPositions[value] = ret;
            }
            else if (type === "datetime") {
                ret = date2value(value, options.dateType || "year");//Date.format
            }
            else if (type === "logarithmic") {
                if (defined(logarithmic) && isNumber(logarithmic.base) && defined(logarithmic.pow)) {
                    ret = "" + (logarithmic.base === Math.E ? "e" : logarithmic.base);
                }
                if (!defined(ret))
                    ret = numberic2value(value, numericSymbols);
            }
            else {
                ret = numberic2value(value, numericSymbols);
            }
            //formatter rewrite value
            if (isFunction(formatter)) {
                ret = formatter.call({
                    axis: this,
                    value: value,
                    index: ~-value,
                    name: defined(ret) ? ret : value,
                    isFirst: !!params.isFirst,
                    isLast: !!params.isLast
                }, defined(ret) ? ret : value, params.index, this);
            }
            return ret;
        },
        formatter: function (callback) {
            var options = this.options,
                labels = options.labels || {};
            var ticks = this.ticks,
                tick;
            var axis  = this;
            tick = this.Item();

            ticks.forEach(function (item, i) {
                if (item.visibled) {
                    axis.setGrid(item, i, ticks);
                    if (labels.enabled !== false) {
                        tick.adjustLabel(item, i, {
                            isCenter: labels.align === "center" && !!ticks.length,
                            isRotation: axis.isRotation
                        });
                    }
                    tick.render(item, i);
                    callback && callback.call(axis, item);
                }
            });
            tick.line();
            tick.plotLines();
            this.crosshair && tick.crosshair(this.crosshair.shape);
        },
        animateTo: function () {
            var options = this.options,
                labels = options.labels || {},
                gridLineWidth = pack("number", options.gridLineWidth);
            var oldData = this._ticks,
                newData = arrayFilter(this.ticks, function (tick) { return tick.visibled; });
            var axis = this;
            var ticks = [];
            var previous = [];
            if (labels.enabled !== false || gridLineWidth > 0) {
                List.diff(newData, oldData, function (a, b) {
                    return a && b && (a.text.ellipse === b.text.ellipse);
                }).add(function (newIndex) {
                    var oldTick = newData[newIndex];
                    var to;
                    if (oldTick) {
                        oldTick.animate({
                            opacity: 0,
                            x: oldTick.x,
                            y: oldTick.y
                        }, to = {
                            text: oldTick.text,
                            opacity: 1,
                            x: oldTick.x,
                            y: oldTick.y
                        });
                        previous.push(to);
                        ticks.push(oldTick);
                    }
                }).modify(function (newIndex, oldIndex) {
                    var newTick = newData[newIndex],
                        oldTick = oldData[oldIndex];
                    var to;
                    if (newTick && oldTick) {
                        newTick.animate({
                            x: oldTick.x || 0,
                            y: pack("number", oldTick.y, newTick.y, 0)
                        }, to = {
                            text: newTick.text,
                            x: newTick.x,
                            y: newTick.y
                        });
                        ticks.push(newTick);
                        previous.push(to);
                    }
                }).remove(function (newIndex) {
                    var newTick = newData[newIndex];
                    var to;
                    newTick.animate({
                        x: newTick.x,
                        y: newTick.y
                    }, to = {
                        text: newTick.text,
                        x: newTick.x,
                        y: newTick.y
                    });
                    previous.push(to);
                    ticks.push(newTick);
                }).each();
                
                this._ticks = previous;
            }
            return ticks;
        },
        draw: function () {
            this.formatter();
            this.setTitle(true);
        },
        redraw: function (callback) {
            this.draw(callback);
        },
        addTooltip: function (x, y, callback) {
            var options = this.options,
                stops = pack("array", options.stops, []),
                isHorizontal = options.layout === "horizontal",
                tx = pack("number", options.x),
                ty = pack("number", options.y),
                tickLength = pack("number", options.tickLength, 0),
                name = this.name;
            var startValue = this.startValue,
                endValue = this.endValue,
                maxRange = this.maxRange;
            var axis = this;

            var onMove = function(area) {
                extend(area, {
                    xAxis: {
                        width: tx + maxRange,
                        height: ty + tickLength + axis.labelHeight,
                        dx: x,
                        dy: ty,
                        k: (x - tx) / maxRange,
                        anchor: "bottom"
                    },
                    yAxis: {
                        width: tx - tickLength - axis.labelWidth,
                        height: ty + maxRange,
                        dx: tx,
                        dy: y,
                        k: (maxRange - y + ty) / (maxRange),
                        anchor: "left"
                    },
                    colorAxis: {
                        width: tx + (isHorizontal ? maxRange : tickLength),
                        height: ty + (isHorizontal ? tickLength : maxRange),
                        dx: isHorizontal ? x : tx + tickLength,
                        dy: isHorizontal ? ty + tickLength : y,
                        k: (isHorizontal ? x - tx : maxRange - y + ty) / (maxRange),
                        anchor: isHorizontal ? "top" : "left"
                    }
                }[name]);
                if (isNumber(startValue, true) && isNumber(endValue, true) && Intersection.rect({x: x, y: y}, area)) {
                    var k = mathMin(1, mathMax(0, area.k));
                    if (k - 0.01 <= 0) k = 0;
                    if (k - 0.99 >= 0) k = 1;
                    var value = startValue + (endValue - startValue) * k,
                        color = stops.length > 1 ? Color.interpolate(stops[0][1], stops[stops.length - 1][1])(k) : "#000";
                    axis.setPlotLine(area.dx, area.dy, {
                        value: value,
                        color: color,
                        anchor: area.anchor
                    });
                    
                    isFunction(callback) && callback.call(axis, value, color, k);
                }
            };
            onMove({x: tx, y: ty});
            return this;
        },
        destroy: function () {
            
        }
    };
    Chart.Axis = Axis;
})(typeof window !== "undefined" ? window : this, Dalaba);