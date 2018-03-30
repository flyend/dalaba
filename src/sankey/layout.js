(function(global) {

    var sankeyInterpolate = function(a, b, t) {
        return a * (1 - t) + b * t;
    };

    var sankeyCurve = function(startX, endX, startY, endY) {
        var curvature = 0.5;
        var x0 = startX,
            x1 = endX,
            x2 = sankeyInterpolate(x0, x1, curvature),
            x3 = sankeyInterpolate(x0, x1, 1 - curvature),
            y0 = startY,
            y1 = endY;
        return [x0, y0, x2, y0, x3, y1, x1, y1];
    };

    var sankeySum = function(arrays, key) {
        var n = arrays.length,
            i = n & 1;
        var v = i ? arrays[0][key] : 0;
        while (i < n) {
            v += arrays[i++][key] + arrays[--n][key];
        }
        return v;
    };

    var sankeyUnique = function(arrays){
        var length = arrays.length,
            i = -1;
        var ret = [], o;
        var maps = {};

        while(++i < length){
            o = arrays[i];
            if(!(o.data.source in maps)){
                maps[o.data.source] = 1;
                ret.push(o);
            }
        }
        return ret;
    };
    var sankeyIndexOf = (function(){
        var filter = function(a, b){
            return a === b;
        };
        var indexOf = function(nodes, key){
            var i = -1, n = nodes.length;
            while(++i < n && !filter(nodes[i], key));
                return i < n ? i : -1;
        };
        
        return indexOf;
    })();

    var Sankey = function() {
        var sankey = {},
            nodeWidth = NaN,
            minWidth = 1e-3,
            maxWidth = 1e3,
            nodePadding = 8,
            nodeSpacing = [1, 1],//x, y spacing
            size = [1, 1],
            nodes = [],
            links = [];
        var dx = 0, dy = 0;

        sankey.data = function(data) {
            (data || []).forEach(function(d, i){
                var source = d.source;
                typeof source !== "undefined" && nodes.push({name: source, data: d});
                links.push({ "source": d.source, "target": d.target, "value": +d.value, weight: d.weight, index: i});
            });
            data.forEach(function(d){
                var target = d.target;
                typeof target !== "undefined" && nodes.push({name: target, data: d});
            });
            var keys = [];
            nodes = sankeyUnique(nodes).map(function(d){
                keys.push(d.name);
                return d.data;
            });

            data.forEach(function(d, i) {
                if(d.empty){
                    links[i].target = links[i].source = sankeyIndexOf(keys, d.source);
                    links[i].empty = true;
                }
                else{
                    links[i].source = sankeyIndexOf(keys, d.source);
                    links[i].target = sankeyIndexOf(keys, d.target);
                }
            });
            nodes.forEach(function(node){
                node.sourceLinks = [];
                node.targetLinks = [];
            });
            links.forEach(function(link){
                var source = link.source,
                    target = link.target;
                if (typeof source === "number") source = link.source = nodes[source];
                if (typeof target === "number") target = link.target = nodes[target];

                if(source && target){
                    source.sourceLinks.push(link);
                    target.targetLinks.push(link);
                }
            });
            return sankey;
        };

        sankey.nodeWidth = function(_) {
            if (!arguments.length) return nodeWidth;
            if (isNumber(_, true)) nodeWidth = _;
            return sankey;
        };

        sankey.minWidth = function(_) {
            if (!arguments.length) return minWidth;
            if (isNumber(_, true)) minWidth = _;
            return sankey;
        };

        sankey.maxWidth = function(_) {
            if (!arguments.length) return maxWidth;
            if (isNumber(_, true)) maxWidth = _;
            return sankey;
        };

        sankey.nodePadding = function(_) {
            if (!arguments.length) return nodePadding;
            nodePadding = +_;
            return sankey;
        };
        sankey.nodeSpacing = function(_){
            return !_ ? nodeSpacing : (nodeSpacing = _, sankey);
        };

        sankey.nodes = function(_) {
            if (!arguments.length) return nodes;
            nodes = _;
            return sankey;
        };

        sankey.links = function(_) {
            if (!arguments.length) return links;
            links = _;
            return sankey;
        };

        sankey.size = function(_) {
            if (!arguments.length) return size;
            size = _;
            return sankey;
        };

        sankey.translate = function(x, y) {
            return arguments.length ? (dx = x, dy = y, sankey) : [dx, dy];
        };

        sankey.layout = function(iterations) {
            if(iterations === "none"){
                computeNodeGroup();
            }
            return sankey;
        };

        function computeNodeGroup() {
            var width = size[0],
                height = size[1];

            var maxValueGroup = function(groups){
                var max = 0;
                groups.forEach(function(groups){
                    max = Math.max(max, sankeySum(groups, "value"));
                });
                return max;
            };
            var translateGroup = function(groups, height, curHeight){
                groups.forEach(function(node){
                    node.y += (height - curHeight) / 2 + dy;
                    node.x += dx;
                });
            };
            var groups = partition(nodes, function(a, b){
                return a.group === b.group;
            });
            var groupLength = groups.length;
            var groupSum = maxValueGroup(groups);
            var defaultNodeWidth = width / groupLength - nodeSpacing[0] * ~-groupLength;
            groups.forEach(function(groups, i) {
                var nextY = 0;
                groups.forEach(function(node) {
                    var x = i * (width / groupLength),
                        h = 0;
                    if(defined(node.value)){
                        h = interpolate(node.value, 0, groupSum, 0, height - nodeSpacing[1] * ~-groups.length);
                    }
                    node.x = x;
                    node.y = nextY;
                    node.width = Math.max(minWidth, Math.min(maxWidth, pack("number", nodeWidth, defaultNodeWidth, minWidth, 0)));
                    node.dy = h;
                    nextY += h + nodeSpacing[1];
                });
                translateGroup(groups, height, nextY - nodeSpacing[1]);
            });
            nodes.forEach(function(node){
                var sourceLinks = node.sourceLinks,
                    targetLinks = node.targetLinks;
                /*var length = sourceLinks.length + targetLinks.length;
                var linkHeight = node.dy / length,//each box height
                    nextHeight = 0;*/
                var sourceHeight = 0,
                    targetHeight = 0;
                var sourceWeight = 0,
                    targetWeight = 0;
                var linkHeight;

                node.sourceLinks.forEach(function(link){
                    sourceWeight += link.weight;
                });
                node.targetLinks.forEach(function(link){
                    targetWeight += link.weight;
                });
                
                node.linkArgs = [];
                node.sourceLinks.forEach(function(link){
                    if (link.weight) {
                        linkHeight = node.dy * (link.weight / sourceWeight);
                    }
                    else {
                        linkHeight = (node.dy / sourceLinks.length);
                    }
                    link.sy = sourceHeight;
                    link.sy0 = linkHeight + link.sy;
                    //sy += link.dy;
                    
                    link.x = node.x;
                    link.y = node.y + sourceHeight;
                    link.dx = node.width;
                    link.dy = link.sy0;
                    sourceHeight += linkHeight;
                });
                //console.log(node.name, node.targetLinks)
                
                node.targetLinks.forEach(function(link){
                    if (link.weight) {
                        linkHeight = node.dy * (link.weight / targetWeight);
                    }
                    else {
                        linkHeight = (node.dy / targetLinks.length);
                    }
                    link.ty = targetHeight;
                    link.ty0 = linkHeight + link.ty;
                    //ty += link.dy;
                    link.x = node.x;
                    link.y = node.y + targetHeight;
                    link.dx = node.width;
                    link.dy = link.ty0;
                    targetHeight += linkHeight;
                });
            });
        }

        return sankey;
    };

    function factoy() {
        var percentage = Numeric.percentage;

        var sankeySmooth = function(startX, endX, startY, endY) {
            var curvature = 0.5;
            var spacing = Math.abs(endY - startY) / 4;
            var x0 = startX,
                x1 = endX,
                x2 = sankeyInterpolate(x0 + spacing, x1 + spacing, curvature),
                x3 = sankeyInterpolate(x0 + spacing, x1 + spacing, curvature),
                y0 = startY,
                y1 = endY;
            return [x0, y0, x2, y0, x3, y1, x1, y1];
        };
        var resetTransform = function(series, transform) {
            var size = series.size;
            var x = series.plotX,
                y = series.plotY,
                width = pack("number", size, size && size[0], series.plotWidth),
                height = pack("number", size && size[1], series.plotHeight);
            var scale = (transform || {}).scale,
                translate = (transform || {}).translate;
            
            if (defined(translate)) {
                x += translate[0];
                y += translate[1];
            }
            if (defined(scale) && scale !== 1) {
                scale = Math.max(pack("number", scale, 1), 1e-5);
                width = width * scale;
                height = height * scale;
                x += (series.plotWidth - width) / 2;
                y += (series.plotHeight - height) / 2;
            }
            return {
                x: x,
                y: y,
                width: width,
                height: height
            };
        };
        return function(type, options){
            
            options.panel.forEach(function(pane){
                var series = arrayFilter(pane.series, function(series){
                    return series.type === type;
                });
                series.forEach(function(series){
                    var plotX, plotY, plotWidth, plotHeight;
                    var minWidth,
                        maxWidth,
                        percentWidth,
                        boxWidth = series.point && (minWidth = series.point.minWidth, maxWidth = series.point.maxWidth, series.point.width);

                    var transform = resetTransform(series, series.transform);

                    plotX = pack("number", transform.x, 0);
                    plotY = pack("number", transform.y, 0);
                    plotWidth = pack("number", transform.width);
                    plotHeight = pack("number", transform.height);

                    isNumber(percentWidth = percentage(plotWidth, minWidth)) && (minWidth = percentWidth);
                    isNumber(percentWidth = percentage(plotWidth, maxWidth)) && (maxWidth = percentWidth);
                    isNumber(percentWidth = percentage(plotWidth, boxWidth)) && (boxWidth = percentWidth);

                    var shapes = series.shapes;
                    var nodes = series.nodes = [];
                    var sankey = Sankey().nodeWidth(boxWidth)
                        .minWidth(minWidth > maxWidth ? maxWidth : minWidth)
                        .maxWidth(minWidth > maxWidth ? minWidth : maxWidth)
                        .nodeSpacing([15, 20])
                        .translate(plotX, plotY)
                        .size([plotWidth, plotHeight]);
                    
                    sankey.data(shapes).layout("none");

                    sankey.links().forEach(function(link) {
                        if(link.target && link.source) {
                            if(link.empty){
                                link.source.linkArgs.push({
                                    from: sankeyCurve(
                                        link.source.x + link.target.width,
                                        link.target.x + link.target.width + 15,
                                        link.source.y + link.sy,
                                        link.source.y + link.sy0
                                    ),
                                    to: sankeyCurve(
                                        link.target.x + link.target.width + 15, link.source.x + link.source.width,
                                        link.target.y + link.ty0 + 2, link.source.y + link.sy0
                                    ),
                                    empty: true,
                                    source: link.source,
                                    target: link.target,
                                    weight: link.weight,
                                    index: link.index,
                                    size: link.dy
                                });
                            }
                            else if(link.source.group === link.target.group){
                                link.source.linkArgs.push({
                                    from: sankeySmooth(
                                        link.source.x + link.target.width, link.target.x + link.target.width,
                                        link.source.y + link.sy, link.target.y + link.ty
                                    ),
                                    to: sankeySmooth(
                                        link.target.x + link.target.width, link.source.x + link.source.width,
                                        link.target.y + link.ty0, link.source.y + link.dy
                                    ),
                                    source: link.source,
                                    target: link.target,
                                    weight: link.weight,
                                    index: link.index,
                                    size: link.dy
                                });
                            }
                            else if(link.source.group < link.target.group){
                                link.source.linkArgs.push({
                                    from: sankeyCurve(
                                        link.source.x + link.source.width, link.target.x,
                                        link.source.y + link.sy, link.y// + link.dy
                                    ),
                                    to: sankeyCurve(
                                        link.target.x, link.source.x + link.source.width,
                                        link.target.y + link.dy, link.source.y + link.sy0
                                    ),
                                    source: link.source,
                                    target: link.target,
                                    weight: link.weight,
                                    index: link.index,
                                    size: link.dy
                                });
                            }
                            else{
                                link.source.linkArgs.push({
                                    from: sankeyCurve(
                                        link.source.x, link.target.x + link.target.width,
                                        link.source.y + link.sy, link.target.y + link.ty
                                    ),
                                    to: sankeyCurve(
                                        link.target.x + link.target.width, link.source.x,
                                        link.target.y + link.ty0, link.source.y + link.sy0
                                    ),
                                    source: link.source,
                                    target: link.target,
                                    weight: link.weight,
                                    index: link.index,
                                    size: link.dy
                                });
                            }
                        }
                    });
                    sankey.nodes().forEach(function(node, i){
                        nodes.push(extend(node, {
                            name: node.source,
                            key: null,
                            index: i,
                            x: node.x,
                            y: node.y,
                            width: node.width,
                            height: node.dy
                        }));
                    });
                });
            });
        };
        //return Sankey;
    }
    return {
        deps: function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(global, [].concat(args));
        }
    };
}).call(typeof window !== "undefined" ? window : this)