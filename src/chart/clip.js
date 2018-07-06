(function () {

    var lerp = function (a, b, t) {
        return a + b * t;
    };

    function factory (angle2arc) {

        var Horizontal = function (image, clipX, clipY, clipWidth, clipHeight) {
            var width = clipWidth / DEVICE_PIXEL_RATIO,
                height = clipHeight / DEVICE_PIXEL_RATIO;
            return {
                clip: function (context, timer) {
                    if (timer > 0) {
                        context.save();
                        context.drawImage(
                            image,
                            clipX, clipY, clipWidth * timer, clipHeight,
                            clipX, clipY, width * timer, height
                        );
                        context.restore();
                    }
                }
            };
        };

        var Vertical = function (image, clipX, clipY, clipWidth, clipHeight) {
            return {
                clip: function (context, timer) {
                    if (timer > 0) {
                        context.save();
                        context.drawImage(
                            image,
                            clipX, clipY, clipWidth, clipHeight * timer,
                            clipX, clipY, clipWidth / DEVICE_PIXEL_RATIO, clipHeight * timer / DEVICE_PIXEL_RATIO
                        );
                        context.restore();
                    }
                }
            }
        };

        var Quadrant = function (image, clipX, clipY, clipRadius) {
            var startAngle = 0,
                endAngle = PI2;
            var clip = {
                angle: function (_, __) {
                    isNumber(_, true) && (startAngle = _), isNumber(__, true) && (endAngle = __);
                    return clip;
                }
            };
            clip.clip = function (context, timer) {
                if (timer > 0) {
                    context.save();
                    angle2arc(
                        clipX, clipY,
                        clipRadius / 2, 0,
                        startAngle, lerp(startAngle, endAngle, timer),
                        false//close path
                    )(context);
                    //context.fill();
                    context.clip();
                    context.drawImage(
                        image,
                        0, 0, image.width, image.height,
                        0, 0, image.width / DEVICE_PIXEL_RATIO, image.height / DEVICE_PIXEL_RATIO
                    );
                    context.restore();
                }
            };
            return clip;
        };

        var Rect = function (clipX, clipY, clipWidth, clipHeight) {
            return {
                clip: function (context) {
                    context.save();
                    context.beginPath();
                    context.moveTo(clipX, clipY);
                    context.lineTo(clipX + clipWidth, clipY);
                    context.lineTo(clipX + clipWidth, clipY + clipHeight);
                    context.lineTo(clipX, clipY + clipHeight);
                    context.lineTo(clipX, clipY);
                    //context.stroke();
                    context.clip();
                    context.restore();
                }
            };
        };

        return {
            Horizontal: Horizontal,
            Vertical: Vertical,
            Quadrant: Quadrant,
            Rect: Rect
        };
    }

    return {
        deps: function () {
            return factory.apply(null, [].slice.call(arguments, 0));
        }
    };
})()