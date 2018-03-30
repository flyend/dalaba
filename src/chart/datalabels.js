(function() {
    var PI = Math.PI;

    var noop = function() {};

    function factoy(Dalaba, Text) {
        var defined = Dalaba.defined;

        var pack = Dalaba.pack;

        var isFunction = Dalaba.isFunction;

        var isObject = Dalaba.isObject;

        function labels() {
            var align = noop, vertical = noop;
            var newValue;

            var ret = {
                vertical: function(_){
                    vertical = _;
                    return ret;
                },
                align: function(_){
                    align = _;
                    return ret;
                },
                value: function(_){
                    newValue = _;
                    return ret;
                },
                call: function(shape, series, context) {
                    var dataLabels = series.dataLabels || {},
                        shapeLabels = shape.dataLabels || {};
                    var options = labels.options(shapeLabels, dataLabels),
                        verticalAlign = options.verticalAlign;
                    var value = labels.value(shape, dataLabels.formatter, newValue);
                    var xCallback = options.x,
                        yCallback = options.y;

                    var bbox, x, y;
                    var rotation = options.rotation,
                        angle = rotation % 360 * PI / 180;
                    if (shape.selected !== false && series.selected !== false && options.enabled === true && defined(value)) {
                        var tag = Text.HTML(Text.parseHTML(value), context, options);
                        bbox = tag.getBBox();
                        x = pack("number",
                            align.call(isObject(shape.dataLabels) ? shape.dataLabels : series.dataLabels, options.align, bbox), shape.x0, shape.x, 0
                        );
                        y = pack("number",
                            vertical.call(isObject(shape.dataLabels) ? shape.dataLabels : series.dataLabels, verticalAlign, bbox), shape.y0, shape.y, 0
                        );

                        x = isFunction(xCallback) ? x + pack("number", xCallback.call(shape, x, bbox, shape, value, series)) : (x += options.x);
                        y = isFunction(yCallback) ? y + pack("number", yCallback.call(shape, y, bbox, shape, value, series)) : (y += options.y);
                        if (rotation) {
                            if(angle > 0 && angle < PI){
                                //x = x + bbox.width / 2;
                                //y = y + bbox.height;
                            }
                            else if(angle >= PI && angle < PI * 1.5){
                                x += bbox.width;
                                y += bbox.height;
                            }
                            else if(angle >= PI * 1.5 && angle < PI * 2){
                                x += bbox.width;
                                y += bbox.height;
                            }
                            else{
                                y += bbox.height;
                            }
                        }

                        context.save();
                        context.textAlign = "start";
                        context.textBaseline = "alphabetic";
                        context.fillStyle = options.color;
                        context.font = options.fontStyle + " " + options.fontWeight + " " + options.fontSize + " " + (options.fontFamily);
                        context.translate(x, y);
                        rotation && context.rotate(angle);
                        tag.toCanvas(context);
                        context.restore();
                    }
                }
            };
            return ret;
        }
        labels.options = function(shapeLabels, dataLabels) {
            var shapeStyle = shapeLabels.style || {},
                labelStyle = dataLabels.style || {};
            return {
                enabled: shapeLabels.enabled || dataLabels.enabled,
                align: shapeLabels.align || dataLabels.align,
                verticalAlign: shapeLabels.verticalAlign || dataLabels.verticalAlign,
                rotation: pack("number", shapeLabels.rotation, dataLabels.rotation, 0),
                shapeStyle: shapeLabels,
                labelStyle: dataLabels,
                fontStyle: pack("string", shapeStyle.fontStyle, labelStyle.fontStyle, "normal"),
                fontWeight: pack("string", shapeStyle.fontWeight, labelStyle.fontWeight, "normal"),
                fontSize: pack("string", shapeStyle.fontSize, labelStyle.fontSize, "12px"),
                fontFamily: pack("string", shapeStyle.fontFamily, labelStyle.fontFamily, "Arial"),
                lineHeight: pack("string", shapeStyle.lineHeight, labelStyle.lineHeight, "normal"),
                color: shapeStyle.color || labelStyle.color || "#000",
                x: isFunction(dataLabels.x) ? dataLabels.x : pack("number", shapeLabels.x, dataLabels.x, 0),
                y: isFunction(dataLabels.y) ? dataLabels.y : pack("number", shapeLabels.y, dataLabels.y, 0)
            };
        };
        labels.value = function(shape, formatter, newValue){
            var value = shape.value,
                labelValue = shape._value;
            var v = labelValue;

            if(shape._formatterValue)
                return shape._formatterValue;

            if(defined(newValue)){
                value = v = newValue;
            }
            if (value !== null && isFunction(formatter) && !defined(shape._formatterValue)) {
                v = formatter.call({
                    x: shape.key,
                    key: shape.key,
                    value: value,
                    labelValue: labelValue,
                    color: shape.color,
                    series: shape.series,
                    point: shape,
                    total: shape.total,
                    percentage: shape.percentage
                }, value);
                shape._formatterValue = v;
            }
            return value !== null && defined(v) ? v : null;
        };
    
        return labels();
    }
    
    return {
        deps: function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
}).call(typeof window !== "undefined" ? window : this)