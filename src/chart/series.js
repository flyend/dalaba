(function (global) {
    var mathMax = Math.max,
        mathMin = Math.min;

    function factoy (global, Dalaba, List) {

        var defined = Dalaba.defined;

        var partition = List.partition;

        var indexOf = List.indexOf;

        var isNumber = function (v) {
            return Dalaba.isNumber(v, true);
        };

        var prediction = function (values) {
            var n = values.length,
                sum = 0,
                mean = false;
            var each = function (cb) {
                var l = n & 1,
                    r = n;
                l && cb(values[0], mean === false ? 0 : mean);
                while (l < r) {
                    cb(values[l++], values[--r]);
                }
            };
            each(function (a, b) { sum += a; sum += b; });
            mean = sum / n, sum = 0;
            each(function (a, b) { sum += (a - mean) * (a - mean), sum += (b - mean) * (b - mean); });

            return values[n - 1]; //mean;// n ? Math.sqrt(sum / n) : 0;
        };

        var valueOf = function (v, k) {
            var value = parseFloat(v, 10),
                values = v.match(/([\+\-]?\d+[\.eE]?\d*)/g),
                p = values && values.length;

            if (isNumber(value) && !p) {
                return value;
            }
            if (p && values.length < 2) {
                return value = parseFloat(values[0], 10);
            }
            if (p) {
                var kdtree = new KDTree(values.map(function (t) {
                    return {x: parseFloat(t, 10)};
                }), ["x"]);
                value = kdtree.nearest({x: k}, function (a, b) {
                    return (a.x - b.x) * (a.x - b.x);
                })[0];
                kdtree.destroy();
                if (isNumber(value.x)) {
                    return value = value.x;
                }
            }
            return null;
        };

        function Series (options) {
            extend(this, options);
            this.__options__ = options;
        }
        Series.prototype = {
            constructor: Series,
            update: function (options, redraw) {
                var chart = this.chart,
                    newSeries;
                
                if (defined(chart)) {
                    newSeries = extend(this, options);
                    this.__options__ = options;
                    this._shapes = this.shapes;
                    this.shapes = this.addShape();

                    redraw !== false && chart.draw();
                }
            },
            addShape: function () {
                var newSeries = this;
                var data = pack("array", newSeries.data, []),
                    item, value,
                    shapes = [], shape,
                    minValue, maxValue,
                    diff = 0;
                var vari = [];
                var animationDelay = newSeries.animationDelay;

                var type = newSeries.type;
                var length = data.length,
                    j = 0;
                var isNULL = false;

                var start = pack("number", parseFloat(newSeries.start, 10) / 100, 0),
                    end = pack("number", parseFloat(newSeries.end, 10) / 100, 1);
                start = Math.max(0, Math.min(~~(length * start), ~-length));
                end = Math.min(length, Math.max(~~(length * end), -~start));
                newSeries.startIndex = start;
                newSeries.endIndex = end;

                if (diff = (end - start)) {
                    minValue = Number.MAX_VALUE,
                    maxValue = -minValue;
                    for(; start < end; start++, j++){
                        item = data[start];
                        value = item;
                        shape = {
                            series: newSeries,
                            source: item
                        };
                        if (newSeries.animationEnabled !== false) {
                            shape.duration = newSeries.animationDuration;
                            shape.easing = newSeries.animationEasing;
                            if (isFunction(animationDelay)) shape.delay = animationDelay.call(item, j);
                            else if (isNumber(animationDelay)) shape.delay = animationDelay;
                            else shape.delay = isFunction(newSeries.delay) ? newSeries.delay.call(item, j) : newSeries.delay;
                        }

                        if (isObject(item)) {
                            value = defined(item.value) ? item.value : item.y;
                            if (type === "arearange" && defined(item.high)) {
                                value = item.high;
                            }
                            extend(shape, item);
                            delete shape.x;
                            delete shape.y;
                            defined(item.x) && (shape._x = item.x);
                            defined(item.y) && (shape._y = item.y);
                        }
                        else if (isArray(item)) {
                            value = defined(item[1]) ? item[1] : item[0];
                            if(type === "arearange" || defined(item[2])){
                                value = defined(item[2]) ? item[2] : item[1];
                            }
                            extend(shape, {
                                _x: item[0],
                                _y: item[1]
                            });
                        }
                        var svalue = value,
                            $value = svalue;
                        if (isString(value)) {
                            var k = vari.length ? vari.length > 2 ? prediction(vari.slice(-10)) : vari[0] : 0;
                            value = valueOf(svalue = value, k);
                        }
                        
                        if (!isNumber(value) || !isFinite(value)) {
                            value = svalue = null;
                            $value = "--";
                        }
                        if (isNumber(value)) {
                            minValue = mathMin(minValue, value);
                            maxValue = mathMax(maxValue, value);
                            vari.push(value);
                        }
                        isNULL = value === null;
                        if (type === "candlestick") {
                            (isNULL = !(
                                isNumber(+shape.open, true) &&
                                isNumber(+shape.close, true) &&
                                isNumber(+shape.low, true) &&
                                isNumber(+shape.high, true)
                            )) || ($value = [
                                "<br>",
                                "open: " + shape.open + "<br>",
                                "close: " + shape.close + "<br>",
                                "low: " + shape.low + "<br>",
                                "high: " + shape.high + "<br>"
                            ].join(""));
                            isNULL && ((isNULL = !(
                                isNumber(+item[0], true) &&
                                isNumber(+item[1], true) &&
                                isNumber(+item[2], true) &&
                                isNumber(+item[3], true)
                            )) || ($value = [
                                "<br>",
                                "open: " + item[0] + "<br>",
                                "close: " + item[1] + "<br>",
                                "low: " + item[2]+ "<br>",
                                "high: " + item[3] + "<br>"
                            ].join("")));
                        }
                        if (!!~(indexOf(["pie", "funnel", "venn"], type))) {
                            !defined(shape.name) && (shape.name = svalue);
                        }
                        else {
                            if (type !== "diagram" && type !== "sankey")
                                shape.name = newSeries.name;
                            !defined(shape.color) && (shape.color = newSeries.color);
                        }
                        shape._value = svalue;//show value
                        shape.value = value;//cal value
                        shape.$value = $value;//tooltip value
                        shape.isNULL = isNULL;
                        shape.dataLabel = {};
                        shapes.push(shape);
                        if ((type === "pie" || type === "funnel")) {
                            data[start] = isObject(item) || isArray(item) ? item : {value: item};//legend data
                        }
                    }
                }
                newSeries.minValue = diff ? minValue : 0;
                newSeries.maxValue = diff ? maxValue : 0;
                return shapes;
            },
            destroy: function(){

            }
        };

        Series.mapping = function (series) {
            var axisSeries = {
                yAxis: {},
                xAxis: {},
                polarAxis: {},
                radiusAxis: {},
                colorAxis: {}
            };

            var clamp = function (v, max) {
                return mathMax(0, mathMax(pack("number", max, 0), pack("number", v, 0)));
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

            partition(series, function (a, b) {
                return a.panelIndex === b.panelIndex;
            }).forEach(function (groups) {
                var maxLength = 0,
                    sumLength = 0;
                
                groups.forEach(function (series) {
                    var type = series.type;
                    isAxis2D = isAxis2D || (!defined(series.projection) && hasAxis(type));
                    
                    if (series.selected !== false) {
                        series.sumLength = mathMax(sumLength, (series.data || []).length | 0);
                        series.maxLength = mathMax(maxLength, series.shapes.length);
                    }
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
            var MAX_VALUE = Number.MAX_VALUE,
                MIN_VALUE = -MAX_VALUE;
            var minValue = MAX_VALUE,
                maxValue = -minValue;
            var minAxisX = minValue,
                maxAxisX = maxValue,
                minAxisY = minValue,
                maxAxisY = maxValue;
            var isX = false, isY = false;
            var isNULL = false;

            var maxLength = -MAX_VALUE;

            var groups = partition(series, function (a, b) {
                if(a.type !== b.type)
                    return false;
                if(typeof a.stack === "undefined" && typeof b.stack === "undefined")
                    return false;
                return a.stack === b.stack;
            });
            var isAllEmpty = false;

            var ztree = new ZTree(series, ["type", "stack"]),
                root;

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
                var isHigh;
                var m = endIndex - startIndex, n = item.length, i, j;
                var data, source, value, x = null, y = null;
                var lowValue, highValue;//no negative
                var isSelected = false;
                
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
                        isSelected = isSelected || series.selected !== false;
                        if(series.selected !== false){
                            isHigh = !!~(indexOf(["arearange", "candlestick"], series.type));

                            data = series.shapes[j] || {};
                            source = series.data[~~(startIndex + j)];
                            value = data.value;

                            if(isArray(source)){
                                isNumber(source[0]) && (x = source[0], isX = isX || !isX);
                                isNumber(source[1]) && (lowValue = value = y = source[1], isY = isY || !isY);
                                isNumber(source[2]) && (highValue = source[2]);
                                if(isHigh){
                                    isY = false;//arearange use value
                                }
                            }
                            else if(isObject(source)){
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
                            if(isHigh){
                                positive += highValue;
                                negative += lowValue;
                                isPositive = isNegative = true;
                            }
                            else{
                                if (isNumber(value)) {
                                    if(value < 0){
                                        negative += value;
                                        positiveValue = mathMax(positiveValue, value);
                                    }
                                    else{
                                        positive += value;
                                        negativeValue = mathMin(negativeValue, value);
                                    }
                                }
                                if (isNumber(x)) {
                                    if(x < 0){
                                        negativeXSum += x;
                                        positiveX = mathMax(positiveX, x);
                                    }
                                    else{
                                        positiveXSum += x;
                                        negativeX = mathMin(negativeX, x);
                                    }
                                }
                                if (isNumber(y)) {
                                    if(y < 0){
                                        negativeYSum += y;
                                        positiveY = mathMax(positiveY, y);
                                    }
                                    else{
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
            }, function(newProps, props) {
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
                length: maxLength,
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