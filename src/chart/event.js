(function (global) {
    function factory (Dalaba) {
        var document = Dalaba.global.document;

        var DEVICE_PIXEL_RATIO = Dalaba.DEVICE_PIXEL_RATIO;

        var pack = Dalaba.pack;

        var defined = Dalaba.defined;

        var extend = Dalaba.extend;

        var hasTouch = defined(document) && ("ontouchstart" in document);// document.documentElement.ontouchstart !== undefined;

        var normalize = function (e, element) {
            var x, y;
            var event, bbox;
            var sw, sh;

            e = e || global.event;
            if (!e.target)
                e.target = e.srcElement;
            event = e.touches ? e.touches.length ? e.touches[0] : e.changedTouches[0] : e;
            bbox = element.getBoundingClientRect();

            isNaN(sw = element.width / bbox.width) && (sw = 1);
            isNaN(sh = element.height / bbox.height) && (sh = 1);

            if (event.pageX === undefined) {
                x = Math.max(e.x, e.clientX - bbox.left - element.clientLeft) * sw;
                y = (event.clientY - bbox.top - element.clientTop) * sh;
            }
            else {
                x = (event.pageX - bbox.left) * sw;
                y = (event.pageY - bbox.top) * sh;
            }

            x *= pack(function (d) {
                return isNumber(d, true);
            }, element.width / DEVICE_PIXEL_RATIO, element.offsetWidth / bbox.width, 1);
            y *= pack(function (d) {
                return isNumber(d, true);
            }, element.height / DEVICE_PIXEL_RATIO, element.offsetHeight / bbox.height, 1);
            return {
                x: x - pack("number", global.scrollX),// Math.max(document.body.scrollLeft, global.scrollX),
                y: y - pack("number", global.scrollY)// Math.max(document.body.scrollTop, global.scrollY)
            };
        };
        var Event = {
            hasTouch: hasTouch,
            normalize: normalize
        };
        return extend(Event, {
            draggable: function () {
                var sx = 0, sy = 0, dx = 0, dy = 0;
                return {
                    start: function(element, e){
                        sy = normalize(e, element);
                        dx = sx = sy.x;
                        dy = sy = sy.y;
                    },
                    drag: function(element, e){
                        dy = normalize(e, element);
                        dx = dy.x - sx;
                        dy = dy.y - sy;
                    },
                    drop: function(){
                        sx = sy = dx = dy = 0;
                    },
                    getX: function(){
                        return dx;
                    },
                    getY: function(){
                        return dy;
                    },
                    normalize: function(){
                        var length = Math.sqrt(dx * dx + dy * dy),
                            x = dx,
                            y = dy;
                        if(length > 0){
                            x /= length;
                            y /= length;
                        }
                        return {
                            x: x,
                            y: y
                        };
                    }
                };
            }
        });
    }
    return {
        deps: function () {
            var args = Array.prototype.slice.call(arguments, 0);
            return factory.apply(global, [].concat(args));
        }
    };
})(typeof window !== "undefined" ? window : typeof this !== "undefined" ? this : global)