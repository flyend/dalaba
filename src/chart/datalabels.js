(function () {
    var hideOverlappingLabels = function (labels) {
        var len = labels.length,
            label,
            i,
            j,
            label1,
            label2,
            padding;

        for (i = 0; i < len; i++) {
            label = labels[i];
            if (label) {
                label.oldOpacity = label.opacity;
                label.newOpacity = 1;
            }
        }

        labels.sort(function (a, b) {
            return (b.labelrank || 0) - (a.labelrank || 0);
        });

        for (i = 0; i < len; i++) {
            label1 = labels[i];
            for (j = i + 1; j < len; ++j) {
                label2 = labels[j];
                if (label1 && label2 && label1.placed && label2.placed && label1.newOpacity !== 0 && label2.newOpacity !== 0) {
                    padding = 0;
                    if (Intersection.aabb({
                        x: label1.translateX,
                        y: label1.translateY,
                        width: label1.width - padding,
                        height: label1.height - padding
                    }, {
                        x: label2.translateX,
                        y: label2.translateY,
                        width: label2.width - padding,
                        height: label2.height - padding
                    })) {
                        (label1.labelrank < label2.labelrank ? label1 : label2).newOpacity = 0;
                    }
                }
            }
        }
        labels.forEach(function (label) {
            var newOpacity;
            if (label) {
                newOpacity = label.newOpacity;
                if (label.oldOpacity !== newOpacity && label.placed) {
                    if (label.visibled !== false) {
                        label.visibled = !!newOpacity;
                    }
                }
            }
        });
    };
    function factoy (Dalaba, Text) {

        function labels () {
            var align = noop, vertical = noop;
            var newValue;

            var ret = {
                vertical: function (_) {
                    vertical = _;
                    return ret;
                },
                align: function (_) {
                    align = _;
                    return ret;
                },
                value: function (_) {
                    newValue = _;
                    return ret;
                },
                overlapping: hideOverlappingLabels,
                call: function (shape, series, context) {
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
                    var useHTML = dataLabels.useHTML;
                    var props = {
                        position: "absolute",
                        color: options.color,
                        "white-space": "nowrap",
                        "line-height": "100%",
                        "font-size": options.fontSize,
                        visibility: "hidden",
                        cursor: "pointer"
                    };
                    var dataLabel = {
                        x: 0, y: 0,
                        width: 0, height: 0,
                        isNULL: shape.isNULL
                    };

                    newValue = null;

                    if (shape.selected !== false && series.selected !== false && options.enabled === true && defined(value)) {
                        var tag, bbox;
                        if (useHTML === true) {
                            tag = document.createElement("div");
                            tag.innerHTML = value;
                            setStyle(tag, props);
                            document.body.appendChild(tag);
                            bbox = tag.getBoundingClientRect();
                            document.body.removeChild(tag);
                        }
                        else {
                            tag = Text.HTML(Text.parseHTML(value), context, options);
                            bbox = tag.getBBox();
                        }

                        x = pack("number",
                            align.call(isObject(shape.dataLabels) ? shape.dataLabels : series.dataLabels, options.align, bbox, options), shape.x0, shape.x, 0
                        );
                        y = pack("number",
                            vertical.call(isObject(shape.dataLabels) ? shape.dataLabels : series.dataLabels, verticalAlign, bbox, options), shape.y0, shape.y, 0
                        );

                        x = isFunction(xCallback) ? x + pack("number", xCallback.call(shape, x, bbox, shape, value, series)) : (x + options.x);
                        y = isFunction(yCallback) ? y + pack("number", yCallback.call(shape, y, bbox, shape, value, series)) : (y + options.y);
                        if (rotation) {
                            if (angle > 0 && angle < PI) {
                                //x = x + bbox.width / 2;
                                //y = y + bbox.height;
                            }
                            else if (angle >= PI && angle < PI * 1.5) {
                                x += bbox.width;
                                y += bbox.height;
                            }
                            else if (angle >= PI * 1.5 && angle < PI2) {
                                x += bbox.width;
                                y += bbox.height;
                            }
                            else { 
                                y += bbox.height;
                            }
                        }
                        dataLabel = options;
                        dataLabel.visibled = dataLabel.allowOverlap === true || (mathCeil(x) >= mathFloor(series.plotX) && x < series.plotX + series.plotWidth && y > series.plotY && y < series.plotY + series.plotHeight);// options.visibled;
                        dataLabel.value = value;
                        dataLabel.isNULL = shape.isNULL;
                        dataLabel.angle = angle;
                        dataLabel.translateX = x, dataLabel.translateY = y;
                        dataLabel.width = bbox.width, dataLabel.height = bbox.height;
                        if (useHTML === true) {
                            setStyle(tag, { left: x + bbox.width / 2 * (dataLabel.align === "left") + "px", top: y - bbox.height + "px", visibility: "visible"});
                            dataLabel.valueHTML = tag.outerHTML;
                        }
                    }
                    newValue = undefined;
                    return dataLabel;
                },
                render: function (context, dataLabel) {
                    var tag, fontFamily;
                    if (!dataLabel.isNULL && dataLabel && dataLabel.visibled && dataLabel.useHTML !== true) {
                        tag = Text.HTML(Text.parseHTML(dataLabel.value), context, dataLabel);
                        fontFamily = dataLabel.fontFamily === "inherit" ? (getStyle(context.canvas, "font-family") || "Arial") : dataLabel.fontFamily;
                        context.save();
                        context.textAlign = "start";
                        context.textBaseline = "alphabetic";
                        context.fillStyle = dataLabel.color;
                        context.font = dataLabel.fontStyle + " " + dataLabel.fontWeight + " " + dataLabel.fontSize + " " + fontFamily;
                        context.translate(dataLabel.translateX, dataLabel.translateY);// + dataLabel.height
                        dataLabel.rotation && context.rotate(dataLabel.angle);
                        tag.toCanvas(context);
                        context.restore();
                    }
                }
            };
            return ret;
        }
        labels.options = function (shapeLabels, dataLabels) {
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
                color: shapeStyle.color || labelStyle.color || shapeStyle.color || "#000",
                x: isFunction(dataLabels.x) ? dataLabels.x : pack("number", shapeLabels.x, dataLabels.x, 0),
                y: isFunction(dataLabels.y) ? dataLabels.y : pack("number", shapeLabels.y, dataLabels.y, 0),
                useHTML: dataLabels.useHTML === true || undefined,
                allowOverlap: dataLabels.allowOverlap,
                visibled: true
            };
        };
        labels.value = function (shape, formatter, newValue) {
            var value = shape.value,
                labelValue = shape._value;
            var v = labelValue;

            if (defined(newValue)) {
                value = v = newValue;
            }
            if (value !== null && isFunction(formatter)) {
                v = formatter.call({
                    x: shape.key,
                    y: value,
                    key: shape.key,
                    value: value,
                    labelValue: labelValue,
                    index: shape.index,
                    color: shape.color,
                    series: shape.series,
                    point: shape,
                    total: shape.total,
                    percentage: shape.percentage
                }, value);
            }
            return value !== null && defined(v) ? v : null;
        };
    
        return labels();
    }
    
    return {
        deps: function () {
            return factoy.apply(global, [].slice.call(arguments, 0));
        }
    };
}).call(typeof window !== "undefined" ? window : this)