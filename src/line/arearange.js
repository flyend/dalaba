(function () {
    function factoy (Dalaba, AreaSpline) {
        var extend = Dalaba.extend;

        var arrayFilter = Dalaba.Cluster.List.filter;


        function AreaRange (canvas, options) {
            this.canvas = canvas;
            this.context = canvas.getContext("2d");
            this.type = "arearange";

            this.init(options);
        }
        extend(AreaRange.prototype, AreaSpline.prototype, {
            init: function(options){
                this.series = arrayFilter(pack("array", options.series, []), function(series){
                    return series.type === "arearange";
                });
                Area.prototype.init.call(this, options);
            },
            draw: function(){
                var context = this.context,
                    chart = this;
                this.series.forEach(function(series){
                    var shapes = series.shapes;
                    Renderer.area(context, series.shapes, series);
                    Renderer.line(context, shapes, series, {
                        y: "highY"
                    });                    
                    Renderer.line(context, shapes, series, {
                        y: "y"
                    });//draw line

                    shapes.forEach(function(shape){
                        var params = [context, shape, series, "y"];
                        if(series.type === "arearange"){
                            params.push("highY");
                        }
                        chart.drawMarker.apply(null, params);//draw marker
                        chart.drawLabels(context, shape, series);//draw data labels
                        Renderer.hover.apply(null, params);//hover points
                    });
                });
            }
        });
        return AreaRange;
    }

    return {
        deps: function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
})()