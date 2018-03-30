(function(){
    var PI = Math.PI;
    //var PI2 = PI * 2;
    //var PI21 = PI / 2;
    var PI41 = PI / 4;

    var toRadian = function(v){
        return v * Math.PI / 180;
    };

    function lat2lng(lat, lng){
        return [
            (lat < -168.5 ? lat + 360 : lat) + 170,
            90 - lng
        ];
    }

    /**
     * Default
    */
    function Simple(){
        return function(lat, lng){
            var p = lat2lng(lat, lng);
            return [
                toRadian(p[0]),
                toRadian(p[1])
            ];
        };
    }
    

    /**
     * Mercator Projection
     * -----------------------------
     * E = FE + R (λ – λₒ)
     * N = FN + R ln[tan(π/4 + φ/2)]
     * -----------------------------  
    */
    function Mercator(){
        //var x = lat,
        //    y = Math.log(Math.tan(PI41 + lng / 2));
        return function(lat, lng){
            var p = lat2lng(lat, lng);
            return [
                toRadian(p[0]),
                Math.log(Math.tan(PI41 + toRadian(p[1]) / 2))
            ];
        };
    }

    var Feature = {
        Point: function(p, stream){
            stream.point(p);
        },
        MultiPoint: function(coordinates, stream){
            coordinates.forEach(function(coords){
                Feature.Point(coords, stream);
            });
        },
        LineString: function(coordinates, stream){
            Feature.MultiPoint(coordinates, stream);
        },
        MultiLineString: function(coordinates, stream){
            coordinates.forEach(function(coords){
                stream.points && (stream.points = []);
                Feature.LineString(coords, stream);
                stream.groups && stream.groups();
            });
        },
        Polygon: function(coordinates, stream){
            stream.clear && stream.clear();//reset
            Feature.MultiLineString(coordinates, stream);
        },
        MultiPolygon: function(coordinates, stream){
            stream.clear && stream.clear();
            coordinates.forEach(function(coords){
                Feature.MultiLineString(coords, stream);
            });
        }
    };

    var Geometry = {
        Feature: function(feature, stream){
            var geometry = feature.geometry,
                geometryType = geometry.type,
                coordinates = geometry.coordinates;
            Feature[geometryType](coordinates, stream);
            //callback && callback(stream.points, feature);
        },
        FeatureCollection: function(geojson, stream){
            (geojson.features || []).forEach(function(feature){
                Geometry.Feature(feature, stream);
                /*var geometry = feature.geometry,
                geometryType = geometry.type,
                coordinates = geometry.coordinates;
                Feature[geometryType](coordinates, stream);
                callback && callback(stream.get(), feature);*/
            });
        }
    };

    function factoy (Dalaba) {
        var extend = Dalaba.extend;

        var isNumber = Dalaba.isNumber;

        var isArray = Dalaba.isArray;

        var isObject = Dalaba.isObject;

         /**
         * Class Path
         *
        */
        var Path = (function(){
            var path = {};
            var size = [960, 500],
                scale = [1, 1],
                translate = [0, 0];
            var projection = Simple();

            var type = "Point";

            return extend(path, {
                type: function(t){
                    return arguments.length ? (type = Feature.hasOwnProperty(t) ? t : "Point", path) : type;
                },
                size: function(){
                    if(arguments.length){
                        size = arguments[0];
                        isNumber(size) && (size = [size, size]);
                        isArray(size) && size.length < 2 && (size[1] = size[0]);
                        return path;
                    }
                    return size;
                },
                translate: function(){
                    if(arguments.length){
                        translate = arguments[0];
                        isNumber(translate) && (translate = [translate, translate]);
                        isArray(translate) && translate.length < 2 && (translate[1] = translate[0]);
                        return path;
                    }
                    return path;
                },
                scale: function(){
                    if(arguments.length){
                        scale = arguments[0];
                        isNumber(scale) && (scale = [scale, scale]);
                        isArray(scale) && scale.length < 2 && (scale[1] = scale[0]);
                        return path;
                    }
                    return scale;
                },
                projection: function(){
                    if(arguments.length){
                        projection = arguments[0];
                        return path;
                    }
                    return projection;
                },
                parse: function(geojson, callback){
                    var width = size[0],
                        height = size[1];//translate = [toRadian(480), toRadian(250)];
                    var stream = {
                        points: [],
                        get: function(){
                            return stream.polygons.length ? stream.polygons : stream.points;
                        },
                        polygons: [],
                        clear: function(){
                            this.polygons = [];
                            this.points = [];
                        },
                        groups: function(){
                            stream.polygons.push(stream.points);
                        }
                    };
                    var bounds = Path.bounds(geojson);//bounds = [[360, 180], [0, 0]];
                    //bounds = [[-85.05112878, -180], [85.05112878, 180]];
                    /*var r = {
                        left: bounds[0][0], top: bounds[0][1],
                        width: bounds[1][0], height: bounds[1][1]
                    };
                    console.log(r);*/
                    
                    
                    var scaleWidth = width * scale[0],
                        scaleHeight = height * scale[1];

                    /*var tx = width / (bounds[1][0] - bounds[0][0]),
                        ty = height / (bounds[1][1] - bounds[0][1]);
                    
                    var sx = scaleWidth / (bounds[1][0] - bounds[0][0]),
                        sy = scaleHeight / (bounds[1][1] - bounds[0][1]);
                    sy = sx;
                    if(sx > sy){
                        sx = sy;
                    }
                    else{
                        
                    }
                    sx = sy * 0.75;*/
                    //lock width & height
                    var ratio = Math.max(
                        (bounds[1][0] - bounds[0][0]) / scaleWidth * 1,
                        (bounds[1][1] - bounds[0][1]) / scaleHeight * 1
                    );
                    ratio = ratio ? 1 / ratio : 1;
                    var k0 = ratio;
                    var k1 = ratio * 1.3;
                    var dx = translate[0],// + (width - scaleWidth) / 2,//(tx - ratio) / 2,
                        dy = translate[1];// + (height - scaleHeight) / 2;//(ty - ratio) / 4;
                    stream.point = function(p){
                        var point = projection(p[0], p[1]),
                            x = point[0],
                            y = point[1];
                        x = (point[0] - bounds[0][0]) * k0 + dx;
                        y = (point[1] - bounds[0][1]) * k1 + dy;
                        //console.log(x, y);
                        stream.points.push({x: x, y: y});
                    };
                    if(isObject(geojson)){
                        var Geometry = {
                            FeatureCollection: function(geojson, stream){
                                (geojson.features || []).forEach(function(feature){
                                    Geometry.Feature(feature, stream);
                                    //callback && callback(stream.get(), feature);
                                });
                            },
                            Feature: function(feature, stream){
                                var geometry = feature.geometry,
                                    geometryType = geometry.type,
                                    coordinates = geometry.coordinates;
                                Feature[geometryType](coordinates, stream);
                                callback && callback(stream.get(), feature);
                            }
                        };
                        Geometry[geojson.type](geojson, stream);
                    }
                }
            });
        })();

        Path.bounds = function(geojson){
            var projection = Path.projection();
            //console.log(projection)
            var bounds = [[360, 180], [0, 0]];//min lat and min lng, max lat and max lng
            //bounds = [[-85.05112878, -180], [85.05112878, 180]];

            var stream = {
                point: function(p){
                    var point = projection(p[0], p[1]),
                    x = point[0],
                    y = point[1];
                    //console.log(p)
                    if(bounds[0][0] > x) bounds[0][0] = x;
                    if(x > bounds[1][0]) bounds[1][0] = x;
                    if(bounds[0][1] > y) bounds[0][1] = y;
                    if(y > bounds[1][1]) bounds[1][1] = y;
                }
            };
            if(isObject(geojson)){
                var F = {
                    FeatureCollection: function(geojson){
                        (geojson.features || []).forEach(function(feature){
                            var geometry = feature.geometry,
                                type = feature.type;
                            if(type === "Feature"){
                                Feature[geometry.type](geometry.coordinates, stream);
                            }
                            else if(type === "GeometryCollection"){
                                feature.geometries.forEach(function(geometry){
                                    Feature[geometry.type](geometry.coordinates, stream);
                                });
                            }
                        });
                    },
                    Feature: function(feature){
                        var geometry = feature.geometry,
                            geometryType = geometry.type,
                            coordinates = geometry.coordinates;
                        Feature[geometryType](coordinates, stream);
                    }
                };
                F[geojson.type](geojson);
            }
            return bounds;
        };

        var geo = {
            Mercator: Mercator,
            Path: Path
        };
        return geo;
    }

    var exports = (function (global) {
        return function (Dalaba) {
            return factoy.call(global, Dalaba);
        };
    })(this);
    if (typeof module === "object" && module.exports) {
        module.exports = exports;
    }
    else if (typeof define === "function" && define.amd) {
        define(function () {
            return exports;
        });
    }
    return exports;

}).call(typeof window !== "undefined" ? window : this)