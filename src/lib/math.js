(function () {

    var mathPow = Math.pow;

    var mathLog = Math.log;

    var mathRound = Math.round;

    function round (v, p) {
        p = mathPow(10, p || 0);
        return p === 0 ? v : mathRound(v * p) / p;
    }

    var Maths = {
        log: function (v, base, positive) {
            base = base || 10;
            typeof positive === "undefined" && (positive = true);
            return (!!positive ? mathLog(v < 0 ? 0 : v) : -mathLog(v > 0 ? 0 : -v)) / mathLog(base);
        },
        pow: function (v, base, positive) {
            base = base || 10;
            typeof positive === "undefined" && (positive = true);
            return !!positive ? mathPow(base, v) : -mathPow(base, -v);
        },
        round: round,
        hammingDistance: function (a, b) {
            var c;
            return (c = a ^ b) & -c;
        }
    };

    return Maths;

}).call(typeof window !== "undefined" ? window : this);