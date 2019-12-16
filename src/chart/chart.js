/**
 * Chart constructor function
 * Dalaba.Chart, new Dalaba.Chart method
**/
require("./lib");
require("./define");

(function (global, Dalaba) {

    var hasOwnProperty = ({}).hasOwnProperty;

    //default chart options
    var defaultOptions = require("./chart.options");

    var setChartLayout = require("./chart.layout");

    var Comparative = function (newData, oldData) {
        var remove = function (newData, oldData, removed) {
            var data = oldData.splice(Math.abs(oldData.length - newData.length));
            data.forEach(function (pane, i) {
                removed && removed(d, newData[i], i);
            });
        };
        var modify = function (newData, oldData, modified) {
            oldData.forEach(function (d, i) {
                modified && modified(d, newData[i], i);
            });
        };
        var add = function (newData, oldData, added) {
            for (var i = Math.max(0, oldData.length); i < newData.length; i++) {
                added && added(newData[i], oldData[i], i);
            }
        };
        var updated = function (added, removed, modified) {
            newData.length ^ oldData.length
                ? newData.length < oldData.length
                    ? (remove(newData, oldData, removed), modify(oldData, newData, modified))
                    : (modify(newData, oldData, modified), add(newData, oldData, added))
                : modify(newData, oldData, modified);
        };
        return {
            update: function (added, removed, modified) {
                updated(added, removed, modified);
            }
        };
    };

    /*
     * OffScreen Canvas
    */
    function Layer (container, width, height) {
        var canvas = document.createElement("canvas");
        //this.context = canvas.getContext("2d");

        setAttribute(this.canvas = canvas, {
            width: width,
            height: height
        });
        setStyle(canvas, {
            position: "absolute",
            left: "0px",
            top: "0px",
            "-webkit-user-select": "none",
            "user-select": "none",
            cursor: "default"
            //"font-size": "9px"
        });
        //rescale(this.context, width, height, DEVICE_PIXEL_RATIO);

        container.appendChild(this.canvas);
    }

    function globalStyle (options) {
        var chartOptions = options.chart || {},
            plotOptions = options.plotOptions;
        var split = function () {
            var r = [];
            [].forEach.call(arguments, function (item) {
                r = r.concat(isArray(item) ? item : isObject(item) ? [item] : []);
            });
            return r;
        };
        var copy = function (item, attr) {
            for (var p in attr) if (!item.hasOwnProperty(p)) {
                item[p] = attr[p];
            }
            return item;
        };
        split(options.yAxis, options.xAxis, options.colorAxis, options.polarAxis).map(function (item) {
            return item.labels || (item.labels = {});
        }).concat(pack("array", options.title, [options.title]).map(function (item) {
            copy(item, defaultOptions.title);
        }), pack("array", options.subtitle, [options.subtitle]).map(function (item) {
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
        ]).forEach(function (item) {
            if (defined(item)) {
                if (defined(item.style)) {
                    for (var p in chartOptions.style) if (!({}).hasOwnProperty.call(item.style, p)) {
                        (item.style[p] = chartOptions.style[p]);
                    }
                }
                else
                    item.style = chartOptions.style;
            }
        });
    }
   
    var Chart = function (element, options) {
        var width, height;

        var chart = this;

        var chartOptions;

        var globalWebglRenderer;

        var isNumber = function (v) {
            return Dalaba.isNumber(v, true);
        };

        if (!defined(element)) {
            return null;
        }

        if (element && (element.nodeType !== 1 && !isFunction(element.getContext))) {
            options = element;
            element = {};
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
            setAttribute(this.container = document.createElement("div"), {
                "class": chartOptions.className
            });
            setStyle(this.container, {
                width: + chart.width + "px",
                height: + chart.height + "px",
                overflow: "hidden",
                position: "relative",
                background: "transparent",
                "-webkit-tap-highlight-color": "transparent",
                "-webkit-user-select": "none",
                "user-select": "none",
                cursor: "default"
            });
            element.nodeType === 1 && (this.renderer = element).appendChild(this.container);
            this.canvas = new Layer(this.container, this.width, this.height).canvas;
        }
        
        this.is3D = chartOptions.type === "3D";

        if (this.is3D) {
            globalWebglRenderer = {
                alpha: defined(chartOptions.alpha) ? chartOptions.alpha : false,
                depth: defined(chartOptions.depth) ? chartOptions.depth : true,
                stencil: defined(chartOptions.stencil) ? chartOptions.stencil : true,
                antialias: defined(chartOptions.antialias) ? chartOptions.antialias : false,
                premultipliedAlpha: defined(chartOptions.premultipliedAlpha) ? chartOptions.premultipliedAlpha : true,
                preserveDrawingBuffer: defined(chartOptions.preserveDrawingBuffer) ? chartOptions.preserveDrawingBuffer : false
            };
            this.context = this.canvas.getContext("webgl", globalWebglRenderer) || this.canvas.getContext("experimental-webgl", globalWebglRenderer);
        }
        else {
            this.context = this.canvas.getContext("2d");
        }
        if (element.nodeType === 1 && element.constructor === global.HTMLCanvasElement) {
            this.renderer = element;
            this.imageData = this.context.getImageData(0, 0, width, height);
        }
        if (!this.is3D) {
            rescale(this.context, width, height, DEVICE_PIXEL_RATIO);
        }

        if (defined(chartOptions.backgroundImage)) {
            extend(
                this.background = { completed: false, repeat: "no-repeat", position: [0, 0], size: [0, 0]}, 
                Formatter.imageURI(chartOptions.backgroundImage)
            );
        }

        //make layer
        this.layer = [];
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

        var animationOptions = chartOptions.animation;
        if (!isObject(animationOptions)) {
            animationOptions = { enabled: !!animationOptions };
        }

        this.globalAnimation = extend({
            isReady: false,
            enabled: animationOptions.enabled !== false,//default true
            instance: null
        }, animationOptions);
        this.globalAnimation.initialize = true;//initial once

        this.globalEvent = {
            click: noop,
            isDragging: false
        };

        this.globalHTML = {
            dataLabels: []
        };
    }, chartProto;

    chartProto = {
        setTitle: function () {
            var options = this.options;
            var context = this.context,
                chart = this;
            var subtitle = pack("array", options.subtitle, [options.subtitle]);
            var getTitle = function (titleOptions) {
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
            var render = function (title) {
                pack("array", title, [title]).forEach(function (titleOptions, i) {
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
                    if (titleOptions.enabled !== false && titleText.length) {
                        titleBBox = (titleTag = Text.HTML(Text.parseHTML(p1.text), context, p1.style)).getBBox();
                        viewport.top = p1.margin[0];
                        viewport.bottom = p1.margin[2];
                    }
                    if (subtitleText.length) {
                        subtitleBBox = (subtitleTag = Text.HTML(Text.parseHTML(p2.text), context, p2.style)).getBBox();
                        viewport.height += p2.margin[0];
                        viewport.bottom = p2.margin[2];
                    }
                    
                    viewport.width += pack("number", Math.max(titleBBox && titleBBox.width, subtitleBBox && subtitleBBox.width), 0);
                    viewport.height += pack("number", titleBBox && titleBBox.height, 0) + pack("number", subtitleBBox && subtitleBBox.height, 0);// + p2.dy;//line height
                    chart.title.push({
                        render: function () {
                            var pane = chart.panel[Math.min(panelIndex, ~-chart.panel.length)] || {
                                x: 0, y: 0, width: chart.width, height: chart.height
                            };
                            var x = 0, y = 0;
                            if (titleOptions.enabled !== false && titleText.length) {
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
                            if (subtitleOptions.enabled !== false && subtitleText.length) {
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
            this.title = [];
            render(options.title);
            return this;
        },
        setCredits: function () {
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
        addSeries: function (newData, index) {
            var options = this.options,
                chartAnimation = (options.chart || {}).animation || {},
                seriesAnimation = newData.animation || {},
                plotOptions = options.plotOptions || {},
                mergeOptions,
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
            var transform = newData.transform || {
                scale: undefined,
                translate: undefined// [0, 0]
            }, translate = transform.translate;

            var parseRange = function (rangeSelector) {
                var rs = {};
                var start = rangeSelector.start,
                    end = rangeSelector.end;
                if (isObject(rangeSelector)) {
                    start = mathMin(100, mathMax(0, pack("number", parseFloat(start, 10), 0)));
                    end = mathMin(100, mathMax(0, pack("number", parseFloat(end, 10), 100)));
                    rs.start = start + "%";
                    rs.end = end + "%";//xAxis=0
                    rs.bindAxis = isNumber(rangeSelector.xAxis, true) || isNumber(rangeSelector.yAxis, true) || isNumber(rangeSelector.polarAxis, true);
                }
                return rs;
            };

            if (!isNumber(animation.delay) && !isFunction(animation.delay)) {
                animation.delay = pack("number", chartAnimation.delay, 0);
            }
            if (isFunction(translate)) {
                transform.translate = translate.call(newData, series, this);
            }
            //transform.translate = TRouBLe(translate);

            newSeries = extend({}, newData, {
                type: type,
                name: name,
                data: pack("array", newData.data, []),
                index: index,
                start: "0%",
                end: "100%",
                minAxisZero: !!~arrayIndexOf(["column", "bar"], type),
                animationDuration: animation.duration,
                animationDelay: animation.delay,
                animationEasing: animation.easing,
                animationEnabled: animation.enabled,
                animationCompleted: true,
                transform: transform,
                states: {
                    hover: {}
                },
                tooltip: {}
            }, parseRange(options.rangeSelector));

            if (defined(newData.layer)) {
                newSeries.canvas = this.addLayer(newData.layer);
                newSeries.context = newSeries.canvas.getContext("2d");
            }
            mergeOptions = extend({color: seriesColors[index % seriesColors.length]},
                plotOptions.series || {},
                plotOptions[type] || {},
                newSeries,
                {color: newData.color}
            );
            newSeries = new Series(mergeOptions, this.options);
            newSeries.shapes = newSeries.addShape();
            newSeries.chart = this;

            this.isAxis2D = this.isAxis2D || (!defined(newSeries.projection) && hasAxis(newSeries.type));

            return newSeries;
        },
        reset: function () {
            this.xAxis.forEach(function (item) {
                delete item.options.stack;
                delete item.options.series;
            });
            this.yAxis.forEach(function (item) {
                delete item.options.stack;
                delete item.options.series;
            });
            this.colorAxis.forEach(function (item) {
                delete item.options.stack;
                delete item.options.series;
            });
        },
        panelTree: function () {
            var chart = this;

            var clamp = function (v, max) {
                return Math.max(0, Math.max(pack("number", max, 0), pack("number", v, 0)));
            };

            var paneltree = {
                name: "chart",
                node: this,
                parent: null,
                children: []
            };
            var axisSeries = Series.mapping(this.series);
            this.mapAxis = axisSeries;

            this.panel.forEach(function (pane) {
                paneltree.children.push({
                    name: "panel",
                    node: pane,
                    parent: chart,
                    children: []
                });
            });
            function enabledAxis (axis) {
                axis.options.enabled = axis._options.enabled === true;
            }
            function addChild (axis) {
                partition(axis, function (a, b) {
                    return a.options.panelIndex === b.options.panelIndex;
                }).forEach(function (groups, i) {
                    var panelIndex = clamp(groups[0].options.panelIndex, ~-chart.panel.length);
                    var series = axisSeries[groups[0].name][i] || [],
                        isEmpty;

                    var pane = paneltree.children[panelIndex],
                        childs = pane.children,
                        child;

                    groups.forEach(function (axis) {
                        series = axisSeries[groups[0].name][clamp(axis.index)] || [];
                        child = series.map(function (s) {
                            s["_" + axis.name] = axis.options;
                            return s;
                        });
                        isEmpty = !series.length;
                        isEmpty && (enabledAxis(axis));
                        if (!isEmpty) {
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
        },
        linkAxis: function () {
            var options = this.options,
                rangeSelectorOptions = options.rangeSelector;
            var xAxis = function (name) {
                return name === "xAxis";
            };

            var yAxis = function (name) {
                return name === "yAxis";
            };

            var linear = function (type) {
                return type === "linear";
            };

            var categor = function (type) {
                return type === "categories";
            };

            var logar = function (type) {
                return type === "logarithmic";
            };

            var x = function (s) {
                return s.isX === true;
            };

            var y = function (s) {
                return s.isY === true;
            };

            var setAxis = function (node) {
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
                    type = axis.type,
                    logBase = pack("number", (axisOptions.logarithmic || {}).base, 10);
                var softMax = axisOptions.softMax,
                    softMin = axisOptions.softMin;
                var max = axisOptions.max,
                    min = axisOptions.min;
                var j = -2, n;
                var isTrued;

                var minValue, maxValue, minDomain, maxDomain;

                var opera = [
                    function (name, type) {
                        return type === "logarithmic";
                    }, function () {
                        minDomain = minValue = mathLog(Math.max(minValue, 1), logBase);
                        maxDomain = maxValue = mathLog(maxValue, logBase);
                    },
                    function (name, type) {
                        return xAxis(name) && !linear(type);
                    }, function () {
                        minDomain = 0, maxDomain = seriesOptions.length;
                    },
                    function (name, type) {
                        if (xAxis(name) && linear(type) && !x(seriesOptions)) {
                            return false;
                        }
                        return xAxis(name) && !categor(type) && x(seriesOptions);
                    }, function () {
                        minDomain = minValue = seriesOptions.minX;
                        maxDomain = maxValue = seriesOptions.maxX;
                    },
                    function (name, type) {
                        return yAxis(name) && !categor(type) && y(seriesOptions);
                    }, function () {
                        minDomain = minValue = seriesOptions.minY;
                        maxDomain = maxValue = seriesOptions.maxY;
                    },
                    function (name, type) {
                        return seriesFirst.minAxisZero && linear(type);
                    }, function () {
                        minDomain = minValue = mathMin(0, seriesOptions.min);//bar & column base value 0
                    },
                    function (name, type) {
                        return (linear(type) || logar(type)) && isNumber(softMin, true) && softMin < minValue;
                    }, function () {
                        minDomain = minValue = softMin;
                    },
                    function (name, type) {
                        return (linear(type) || logar(type)) && isNumber(softMax, true) && softMax < maxValue;
                    }, function () {
                        maxDomain = maxValue = softMax;
                    },
                    function () {
                        return defined(min) && isNumber(min, true);
                    }, function () {
                        minDomain = minValue = min;
                    },
                    function () {
                        return defined(max) && isNumber(max, true);
                    }, function () {
                        maxDomain = maxValue = max;
                    },
                    function () {
                        return isNumber(axisOptions.tickAmount, true);
                    }, function () {
                        tickAmount = axisOptions.tickAmount;
                    },
                    function (name, type) {
                        return categor(type) || (!linear(type) && isArray(categories));
                    }, function () {
                        var categoriesLength = pack("number", categories && categories.length, seriesOptions.length, tickAmount, 0);
                        minDomain = mathMax(0, mathMin(~~(categoriesLength * start / 100), categoriesLength - 1));
                        maxDomain = mathMax(mathCeil(categoriesLength * end / 100), minDomain + 1);
                        if (isNumber(tickAmount, true)) {
                            tickAmount = maxDomain - minDomain;//defined axis tickAmount
                        }
                    },
                    function () {
                        return !(seriesOptions.length !== 0 || (isArray(categories) && categories.length));
                    }, function () {
                        minDomain = maxDomain = 0;
                    }
                ];

                if (count > 1) {
                    tickAmount = 5;
                }

                seriesOptions = extend({series: series}, Series.normalize(series));
                //seriesOptions.length = seriesFirst.sumLength;
                start = pack("number", parseFloat(seriesFirst.start, 10), 0);
                end = pack("number", parseFloat(seriesFirst.end, 10), 100);
                minValue = seriesOptions.min, maxValue = seriesOptions.max;
                minDomain = minValue, maxDomain = maxValue;

                n = opera.length;
                while ((j += 2) < n) if (isTrued = opera[j].apply(null, [name, type])) {
                    opera[-~j](isTrued);
                }

                mergeOptions = {
                    length: seriesOptions.axisLength,//seriesOptions.length,// 不使用数据长度
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
                axis.options.minX = seriesOptions.minX;
                axis.options.maxX = seriesOptions.maxX;
                axis.options.minY = seriesOptions.minY;
                axis.options.maxY = seriesOptions.maxY;
                axis.options.minLength = axis.minLength;
                axis.options.maxLength = axis.options.length = axis.maxLength;
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

            (function dfs (root) {
                var children = root.children,
                    i = -1,
                    n;
                var next = !0;

                if ((root.name.indexOf("Axis") !== -1) || !root.children) {
                    setAxis(root);
                    next = !1;
                }
                
                if (next && children && (n = children.length)) while (++i < n) {
                    dfs(children[i]);
                }
            })(this.chartTree);
            //resize axis
            this.translateAxis();
        },
        linkRangeSelector: function () {
            var chartOptions = this.options.chart || {},
                spacing = TRouBLe(chartOptions.spacing || []);
            var legendHeight = this.legend ? this.legend.viewport.height : 0;
            var chart = this;
            var getAxis = function (rangeSelectorOptions) {
                var mapAxis = chart.mapAxis;
                var rsp = rangeSelectorOptions,
                    axisIndex, axis;
                var minValue = Number.MAX_VALUE, maxValue = -minValue;
                var startValue, endValue;
                var rangeSeries = [];
                var p;

                if (!rangeSelectorOptions.hasOwnProperty("xAxis")) {
                    rsp = extend({xAxis: 0}, rangeSelectorOptions);//default axis
                }

                for (p in rsp) if (mapAxis.hasOwnProperty(p) && isNumber(axisIndex = rsp[p])) {
                    rangeSeries = (mapAxis[p][axisIndex] || []);
                    if (defined(axis = chart[p][axisIndex])) {
                        minValue = Math.min(minValue, axis.minValue);
                        maxValue = Math.max(maxValue, axis.maxValue);
                        startValue = "" + axis.startValue;
                        endValue = "" + axis.endValue;
                    }
                }
                return {
                    series: rangeSeries,
                    minValue: minValue,
                    maxValue: maxValue,
                    startValue: startValue,
                    endValue: endValue
                };
            };
            this.rangeSlider.forEach(function (slider) {
                if (slider !== null) {
                    var rangeSelectorOptions = slider.options,
                        axisOptions = getAxis(slider.options);
                    slider.setOptions({
                        series: axisOptions.series,
                        y: pack("number",
                            rangeSelectorOptions.y,
                            Numeric.percentage(slider.height, rangeSelectorOptions.y),
                            chart.height - slider.height - legendHeight - spacing[2]
                        ),
                        range: [chart.width, chart.height]
                    });
                }
            });
        },
        linkLegend: function () {
            var options = this.options;
            if (this.legend !== null/* && this.globalAnimation.initialize*/) {
                var legendHeight = 0,
                    legendX = 0,
                    legendY = 0;
                var seriesData = [];
                if (options.legend.enabled !== false) {
                    this.series.forEach(function (series, i) {
                        var data = series.shapes;
                        if ((series.type === "pie" || series.type === "funnel") && series.showInLegend === true) {
                            data.forEach(function (item, j) {
                                if (item !== null && (isObject(item) && item.value !== null)) {
                                    var value = item;// extend({type: series.type, seriesIndex: i, dataIndex: j}, item);//new Data
                                    value.type = series.type;
                                    value.seriesIndex = i;
                                    value.dataIndex = j;
                                    !defined(value.showInLegend) && (value.showInLegend = series.showInLegend);
                                    seriesData.push(value);
                                }
                                else {
                                    seriesData.push({ type: series.type, /*seriesIndex: i, dataIndex: j, */disabled: true });
                                }
                            });
                        }
                        else {
                            series.showInLegend !== false && isArray(series.data) && data.length && seriesData.push(series);
                        }
                    });

                    if (seriesData.length) {
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
        setLayout: function () {
            var options = this.options,
                layout = options.layout,
                grid = layout.grid || {};
                
            var viewport = this.getViewport().getView(),
                width = viewport.width,
                height = viewport.height;
            var margin = TRouBLe(grid.margin);
            var chart = this;
            var panel = setChartLayout(layout.panel, pack("number", grid.row, 1), pack("number", grid.col, 1), width, height, margin, viewport);
            var n = panel.length;

            var index = function (i, n) {
                return isNumber(i) && (Math.min(i, n));
            };
            var clamp = function (i, n) {
                return Math.min(Math.max(0, pack("number", i, 0) | 0), n);
            };
            partition(this.series, function (a, b) {
                return index(a.panelIndex, ~-n) === index(b.panelIndex, ~-n);
            }).forEach(function (groups) {
                panel[clamp(groups[0].panelIndex, ~-n)].series = groups;
            });
            partition(this.title, function (a, b) {
                return index(a.panelIndex, ~-n) === index(b.panelIndex, ~-n);
            }).forEach(function (groups) {
                var pane = panel[clamp(groups[0].panelIndex, ~-n)],
                    titleBBox;
                if (groups[0]) {
                    titleBBox = groups[0].viewport;
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

            var tooltipOptions = this.options.tooltip;
            var Tooltip = Dalaba.Chart.Tooltip;

            if (defined(Tooltip) && tooltipOptions.enabled !== false) {
                Comparative(panel, this.panel).update(function (d, _, i) {
                    if (defined(chart.series[i])) {
                        d.tooltip = new Tooltip(chart.addLayer(tooltipOptions.layer), tooltipOptions);
                    }
                }, function (d) {
                    if (d.tooltip) {
                        d.tooltip.destroy(true);
                    }
                }, function (d, newData, i) {
                    if (defined(chart.series[i])) {
                        newData.tooltip = d.tooltip || new Tooltip(chart.addLayer(tooltipOptions.layer), tooltipOptions);
                    }
                });
                this.tooltip = panel[0].tooltip;
            }
            return this.panel = panel;
        },
        getShape: function (graphers, x, y, shared) {
            var shapes = [];
            graphers.forEach(function (chart) {
                pack("array", pack("function", chart.getShape, noop).call(chart, x, y, shared)).forEach(function (shape) {
                    shapes.push({
                        shape: shape.shape,
                        series: shape.series,
                        key: shape.shape.key
                    });
                });
            });
            return shapes;
        },
        renderAll: function () {
            var options = this.options;
            var context = this.context,
                chart = this;

            function addBackgroundImage (background) {
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
                background: function () {
                    var backgroundColor = (options.chart || {}).backgroundColor,
                        gradient;
                    var width = chart.canvas.width,
                        height = chart.canvas.height,
                        size = Math.min(width, height);
                    size = Math.sqrt(width * width + height * height) / 2;
                    if (defined(backgroundColor)) {
                        if (backgroundColor.linearGradient || backgroundColor.radialGradient) {
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
                title: function () {
                    chart.title.forEach(function (title) {
                        title.render();
                    });
                },
                credits: function () {
                    chart.credits && chart.credits.render();
                },
                toolbar: function () {
                    chart.toolbar && chart.toolbar.render();
                },
                rangeSlider: function() {
                    chart.rangeSlider.forEach(function(slider){
                        slider && slider.draw();
                    });
                },
                axis: function () {
                    chart.colorAxis.forEach(function (axis) {
                        if(axis.options.enabled !== false)
                            axis.draw();
                    });
                    chart.radiusAxis.forEach(function (axis) {
                        if(axis.options.enabled !== false)
                            axis.draw();
                    });
                    chart.polarAxis.forEach(function (axis) {
                        if(axis.options.enabled !== false)
                            axis.draw();
                    });
                }
            };

            var onRenderer = function () {
                [
                    {z: 1, render: Renderer.background},
                    {z: 2, render: Renderer.image},
                    {z: 3, render: function () {
                        var grid = options.layout.grid || {};
                        chart.panel.forEach(function (pane) {
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
                            if (defined(backgroundColor)) {
                                context.fillStyle = backgroundColor;
                                context.fillRect(x, y, width, height);
                            }
                            if (borderWidth > 0) {
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
                    {z: 0, render: function () {
                        if (chart.container.nodeType === 1 && chart.container.constructor === global.HTMLCanvasElement) {
                            context.putImageData(chart.imageData, 0, 0);
                        }
                    }}
                ].sort(function (a, b) {
                    return a.z - b.z;
                }).forEach(function (item) {
                    item.render();
                });
            };
            onRenderer();
        },
        renderChart: function (charts, initialize) {
            charts.forEach(function (graphic) {
                graphic.draw(initialize);
            });
        },
        clear: function () {
            var width = this.width,
                height = this.height;
            this.series.concat([{context: this.context}]).forEach(function (series) {
                var context = series.context;
                if (defined(context)) {
                    context.clearRect(0, 0, width, height);
                }
            });
        },
        addPlotSeries: function (types) {
            var chartType = this.type;
            var panel = this.panel;

            this.series.forEach(function (series, i) {
                var type = series.type || chartType;
                var pane = panel[mathMin(series.panelIndex | 0, ~-panel.length)];
                series.plotX = pack("number", pane.plotX, pane.x, 0);
                series.plotY = pack("number", pane.plotY, pane.y, 0);
                series.plotWidth = pack("number", pane.plotWidth, pane.width);
                series.plotHeight = pack("number", pane.plotHeight, pane.height);
                series.plotCenterX = pack("number", pane.plotCenterX, pane.width / 2, 0);
                series.plotCenterY = pack("number", pane.plotCenterY, pane.height / 2, 0);
                series.plotRadius = pack("number", pane.plotRadius, mathMin(pane.width, pane.height), 0);
                types && (types[type] = { type: type, weight: pack("number", series.zIndex, i + 1) });
            });
            if (this.series.length && isObject(types) && isEmpty(types)) {
                types[chartType] = { type: chartType, weight: 0 };
            }
        },
        draw: function (event) {
            var options = this.options,
                newOptions = extend({}, options);
            var Graphers = Dalaba.Chart.graphers;
            var chart = this;
            var types = {};

            var addPanel = function (type, panel) {
                var panels = [];
                var n = panel.length,
                    i = -1,
                    nn, j;
                var newSeries, series;

                while (++i < n) {
                    newSeries = [];
                    for (j = 0, nn = panel[i].series.length; j < nn; j++) if ((series = panel[i].series[j]).type === type) {
                        newSeries.push(series);
                    }
                    panels.push({series: newSeries});
                }
                return panels;
            };

            var addChartor = function (chart, types, options) {
                var charts = chart.charts;
                var creator = {};
                var isCreated;
                var n, i, value, oldvalue;

                for (var type in types) {
                    isCreated = false;
                    value = types[type];
                    for (i = 0, n = charts.length; !isCreated && i < n; i++) {
                        isCreated = charts[i].type === type;
                    }
                    if (isCreated) {
                        options.panels = addPanel(type, options.panel);
                        charts[~-i].init(options);
                    }
                    else if (defined(Graphers[type]) && !(type in creator)) {
                        creator[type] = true;
                        options.panels = addPanel(type, options.panel);
                        charts[!oldvalue || (oldvalue && oldvalue.weight < value.weight) ? "push" : "unshift"](new Graphers[type](chart.canvas, options));
                        oldvalue = value;
                    }
                }
                //clear old graphic
                charts.forEach(function (item, i) {
                    if (!(item.type in types)) {
                        charts.splice(i, 1);
                    }
                });
                types = creator = null;
            };

            if (isEmpty(this.srcOptions) && this.globalAnimation.initialize && !(this.globalAnimation.initialize = false)) {
                this.renderAll(event);//title & credits
                return this;
            }

            this.reset();

            /*if (this.tooltip !== null && (this.options.tooltip || {}).show !== true) {
                this.tooltip.hide();//destroy
            }*/

            if (this.legend !== null && !this.legend.noScroll) {
                this.legend.destroy().scrollTop(0);
            }
            this.setTitle();

            this.linkLegend();
            this.setLayout();
            this.panelTree();//add to this series
            
            this.linkAxis();
            this.linkRangeSelector();
            
            newOptions.series = this.series;
            newOptions.panel = this.panel;

            this.addPlotSeries(types);
            addChartor(this, types, newOptions);
            this.panel.forEach(function (pane) {
                defined(pane.tooltip) && pane.tooltip.setChart(chart);
            });
            this.addOverlap();
            this.render(event);
        },
        redraw: function (event) {
            this.linkAxis();
            if (event.type === "selected") {
                this.addPlotSeries();
                this.charts.forEach(function (graphic) {
                    graphic.redraw(event);
                });
            }
            DataLabels.overlapping(this.globalHTML.dataLabels);
            this.render(event);
        },
        render: function (event) {
            var options = this.options,
                events = (options.chart || {}).events || {},
                charts = this.charts,
                chart = this;
            var globalAnimation = chart.globalAnimation;
            var background = chart.background;
            var tooltipOptions = options.tooltip || {};

            var onLoad = function () {
                defined(events.load) && events.load.call(chart, event);
            };
            var onReady = function () {
                defined(events.ready) && events.ready.call(chart, event);
            };
            var onRedraw = function () {
                defined(events.redraw) && events.redraw.call(chart, event);
            };
            
            var filterAnimation = function (chart, type) {
                var globalAnimation = chart.globalAnimation;
                return !defined(Dalaba.Animation)
                    || globalAnimation.enabled !== true
                    || !!~arrayIndexOf(["map", "heatmap", "venn", "diagram"], type);
            };

            var filterNotAnimation = function (charts, notAnimation) {
                return arrayFilter(charts, function (series) {
                    var f;
                    return (f = filterAnimation(chart, series.type)) && notAnimation.push(series), !f;
                });
            };

            var getAnimationList = function () {
                var list = [].slice.call(arguments, 0, -1),
                    initialize = !!arguments[list.length];
                var shapes = [];
                list.forEach(function (item) {
                    item.forEach(function (graphic) {
                        graphic.animateTo && graphic.animateTo(initialize).forEach(function (shape) {
                            shapes.push(shape);
                        });
                    });
                });
                return shapes;
            };
            var drawAxis = function () {
                chart.yAxis.concat(chart.xAxis).forEach(function (axis) {
                    if (axis.options.enabled !== false) {
                        axis.setCrosshair(event.moveX, event.moveY).draw();
                    }
                });
            };
            var drawLegend = function () {
                var legend = chart.legend;
                var setState = function (item, isSeted) {
                    var series = chart.series,
                        shape = item;
                    if (item.type === "pie" || item.type === "funnel") {
                        var shapes = pack("object",
                            series[pack("number", item.seriesIndex, -1)], {}
                        ).shapes || [];
                        shapes.forEach(function (shape) {
                            delete shape.state;
                        });
                        isSeted !== false && ((shape = shapes[pack("number", item.dataIndex, -1)] || {}).state = !0);
                    }
                    else {
                        series.forEach(function (series) {
                            delete series.state;
                        });
                        isSeted !== false && (shape.state = !0);
                    }
                };
                if (legend !== null && charts.length) {
                    if (event.type === "mousemove" && globalAnimation.isReady) {
                        legend.onState(event, function (item) {
                            setState(item);
                        }, function (item) {
                            setState(item, false);
                        });
                    }
                    legend.draw();
                }
            };
            var tooltipFilter = function (pos, data, ret) {
                var n = data.length,
                    i = 0;
                var d, insides = [];
                for (; i < n; i++) if (defined(d = data[i])) {
                    defined(d.tooltip) && pos && Intersection.rect({
                        x: pos.moveX, y: pos.moveY
                    }, {
                        x: d.x, y: d.y,
                        width: d.x + d.width, height: d.y + d.height
                    }) ? insides.push(d) : ret.push(d);
                }
                return insides;
            };

            var drawTooltip = function () {
                var panels, curPanel = tooltipFilter(event, chart.panel, panels = [])[0];
                var linked = (options.layout || {}).linked;
                var positioner = tooltipOptions.positioner;

                if (defined(curPanel)) {
                    if (event.type !== "mousemove") {
                        var item = curPanel.tooltip.move(event.moveX, event.moveY, true)[0];
                        var curIndex;
                        if (item && panels.length) {
                            curIndex = item.shape.index;
                            panels.forEach(function (pane) {
                                var shapes = pane.series[0].shapes;
                                if (isNumber(curIndex, true) && defined(shapes = shapes[curIndex])) {
                                    if (linked === true) {
                                        pane.tooltip.move(shapes.x, shapes.y, true);
                                        pane.tooltip.show();
                                    }
                                    else {
                                        pane.tooltip.hide();
                                    }
                                }
                            });
                        }
                    }
                    curPanel.tooltip.draw();

                    panels.forEach(function (pane) {
                        pane.tooltip && pane.tooltip.draw();
                    });
                }
                //no moving
                else if (tooltipOptions.show === true && defined(positioner) && isNumber(positioner.x, true) && isNumber(positioner.y, true)) {
                    chart.panel.forEach(function (pane) {
                        pane.tooltip && (pane.tooltip.move(positioner.x, positioner.y));
                    });
                }
            };

            function paintComponent (charts, ani, once) {
                chart.clear();
                chart.renderAll(event);
                drawAxis();
                chart.series.forEach(function (series) {
                    series.animationCompleted = globalAnimation.isReady;
                });
                chart.renderChart(charts);
                if (ani) {
                    ani();
                }
                //if (charts.length) {
                    drawLegend();
                //}

                !once && drawTooltip();
            }

            var isEventing = function (event) {
                var type = event.type;
                return type === "mousemove" || type === "resize" || type === "click" || type === "mousewheel";
            };
            var isAnimationReady = function (chart) {
                return chart.globalAnimation.isReady === true;
            };
            var isDragging = function (chart) {
                return chart.globalEvent.isDragging === false;
            };

            var animateTo = function (charts, onStep, onLoad) {
                var noAnimationCharts, animationCharts = filterNotAnimation(charts, noAnimationCharts = []);
                globalAnimation.isReady = false;
                if (noAnimationCharts.length) {
                    defined(background) && defined(background.image) && background.completed !== true ?
                        new function () {
                            background.image.onload = function () {
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
                if (defined(Dalaba.Animation) && animationCharts.length) {
                    globalAnimation.instance = new Dalaba.Animation();
                    getAnimationList(animationCharts, chart.xAxis, chart.yAxis, chart.polarAxis, true).forEach(function (shape) {
                        globalAnimation.instance.addAnimate(shape, {
                            complete: function () {
                            },
                            duration: pack("number", shape.duration, globalAnimation.duration, 500),
                            easing: pack("string", shape.easing, globalAnimation.easing, "ease-in-out"),
                            delay: pack("number", shape.delay, globalAnimation.delay, 0)
                        });
                    });
                    globalAnimation.instance.fire(function () {
                        globalAnimation.isReady = false;
                        onStep && onStep(noAnimationCharts, animationCharts);
                    }, function () {
                        globalAnimation.isReady = true;
                        paintComponent(charts);
                        onLoad();
                    });
                }
                animationCharts.length | noAnimationCharts.length || (globalAnimation.isReady = true, chart.renderAll(event), drawAxis(), onLoad(), onReady());
                !animationCharts.length & !!noAnimationCharts.length && (globalAnimation.isReady = true, onLoad(), onReady());
                //globalAnimation.isReady = true;
            };

            if (this.is3D) {
                chart.renderChart(filterNotAnimation(charts));
                globalAnimation.isReady = true;
                return;
            }

            if (globalAnimation.initialize === true && !(globalAnimation.initialize = false)) {
                animateTo(charts, function (noAnimationCharts, animationCharts) {
                    paintComponent(noAnimationCharts, function () {
                        chart.renderChart(animationCharts, true);
                    }, true);
                }, function () {
                    onLoad();//, onReady();
                });
            }
            else {
                if (event.type === "update" || event.type === "selected") {
                    var noAnimationCharts, animationCharts = filterNotAnimation(charts, noAnimationCharts = []);
                    if (noAnimationCharts.length) {
                        paintComponent(noAnimationCharts);
                    }
                    if (animationCharts.length) {
                        var shapes = getAnimationList(animationCharts, chart.xAxis, chart.yAxis, this.polarAxis, false);
                        if (globalAnimation.instance === null) {
                            globalAnimation.instance = new Dalaba.Animation();
                        }
                        globalAnimation.instance.stop(false, true);
                        shapes.forEach(function (shape) {
                            globalAnimation.instance.addAnimate(shape, {
                                duration: event.type === "selected" ? 300 : pack("number", shape.duration, globalAnimation.duration, 500),
                                delay: 0,
                                easing: "linear",
                                complete: function () {}
                            });
                        });

                        globalAnimation.instance.fire(function () {
                            globalAnimation.isReady = false;
                            paintComponent(charts, null, true);
                            onRedraw();
                        }, function () {
                            globalAnimation.isReady = true;
                            paintComponent(charts, null);
                            onRedraw(), onReady();
                        });
                    }
                    if (event.type === "update") {
                        (noAnimationCharts.length & !animationCharts.length) && (onRedraw());
                        (noAnimationCharts.length | animationCharts.length) || (paintComponent([]), onReady());
                    }
                }
                else if (isAnimationReady(chart) && isDragging(chart) && isEventing(event)) {
                    paintComponent(charts);
                    onRedraw();
                }
            }
        },
        addOverlap: function () {
            var labels = [];
            var container = this.container;

            var labelPoints = function (shape, dataLabel, labels, domLabel) {
                var label;
                if (dataLabel) {
                    dataLabel.placed = true;
                    dataLabel.weight = shape.weight || dataLabel.height;
                    if (dataLabel.useHTML === true && domLabel) {
                        label = document.createElement("div");
                        setStyle(label, {visibility: "hidden"});
                        domLabel.appendChild(label);
                        label.innerHTML = dataLabel.value;
                        dataLabel.domLabel = label;
                    }
                    dataLabel.allowOverlap !== true && labels.push(dataLabel);
                }
            };

            this.series.forEach(function (series) {
                series.domLabel && container.removeChild(series.domLabel);
            });

            this.series.forEach(function (series) {
                var dataLabels = series.dataLabels;
                var domLabel;
                if (defined(dataLabels) && dataLabels.enabled !== false) {
                    if (dataLabels.useHTML === true) {
                        domLabel = document.createElement("div");
                        isString(dataLabels.className) && setAttribute(domLabel, { "class": dataLabels.className});
                        container.appendChild(domLabel);
                        series.domLabel = domLabel;
                    }
                    series.shapes.forEach(function (shape) {
                        var boxDataLabels = shape.boxDataLabels;
                        if (isArray(boxDataLabels)) {
                            boxDataLabels.forEach(function (dataLabel) {
                                labelPoints(shape, dataLabel, labels, series.domLabel);
                            });
                        }
                        labelPoints(shape, shape.dataLabel, labels, series.domLabel);
                    });
                }
            });
            this.globalHTML.dataLabels = labels;
            DataLabels.overlapping(labels); // global checked
        },
        getViewport: function () {
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
            var yAxisTitleHeight = 0,
                yAxisTitleWidth = 0,
                xAxisTitleHeight = 0;

            if (this.title !== null) {
                //viewport.top += this.title.viewport.height;
            }
            if (this.legend !== null && defined(this.legend.viewport)) {
                legendOptions = this.legend.options;
                legendBox = this.legend.viewport;
                if (legendOptions.floating !== true) {
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
            this.rangeSlider.forEach(function (slider) {
                if (slider !== null) {
                    legendOptions = slider.options;
                    if(legendOptions.floating !== true && legendOptions.layout !== "vertical"){
                        box.bottom += slider.height + pack("number", legendOptions.margin, 0);
                    }
                }
            });

            this.yAxis.forEach(function (axis) {
                if (axis.options.enabled !== false) {
                    if (axis.options.opposite === true) {
                        offsetRight += axis.labelWidth || 0;
                    }
                    else {
                        offsetLeft += axis.labelWidth || 0;
                    }
                    yAxisTitleHeight = Math.max(yAxisTitleHeight, pack("number", axis.titleHeight, 0));
                    yAxisTitleWidth = Math.max(yAxisTitleWidth, pack("number", axis.titleWidth, 0));
                }
            });
            this.xAxis.forEach(function (axis) {
                if (axis.options.enabled !== false) {
                    if (axis.options.opposite === true) {
                        offsetTop += axis.labelHeight || 0;
                    }
                    else {
                        offsetBottom += axis.labelHeight || 0;
                    }
                    xAxisTitleHeight = Math.max(xAxisTitleHeight, pack("number", axis.titleHeight, 0));
                }
            });
            viewport.top += yAxisTitleHeight;
            viewport.bottom += xAxisTitleHeight
            top = viewport.top + offsetTop;
            bottom = viewport.bottom + offsetBottom;
            left = viewport.left + offsetLeft + yAxisTitleWidth;
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
            viewport.getPlot = function () {
                return plot;
            };
            viewport.getView = function () {
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
        setOptions: function (options, redraw) {
            var series = [];
            var seriesOptions,
                axisOptions,
                chartOptions = options.chart || {};
            var chart = this;
            extend(this.options, options);

            var execute = function (type, axisOptions) {
                var oldAxis = chart[type];
                axisOptions = pack("array", axisOptions, [axisOptions]);
                Comparative(axisOptions, oldAxis).update(function (item) {
                    var srcOptions = isObject(item) ? item : {},
                        axisOptions = extend({
                            name: type,
                            //index: chart[name].length,
                            lang: options.lang
                        }, defaultOptions[type], srcOptions) || {};
                    axisOptions.labels = axisOptions.labels || {};
                    axisOptions.labels.style = axisOptions.labels.style || {};
                    for (var p in chartOptions.style) if (!({}).hasOwnProperty.call(axisOptions.labels.style, p)) {
                        axisOptions.labels.style[p] = chartOptions.style[p];
                    }
                    chart.addAxis(type, axisOptions)._options = srcOptions;
                }, function () {
                }, function (axis, item) {
                    axis.setOptions(item);
                    axis._options = item;
                });
                //reset index
                oldAxis.forEach(function (axis, i) {
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
                List.diff(this.series, seriesOptions, function (a, b) {
                    return (defined(a.id) && defined(b.id) && a.id === b.id) || (a.name === b.name && a.type === b.type);
                }).modify(function (newIndex, oldIndex) {
                    var newSeries, oldSeries;
                    var mergeSeries;
                    oldSeries = chart.series[oldIndex];
                    newSeries = chart.series[newIndex];
                    mergeSeries = seriesOptions[newIndex];
                    mergeSeries.used = true;
                    oldSeries.update(mergeSeries, false);
                    //oldSeries._shapes = [];//newSeries._shapes;// oldSeries._shapes.slice(0, newSeries.shapes.length);
                    series.push(oldSeries);
                }).each();
                seriesOptions.forEach(function (item, i) {
                    var newSeries;
                    if (!item.used) {
                        newSeries = chart.addSeries(item, i);
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
            if (defined(options.layout)) {
                //this.render("click", {x: this.globalEvent.x, y: this.globalEvent.y});
            }
            if (defined(chartOptions = options.chart) && (isNumber(chartOptions.width, true) || isNumber(chartOptions.height, true))) {
                this.setSize(
                    isNumber(chartOptions.width, true) ?  mathMax(0, chartOptions.width) : chart.width,
                    isNumber(chartOptions.height, true) ? mathMax(0, chartOptions.height) : chart.height,
                    null
                );
            }
            //setting exists slider
            if (defined(chartOptions = options.rangeSelector) && this.rangeSlider && this.rangeSlider.length) {
                this.rangeSlider.forEach(function (slider, i) {
                    var rsp = isArray(chartOptions) ? chartOptions[i] : chartOptions;
                    var rangeSelector = chart.rangeSelector[i];
                    var from, to;

                    slider.setOptions(rsp);

                    if (rangeSelector && rsp && (defined(rsp.start) || defined(rsp.end))) {
                        from = pack("number", parseFloat(chartOptions.start, 10), parseFloat(slider.start, 10));
                        to = pack("number", parseFloat(chartOptions.end, 10), parseFloat(slider.end, 10));
                        rangeSelector.from = rangeSelector._start = from;
                        rangeSelector.to = rangeSelector._end = to;
                    }
                });
            }

            redraw !== false && this.draw({ target: this, type: "update"});
            return this;
        },
        setSize: function (width, height, event) {
            var options = this.options,
                spacing = TRouBLe(options.chart.spacing);
            var panel = this.panel;
            var percentage = Numeric.percentage;
            var chart = this;
            //var viewport = this.getViewport();
            var oldWidth = this.width,
                oldHeight = this.height;
            var ratioWidth = width - oldWidth,
                ratioHeight;

            //this.width = width;
            //this.height = height;

            this.layer.forEach(function (layer) {
                if (!chart.is3D) {
                    rescale(layer.getContext("2d"), width, height, DEVICE_PIXEL_RATIO);
                }
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
                this.legend.viewport.height = mathMin(
                    this.legend.maxHeight + (pack("number", this.legend.options.margin, 0)),
                    this.height / 2
                );
            }
            ratioWidth = width / oldWidth;
            ratioHeight = height / oldHeight;
            //console.log(this.height, oldHeight);

            panel.forEach(function (pane) {
                pane.plotX = pane.x *= ratioWidth;
                pane.plotWidth = pane.width *= ratioWidth;
                //pane.width += ratioWidth;
                pane.height = pane._height + (height - oldHeight);// viewport.height;// *= ratioHeight;
            });
            this.rangeSlider.forEach(function (slider) {
                slider.setOptions({
                    width: slider.width * ratioWidth
                });
            });
            this.translateAxis();
            this.addPlotSeries();

            this.charts.forEach(function (graphic) {
                graphic.redraw(event);
            });
            DataLabels.overlapping(this.globalHTML.dataLabels); // global checked

            event !== null && chart.render(event);
        },
        getSize: function (container) {
            var options = this.options,
                chartOptions = options.chart || {};
            var width = chartOptions.width,
                height = chartOptions.height;

            var bbox = container.getBoundingClientRect(),
                boxWidth = pack("number", bbox.width, container.offsetWidth),
                boxHeight = pack("number", bbox.height, container.offsetHeight);
            var padding = getStyle(container, "padding").split(/\s+/).map(parseFloat);
            padding = TRouBLe(padding);

            width = mathMax(0, pack("number", width, Numeric.percentage(boxWidth, width)));
            height = mathMax(0, pack("number", height, Numeric.percentage(boxHeight, height)));
            
            if (height <= 0) {
                height = pack("number", bbox.height, container.offsetHeight);
            }
            if (width <= 0) {
                width = pack("number", bbox.width, container.offsetWidth);
            }
            width = mathMax(0, width - padding[1] - padding[3]);
            height = mathMax(0, height  - padding[0] - padding[2]);
            return {
                width: width,
                height: height
            };
        },
        destroy: function () {
            var container = this.container;

            Event.Handler.destroy(this);
            var layer;

            while (layer = this.layer.pop()) {
                (layer.parentNode && layer.parentNode === container) && container.removeChild(layer);
            }

            if (defined(this.tooltip)) {
                layer = this.tooltip.canvas;
                this.tooltip.useHTML === true && ((layer.parentNode && layer.parentNode === container) && container.removeChild(layer));
            }
            container.parentNode && container.parentNode.removeChild(container);

            [layer, container, this.context, this.tooltip, this.legend].concat(
                this.xAxis, this.yAxis, this.colorAxis, this.series
            ).forEach(function (item) {
                item = null;
            });
        },
        addLayer: function (isLayer) {
            var layer = this.layer;
            return isNumber(isLayer) & isLayer > 0 ?
                (layer[layer.length] = new Layer(this.container, this.width, this.height).canvas)
                : this.canvas;
        },
        addAxis: function (name, axisOptions) {
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
                if (!defined(axisOptions.range)) {
                    axisOptions.range = [0, chart.width];
                }
                axis = new Axis(this.canvas, axisOptions);
                axis.name = name;
                axis.index = this[name].length;
                this[name].push(axis);
            }
            return axis;
        },
        addLegend: function (legendOptions) {
            var Legend = Dalaba.Chart.Legend,
                legend = null;

            if (defined(Legend) && legendOptions.enabled !== false) {
                legend = new Legend(
                    this.canvas,//this.addLayer(legendOptions.layer),
                    legendOptions.series,
                    legendOptions//selected为false不读取
                );
            }
            return legend;
        },
        addToolbar: function (toolbarOptions) {
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
                            }
                        }
                    }
                };

                return this.toolbar = toolbar;
            }
            return null;
        },
        translateAxis: function () {
            var panel = this.panel;
            panel.forEach(function (item) {
                var viewportLeft = 0,
                    viewportRight = 0,
                    viewportTop = 0,
                    viewportBottom = 0;
                item.yAxis.forEach(function (axis) {
                    var axisOptions = axis.options;
                    var pane = panel[mathMin(axisOptions.panelIndex | 0, panel.length - 1)],
                        viewport = pane.viewport;
                    var left = viewport.left,
                        right = viewport.right,
                        top = viewport.top;
                    
                    if (axisOptions.enabled === true) {
                        axis.scale(0, pane.height);
                        if (axisOptions.opposite === true) {
                            right += axis.labelWidth;
                        }
                        else {
                            left += axis.textBoxSize;
                        }
                        if (!pane.yAxisTitleFirst && (pane.yAxisTitleFirst = true)) {
                            if (!axis.titleRotation)
                                top += pack("number", axis.titleHeight, 0);
                        }
                    }
                    viewportLeft += left;
                    viewportRight += right;
                    pane.viewportLeft = viewportLeft, pane.viewportRight = viewportRight, pane.viewportTop = top;
                });
                item.xAxis.forEach(function (axis) {
                    var axisOptions = axis.options;
                    var pane = panel[mathMin(axisOptions.panelIndex | 0, panel.length - 1)],
                        viewport = pane.viewport;
                    var top = viewport.top,
                        bottom = viewport.bottom;
                    if (axisOptions.enabled === true) {
                        axis.scale(0, pane.width);
                        if (axisOptions.opposite === true) {
                            top += axis.labelHeight;
                        }
                        else {
                            bottom += axis.labelHeight;
                        }
                        if (!pane.xAxisTitleFirst && (pane.xAxisTitleFirst = true)) {
                            bottom += pack("number", axis.titleHeight, 0);
                        }
                    }
                    viewportTop += top;
                    viewportBottom += bottom;
                    pane.viewportTop = viewportTop, pane.viewportBottom = viewportBottom;
                });
            });
            
            panel.forEach(function (item) {
                var xLeftWidth = 0,
                    xRightWidth = 0,
                    yBottomHeight = 0,
                    yTopHeight = 0;

                var startX;
                item.yAxis.forEach(function (axis) {
                    var pane = panel[mathMin(axis.options.panelIndex | 0, panel.length - 1)];
                    var plotHeight = pane.height - pane.viewportTop - pack("number", pane.viewportBottom),
                        plotWidth = pane.width - pane.viewportLeft - pane.viewportRight,
                        plotY = pane.y + pane.viewportTop;

                    var x = pane.x,
                        y = plotY;
                    //startX = x;
                    if (axis.options.enabled !== false) {
                        if (axis.options.opposite === true) {
                            //startX = pane.x + axis.labelWidth;
                            x += pane.width - axis.labelWidth - xRightWidth; //xRightWidth - axis.labelWidth;
                            xRightWidth += axis.labelWidth;
                        }
                        else {
                            startX = x += axis.labelWidth + xLeftWidth + axis.titleRotation * axis.titleWidth;
                            xLeftWidth += axis.labelWidth;
                        }
                        axis.setOptions({
                            x: x,
                            y: y,
                            width: plotWidth,
                            range: [0, plotHeight]
                        });
                    }
                    pane.plotX = pack("number", startX, pane.x);//enabled is false
                    pane.plotY = y;
                    pane.plotHeight = plotHeight;
                    pane.plotWidth = plotWidth;
                });
                item.xAxis.forEach(function (axis) {
                    var axisOptions = axis.options;
                    var pane = panel[mathMin(axisOptions.panelIndex | 0, panel.length - 1)];
                    var plotHeight = pane.height - pane.viewportTop - pane.viewportBottom,
                        plotWidth = pane.width - pane.viewportLeft - pane.viewportRight;
                    var y = 0;
                    if (axisOptions.enabled !== false) {
                        if (axisOptions.opposite === true) {
                            y = pane.y + pane.viewportTop + yTopHeight;
                            yTopHeight += axis.labelHeight;//titleHeight
                        }
                        else {
                            y = pane.y + pane.height - axis.labelHeight - yBottomHeight - axis.titleHeight;
                            yBottomHeight += axis.labelHeight;
                        }
                        axis.setOptions({
                            x: pane.x + pane.viewportLeft,
                            y: y,
                            height: plotHeight,
                            range: [0, plotWidth]
                        });
                    }
                    if (!item.yAxis.length) {
                        pane.plotHeight = plotHeight;//no yAxis
                    }
                });

                item.polarAxis.concat(item.radiusAxis).forEach(function (axis, i) {
                    var pane = panel[mathMin(axis.options.panelIndex | 0, panel.length - 1)];
                    var plotHeight = pane.height - pane.viewportTop - pane.viewportBottom,
                        plotWidth = pane.width - pane.viewportLeft - pane.viewportRight,
                        plotY = pane.y + pane.viewportTop;
                    var axisOptions = axis._options;
                    var size = mathMin(plotHeight, plotWidth) / 2,//default 85%
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
                    if (axis.options.enabled !== false) {
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
                delete item.xAxisTitleFirst;
                delete item.yAxisTitleFirst;
            });
        },
        rangeToPoints: function (bounds) {
            this.globalEvent.isDragging = false;
            this.charts.forEach(function (graphic) {
                graphic.rangeTo && graphic.rangeTo(bounds);
            });
            this.render({ target: this, type: "mousemove" });
        },
        export: function (image, width, height, type) {
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

    Dalaba.Chart.setOptions = function (options) {
        defaultOptions = extend(defaultOptions, options);
    };
    Dalaba.Chart.getOptions = function () {
        return defaultOptions;
    };

    Dalaba.Chart.define = function (ns, instance) {
        var Graphers = Dalaba.Chart.graphers;
        if (defined(Graphers) && !({}).hasOwnProperty.call(Graphers, ns)) {
            Graphers[ns] = instance;
        }
        return {
            Chart: function (element, options) {
                return new Dalaba.Chart(element, options);
            }
        };
    };
    
    Dalaba.Chart.fn = Dalaba.Chart.prototype = {
        constructor: Chart,
        init: function (canvas, options) {
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
            
            //create credits
            this.setCredits();
            
            pack("array", options.series, []).forEach(function (item) {
                chart.series.push(chart.addSeries(item, chart.series.length));
            });

            //create axis
            var add = function (name, axis) {
                pack("array", axis, isObject(axis) ? [axis] : [{enabled: false}]).forEach(function (item) {
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
            if (legend !== null) {
                legend.onClick(chart.container, function (e, item, index) {
                    item.selected = this.selected;//modified series //hover-on, hover-off, click-on, click-off
                    legend.noScroll = true;

                    chart.redraw(extend({}, e, { type: "selected", points: [item], shapes: [item] }));
                }).onScroll(chart.container, function (e) {
                    chart.render(e);
                });
                this.legend = legend;
            }

            var RangeSelector = Dalaba.Chart.RangeSelector;
            if (defined(options.rangeSelector)) {
                (isArray(options.rangeSelector) ? options.rangeSelector : [options.rangeSelector]).forEach(function(item){
                    var rangeSelectorOptions = extend({}, item || {}),
                        rangeSlider = null;
                    var xAxisIndex = rangeSelectorOptions.xAxis,
                        yAxisIndex = rangeSelectorOptions.yAxis,
                        polarAxisIndex = rangeSelectorOptions.polarAxis;
                    //if (chart.xAxis[xAxisIndex] || chart.yAxis[yAxisIndex] || chart.polarAxis[polarAxisIndex]) {
                        var width = rangeSelectorOptions.width ||
                                Numeric.percentage(chart.width, rangeSelectorOptions.width) ||
                                chart.width - spacing[1] - spacing[3],
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
                        if (defined(RangeSelector) && rangeSelectorOptions.enabled === true) {
                            rangeSlider = new RangeSelector(chart.canvas, rangeSelectorOptions);
                            rangeSlider._options = item || {};
                            chart.rangeSlider.push(rangeSlider);
                        }
                        chart.rangeSelector.push({
                            start: rangeSelectorOptions.start,
                            end: rangeSelectorOptions.end,
                            from: parseFloat(rangeSelectorOptions.start, 10),
                            to: parseFloat(rangeSelectorOptions.end, 10)
                        });
                    //}
                });
            }

            this.toolbar = chart.addToolbar(options.toolbar);

            chart.draw({
                target: this,
                type: "load"
            });
            chart.container.nodeType === 1 && Event.Handler(this);

            return this;
        }
    };
    extend(Dalaba.Chart.prototype, Chart.prototype);
    Dalaba.Chart.fn.init.prototype = Dalaba.Chart.fn;
})(typeof window !== "undefined" ? window : this, Dalaba);