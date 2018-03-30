"use strict";

var Text = (function(global){

    var document = global.document;

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

            var width = Math.ceil(Text.getWidth(text, style));
            var height = 72;//Math.max(text.split("\n").length * width, parseInt(fontSize, 10));
            //canvas.height = height;
            //canvas.width = width;
            context.save();
            context.clearRect(0, 0, width, height);
            context.textBaseline = "top";
            context.fillStyle = "#fff";
            context.font = font;
            context.fillText(text, 0, 0);
            //context.fillRect(0, 0, width, height);
            context.restore();

            var pixels = context.getImageData(0, 0, width, height).data;
            var start = -1,
                end = -1;
            for(var row = 0; row < height; row++){
                for(var col = 0; col < width; col++){
                    var i = col + row * width << 2;
                    //background color not #fff
                    if(pixels[i] === 0){
                        //font color pixel(#fff)
                        if(col === width - 1 && start !== -1){
                            end = row;
                            row = height;
                        }
                        continue;
                    }
                    else{
                        if(start === -1){
                            start = row;
                        }
                        break;
                    }
                }
            }
            return (Text._cache.height[id] = end - start);
        },
        measureText: function(text, style){
            //console.log("width="+ Text.getWidth(text, style),"height=" + Text.getHeight(text, style), text, style)
            return {
                left: 0,
                top: 0,
                width: Text.getWidth(text = String(text), style),
                height: Text.getHeight(text, style)
            };
        },
        multipText: function(word, maxWidth, options){
            var ellipse = (options = options || {}).ellipse || "..";
            var context = Text._context;
            if(!context){
                Text._context = context = (document.createElement("canvas")).getContext("2d");
            }
            
            var textWidth = Math.ceil(Text.getWidth(word, options)),//context.measureText(word).width,
                curWidth = 0;
            var newText = word.charAt(0);
            if(textWidth > maxWidth){
                //context.fillText("", 0, baseline);
                for(var i = 1; i < word.length; i++){
                    newText += word.charAt(i);
                    curWidth = context.measureText(newText).width;
                    if(curWidth >= maxWidth)
                        break;
                }
                return newText.substr(0) + (curWidth >= textWidth ? "" : ellipse);
            }

            return word;
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
                //console.log(nodes[i], isTag);
                
                if(node.type === "normal"){
                    bbox = {width: g.measureText(node.value).width};
                    bbox.height = Text.measureText(node.value, {
                        fontSize: fontSize,
                        fontFamily: fontFamily,
                        fontWeight: curFontWeight,
                        fontStyle: curFontStyle
                    }).height;
                    width = Math.max(width, bbox.width);
                    height = y + bbox.height;
                    render && render.call(g, node.value, x, height);
                    x += bbox.width;
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
                    height: height
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
})(typeof window !== "undefined" ? window : global);
module.exports = Text;