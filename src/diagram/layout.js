(function(global) {

    function noLayout(px, py, pwidth, pheight, shapes, series) {
        var seriesWidth = series.width,
            seriesHeight = series.height,
            seriesRadius = series.radius,
            seriesSymbol = series.symbol;
        shapes.forEach(function(shape) {
            var x = shape._x,
                y = shape._y,
                symbol = pack("string", shape.symbol, seriesSymbol, "square"),
                radius = pack("number", shape.radius, seriesRadius, 50),
                width = pack("number", shape.width, seriesWidth, radius),
                height = pack("number", shape.height, seriesHeight, 20);

            if(symbol === "hexagon" || symbol === "circle"){
                width = height = radius * 2;
            }
            if(series.selected === false){
                width = height = radius = 0;
            }

            extend(shape, {
                radius: radius,
                width: width,
                height: height,
                symbol: symbol,
                name: shape.name || series.name,
                x: x,
                y: y
            });
        });
    }

    function gridLayout(px, py, pwidth, pheight, shapes, series) {
        var cols = 0,
            rows = 0;

        new Layout.Grid(shapes, {
            width: pwidth,
            height: pheight,
            size: TRouBLe(series.symbol === "circle" ?  series.radius || 60 : [series.width || 25, series.height || 20]),
            margin: TRouBLe(py, 0, 0, px),
            row: rows,
            col: cols
        });
    }

    function radialTreeLayout(px, py, pwidth, pheight, shapes) {
        new Layout.RadialTree(shapes, {
            width: pwidth,
            height: pheight,
            margin: TRouBLe(py, 0, 0, px)
        });
    }

    function factoy(linked) {
        var link;
        var nodes;

        var setLayout = function() {
            var args = [].slice.call(arguments),
                type = args.shift();
            if (type === 'grid') {
                gridLayout.apply(null, args);
            }
            else if (type === 'radialTree') {
                radialTreeLayout.apply(null, args);
            }
            else {
                noLayout.apply(null, args);
            }
        };

        return function(panels, modified) {
            panels.forEach(function(pane) {
                pane.series.forEach(function(series) {
                    var plotX = pack("number", series.plotX, 0),
                        plotY = pack("number", series.plotY, 0),
                        plotWidth = pack("number", series.plotWidth),
                        plotHeight = pack("number", series.plotHeight);
                    var layout = series.layout;

                    if (!defined(modified) && !link) {
                        link = linked(series.shapes);
                        nodes = link.nodes();
                    }
                    setLayout(layout, plotX, plotY, plotWidth, plotHeight, nodes, series);
                    link.links();
                });
            });
        };
    }

    return {
        deps: function() {
            var args = [].slice.call(arguments, 0);
            return factoy.apply(global, args);
        }
    };
}).call(typeof window !== "undefined" ? window : this)