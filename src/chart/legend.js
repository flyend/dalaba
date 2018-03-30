(function(global, Chart){
    var Symbol = {
        circle: function(x, y, w, h) {
            var PI2 = Math.PI * 2;
            return function(context){
                context.beginPath();
                context.arc(x + w / 2, y + w / 2, w / 2 - 0.5, 0, PI2, true);
                //context.arc(x, y, h * 0.4, 0, PI2, false);
                return {
                    x: x,// + w / 2 - 1,
                    y: y,// + w / 2 - 1,
                    width: w,
                    height: h
                };
            };
        },
        rect: function(x, y, w, h, r){
            r = r || 0;
            var linePixel = fixLinePixel(x, y, w - 1, h - 1);
            x  = linePixel.x, y = linePixel.y;
            w = linePixel.width, h = linePixel.height;
            return function(context){
                context.beginPath();
                context.moveTo(x + r, y);
                //top-right
                context.lineTo(x + w - r, y);
                context.bezierCurveTo(x + w, y, x + w, y, x + w, y + r);//top-right corner
                //bottom-right
                context.lineTo(x + w, y + h - r);
                context.bezierCurveTo(x + w, y + h, x + w, y + h, x + w - r, y + h);//bottom-right corner
                //bottom-left
                context.lineTo(x + r, y + h);
                context.bezierCurveTo(x, y + h, x, y + h, x, y + h - r);//bottom-left corner
                //top-left
                context.lineTo(x, y + r);
                context.bezierCurveTo(x, y, x, y, x + r, y);//top-left corner
                //context.closePath();
                return {
                    x: x - 1,
                    y: y - 1,
                    width: w,
                    height: h
                };
            };
        },
        ellipse: function(x, y, w, h){
            var cpw = 0.166 * w;
            return function(context){
                context.beginPath();
                context.moveTo(x + w / 2, y);
                context.bezierCurveTo(x + w + cpw, y, x + w + cpw, y + h, x + w / 2, y + h);
                context.bezierCurveTo(x - cpw, y + h, x - cpw, y, x + w / 2, y);
                context.closePath();
            };
        },
        line: function(x, y, w, h){
            var PI2 = Math.PI * 2;
            return function(context){
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

    var setStyle = function (context, attr) {
        for(var p in attr) if(attr.hasOwnProperty(p)){
            context.style[p.replace(/\-(\w)/g, function(all, s){
                return s.toUpperCase();
            })] = attr[p];
        }
        return context;
    };

    function Legend(){
        this.init.apply(this, arguments);
    }
    Legend.prototype = {
        Item: function(x, y, options){
            this.x = x;
            this.y = y;
            this.node = null;
            this.selected = options.selected;
        },//new this.Element
        init: function(canvas, series, options){
            this.options = extend({}, defaultOptions);
            options = extend(this.options, options);

            this.data = pack("array", series, []);

            this.container = canvas;
            this.canvas = canvas;
            this.context = this.canvas.getContext("2d");

            if (options.useHTML === true) {
                this.canvas = setStyle(canvas.parentNode.appendChild(document.createElement("div")), {
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
                isFinish: false,
                startY: 0,
                current: 0
            };
        },
        translate: function(){
            var options = this.options,
                x = options.x,
                y = options.y,
                align = pack("string", options.align, "center"),
                verticalAlign = pack("string", options.verticalAlign, "bottom"),
                padding = pack("number", options.padding, 0),
                borderWidth = pack("number", options.borderWidth, 0),
               // margin = pack("number", options.margin, 0),
                width = this.width,//legend width
                height = this.maxHeight,//legend viewport height
                chartWidth = pack("number", this.container.width / DEVICE_PIXEL_RATIO, width),
                chartHeight = pack("number", this.container.height / DEVICE_PIXEL_RATIO, this.height);

            if(align === "left"){
                x += borderWidth;
            }
            else if(align === "right"){
                x = chartWidth - width - borderWidth - padding - x;// options.width - width + padding + margin;
            }
            else{
                x += (chartWidth - width) / 2;//default middle
            }
            if(verticalAlign === "top"){
                y += borderWidth;
            }
            else if(verticalAlign === "middle"){
                y += (chartHeight - height) / 2;
            }
            else{
                y = chartHeight - height - borderWidth - y;
            }
            this.x = x, this.y = y;
        },
        setData: function(series){
            this.data = series.slice(0);
            //this.translateY = 0;
            this.setLabels();
            return this;
        },
        setOptions: function(params){
            extend(this.options, params);
            this.setLabels();
            return this;
        },
        setWidth: function(width){
            this.width = width;
            this.setLabels();
        },
        setLabels: function(){
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
                formatter = options.formatter,
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

            this.data.forEach(function(item, i){
                var text = item.name,
                    selected = item.selected !== false,//默认显示
                    disabled = item.showInLegend !== false;
                var width = 0,
                    textHeight = 0;
                var legendItem;
                var legendFormatter;
                var nowrap = false;
                if (disabled) {
                    context.font = [
                        fontStyle.fontStyle,
                        fontStyle.fontWeight,
                        fontStyle.fontSize + "/" + fontStyle.lineHeight,
                        fontStyle.fontFamily
                    ].join(" ");
                    bbox = Text.measureText(text, fontStyle);
                    textHeight = symbolWidth;// Math.max(symbolWidth, bbox.height);

                    if(bbox.width >= itemWidth){
                        text = Text.multipText(text, itemWidth, fontStyle);
                    }
                    bbox.width = Text.measureText(text, fontStyle).width;
                    width = bbox.width + ({
                        column: symbolWidth,
                        pie: symbolWidth,
                        line: symbolWidth + 4
                    }[item.type] || symbolWidth) + symbolPadding;
                    //第一个除外
                    if(count && (layout === "vertical" || ((x + width) >= options.width - padding * 2))){
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
                                "position: absolute",
                                "left:" + (x) + "px",
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
                if (!isFormatter || legendFormatter) {
                    x += width + itemDistance * (layout === "horizontal");
                }
                sumWidth = Math.max(sumWidth, x);
                sumHeight = y;
            });
            //sumHeight += bbox.height + padding / 2;
            sumHeight += symbolWidth;// + padding / 2;
            if(!defined(options.height)){
                this.height = (sumHeight + padding) * (length !== 0);
            }
            this.width = (sumWidth + padding * 2 - itemDistance * (layout === "horizontal")) * (length !== 0);//fix width
            if(lineNumber < 4){
                maxHeight = this.height;
            }
            if(layout === "vertical"){
                maxHeight = this.height;
            }
            if(isNumber(options.maxHeight)){
                maxHeight = options.maxHeight;
            }
            this.maxHeight = (maxHeight + padding) * (length !== 0);//options.borderWidth * 2
            this.lineNumber = lineNumber * (length !== 0);

            this.translate();

            linePixel = fixLinePixel(0, 0, this.width + (this.height > this.maxHeight) * 15, this.maxHeight - borderWidth, borderWidth);

            if (useHTML === true && itemHTML.length) {
                setStyle(canvas, {
                    left: this.x + linePixel.x + "px",
                    top: this.y + linePixel.y + "px",
                    height: linePixel.height + "px",
                    width: linePixel.width + "px",
                    overflow: "auto"
                });
                canvas.innerHTML = itemHTML;
            }
        },
        scrollTop: function(y){
            this.translateY = y;
        },
        formatter: function(){
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
            this.items.forEach(function(item){
                var x = item.x,
                    y = item.y;
                var color = item.selected ? item.color : "#ccc";
                var tag, bbox;
                var legendFormatter = isFunction(formatter) && formatter.call(item, item.value, item.index, legend);
                if(item.disabled) {
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
                            pie: Symbol.circle(x, y, symbolWidth, symbolWidth),
                            line: Symbol.line(x, y, symbolWidth + 4, symbolWidth)
                        };
                        context.lineWidth = 1;
                        context.strokeStyle = color;
                        if(Color.isColor(color)){
                            color = Color.parse(color).alpha(0.55).rgba();
                        }
                        else if(isObject(color)){
                            color = defined(color.radialGradient)
                                ? Color.parse(color).radial(x + symbolRadius, y + symbolRadius, symbolRadius)
                                : defined(color.linearGradient)
                                    ? Color.parse(color).linear(x, y, symbolWidth, symbolWidth)
                                    : "#000";
                        }
                        else{
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
        draw: function(){
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
                
                if(defined(options.backgroundColor)){
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
        next: function(){
            var options = this.options,
                itemMarginBottom = pack("number", options.itemMarginBottom, 8),
                width = this.width,
                maxHeight = this.maxHeight;
            var size = 5, x, y = -size;
            var context = this.context;
            var prev = { p0: {x: 0, y: 0}, p1: {x: 0, y: 0}, type: "prev"},
                next = { p0: {x: 0, y: 0}, p1: {x: 0, y: 0}, type: "next"};
            if(defined(options.borderWidth) && options.borderWidth > 0){
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
        onScroll: function(callback){
            var options = this.options,
                //borderWidth = pack("number", options.borderWidth, 0),
                navigation = options.navigation || {},
                padding = pack("number", options.padding, 0);
            var globalAnimation = this.globalAnimation,
                Animation;

            var canvas = this.canvas,
                legend = this;
            if(arguments[1]){
                canvas = callback;
                callback = arguments[1];
            }
            var nextId = 0;

            var animateTo = function(clickedItem){
                //var length = Math.ceil(legend.height / (legend.maxHeight - 2)),
                var dir = (clickedItem.type === "next" || -1);
                var isFinish = globalAnimation.isFinish,
                    isLast = false,
                    //current = globalAnimation.current,
                    startY = globalAnimation.startY,
                    endY;
                var step = legend.maxHeight - padding;

                //globalAnimation.current = current = Math.min(length - 1, Math.max(0, current += dir));
                endY = startY + dir * step;
                if(endY < 0){
                    startY = -1;/*缓动*/
                    endY = 0;
                }
                if(endY >= legend.height){
                    endY = startY + 1;
                    isLast = true;
                }
                // (current += dir) * (legend.maxHeight - padding - borderWidth*0);
                //console.log(endY, startY, legend.maxHeight, legend.height);
                if (defined(Dalaba.Animation)/* && (endY < legend.height)*/) {
                    var value = 0;
                    /*Animation ? Animation.stop() : (*/Animation = new Dalaba.Animation();
                    [[{ }, function (timer) {
                        value = startY + (endY - startY) * timer;
                    }]].forEach(function(item){
                        var step = item[1];
                        Animation.addAnimate(item[0], {
                            step: function(target, timer){
                                step(timer);
                                legend.translateY = -(value);
                                callback && callback(legend, value);
                            },
                            duration: 300,
                            delay: 0,
                            easing: "linear"
                        });
                    });

                    Animation.fire(function(){
                        isFinish = true;
                    }, function(){
                        if(!isLast)
                            globalAnimation.startY = startY = endY;
                        globalAnimation.isFinish = isFinish = false;
                    });
                }
                else{
                    legend.translateY = -endY;
                    callback && callback(legend, endY);
                    if(!isLast)
                        globalAnimation.startY = startY = endY;
                }
            };
            var clipTo = function(clickedItem){
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
                cy = Math.max(0, cy);
                legend.translateY = -cy;
                callback && callback(legend, cy);
            };

            var onClick = function(e){
                var buttons = [legend.scroller.prev, legend.scroller.next];
                var clickedItem = null;
                var evt = Event.normalize(e, this),
                    ex = evt.x,
                    ey = evt.y,
                    x = legend.x,
                    y = legend.y;
                if(legend.height < legend.maxHeight){
                    return;//no clip
                }

                for(var i = 0; i < buttons.length; i++){
                    var item = buttons[i];
                    if(item && Intersection.rect({
                        x: ex,
                        y: ey
                    }, {
                        x: item.p0.x - 10 + x,
                        y: item.p0.y - 10 + y,
                        width: item.p1.x + 10 + x,
                        height: item.p1.y + 10 + y
                    })){
                        clickedItem = item;
                        break;
                    }
                }

                if(clickedItem){
                    if(navigation.animation !== false){
                        animateTo(clickedItem);
                    }
                    else{
                        clipTo(clickedItem);
                    }
                }
            };
            if(hasTouch) {
                //new Dalaba.Touch(canvas).on("tap", onClick, false);
                new Dalaba.Touch(canvas).on({
                    tap: onClick
                });
            }
            else if(canvas.nodeType === 1) {
                canvas.removeEventListener("click", onClick, false);
                canvas.addEventListener("click", onClick, false);
            }
            onClick = null;
            return this;
        },
        destroy: function(){
            var globalAnimation = this.globalAnimation;
            globalAnimation.isFinish = false;
            globalAnimation.startY = 0;
            globalAnimation.current = 0;
            return this;
        }
    };
    (function(Legend) {
        var useCapture = false;

        var isInside = function(y, bounds){
            return !(
                y < bounds.y ||
                y > bounds.height + bounds.y
            );
        };
        var filter = function(legend, item, x, y){
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

        var onAction = function(x, y, callback){
            var clicked = false;
            var items = this.items,
                item;
            var that = this;

            var flag = x === true ? function(item) {
                while (y && y.getAttribute && y.getAttribute("data-legend-index") === null) y = y.parentNode;
                return (y && y.getAttribute && parseInt(y.getAttribute("data-legend-index"), 10)) === item.index;
            } : function(item) {
                return filter(that, item, x, y);
            };
            for(var i = 0; i < items.length; i++){
                item = items[i];
                if(flag(item)){
                    clicked = true;
                    break;
                }
            }
            callback.call(item, clicked, items);
        };
        var getXY = function(e, el){
            var evt = Event.normalize(e, el),
                x = evt.x,
                y = evt.y;
            return [x *= DEVICE_PIXEL_RATIO, y *= DEVICE_PIXEL_RATIO];
        };
        extend(Legend.prototype, {
            onClick: function(callback){
                var canvas = this.canvas,
                    legend = this;
                var useHTML = this.options.useHTML;

                if(arguments[1]){
                    canvas = callback;
                    callback = arguments[1];
                }
                
                var onClick = function(e){
                    var x = getXY(e, this),
                        y = x[1];
                    x = x[0];

                    onAction.apply(legend, (useHTML === true ? [useHTML, e.target] : [x, y]).concat(function(clicked, items) {
                        var item = this;
                        if(clicked){
                            item.selected = !item.selected;
                            callback && callback.call(item, item.series, item.index, items);
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
            onState: function(callback){
                var canvas = this.canvas,
                    legend = this;
                var flag;

                if(arguments[1]){
                    canvas = callback;
                    callback = arguments[1];
                }
                
                var onState = function(e){
                    var x = getXY(e, this),
                        y = x[1];
                    x = x[0];
                    onAction.call(legend, x, y, function(clicked, items){
                        var item = this;
                        if(!clicked){
                            flag = 0;
                        }
                        if(clicked && !flag){
                            flag = 1;
                            callback && callback.call(item, item.series, item.index, items);
                        }
                    });
                };
                if(canvas.nodeType === 1){
                    canvas.removeEventListener("mousemove", onState, useCapture);
                    canvas.addEventListener("mousemove", onState, useCapture);
                }
                onState = null;
                return this;
            }
        });
    })(Legend);

    Chart.Legend = Legend;

    if(typeof module === "object" && module.exports) {
        module.exports = Legend;
    }
    else if(typeof define === "function" && define.amd)
        define(function(){
            return Legend;
        });
    else {
        (typeof Chart !== "undefined" ? Chart : this).Legend = Legend;
    }
})(typeof window !== "undefined" ? window : global, Dalaba.Chart);