(function () {
    function factoy (Dalaba, Line) {
        var extend = Dalaba.extend,
            pack = Dalaba.pack,
            arrayFilter = Dalaba.Cluster.List.filter;

        function Area (canvas, options) {
            this.canvas = canvas;
            this.context = canvas.getContext("2d");
            this.type = "area";

            this.init(options);
        }
        extend(Area.prototype, Line.prototype, {
            constructor: Area,
            init: function (options) {
                this.series = arrayFilter(pack("array", options.series, []), function(series){
                    return series.type === "area";
                });
                Line.prototype.init.call(this, options);
            },
            draw: function (initialize) {
                var context = this.context,
                    chart = this;
                if (initialize === true) {
                    this.series.forEach(function (series) {
                        var shapes = series.shapes;
                        series._image && Clip[series.inverted ? "Vertical" : "Horizontal"](series._image, 0, 0, series._image.width, series._image.height).clip(context, pack("number", shapes[0].timer, 1));
                    });
                }
                else {
                    this.series.forEach(function(series){
                        var shapes = series.shapes;
                        Renderer.area(context, shapes, series);
                        Renderer.line(context, shapes, series, {
                            y: "y"
                        });
                    });
                    this.series.forEach(function (series) {
                        series.shapes.forEach(function(shape){
                            DataLabels.render(context, shape, series);//draw data labels
                        });
                    });
                    this.series.forEach(function (series) {
                        series.shapes.forEach(function (shape) {
                            chart.drawMarker(context, shape, series, "y");//draw marker
                            Renderer.hover(context, shape, series, "y");//hover points
                        });
                    });
                }
            },
            redraw: function () {
                Line.prototype.redraw.apply(this, arguments);
            }
        });
        return Area;
    }

    return {
        deps: function () {
            return factoy.apply(global, [].slice.call(arguments));
        }
    };
})()