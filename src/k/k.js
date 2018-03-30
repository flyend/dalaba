(function(global, Chart){
    var Layout = require("./layout").deps(Dalaba);

    var isInside = function(x, y, series){
        return !(
            x < pack("number", series.plotX, 0) ||
            x > series.plotWidth + pack("number", series.plotX, 0) ||
            y < pack("number", series.plotY, 0) ||
            y > series.plotHeight + pack("number", series.plotY, 0)
        );
    };
    var xClip = function(t, context, canvas, x, y){
        if(0 !== t){
            context.save();
            t > 0 && context.drawImage(
                canvas,
                x, y, canvas.width * t, canvas.height,
                x, y, canvas.width * t / DEVICE_PIXEL_RATIO, canvas.height / DEVICE_PIXEL_RATIO
            );
            context.restore();
        }
    };

    function K(canvas, options){
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.type = "candlestick";
        
        this.series = [];
        this.init(options);
    }
    K.prototype = {
        constructor: K,
        init: function(options){
            var canvas = this.canvas,
                type = this.type,
                chart = this;
            this.options = extend({}, options);
            this.series = arrayFilter(pack("array", options.series, []), function(series){
                var filter = series.type === type;
                return filter && (
                    series._diffValues = List.diff(series.shapes, series._shapes || [], function(a, b){
                        return a && b && a.open === b.open && a.close === b.close && a.low === b.low && a.high === b.high;
                    }),
                filter);
            });
            Layout.shapes(type, options);

            if(canvas.nodeType === 1){
                this.series.forEach(function(series){
                    if(series.animationEnabled){
                        var image = document.createElement("canvas"),
                            context = image.getContext("2d");
                        Chart.scale(
                            context,
                            pack("number", series.plotWidth + series.plotX, canvas.width),
                            pack("number", series.plotHeight + series.plotY, canvas.height),
                            DEVICE_PIXEL_RATIO
                        );
                        series._image = image;
                        series.shapes.forEach(function(shape){
                            chart.drawShape(context, shape, series);
                        });
                    }
                });
            }
        },
        draw: function(){
            var context = this.context,
                chart = this;
            this.series.forEach(function(series){
                var shapes = series.shapes;
                shapes.forEach(function(shape){
                    chart.drawShape(context, shape, series);
                });
            });
        },
        redraw: function(){
            Layout.shapes(this.type, this.options);
            this.draw();
        },
        drawShape: function(context, shape, series){
            var x = shape.x, y = shape.y,
                x1 = shape.x1, y1 = shape.y1,
                x2, y2 = shape.y2,
                y3 = shape.y3,
                w = Math.round(shape.x1 - shape.x);
            var lineWidth = pack("number", shape.lineWidth, series.lineWidth, 1),
                fillColor = shape.fillColor || series.fillColor || shape.color || series.color,
                borderColor = shape.color || series.color,
                lineColor = shape.lineColor || series.lineColor;
            var isUP = y1 > y,
                linePixel;

            x2 = x + w / 2;
            if(isNumber(shape.current) && shape.current > -1){
                lineWidth = Math.max(1, Math.min(lineWidth, 1) * 2);
            }
            delete shape.current;
            linePixel = fixPixelHalf(x, y, x1, y1, lineWidth);

            x = linePixel[0], y = linePixel[1];
            x1 = linePixel[2], y1 = linePixel[3];
            x2 = fixPixelHalf(x2, lineWidth || 1)[0];

            var addStroke = function(lineWidth, color){
                (context.lineWidth = lineWidth) > 0 && (
                    context.strokeStyle = Color.isColor(color) ? color : isUP ? color[0] : color[1],
                    context.stroke()
                );
            };
            if(series.selected !== false && !lineWidth && y === y1){
                y1 += 1;
            }

            context.save();
            context.beginPath();
            context.moveTo(x, y);//open
            context.lineTo(x, y1);//close
            context.lineTo(x + w, y1);//close
            context.lineTo(x + w, y);//open
            context.lineTo(x, y);
            //context.rect(x, y, w, y1 - y);
            context.fillStyle = fillColor;
            context.fill();
            addStroke(lineWidth, borderColor);
            //high
            context.beginPath();
            context.moveTo(x2, isUP ? y : y1);//open
            context.lineTo(x2, y2);
            addStroke(lineWidth || 1, lineColor);

            //low
            context.beginPath();
            context.moveTo(x2, !isUP ? y : y1);//close
            context.lineTo(x2, y3);
            addStroke(lineWidth || 1, lineColor);
            
            context.restore();
        },
        animateTo: function(context, initialize){
            var chart = this;
            var shapes = [];
            chart.series.forEach(function(series){
                var newData = series.shapes,
                    oldData = series._shapes || [];
                var animators = [];
                if(initialize === true){
                    var mergeShape = series;
                    shapes.push([series, function(timer){
                        mergeShape._timer = timer;
                    }]);
                    animators.push(mergeShape);
                }
                else{
                    series._diffValues.add(function(){
                        //var oldShape = oldData[newIndex],
                        //    mergeShape;
                        return null;
                    }).remove(function(newIndex){
                        var newShape = newData[newIndex],
                            mergeShape;
                        mergeShape = {
                            color: newShape.color,
                            isNULL: newShape.isNULL
                        };
                        shapes.push([newShape, function(timer){
                            mergeShape.x = newShape.x, mergeShape.y = newShape.y;
                            mergeShape.x1 = newShape.x1;
                            mergeShape.x2 = newShape.x2, mergeShape.y2 = newShape.y2;
                            mergeShape.y3 = newShape.y3;
                            mergeShape.y1 = newShape.y + (newShape.y1 - newShape.y) * timer;
                        }]);
                        return mergeShape;
                    }).modify(function(newIndex, oldIndex){
                        var newShape = newData[newIndex],
                            oldShape = oldData[oldIndex],
                            mergeShape;
                        var action = series.action;
                        if(newShape && oldShape){
                            mergeShape = {
                                x: oldShape.x,
                                y: oldShape.y,
                                x1: oldShape.x1,
                                y1: oldShape.y1,
                                y2: oldShape.y2,
                                y3: oldShape.y3,
                                color: newShape.color,
                                isNULL: newShape.isNULL
                            };

                            shapes.push([newShape, function(timer){
                                var y1;
                                if(action === "click"){
                                    if(series.selected !== false){
                                        y1 = newShape.y + (newShape.y1 - newShape.y) * timer;
                                        mergeShape.x = newShape.x, mergeShape.y = newShape.y;
                                        mergeShape.x1 = newShape.x1;
                                        mergeShape.x2 = newShape.x2, mergeShape.y2 = newShape.y2;
                                        mergeShape.y3 = newShape.y3;
                                        mergeShape.y1 = y1;
                                    }
                                    else{
                                        y1 = oldShape.y1 + (oldShape.y - oldShape.y1) * timer;
                                        mergeShape.x = oldShape.x, mergeShape.y = oldShape.y;
                                        mergeShape.x1 = oldShape.x1;
                                        mergeShape.x2 = oldShape.x2, mergeShape.y2 = oldShape.y2;
                                        mergeShape.y3 = oldShape.y3;
                                        mergeShape.y1 = y1;
                                    }
                                }
                                else{
                                    mergeShape.x = oldShape.x + (newShape.x - oldShape.x) * timer;
                                    mergeShape.y = oldShape.y + (newShape.y - oldShape.y) * timer;
                                    mergeShape.x1 = oldShape.x1 + (newShape.x1 - oldShape.x1) * timer;
                                    mergeShape.y1 = oldShape.y1 + (newShape.y1 - oldShape.y1) * timer;
                                    mergeShape.y2 = oldShape.y2 + (newShape.y2 - oldShape.y2) * timer;
                                    mergeShape.y3 = oldShape.y3 + (newShape.y3 - oldShape.y3) * timer;
                                }
                            }]);
                        }
                        return mergeShape;
                    }).each(function(mergeShape){
                        mergeShape && animators.push(mergeShape);
                    });
                }
                series._shapes = series.shapes;
                series._animators = animators;
            });
            return shapes;
        },
        onFrame: function(context, initialize){
            var chart = this;
            this.series.forEach(function(series){
                var animators = series._animators;
                if(initialize === true){
                    animators.forEach(function(series){
                        series._image && xClip(series._timer, context, series._image, 0, 0);
                    });
                }
                else{
                    animators.forEach(function(shape){
                        chart.drawShape(context, shape, series);
                    });
                }
            });
        },
        getShape: function(x, y){
            var length = this.series.length,
                i = 0;
            var series, shapes, shape;
            var kdtree;
            var reset = function(shapes){
                shapes.forEach(function(item){
                    delete item.current;
                });
            };
            var results = [];

            for(; i < length && (series = this.series[i]).selected !== false; i++){
                if(!isInside(x, y, series)){
                    return results;
                }
                reset(shapes = series.shapes);
                kdtree = KDTree(shapes);
                shape = kdtree.nearest({x: x, y: y}, function(a, b){
                    var dx = a.x - b.x;
                    return dx * dx;
                })[0];
                kdtree.destroy();
                if(shape && !shape.isNULL){
                    shape.current = shape.index;
                    results.push({shape: shape, series: series});
                }
                
            }
            return results;
        }
    };

    (Chart.graphers = Chart.graphers || {}).candlestick = K;
    
})(typeof window !== "undefined" ? window : this, Dalaba.Chart)