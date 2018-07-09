(function () {
    function factoy (Dalaba, AreaSpline) {
        
        function AreaRange (canvas, options) {
            this.canvas = canvas;
            this.context = canvas.getContext("2d");
            this.type = "arearange";

            this.init(options);
        }
        extend(AreaRange.prototype, AreaSpline.prototype, {
            init: function (options) {
                Area.prototype.init.call(this, options);
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
                    this.series.forEach(function (series) {
                        var shapes = series.shapes;
                        if (series.animationEnabled && (!series.animationCompleted || series.selected !== false)) {
                            Renderer.area(context, shapes, series);
                            Renderer.line(context, shapes, series, {
                                y: "highY"
                            });                    
                            Renderer.line(context, shapes, series, {
                                y: "y"
                            });//draw line
                        }
                    });
                    this.series.forEach(function (series) {
                        if (series.animationEnabled && (!series.animationCompleted || series.selected !== false)) {
                            series.shapes.forEach(function (shape) {
                                DataLabels.render(context, shape.dataLabel, series);
                            });
                        }
                    });
                    this.series.forEach(function (series) {
                        if (series.animationEnabled && (!series.animationCompleted || series.selected !== false)) {
                            series.shapes.forEach(function (shape) {
                                var params = [context, shape, series, "y"];
                                if (series.type === "arearange") {
                                    params.push("highY");
                                }
                                chart.drawMarker.apply(null, params);//draw marker
                                Renderer.hover.apply(null, params);//hover points
                            });
                        }
                    });
                }
            }
        });
        return AreaRange;
    }

    return {
        deps: function () {
            return factoy.apply(global, [].slice.call(arguments, 0));
        }
    };
})()