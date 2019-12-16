(function () {
    var percentage = Numeric.percentage;

    function gridLayout (row, col, width, height, margin) {
        var panel = [];
        var n = row * col;
        var left = margin[3],
            top = margin[0],
            right = margin[1],
            bottom = margin[2];
        for (var i = 0; i < n; i++) {
            var ri = i % col,
                ci = ~~(i / col);
            var px = ri * (width / col) + left,
                py = ci * (height / row) + top,
                pw = width / col - right - left,
                ph = height / row - bottom - top;

            panel.push({
                x: px,
                y: py,
                width: pw,
                height: ph,
                _height: ph
            });
        }
        return panel;
    }
    return function (panel, row, col, width, height, margin, viewport) {
        var grid = [];
        if (defined(panel) && isArray(panel)) {
            panel.forEach(function (pane) {
                var px = pack("number", percentage(width, pane.x), pane.x) + margin[3],
                    py = pack("number", percentage(height, pane.y), pane.y) + margin[0],
                    pw = pack("number", percentage(width, pane.width), pane.width, width),
                    ph = pack("number", percentage(height, pane.height), pane.height, height);
                grid.push({
                    x: px, y: py,
                    width: pw, height: ph,
                    _height: ph,
                    plotX: px, plotY: py,
                    plotWidth: pw, plotHeight: ph,
                    borderWidth: pane.borderWidth,
                    borderColor: pane.borderColor,
                    backgroundColor: pane.backgroundColor
                });
            });
        }
        else {
            grid = gridLayout(row, col, width, height, margin);
        }

        grid.forEach(function (pane) {
            pane.x += viewport.left;
            pane.y += viewport.top;
            pane.plotX = pane.x;
            pane.plotY = pane.y;
            pane.plotWidth = pane.width;
            pane.plotHeight = pane.height;

            pane.yAxis = [];
            pane.xAxis = [];
            pane.polarAxis = [];
            pane.radiusAxis = [];
            pane.colorAxis = [];
            pane.series = [];
            pane.viewport = {left: 0, right: 0, top: 0, bottom: 0};
            pane.borderWidth = pane.borderWidth;
            pane.borderColor = pane.borderColor;
            pane.backgroundColor = pane.backgroundColor;
        });
        return grid;
    };
}).call(this);