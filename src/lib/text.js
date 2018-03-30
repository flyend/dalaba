(function(global){

    var document = global.document;

    var sin = Math.sin,
        cos = Math.cos,
        abs = Math.abs;

    var _toString = Object.prototype.toString;

    var isArray = function(v){
        return _toString.call(v) === "[object Array]";
    };

    /**
     * Text
    */
    var Text = {
        _cache: {
            width: {},
            height: {}
        },
        context: function(context){
            Text._context = context;
        },
        getWidth: function(text, style){
            var fontFamily = (style = style || {}).fontFamily || "sans-serif",
                fontSize = style.fontSize || "12px",
                fontWeight = style.fontWeight || "normal",
                fontStyle = style.fontStyle || "normal",
                lineHeight = style.lineHeight || "normal";
            var font = [
                fontStyle,
                fontWeight,
                fontSize + "/" + lineHeight,
                fontFamily
            ].join(" ");
            text = "" + (text || "Eg");

            var width = 0;

            var id = text + "-" + font;
            if(Text._cache.width[id]){
                return Text._cache.width[id];
            }
            var context = Text._context,
                canvas;
            
            if(document && document.createElement){
                context = (canvas = document.createElement("canvas")).getContext("2d");
            }
            else if(context){
                canvas = context.canvas;
            }
            if(!context){
                return 0;
            }
            Text._context = context;
            //console.log(font, text)
            
            text.split("\n").forEach(function(){
                context.font = font;
                width = Math.max(width, context.measureText(text).width);
            });
            return (Text._cache.width[id] = width);
        },
        getHeight: function(text, style){
            var fontFamily = (style = style || {}).fontFamily || "sans-serif",
                fontSize = style.fontSize || "12px",
                fontWeight = style.fontWeight || "normal",
                fontStyle = style.fontStyle || "normal",
                lineHeight = style.lineHeight || "normal";

            var font = [
                fontStyle,
                fontWeight,
                fontSize + "/" + lineHeight,
                fontFamily
            ].join(" ");

            if(String(text).length === 0){
                return 0;
            }
            text = "" + (text || "Eg");

            var id = text + "-" + font;
            if(Text._cache.height[id]){
                return Text._cache.height[id];
            }
            var context = Text._context,
                canvas;
            if(context){
                canvas = context.canvas;
                if(typeof (Text._cache.height[id] = context.measureText(text).emHeightAscent) === "number"){
                    return Text._cache.height[id];
                }
            }
            else{
                Text._context = context = (canvas = document.createElement("canvas")).getContext("2d");
            }

            var width = Math.ceil(Text.getWidth(text, style)),
                height = Math.ceil(parseFloat(fontSize, 10)),
                top, bottom;
            var data;
            var hasNumber = typeof height === "number";
            if (!hasNumber || (hasNumber && height <= 0) || isNaN(height) || !isFinite(height))
                height = 12;

            context.save();
            context.font = font;
            context.textBaseline = "alphabetic";
            context.textAlign = "left";
            context.fillStyle = "#fff";
            context.fillText(text, 0, height);
            data = context.getImageData(0, 0, width, height).data;
            context.restore();

            top = bottom = -1;
            for(var y = 0; y <= height; y++){
                for(var x = 0; x < width; x++){
                    var i = x + y * width << 2;
                    if(data[i] + data[i + 1] + data[i + 2] > 0){
                        if(top === -1) top = y;//once
                        bottom = y;
                        break;
                    }
                }
            }
            //console.log(bottom - top + 1, text, font)
            return Text._cache.height[id] = bottom - top + 1;
        },
        measureText: function(text, style){
            var angle = style && style.rotation,
                width = 0,
                height = 0;
            var bbox = {
                left: 0, top: 0,
                width: width, height: height
            };
            if(!(text = String(text)).length)
                return bbox;
            bbox.width = width = Text.getWidth(text, style);
            bbox.height = height = Text.getHeight(text, style);
            if(style && typeof angle === "number" && isFinite(angle) && !isNaN(angle)){
                var x0 = abs(sin(angle = angle * Math.PI / 180) * width),
                    x1 = abs(cos(angle) * width);
                var y0 = abs(sin(angle) * height),
                    y1 = abs(cos(angle) * height);
                bbox.width = x1 + y0;
                bbox.height = x0 + y1;
            }
            return bbox;
        },
        multipText: function(word, maxWidth, options){
            var ellipsis = (options = options || {}).ellipse || "..";
            var context = Text._context;
            if(!context){
                Text._context = context = (document.createElement("canvas")).getContext("2d");
            }
            
            var textWidth = (Text.getWidth(word, options));//context.measureText(word).width,
                //curWidth = 0;
            if(textWidth <= maxWidth)
                return word;
            maxWidth -= Text.getWidth(ellipsis);
            var l = 0, r = word.length, m;
            while(l < r){
                m = (l + r >>> 1) + 1;
                if(Text.getWidth(word.slice(0, m), options) < maxWidth) l = m;
                else r = m - 1;
            }
            return word.slice(0, l) + ellipsis;
        }
    };
    Text.HTML = function(nodes, g, options){
        var fontSize = (options = options || {}).fontSize || "12px",
            fontFamily = options.fontFamily || "Arial, sans-serif",
            fontWeight = options.fontWeight || "100",//normal | bold | bolder | lighter | auto | inherit | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
            fontStyle = options.fontStyle || "normal";//normal | italic | oblique | inherit
            //color = options.color || (g && g.fillStyle);
        var bbox = {height: 0, width: 0},
            width = 0,
            height = 0,
            x = 0,
            y = 0;
        var lastHeight = 0;
        function parse(nodes, isTag, render){
            var i, length = nodes.length | (i = 0);
            var curFontWeight = fontWeight,
                curFontStyle = fontStyle,
                node;

            for(; i < length; i++){
                node = nodes[i];
                
                if(node.type === "br"){
                    x = 0;
                    y += bbox.height;
                    continue;
                }
                if(node.type === "b"){
                    g.font = [curFontStyle, curFontWeight = "bold", fontSize, fontFamily].join(" ");
                }
                else if(node.type === "i"){
                    g.font = [curFontStyle = "italic", curFontWeight, fontSize, fontFamily].join(" ");
                }
                else if(node.type === "normal" && !isTag){
                    curFontWeight = fontWeight;
                    g.font = [curFontStyle, curFontWeight, fontSize, fontFamily].join(" ");
                }
                
                if(node.type === "normal"){
                    render && render.call(g, node.value, x, height);
                    bbox = Text.measureText(node.value, options);
                    width = Math.max(width, bbox.width);
                    height = y + bbox.height;
                    x += bbox.width;
                    
                    lastHeight = Math.max(lastHeight, bbox.height);
                }
                if(node.type === "i" ||
                    node.type === "u" ||
                    node.type === "b"
                ){
                    (isArray(node.value)) && parse(node.value, true, render);
                    curFontStyle = fontStyle;
                    curFontWeight = fontWeight;
                }
            }
        }
        var tag = {
            getBBox: function(){
                x = y = width = height = 0;
                parse(nodes, false);
                
                return {
                    left: 0,
                    top: 0,
                    width: width,
                    height: options.rotation ? lastHeight : height
                };
            },
            toCanvas: function(){
                x = y = width = height = 0;
                g.save();
                typeof options.x === "number" && typeof options.y === "number" && g.translate(options.x, options.y);
                parse(nodes, false, function(value, x, y){
                    g.fillText(value, x, y);
                });
                g.restore();
            },
            toHTML: function(){
                var html = "";   
                (function fn(nodes){
                    var i, length = nodes.length | (i = 0);
                    var node;
                    //var args = arguments.callee;
                    
                    for(; i < length; i++){
                        node = nodes[i];
                        
                        if(node.type === "br"){
                            html += "<br />";
                            continue;
                        }
                        
                        if(node.type === "normal"){
                            html += node.value;
                        }
                        if(node.type === "i"  ||
                            node.type === "u" ||
                            node.type === "b"
                        ){
                            html += "<" + node.type + ">";
                            (isArray(node.value)) && fn(node.value);
                            html += "</" + node.type + ">";
                        }
                    }
                    return html;
                })(nodes, false);
                return html;
            }
        };
        return tag;
    };
    Text.parseHTML = require("./text.tag.parser");
    return Text;
})(typeof window !== "undefined" ? window : global)