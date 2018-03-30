(function(global) {

    var mathLog = Mathematics.log;

    var isZero = function(min, max) {
        return min <= 0 && max >= 0;
    };

    function factoy() {
        var computeColumn = function(group, width, height, groupCounting, groupLength) {
            var series = group[0];
            var plotX = pack("number", series.plotX, 0),
                plotY = pack("number", series.plotY, 0),
                plotWidth = pack("number", series.plotWidth, width),
                plotHeight = pack("number", series.plotHeight, height);

            var yAxisOptions = series._yAxis/*[series.yAxis | 0]*/ || {},
                logBase = pack("number", pack("object", yAxisOptions.logarithmic, {}).base, 10),
                maxValue = yAxisOptions.maxValue,
                minValue = yAxisOptions.minValue;
            var reversed = yAxisOptions.reversed;
            //console.log(series.minValue, minValue, series.maxValue, maxValue, reversed)

            var xAxisOptions = series._xAxis /*[series.xAxis | 0]*/ || {},
                minTickValue = 0,
                maxTickValue = xAxisOptions.length,
                categories = xAxisOptions.categories;

            var n = group.length, m = series.maxLength;//group[0].shapes.length;
            var maxLength = m;
            if(series.grouping === false){
                groupLength = 1;
                groupCounting = 0;
            }

            var tickWidth = plotWidth / maxLength;//maxLength
            var pointSize = getPointSize(group[0], tickWidth, groupLength);
            var center = (tickWidth - groupLength * pointSize) / 2;
            var zeroY = plotHeight - (isZero(minValue, maxValue) ? interpolate(0, minValue, maxValue, 0, plotHeight) : 0);

            var shape, value;
            
            for(var j = 0; j < m; j++){
                series = group[0];
                shape = series.shapes[j] || {};
                value = shape.value;

                var sum = value,
                    total = value;
                if(yAxisOptions.type === "logarithmic"){
                    value = mathLog(value, logBase);
                }
                for(var i = 1; i < n; i++){
                    total += (group[i].shapes[j] || {}).value;
                }
                var key = getKey(series, minTickValue + j * maxTickValue / m, categories, j, center / width / m);
                if(shape._x){
                    key = shape._x;
                }

                var x0, y0, x1, y1;
                var dirTop,/*positive*/dirBottom,/*negative*/startY;

                x0 = plotX + (j * tickWidth);
                x0 += center;
                x0 += groupCounting * pointSize;
                x1 = x0 + pointSize;//width
                                
                y0 = plotY + (reversed === true ? 0 : zeroY);
                y1 = y0;//value is zero


                if(series.selected === false || value === 0){
                    y1 = 0;
                    sum = 1;//log value is 0
                }
                else if(value < 0){
                    y1 = interpolate(value, 0, minValue, 0, Math.abs(plotHeight - zeroY));
                }
                else{
                    y1 = interpolate(value, 0, maxValue, 0, zeroY);
                }

                dirTop = dirBottom = y0;
                if(value >= 0){
                    startY = dirTop;
                    dirTop -= y1;
                    y1 = -y1;
                }
                else{
                    startY = dirBottom;
                    dirBottom += y1;
                }
                //y1 = (y0 = startY) + y1;
                y1 = (y0 = startY) + (!(reversed === true) || -1) * y1;

                if(series.selected === false){
                    x0 = x1;
                    y1 = y0;
                }

                extend(shape, {
                    x0: x0,
                    y0: y0,
                    x1: x1,
                    y1: y1,
                    total: n > 1 ? total : undefined,//series not shared
                    percentage: n > 1 ? value / total * 100 : undefined,
                    size: pointSize,
                    margin: center,
                    yBottom: zeroY + plotY,
                    key: key,
                    index: j
                });

                //stack
                for(i = 1; i < n; i++){
                    series = group[i];
                    shape = series.shapes[j] || {};
                    value = shape.value;
                    if(!isNumber(value)){
                        value = 0;
                    }

                    //dirTop = dirBottom = y1;
                    if(yAxisOptions.type === "logarithmic"){
                        value = mathLog(value += sum, logBase);
                        y1 = interpolate(value, minValue, maxValue, 0, plotHeight);
                        y1 -= interpolate(mathLog(sum, logBase), minValue, maxValue, 0, plotHeight);
                    }
                    else{
                        if(series.selected === false || value === 0){
                            y1 = 0;
                        }
                        else if(value < 0){
                            y1 = interpolate(value, 0, minValue, 0, Math.abs(plotHeight - zeroY));
                        }
                        else{
                            y1 = interpolate(value, 0, maxValue, 0, zeroY);
                        }
                    }

                    if(value >= 0){
                        startY = dirTop;
                        dirTop -= y1;
                        y1 = -y1;
                    }
                    else{
                        startY = dirBottom;
                        dirBottom += y1;
                    }

                    //pointSize = getPointSize(item[i], tickWidth, groupLength);
                    
                    x0 = plotX + (j * tickWidth);
                    x0 += center;
                    x0 += groupCounting * pointSize;
                    x1 = x0 + pointSize;//width

                    y0 = startY;
                    //y1 = y0 + y1;
                    y1 = y0 + (!(reversed === true) || -1) * y1;
                    if(series.selected === false){
                        x0 = x1;
                        y1 = y0;
                    }
                    extend(shape, {
                        x0: x0,
                        y0: y0,
                        x1: x1,
                        y1: y1,
                        size: pointSize,
                        margin: center,
                        yBottom: zeroY + plotY,
                        total: total,
                        percentage: value / total * 100,
                        key: key,
                        index: j
                    });
                }
            }
        };
        var computeBar = function(group, width, height, groupCounting, groupLength) {
            var series = group[0];
            var plotX = pack("number", series.plotX, 0),
                plotY = pack("number", series.plotY, 0),
                plotWidth = pack("number", series.plotWidth, width),
                plotHeight = pack("number", series.plotHeight, height);

            var xAxisOptions = series._xAxis || {},
                logBase = pack("number", (xAxisOptions.logarithmic || {}).base, 10),
                maxValue = xAxisOptions.maxValue,
                minValue = xAxisOptions.minValue;

            var yAxisOptions = series._yAxis || {},
                minTickValue = 0,
                maxTickValue = yAxisOptions.length,
                categories = yAxisOptions.categories;

            var reversed = xAxisOptions.reversed;
            //minValue = yAxisOptions.minValue;
            if (series.grouping === false) groupCounting = ~-(groupLength = 1);
            
            var n = group.length, m = series.maxLength;// group[0].shapes.length;
            var tickHeight = plotHeight / m;
            var pointSize = getPointSize(group[0], tickHeight, groupLength);
            var center = (tickHeight - groupLength * pointSize) / 2;
            var zeroX = (isZero(minValue, maxValue) ? interpolate(0, minValue, maxValue, 0, plotWidth) : 0);
            var shape, value;
            for (var j = 0; j < m; j++) {
                series = group[0];
                shape = series.shapes[j] || {};
                value = shape.value;

                var sum = value,
                    total = value;
                if(xAxisOptions.type === "logarithmic"){
                    value = mathLog(value, logBase);
                }
                for(var i = 1; i < n; i++){
                    total += group[i].shapes[j].value;
                }

                var key = getKey(series, minTickValue + j * maxTickValue / m, categories, j, center / width / m);
                var x0, y0, x1, y1;
                var dirLeft,/*positive*/dirRight,/*negative*/startX;
                //down to top
                y0 = plotHeight + plotY;//plotY + (j * tickHeight);
                y0 -= j * tickHeight;
                y0 -= center;
                y0 -= groupCounting * pointSize;
                y0 -= pointSize;
                y1 = y0 + pointSize;

                x0 = plotX + (reversed === true ? plotWidth : zeroX);
                x1 = x0;//value is zero
                if(isNumber(shape._x) && isNumber(shape._y)){
                    if(series.selected === false || shape._y === 0){
                        x1 = 0;
                    }
                    else if(shape._y < 0){
                        x1 = interpolate(shape._y, minValue, maxValue, 0, zeroX);
                    }
                    else{
                        x1 = interpolate(shape._y, minValue, maxValue, 0, Math.abs(plotWidth - zeroX));
                    }
                    key = shape._x;
                }
                else{
                    if(series.selected === false || value === 0){
                        x1 = 0;
                    }
                    else if(value < 0){
                        x1 = interpolate(value, 0, minValue, 0, zeroX);
                    }
                    else{
                        x1 = interpolate(value, 0, maxValue, 0, Math.abs(plotWidth - zeroX));
                    }
                }

                dirLeft = dirRight = x0;
                if(value >= 0){
                    startX = dirLeft;
                    dirLeft += x1;
                }
                else{
                    startX = dirRight;
                    dirRight -= x1;
                    x1 = -x1;
                }
                x1 = (x0 = startX) + (!(reversed === true) || -1) * x1;

                if(series.selected === false){
                    y0 = y1;
                    x1 = x0;
                }

                extend(shape, {
                    x0: x0,
                    y0: y0,
                    x1: x1,
                    y1: y1,
                    total: n > 1 ? total : undefined,//series not shared
                    percentage: n > 1 ? value / total * 100 : undefined,
                    size: pointSize,
                    margin: center,
                    yBottom: zeroX + plotX,
                    key: key
                });

                //stack
                for(i = 1; i < n; i++){
                    series = group[i];
                    shape = series.shapes[j];
                    value = shape.value;

                    if(yAxisOptions.type === "logarithmic"){
                        x1 = sum;
                        value = mathLog(sum += value, logBase);
                        x1 = interpolate(value, minValue, maxValue, 0, plotWidth) -
                            interpolate(mathLog(y1, logBase), minValue, maxValue, 0, plotWidth);
                    }
                    else{
                        if(isNumber(shape._x) && isNumber(shape._y)){
                            if(series.selected === false || shape._y === 0){
                                x1 = 0;
                            }
                            else if(shape._y < 0){
                                x1 = interpolate(shape._y, yAxisOptions.min, yAxisOptions.max, 0, zeroX);
                            }
                            else{
                                x1 = interpolate(shape._y, yAxisOptions.min, yAxisOptions.max, 0, Math.abs(plotWidth - zeroX));
                            }
                        }
                        else{
                            if(series.selected === false || value === 0){
                                x1 = 0;
                            }
                            else if(value < 0){
                                x1 = interpolate(value, 0, minValue, 0, zeroX);
                            }
                            else{
                                x1 = interpolate(value, 0, maxValue, 0, Math.abs(plotWidth - zeroX));
                            }
                        }
                    }
                    //pointSize = getPointSize(item[i], tickWidth, groupLength);

                    y0 = plotHeight + plotY;
                    y0 -= j * tickHeight;
                    y0 -= center;
                    y0 -= groupCounting * pointSize;
                    y0 -= pointSize;
                    y1 = y0 + pointSize;
                                    
                    x0 = zeroX + plotX;
                    
                    if(value >= 0){
                        startX = dirLeft;
                        dirLeft += x1;
                    }
                    else{
                        startX = dirRight;
                        dirRight -= x1;
                        x1 = -x1;
                    }
                    x1 = (x0 = startX) + x1;

                    if(series.selected === false){
                        y0 = y1;
                        x1 = x0;
                    }
                    //console.log(shape)
                    extend(shape, {
                        x0: x0,
                        y0: y0,
                        x1: x1,
                        y1: y1,
                        size: pointSize,
                        margin: center,
                        yBottom: zeroX + plotX,
                        total: total,
                        percentage: value / total * 100,
                        key: key,
                    });
                }
            }
        };
        var getPointSize = function(series, tickWidth, groupLength) {
            var point = pack("object", series.point, {}),
                groupPadding = pack("number", series.groupPadding, 0.5);//default center
            var size = tickWidth / groupLength;//auto
            size = (tickWidth - size * groupPadding) / groupLength;
            if(defined(point.width)){
                size = Math.max(0, pack("number",
                    point.width,
                    Numeric.percentage(tickWidth, point.width),
                    0
                ));
            }
            if(isNumber(point.maxWidth) || isNumber(series.maxPointWidth)){
                size = Math.min(size, pack("number", point.maxWidth, series.maxPointWidth));
            }
            return size;
        };
        var getKey = function(series, key, categories, j, size) {
            //var key = minTickValue + j * maxTickValue / m;
            //key = key + center / width / maxLength;
            var startIndex = pack("number", series.startIndex, 0);
            if(categories && categories.length){
                key = Math.floor(j + size + startIndex);
                if(categories[key])
                    key = categories[key];
            }
            else{
                key = Math.floor(j + size + startIndex);
            }
            return key;
        };

        var groupLength = 0,
            groupCounting = -1;

        var counter = function(data) {
            var flag = !1;
            var n = data.length,
                i = 0,
                d;
            for (; !flag && i < n; i++) {
                flag = (d = data[i]).selected !== false && d.grouping !== false;//default true
            }

            return flag;
        };

        return function(panels, modified) {
            panels.forEach(function(pane) {
                var series = pane.series;
                groupLength = 0,
                groupCounting = -1;
                var groups = partition(series, function(a, b) {
                    if(typeof a.stack === "undefined" && typeof b.stack === "undefined")
                        return false;
                    return (a.yAxis === b.yAxis) && a.stack === b.stack && a.type === b.type;
                });
                
                groups.forEach(function(group) {
                    counter(group) && groupLength++;
                });
                groupLength = Math.max(1, groupLength);
                groups.forEach(function(group) {
                    counter(group) && groupCounting++;
                    //console.log(groupCounting, groupLength, group[0].panelIndex, group)
                    group[0].type === "bar" ?
                        computeBar(group, group[0].plotWidth, group[0].plotHeight, groupCounting, groupLength)
                        : computeColumn(group, group[0].plotWidth, group[0].plotHeight, groupCounting, groupLength);
                });
            });
        };
    }

    return {
        deps: function() {
            return factoy.apply(global, [].concat([].slice.call(arguments, 0)));
        }
    };
}).call(typeof window !== "undefined" ? window : this)