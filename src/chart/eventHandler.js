(function () {

    var dragging = false;

    var draggable;

    var isClicking = true;

    var fetchData = function (event, chart, start, end) {
        chart.series.forEach(function (series) {
            series.start = start;
            series.end = end;
            series._shapes = series.shapes;
            series.shapes = series.addShape();
        });
        chart.draw(event);
    };

    var addTooltip = function () {
        var timer, moving = false;
        var prevMoving = false;
        
        function clearBuffer (chart, event) {
            chart.render(event);//no redraw
        }
        function axisTo (chart, x, y) {
            chart.colorAxis.forEach(function (axis) {
                if (axis.options.enabled !== false) {
                    axis.addTooltip(x, y);
                }
            });
            chart.yAxis.forEach(function (axis) {
                if (axis.options.plotLine) {
                    axis.addTooltip(x, y);
                }
            });
            chart.xAxis.forEach(function (axis) {
                if (axis.options.plotLine) {
                    axis.addTooltip(x, y);
                }
            });
        }

        var tooltipHide = function (chart, e, pos) {
            var options = chart.options,
                panels = chart.panel;
            var tooltipOptions = options.tooltip || {},
                hideDelay = pack("number", tooltipOptions.hideDelay, 1000);

            var callback = function () {
                panels.forEach(function (pane) {
                    //defined(pane.tooltip) && pane.tooltip.aaa === 0 && pane.tooltip.hide();
                    if (pane.tooltip) {
                        pane.tooltip.hide();
                    }
                });
                pos !== null && clearBuffer(chart, extend({}, e, {moveX: pos.x, moveY: pos.y, type: "mousemove"}));
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

        var tooltipFilter = function (x, y, data, ret) {
            var n = data.length,
                i = 0;
            var d, insides = [];
            for (; i < n; i++) if (defined(d = data[i])) {
                defined(d.tooltip) && Intersection.rect({
                    x: x, y: y
                }, {
                    x: d.x, y: d.y,
                    width: d.x + d.width, height: d.y + d.height
                }) ? insides.push(d) : ret.push(d);
            }
            return insides;
        };

        var tooltipMoved = function (chart, e, layoutLinked, pos, isShow, tooltipOptions) {
            var x = pos.x,
                y = pos.y;
            var linked = layoutLinked; //matrix(layoutLinked);
            var panels, curPanel = tooltipFilter(x, y, chart.panel, panels = [])[0];
            var event;
            var points = [];

            var item = chart.getShape(chart.charts, x, y, tooltipOptions.shared);
            item.forEach(function (shape) {
                points.push(shape.shape);
            });
            moving = item.length !== 0;
            chart.canvas.style.cursor = moving ? "pointer" : "default";
            //tooltip enabled = false
            if (defined(curPanel)) {
                var shape;
                var curIndex;
                item = curPanel.tooltip.move(x, y, true);
                if ((item = item[0]) && linked === true  && panels.length) {// if exists link to panel
                    curIndex = item.shape.index;
                    panels.forEach(function (pane) {
                        var shapes = pane.series;
                        if (shapes.length && (shapes = shapes[0].shapes) && isNumber(curIndex, true) && defined(shapes = shapes[curIndex])) {
                            pane.tooltip.move(shapes.x, shapes.y, true);
                        }
                    });
                }
            }
            if (!linked) {
                chart.panel.forEach(function (pane) {
                    var tooltip = pane.tooltip;
                    if (tooltip && !Intersection.rect({
                            x: x, y: y
                        }, {
                            x: pane.x, y: pane.y,
                            width: pane.x + pane.width, height: pane.y + pane.height
                        })) {

                        if (!isShow)
                            tooltip.hide();
                    }
                });
            }
            event = extend({}, e, {
                shapes: points,
                points: points,
                moveX: x,
                moveY: y
            });
            
            clearBuffer(chart, event);
            axisTo(chart, x, y);
            if (!moving && prevMoving) {
                tooltipHide(chart, e, pos);
            }
            prevMoving = moving;
        };

        var tooltipEnd = function (chart, e) {
            var tooltipOptions = chart.options.tooltip,
                pos = Event.normalize(e, chart.canvas);
            if (tooltipOptions.show === true) {
                chart.panel.forEach(function (pane) {
                    var tooltip, xy;
                    if ((tooltip = pane.tooltip) && (xy = tooltip.position())) {
                        tooltip.move(xy.x, xy.y);
                    }
                });
                tooltipMoved(chart, e, (chart.options.layout || {}).linked, pos, tooltipOptions.show, tooltipOptions);
            }
            else tooltipHide(chart, e, pos);
        };

        var getAllCursor = function (chart, pos) {
            var canvas = chart.canvas,
                cursor;
            if (pos) {
                chart.rangeSlider.forEach(function (slider) {
                    if(slider !== null){
                        cursor = slider.getCursor(pos.x, pos.y);
                        canvas.style.cursor = cursor !== null ? cursor : "default";
                    }
                });
            }
            else {
                canvas.style.cursor = "default";
            }
        };

        return {
            show: function (e, chart) {
                var tooltipOptions = chart.options.tooltip,
                    layoutLinked = (chart.options.layout || {}).linked;
                var pos = Event.normalize(e, chart.container);

                tooltipMoved(chart, e, layoutLinked, pos, tooltipOptions.show, tooltipOptions);
                getAllCursor(chart, pos);
            },
            hide: function (e, chart) {
                moving = false;
                tooltipEnd(chart, e);
                getAllCursor(chart);
                chart.canvas.style.cursor = "default";
            }
        };
    };

    var onClick = function (e, chart, selector) {
        var options = chart.options,
            chartOptions = options.chart || {},
            plotOptions = options.plotOptions || {};
        var pos = Event.normalize(e, chart.container);
        var x = pos.x,
            y = pos.y;
        var globalClick = (chartOptions.events || {}).click,
            click,
            event;
        var points = [];
        var graphics = chart.charts,
            graphic,
            series,
            plotPoint,
            point;
        var isSliced = false;
        var i, j;
        var callbacks = [];
        var useHTML = false;

        while (i = selector.pop()) delete i.selected;

        if (isClicking && chart.globalAnimation.isReady === true) {
            click = ((plotOptions.point || {}).events || plotOptions.events || {}).click;
            for (i = 0; i < graphics.length; i++) {
                graphic = graphics[i];
                for (j = 0; j < graphics[i].series.length; j++) if ((series = graphic.series[j]).selected !== false) {
                    plotPoint = (plotOptions[series.type] || {}).point || {};
                    points = graphic.getShape && graphic.getShape(x, y);
                    useHTML = (series.dataLabels || {}).useHTML === true;
                    if (points && points.length || useHTML) {
                        click = (series.events || {}).click || (plotPoint.events || {}).click;
                        //if (series.clicked !== false) {
                        callbacks.push([
                            (!!points.length || useHTML) && isFunction(click),
                            points.map(function (shape) { return shape.shape; }),
                            click
                        ]);
                    }
                }
            }
            graphics.forEach(function (graphic) {
                var shapes = (graphic.getShape && graphic.getShape(x, y)) || [];
                shapes.forEach(function (shape) {
                    shape.shape.selected = true;
                    selector.push(shape.shape);
                    points.push(shape.shape);
                });
                if (shapes.length && graphic.setSliced) {
                    graphic.setSliced(shapes);
                    isSliced = true;
                }
            });
            event = extend({}, e, { moveX: x, moveY: y });
            for (i = 0; i < callbacks.length; i++) if (graphic = callbacks[i]) {
                event.shapes = graphic[1], event.points = graphic[1];
                (point = graphic[1][0]) && (point.point = graphic[1][0]);
                graphic[0] && graphic[2].call(graphic[1].length === 1  ? (point || {}) : graphic[1], event);
            }
            if (globalClick || isSliced) {
                globalClick && globalClick.call(points, extend({}, e, { points: points, shapes: points, moveX: x, moveY: y }));
            }
            chart.render(event);
            chart.toolbar && chart.toolbar.onClick && chart.toolbar.onClick.call(chart.container, e);
        }
    };

    var onStart = function (e, chart) {
        draggable = Event.draggable();
        var panel = chart.panel;
        var sx, sy;
        draggable.start(this, e);
        sx = draggable.getX(), sy = draggable.getY();
        dragging = e.buttons === 1;
        isClicking = true;
        
        chart.rangeSlider.forEach(function (slider, i) {
            var pane = panel[mathMin(panel.length - 1, slider.panelIndex | 0)];
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

    var onDrag = function (e, chart) {
        var container = this;
        var dx, dy, dir;

        if(!dragging) return;
        
        draggable.drag(container, e);
        dx = draggable.getX();
        dy = draggable.getY();

        isClicking = 0.1 * 0.1 - dx * dx - dy * dy > 0.001;
        
        chart.globalEvent.isDragging = true;
        chart.series.forEach(function (series) {
            if (series.type === "sankey") {
                chart.globalEvent.isDragging = false;
            }
        });
        
        chart.rangeSlider.forEach(function (slider, i) {
            var rangeSelector = chart.rangeSelector[i],
                p = Event.normalize(e, container);
            //drag plot
            if (rangeSelector.dragging) {
                dir = draggable.normalize();
                var dm = Math.max(0, Math.min(1, (Math.abs(dx)) / rangeSelector.maxWidth)) * 100;
                var v = dir.x > 0 || -1;
                var start = rangeSelector._start - dm * v,
                    end = rangeSelector._end - dm * v;
                var t = end - start;
                if (dir.x > 0) {
                    start = mathMax(0, start);
                    end = mathMax(t, end);
                }
                else {
                    //left
                    end = mathMin(100, end);
                    start = mathMin(100 - t, start);
                }
                rangeSelector.from = start;
                rangeSelector.to = end;
                slider && slider.startToEnd(start + "%", end + "%");
                
                chart.globalEvent.isDragging = false;// chart.globalEvent.isDragging || !chart.globalEvent.isDragging;
                if (chart.charts.length) {
                    fetchData(e, chart, start, end);
                }
            }
            slider && slider.onDrag(p.x, p.y, function (sv, ev, start, end) {
                chart.globalEvent.isDragging = false;//chart.globalEvent.isDragging || chart.globalEvent.isDragging;
                rangeSelector.from = parseFloat(start, 10);
                rangeSelector.to = parseFloat(end, 10);
                if (chart.charts.length) {
                    fetchData(e, chart, start, end);
                }
            });
        });
        chart.charts.forEach(function (item) {
            if (isFunction(item.onDrag)) {
                //chart.globalEvent.isDragging = false;
                item.onDrag(dx, dy, e);
            }
        });
        if (!chart.globalEvent.isDragging) {
            chart.render(e);//not dragging
        }
    };

    var onDrop = function (e, chart) {
        chart.rangeSlider.forEach(function (slider, i) {
            var rangeSelector = chart.rangeSelector[i];
            rangeSelector._start = rangeSelector.from;
            rangeSelector._end = rangeSelector.to;
            slider && slider.onDrop(0, 0, function () {
                //var start = this.start, end = this.end;
            });
        });
        chart.charts.forEach(function (item) {
            isFunction(item.onDrop) && item.onDrop();
        });
        chart.globalEvent.isDragging = false;
        dragging = false;
        document.removeEventListener("mousemove", chart.globalEvent.drag, false);
    };

    var onZoom = function (chart) {
        var options = chart.options,
            chartOptions = options.chart || {};
        var getZoom = function (e) {
            var deltaX, deltaY, delta;
            var vector;
            var scale = {};
            if (hasTouch) {
                vector = e.originEvent.vector;
                scale.disabled = false;
                scale.length = vector.length;
                scale.scale = vector.scale;
            }
            else {
                deltaX = -e.wheelDeltaX;
                deltaY = pack("number", -e.detail, e.wheelDelta, e.wheelDeltaY, 0);
                delta = deltaY === 0 ? deltaX : deltaY;
                delta = deltaY = pack("number", -e.deltaY, deltaY);
                deltaX = pack("number", e.deltaX, deltaX);
                deltaY === 0 && (delta = -deltaX);
                if (deltaY === 0 && deltaX === 0) {
                    scale.disabled = true;
                    return scale;
                }
                delta = Math.max(-1, Math.min(1, delta));
                scale.length = delta;
                scale.scale = Math.exp(delta * 0.2);
            }
            return scale;
        };
        return function (e) {
            var viewport = chart.getViewport().plot,
                x = Event.normalize(e, this),
                y = x.y;
            x = x.x;
            e.preventDefault && e.preventDefault();
            if (Intersection.rect(
                {x: x, y: y},
                {x: viewport.left, y: viewport.top, width: viewport.left + viewport.width, height: viewport.top + viewport.height}
            )) {
                var scale = getZoom(e);
                if (scale.disabled)
                    return;
                chart.rangeSlider.forEach(function (slider, i) {
                    var options = slider.options,
                        zoomRatio = options.zoomRatio,
                        events = options.events;
                    var rangeSelector = chart.rangeSelector[i];
                    var from = rangeSelector.from,
                        to = rangeSelector.to;
                    if (!defined(events) || (defined(events) && isFunction(events.zoom))) {
                        var ratio = pack("number",
                            zoomRatio,
                            isFunction(zoomRatio) && zoomRatio.call(slider, e, scale.length),
                            Math.max(1 - from / to || 0, 0.1)
                        );
                        var v = (scale.length > 0 ? from < to | 0 : -1) * scale.scale * ratio;
                            v || (from = to);
                        
                        from = Math.max(0, from += v);
                        to = Math.min(100, to -= v);
                        rangeSelector.from = rangeSelector._start = from;
                        rangeSelector.to = rangeSelector._end = to;

                        slider && slider.startToEnd(from + "%", to + "%");
                    }
                    events && isFunction(events.zoom) && events.zoom.call(slider, e);
                });
                var rangeSelector = chart.rangeSelector;
                if (rangeSelector.length && rangeSelector[0].from !== rangeSelector[0].to) {
                    if (chart.charts.length) {
                        fetchData(e, chart, rangeSelector[0].from, rangeSelector[0].to);
                    }
                }
                if (chartOptions.events && isFunction(chartOptions.events.zoom)) {
                    e.delta = scale.length;
                    chartOptions.events.zoom.call(null, e);
                }
                !chart.charts.length && chart.render(e);
            }
        };
    };

    var onResize = function (e, chart) {
        var timer;
        var width, height;
        if (chart.renderer && chart.globalAnimation.isReady === true) {
            timer && clearTimeout(timer);
            timer = setTimeout(function () {
                height = (width = chart.getSize(chart.renderer)).height;
                chart.setSize(width.width, height, e);
            }, 100);
        }
    };

    var onVisible = function () {
        function visible () {
        }
        (document.hidden || document.webkitHidden) && visible();
    };

    function factory (Dalaba, Event) {

        function bindAll (chart, removed) {
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
            for (var p in events) if (event = events[p], events.hasOwnProperty(p)) {
                (event.el || container)[type](p, event.listener || event, useCapture);
            }

            //container[type]("mousemove", globalEvent.drag, useCapture);
        }

        function event (chart) {
            var tooltip = addTooltip();

            var hasAnimateReady = function (chart) {
                return chart.globalAnimation.isReady === true;
            };
            var hasDragging = function (chart) {
                return !chart.globalEvent.isDragging;
            };
            var hasEventDisabled = function (chart) {
                return chart.globalEvent.disabled !== true;
            };

            //dnd
            chart.rangeSelector.forEach(function (selector) {
                selector._start = selector.from = pack("number", parseFloat(selector.start, 10), 0);
                selector._end = selector.to = pack("number", parseFloat(selector.end, 10), 100);
            });
            (function (chart) {
                var container = chart.container;
                var globalEvent = chart.globalEvent;
                var selectedPoints = [];

                extend(globalEvent, {
                    click: function (e) {
                        hasEventDisabled(chart) && onClick.call(this, e, chart, selectedPoints);
                    },
                    mousemove: function (e) {
                        hasAnimateReady(chart) & hasEventDisabled(chart) & hasDragging(chart) && tooltip.show.call(this, e, chart);
                    },
                    mouseout: function (e) {
                        hasEventDisabled(chart) && tooltip.hide.call(this, e, chart);
                    },
                    start: function (e) {
                        hasEventDisabled(chart) && onStart.call(container, e, chart);
                    },
                    drop: function (e) {
                        hasEventDisabled(chart) && onDrop.call(document, e, chart);
                    },
                    drag: function (e) {
                        hasEventDisabled(chart) && onDrag.call(container, e, chart);
                    },
                    zoom: function (e) {
                        var zoom = onZoom(chart);
                        hasEventDisabled(chart) && zoom.call(container, e);
                    },
                    resize: function (e) {
                        var options = chart.options;
                        var width = options.chart.width,
                            height = options.chart.height;
                        width = Math.max(1, width), height = Math.max(1, height);
                        options.chart.reflow !== false & (!isNumber(width, true) | !isNumber(height, true)) & hasAnimateReady(chart) & onResize.call(window, e, chart);
                    },
                    visible: function (e) {
                        globalEvent.disabled !== true && onVisible.call(document, e, chart);
                    }
                });

                var touchSwipe = function (e, touch) {
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

                var touchPress = function (e, touch) {
                    globalEvent = chart.globalEvent;
                    onStart.call(this, e, chart);
                    globalEvent.mousemove && globalEvent.mousemove.call(this, e, chart);
                    if(touch.status === "end"){
                        globalEvent.mouseout.call(this, e, chart);
                    }
                };
                var touchTap = function (e) {
                    globalEvent.click.call(this, e, chart);
                };

                Event.hasTouch ? new Dalaba.Touch(container).on({
                    tap: touchTap,
                    press: touchPress,
                    swipe: touchSwipe,
                    pinch: function (e) {
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
        deps: function () {
            return factory.apply(global, [].slice.call(arguments));
        }
    };
})(typeof window !== "undefined" ? window : this)