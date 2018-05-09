//global name
var document = global.document;

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


var Event = Dalaba.Chart.Event,
    Mathematics = Dalaba.Math,
    Geometry = Dalaba.Geometry,
    Intersection = Geometry.Intersection,
    DashLine = Geometry.Line.Dash,
    Text = Dalaba.Text,
    Color = Dalaba.Color,
    Numeric = Dalaba.Numeric,
    Formatter = Dalaba.Formatter,
    List = Dalaba.Cluster.List,
    KDTree = Dalaba.KDTree,
    ZTree = Dalaba.ZTree,
    Projection = Dalaba.geo.Projection;

var toPrecision = Numeric.toPrecision,
    interpolate = Numeric.interpolate;

var arrayFilter = List.filter,
    arrayIndexOf = List.indexOf,
    partition = List.partition;

var mathLog = Mathematics.log;

var hasAxis = function (type) {
    return arrayIndexOf(["line", "spline", "column", "bar", "area", "areaspline", "arearange", "scatter", "heatmap", "candlestick"], type) > -1;
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

var hasTouch = Dalaba.Chart.hasTouch;

var rescale = Dalaba.Chart.scale;


var DEVICE_PIXEL_RATIO = Dalaba.DEVICE_PIXEL_RATIO;

var fixLinePixel = Dalaba.Chart.fixLinePixel;

var fixPixelHalf = Dalaba.Chart.fixPixelHalf;

var TRouBLe = Formatter.TRouBLe;

var DataLabels = require("./datalabels").deps(Dalaba, Dalaba.Text);

var EVENT_MOUSE_OVER = hasTouch ? "touchstart" : "mouseover";
var EVENT_MOUSE_MOVE = hasTouch ? "touchmove" : "mousemove";
var EVENT_MOUSE_OUT = hasTouch ? "touchend" : "mouseout";
var EVENT_MOUSE_DOWN = "mousedown";
var EVENT_MOUSE_UP = "mouseup";

var PI = Math.PI,
    PI2 = PI * 2;