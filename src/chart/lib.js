(function (Dalaba) {
    var defined = Dalaba.defined;

    var pack = Dalaba.pack;

    var document = Dalaba.global.document;
    /*
     * scale canvas
     * @param g{CanvasRenderingContext2D}
     * @param width{Number}
     * @param height{Number}
     * @param ratio{Number}
    */
    function rescale (g, width, height, ratio, tx, ty) {
        var canvas = g.canvas;
        tx = pack("number", tx, 0);
        ty = pack("number", ty, 0);
        
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        
        if (ratio !== 1) {
            canvas.style.width = width + "px";
            canvas.style.height = height + "px";
        }
        g.setTransform(
            ratio, 0,
            0, ratio,
            tx * ratio,
            ty * ratio
        );
    }

    var fixLinePixel = function (x, y, w, h, borderWidth) {
        var xBorder = -((borderWidth = isNaN(+borderWidth) ? 1 : borderWidth) % 2 ? 0.5 : 0),
            yBorder = borderWidth % 2 ? 0.5 : 1;
        //horizontal
        var right = Math.round(x + w) + xBorder;
        x = Math.round(x) + xBorder;
        //vertical
        var bottom = Math.round(y + h) + yBorder,
            isTop = Math.abs(y) <= 0.5 && bottom > 0.5;
        y = Math.round(y) + yBorder;
        h = bottom - y;

        if (isTop) {
            y -= 1;
            h += 1;
        }

        return {
            x: x,
            width: right - x,
            y: y,
            height: h
        };
    };

    var fixPixelHalf = function () {
        var args = [].slice.call(arguments, 0),
            sub = args.pop(),
            lineWidth = sub;
        var round = Math.round;
        var r = [],
            v2;
        if(typeof sub === "boolean"){
            lineWidth = args[args.length - 1];
        }
        else{
            sub = null;
        }
        lineWidth = round(lineWidth);
        
        args.forEach(function (y) {
            v2 = round(y * 2);
            r.push(((v2 + lineWidth) % 2 === 0 ? v2 : (v2 + (sub || -1))) / 2);
        });
        return r;
    };

    /**
     * Chart static constructor
    */
    var Chart = function (canvas, options) {
        return new Dalaba.Chart.fn.init(canvas, options);
    };
    
    var Arc = require("./arc");

    var Event = require("./event").deps(Dalaba);

    var Animate = require("./animate").deps();

    Chart.graphers = {};
    
    Chart.hasTouch = defined(document) && ("ontouchstart" in document)// document.documentElement.ontouchstart !== undefined;

    Chart.Event = Event;

    Chart.Event.Handler = require("./eventhandler").deps(Dalaba, Event);

    Chart.angleInQuadrant = require("./angleInQuadrant");
    Chart.angle2arc = Arc.angle2arc;
    Chart.arc = Arc.arc;

    Chart.Clip = require("./clip").deps(Arc.angle2arc);

    Chart.Series = require("./series").deps(Dalaba.Numeric, Dalaba.Cluster.List, Animate);
    Chart.scale = rescale;
    Chart.fixLinePixel = fixLinePixel;
    Chart.fixPixelHalf = fixPixelHalf;

    Chart.Animate = Animate;

    Dalaba.Chart = Chart;

})(Dalaba);