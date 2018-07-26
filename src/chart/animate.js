(function (global) {

    var lerp = function (a, b, t) {
        return a + (b - a) * t;
    };

    var lerpArray = function (oldArrays, newArrays, timer, that) {
        var arrays = [];
        newArrays.forEach(function (newValue, i) {
            var oldValue = oldArrays[i];
            var newProps, oldProps, p;
            if (isObject(newValue)) {
                for (p in newValue) if (hasOwnProperty.call(newValue, p)) {
                    newProps = newValue[p];
                    oldProps = oldValue[p];
                    if (isArray(newProps)) {
                        that[i][p] = lerpArray(oldProps, newProps, timer, that[i]);
                    }
                    else {
                        that[i][p] = lerp(oldProps, newProps, timer);
                    }
                }
            }
            else if (isNumber(newValue, true)) {
                arrays.push(lerp(oldValue, newValue, timer));
            }
        });
        return arrays;
    };

    var Animate = function () {

    };
    Animate.prototype = {
        animate: function (oldProps, newProps) {
            this.oldProps = oldProps;
            this.newProps = newProps;
        },
        onframe: function (timer) {
            var oldProps = this.oldProps,
                newProps = this.newProps;
            var newValue, oldValue;
            var that = this;
            function caller (oldProps, newProps, that) {
                for (var p in newProps) if (hasOwnProperty.call(newProps, p)) {
                    //newProps = oldProps
                    newValue = newProps[p];
                    oldValue = oldProps[p];
                    if (hasOwnProperty.call(oldProps, p)) {
                        if (isArray(newValue)) {
                            lerpArray(oldValue, newValue, timer, that[p]);
                        }
                        else if (isNumber(newValue, true) && isNumber(oldProps[p], true)) {
                            that[p] = lerp(oldProps[p], newValue, timer);
                        }
                        else {
                            that[p] = newValue;
                        }
                    }
                }
            }
            caller(oldProps, newProps, this);
        },
        oncomplete: function () {
            delete this.oldProps;
            delete this.newProps;
        }
    };
    return {
        deps: function () {
            return function () {
                return Animate;
            }.apply(global, [global].concat([].slice.call(arguments, 0)));
        }
    };
})(typeof window !== "undefined" ? window : global)