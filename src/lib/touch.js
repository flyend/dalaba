(function(global) {
    /**
     * TouchJS - v1.0.0
     * 2016-11-04
     * Class Touch
     * @example
     * new Touch(DOM).on({
     *     tap: function(){},
     *     swipe: function(){},
     *     pan: function(){},
     *     press: function(){},
     *     pinch: function(){},
     *     rotate: function(),
     *     translate: function(){},
     *     scale: function(){}
     * });
    */
    var toString = Object.prototype.toString;

    var arraySlice = Array.prototype.slice;

    var defined = function (o) { return typeof o !== "undefined" || o !== null; };

    var isObject = function (o) { return toString.call(o) === "[object Object]"; };

    var isFunction = function (o) { return toString.call(o) === "[object Function]"; };

    var noop = function () {};

    var EVENT_TOUCH_START = "touchstart",
        EVENT_TOUCH_MOVE = "touchmove",
        EVENT_TOUCH_END = "touchend",
        EVENT_TOUCH_CANCEL = "touchcancel";


    var defaultFunction = function(fn) {
        return isFunction(fn) ? fn : noop;
    };
    

    var Touch = function (node, options) {
        return new Touch.init(node, options);
    };

    Touch.init = function (node, options) {
        if(node && node.nodeType !== 1){
            throw Error("not a HTMLElement.");
        }
        this.node = node;
        this.options = isObject(options) ? options : {};
        this.globalTimer = null;
        this.v1 = [];
        this.v2 = [];

        return this;
    };

    var touchProto = Touch.prototype;

    touchProto = {
        constructor: Touch,
        events: {
            touchStart: null,
            touchMove: null,
            touchEnd: null,
            touchCancel: null
        },
        on: function(options) {
            var node = this.node;
            var useCapture = options.useCapture,
                isScrolling = options.isScrolling === true;
            var events = this.events;

            var timestamp;
            
            var firstTouched = {
                isFirst: false,
                isMultiPoint: false,
                isPressed: false
            };
            var lastScalePoint = {x: 0, y: 0};

            var callback;

            var touch = this;


            useCapture = !(defined(useCapture) ? !useCapture : useCapture);

            if(arguments[1]){
                isFunction(callback = arguments[1] || noop) || noop;
            }
            var onPress = defaultFunction(options.press),
                onSwipe = defaultFunction(options.swipe),
                onTap = function(e, touch){
                    var v1 = touch.v1[0],
                        v2 = arraySlice.call(e.changedTouches)[0];
                    var dx = v1.clientX - v2.clientX,
                        dy = v1.clientY - v2.clientY;

                    if(0.1 * 0.1 - dx * dx - dy * dy > 0.001){
                        defaultFunction(options.tap).call(this, e, touch);
                    }
                },
                onPinch = function(e, touch) {
                    var v1 = touch.v1,
                        v2 = touch.v2;
                    if(v2.length > 1 && v1.length > 1){
                        var target = e.target,
                            bbox = target.getBoundingClientRect();
                        
                        var v2x = v2[1].clientX - v2[0].clientX,
                            v2y = v2[1].clientY - v2[0].clientY;
                        var length = +(v2x * v2x > lastScalePoint.x * lastScalePoint.x || -1);
                        var scale = Math.sqrt(v2x * v2x + v2y * v2y) / bbox.width;
                        //scale = Math.sqrt(source.x * source.x + source.y * source.y) / Math.sqrt(target.x * target.x + target.y * target.y);

                        lastScalePoint.x = v2x;

                        e.originEvent = {
                            vector: {
                                length: length,//<1 -1>
                                scale: scale
                            }
                        };
                        
                        defaultFunction(options.pinch).call(this, e, touch);
                    }
                };


            events.touchStart = function(e) {
                var node = this;
                
                touch.v1 = arraySlice.call(e.touches);
                timestamp = new Date().getTime();
                firstTouched.isPressed = true;

                touch.status = "start";
                setTimeout(function() {
                    firstTouched.isMultiPoint || onPress.call(node, e, touch);//press
                }.call(touch), 250);
            };
            events.touchMove = function(e) {
                var node = this;
                touch.v2 = arraySlice.call(e.touches);//simple point
                if(!firstTouched.isFirst){
                    firstTouched.isFirst = !firstTouched.isFirst;
                    touch.status = "start";

                    firstTouched.isMultiPoint = touch.v2.length > 1;
                    if(firstTouched.isMultiPoint){
                        lastScalePoint.x = touch.v2[1].clientX - touch.v2[0].clientX;
                        lastScalePoint.y = touch.v2[1].clientY - touch.v2[0].clientY;
                    }
                    else{
                        onSwipe.call(node, e, touch);
                    }
                }
                touch.status = "move";

                if(firstTouched.isMultiPoint){
                    onPinch.call(node, e, touch);
                }
                else{
                    onSwipe.call(node, e, touch);
                }

                if(touch.isHorizontal() || firstTouched.isMultiPoint || isScrolling){
                    e.preventDefault && e.preventDefault();
                    return false;
                }
            };
            events.touchEnd = function(e) {
                var node = this;
                touch.status = "end";
                firstTouched.isPressed && onTap.call(node, e, touch);
                (firstTouched.isMultiPoint = firstTouched.isFirst = firstTouched.isPressed = false) || onSwipe.call(node, e, touch);
                touch.destroy();
            };
            events.touchCancel = function(){
                touch.destroy();
            };

            this.free();

            node.addEventListener(EVENT_TOUCH_START, events.touchStart, useCapture);
            node.addEventListener(EVENT_TOUCH_MOVE, events.touchMove, useCapture);
            node.addEventListener(EVENT_TOUCH_END, events.touchEnd, useCapture);
            node.addEventListener(EVENT_TOUCH_CANCEL, events.touchCancel , useCapture);

            return this;
        },
        free: function() {
            var options = this.options,
                useCapture = options.useCapture;
            var node = this.node,
                events = this.events;
            useCapture = !(defined(useCapture) ? !useCapture : useCapture);

            this.destroy();
            [
                [events.touchStart, EVENT_TOUCH_START],
                [events.touchMove, EVENT_TOUCH_MOVE],
                [events.touchEnd, EVENT_TOUCH_END],
                [events.touchCancel, EVENT_TOUCH_CANCEL],
            ].forEach(function(event){
                event[0] && (node.removeEventListener(event[1], event[0], useCapture), event[0] = null);
            });
        },
        isHorizontal: function() {
            var v1 = this.v1[0],
                v2 = this.v2[0];
            var x1, y1, x2, y2;
            x1 = v1.clientX, y1 = v1.clientY;
            x2 = v2.clientX, y2 = v2.clientY;
            return Math.abs(x2 - x1) > Math.abs(y2 - y1);
        },
        destroy: function() {
            /*this.v1 = [];
            this.v2 = [];*/
        }
    };
    Touch.init.prototype = touchProto;
    
    if (typeof module === "object" && module.exports) {
        module.exports = Touch;
    }
    else if (typeof define === "function" && define.amd) {
        define(function(){
            return Touch;
        });
    }
    else {
        (typeof Dalaba !== "undefined" ? Dalaba : global).Touch = Touch;
    }
})(typeof window !== "undefined" ? window : this);