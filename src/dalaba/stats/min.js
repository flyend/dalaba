(function() {

    var nonull = Dalaba.nonull;
    

    var minFactory = function(data, filter) {
        var n, i;
        var d;

        var min = 0;

        if (!isArray(data)) {
            return NaN;
        }
        n = data.length, i = nonull(data);
        min = isValue(filter ? filter.call(data, data[i], i, data) : data[i], true);

        for (; i < n; i++) {
            d = isValue(filter ? filter.call(data, data[i], i, data) : data[i], true);
            if (d < min) min = d;
        }

        if (!isNumber(min, true))
            return NaN;
        //console.log(min);

        return min;
    };
    return minFactory;

})();