(function () {
	function levenshtein (s0, s1, dp, splitter) {
        var indexes = new Array(s1.length);// s0 and s1 are the same size
        var n = s1.length, i = 0;
        var current, left, top, lefttop;

        splitter = Math.min(splitter, n);

        for (; i < n; i++) indexes[i] = 0;

        if (s0 == null || !s0.length) return indexes;

        indexes[0] = (0 >= splitter || s0[0] !== s1[0]) ? dp[0] + 1 : dp[0];
        
        for (i = 1; i < n; i++) {
            current = s1[i];
            left = s1[i - 1];
            lefttop = s0[i - 1];// left-top i - 1, top = i
            top = s0[i];
            if (!(i <= splitter && left === lefttop)) {
                indexes[i] = 0;// 遗传下去
                break;
            }
            indexes[i] = current === top
                ? (i === splitter || i === n - 1) ? dp[i] + 1 : dp[i] // some leaf
                : dp[i] + 1;
        }
        return indexes;
    }
    return levenshtein;
})()