/**
 * Chart constructor function
 * Dalaba.Chart, new Dalaba.Chart method
**/
require("./lib");
require("./define");

(function(global, Dalaba) {
    var Series = Dalaba.Chart.Series;

    function setAttribute(el, attrs){
        if(el) for(var p in attrs)
            el.setAttribute(p, attrs[p]);
    }

    //default chart options
    var defaultOptions = require("./chart.options");

    /*
     * OffScreen Canvas
    */
    function Layer(container, width, height){
        var canvas = document.createElement("canvas");
        this.context = canvas.getContext("2d");

        setAttribute(this.canvas = canvas, {
            width: width,
            height: height,
            style: [
                "position:absolute",
                "left:0px",
                "top:0px",
                "-webkit-user-select:none",
                "cursor:default"
            ].join(";")
        });
        rescale(this.context, width, height, DEVICE_PIXEL_RATIO);

        container.appendChild(this.canvas);
    }

    function globalStyle(options){
        var chartOptions = options.chart || {},
            plotOptions = options.plotOptions;
        var split = function(){
            var r = [];
            [].forEach.call(arguments, function(item){
                r = r.concat(isArray(item) ? item : isObject(item) ? [item] : []);
            });
            return r;
        };
        var copy = function(item, attr){
            for(var p in attr) if(!item.hasOwnProperty(p)){
                item[p] = attr[p];
            }
            return item;
        };
        split(options.yAxis, options.xAxis, options.colorAxis, options.polarAxis).map(function(item){
            return item.labels || (item.labels = {});
        }).concat(pack("array", options.title, [options.title]).map(function(item){
            copy(item, defaultOptions.title);
        }), pack("array", options.subtitle, [options.subtitle]).map(function(item){
            copy(item, defaultOptions.subtitle);
        })).concat([
            options.tooltip, options.legend, options.credits,
            plotOptions.line.dataLabels,
            plotOptions.spline.dataLabels,
            plotOptions.area.dataLabels,
            plotOptions.areaspline.dataLabels,
            plotOptions.column.dataLabels,
            plotOptions.bar.dataLabels,
            plotOptions.pie.dataLabels
        ]).forEach(function(item){
            if(defined(item)){
                if(defined(item.style)){
                    for(var p in chartOptions.style){
                        !item.style.hasOwnProperty(p) && (item.style[p] = chartOptions.style[p]);
                    }
                }
                else
                    item.style = chartOptions.style;
            }
        });
    }

    function parseImageURI(background, backgroundImage) {
        var tokens = backgroundImage.match(/\S+/g),
            url;
        var image;

        if (tokens && tokens.length && !!~(url = tokens[0]).indexOf("url")) {
            url = (url = url.substr(url.indexOf("url") + 3)).substr(url.lastIndexOf("(") + 1, url.indexOf(")") - 1);

            background.loaded = function() {
                background.completed = true;
                background.size = (tokens.length === 6 ? [tokens[4], tokens[5]] : tokens.length === 4 ? [tokens[3], tokens[3]] : [this.width, this.height]).map(parseFloat);
            };
            background.fail = function() {
                console.error("background image loaded fail. <options.chart.backgroundImage>");
            };
            (image = background.image = new Image).onload = background.loaded;
            image.onerror = background.fail;
            image.src = url;
            tokens[1] && !!~"repeat no-repeat repeat-x repeat-y".indexOf(tokens[1]) && (background.repeat = tokens[1]);
            tokens.length === 4 | tokens.length === 6 && (background.position = ([tokens[2], tokens.length === 6 ? tokens[3] : tokens[2]]).map(parseFloat));
        }
    }
   
    var Chart = function(element, options) {
        var width, height;

        var chart = this;

        var chartOptions;

        var isNumber = function(v) {
            return Dalaba.isNumber(v, true);
        };

        if (!defined(element)) {
            return null;
        }

        this.options = extend({}, defaultOptions);
        extend(this.options, options);
        globalStyle(this.options);

        chartOptions = pack("object", this.options.chart, {});

        width = chartOptions.width, height = chartOptions.height;

        if (!isNumber(width) || !isNumber(height)) if (element.nodeType === 1) {
            height = (width = this.getSize(element)).height;
            width = width.width;
        }
        else {
            width = pack(isNumber, element.width, 0);
            height = pack(isNumber, element.height, 0);
        }

        this.width = width;
        this.height = height;

        if (element.getContext) {
            this.canvas = this.container = element;
        }
        else {
            setAttribute(this.container = document.createElement("div"), extend({
                style: [
                    "width:" + chart.width + "px",
                    "height:" + chart.height + "px",
                    "overflow:hidden",
                    "position:relative",
                    "background:transparent",
                    "-webkit-tap-highlight-color:transparent",
                    "-webkit-user-select:none"
                ].join(";")
            }, {"class": chartOptions.className}));
            (this.renderer = element).appendChild(this.container);
            this.canvas = new Layer(this.container, this.width, this.height).canvas;
        }
        this.context = this.canvas.getContext("2d");
        //make layer
        this.layer = [];
        if (element.nodeType === 1 && element.constructor === global.HTMLCanvasElement) {
            this.renderer = element;
            this.imageData = this.context.getImageData(0, 0, width, height);
            rescale(this.context, width, height, DEVICE_PIXEL_RATIO);
        }

        if (defined(chartOptions.backgroundImage)) {
            parseImageURI(this.background = { completed: false, repeat: "no-repeat", position: [0, 0], size: [0, 0]}, chartOptions.backgroundImage);
        }

        this.layer.push(this.canvas);

        this.type = this.options.type || "line";

        this.charts = [];
        this.series = [];
        this.panel = [];
        this.axis = [];
        this.xAxis = [];
        this.yAxis = [];
        this.colorAxis = [];
        this.polarAxis = [];
        this.radiusAxis = [];

        this.legend = null;
        this.title = [];
        this.tooltip = null;
        this.rangeSlider = [];
        this.rangeSelector = [];

        this.isAxis2D = false;
        this.srcOptions = options;
        this.eventAction = "update";

        var animationOptions = chartOptions.animation;
        if(!isObject(animationOptions)){
            animationOptions = {enabled: !!animationOptions};
        }

        this.globalAnimation = extend({
            isReady: false,
            enabled: animationOptions.enabled !== false//default true
        }, animationOptions);
        this.globalAnimation.initialize = true;//initial once

        this.globalEvent = {
            click: noop,
            isDragging: false
        };
    }, chartProto;

    chartProto = {
        setTitle: function() {
            var options = this.options;
            var context = this.context,
                chart = this;
            var subtitle = pack("array", options.subtitle, [options.subtitle]);
            var getTitle = function(titleOptions) {
                var style = titleOptions.style || {},
                    margin = TRouBLe(titleOptions.margin);

                return {
                    margin: margin,
                    text: titleOptions.text,
                    dx: pack("number", titleOptions.x, 0),
                    dy: pack("number", titleOptions.y, 0),
                    style: {
                        fontFamily: style.fontFamily,
                        fontSize: style.fontSize,
                        fontStyle: style.fontStyle,
                        fontWeight: style.fontWeight,
                        color: style.color
                    }
                };
            };
            var render = function(title) {
                pack("array", title, [title]).forEach(function(titleOptions, i) {
                    var subtitleOptions = subtitle[i] || {};
                    var panelIndex = titleOptions.panelIndex | 0;
                    var p1 = getTitle(titleOptions),
                        p2 = getTitle(subtitleOptions);
                    var titleText = titleOptions.enabled !== false && defined(p1.text) ? String(p1.text) : "",
                        subtitleText = subtitleOptions.enabled !== false && defined(p2.text) ? String(p2.text) : "";
                    var viewport = {
                        width: 0,
                        height: 0,
                        top: 0,
                        bottom: 0
                    };
                    var titleBBox = {}, titleTag,
                        subtitleTag, subtitleBBox = {};
                    if(titleOptions.enabled !== false && titleText.length){
                        titleBBox = (titleTag = Text.HTML(Text.parseHTML(p1.text), context, p1.style)).getBBox();
                        viewport.top = p1.margin[0];
                        viewport.bottom = p1.margin[2];
                    }
                    if(subtitleText.length){
                        subtitleBBox = (subtitleTag = Text.HTML(Text.parseHTML(p2.text), context, p2.style)).getBBox();
                        viewport.height += p2.margin[0];
                        viewport.bottom = p2.margin[2];
                    }
                    
                    viewport.width += pack("number", Math.max(titleBBox && titleBBox.width, subtitleBBox && subtitleBBox.width), 0);
                    viewport.height += pack("number", titleBBox && titleBBox.height, 0) + pack("number", subtitleBBox && subtitleBBox.height, 0);// + p2.dy;//line height
                    chart.title.push({
                        render: function(){
                            var pane = chart.panel[Math.min(panelIndex, ~-chart.panel.length)] || {
                                x: 0, y: 0, width: chart.width, height: chart.height
                            };
                            var x = 0, y = 0;
                            if(titleOptions.enabled !== false && titleText.length){
                                x = pane.x + p1.dx + (pane.width - titleBBox.width) / 2;
                                y = pane.y + p1.dy + titleBBox.height;
                                y += p1.margin[0];
                                context.save();
                                context.textAlign = "start";
                                context.textBaseline = "alphabetic";
                                context.fillStyle = p1.style.color || "#666";
                                context.font = [
                                    p1.style.fontStyle,
                                    p1.style.fontWeight,
                                    p1.style.fontSize,
                                    p1.style.fontFamily
                                ].join(" ");
                                context.translate(x, y);
                                titleTag.toCanvas(context);
                                context.restore();
                            }
                            if(subtitleOptions.enabled !== false && subtitleText.length){
                                x = pane.x + (pane.width - subtitleBBox.width) / 2 + p2.dx;
                                y = pane.y + subtitleBBox.height + pack("number", titleBBox.height, 0) + p2.dy;
                                y += p2.margin[0];
                                titleOptions.enabled !== false && titleText.length && (y += p1.margin[0]);
                                context.save();
                                context.translate(x, y);
                                subtitleTag.toCanvas(context);
                                context.restore();
                            }
                        },
                        viewport: viewport,
                        panelIndex: panelIndex
                    });
                });
            };
            render(options.title);
            return this;
        },
        setCredits: function() {
            var options = this.options,
                credits = options.credits || {},
                position = credits.position,
                style = credits.style || {},
                bbox,
                factor = 0.6;
            var chart = this;
            var context = chart.context;

            chart.credits = {
                render: function(){
                    if(credits.enabled === true && defined(credits.text)){
                        bbox = Text.measureText(credits.text, style);
                        context.save();
                        context.scale(factor, factor);
                        context.translate(position.x + chart.width / factor - bbox.width, position.y + chart.height / factor);
                        context.fillStyle = style.color;
                        context.textAlign = "start";
                        context.textBaseline = "alphabetic";
                        context.font = style.fontSize + " " + style.fontFamily;
                        context.fillText(credits.text, 0, 0);
                        context.restore();
                    }
                }
            };
        },
        setSeries: function(newData, index) {
            var options = this.options,
                chartAnimation = (options.chart || {}).animation || {},
                seriesAnimation = newData.animation || {},
                plotOptions = options.plotOptions || {},
                mergeOptions,
                rangeSelectorOptions = options.rangeSelector,
                start,
                end,
                series = this.series,
                seriesColors = options.colors;

            var newSeries;

            var type = newData.type || this.type,
                name = newData.name || "Series " + series.length;
            var animation = {
                duration: pack("number", seriesAnimation.duration, chartAnimation.duration, 500),
                easing: seriesAnimation.easing || chartAnimation.easing || "linear",
                delay: seriesAnimation.delay,// chartAnimation.delay, 0),
                enabled: chartAnimation.enabled !== false && seriesAnimation.enabled !== false
            };
            if(!isNumber(animation.delay) && !isFunction(animation.delay)){
                animation.delay = pack("number", chartAnimation.delay, 0);
            }

            newSeries = new Series(newData);
            newSeries.type = type;
            newSeries.name = name;
            newSeries.data = newData.data;
            newSeries.index = index;
            /*if(
                hasAxis(type) &&
                isArray(data = newSeries.data) &&
                !(newSeries.xAxis === null || newSeries.yAxis === null)
            ){*/
            if(defined(rangeSelectorOptions)){
                start = rangeSelectorOptions.start || "0%";
                end = rangeSelectorOptions.end || "100%";
                start = Math.min(100, Math.max(0, pack("number", parseFloat(start, 10), 0)));
                end = Math.min(100, Math.max(0, pack("number", parseFloat(end, 10), 100)));
                newSeries.start = start + "%";
                newSeries.end = end + "%";//xAxis=0
            }
            
            if(defined(newData.layer)){
                newSeries.canvas = this.addLayer(newData.layer);
                newSeries.context = newSeries.canvas.getContext("2d");
            }
            mergeOptions = extend({}, {
                    color: newSeries.color || seriesColors[index % seriesColors.length],
                    duration: animation.duration,
                    delay: animation.delay,
                    easing: animation.easing,
                    animationEnabled: animation.enabled,
                    states: {
                        hover: {}
                    }
                },
                plotOptions.series || {},
                plotOptions[newSeries.type] || {},
                newSeries
            );
            newSeries = new Series(mergeOptions);
            newSeries.shapes = newSeries.addShape();

            return newSeries;
        },
        addSeries: function(newData) {
            var newSeries = this.setSeries(newData, this.series.length);
            
            this.series.push(newSeries);
            return this;
        },
        removeSeries: function(removedSeries) {
            var series = this.series,
                i = 0;
            if(isObject(removedSeries)){
                for(; i < series.length; i++){
                    if(series[i] === removedSeries){
                        series[i].destroy();
                        this.removeSeriesAt(i);
                        break;
                    }
                }
            }
            return this;
        },
        removeSeriesAt: function(index) {
            var series = this.series;
            series.splice(Math.max(0, Math.min(index, series.length - 1)), 1);
        },
        reset: function(){
            this.xAxis.forEach(function(item){
                delete item.options.stack;
                delete item.options.series;
            });
            this.yAxis.forEach(function(item){
                delete item.options.stack;
                delete item.options.series;
            });
            this.colorAxis.forEach(function(item){
                delete item.options.stack;
                delete item.options.series;
            });
        },
        linkSeries: function() {
            var chart = this;
            var plotOptions = this.options.plotOptions || {};
            var isAxis2D;

            var axisSeries = {
                yAxis: {},
                xAxis: {},
                polarAxis: {},
                radiusAxis: {},
                colorAxis: {}
            };
            var paneltree = {
                name: "chart",
                node: this,
                parent: null,
                children: []
            };
            this.mapAxis = axisSeries;

            var clamp = function(v){
                return Math.max(0, pack("number", v, 0));
            };

            var add = function(axisSeries, key, value){
                if(!axisSeries.hasOwnProperty(key)){
                    axisSeries[key] = [value];
                }
                else{
                    axisSeries[key].push(value);
                }
            };

            partition(this.series, function(a, b){
                return a.panelIndex === b.panelIndex;
            }).forEach(function(groups){
                var maxLength = 0,
                    sumLength = 0;
                
                groups.forEach(function(series) {
                    var type = series.type;
                    series.chart = chart;
                    isAxis2D = isAxis2D || hasAxis(type);
                    series.minAxisZero = series.minAxisZero || !!~arrayIndexOf(["column", "bar"], type);
                    
                    if (series.selected !== false) {
                        series.sumLength = Math.max(sumLength, (series.data || []).length | 0);
                        series.maxLength = Math.max(maxLength, series.shapes.length);
                    }
                    //2d axis
                    if (isAxis2D) {
                        add(axisSeries.yAxis, clamp(series.yAxis), series);
                        add(axisSeries.xAxis, clamp(series.xAxis), series);
                    }
                    if (!!~(arrayIndexOf(["map", "heatmap"], type))) {
                        add(axisSeries.colorAxis, clamp(series.colorAxis), series);
                    }
                    if (!!~(arrayIndexOf(["radar"], type))) {
                        add(axisSeries.polarAxis, clamp(series.polarAxis), series);
                        add(axisSeries.radiusAxis, clamp(series.polarAxis), series);
                    }

                    if (defined(plotOptions[type])) {
                        var mergeOptions = extend({}, plotOptions[type]);
                        for(var p in mergeOptions){
                            if(!series.hasOwnProperty(p)){
                                series[p] = mergeOptions[p];
                            }
                        }
                    }
                });
            });
            
            this.panel.forEach(function(pane){
                paneltree.children.push({
                    name: "panel",
                    node: pane,
                    parent: chart,
                    children: []
                });
            });
            function enabledAxis(axis) {
                var enabled = axis._options.enabled;
                axis.options.enabled = enabled === true;
            }
            function addChild(axis) {
                partition(axis, function(a, b) {
                    return a.options.panelIndex === b.options.panelIndex;
                }).forEach(function(groups, i) {
                    var panelIndex = clamp(groups[0].options.panelIndex);
                    var series = axisSeries[groups[0].name][i] || [],
                        isEmpty = !series.length;

                    var pane = paneltree.children[panelIndex],
                        childs = pane.children,
                        child;

                    groups.forEach(function(axis) {
                        series = axisSeries[groups[0].name][clamp(axis.index)] || [];
                        child = series.map(function(s){
                            s["_" + axis.name] = axis.options;
                            return s;
                        });
                        isEmpty = !series.length;
                        isEmpty && (enabledAxis(axis));
                        if(!isEmpty){
                            childs.push({
                                name: axis.name,
                                node: axis,
                                parent: pane,
                                length: groups.length,
                                children: child
                            });
                        }
                    });
                });
            }
            addChild(this.yAxis), addChild(this.xAxis);
            addChild(this.polarAxis), addChild(this.radiusAxis);
            addChild(this.colorAxis);

            this.chartTree = paneltree;
            this.isAxis2D = isAxis2D;
        },
        linkAxis: function() {
            var options = this.options,
                rangeSelectorOptions = options.rangeSelector;
            var xAxis = function(name) {
                return name === "xAxis";
            };

            var yAxis = function(name) {
                return name === "yAxis";
            };

            var linear = function(type) {
                return type === "linear";
            };

            var categor = function(type) {
                return type === "categories";
            };

            var x = function(s) {
                return s.isX === true;
            };

            var y = function(s) {
                return s.isY === true;
            };

            var setAxis = function(node) {
                var axis = node.node,
                    series = node.children,
                    count = node.length;

                var name = axis.name,
                    seriesOptions,
                    mergeOptions,
                    seriesFirst = series[0] || {},
                    start,
                    end;
                var axisOptions = axis._options || {},
                    enabled = axisOptions.enabled,
                    categories = axisOptions.categories,
                    tickAmount = axisOptions.tickAmount,
                    type = axisOptions.type,
                    logBase = pack("number", (axisOptions.logarithmic || {}).base, 10);
                var softMax = axisOptions.softMax,
                    softMin = axisOptions.softMin;
                var max = axisOptions.max,
                    min = axisOptions.min;
                var j = -2, n;
                var isTrued;

                var minValue, maxValue, minDomain, maxDomain;

                var opera = [
                    function(name, type) {
                        return type === "logarithmic";
                    }, function() {
                        minDomain = minValue = mathLog(Math.max(minValue, 1), logBase);
                        maxDomain = maxValue = mathLog(maxValue, logBase);
                    },
                    function(name, type) {
                        return xAxis(name) && !linear(type);
                    }, function() {
                        minDomain = 0, maxDomain = seriesOptions.length;
                    },
                    function(name, type) {
                        return xAxis(name) && !categor(type) && x(seriesOptions);
                    }, function() {
                        minDomain = minValue = seriesOptions.minX;
                        maxDomain = maxValue = seriesOptions.maxX;
                    },
                    function(name, type) {
                        return yAxis(name) && !categor(type) && y(seriesOptions);
                    }, function() {
                        minDomain = minValue = seriesOptions.minY;
                        maxDomain = maxValue = seriesOptions.maxY;
                    },
                    function(name, type) {
                        return seriesFirst.minAxisZero && linear(type);
                    }, function() {
                        minDomain = minValue = Math.min(0, seriesOptions.min);//bar & column base value 0
                    },
                    function() {
                        return isNumber(softMin, true) && softMin < minValue;
                    }, function() {
                        minDomain = minValue = softMin;
                    },
                    function() {
                        return isNumber(softMax, true) && softMax < maxValue;
                    }, function() {
                        maxDomain = maxValue = softMax;
                    },
                    function() {
                        return defined(min) && isNumber(min, true);
                    }, function() {
                        minDomain = minValue = min;
                    },
                    function() {
                        return defined(max) && isNumber(max, true);
                    }, function() {
                        maxDomain = maxValue = max;
                    },
                    function() {
                        return isNumber(axisOptions.tickAmount, true);
                    }, function() {
                        tickAmount = axisOptions.tickAmount;
                    },
                    function(name, type) {
                        return categor(type) || isArray(categories);
                    }, function() {
                        var categoriesLength = pack("number", tickAmount, seriesOptions.length, categories && categories.length, 0);
                        minDomain = Math.max(0, Math.min(~~(categoriesLength * start / 100), categoriesLength - 1));
                        maxDomain = Math.max(Math.ceil(categoriesLength * end / 100), minDomain + 1);
                        if (isNumber(tickAmount, true)) {
                            tickAmount = maxDomain - minDomain;//defined axis tickAmount
                        }
                    },
                    function() {
                        return seriesOptions.length === 0;
                    }, function() {
                        minDomain = maxDomain = 0;
                    }
                ];

                if (count > 1) {
                    tickAmount = 5;
                }

                seriesOptions = extend({series: series}, Series.normalize(series));
                seriesOptions.length = seriesFirst.sumLength;
                start = pack("number", parseFloat(seriesFirst.start, 10), 0);
                end = pack("number", parseFloat(seriesFirst.end, 10), 100);
                minValue = seriesOptions.min, maxValue = seriesOptions.max;
                minDomain = minValue, maxDomain = maxValue;
                
                n = opera.length;
                while ((j += 2) < n) if (isTrued = opera[j].apply(null, [name, type])) {
                    opera[-~j](isTrued);
                }

                mergeOptions = {
                    length: seriesOptions.length,
                    domain: [minDomain, maxDomain],
                    minValue: minValue,
                    maxValue: maxValue,
                    tickAmount: tickAmount
                };
                if (defined(rangeSelectorOptions) && (
                    isNumber(rangeSelectorOptions.yAxis, true) & yAxis(name) ||
                    isNumber(rangeSelectorOptions.xAxis, true) & xAxis(name) ||
                    isNumber(rangeSelectorOptions.polarAxis, true)
                )) {
                    mergeOptions.startValue = minDomain;
                    mergeOptions.endValue = isNumber(rangeSelectorOptions.endValue, true) ? rangeSelectorOptions.endValue : null;
                }
                axis.setOptions && axis.setOptions(mergeOptions);

                isNumber(axis.minValue, true) && (minValue = axis.minValue);
                isNumber(axis.maxValue, true) && (maxValue = axis.maxValue);
                axis.options.maxValue = maxValue;
                axis.options.minValue = minValue;
                axis.options.plot = {
                    x: [seriesOptions.minX, seriesOptions.maxX],
                    y: [seriesOptions.minY, seriesOptions.maxY],
                    value: [seriesOptions.min, seriesOptions.max]
                };
                axis.options.labelWidth = axis.labelWidth;
                axis.options.labelHeight = axis.labelHeight;

                var item;
                isTrued = false;
                for (j = 0, n = series.length; /*!flag && */j < n; j++) {
                    item = series[j];
                    isTrued = isTrued || item.selected !== false;
                }
                axis.options.enabled = enabled === true || ((enabled !== false) && isTrued);
            };

            (function dfs(root) {
                var children = root.children,
                    i = -1,
                    n;
                var next = !0;

                if ((root.name.indexOf("Axis") !== -1) || !root.children) {
                    setAxis(root);
                    next = !1;
                }

                if (next && children && (n = children.length)) while(++i < n) {
                    dfs(children[i]);
                }
            })(this.chartTree);
            //resize axis
            this.translateAxis();
        },
        linkRangeSelector: function(){
            var chartOptions = this.options.chart || {},
                spacing = TRouBLe(chartOptions.spacing || []);
            var legendHeight = this.legend ? this.legend.viewport.height : 0;
            var chart = this;
            var getAxis = function(rangeSelectorOptions){
                var mapAxis = chart.mapAxis;
                var rsp = rangeSelectorOptions,
                    axisIndex, axis;
                var minValue = Number.MAX_VALUE, maxValue = -minValue;
                var startValue, endValue;
                var data = [];
                var p;

                if(!rangeSelectorOptions.hasOwnProperty("xAxis")){
                    rsp = extend({xAxis: 0}, rangeSelectorOptions);//default axis
                }
                //console.log(rsp)
                for(p in rsp) if(mapAxis.hasOwnProperty(p) && isNumber(axisIndex = rsp[p])){
                    data = [];
                    (mapAxis[p][axisIndex] || []).forEach(function(series){
                        series.selected !== false && (
                            data = series.data,
                            series.type === "candlestick" && (data = data.map(function(d){ return d.close; }))
                        );
                    });
                    if(defined(axis = chart[p][axisIndex])){
                        minValue = Math.min(minValue, axis.minValue);
                        maxValue = Math.max(maxValue, axis.maxValue);
                        startValue = "" + axis.startValue;
                        endValue = "" + axis.endValue;
                    }
                }
                return {
                    data: data,
                    minValue: minValue,
                    maxValue: maxValue,
                    startValue: startValue,
                    endValue: endValue
                };
            };
            this.rangeSlider.forEach(function(slider){
                if(slider !== null){
                    var rangeSelectorOptions = slider.options,
                        axisOptions = getAxis(slider.options);
                    slider.setOptions({
                        data: axisOptions.data,
                        y: pack("number",
                            rangeSelectorOptions.y,
                            Numeric.percentage(slider.height, rangeSelectorOptions.y),
                            chart.height - slider.height - legendHeight - spacing[2]
                        )
                    });
                }
            });
        },
        linkLegend: function() {
            var options = this.options;
            if(this.legend !== null/* && this.globalAnimation.initialize*/){
                var legendHeight = 0,
                    legendX = 0,
                    legendY = 0;
                var seriesData = [],
                    seriesColors = options.colors || [];
                if(options.legend.enabled !== false){
                    this.series.forEach(function(series, i){
                        var data = series.data;
                        if((series.type === "pie" || series.type === "funnel") && series.showInLegend === true){
                            data.forEach(function(item, j){
                                if(item !== null && (isObject(item) && item.value !== null)){
                                    var value = extend({type: series.type, seriesIndex: i, dataIndex: j}, item);//new Data
                                    !defined(value.color) && (value.color = seriesColors[j % seriesColors.length]);
                                    !defined(value.name) && (value.name = value.value);
                                    !defined(value.showInLegend) && (value.showInLegend = series.showInLegend);
                                    seriesData.push(value);
                                }
                            });
                        }
                        else{
                            series.showInLegend !== false && seriesData.push(series);
                        }
                    });

                    if(seriesData.length){
                        this.legend.setData(seriesData);
                        legendHeight = this.legend.maxHeight;
                    }
                }

                this.legend.viewport = {
                    width: this.legend.width,
                    height: Math.min(legendHeight + pack("number", this.legend.options.margin, 0), this.height / 2),
                    left: legendX,
                    top: legendY
                };
            }
        },
        setLayout: function() {
            var options = this.options,
                layout = options.layout,
                grid = layout.grid || {},
                margin = TRouBLe(grid.margin);
            var viewport = this.getViewport().getView(),
                width = viewport.width,
                height = viewport.height;

            var dx = viewport.left,
                dy = viewport.top;
            var row = pack("number", grid.row, 1),
                col = pack("number", grid.col, 1),
                n = row * col;
            var ml, mt;
            var panel = [];

            if (defined(layout.panel) && isArray(layout.panel)) {
                n = layout.panel.length;
                layout.panel.forEach(function(pane){
                    var px = pack("number", Numeric.percentage(width, pane.x), pane.x) + dx,
                        py = pack("number", Numeric.percentage(height, pane.y), pane.y) + dy,
                        pw = pack("number", Numeric.percentage(width, pane.width), pane.width, width - dx),
                        ph = pack("number", Numeric.percentage(height, pane.height), pane.height, height - dy);
                    panel.push({
                        x: px, y: py,
                        width: pw, height: ph,
                        borderWidth: pane.borderWidth,
                        borderColor: pane.borderColor,
                        backgroundColor: pane.backgroundColor,
                        plotX: px,
                        plotY: py,
                        plotWidth: pw,
                        plotHeight: ph,
                        viewport: { left: 0, right: 0, top: 0, bottom: 0},
                        yAxis: [],
                        xAxis: [],
                        polarAxis: [],
                        radiusAxis: [],
                        colorAxis: [],
                        series: [],
                    });
                });
            }
            else {
                ml = margin[3];
                mt = margin[0];

                for (var i = 0; i < n; i++) {
                    var ri = i % col,
                        ci = ~~(i / col);
                    var w = width,
                        h = height;
                    var px = ri * (w / col) + dx + ml,
                        py = ci * (h / row) + dy + mt,
                        pw = w / col - margin[1] - ml,
                        ph = h / row - margin[2] - mt;
                    panel.push({
                        x: px,
                        y: py,
                        width: pw,
                        height: ph,
                        yAxis: [],
                        xAxis: [],
                        polarAxis: [],
                        radiusAxis: [],
                        colorAxis: [],
                        series: [],
                        plotX: px,
                        plotY: py,
                        plotWidth: pw,
                        plotHeight: ph,
                        viewport: { left: 0, right: 0, top: 0, bottom: 0}
                    });
                }
            }
            var index = function(i, n) {
                return isNumber(i) && (Math.min(i, n));
            };
            var clamp = function(i, n) {
                return Math.min(Math.max(0, pack("number", i, 0) | 0), n);
            };
            partition(this.series, function(a, b) {
                return index(a.panelIndex, ~-n) === index(b.panelIndex, ~-n);
            }).forEach(function(groups){
                panel[clamp(groups[0].panelIndex, ~-n)].series = groups;
            });
            partition(this.title, function(a, b){
                return index(a.panelIndex, ~-n) === index(b.panelIndex, ~-n);
            }).forEach(function(groups){
                var pane = panel[clamp(groups[0].panelIndex, ~-n)],
                    titleBBox;
                if(groups[0]){
                    titleBBox = groups[0].viewport;// + groups[0].viewport.top + groups[0].viewport.bottom;
                    pane.viewport.top += titleBBox.height + titleBBox.bottom + titleBBox.top;
                    pane.plotY += pane.viewport.top;
                    pane.plotHeight -= pane.viewport.top;
                }
            });
            var split = function (axis) {
                partition(axis, function (a, b) {
                    return index(a.options.panelIndex, ~-n) === index(b.options.panelIndex, ~-n);
                }).forEach(function (groups) {
                    var i = clamp(groups[0].options.panelIndex, ~-n);
                    groups.forEach(function (axis) {
                        panel[i][axis.name].push(axis);
                    });
                });
            };
            split(this.yAxis);
            split(this.xAxis);
            split(this.polarAxis);
            split(this.radiusAxis);
            split(this.colorAxis);
            return this.panel = panel;
        },
        renderAll: function () {
            var options = this.options;
            var context = this.context,
                chart = this;

            function addBackgroundImage(background) {
                var position = background.position,
                    size = background.size;

                var drawImage = function(image, size) {
                    var imgWidth = pack("number", size[0], image.width),
                        imgHeight = pack("number", size[1], image.height),
                        x = pack("number", position[0]),
                        y = pack("number", position[1]);
                    var chartWidth = chart.width,
                        chartHeight = chart.height;
                    var n = imgWidth ? Math.ceil(chartWidth / imgWidth) : 0,
                        m = imgHeight ? Math.ceil(chartHeight / imgHeight) : 0,
                        i, j;

                    if (n * m > 0) {
                        background.repeat !== "repeat" && (n = m = 1);
                        context.save();
                        for (i = 0; i < n; i++) for (j = 0; j < m; j++) {
                            context.drawImage(image, x + i * imgWidth, y + j * imgHeight, imgWidth, imgHeight);
                        }
                        context.restore();
                    }
                };

                if (background.completed) {
                    drawImage(background.image, size);
                }
            }

            var Renderer = {
                image: function() {
                    defined(chart.background) && addBackgroundImage(chart.background);
                },
                background: function(){
                    var backgroundColor = (options.chart || {}).backgroundColor,
                        gradient;
                    var width = chart.canvas.width,
                        height = chart.canvas.height,
                        size = Math.min(width, height);
                    size = Math.sqrt(width * width + height * height) / 2;
                    if (defined(backgroundColor)) {
                        if(backgroundColor.linearGradient || backgroundColor.radialGradient){
                            gradient = Color.parse(backgroundColor);
                            backgroundColor = backgroundColor.radialGradient
                                ? gradient.radial((width - size) / 2, (height - size) / 2, size)
                                : gradient.linear(0, 0, width, height);
                        }
                        context.save();
                        context.fillStyle = backgroundColor;
                        context.fillRect(0, 0, width, height);
                        context.restore();
                    }
                },
                title: function(){
                    chart.title.forEach(function(title){
                        title.render();
                    });
                },
                credits: function(){
                    chart.credits && chart.credits.render();
                },
                toolbar: function() {
                    chart.toolbar && chart.toolbar.render();
                },
                legend: function() {
                    if(chart.legend !== null && chart.legend.data.length){
                        chart.legend.draw();
                    }
                },
                rangeSlider: function() {
                    chart.rangeSlider.forEach(function(slider){
                        slider && slider.draw();
                    });
                },
                tooltip: function() {
                    chart.tooltip && chart.tooltip.draw();
                },
                axis: function() {
                    chart.colorAxis.forEach(function(axis) {
                        if(axis.options.enabled !== false)
                            axis.draw();
                    });
                    chart.radiusAxis.forEach(function(axis) {
                        if(axis.options.enabled !== false)
                            axis.draw();
                    });
                    chart.polarAxis.forEach(function(axis) {
                        if(axis.options.enabled !== false)
                            axis.draw();
                    });
                }
            };

            var onRenderer = function() {
                [
                    {z: 1, render: Renderer.background},
                    {z: 2, render: Renderer.image},
                    {z: 3, render: function(){
                        var grid = options.layout.grid || {};
                        chart.panel.forEach(function(pane){
                            var x, y, width, height;
                            var linePixel;

                            var borderWidth = pack("number", pane.borderWidth, grid.borderWidth, 0),
                                borderColor = pane.borderColor || grid.borderColor,
                                backgroundColor = pane.backgroundColor || grid.backgroundColor;
                            var shadowColor = pane.shadowColor || grid.shadowColor,
                                shadowBlur = pane.shadowBlur || grid.shadowBlur,
                                shadowOffsetX = pane.shadowOffsetX || grid.shadowOffsetX,
                                shadowOffsetY = pane.shadowOffsetY || grid.shadowOffsetY;

                            linePixel = fixPixelHalf(pane.x, pane.y, pane.width, pane.height, borderWidth);

                            x = linePixel[0], y = linePixel[1];
                            width = Math.round(linePixel[2]), height = Math.round(linePixel[3]);
                            context.save();
                            context.shadowColor = shadowColor;
                            isNumber(shadowBlur) && (context.shadowBlur = shadowBlur);
                            isNumber(shadowOffsetX) && (context.shadowOffsetX = shadowOffsetX);
                            isNumber(shadowOffsetY) && (context.shadowOffsetY = shadowOffsetY);
                            if(defined(backgroundColor)){
                                context.fillStyle = backgroundColor;
                                context.fillRect(x, y, width, height);
                            }
                            if(borderWidth > 0){
                                context.beginPath();
                                context.moveTo(x, y);
                                context.lineTo(x + width, y);
                                context.lineTo(x + width, y + height);
                                context.lineTo(x, y + height);
                                context.lineTo(x, y);
                                context.strokeStyle = borderColor;
                                context.stroke();
                            }
                            context.restore();
                            //context.strokeRect(x, y, width, height);
                        });
                    }},
                    {z: 9, render: Renderer.credits},
                    {z: 8, render: Renderer.toolbar},
                    {z: 4, render: Renderer.axis},
                    {z: 5, render: Renderer.title},
                    {z: 6, render: Renderer.rangeSlider},
                    {z: 0, render: function(){
                        if(chart.container.nodeType === 1 && chart.container.constructor === global.HTMLCanvasElement){
                            context.putImageData(chart.imageData, 0, 0);
                        }
                    }}
                ].sort(function(a, b){
                    return a.z - b.z;
                }).forEach(function(item){
                    item.render();
                });
            };
            onRenderer();
        },
        renderChart: function(charts, redraw){
            var panel = this.panel;
            var chart = this;
            charts.forEach(function(item){
                if(redraw === "resize"){
                    chart.series.forEach(function(series){
                        var pane = panel[Math.min(series.panelIndex | 0, ~-panel.length)];
                        series.plotX = pack("number", pane.plotX, pane.x);
                        series.plotY = pack("number", pane.plotY, pane.y);
                        series.plotWidth = pack("number", pane.plotWidth, pane.width);
                        series.plotHeight = pack("number", pane.plotHeight, pane.height);
                        series.plotCenterX = pack("number", pane.plotCenterX, pane.width / 2, 0);
                        series.plotCenterY = pack("number", pane.plotCenterY, pane.height / 2, 0);
                        series.plotRadius = pack("number", pane.plotRadius, Math.min(pane.width, pane.height), 0);
                        series.plotRadius = pane.plotRadius;
                    });
                    item.redraw();
                }
                else{
                    item.draw();
                }
            });
        },
        clear: function() {
            var width = this.width,
                height = this.height;
            this.series.concat([{context: this.context}]).forEach(function(series) {
                var context = series.context;
                if (defined(context)) {
                    context.clearRect(0, 0, width, height);
                }
            });
        },
        draw: function() {
            var options = this.options,
                newOptions = extend({}, options);
            var Graphers = Dalaba.Chart.graphers;

            var addPlotSeries = function(chart) {
                var series = chart.series,
                    panel = chart.panel;
                var width = chart.width,
                    height = chart.height;
                var types = {};

                series.forEach(function(series) {
                    var type = series.type || chart.type;
                    var pane = panel[Math.min(series.panelIndex | 0, ~-panel.length)];
                    series.plotX = pack("number", pane.plotX, pane.x, 0);
                    series.plotY = pack("number", pane.plotY, pane.y, 0);
                    series.plotWidth = pack("number", pane.plotWidth, pane.width, width);
                    series.plotHeight = pack("number", pane.plotHeight, pane.height, height);
                    series.plotCenterX = pack("number", pane.plotCenterX, pane.width / 2, 0);
                    series.plotCenterY = pack("number", pane.plotCenterY, pane.height / 2, 0);
                    series.plotRadius = pack("number", pane.plotRadius, Math.min(pane.width, pane.height), 0);
                    types[type] = type;
                });
                return types;
            };
            var addChartor = function(chart, types, options) {
                var charts = chart.charts;
                var creator = {};
                var isCreated;
                var n, i;

                for (var type in types) {
                    isCreated = false;
                    for (i = 0, n = charts.length; !isCreated && i < n; i++) {
                        isCreated = charts[i].type === type;
                    }
                    //console.log(type, options.panel)
                    if (isCreated) {
                        charts[~-i].init(options);
                    }
                    else if (defined(Graphers[type]) && !(type in creator)) {
                        creator[type] = true;
                        charts.push(new Graphers[type](chart.canvas, options));
                    }
                }
                charts.forEach(function(item, i) {
                    if (!(item.type in types)) {
                        charts.splice(i, 1);
                    }
                });
                types = creator = null;
            };

            if (isEmpty(this.srcOptions) && this.globalAnimation.initialize && !(this.globalAnimation.initialize = false)) {
                this.renderAll();//title & credits
                return this;
            }

            this.reset();

            if (this.tooltip !== null && (this.options.tooltip || {}).show !== true) {
                this.tooltip.hide();//destroy
            }

            if (this.legend !== null && !this.legend.noScroll) {
                this.legend.destroy().scrollTop(0);
            }
            this.linkLegend();
            this.setLayout();
            this.linkSeries();//add to this series
            
            
            this.linkAxis();
            this.linkRangeSelector();
            
            newOptions.series = this.series;
            newOptions.panel = this.panel;


            addChartor(this, addPlotSeries(this), newOptions);
            this.tooltip !== null && this.tooltip.setChart(this.charts);

            
            this.render("update");
        },
        render: function(redraw, moused) {
            var options = this.options,
                events = (options.chart || {}).events || {},
                charts = this.charts,
                chart = this;
            var context = chart.context;
            var globalAnimation = chart.globalAnimation;
            var background = chart.background;
            
            var onLoad = function() {
                defined(events.load) && events.load.call(chart);
            };
            var onReady = function() {
                defined(events.ready) && events.ready.call(chart);
            };
            var onRedraw = function() {
                defined(events.redraw) && events.redraw.call(chart, redraw, moused);
            };
            
            var filterAnimation = function(chart, type) {
                var globalAnimation = chart.globalAnimation;
                return !defined(Dalaba.Animation)
                    || globalAnimation.enabled !== true
                    || !!~arrayIndexOf(["map", "heatmap", "venn", "diagram"], type);
            };

            var filterNotAnimation = function(charts, notAnimation) {
                return arrayFilter(charts, function(series) {
                    var f;
                    return (f = filterAnimation(chart, series.type)) && notAnimation.push(series), !f;
                });
            };

            var getAnimationList = function() {
                var list = [].slice.call(arguments, 0, -1),
                    initialize = !!arguments[list.length];
                var shapes = [];
                list.forEach(function(item) {
                    item.forEach(function(item) {
                        item.animateTo(context, initialize, chart.eventAction).forEach(function(shape) {
                            shapes.push(shape);
                        });
                    });
                });
                return shapes;
            };
            var drawAixs = function(){
                chart.yAxis.concat(chart.xAxis).forEach(function(axis){
                    if(axis.options.enabled !== false){
                        axis.draw();
                        axis._ticks = axis.ticks;
                    }
                });
            };

            function paintComponent(arr, ani) {
                chart.clear();
                chart.renderAll();
                drawAixs();
                ani && ani();
                chart.renderChart(arr, redraw);
                chart.legend && chart.legend.draw();
                chart.tooltip && chart.tooltip.draw();
            }

            var isEventing = function(redraw) {
                return redraw === "hover" || redraw === "resize" || redraw === "drag" || redraw === "click";
            };
            var isAnimationReady = function(chart) {
                return chart.globalAnimation.isReady === true;
            };
            var isDragging = function(chart) {
                return !chart.globalEvent.isDragging;
            };

            var Animation;

            var animateTo = function(charts, onStep, onLoad) {
                var noAnimationCharts, animationCharts = filterNotAnimation(charts, noAnimationCharts = []);

                globalAnimation.isReady = false;
                if (noAnimationCharts.length) {
                    defined(background) && defined(background.image) && background.completed !== true ?
                        new function() {
                            background.image.onload = function() {
                                background.loaded();
                                paintComponent(noAnimationCharts);
                            };
                            background.image.onerror = function () {
                                background.loaded();
                                paintComponent(noAnimationCharts);
                                background.fail();
                            };
                        }
                        : paintComponent(noAnimationCharts);
                }
                if(defined(Dalaba.Animation) && animationCharts.length){
                    Animation = new Dalaba.Animation();
                    //Animation.stop();
                    getAnimationList(animationCharts, true).forEach(function(item){
                        var shape = item[0],
                            step = item[1];
                        var animationEnabled = shape.animationEnabled;
                        if(!defined(animationEnabled) && shape.series){
                            animationEnabled = shape.series.animationEnabled;
                        }
                        Animation.addAnimate(shape, {
                            step: function(target, timer){
                                if(!animationEnabled) timer = 1;
                                step(timer);
                            },
                            complete: function(){
                                
                            },
                            duration: pack("number", shape.duration, globalAnimation.duration, 500),
                            easing: pack("string", shape.easing, globalAnimation.easing, "ease-in-out"),
                            delay: pack("number", shape.delay, globalAnimation.delay, 0)
                        });
                    });
                    Animation.fire(function(){
                        globalAnimation.isReady = false;
                        onStep && onStep(noAnimationCharts, animationCharts);
                    }, function(){
                        globalAnimation.isReady = true;
                        paintComponent(charts);
                        onLoad();
                    });
                }
                animationCharts.length | noAnimationCharts.length || (chart.renderAll(), drawAixs(), onLoad(), onReady());
                !animationCharts.length & !!noAnimationCharts.length && (onLoad(), onReady());
                globalAnimation.isReady = true;
            };
            
            if (globalAnimation.initialize === true && !(globalAnimation.initialize = false)) {
                animateTo(charts, function(noAnimationCharts, animationCharts) {
                    paintComponent(noAnimationCharts, function() {
                        animationCharts.forEach(function(item) {
                            item.onFrame && item.onFrame(context, true);
                        });
                    });
                }, function() {
                    onLoad(), onReady();
                });
            }
            else {
                if (redraw === "update") {
                    var noAnimationCharts, animationCharts = filterNotAnimation(charts, noAnimationCharts = []);

                    if (noAnimationCharts.length) {
                        paintComponent(noAnimationCharts);
                    }
                    if (defined(Dalaba.Animation) && animationCharts.length) {
                        Animation = new Dalaba.Animation();
                        Animation.stop();
                        var shapes = getAnimationList(animationCharts, chart.yAxis, chart.xAxis, false);
                        shapes.forEach(function(item){
                            var shape = item[0],
                                step = item[1];
                            Animation.addAnimate(shape, {
                                duration: 
                                    chart.eventAction === "update"
                                    ? pack("number", shape.duration, globalAnimation.duration, 500)
                                    : chart.eventAction === "selected" ? 300 : 300,
                                delay: 0,
                                easing: "linear",
                                step: function(target, timer){
                                    step(timer);
                                },
                                complete: function(){}
                            });
                        });
                        Animation.fire(function(){
                            globalAnimation.isReady = false;
                            chart.clear();
                            chart.renderAll();
                            chart.yAxis.concat(chart.xAxis).forEach(function(axis){
                                if(axis.options.enabled !== false){
                                    axis.onFrame();
                                }
                            });
                            chart.renderChart(noAnimationCharts);
                            animationCharts.forEach(function(item){
                                item.onFrame && item.onFrame(context, false);
                            });
                            chart.legend && chart.legend.draw();
                            chart.tooltip && chart.tooltip.draw();
                            onRedraw();
                        }, function() {
                            globalAnimation.isReady = true;
                            chart.clear();
                            chart.renderAll();
                            chart.yAxis.concat(chart.xAxis).forEach(function(item){
                                if(item.options.enabled !== false){
                                    item.draw();
                                }
                            });
                            chart.renderChart(charts);
                            chart.legend && chart.legend.draw();
                            chart.tooltip && chart.tooltip.draw();
                            onRedraw(), onReady();
                        });
                    }
                }
                if (isAnimationReady(chart) && isDragging(chart) && isEventing(redraw)) {
                    paintComponent(charts);
                    onRedraw();
                }
            }
        },
        getViewport: function() {
            var options = this.options,
                spacing = TRouBLe(options.chart.spacing || []),
                left = spacing[3],
                right = spacing[1],
                top = spacing[0],
                bottom = spacing[2];
            var width = this.width,
                height = this.height;
            var legendOptions,
                legendBox;
            
            var viewport = {
                left: left,
                right: right,
                top: top,
                bottom: bottom,
                width: width,
                height: height
            };
            //spacing, legend, rangeSelector
            var box = {
                left: left,
                right: right,
                top: top,
                bottom: bottom
            };

            var plot = {};//plotX, plotY, plotWidth, plotHeight
            var offsetLeft = 0,
                offsetRight = 0,
                offsetTop = 0,
                offsetBottom = 0;
            var yAxisTitleHeight = 0;

            if(this.title !== null){
                //viewport.top += this.title.viewport.height;
            }
            if(this.legend !== null && defined(this.legend.viewport)){
                legendOptions = this.legend.options;
                legendBox = this.legend.viewport;
                if(legendOptions.floating !== true){
                    if(legendOptions.layout === "vertical"){
                        legendOptions.align === "left" && (box.left += legendBox.width);
                        legendOptions.align === "right" && (box.right += legendBox.width);
                    }
                    else{
                        legendOptions.verticalAlign === "top" && (box.top += legendBox.height);
                        legendOptions.verticalAlign === "bottom" && (box.bottom += legendBox.height);
                    }
                }
            }
            this.rangeSlider.forEach(function(slider){
                if(slider !== null){
                    legendOptions = slider.options;
                    if(legendOptions.floating !== true && legendOptions.layout !== "vertical"){
                        box.bottom += slider.height + pack("number", legendOptions.margin, 0);
                    }
                }
            });

            this.yAxis.forEach(function(axis){
                if(axis.options.enabled !== false){
                    if(axis.options.opposite === true){
                        offsetRight += axis.labelWidth || 0;
                    }
                    else{
                        offsetLeft += axis.labelWidth || 0;
                    }
                    yAxisTitleHeight = Math.max(yAxisTitleHeight, pack("number", axis.titleHeight, 0));
                }
            });
            this.xAxis.forEach(function(axis){
                if(axis.options.enabled !== false){
                    if(axis.options.opposite === true){
                        offsetTop += axis.labelHeight || 0;
                    }
                    else{
                        offsetBottom += axis.labelHeight || 0;
                    }
                }
            });
            //viewport.top += offsetTop;
            viewport.top += yAxisTitleHeight;

            top = viewport.top + offsetTop;
            bottom = viewport.bottom + offsetBottom;
            left = viewport.left + offsetLeft;
            right = viewport.right + offsetRight;
            plot = {
                width: viewport.width - right - left,
                height: viewport.height - top - bottom,
                left: left,
                right: right,
                bottom: bottom,
                top: top
            };
            viewport.plot = plot;
            viewport.getPlot = function(){
                return plot;
            };
            viewport.getView = function(){
                return {
                    left: box.left,
                    right: box.right,
                    top: box.top,
                    bottom: box.bottom,
                    width: width - box.right - box.left,
                    height: height - box.top - box.bottom
                };
            };
            return viewport;
        },
        setOptions: function(options, redraw) {
            var series = [];
            var seriesOptions,
                axisOptions;
            var chart = this;
            extend(this.options, options);
            
            var remove = function(type, axisOptions){
                var oldAxis = chart[type],
                    newAxis = axisOptions;
                chart[type].splice(Math.abs(oldAxis.length - newAxis.length));
            };
            var modify = function(type, axisOptions){
                axisOptions.slice(0, chart[type].length).forEach(function(item, i){
                    var axis = chart[type][i];
                    axis.setOptions(item);
                    axis._options = item;
                });
            };
            var add = function(type, axis){
                axis.forEach(function(item){
                    var axisOptions = extend({}, defaultOptions[type]);
                    extend(axisOptions, item);
                    chart.addAxis(type, axisOptions)._options = item;
                });
            };
            var execute = function(type, axisOptions){
                axisOptions = pack("array", axisOptions, [axisOptions]);
                axisOptions.length ^ chart[type].length
                    ? axisOptions.length < chart[type].length
                        ? (remove(type, axisOptions), modify(type, axisOptions))
                        : (modify(type, axisOptions), add(type, axisOptions.slice(chart[type].length)))
                    : modify(type, axisOptions);
                //reset index
                chart[type].forEach(function(axis, i){
                    axis.index = i;
                });
            };
            defined(axisOptions = options.xAxis) && execute("xAxis", axisOptions);
            defined(axisOptions = options.yAxis) && execute("yAxis", axisOptions);
            defined(axisOptions = options.polarAxis) && execute("polarAxis", axisOptions);
            defined(axisOptions = options.colorAxis) && execute("colorAxis", axisOptions);
            //rebuild tree

            if (defined(seriesOptions = options.series)) {
                seriesOptions = pack("array", seriesOptions, []);
                List.diff(this.series, seriesOptions, function(a, b) {
                    return a.name === b.name && a.type === b.type;
                }).modify(function(newIndex, oldIndex){
                    var newSeries, oldSeries;
                    oldSeries = chart.series[oldIndex];
                    newSeries = seriesOptions[newIndex];
                    newSeries.used = true;
                    oldSeries.update(newSeries, false);
                    series.push(oldSeries);
                }).each();
                seriesOptions.forEach(function(item, i){
                    var newSeries;
                    if(!item.used){
                        newSeries = chart.setSeries(item, i);
                        newSeries._diffValues = [];
                        series.push(newSeries);
                        delete item.used;
                    }
                });
                this._series = this.series;
                this.series = series;//sort index
            }
            if (defined(options.tooltip) && this.tooltip !== null) {
                this.tooltip.setOptions(options.tooltip);
            }

            this.eventAction = "update";
            redraw !== false && this.draw();
            return this;
        },
        setSize: function(width, height) {
            var options = this.options,
                spacing = TRouBLe(options.chart.spacing || []);
            var percentage = Numeric.percentage;
            var chart = this;
            this.width = width;
            this.height = height;
            this.layer.forEach(function(layer) {
                rescale(layer.getContext("2d"), width, height, DEVICE_PIXEL_RATIO);
            });
            this.container.style.width = width + "px";
            this.container.style.height = height + "px";

            if (this.legend !== null && this.legend.data.length) {
                this.legend.destroy();
                this.legend.setOptions({
                    width: pack("number",
                        (options.legend || {}).width,//absolute value
                        percentage(width, (options.legend || {}).width),//percent
                        (width - spacing[1] - spacing[3]) * 0.7//auto
                    )
                });
                this.legend.viewport.height = Math.min(
                    this.legend.maxHeight + (pack("number", this.legend.options.margin, 0)),
                    this.height / 2
                );
            }
            if (this.tooltip !== null) {
                //this.tooltip.move();
            }
            this.rangeSlider.forEach(function(slider) {
                var rangeSelectorOptions;
                if(slider !== null){
                    rangeSelectorOptions = slider._options;
                    slider.setOptions({
                        width: pack("number",
                            rangeSelectorOptions.width,
                            Numeric.percentage(chart.width, rangeSelectorOptions.width),
                            chart.width - spacing[1] - spacing[3]
                        )
                    });
                }
            });
            this.setLayout();
            this.translateAxis();
            this.render("resize");
        },
        getSize: function(container){
            var options = this.options,
                chartOptions = options.chart || {};
            var width = chartOptions.width,
                height = chartOptions.height;

            var bbox = container.getBoundingClientRect(),
                boxWidth = pack("number", bbox.width, container.offsetWidth),
                boxHeight = pack("number", bbox.height, container.offsetHeight);

            width = Math.max(0, pack("number", width, Numeric.percentage(boxWidth, width)));
            height = Math.max(0, pack("number", height, Numeric.percentage(boxHeight, height)));
            
            if(height <= 0){
                height = pack("number", bbox.height, container.offsetHeight);
            }
            if(width <= 0){
                width = pack("number", bbox.width, container.offsetWidth);
            }
            return {
                width: width,
                height: height
            };
        },
        destroy: function(){
            var container = this.container;

            Event.Handler.destroy(this);

            this.layer.forEach(function(layer){
                container.removeChild(layer);
                layer = null;
            });

            if(this.tooltip !== null){
                this.tooltip.useHTML === true && (container.removeChild(this.tooltip.canvas));
            }
            container.parentNode.removeChild(container);

            [container, this.context, this.tooltip, this.legend].concat(
                this.xAxis, this.yAxis, this.colorAxis, this.series
            ).forEach(function(item){
                item = null;
            });
        },
        addLayer: function(isLayer){
            var layer = this.layer;
            return isNumber(isLayer) & isLayer > 0 ?
                (layer[layer.length] = new Layer(this.container, this.width, this.height).canvas)
                : this.canvas;
        },
        addAxis: function(name, axisOptions) {
            var Axis = Dalaba.Chart.Axis,
                axis = null;
            var chart = this;
            var axisMaps = {
                xAxis: 0,
                yAxis: 0,
                polarAxis: 0,
                radiusAxis: 0,
                colorAxis: 0
            };

            if (defined(Axis) && ({}).hasOwnProperty.call(axisMaps, name) && defined(this[name])) {
                if(!defined(axisOptions.range)){
                    axisOptions.range = [0, chart.width];
                }
                axis = new Axis(this.canvas, axisOptions);
                axis.name = name;
                axis.index = this[name].length;
                this[name].push(axis);
            }
            return axis;
        },
        addLegend: function(legendOptions){
            var Legend = Dalaba.Chart.Legend,
                legend = null;

            if(defined(Legend) && legendOptions.enabled !== false){
                legend = new Legend(
                    this.canvas,//this.addLayer(legendOptions.layer),
                    legendOptions.series,
                    legendOptions//selected为false不读取
                );
            }
            return legend;
        },
        addToolbar: function(toolbarOptions) {
            var options = toolbarOptions || {};
            var context = this.context;
            var toolbar;
            var width = 15,
                height = 0;
            var x = this.width - width,
                y = 0;
            var chart = this;
            var doInited = false;
            var bar;
            

            if (options.enabled === true) {
                toolbar = {
                    render: function() {
                        var w = width,
                            h = 0;
                        x = chart.width - width,
                        context.save();
                        context.fillStyle = "rgba(0, 0, 0, 0.25)";
                        context.fillRect(x, y, w, 1);
                        context.fillRect(x, y + (h += 3), w * 0.8, 1);
                        context.fillRect(x, y + (h += 3), w, 1);
                        context.fillRect(x, y + (h += 3), w * 0.8, 1);
                        context.fillRect(x, y + (h += 3), w, 1);
                        context.restore();
                        toolbar.viewport.height = height = h;
                        toolbar.viewport.x = x;
                    },
                    viewport: {
                        x: x,
                        y: y,
                        width: width
                    },
                    onClick: function(e) {
                        var pos = Event.normalize(e, this);
                        var ex = pos.x,
                            ey = pos.y;
                        if (Intersection.rect(
                            {x: ex, y: ey},
                            {x: x, y: y, width: x + width, height: y + height}
                        )) {
                            
                            if (!doInited && (doInited = !doInited)) {
                                
                                var script = document.createElement("script");
                                script.src = "/src/chart/dashboard.js";
                                script.onload = function() {
                                    
                                    new Dalaba.Chart.Dashboard(chart);
                                    
                                };
                                chart.container.appendChild(script);
                                //console.log(e);
                            }
                        }
                    }
                };

                return this.toolbar = toolbar;
            }
            return null;
        },
        translateAxis: function(){
            var panel = this.panel;
            this.yAxis.forEach(function (axis) {
                var pane = panel[Math.min(axis.options.panelIndex | 0, panel.length - 1)];
                
                if (axis.options.enabled === true) {
                    //console.log(pane.height);
                    axis.scale(0, pane.height);//viewport.height - viewport.top - viewport.bottom);
                    if(axis.options.opposite === true){
                        pane.viewport.right += axis.labelWidth;
                    }
                    else{
                        pane.viewport.left += axis.labelWidth;
                    }
                    if(!pane.yAxisTitleFirst){
                        pane.yAxisTitleFirst = true;
                        pane.viewport.top += pack("number", axis.titleHeight, 0);
                    }
                }
            });
            this.xAxis.forEach(function(axis){
                var pane = panel[Math.min(axis.options.panelIndex | 0, panel.length - 1)];
                if(axis.options.enabled === true){
                    axis.scale(0, pane.width);//viewport.width - viewport.left - viewport.right - offsetLeft - offsetRight);
                    if(axis.options.opposite === true){
                        pane.viewport.top += axis.labelHeight;
                    }
                    else{
                        pane.viewport.bottom += axis.labelHeight;
                    }
                }
            });
            //set viewport
            /*this.chartTree.children.forEach(function(pane){
                partition(pane.children, function(a, b){
                    return a.name === b.name;
                }).forEach(function(groups){
                    console.log(groups[0]);
                });
            });*/
            panel.forEach(function(item){
                var xLeftWidth = 0,
                    xRightWidth = 0,
                    yBottomHeight = 0,
                    yTopHeight = 0;

                var startX;
                item.yAxis.forEach(function(axis){
                    var pane = panel[Math.min(axis.options.panelIndex | 0, panel.length - 1)];
                    var plotHeight = pane.height - pane.viewport.top - pane.viewport.bottom,
                        plotWidth = pane.width - pane.viewport.left - pane.viewport.right,
                        plotY = pane.y + pane.viewport.top;
                    var x = pane.x,
                        y = plotY;
                    //startX = x;
                    if(axis.options.enabled !== false){
                        if(axis.options.opposite === true){
                            //startX = pane.x + axis.labelWidth;
                            x += pane.width - axis.labelWidth - xRightWidth; //xRightWidth - axis.labelWidth;
                            xRightWidth += axis.labelWidth;
                        }
                        else{
                            startX = x += axis.labelWidth + xLeftWidth;
                            xLeftWidth += axis.labelWidth;
                        }
                        axis.setOptions({
                            x: x,
                            y: y,
                            width: plotWidth,// viewport.width - viewport.left - viewport.right - offsetLeft - offsetRight,
                            range: [0, plotHeight]// viewport.height - viewport.top - viewport.bottom - offsetTop - offsetBottom]
                        });
                    }
                    pane.plotX = pack("number", startX, pane.x);//enabled is false
                    pane.plotY = y;
                    pane.plotHeight = plotHeight;
                    pane.plotWidth = plotWidth;
                });
                item.xAxis.forEach(function(axis){
                    var pane = panel[Math.min(axis.options.panelIndex | 0, panel.length - 1)];
                    var plotHeight = pane.height - pane.viewport.top - pane.viewport.bottom,
                        plotWidth = pane.width - pane.viewport.left - pane.viewport.right;
                    var y = 0;
                    if(axis.options.enabled !== false){
                        if(axis.options.opposite === true){
                            y = pane.y + pane.viewport.top + yTopHeight;
                            yTopHeight += axis.labelHeight;//titleHeight
                        }
                        else{
                            y = pane.y + pane.height - axis.labelHeight - yBottomHeight;// yBottomHeight - axis.labelHeight;
                            yBottomHeight += axis.labelHeight;
                        }
                        axis.setOptions({
                            x: pane.x + pane.viewport.left,//viewport.left + offsetLeft,
                            y: y,
                            height: plotHeight,// viewport.height - viewport.top - viewport.bottom - offsetTop - offsetBottom,
                            range: [0, plotWidth]//viewport.width - viewport.left - viewport.right - offsetLeft - offsetRight]
                        });
                    }
                    if(!item.yAxis.length){
                        pane.plotHeight = plotHeight;//no yAxis
                    }
                });

                item.polarAxis.concat(item.radiusAxis).forEach(function(axis, i){
                    var pane = panel[Math.min(axis.options.panelIndex | 0, panel.length - 1)];
                    var plotHeight = pane.height - pane.viewport.top - pane.viewport.bottom,
                        plotWidth = pane.width - pane.viewport.left - pane.viewport.right,
                        plotY = pane.y + pane.viewport.top;
                    var axisOptions = axis._options;
                    var size = Math.min(plotHeight, plotWidth) / 2,//default 85%
                        center;
                    
                    size = pack("number", axisOptions.size, Numeric.percentage(size, axisOptions.size), size * 0.85, 0);
                    center = (
                        center = pack("array", axisOptions.center, [pane.x + plotWidth / 2, plotY + plotHeight / 2]),//["50%", "50%"]
                        center.length < 2 && (center[1] = center[0]), center
                    );
                    center = [
                        pack("number", center[0], Numeric.percentage(plotWidth, center[0]), size),
                        pack("number", center[1], Numeric.percentage(plotHeight, center[1]), size)
                    ];
                    if(axis.options.enabled !== false){
                        axis.scale(0, plotWidth);
                        axis.setOptions({
                            center: center,
                            size: size,
                            width: pane.width,
                            height: pane.height,
                            range: [0, size],
                            length: pane.polarAxis[i >> 1] && pane.polarAxis[i >> 1].ticks.length//sync
                        });
                    }
                    pane.plotCenterX = center[0];
                    pane.plotCenterY = center[1];
                    pane.plotRadius = size;
                });
                item.colorAxis.forEach(function(axis){
                    var size = pack("number", axis.options.size, 150);
                    axis.scale(0, size);
                    axis.setOptions({
                        range: [0, size]
                    });
                });
            });
        },
        export: function(image, width, height, type){
            var canvas = document.createElement("canvas"),
                context = canvas.getContext("2d");
            var w = image.width,
                h = image.height;
            var data;

            rescale(context, width, height, DEVICE_PIXEL_RATIO);
            context.drawImage(
                image,
                0, 0, w, h,
                0, 0, width, height
            );
            data = canvas.toDataURL(type);
            document.location.href = data.replace(type, "image/octet-stream");
        }
    };

    Chart.prototype = chartProto;

    Dalaba.Chart.setOptions = function(options){
        defaultOptions = extend(defaultOptions, options);
    };
    Dalaba.Chart.getOptions = function(){
        return defaultOptions;
    };
    
    Dalaba.Chart.fn = Dalaba.Chart.prototype = {
        constructor: Chart,
        init: function(canvas, options) {
            if (Chart.call(this, canvas, options) === null) {
                return this;
            }

            var options = this.options,
                chart = this;
            var width = this.width,
                spacing = TRouBLe(options.chart.spacing);
            var percentage = Numeric.percentage;

            Color.GRADIENT_CONTEXT = this.context;
            Text.context(this.context);
            
            //create title
            this.setTitle();
            //create credits
            this.setCredits();
            
            pack("array", options.series, []).forEach(function(item){
                chart.addSeries(item);
            });

            //create axis
            var add = function(name, axis){
                pack("array", axis, isObject(axis) ? [axis] : [{enabled: false}]).forEach(function(item){
                    var srcOptions = isObject(item) ? item : {};
                    (chart.addAxis(name, 
                        extend({
                            name: name,
                            index: chart[name].length,
                            lang: options.lang
                            }, defaultOptions[name], srcOptions)
                        ) || {}
                    )._options = srcOptions;
                });
            };
            add("yAxis", options.yAxis), add("xAxis", options.xAxis),
            add("radiusAxis", options.radiusAxis), add("polarAxis", options.polarAxis),
            add("colorAxis", options.colorAxis);

            //create legend
            var legendOptions = extend({}, options.legend || {});
            extend(legendOptions, {
                //series: this.series,//showInLegend
                //borderWidth: 1,
                width: pack("number",
                    legendOptions.width,//absolute value
                    percentage(width, legendOptions.width),//percent
                    (width - spacing[1] - spacing[3]) * 0.7//auto
                ),
                x: {
                    left: spacing[3],
                    center: 0,
                    right: spacing[1]
                }[pack("string", legendOptions.align, "center")] + pack("number", legendOptions.x, 0),
                y: {
                    top: spacing[0],// + chart.title.viewport.height,
                    middle: 0,
                    bottom: spacing[2]
                }[pack("string", legendOptions.verticalAlign, "bottom")] + pack("number", legendOptions.y, 0)
            });
            var legend = this.addLegend(legendOptions);
            if(legend !== null){
                legend.onClick(chart.container, function(item, index){
                    var series = chart.series,
                        selected = this.selected,
                        curSeries;
                
                    if(item.type === "pie" || item.type === "funnel"){
                        pack("object", pack("object",
                            series[pack("number", item.seriesIndex, -1)], {}
                        ).data[pack("number", item.dataIndex, -1)], {}).selected = selected;
                        //item.selected = selected;
                    }
                    else{
                        curSeries = series[index];
                        curSeries.selected = selected;//modified series
                        curSeries.action = "click";//hover-on, hover-off, click-on, click-off
                    }
                    series.forEach(function(series){
                        series.shapes = series.addShape();
                    });
                    chart.eventAction = "selected";

                    legend.noScroll = true;
                    chart.draw();
                    curSeries && (curSeries.action = "");
                }).onState(chart.container, function(item){
                    var series = chart.series,
                        shape = item;
                    if(item.type === "pie" || item.type === "funnel"){
                        var shapes = pack("object",
                            series[pack("number", item.seriesIndex, -1)], {}
                        ).shapes || [];
                        shapes.forEach(function(shape){
                            delete shape.state;
                        });
                        (shape = shapes[pack("number", item.dataIndex, -1)] || {}).state = !0;
                    }
                    else{
                        series.forEach(function(series){
                            delete series.state;
                        });
                        shape.state = !0;
                    }
                    chart.render("hover");
                    delete shape.state;
                }).onScroll(chart.container, function(){
                    chart.render("click");
                });
                this.legend = legend;
            }

            var RangeSelector = Dalaba.Chart.RangeSelector;
            if(defined(options.rangeSelector)){
                (isArray(options.rangeSelector) ? options.rangeSelector : [options.rangeSelector]).forEach(function(item){
                    var rangeSelectorOptions = extend({}, item || {}),
                        rangeSlider = null;
                    var xAxisIndex = rangeSelectorOptions.xAxis,
                        yAxisIndex = rangeSelectorOptions.yAxis,
                        polarAxisIndex = rangeSelectorOptions.polarAxis;
                    if(chart.xAxis[xAxisIndex] || chart.yAxis[yAxisIndex] || chart.polarAxis[polarAxisIndex]){
                        var width = pack("number",
                                rangeSelectorOptions.width,
                                Numeric.percentage(chart.width, rangeSelectorOptions.width),
                                chart.width - spacing[1] - spacing[3]
                            ),
                            height = pack("number",
                                rangeSelectorOptions.height,
                                Numeric.percentage(chart.height, rangeSelectorOptions.height),
                                30
                            );
                        extend(rangeSelectorOptions, {
                            width: width,
                            height: height,
                            x: pack("number", rangeSelectorOptions.x, Numeric.percentage(width, rangeSelectorOptions.x), spacing[3])
                        });
                        if(defined(RangeSelector) && rangeSelectorOptions.enabled === true){
                            rangeSlider = new RangeSelector(chart.canvas, rangeSelectorOptions);
                            rangeSlider._options = item || {};
                        }
                        chart.rangeSlider.push(rangeSlider);
                        chart.rangeSelector.push({
                            start: rangeSelectorOptions.start,
                            end: rangeSelectorOptions.end
                        });
                    }
                });
            }
            //tooltip
            var tooltipOptions = this.options.tooltip;
            var Tooltip = Dalaba.Chart.Tooltip,
                tooltip = null;

            if (defined(Tooltip) && tooltipOptions.enabled !== false) {
                tooltip = new Tooltip(this.addLayer(tooltipOptions.layer), tooltipOptions);
            }
            this.tooltip = tooltip;

            this.toolbar = chart.addToolbar(options.toolbar);

            chart.draw();
            chart.container.nodeType === 1 && Event.Handler(this);

            return this;
        }
    };
    extend(Dalaba.Chart.prototype, Chart.prototype);
    Dalaba.Chart.fn.init.prototype = Dalaba.Chart.fn;
})(typeof window !== "undefined" ? window : this, Dalaba);