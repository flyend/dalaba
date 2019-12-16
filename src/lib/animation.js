/*
 * Class Animation
*/
(function (callback) {
    // Easing functions take at least four arguments:
    // t: Current time
    // b: Start value
    // c: Change in value from start to end
    // d: Total duration of the animation
    // Some easing functions also take some optional arguments:
    // a: Amplitude
    // p: Period
    // s: Overshoot amount
    //
    // The equations are created by Robert Penner.
    // (c) 2003 Robert Penner, all rights reserved.
    // The work is subject to the terms in http://www.robertpenner.com/easing_terms_of_use.html.
    var easing = {
        // Deprecated
        "ease-in": function (time) {
            return easing.cubicBezier(0.42, 0, 1, 1, time);
        },

        // Deprecated
        "ease-out": function (time) {
            return easing.cubicBezier(0, 0, 0.58, 1, time);
        },

        // Deprecated
        "ease-in-out": function (time) {
            return easing.cubicBezier(0.42, 0, 0.58, 1, time);
        },

        // Deprecated syntax, will adopt the t, b, c, d syntax as the rest
        "linear": function (time) {
            return time;
        },

        "ease-in-quad": function (t, b, c, d) {
            return c*(t/=d)*t + b;
        },

        "ease-out-quad": function (t, b, c, d) {
            return -c *(t/=d)*(t-2) + b;
        },

        "ease-in-out-quad": function (t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t + b;
            return -c/2 * ((--t)*(t-2) - 1) + b;
        },

        "ease-in-cubic": function (t, b, c, d) {
            return c*(t/=d)*t*t + b;
        },

        "ease-out-cubic": function (t, b, c, d) {
            return c*((t=t/d-1)*t*t + 1) + b;
        },

        "ease-in-out-cubic": function (t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t + b;
            return c/2*((t-=2)*t*t + 2) + b;
        },

        "ease-in-quart": function (t, b, c, d) {
            return c*(t/=d)*t*t*t + b;
        },

        "ease-out-quart": function (t, b, c, d) {
            return -c * ((t=t/d-1)*t*t*t - 1) + b;
        },

        "ease-in-out-quart": function (t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
            return -c/2 * ((t-=2)*t*t*t - 2) + b;
        },

        "ease-in-quint": function (t, b, c, d) {
            return c*(t/=d)*t*t*t*t + b;
        },

        "ease-out-quint": function (t, b, c, d) {
            return c*((t=t/d-1)*t*t*t*t + 1) + b;
        },

        "ease-in-out-quint": function (t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
            return c/2*((t-=2)*t*t*t*t + 2) + b;
        },

        "ease-in-sine": function (t, b, c, d) {
            return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
        },

        "ease-out-sine": function (t, b, c, d) {
            return c * Math.sin(t/d * (Math.PI/2)) + b;
        },

        "ease-in-out-sine": function (t, b, c, d) {
            return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
        },

        "ease-in-expo": function (t, b, c, d) {
            return (t===0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
        },

        "ease-out-expo": function (t, b, c, d) {
            return (t===d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
        },

        "ease-in-out-expo": function (t, b, c, d) {
            if (t===0) return b;
            if (t==d) return b+c;
            if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
            return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
        },

        "ease-in-circ": function (t, b, c, d) {
            return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
        },

        "ease-out-circ": function (t, b, c, d) {
            return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
        },

        "ease-in-out-circ": function (t, b, c, d) {
            if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
            return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
        },

        "ease-in-elastic": function (t, b, c, d, a, p) {
            a = a || 0;
            if (t===0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*0.3;
            if (a < Math.abs(c)) { a=c; var s=p/4; }
            else var s = p/(2*Math.PI) * Math.asin (c/a);
            return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
        },

        "ease-out-elastic": function (t, b, c, d, a, p) {
            a = a || 0;
            if (t===0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*0.3;
            if (a < Math.abs(c)) { a=c; var s=p/4; }
            else var s = p/(2*Math.PI) * Math.asin (c/a);
            return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
        },

        "ease-in-out-elastic": function (t, b, c, d, a, p) {
            a = a || 0;
            if (t===0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(0.3*1.5);
            if (a < Math.abs(c)) { a=c; var s=p/4; }
            else var s = p/(2*Math.PI) * Math.asin (c/a);
            if (t < 1) return -0.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
            return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*0.5 + c + b;
        },

        "ease-in-back": function (t, b, c, d, s) {
            if (s === undefined) s = 1.70158;
            return c*(t/=d)*t*((s+1)*t - s) + b;
        },

        "ease-out-back": function (t, b, c, d, s) {
            if (s === undefined) s = 1.70158;
            return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
        },

        "ease-in-out-back": function (t, b, c, d, s) {
            if (s === undefined) s = 1.70158;
            if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
            return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
        },

        "ease-in-bounce": function (t, b, c, d) {
            return c - easing["ease-out-bounce"](d-t, 0, c, d) + b;
        },

        "ease-out-bounce": function (t, b, c, d) {
            if ((t/=d) < (1/2.75)) {
                return c*(7.5625*t*t) + b;
            } else if (t < (2/2.75)) {
                return c*(7.5625*(t-=(1.5/2.75))*t + 0.75) + b;
            } else if (t < (2.5/2.75)) {
                return c*(7.5625*(t-=(2.25/2.75))*t + 0.9375) + b;
            } else {
                return c*(7.5625*(t-=(2.625/2.75))*t + 0.984375) + b;
            }
        },

        "ease-in-out-bounce": function (t, b, c, d) {
            if (t < d/2) return easing["ease-in-bounce"](t*2, 0, c, d) * 0.5 + b;
            return easing["ease-out-bounce"](t*2-d, 0, c, d) * 0.5 + c*0.5 + b;
        },

        // Deprecated, will be replaced by the new syntax for calling easing functions
        cubicBezier: function (x1, y1, x2, y2, time) {

            // Inspired by Don Lancaster's two articles
            // http://www.tinaja.com/glib/cubemath.pdf
            // http://www.tinaja.com/text/bezmath.html


                // Set start and end point
            var x0 = 0,
                y0 = 0,
                x3 = 1,
                y3 = 1,

                // Convert the coordinates to equation space
                A = x3 - 3*x2 + 3*x1 - x0,
                B = 3*x2 - 6*x1 + 3*x0,
                C = 3*x1 - 3*x0,
                D = x0,
                E = y3 - 3*y2 + 3*y1 - y0,
                F = 3*y2 - 6*y1 + 3*y0,
                G = 3*y1 - 3*y0,
                H = y0,

                // Variables for the loop below
                t = time,
                iterations = 5,
                i, slope, x, y;

            if(time <= 0)
                return 0;

            // Loop through a few times to get a more accurate time value, according to the Newton-Raphson method
            // http://en.wikipedia.org/wiki/Newton's_method
            for (i = 0; i < iterations; i++) {

                // The curve's x equation for the current time value
                x = A* t*t*t + B*t*t + C*t + D;

                // The slope we want is the inverse of the derivate of x
                slope = 1 / (3*A*t*t + 2*B*t + C);

                // Get the next estimated time value, which will be more accurate than the one before
                t -= (x - time) * slope;
                t = t > 1 ? 1 : (t < 0 ? 0 : t);
            }

            // Find the y value through the curve's y equation, with the now more accurate time value
            y = Math.abs(E*t*t*t + F*t*t + G*t * H);

            return y;
        }
    };
    return callback && callback.call(this, easing);
}).call(typeof window !== "undefined" ? window : typeof this !== "undefined" ? this : global, function (easing) {

    var FPS = 1000 / 60;

    var isObject = Dalaba.isObject;

    var isNumber = Dalaba.isNumber;
    
    var extend = Dalaba.extend;

    var hasOwnProperty = ({}).hasOwnProperty;

    var lerp = function (a, b, k) {
        return a + (b - a) * k;;
    };

    var requestAnimationFrame = this.requestAnimationFrame
        || this.mozRequestAnimationFrame
        || this.webkitRequestAnimationFrame
        || this.msRequestAnimationFrame
        || this.oRequestAnimationFrame
        || function (callback) {
            return setTimeout(callback, FPS);
        };
    var cancelAnimationFrame = this.cancelAnimationFrame
        || this.webkitCancelAnimationFrame
        || this.mozCancelAnimationFrame
        || this.oCancelAnimationFrame
        || function (id) {
            clearTimeout(id);
        };

    var parseCubicBezier = function (value) {
        var x1, y1, x2, y2;
        var bezier = value.match(/cubic-bezier\(\s*(.*?),\s*(.*?),\s*(.*?),\s*(.*?)\)/);
        if (bezier) {
            isNaN(x1 = parseFloat(bezier[1], 10)) && (x1 = 0);
            isNaN(y1 = parseFloat(bezier[2], 10)) && (y1 = 0);
            isNaN(x2 = parseFloat(bezier[3], 10)) && (x2 = 1);
            isNaN(y2 = parseFloat(bezier[4], 10)) && (y2 = 1);

            return function (time) {
                return easing.cubicBezier(x1, y1, x2, y2, time);
            };
        }
    };
    var propFilter = function (props, key, a, b, k) {
        if (isNumber(a)) {
            props[key] = lerp(a, b, k);
        }
        else if (typeof a === "object" && typeof b === "object") for (var p in b) if (hasOwnProperty.call(b, p)) {
            propFilter(props[key], p, a[p], b[p], k);
        }
    };

    var easefuns = function (type) {      
        var fn;     
        if (typeof type === "function") {
            return type;        
        }       
        else if (typeof type === "string") {      
            if (!!~type.indexOf("cubic-bezier")) {        
                fn = parseCubicBezier(type) || easing["linear"];        
            }       
            else {       
                fn = easing[type] || easing["linear"];      
            }       
        }       
        else {       
            fn = easing["linear"];      
        }       
        return fn;      
    };

    function runAnimation (animators) {
        var now = new Date().getTime(),
            ani;
        var isAnim = true,
            i = 0,
            ii = animators.length;

        for (; i < ii; i++) if (!(ani = animators[i]).paused && !ani.done) {
            var nextd = ani.next,
                target = ani.target;
            var time = now - ani.start,
                duration = ani.duration,
                easefy = ani.easefy,
                step = ani.step,
                complete = ani.complete;
            var timer;
            isAnim = false;
            
            if (time < 0) {
                continue;
            }
            if (time < duration) {
                timer = easefy(time, duration, now);
                target.onframe.call(target, timer);
                ani.time = time;
                //step(target, timer);
            }
            else {
                target.onframe.call(target, timer = 1);
                complete(target, timer);
                target.oncomplete.call(target);
                ani.time = time;
                ani.done = true;
                ani.isDone = true;
                if (ani.repeat > 1 && !nextd) {

                }
            }
        }
        return isAnim;
    }

    /**
     * Class Animation
    **/
    function Animation () {
        this.animators = [];
        this.running = false;
        this.options = {};
    }
    Animation.prototype = {
        stop: function (gotoEnd, isClear) {
            var options = this.options;
            this.animators.forEach(function (ani) {
                if (gotoEnd) {
                    //ani.step(ani.target, 1);
                }
                if (ani.isDone) {
                    ani.done = false;
                    ani.isDone = false;
                    ani.start = new Date().getTime();
                }
                else {
                    ani.start = ani.time + ani.start;
                }
                ani.duration = options.duration;
            });
            if (isClear) {
                this.animators = [];
            }
            return this;
        },
        addAnimate: function () {
            var args = [].slice.call(arguments, 0),
                target = {},
                options = {},
                defaultOptions = {
                    duration: 500,
                    easing: "linear",
                    step: function () {},
                    complete: function () {}
                };
            var easing, duration, delay, step, complete;
            if (!args.length) {
                return this;
            }
            if (args.length > 1) {
                target = args[0] || {};
                options = args[1] || defaultOptions;
            }
            else {
                target = {};
                options = args[0] || defaultOptions;
            }
            step = options.step, complete = options.complete, easing = options.easing;

            duration = mathMax(1, options.duration) || defaultOptions.duration;
            delay = options.delay || 0;
            step = typeof step === "function" ? step : defaultOptions.step;
            complete = typeof complete === "function" ? complete : defaultOptions.complete;

            var tweens = easefuns(easing),
                timestamp = new Date().getTime();

            this.options.duration = duration;

            this.animators.push({
                target: target,
                timestamp: timestamp,
                time: 0,//current time position
                start: timestamp + delay,
                stop: false,
                duration: duration,
                easefy: function (t, d) {
                    return tweens.length === 1 ? tweens(t / d) : tweens(t, 0, 1, d);
                },
                complete: function (target, percent) {
                    complete(target, percent);
                },
            });
            return this;
        },
        setOptions: function (newOptions) {
            var options = this.options;
            var duration = Math.max(1, pack("number", newOptions.duration, 500));
            options.duration = duration;
            return this;
        },
        isDoned: function () {
            var animators = this.animators;
            var length = animators.length,
                i = 0;
            var doneCount = 0;
            for (; i < length; i++) {
                if (animators[i].isDone) {
                    //animators[i] = animators[length - 1];
                    //animators.pop();
                    //length--;
                    doneCount++;
                }
                else {
                    //i++;
                }
            }
            return doneCount !== length;
        },
        fire: function (step, complete) {
            var animators = this.animators;
            if (!animators.length) {
                complete();
            }
            var timer;
            //console.log(this.animators)
            var animation = function () {
                var animated = this;
                this.running = true;
                function loop () {
                    if (animated.running) {
                        runAnimation(animators);
                        step && step();
                        if (animated.isDoned()) {
                            timer = requestAnimationFrame(loop);
                        }
                        else {
                            //me.running = false;
                            //me.stop(1);
                            step && step(1);
                            complete && complete.call(animated);
                        }
                    }
                }
                loop();
            };
            animation.call(this);
        }
    };

    if (typeof Dalaba !== "undefined") {
        Dalaba.Animation = Animation;
    }

    if (typeof module === "object" && module.exports) {
        module.exports = Animation;
    }
    else if (typeof define === "function" && define.amd) {
        define(function () {
            return Animation;
        });
    }
    return Animation;
});