(function(global, Dalaba) {    
    var Chart = Dalaba.Chart;

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

    function setStyle(el, attr) {
        for(var p in attr) if(attr.hasOwnProperty(p)){
            el.style[p.replace(/\-(\w)/g, function(all, s){
                return s.toUpperCase();
            })] = attr[p];
        }
    }

    function Toolbar() {
        this.init.apply(this, arguments);
    }
    Toolbar.prototype = {
        init: function(canvas, options) {
            var toolbarOptions = extend(this.options = extend({}, defaultOptions), options);
            this.canvas = canvas;

            var bar = document.createElement("div");
            var width = pack("number", options.width, 200);

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
        addPanel: function() {
            var canvas = this.canvas,
                options = this.options,
                style = options.style || {},
                series = options.series,
                toolbar = this.toolbar;
            var panel = toolbar.panel,
                form,
                legend;
            if (!panel) {
                toolbar.panel = panel = document.createElement("div");
                canvas.appendChild(panel);
                setStyle(panel, {
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    right: options.width + "px",
                    backgroundColor: "#fff",
                    color: style.color,
                    //border: "1px solid rgba(0, 0, 0, 0.15)"
                });

                var onReady = function(){
                    var g = this.context;
                    var series = this.series[0],
                        shape = series.shapes[0];
                    var minValue = series.minValue;
                    var interpolate = Dalaba.Numeric.interpolate;
                    var yAxis = this.yAxis[0];
                    var plot = this.getViewport().getPlot();
                    if(series.selected !== false && shape) {
                        var y = interpolate(minValue, yAxis.minValue, yAxis.maxValue, plot.height, 0) + plot.top;
                        g.save();
                        g.beginPath();
                        g.fillStyle = "#f00";
                        g.fillRect(plot.left, y, plot.width, 1);
                        g.textBaseline = "bottom";
                        g.fillText(series.name + "(" + minValue + ")", plot.left, y);
                        g.restore();
                    }
                };

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
                /*this.chart.setOptions({
                    chart: {
                        //animation: {enabled: false},
                        events: {
                            ready: function() {
                                //console.log(90)
                            }
                        }
                    }
                });*/
            }
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

            list.forEach(function(d) {
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
                        toolbar.addPanel();
                        toolbar.clicked.call(this);
                    }), false);
                })(d, i);
            });
            wrap.appendChild(dlist);
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
                toolbar.expand(closed = !closed);
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
            button.style.left = (isExpand ? 4 : -button.getBoundingClientRect().width) + "px";
        },
        setOptions: function(options){
            extend(this.options, options);
            return this;
        }
    };

    Chart.Toolbar = Toolbar;

})(typeof window !== "undefined" ? window : this, Dalaba);