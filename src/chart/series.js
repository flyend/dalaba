/**
 * An array of data shapes for the series
 * 1. An array of numerical values. 
 * @case:
 *   data = [1, 2, 3, 4]
 *
 * 2. An array of numerical values.
 * @case:
 *   data = ['A1', 'B2', '2018Q3']. Multiple numbers using adjacent
 *
 * 3. An array of arrays
 * @case:
 *   data = [[10, 20], [5, 12]]. The first one is x and the second is y for 2d projection
 *   data = [[1, 2, 10], [2, 3, 30]]. expressed as x, y and value
 *
 * 4. An array of objects with named values
 * @case:
 *   data = [{name: 'A', value: 1}, {name: 'B', value: 2}, {name: 'C', value: 3}, {name: 'D', value: 4}]
 * @case:
 *   data = [{name: 'A', value: {numeric|arrays|string}}]
 *
**/
(function (global) {

    var clamp = function (v, max) {
        return mathMax(0, mathMax(pack("number", max, 0), pack("number", v, 0)));
    };

    function factoy (global, Numeric, List, Animate) {

        var partition = List.partition;

        var vaoValuer = require("./valuer");

        function Series (series, options) {
            this.options = options;
            extend(this, series);
            this.__options__ = series;
        }
        Series.prototype = {
            constructor: Series,
            update: function (series, redraw) {
                var chart = this.chart,
                    newSeries;

                if (defined(chart)) {
                    newSeries = extend(this, series);
                    this.__options__ = series;
                    this._shapes = this.shapes;
                    this.shapes = this.addShape();

                    redraw !== false && chart.draw({ target: chart, type: "update"});
                }
            },
            addShape: function () {
                var options = this.options,
                    colors = options.colors || [];
                var data = pack("array", this.data, []),
                    item, value,
                    shapes = [], shape,
                    minValue = MAX_VALUE, maxValue = MIN_VALUE, sumValue = 0,
                    size = 0;
                var vari = [];
                var animationDelay = this.animationDelay;

                var type = this.type;
                var length = data.length,
                    i = 0;

                var newSeries = this;
                var start, end;
                if (newSeries.bindAxis) {
                    start = pack("number", parseFloat(newSeries.start, 10) / 100, 0);
                    end = pack("number", parseFloat(newSeries.end, 10) / 100, 1);
                    start = Math.max(0, Math.min(~~(length * start), ~-length));
                    end = Math.min(length, Math.max(~~(length * end), -~start));
                }
                else {
                    start = 0, end = length;
                }
                newSeries.startIndex = start;
                newSeries.endIndex = end;

                if (size = (end - start)) for (; start < end; start++, i++) {
                    item = data[start];
                    value = item;
                    vaoValuer.var(vari);
                    
                    var valuer = vaoValuer[type] ? (vaoValuer[type](value, colors[i % colors.length]) || {isNULL: !0, value: null}) : isNumber(value, true) ? {value: value, isNULL: !1} : {isNULL: !0, value: null};
                    shape = valuer;
                    shape.series = newSeries;
                    shape._source = item;
                    // console.log(valuer)

                    value = shape.value;
                    if (newSeries.animationEnabled !== false) {
                        shape.duration = newSeries.animationDuration;
                        shape.easing = newSeries.animationEasing;
                        if (isFunction(animationDelay)) shape.delay = animationDelay.call(item, i);
                        else if (isNumber(animationDelay)) shape.delay = animationDelay;
                        else shape.delay = isFunction(newSeries.delay) ? newSeries.delay.call(item, i) : newSeries.delay;
                    }
                    if (/*item.selected !== false && */isNumber(value, true)) {
                        sumValue += valuer.sumValue;
                        minValue = mathMin(minValue, valuer.minValue);
                        maxValue = mathMax(maxValue, valuer.maxValue);
                        vari.push(value);
                    }
                    shape._value = value;//show value
                    //shape.value = value;//cal value
                    //shape.$value = $value;//tooltip value
                    shape.dataLabel = {
                        visibled: true, // show or hide
                        value: isString(valuer.sourceValue) ? valuer.sourceValue : shape.name // data name
                    };
                    shape.__proto__ = new Animate();
                    
                    //data[start] = isObject(item) || isArray(item) ? item : {value: item};//legend data
                    
                    !defined(shape.color) && (shape.color = newSeries.color);
                    shapes.push(shape);
                }
                newSeries.minValue = size ? minValue : 0;
                newSeries.maxValue = size ? maxValue : 0;
                newSeries.sumValue = size ? sumValue : 0;
                return shapes;
            },
            getOptions: function () {
                return this.__options__;
            },
            destroy: function () {

            }
            //transform, projection
        };

        Series.mapping = function (allSeries) {
            var axisSeries = {
                yAxis: {},
                xAxis: {},
                polarAxis: {},
                radiusAxis: {},
                colorAxis: {}
            };

            var add = function (axisSeries, key, value) {
                if (!axisSeries.hasOwnProperty(key)) {
                    axisSeries[key] = [value];
                }
                else {
                    axisSeries[key].push(value);
                }
            };
            var isAxis2D = false;

            partition(allSeries, function (a, b) {
                return a.panelIndex === b.panelIndex;
            }).forEach(function (groups) {
                var maxLength = 0,
                    sumLength = 0;
                
                groups.forEach(function (series) {
                    var type = series.type;
                    isAxis2D = isAxis2D || ((!defined(series.projection) || series.projection === "2d") && hasAxis(type));
                    
                    if (series.selected !== false) {
                        series.sumLength = mathMax(sumLength, (series.data || []).length | 0);
                    }
                    series.maxLength = mathMax(maxLength, series.shapes.length);
                    //2d axis
                    if (isAxis2D) {
                        add(axisSeries.yAxis, clamp(series.yAxis), series);
                        add(axisSeries.xAxis, clamp(series.xAxis), series);
                    }
                    if (!!~(arrayIndexOf(["map", "heatmap"], type))) {
                        add(axisSeries.colorAxis, clamp(series.colorAxis), series);
                    }
                    if (!!~(arrayIndexOf(["radar"], type))) {
                        add(axisSeries.polarAxis, clamp(series.polarAxis), series);
                        add(axisSeries.radiusAxis, clamp(series.polarAxis), series);
                    }
                });
            });
            return axisSeries;
        };

        /**
         * data classification calculated
         * @param series{Array}
        */
        Series.normalize = function (series) {
            var minValue = MAX_VALUE,
                maxValue = -minValue;
            var minAxisX = minValue,
                maxAxisX = maxValue,
                minAxisY = minValue,
                maxAxisY = maxValue;
            var isX = false, isY = false;
            var isHigh = false;
            var isNULL = false;

            var maxLength = -MAX_VALUE;
            var axisLength = 0;

            var groups = partition(series, function (a, b) {
                if (a.type !== b.type)
                    return false;
                if (typeof a.stack === "undefined" && typeof b.stack === "undefined")
                    return false;
                return a.stack === b.stack;
            });
            var isAllEmpty = false;

            var ztree = new ZTree(series, ["type", "stack"]),
                root;

            for (var i = 0; !isHigh && i < series.length; i++) {
                root = series[i];
                isHigh = root.type === "arearange"
                    || root.type === "candlestick"
                    || root.type === "boxplot";
            }

            root = ztree.update(function (item) {
                var minValue = MAX_VALUE,
                    maxValue = MIN_VALUE;
                var minAxisX = MAX_VALUE,
                    maxAxisX = MIN_VALUE;
                var minAxisY = MAX_VALUE,
                    maxAxisY = MIN_VALUE;

                item.forEach(function (item) {
                    maxLength = Math.max(maxLength, item.data.length);
                });
                var series = item[0],
                    startIndex = series.startIndex,
                    endIndex = series.endIndex;
                
                var m = endIndex - startIndex, n = item.length, i, j;
                var data, source, value, x = null, y = null;
                var lowValue, highValue;//no negative

                for (j = 0; j < m; j++) {
                    var positive = 0, negative = 0;
                    var isNegative = false,
                        isPositive = false;
                    var isNegativeX = false,
                        isPositiveX = false;
                    var isNegativeY = false,
                        isPositiveY = false;

                    var negativeValue = MAX_VALUE, positiveValue = MIN_VALUE;
                    var positiveX = MIN_VALUE, negativeX = MAX_VALUE, positiveXSum = 0, negativeXSum = 0;
                    var positiveY = MIN_VALUE, negativeY = MAX_VALUE, positiveYSum = 0, negativeYSum = 0;

                    for (i = 0; i < n; i++) {
                        series = item[i];
                        if (series.selected !== false) {
                            data = series.shapes[j] || {};
                            source = series.data[~~(startIndex + j)];
                            value = data.value;

                            if (isArray(source)) {
                                isNumber(source[0]) && (x = source[0], isX = isX || !isX);
                                isNumber(source[1]) && (lowValue = value = y = source[1], isY = isY || !isY);
                                isNumber(source[2]) && (highValue = source[2]);
                                if (isHigh) {
                                    isY = false;
                                    isX = false;
                                }
                                if (!(series.type === "arearange" || series.type === "candlestick" || series.type === "boxplot") && isNumber(source[0], true)) {
                                    axisLength = mathMax(axisLength, source[0]);
                                }
                            }
                            else if (isObject(source)) {
                                isNumber(source.x) && (x = source.x, isX = isX || !isX);
                                isNumber(source.y) && (value = y = source.y, isY = isY || !isY);
                                isNumber(source.value) && (value = source.value);
                                isNumber(source.low) && (lowValue = source.low);
                                isNumber(source.high) && (highValue = source.high);
                            }
                            isNegative = isNegative || (isNumber(value) && value < 0);//only a negative
                            isPositive = isPositive || (isNumber(value) && value >= 0);//only a positive
                            isNegativeX = isNegativeX || x < 0;
                            isPositiveX = isPositiveX || x >= 0;
                            isNegativeY = isNegativeY || y < 0;
                            isPositiveY = isPositiveY || y >= 0;
                            isNULL = isNULL || isNumber(value) || (isNumber(lowValue) && isNumber(highValue));
                            if (isHigh) {
                                positive = series.maxValue;//use min & max value
                                negative = series.minValue;
                                isPositive = isNegative = true;
                            }
                            else {
                                if (isNumber(value)) {
                                    if (value < 0) {
                                        negative += value;
                                        positiveValue = mathMax(positiveValue, value);
                                    }
                                    else {
                                        positive += value;
                                        negativeValue = mathMin(negativeValue, value);
                                    }
                                }
                                if (isNumber(x)) {
                                    if (x < 0) {
                                        negativeXSum += x;
                                        positiveX = mathMax(positiveX, x);
                                    }
                                    else {
                                        positiveXSum += x;
                                        negativeX = mathMin(negativeX, x);
                                    }
                                }
                                if (isNumber(y)) {
                                    if (y < 0) {
                                        negativeYSum += y;
                                        positiveY = mathMax(positiveY, y);
                                    }
                                    else {
                                        positiveYSum += y;
                                        negativeY = mathMin(negativeY, y);
                                    }
                                }
                            }
                        }
                        maxValue = mathMax(maxValue, isPositive ? positive : positiveValue);
                        minValue = mathMin(minValue, isNegative ? negative : negativeValue);
                        maxAxisX = mathMax(maxAxisX, isPositiveX ? positiveXSum : positiveX);
                        minAxisX = mathMin(minAxisX, isNegativeX ? negativeXSum : negativeX);
                        maxAxisY = mathMax(maxAxisY, isPositiveY ? positiveYSum : positiveY);
                        minAxisY = mathMin(minAxisY, isNegativeY ? negativeYSum : negativeY);
                    }
                }

                isAllEmpty = isAllEmpty || !!n;
                return {
                    minValue: minValue,
                    maxValue: maxValue,
                    minAxisX: minAxisX,
                    maxAxisX: maxAxisX,
                    minAxisY: minAxisY,
                    maxAxisY: maxAxisY
                };
            }, function (newProps, props) {
                var cals = {
                    minValue: [mathMin, MAX_VALUE],
                    maxValue: [mathMax, MIN_VALUE],
                    minAxisX: [mathMin, MAX_VALUE],
                    maxAxisX: [mathMax, MIN_VALUE],
                    minAxisY: [mathMin, MAX_VALUE],
                    maxAxisY: [mathMax, MIN_VALUE]
                };

                for (var p in props) if (props.hasOwnProperty(p)) {
                    newProps[p] = cals[p][0](defined(newProps[p]) ? newProps[p] : (newProps[p] = cals[p][1]), props[p]);
                }
                return newProps;
            }).getRoot();
            minValue = root.minValue, maxValue = root.maxValue;
            minAxisX = root.minAxisX, maxAxisX = root.maxAxisX;
            minAxisY = root.minAxisY, maxAxisY = root.maxAxisY;
            //console.log(minValue, maxValue, "x=", minAxisX, maxAxisX, "y=", minAxisY, maxAxisY, isX, isNULL);
            
            if ((!groups.length && !isAllEmpty) || !isNULL) {
                minValue = maxValue = 
                minAxisX = maxAxisX =
                minAxisY = maxAxisY = maxLength = 0;
            }
            else {
                if (minValue === maxValue) {
                    maxValue === 0 ? (maxValue = 1) : (minValue = 0);
                }
                if (minAxisX === maxAxisX) {
                    maxAxisX === 0 ? (maxAxisX = 1) : (minAxisX = 0);
                }
                if (minAxisY === maxAxisY) {
                    maxAxisY === 0 ? (maxAxisY = 1) : (minAxisY = 0);
                }
            }
            var revalue = {
                min: minValue,
                max: maxValue,
                minX: minAxisX,
                maxX: maxAxisX,
                minY: minAxisY,
                maxY: maxAxisY,
                length: maxLength,
                axisLength: axisLength,
                //max value and x, y
                groups: groups
            };
            if (isX) {
                revalue.isX = isX, revalue.minX = minAxisX, revalue.maxX = maxAxisX;
            }
            if (isY) {
                revalue.isY = isY, revalue.minY = minAxisY, revalue.maxY = maxAxisY;
            }
            return revalue;
        };
        
        return Series;
    }
    return {
        deps: function () {
            return factoy.apply(global, [global].concat([].slice.call(arguments, 0)));
        }
    };
})(typeof window !== "undefined" ? window : global)