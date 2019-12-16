var utils = {
    log: function () {
        var arg = Array.prototype.slice.call(arguments, 0);
        var argL = arg.length;
        if (argL === 0) {
            return false;
        }
        var msg = [];
        if (argL === 1) {
            msg.push(arg[0]);
        }
        else {
            msg = arg;
            msg[0] = '[' + msg[0] + ']';
        }
        msg.unshift('[' + this.getTime() + ']');
        Function.prototype.apply.call(console.log, console, msg);
        return true;
    },
    getTime: function () {
        var date = new Date;
        var h = date.getHours();
        var m = date.getMinutes();
        var s = date.getSeconds();
        h = h < 10 ? ('0' + h) : h;
        m = m < 10 ? ('0' + m) : m;
        s = s < 10 ? ('0' + s) : s;
        return [h, m, s].join(':')
    }
};

module.exports = utils;