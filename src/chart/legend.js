(function (global, Chart) {
    var Animate = Chart.Animate;

    var Symbol = {
        circle: Geometry.Symbol.circle,
        rect: Geometry.Symbol.rect,
        ellipse: Geometry.Symbol.ellipse,
        line: function (x, y, w, h) {
            return function (context) {
                //Symbol.rect(x - r, y + h / 2, w + r * 2, 3)(context);
                //context.fill();
                context.save();
                context.beginPath();
                context.lineWidth = 4;
                context.moveTo(x + 3, y + w / 2 - 1);
                context.lineTo(x, y + w / 2 - 1);
                context.moveTo(x + w - 3, y + w / 2 - 1);
                context.lineTo(x + w, y + w / 2 - 1);
                context.stroke();
                //context.fill();
                context.restore();
                context.beginPath();
                context.lineWidth = 3;
                context.arc(x + w / 2, y + w / 2  - 1, w / 4, 0, PI2, true);
                return {
                    x: x,
                    y: y,
                    width: w,
                    height: h
                };
            };
        }
    };
    var defaultOptions = {
        style: {
            fontSize: "12px",
            fontWeight: "bold",
            lineHeight: "normal",
            cursor: "pointer",
            color: "#606060"
        },
        x: 0,
        y: 0,
        width: undefined,
        maxHeight: undefined,
        padding: 8,
        margin: 0,
        layout: "horizontal",//horizontal or vertical,
        verticalAlign: "bottom",//top, bottom, middle
        align: "center",//left, right or center
        floating: false,
        borderWidth: 0,
        borderColor: "#909090",
        backgroundColor: undefined,
        symbolWidth: 14,
        symbolHeight: undefined,
        symbolRadius: 6,
        symbolPadding: 4,
        symbol: {
            enabled: true,
            width: 14,
            height: undefined,
            radius: 6,
            padding: 4
        },
        itemWidth: undefined,
        itemMarginBottom: 8,
        itemDistance: 20,
        navigation: {
            animation: true
        },
        useHTML: false
    };

    function Legend () {
        this.init.apply(this, arguments);
    }
    Legend.prototype = {
        Item: function (x, y, options) {
            this.x = x;
            this.y = y;
            this.node = null;
            this.selected = options.selected;
        },//new this.Element
        init: function (canvas, series, options) {
            this.options = extend({}, defaultOptions);
            options = extend(this.options, options);

            this.data = pack("array", series, []);

            this.container = canvas;
            this.canvas = canvas;
            this.context = this.canvas.getContext("2d");

            if (options.useHTML === true) {
                setStyle(this.canvas = canvas.parentNode.appendChild(document.createElement("div")), {
                    position: "absolute",
                    border: (options.borderWidth | 0) + "px solid " + options.borderColor,
                    "background-color": options.backgroundColor,
                    "z-index": 2
                });
            }

            this.width = 0;
            this.height = pack("number", options.height, 0);
            this.maxHeight = pack("number", options.maxHeight, 0);
            this.items = [];
            this.setLabels();
            //this.translate();
            this.translateY = 0;
            this.scroller = {next: null, prev: null};
            this.globalAnimation = {
                instance: null,
                isFinish: false,
                startY: 0,
                current: 0
            };
        },
        translate: function () {
            var options = this.options,
                x = options.x,
                y = options.y,
                align = pack("string", options.align, "center"),
                verticalAlign = pack("string", options.verticalAlign, "bottom"),
                padding = pack("number", options.padding, 0),
                borderWidth = pack("number", options.borderWidth, 0),
                useHTML = options.useHTML,
               // margin = pack("number", options.margin, 0),
                width = this.width,//legend width
                height = this.maxHeight,// * (useHTML !== true),//legend viewport height
                chartWidth = pack("number", this.container.width / DEVICE_PIXEL_RATIO, width),
                chartHeight = pack("number", this.container.height / DEVICE_PIXEL_RATIO, this.height);

            if (align === "left") {
                x += borderWidth;
            }
            else if (align === "right") {
                x = chartWidth - width - borderWidth - padding - x;// options.width - width + padding + margin;
            }
            else {
                x += (chartWidth - width) / 2;//default middle
            }
            if (verticalAlign === "top") {
                y += borderWidth;
            }
            else if (verticalAlign === "middle") {
                y += (chartHeight - height) / 2;
            }
            else {
                y = chartHeight - height - (borderWidth * 2) - (y * (useHTML !== true));
            }
            this.x = x, this.y = y;
        },
        setData: function (series) {
            this.data = series.slice(0);
            //this.translateY = 0;
            this.setLabels();
            return this;
        },
        setOptions: function (params) {
            extend(this.options, params);
            this.setLabels();
            return this;
        },
        setWidth: function (width) {
            this.width = width;
            this.setLabels();
        },
        setLabels: function () {
            var options = this.options,
                style = options.style,
                padding = options.padding,
                layout = options.layout,
                itemMarginBottom = pack("number", options.itemMarginBottom, 8),
                itemDistance = pack("number", options.itemDistance, 0),
                symbolPadding = pack("number", options.symbolPadding, 0),
                borderWidth = pack("number", options.borderWidth, 0),
                bbox = {width: 0, height: 0},
                symbolWidth = options.symbolWidth,
                useHTML = options.useHTML,
                formatter = options.formatter || options.labelFormatter,
                fontStyle = {
                    fontStyle: style.fontStyle || "normal",
                    fontWeight: style.fontWeight || "normal",
                    fontSize: style.fontSize || "12px",
                    fontFamily: style.fontFamily || "Arial",
                    lineHeight: style.lineHeight || "normal",
                    color: style.color
                };
            var canvas = this.canvas,
                context = this.context,
                items = (this.items = []),
                length = this.data.length;
            var sumWidth = 0,
                sumHeight = 0,
                itemWidth = options.itemWidth || options.width || 80,
                lineNumber = 1,
                maxHeight = 0,
                x = padding,
                y = 0;
            var count = 0;
            var linePixel;
            var itemHTML = "";
            var legend = this;
            var isFormatter = isFunction(formatter);

            this.data.forEach(function (item, i) {
                var text = item.name,
                    selected = item.selected !== false,//默认显示
                    disabled = item.disabled !== true && item.showInLegend !== false;
                var width = 0,
                    textHeight = 0;
                var legendItem;
                var legendFormatter;
                var nowrap = false;
                if (disabled && context) {
                    context.save();
                    context.font = [
                        fontStyle.fontStyle,
                        fontStyle.fontWeight,
                        fontStyle.fontSize + "/" + fontStyle.lineHeight,
                        fontStyle.fontFamily
                    ].join(" ");
                    bbox = Text.measureText(text, fontStyle);
                    context.restore();
                    textHeight = symbolWidth;// Math.max(symbolWidth, bbox.height);

                    if (bbox.width >= itemWidth) {
                        text = Text.multipText(text, itemWidth, fontStyle);
                    }
                    bbox.width = Text.measureText(text, fontStyle).width;
                    width = bbox.width + ({
                        column: symbolWidth,
                        pie: symbolWidth,
                        line: symbolWidth + 4
                    }[item.type] || symbolWidth) + symbolPadding;
                    //第一个除外
                    if (count && (layout === "vertical" || ((x + width) >= options.width - padding * 2))) {
                        nowrap = true;
                        x = padding;
                        //width -= itemDistance;
                        y += textHeight + itemMarginBottom;
                        if(lineNumber % 3 === 0){
                            y += padding - itemMarginBottom;
                        }
                        
                        if(lineNumber === 3){
                            maxHeight = y;//clip height
                        }
                        lineNumber++;
                    }
                    count++;
                }
                items.push(legendItem = {
                    x: x,
                    y: y,
                    width: width,
                    height: textHeight,
                    text: item.name,
                    value: item.name,
                    selected: selected,
                    disabled: disabled,
                    ellipse: text,
                    type: item.type,
                    color: (item.color || style.color),
                    series: item,
                    index: i,
                    nowrap: nowrap
                });
                legendFormatter = isFormatter && formatter.call(legendItem, legendItem.value, legendItem.index, legend);
                if (useHTML === true) {
                    var legendItemHTML = [
                        "<p style='",
                            [
                                "float: left;",
                                "margin:" + (symbolPadding) + "px",
                                "top:" + (y + symbolPadding) + "px",
                                "color:" + (selected ? fontStyle.color : "#ccc"),
                                "font:" + fontStyle.fontStyle + " " + fontStyle.fontWeight + " " + fontStyle.fontSize + " " + fontStyle.fontFamily,
                                "white-space: nowrap"
                            ].join(";"),
                        "' data-legend-index='" + i + "'>",
                        "<span style='",
                            [
                                "display:inline-block",
                                "position:relative",
                                "top:3px",
                                "border-radius:3px",
                                "width:" + symbolWidth + "px",
                                "height:" + symbolWidth + "px",
                                "background-color:" + (selected ? (item.color || style.color) : "#ccc")
                            ].join(";"),
                        "'></span>",
                        " " + text,
                        "</p>"
                    ];
                    if (isFormatter) {
                        if (defined(legendFormatter)) legendItemHTML[6] = legendFormatter, itemHTML += legendItemHTML.join("");
                    }
                    else {
                        itemHTML += legendItemHTML.join("");
                    }
                }
                if (disabled && !isFormatter || legendFormatter) {
                    x += width + itemDistance * (layout === "horizontal");
                }
                sumWidth = Math.max(sumWidth, x);
                sumHeight = y;
            });
            //sumHeight += bbox.height + padding / 2;
            sumHeight += symbolWidth;// + padding / 2;
            if (!defined(options.height)) {
                this.height = (sumHeight + padding) * (length !== 0);
            }
            this.width = (sumWidth + padding * 2 - itemDistance * (layout === "horizontal")) * (length !== 0);//fix width
            if (lineNumber < 4) {
                maxHeight = this.height;
            }
            if (layout === "vertical") {
                maxHeight = this.height;
            }
            if (isNumber(options.maxHeight)) {
                maxHeight = options.maxHeight;
            }
            this.maxHeight = (maxHeight + padding) * (length !== 0);//options.borderWidth * 2
            this.lineNumber = lineNumber * (length !== 0);

            this.translate();

            linePixel = fixLinePixel(0, 0, this.width + (this.height > this.maxHeight) * 15, this.maxHeight - borderWidth, borderWidth);
            if (useHTML === true && itemHTML.length) {
                var bbox;
                canvas.innerHTML = itemHTML;
                setStyle(canvas, {
                    overflow: "auto",
                    height: this.maxHeight + "px",
                    "white-space": "nowrap"
                });
                bbox = canvas.getBoundingClientRect();
                this.height = bbox.height;
                this.width = bbox.width;

                setStyle(canvas, {
                    left: (this.x) + linePixel.x + "px",
                    top: this.y + "px",
                    width: this.width + "px"
                });
            }
        },
        scrollTop: function (y) {
            this.translateY = y;
        },
        formatter: function () {
            var context = this.context,
                options = this.options,
                style = pack("object", options.style, {}),
                formatter = options.formatter,
                fontStyle = {
                    fontStyle: pack("string", style.fontStyle, "normal"),
                    fontWeight: pack("string", style.fontWeight, "normal"),
                    fontSize: pack("string", style.fontSize, "12px"),
                    fontFamily: pack("string", style.fontFamily, "Arial"),
                    lineHeight: pack("string", style.lineHeight, "normal"),
                    color: style.color
                },
                padding = pack("number", options.padding, 0);
            var symbolWidth = pack("number", options.symbolWidth, 16),
                symbolRadius = pack("number", options.symbolRadius, 0),
                symbolPadding = pack("number", options.symbolPadding, 0),
                //symbolHeight = 10,
                symbolTypes = {},
                symbolBBox;
            var legend = this;

            context.save();
            context.translate(padding, padding + this.translateY);
            this.items.forEach(function (item) {
                var x = item.x,
                    y = item.y;
                var color = item.selected ? item.color : "#ccc";
                var tag, bbox;
                var legendFormatter = isFunction(formatter) && formatter.call(item, item.value, item.index, legend);
                if (item.disabled) {
                    context.save();
                    //context.textBaseline = "bottom"
                    context.font = [
                        fontStyle.fontStyle,
                        fontStyle.fontWeight,
                        fontStyle.fontSize + "/" + (fontStyle.lineHeight),
                        fontStyle.fontFamily
                    ].join(" ");
                    if (isFunction(formatter)) {
                        if (defined(legendFormatter)) {
                            tag = Text.HTML(Text.parseHTML(legendFormatter), context, fontStyle);
                        }
                    }
                    else {
                        tag = Text.HTML(Text.parseHTML(item.ellipse), context, fontStyle);
                    }
                    if (!isFunction(formatter) || defined(legendFormatter)) {
                        symbolTypes = {
                            column: Symbol.rect(x, y, symbolWidth, symbolWidth, symbolRadius),
                            pie: Symbol.circle(x, y + symbolWidth / 2, symbolWidth / 2, symbolWidth),
                            line: Symbol.line(x, y, symbolWidth + 4, symbolWidth)
                        };
                        context.lineWidth = 1;
                        context.strokeStyle = color;
                        if (Color.isColor(color)) {
                            color = Color.parse(color).alpha(0.55).rgba();
                        }
                        else if (isObject(color)) {
                            color = defined(color.radialGradient)
                                ? Color.parse(color).radial(x + symbolRadius, y + symbolRadius, symbolRadius)
                                : defined(color.linearGradient)
                                    ? Color.parse(color).linear(x, y, symbolWidth, symbolWidth)
                                    : "#000";
                        }
                        else {
                            color = "#000";
                        }
                        
                        context.fillStyle = color;
                        symbolBBox = (symbolTypes[item.type] || symbolTypes.column)(context);
                        context.stroke();
                        context.fill();
                        //draw text label
                        
                        context.textAlign = "start";
                        context.textBaseline = "alphabetic";
                        context.fillStyle = item.selected ? fontStyle.color : "#ccc";
                    
                        bbox = tag.getBBox();
                        x = x + symbolBBox.width + symbolPadding;
                        //y = symbolBBox.y + symbolBBox.height;// - bbox.height;// + symbolBBox.height / 2;
                        //y += (bbox.height - symbolBBox.height) / 2;
                        y = y + bbox.height;
                        y = y + (symbolBBox.height - 1 - bbox.height) / 2;
                        //console.log(bbox, item.ellipse, fontStyle)
                    
                        context.translate(x, y);
                        tag.toCanvas(context);
                    }
                    context.restore();
                }
            });
            context.restore();
        },
        draw: function () {
            var maxHeight = this.maxHeight,
                options = this.options,
                //padding = pack("number", options.padding, 0),
                borderWidth = pack("number", options.borderWidth, 0),
                borderColor = pack("string", options.borderColor, "#000000"),
                linePixel;
            var context = this.context;

            var isClip = this.height > maxHeight;

            if (this.data.length && options.useHTML !== true) {
                context.save();
                context.translate(this.x, this.y);
                linePixel = fixLinePixel(0, 0, this.width + isClip * 15, maxHeight - borderWidth, borderWidth);
                
                context.fillStyle = defined(options.backgroundColor) ? options.backgroundColor : "none";
                Symbol.rect(linePixel.x, linePixel.y, linePixel.width, linePixel.height)(context);
                
                if (defined(options.backgroundColor)) {
                    context.fill();
                }
                (context.lineWidth = borderWidth) > 0 && (
                    context.strokeStyle = borderColor,
                    context.stroke()
                );
                if (isClip) {
                    context.clip();
                    this.next();
                }
                
                this.formatter();

                context.restore();
            }
        },
        next: function () {
            var options = this.options,
                itemMarginBottom = pack("number", options.itemMarginBottom, 8),
                width = this.width,
                maxHeight = this.maxHeight;
            var size = 5, x, y = -size;
            var context = this.context;
            var prev = { p0: {x: 0, y: 0}, p1: {x: 0, y: 0}, type: "prev"},
                next = { p0: {x: 0, y: 0}, p1: {x: 0, y: 0}, type: "next"};
            if (defined(options.borderWidth) && options.borderWidth > 0) {
                context.beginPath();
                context.moveTo(width, 0);
                context.lineTo(width, maxHeight);
                context.stroke();
            }

            context.lineWidth = 3;
            context.strokeStyle = "#CCC";
            context.fillStyle = "red";
            context.lineJoin = "round";
            context.lineCap = "round";
            context.beginPath();
            context.moveTo(x = (next.p1.x = width + size * 2 + 2), (next.p0.y = y += maxHeight - size / 2));
            context.lineTo(x -= size, next.p1.y = y + size);
            context.lineTo(next.p0.x = x -= size, y);
            context.stroke();
            context.beginPath();
            context.moveTo(prev.p1.x = x += size * 2, y = itemMarginBottom);
            context.lineTo(x -= size, prev.p0.y = y - size);
            context.lineTo(prev.p0.x = x -= size, prev.p1.y = y);
            context.stroke();
            this.scroller.prev = prev;
            this.scroller.next = next;
        },
        onScroll: function (callback) {
            var options = this.options,
                //borderWidth = pack("number", options.borderWidth, 0),
                navigation = options.navigation || {},
                padding = pack("number", options.padding, 0);
            var globalAnimation = this.globalAnimation,
                Animation;

            var canvas = this.canvas,
                legend = this;
            if (arguments[1]) {
                canvas = callback;
                callback = arguments[1];
            }
            var nextId = 0;

            var animateTo = function (e, clickedItem) {
                var dir = (clickedItem.type === "next" || -1);
                var isFinish = globalAnimation.isFinish,
                    isLast = false,
                    startY = globalAnimation.startY,
                    endY;
                var step = legend.maxHeight - padding;
                endY = startY + dir * step;
                if (endY < 0) {
                    startY = -1;/*缓动*/
                    endY = 0;
                }
                if (endY >= legend.height) {
                    endY = startY + 1;
                    isLast = true;
                }

                if (defined(Dalaba.Animation) && !globalAnimation.instance/* && (endY < legend.height)*/) {
                    globalAnimation.instance = new Dalaba.Animation();
                }
                if (globalAnimation.instance !== null) {
                    clickedItem.animate({
                        translateY: startY
                    }, {
                        translateY: endY
                    });
                    globalAnimation.instance.addAnimate(clickedItem, {
                        duration: 300,
                        delay: 0,
                        easing: "linear"
                    }).fire(function () {
                        var pos = clickedItem.translateY;//startY + (endY - startY) * timer;
                        legend.translateY = -pos;
                        callback && callback.call(legend, e, pos);
                        isFinish = true;
                    }, function () {
                        if (!isLast)
                            globalAnimation.startY = startY = endY;
                        globalAnimation.isFinish = isFinish = false;
                    });
                }
                else {
                    legend.translateY = -endY;
                    callback && callback.call(legend, e, endY);
                    if (!isLast)
                        globalAnimation.startY = startY = endY;
                }
            };
            var clipTo = function (e, clickedItem) {
                //var items = legend.items;
                //var currentY;
                var length = Math.floor(legend.height / legend.maxHeight);
                var dir = (clickedItem.type === "next" || -1);

                nextId += dir;
                nextId = Math.max(0, Math.min(nextId, length));
                var cy = nextId * legend.maxHeight - padding * nextId;
                /*for(var i = 0; i < items.length; i++){
                    if(cy <= items[i].y){
                        currentY = items[i].y - items[i].height - options.padding;
                        break;
                    }
                }*/
                //console.log(nextId, cy);
                cy = mathMax(0, cy);
                legend.translateY = -cy;
                callback && callback(legend, cy);
            };

            var onClick = function (e) {
                var buttons = [legend.scroller.prev, legend.scroller.next];
                var clickedItem = null;
                var evt = Event.normalize(e, this),
                    ex = evt.x,
                    ey = evt.y,
                    x = legend.x,
                    y = legend.y;
                if (legend.height < legend.maxHeight) {
                    return;//no clip
                }
                buttons.forEach(function (button) {
                    if (button !== null) {
                        button.__proto__ = new Animate();
                    }
                });

                for (var i = 0; i < buttons.length; i++) {
                    var item = buttons[i];
                    if (item && Intersection.rect({
                        x: ex,
                        y: ey
                    }, {
                        x: item.p0.x - 10 + x,
                        y: item.p0.y - 10 + y,
                        width: item.p1.x + 10 + x,
                        height: item.p1.y + 10 + y
                    })) {
                        clickedItem = item;
                        break;
                    }
                }

                if (clickedItem) {
                    if(navigation.animation !== false){
                        animateTo(e, clickedItem);
                    }
                    else{
                        clipTo(e, clickedItem);
                    }
                }
            };
            if (hasTouch) {
                //new Dalaba.Touch(canvas).on("tap", onClick, false);
                new Dalaba.Touch(canvas).on({
                    tap: onClick
                });
            }
            else if (canvas.nodeType === 1) {
                canvas.removeEventListener("click", onClick, false);
                canvas.addEventListener("click", onClick, false);
            }
            onClick = null;
            return this;
        },
        destroy: function () {
            var globalAnimation = this.globalAnimation;
            globalAnimation.isFinish = false;
            globalAnimation.startY = 0;
            globalAnimation.current = 0;
            return this;
        }
    };

    (function (Legend) {
        var useCapture = false;

        var isInside = function (y, bounds) {
            return !(
                y < bounds.y ||
                y > bounds.height + bounds.y
            );
        };
        var filter = function (legend, item, x, y) {
            var options = legend.options,
                padding = pack("number", options.padding, 0),
                borderWidth = pack("number", options.borderWidth, 0),
                context = legend.context;
            Symbol.rect(
                legend.x + item.x,
                legend.y + item.y + legend.translateY + padding,//translateY
                item.width + padding,
                item.height
            )(context);
            //context.fill();
            return isInside(y / DEVICE_PIXEL_RATIO, {
                y: legend.y - borderWidth,
                height: legend.maxHeight - borderWidth
            }) &&
            context.isPointInPath(x, y);
        };

        var onAction = function (x, y, callback) {
            var clicked = false;
            var items = this.items,
                item;
            var that = this;

            var flag = x === true ? function (item) {
                while (y && y.getAttribute && y.getAttribute("data-legend-index") === null) y = y.parentNode;
                return (y && y.getAttribute && parseInt(y.getAttribute("data-legend-index"), 10)) === item.index;
            } : function(item) {
                return that.context && filter(that, item, x, y);
            };
            for (var i = 0; i < items.length; i++) {
                item = items[i];
                if (flag(item)) {
                    clicked = true;
                    break;
                }
            }
            clicked && callback.call(item, clicked, items);
        };
        var getXY = function (e, el) {
            var evt = Event.normalize(e, el),
                x = evt.x,
                y = evt.y;
            return [x *= DEVICE_PIXEL_RATIO, y *= DEVICE_PIXEL_RATIO];
        };
        extend(Legend.prototype, {
            onClick: function (callback) {
                var canvas = this.canvas,
                    legend = this;
                var useHTML = this.options.useHTML;

                if (arguments[1]) {
                    canvas = callback;
                    callback = arguments[1];
                }
                
                var onClick = function (e) {
                    var x = getXY(e, this),
                        y = x[1];
                    x = x[0];

                    onAction.apply(legend, (useHTML === true ? [useHTML, e.target] : [x, y]).concat(function (clicked, items) {
                        var item = this;
                        if (clicked) {
                            item.selected = !item.selected;
                            callback && callback.call(item, e, item.series, item.index, items);
                        }
                    }));
                };
                if (hasTouch && useHTML !== true) {
                    new Dalaba.Touch(canvas).on({
                        tap: onClick
                    });
                }
                else if (canvas.nodeType === 1) {
                    canvas = useHTML === true ? this.canvas : canvas;
                    canvas.removeEventListener("click", onClick, useCapture);
                    canvas.addEventListener("click", onClick, useCapture);
                }
                //onClick = null;
                return this;
            },
            onState: function (event, callback, mouseout) {
                var legend = this,
                    canvas = this.canvas;
                var flag;

                if (arguments[1]) {
                    callback = arguments[1];
                }
                
                var onState = function (e) {
                    var x = getXY(e, canvas),
                        y = x[1];
                    x = x[0];
                    onAction.call(legend, x, y, function (clicked, items) {
                        var item = this;
                        if (!clicked) {
                            flag = 0;
                        }
                        if (clicked && !flag) {
                            flag = 1;
                            callback && callback.call(item, item.series, item.index, items);
                        }
                        else {
                            mouseout && mouseout.call(item, item.series);
                        }
                    });
                };
                onState(event);
                return this;
            }
        });
    })(Legend);

    Chart.Legend = Legend;

    if (typeof module === "object" && module.exports) {
        module.exports = Legend;
    }
    else if (typeof define === "function" && define.amd)
        define(function () {
            return Legend;
        });
    else {
        (typeof Chart !== "undefined" ? Chart : this).Legend = Legend;
    }
})(typeof window !== "undefined" ? window : global, Dalaba.Chart);