(function () {
    function defaultCompare (a, b) {
        return a - b;
    }

    function bisect (arrays, value, left, right, compare) {
        if (left == null) left = 0;
        if (right == null) right = arrays.length;
        if (compare == null) compare = defaultCompare;

        var mid;

        while (left < right) {
            mid = left + right >>> 1;
            if (compare(arrays[mid], value) > 0) right = mid;
            else left = mid + 1;
        }
        return left;
    }
    return bisect;
})();