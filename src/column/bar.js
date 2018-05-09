(function (global) {

    function factoy (Column) {

        var Bar = function (canvas, options) {
            this.type = "bar";

            this.shapes = [];
            this.canvas = canvas;
            this.context = canvas.getContext("2d");

            this.init(options);
        };
        Bar.create = function (barProp, methods) {
            for (var p in methods) if (({}).hasOwnProperty.call(methods, p)) {
                (function (p) {
                    barProp[p] = function () {
                        methods[p].apply(this, arguments);
                    };
                })(p);
            }
        };

        var columnProp = Column.prototype,
            barProp = Bar.prototype;

        var methods = {
            init: columnProp.init,
            draw: columnProp.draw,
            redraw: columnProp.redraw,
            drawShape: columnProp.drawShape,
            drawState: columnProp.drawState,
            dataLabels: columnProp.dataLabels,
            onFrame: columnProp.onFrame
        };

        Bar.create(barProp, methods);
        Bar.prototype.constructor = Bar;

        extend(Bar.prototype, barProp, {
            reflow: function () {
                return columnProp.reflow.apply(this, arguments);
            },
            animateTo: function() {
                return columnProp.animateTo.apply(this, arguments);
            },
            getShape: function (x, y, shared) {
                var series = this.series,
                    length = series.length;
                var plotX, plotWidth;
                var shapes, shape, item, area,
                    first,
                    last;
                var ret = [];
                function reset(shapes){
                    shapes.forEach(function(item){
                        delete item.current;
                    });
                }
                var groups = partition(this.series, function (a, b) {
                    return a.panelIndex === b.panelIndex;
                });

                for (var k = 0; k < groups.length; k++) {
                    var group = groups[k];
                    var parent = extent(group);
                    first = parent[0];
                    last = parent[1];
                    for (var i = 0; i < groups[k].length; i++) if ((item = group[i]).selected !== false) {
                        plotX = item.plotX;
                        plotWidth = item.plotWidth;
                        reset(shapes = item.shapes);
                        for (var j = 0; j < shapes.length; j++) {
                            shape = shapes[j];
                            if (shape.isNULL) {
                                continue;
                            }
                            area = {x: shape.x0, y: shape.y0 - shape.margin, width: shape.x1, height: shape.y1 + shape.margin};
                            if (shared) {
                                area.y = first.shapes[j] ? first.shapes[j].y0 - shape.margin : 0;
                                area.x = plotX;
                                area.width = plotWidth + plotX;
                                area.height = last.shapes[j] ? last.shapes[j].y1 + shape.margin : 0;
                            }
                            if (Intersection.rect({x: x, y: y}, area)) {
                                ret.push({
                                    shape: shape,
                                    series: item
                                });
                                shape.current = j;
                                if (!shared) {
                                    return ret;
                                }
                                break;
                            }
                        }
                    }
                }
                return ret;
            }
        });
        return Bar;
    }

    return {
        deps: function() {
            return factoy.apply(global, [].slice.call(arguments, 0));
        }
    };
})(typeof window !== "undefined" ? window : this)