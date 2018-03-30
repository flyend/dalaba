(function() {

    var dragging = false;

    var draggable;

    var isClicking = true;

    var fetchData = function(chart, start, end){
        //setTimeout(function(){
            chart.series.forEach(function(item){
                item.start = start;
                item.end = end;
                item.shapes = item.addShape();
            });
            chart.draw();
        //}, 0);
    };

    var addTooltip = function() {
        
        var timer, moving = false;
        
        function clearBuffer(chart, x, y) {
            var tooltip = chart.tooltip;

            if (tooltip.context === chart.context) {
                chart.render("hover", {x: x, y: y});//no redraw
            }
            else {
                tooltip.context.clearRect(0, 0, chart.width, chart.height);
                if(chart.legend !== null && tooltip.context === chart.legend.context){
                    chart.legend.data.length && chart.legend.draw();
                }
            }
        }
        function axisTo(chart, x, y) {
            chart.colorAxis.forEach(function(axis) {
                if (axis.options.enabled !== false) {
                    axis.addTooltip(x, y);
                }
            });
            chart.yAxis.forEach(function(axis) {
                if(axis.options.plotLine){
                    axis.addTooltip(x, y);
                }
            });
            chart.xAxis.forEach(function(axis) {
                if(axis.options.plotLine){
                    axis.addTooltip(x, y);
                }
            });
        }

        var tooltipHide = function(chart, pos) {
            var tooltip = chart.tooltip;
            var options = chart.options,
                tooltipOptions = options.tooltip || {};
            var hideDelay = pack("number", tooltipOptions.hideDelay, 1000);
            var callback = function() {
                tooltip.hide();
                pos !== null && clearBuffer(chart, pos.x, pos.y);
            };
            if (hideDelay > 0) {
                timer && clearTimeout(timer);
                timer = setTimeout(function() {
                    !moving && callback();
                }, hideDelay);
            }
            else {
                !moving && callback();
            }
        };

        var tooltipMoved = function(chart, e) {
            var pos = Event.normalize(e, chart.container),
                x = pos.x,
                y = pos.y;
            var tooltip = chart.tooltip;

            chart.container.style.cursor = "default";
            
            tooltip.move(x, y, true);
            clearBuffer(chart, x, y);
            axisTo(chart, x, y);
        };

        var tooltipEnd = function(chart, e) {
            var tooltipOptions = chart.options.tooltip,
                tooltip = chart.tooltip,
                pos = Event.normalize(e, chart.canvas);
            if (tooltip !== null) {
                if (tooltipOptions.show === true) {
                    pos = tooltip.position();
                    pos !== null && tooltip.move(pos.x, pos.y);
                }
                else tooltipHide(chart, pos);
            }
        };

        var getAllCursor = function(chart, e) {
            var canvas = chart.canvas,
                pos = e && Event.normalize(e, canvas),
                cursor;
            if (pos) {
                chart.rangeSlider.forEach(function(slider) {
                    if(slider !== null){
                        cursor = slider.getCursor(pos.x, pos.y, e);
                        canvas.style.cursor = cursor !== null ? cursor : "default";
                    }
                });
            }
            else {
                canvas.style.cursor = "default";
            }
        };

        return {
            show: function(e, chart) {
                var tooltip = chart.tooltip,
                    tooltipOptions = chart.options.tooltip;
                if (tooltip) {
                    tooltipMoved(chart, e);
                    getAllCursor(chart, e);
                    moving = tooltip.itemLength !== 0;
                    
                    if (tooltipOptions.show === true) {
                        !moving && tooltipEnd(chart, e);
                    }
                    else {
                        tooltipEnd(chart, e);
                    }
                }
            },
            hide: function(e, chart) {
                //moving = false;
                chart.tooltip && tooltipEnd(chart, e);
                getAllCursor(chart);
            }
        };
    };

    var onClick = function(e, chart) {
        var options = chart.options;
        var pos = Event.normalize(e, chart.container);
        var x = pos.x,
            y = pos.y;
        var plotOptions, click;

        if(isClicking && chart.globalAnimation.isReady === true){
            chart.charts.forEach(function(item){
                var shapes = [];
                item.series.forEach(function(series){
                    shapes = [];
                    plotOptions = (options.plotOptions || {})[series.type] || {};
                    click = (click = (click = series.events || {}).click || (plotOptions.events || {}).click);
                    if (isFunction(click)) {
                        shapes = (item.getShape && item.getShape(x, y)) || [];
                        plotOptions = (options.plotOptions || {})[item.type] || {};
                        shapes.forEach(function(item){
                            var shape = item.shape;
                            click = (click = (item.series.events || {}).click || (plotOptions.events || {}).click);
                            click && click.call({
                                x: shape.key,
                                value: shape.value,
                                color: shape.color,
                                key: shape.key,
                                point: shape,
                                total: shape.total,
                                percentage: shape.percentage,
                                series: item.series
                            }, shape, item.series, e, x, y);
                        });
                    }
                });
                shapes = (item.getShape && item.getShape(x, y)) || [];
                if(shapes.length && item.setSliced){
                    item.setSliced(shapes);
                    chart.render("click");
                }
            });
            chart.toolbar && chart.toolbar.onClick && chart.toolbar.onClick.call(chart.container, e);
        }
    };

    var onStart = function(e, chart){
        draggable = Event.draggable();
        var panel = chart.panel;
        var sx, sy;
        draggable.start(this, e);
        sx = draggable.getX(), sy = draggable.getY();
        dragging = true;
        isClicking = true;
        
        chart.rangeSlider.forEach(function(slider, i){
            var pane = panel[Math.min(panel.length - 1, slider.panelIndex | 0)];
            var rangeSelector = chart.rangeSelector[i];
            rangeSelector.maxWidth = pane.plotWidth * (1 + (1 - (rangeSelector.to - rangeSelector.from) / 100));
            rangeSelector.dragging = slider.getTarget(sx, sy) === -1 && Intersection.rect(
                {x: sx, y: sy},
                {x: pane.plotX, y: pane.plotY, width: pane.plotX + pane.plotWidth, height: pane.plotY + pane.plotHeight}
            ) && 1;//no rangeSelector;
            slider && slider.onStart(0, 0, e);
        });
        chart.charts.forEach(function(item){
            isFunction(item.onStart) && item.onStart();
        });
        document.addEventListener("mousemove", chart.globalEvent.drag, false);
    };

    var onDrag = function(e, chart){
        var container = this;
        var dx, dy, dir;

        if(!dragging) return;
        
        draggable.drag(container, e);
        dx = draggable.getX();
        dy = draggable.getY();

        isClicking = 0.1 * 0.1 - dx * dx - dy * dy > 0.001;
        
        chart.globalEvent.isDragging = true;
        chart.series.forEach(function(series) {
            if(series.type === "sankey" || series.type === "node") {
                chart.globalEvent.isDragging = false;
            }
        });
        
        chart.rangeSlider.forEach(function(slider, i) {
            var rangeSelector = chart.rangeSelector[i],
                p = Event.normalize(e, container);
            //drag plot
            if (rangeSelector.dragging) {
                dir = draggable.normalize();
                var dm = Math.max(0, Math.min(1, (Math.abs(dx)) / rangeSelector.maxWidth)) * 100;
                var v = dir.x > 0 || -1;
                var start = rangeSelector._start - dm * v,
                    end = rangeSelector._end - dm * v;
                //console.log(dm)
                var t = end - start;
                if (dir.x > 0) {
                    start = Math.max(0, start);
                    end = Math.max(t, end);
                }
                else {
                    //left
                    end = Math.min(100, end);
                    start = Math.min(100 - t, start);
                }
                rangeSelector.from = start;
                rangeSelector.to = end;
                slider && slider.startToEnd(start + "%", end + "%");
                
                chart.globalEvent.isDragging = chart.globalEvent.isDragging || !chart.globalEvent.isDragging;
                fetchData(chart, start, end);
            }
            slider && slider.onDrag(p.x, p.y, function(sv, ev, start, end){
                chart.globalEvent.isDragging = chart.globalEvent.isDragging || !chart.globalEvent.isDragging;
                rangeSelector.from = parseFloat(start, 10);
                rangeSelector.to = parseFloat(end, 10);
                fetchData(chart, start, end);
            });
        });
        chart.charts.forEach(function(item){
            if(isFunction(item.onDrag)){
                //chart.globalEvent.isDragging = false;
                item.onDrag(dx, dy, e);
            }
        });
        if(!chart.globalEvent.isDragging){
            chart.render("drag");//not dragging
        }
    };

    var onDrop = function(e, chart){
        chart.rangeSlider.forEach(function(slider, i){
            var rangeSelector = chart.rangeSelector[i];
            rangeSelector._start = rangeSelector.from;
            rangeSelector._end = rangeSelector.to;
            slider && slider.onDrop(0, 0, function(){
                //var start = this.start, end = this.end;
            });
        });
        chart.charts.forEach(function(item){
            isFunction(item.onDrop) && item.onDrop();
        });
        chart.globalEvent.isDragging = false;
        dragging = false;
        document.removeEventListener("mousemove", chart.globalEvent.drag, false);
    };

    var onZoom = function(chart){
        var getZoom = function(e){
            var deltaX, deltaY, delta;
            var vector;
            var scale = {};
            if(hasTouch){
                vector = e.originEvent.vector;
                scale.disabled = false;
                scale.length = vector.length;
                scale.scale = vector.scale;
            }
            else{
                deltaX = -e.wheelDeltaX;
                deltaY = pack("number", -e.detail, e.wheelDelta, e.wheelDeltaY, 0);
                delta = deltaY === 0 ? deltaX : deltaY;
                delta = deltaY = pack("number", -e.deltaY, deltaY);
                deltaX = pack("number", e.deltaX, deltaX);
                deltaY === 0 && (delta === -deltaX);
                if(deltaY === 0 && deltaX === 0){
                    scale.disabled = true;
                    return scale;
                }
                delta = Math.max(-1, Math.min(1, delta));
                scale.length = delta;
                scale.scale = Math.exp(delta * 0.2);
            }
            return scale;
        };
        return function(e){
            var viewport = chart.getViewport().plot,
                x = Event.normalize(e, this),
                y = x.y;
            x = x.x;
            if(Intersection.rect(
                {x: x, y: y},
                {x: viewport.left, y: viewport.top, width: viewport.left + viewport.width, height: viewport.top + viewport.height}
            )){
                var scale = getZoom(e);
                if(scale.disabled)
                    return;
                chart.rangeSlider.forEach(function(slider, i){
                    var rangeSelector = chart.rangeSelector[i];
                    var from = rangeSelector.from,
                        to = rangeSelector.to;
                    var r = Math.max(1 - from / to || 0, 0.1);
                    var v = (scale.length > 0 ? from < to | 0 : -1) * scale.scale * r;
                        v || (from = to);
                    
                    from = Math.max(0, from += v);
                    to = Math.min(100, to -= v);
                    rangeSelector.from = rangeSelector._start = from;
                    rangeSelector.to = rangeSelector._end = to;
                    
                        
                    slider && slider.startToEnd(from + "%", to + "%");
                });
                var rangeSelector = chart.rangeSelector;
                if(rangeSelector.length && rangeSelector[0].from !== rangeSelector[0].to){
                    fetchData(chart, rangeSelector[0].from, rangeSelector[0].to);
                    e.preventDefault && e.preventDefault();
                }
            }
        };
    };

    var onResize = function(e, chart){
        var timer;
        var width = chart.getSize(chart.renderer),
            height = width.height;
        width = width.width;
        
        if(chart.globalAnimation.isReady === true){
            timer && clearTimeout(timer);
            timer = setTimeout(function(){
                chart.setSize(width, height, false);
            }, 100);
        }
    };

    var onVisible = function(){
        function visible(){
        }
        (document.hidden || document.webkitHidden) && visible();
    };

    function factory(Dalaba, Event){

        function bindAll(chart, removed) {
            var container = chart.container;
            var globalEvent = chart.globalEvent;
            var type = removed ? "removeEventListener" : "addEventListener",
                useCapture = false;

            var events = {
                click: globalEvent.click,
                mousemove: globalEvent.mousemove,
                mouseout: globalEvent.mouseout,
                mousedown: globalEvent.start,
                mouseup: {el: document, listener: globalEvent.drop},
                mousewheel: globalEvent.zoom,
                DOMMouseScroll: globalEvent.zoom,
                resize: {el: window, listener: globalEvent.resize},
                visibilitychange: {el: document, listener: globalEvent.visible},
                webkitvisibilitychange: {el: document, listener: globalEvent.visible}
            }, event;
            for(var p in events) if(event = events[p], events.hasOwnProperty(p))
                (event.el || container)[type](p, event.listener || event, useCapture);

            container[type]("mousemove", globalEvent.drag, useCapture);
        }

        function event(chart) {
            var tooltip = addTooltip();

            var hasAnimateReady = function(chart) {
                return chart.globalAnimation.isReady === true;
            };
            var hasDragging = function(chart) {
                return !chart.globalEvent.isDragging;
            };
            var hasEventDisabled = function(chart) {
                return chart.globalEvent.disabled !== true;
            };

            //dnd
            chart.rangeSelector.forEach(function(selector) {
                selector._start = selector.from = pack("number", parseFloat(selector.start, 10), 0);
                selector._end = selector.to = pack("number", parseFloat(selector.end, 10), 100);
            });
            (function(chart) {
                var container = chart.container;
                var globalEvent = chart.globalEvent;

                extend(globalEvent, {
                    click: function(e) {
                        hasEventDisabled(chart) && onClick.call(this, e, chart);
                    },
                    mousemove: function(e) {
                        hasAnimateReady(chart) & hasEventDisabled(chart) & hasDragging(chart) && tooltip.show.call(this, e, chart);
                    },
                    mouseout: function(e) {
                        hasEventDisabled(chart) && tooltip.hide.call(this, e, chart);
                    },
                    start: function(e) {
                        hasEventDisabled(chart) && onStart.call(container, e, chart);
                    },
                    drop: function(e) {
                        hasEventDisabled(chart) && onDrop.call(document, e, chart);
                    },
                    drag: function(e) {
                        hasEventDisabled(chart) && onDrag.call(container, e, chart);
                    },
                    zoom: function(e) {
                        var zoom = onZoom(chart);
                        hasEventDisabled(chart) && zoom.call(container, e);
                    },
                    resize: function(e) {
                        var options = chart.options;
                        var width = options.chart.width,
                            height = options.chart.height;
                        width = Math.max(1, width), height = Math.max(1, height);
                        options.chart.reflow !== false & (!isNumber(width, true) | !isNumber(height, true)) & hasAnimateReady(chart) & onResize.call(window, e, chart);
                    },
                    visible: function(e){
                        globalEvent.disabled !== true && onVisible.call(document, e, chart);
                    }
                });

                var touchSwipe = function(e, touch) {
                    if (touch.status === "start") {
                        onStart.call(this, e, chart);
                    }
                    else if (touch.status === "move") {
                        onDrag.call(this, e, chart);
                        globalEvent.isDragging = false;
                        globalEvent.mousemove && globalEvent.mousemove.call(this, e, chart);
                    }
                    else if (touch.status === "end") {
                        onDrop.call(document, e, chart);
                        globalEvent.mouseout && globalEvent.mouseout.call(this, e, chart);
                    }
                };

                var touchPress = function(e, touch) {
                    globalEvent = chart.globalEvent;
                    onStart.call(this, e, chart);
                    globalEvent.mousemove && globalEvent.mousemove.call(this, e, chart);
                    if(touch.status === "end"){
                        globalEvent.mouseout.call(this, e, chart);
                    }
                };
                var touchTap = function(e) {
                    globalEvent.click.call(this, e, chart);
                };

                Event.hasTouch ? new Dalaba.Touch(container).on({
                    tap: touchTap,
                    press: touchPress,
                    swipe: touchSwipe,
                    pinch: function(e) {
                        globalEvent.zoom.call(this, e, chart);
                    }
                }) : bindAll(chart);
            })(chart);
        }
        event.destroy = function (chart) {
            var container = chart.container;
            if (container) {
                Event.hasTouch ? new Dalaba.Touch(container).free() : bindAll(chart, true);
            }
        };

        return event;
    }


    return {
        deps: function() {
            var args = Array.prototype.slice.call(arguments, 0);
            return factory.apply(global, [].concat(args));
        }
    };
})(typeof window !== "undefined" ? window : this)