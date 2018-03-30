(function(){
    var isNumber = function(a){
        return typeof a === "number" && a === a;
    };

    function pack(){
        var r = {
            "number": [0, isNumber]
        };
        var params = Array.prototype.slice.call(arguments, 0),
            type = params[0];
        var v, i;

        for(i = 1; i < params.length; i++){
            v = params[i];
            if(type && r[type] && r[type][1] && r[type][1](v)){
                return v;
            }
        }
        return r[type] && r[type][0];
    }
    var Vector = function(){
        return (arguments.length >= 3
                ? new Vector3D(arguments[0], arguments[1], arguments[2])
                : new Vector2D(arguments[0], arguments[1]));
    };
    Vector.prototype = {
        add: function(v){
            this.x += pack("number", v.x, 0);
            this.y += pack("number", v.y, 0);
        },
        sub: function(v){
            this.x -= pack("number", v.x, 0);
            this.y -= pack("number", v.y, 0);
            return this;
        },
        length: function(){
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }
    };

    function Vector2D(x, y){
        if(!isNumber(x) || !isNumber(y)){
            throw new Error("x and y not a number.");
        }
        this.x = x;
        this.y = y;
        return this;
    }
    Vector2D.prototype = Vector.prototype;
    Vector2D.prototype.horizontal = function(v){
        var x1 = this.x,
            y1 = this.y;
        var x2 = v.x,
            y2 = v.y;
        //a//b x1*y2=y1*x2
        //var c = x1 * y2 === x2 * y1;
        //x1x2+y1y2=0
        //console.log(x1 * y2, x2 * y1, c, (y2 - y1) / (x2 - x1), x1*x2+y1*y2);
        var ax = x2 - x1;
        if(Math.abs(ax) <= 0.1){
            return false;
        }
        return (y2 - y1) / (ax) <= 0.1;

        
        //return isNumber(c) ? c : false;// === 0;
    };

    function Vector3D(x, y, z){
        this.x = x;
        this.y = y;
        this.z = z;
    }

    if(typeof module === "object" && module.exports){
        module.exports = Vector;
    }
    else if(typeof define === "function" && define.amd){
        define(function(){
            return Vector;
        });
    }
    return Vector;
}).call(typeof global !== "undefined" ? global : window);