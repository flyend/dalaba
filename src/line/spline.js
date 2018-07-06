(function () {
    return {
        deps: function () {
            return function (Dalaba, Line) {
                var extend = Dalaba.extend,
                    pack = Dalaba.pack,
                    arrayFilter = Dalaba.Cluster.List.filter;

                var Spline = function (canvas, options) {
                    this.canvas = canvas;
                    this.context = canvas.getContext("2d");
                    this.type = "spline";

                    this.init(options);
                };
                extend(Spline.prototype, Line.prototype, {
                    constructor: Spline,
                    init: function (options) {
                        this.series = arrayFilter(pack("array", options.series, []), function(series){
                            return series.type === "spline";
                        });
                        Line.prototype.init.call(this, options);
                    }
                });
                return Spline;
            }.apply(global, [].slice.call(arguments, 0));
        }
    };
})()