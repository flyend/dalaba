//global name
var EVENT_MOUSE_OVER = hasTouch ? "touchstart" : "mouseover";

var EVENT_MOUSE_MOVE = hasTouch ? "touchmove" : "mousemove";

var EVENT_MOUSE_OUT = hasTouch ? "touchend" : "mouseout";

var EVENT_MOUSE_DOWN = "mousedown";

var EVENT_MOUSE_UP = "mouseup";

var PI = Math.PI;
    
var PI2 = PI * 2.0;

var TOW_PI = PI2;

var HALF_PI = PI / 2.0;

var QUARTER_PI = PI / 4.0;

var SQRT3 = Math.sqrt(3);

var MAX_VALUE = Number.MAX_VALUE;

var MIN_VALUE = -MAX_VALUE;

var DEVICE_PIXEL_RATIO = Dalaba.DEVICE_PIXEL_RATIO;

var Event = Dalaba.Chart.Event;

var Mathematics = Dalaba.Math;

var Geometry = Dalaba.Geometry;

var Vector = Dalaba.Vector;

var Intersection = Geometry.Intersection;

var DashLine = Geometry.Line.Dash;

var Text = Dalaba.Text;

var Color = Dalaba.Color;

var Numeric = Dalaba.Numeric;

var Formatter = Dalaba.Formatter;

var List = Dalaba.Cluster.List;

var KDTree = Dalaba.KDTree;

var ZTree = Dalaba.ZTree;

var Projection = Dalaba.geo.Projection;


var document = Dalaba.global.document;

var defined = Dalaba.defined,
    extend = Dalaba.extend,
    pack = Dalaba.pack,
    noop = function () {};


var isObject = Dalaba.isObject,
    isNumber = Dalaba.isNumber,
    isArray = Dalaba.isArray,
    isString = Dalaba.isString,
    isFunction = Dalaba.isFunction,
    isEmpty = Dalaba.isEmptyObject;


var toPrecision = Numeric.toPrecision,
    interpolate = Numeric.interpolate;

var arrayFilter = List.filter,
    arrayIndexOf = List.indexOf,
    partition = List.partition;

var mathLog = Mathematics.log,
    mathRound = Mathematics.round,
    mathPow = Mathematics.pow,
    mathMax = Math.max,
    mathMin = Math.min,
    mathCeil = Math.ceil,
    mathFloor = Math.floor,
    mathAbs = Math.abs,
    mathCos = Math.cos,
    mathSin = Math.sin;

var hasAxis = function (type) {
    return arrayIndexOf(["line", "spline", "column", "bar", "area", "boxplot", "areaspline", "arearange", "scatter", "heatmap", "candlestick"], type) > -1;
};

var setAttribute = function (domel, props) {
    if (domel) for (var p in props) if (hasOwnProperty.call(props, p) && defined(props[p]))
        domel.setAttribute(p, props[p]);
};

var setStyle = function (domel, props) {
    if (domel) for (var p in props) if (hasOwnProperty.call(props, p)) {
        domel.style[p.replace(/\-(\w)/g, function (all, s) {
            return s.toUpperCase();
        })] = props[p];
    }
};

var getStyle = function (domel, cssProp) {
    var value = "";
    var view = document.defaultView;
    if (view && (view = view.getComputedStyle)) {
        value = view(domel, null).getPropertyValue(cssProp);
    }
    else if (domel.currentStyle) {
        value = domel.currentStyle[cssProp.replace(/\-(\w)/g, function (_, s) {
            return s.toUpperCase();
        })];
    }
    return value;
};

var hasTouch = Dalaba.Chart.hasTouch;

var rescale = Dalaba.Chart.scale;

var fixLinePixel = Dalaba.Chart.fixLinePixel;

var fixPixelHalf = Dalaba.Chart.fixPixelHalf;

var TRouBLe = Formatter.TRouBLe;

var Clip = Dalaba.Chart.Clip;

var Series = Dalaba.Chart.Series;

var DataLabels = require("./datalabels").deps(Dalaba, Dalaba.Text);