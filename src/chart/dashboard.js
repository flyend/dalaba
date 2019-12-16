(function(global, Dalaba) {
    var Chart = Dalaba.Chart;

    var extend = Dalaba.extend;

    var pack = Dalaba.pack;

    var isFunction = Dalaba.isFunction;

    var interpolate = Dalaba.Numeric.interpolate;

    function setStyle(el, attr) {
        for(var p in attr) if(attr.hasOwnProperty(p)){
            el.style[p.replace(/\-(\w)/g, function(all, s){
                return s.toUpperCase();
            })] = attr[p];
        }
    }

    (function(Chart) {

        var defaultOptions = {
            animation: true,
            expand: false,
            width: 200,
            title: {
                text: "Dalaba",
                style: {
                    /*position: "absolute",
                    top: 0,
                    left: 0,*/
                    backgroundColor: "#eee",
                    //paddingLeft: "24px",
                    padding: "4px 0 4px 24px"
                    //marginLeft: "24px"
                }
            },
            button: {
                style: {
                    width: "16px",
                    height: "11px",
                    position: "absolute",
                    left: "4px",
                    top: "4px",
                    borderTop: "1px solid #ccc",
                    borderBottom: "1px solid #ccc"
                }
            },
            style: {
                backgroundColor: "#f7f6f6",
                border: "1px solid rgba(0,0,0,.15)",
                fontSize: "12px",
                fontWeight: "normal",
                color: "#666666",
                cursor: "default",
                lineHeight: "16px",
                position: "absolute",
                right: "0px",
                top: "0px",
                bottom: "0px"
            },
            enabled: true,
            crosshairs: undefined,
            shared: true,
            formatter: undefined,
            borderWidth: 0,
            borderRadius: 4,
            borderColor: "#7B7B7B",
            backgroundColor: "rgba(251, 251, 251, .85)",
            shadow: true,
            headerFormat: "",
        };

        function Toolbar() {
            this.init.apply(this, arguments);
        }
        Toolbar.prototype = {
            init: function(canvas, options) {
                var toolbarOptions = extend(this.options = extend({}, defaultOptions), options);
                this.canvas = canvas;

                var bar = document.createElement("div");
                var width = pack("number", toolbarOptions.width, 200);

                setStyle(bar, extend({width: width + "px"}, toolbarOptions.style || {}));
                canvas.appendChild(bar);

                this.toolbar = {
                    context: bar
                };

                bar.appendChild(this.toolbar.button = this.addButton(toolbarOptions.button));
                bar.appendChild(this.toolbar.title = this.addTitle(toolbarOptions.title));
                bar.appendChild(this.toolbar.content = this.addContent());
                
                this.expand(options.expand);
            },
            addTitle: function(titleOptions) {
                var barTitle = document.createElement("div");
                var style = titleOptions.style || {};

                barTitle.innerHTML = titleOptions.text || "Dalaba";

                setStyle(barTitle, style);

                return barTitle;
            },
            addButton: function(buttonOptions) {
                var barButton = document.createElement("div");
                var border = "border-bottom:1px solid #ccc;",
                    marginTop = "margin-top: 2px;";
                    //marginLeft = "margin-left: 4px;";
                

                var style = buttonOptions.style || {};
                
                barButton.innerHTML = [
                    ["<div style='width: 70%;", "'></div>"],
                    ["<div style='", "'></div>"],
                    ["<div style='width: 70%;", "'></div>"]
                ].map(function(d) {
                    return d[0] + border + marginTop + d[1];
                }).join("");

                setStyle(barButton, style);

                

                return barButton;
            },
            addContent: function() {
                var wrap = document.createElement("div");
                var style = {
                    position: "absolute",
                    left: "0px",
                    top: "24px",
                    bottom: "0px",
                    width: "100%",
                    overflow: "auto"
                };

                setStyle(wrap, style);

                this.addList(wrap);

                this.draw();
                return wrap;
            },
            addList: function(wrap) {
                var options = this.options,
                    style = options.style || {};
                var activeBackgroundColor = "#4888ff",
                    activeColor = "#ffffff";
                var toolbar = this;
                var list = [
                    "MAX", "MIN", "SUM", "VAR", "STD", "MEDIAN"
                ];
                //list = list.concat(["MAX", "MIN", "SUM", "VAR", "STD", "MEDIAN"]);
                //list = list.concat(["MAX", "MIN", "SUM", "VAR", "STD", "MEDIAN"]);
                //list = list.concat(["MAX", "MIN", "SUM", "VAR", "STD", "MEDIAN"]);
                var dlist = document.createElement("dl"),
                    dtitle = document.createElement("dt"),
                    ditem;
                var currentIndex = -1;

                var items = [];

                var addState = function() {
                    var me = this;
                    var args = arguments;
                    ["backgroundColor", "color"].forEach(function(d, i) {
                        me.style[d] = args[i];
                    });
                };
                var onCurr = function() {
                    addState.call(this, activeBackgroundColor, activeColor);
                };
                var onPrev = function() {
                    addState.call(this, "transparent", style.color);
                };
                var bindAll = function(d, i, callback) {
                    return function() {
                        if (i ^ currentIndex) {
                            callback.call(d, arguments);
                        }
                    };
                };

                setStyle(dlist, { padding: "0", margin: "0"});
                setStyle(dtitle, { padding: "4px 0 4px 8px", backgroundColor: "#ddd"});

                dtitle.innerHTML = "Stats";

                dlist.appendChild(dtitle);

                list.forEach(function(d, i) {
                    ditem = document.createElement("dd");
                    setStyle(ditem, {
                        padding: "4px 0 4px 24px",
                        cursor: "pointer",
                        margin: 0,
                        borderBottom: "1px solid rgba(210,210,210,.5)"
                    });
                    ditem.innerHTML = d;
                    items.push(ditem);
                    dlist.appendChild(ditem);
                    !i && (addState.call(ditem, activeBackgroundColor, activeColor), currentIndex = i);
                });

                items.forEach(function(d, i) {
                    (function(d, i) {
                        d.addEventListener("mouseover", bindAll.call(d, d, i, onCurr), false);
                        d.addEventListener("mouseout", bindAll.call(d, d, i, onPrev), false);
                        d.addEventListener("click", bindAll.call(d, d, i, function() {
                            var prevItem;
                            if (prevItem = items[currentIndex]) {
                                onPrev.call(prevItem);
                            }
                            onCurr.call(this);
                            currentIndex = i;
                            toolbar.clicked.call(this, list[i]);
                        }), false);
                    })(d, i);
                });
                wrap.appendChild(dlist);
            },
            getContext: function() {
                return this.toolbar.context;
            },
            onClick: function(callback) {
                this.clicked = isFunction(callback) ? callback : function() {};
                return this;
            },
            draw: function() {

            },
            onExpand: function(callback) {
                var options = this.options;
                var closed = options.expand;
                var toolbar = this;

                this.toolbar.button.addEventListener("click", function() {
                    toolbar.expand(false);//closed = !closed);
                    callback && callback.call(toolbar, closed);
                }, false);
                return this;
            },
            expand: function(isExpand) {
                var toolbar = this.toolbar,
                    context = toolbar.context,
                    panel = toolbar.panel,
                    button = toolbar.button;

                if (isExpand) {
                    context.style.right = "0px";
                    context.style.transition = "right .1s linear";
                }
                else {
                    context.style.right = -(context.getBoundingClientRect().width) + "px";
                }
                panel && (panel.style.display = isExpand ? "block" : "none");
                //button.style.left = (isExpand ? 4 : -button.getBoundingClientRect().width) + "px";
            },
            setOptions: function(options){
                extend(this.options, options);
                return this;
            }
        };

        Chart.Toolbar = Toolbar;
    })(Chart);

    var Analysis = {
        MIN: function() {

        },
        MAX: function() {

        },
        SUM: function() {

        }
    };

    (function(Chart) {

        function Panel() {
            this.init.apply(this, arguments);
        }
        Panel.prototype = {
            init: function(canvas, options) {
                //var panelOptions = extend(this.options = extend({}, defaultOptions), options);
                //var style = panelOptions.style;
                this.options = options;
                

                var panel = document.createElement("div");
                setStyle(panel, {
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    right: 200 + "px",
                    backgroundColor: "#fff",
                    //color: style.color,
                    //border: "1px solid rgba(0, 0, 0, 0.15)"
                });

                canvas.appendChild(panel);

                this.series = options.series;
                this.canvas = canvas;
                this.panel = panel;

                this.draw();
            },
            draw: function(doInited) {
                var panel = this.panel,
                    series = this.series;
                var Renderer = {
                    line: function(g, x, y, w, h) {
                        g.beginPath();
                        g.fillStyle = "#f00";
                        g.fillRect(x, y, w, h);
                    }
                };

                var onReady = function(){
                    var g = this.context;
                    var yAxis;
                    var plot = this.getViewport().getPlot();
                    if((yAxis = this.yAxis).length && (yAxis = yAxis[0])) {
                        g.save();
                        this.series.forEach(function(series) {
                            var minValue = series.minValue;
                            var y = interpolate(minValue, yAxis.minValue, yAxis.maxValue, plot.height, 0) + plot.top;
                            if (series.selected !== false && series.shapes.length) {
                                Renderer.line(g, plot.left, y, plot.width, 1);
                                g.textBaseline = "bottom";
                                g.fillText(series.name + "(" + minValue + ")", plot.left, y);
                            }
                        });
                        g.restore();
                    }
                };

                if (doInited !== true) {
                    this.chart = Dalaba.Chart(panel, {
                        type: "line",
                        chart: {
                            animation: {enabled: false},
                            events: {
                                ready: function() {
                                    console.log(9);
                                    onReady.call(this);
                                }
                            }
                        },
                        title: {enabled: false},
                        legend: {enabled: false},
                        yAxis: { title: {enabled: false}},
                        series: series
                    });
                }
                else {
                    this.chart.setOptions({
                        chart: {
                            //animation: {enabled: false},
                            events: {
                                ready: function() {
                                    //console.log(90)
                                }
                            }
                        },
                        series: series
                    });
                }
            },
            setType: function(type) {
                this.onType = Analysis[type](this.series);
                return this;
            },
            setOptions: function(options){
                extend(this.options, options);
                return this;
            }
        };

        Chart.Panel = Panel;

    })(Chart);

})(typeof window !== "undefined" ? window : this, Dalaba);

(function(global, Dalaba) {

    var Chart = Dalaba.Chart;

    var extend = Dalaba.extend;

    function Dashboard() {
        this.init.apply(this, arguments);
    }
    Dashboard.prototype = {
        init: function(chart) {
            var options = chart.options,
                toolbarOptions = options.toolbar;
            var Toolbar = Dalaba.Chart.Toolbar;

            var toolbar = new Toolbar(
                chart.container,
                extend({series: options.series}, toolbarOptions)
            ).onExpand(function() {
                chart.globalEvent.disabled = true;
            }).onClick(function(type) {
                var min = Dalaba.stats.min(chart.series.map(function(d) {
                    return d.data;
                })[0]);
                panel.setType(type).draw(true);
            });
            var panel = new Dalaba.Chart.Panel(chart.container, {series: chart.series.map(function(series, i){
                return { selected: series.selected, data: options.series[i].data};
            })});
        }
    };
    Chart.Dashboard = Dashboard;
    
})(typeof window !== "undefined" ? window : this, Dalaba);