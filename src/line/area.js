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
            init: function(options) {
                this.series = arrayFilter(pack("array", options.series, []), function(series){
                    return series.type === "area";
                });
                Line.prototype.init.call(this, options);
            },
            draw: function() {
                var context = this.context,
                    chart = this;
                this.series.forEach(function(series){
                    var shapes = series.shapes;
                    Renderer.area(context, shapes, series);
                    Renderer.line(context, shapes, series, {
                        y: "y"
                    });

                    shapes.forEach(function(shape){
                        chart.drawMarker(context, shape, series, "y");//draw marker
                        DataLabels.render(context, shape, series);//draw data labels
                        Renderer.hover(context, shape, series, "y");//hover points
                    });
                });
            },
            redraw: function(){
                Line.prototype.redraw.apply(this, arguments);
            }
        });
        return Area;
    }

    return {
        deps: function() {
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
})()