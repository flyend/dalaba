(function () {
    var PI = Math.PI;
    var PI2 = PI * 2;

    var log = Math.log;

    var tan = Math.tan;

    var PI41 = PI / 4;

    var toRadian = function (v) {
        return v * Math.PI / 180;
    };

    var setTransform = function (a, b, k) {
        return a + b * k;
    };

    function lat2lng (lat, lng) {
        return [
            (lat < -168.5 ? lat + 360 : lat) + 170,
            90 - lng
        ];
    }
    function clamp (lat) {
        return lat > PI ? lat - PI2 : lat < -PI ? lat + PI2 : lat;
    };
    
    var Projection = {
        /**
         * Mercator Projection
         * -----------------------------
         * E = FE + R (λ – λₒ)
         * N = FN + R ln[tan(π/4 + φ/2)]
         * -----------------------------  
        */
        mercator: function (lat, lng) {
            return [lat, log(tan(PI / 4 + lng / 2))];
        },
        simple: function (lat, lng) {
            var p = lat2lng(lat, lng);
            return [toRadian(p[0]), toRadian(p[1])];
        }
    };

    var Feature = {
        Point: function (p, stream) {
            stream.point(p);
        },
        MultiPoint: function (coordinates, stream) {
            coordinates.forEach(function (coords) {
                Feature.Point(coords, stream);
            });
        },
        LineString: function (coordinates, stream) {
            Feature.MultiPoint(coordinates, stream);
        },
        MultiLineString: function (coordinates, stream) {
            coordinates.forEach(function (coords) {
                stream.points && (stream.points = []);
                Feature.LineString(coords, stream);
                stream.groups && stream.groups();
            });
        },
        Polygon: function (coordinates, stream) {
            stream.clear && stream.clear();//reset
            Feature.MultiLineString(coordinates, stream);
        },
        MultiPolygon: function (coordinates, stream) {
            stream.clear && stream.clear();
            coordinates.forEach(function (coords) {
                Feature.MultiLineString(coords, stream);
            });
        }
    };

    var Geometry = {
        Feature: function (feature, stream) {
            var geometry = feature.geometry,
                geometryType = geometry.type,
                coordinates = geometry.coordinates;
            Feature[geometryType] && Feature[geometryType](coordinates, stream);
        },
        FeatureCollection: function (geojson, stream) {
            (geojson.features || []).forEach(function (feature) {
                Feature.Feature(feature, stream);
            });
        }
    };

    function factoy (Dalaba) {
        var extend = Dalaba.extend;

        var isNumber = Dalaba.isNumber;

        var isArray = Dalaba.isArray;

        var isObject = Dalaba.isObject;

        var isFunction = Dalaba.isFunction;

        var defined = Dalaba.defined;

        var extend = Dalaba.extend;

        /**
         * Projection
        **/
        var Projector = function () {

            var rescale = function (bounds, width, height) {
                var topLeft = bounds[0],
                    bottomRight = bounds[1];
                var hscale = width / (bottomRight[0] - topLeft[0]),
                    vscale = height / (bottomRight[1] - topLeft[1]);
                return (hscale < vscale) ? hscale : vscale;
            };

            var Parse = function () {
                this.center = function (_) {
                    return arguments.length ? (this._center = _, this.celler = transform(_, this._scale, this._translate), this) : [this.centerX, this.centerY];
                };
                this.translate = function (_) {
                    return arguments.length ? (this._translate = _, this.celler = transform(this._center, this._scale, _), this) : this._translate;
                };
                this.scale = function (_) {
                    return arguments.length ? (this._scale = _, this.celler = transform(this._center, _, this._translate), this) : this._scale;
                };
            };
            function transform (center, scale, translate) {
                var cx = pack("number", center && center[0]) % 360 * PI / 180,
                    cy = pack("number", center && center[1]) % 360 * PI / 180;
                var x = pack("number", translate && translate[0], 480),
                    y = pack("number", translate && translate[1], 250);
                scale = pack("number", scale, 1);
                var point = Projection.mercator(cx, cy);
                return [x - point[0] * scale, y + point[1] * scale];
            }
            Parse.parse = function (params) {
                this._translate = [480, 250];
                this._scale = null;//auto
                this._center = null;//auto center [0, 0];

                defined(params.scale) && (this.scale(params.scale));
                defined(params.translate) && (this.translate(params.translate));
                defined(params.center) && (this.center(params.center));
                isFunction(params) && (this._projection = params);
            };

            Parse.parse.prototype = new Parse();

            var GeoParse = function (options) {
                this._scale = options._scale;
                this._center = options._center;
                this._translate = options._translate;
                this.centerX = (options.celler || [])[0];
                this.centerY = (options.celler || [])[1];
                Parse.call(this);
                this._projection = options._projection ? options._projection : this.projection;

                this.size = function (_) {
                    return arguments.length ? (this.width = pack("number", _[0]), this.height = pack("number", _[1]), this) : [pack("number", this.width), pack("number", this.height)];
                };

                this.Stream = {
                    points: [],
                    get: function () {
                        return this.polygons.length ? this.polygons : this.points;
                    },
                    polygons: [],
                    clear: function () {
                        this.polygons = [];
                        this.points = [];
                    },
                    groups: function () {
                        this.polygons.push(this.points);
                    }
                };
            };
            
            extend(GeoParse.prototype, Parse.prototype, {
                feature: function (geoJson, callback, pointCaller) {
                    var Stream = this.Stream;
                    var parsed = this;
                    var geoJsonType = geoJson.type;
                    var centerX = parsed.centerX,
                        centerY = parsed.centerY,
                        scale = parsed._scale;
                    // console.log(centerX, centerY, scale)

                    Stream.clear();
                    Stream.point = function (p) {
                        var point = parsed._projection(p);

                        Stream.points.push(parsed.point(point));
                        
                        pointCaller && pointCaller.call(p, p, point);
                    };

                    if (isObject(geoJson) && geoJsonType) {
                        if (geoJsonType === "FeatureCollection") {
                            (geoJson.features || []).forEach(function (feature) {
                                Geometry.Feature(feature, Stream);
                                callback && callback(Stream.get(), feature);
                            });
                        }
                        else if (geoJsonType === "Feature") {
                            Geometry.Feature(geoJson, Stream);
                            callback && callback(Stream.get(), geoJson);
                        }
                    }
                },
                parse: function (geoJson, callback, pointCaller) {
                    this.centerAndZoom(geoJson);
                    this.feature(geoJson, callback, pointCaller);
                    return this;
                },
                point: function (point) {
                    var centerX = this.centerX,
                        centerY = this.centerY,
                        scale = this._scale;

                    var x = setTransform(centerX, point[0], scale),
                        y = setTransform(centerY, -point[1], scale);
                    return [
                        x,
                        y
                    ];
                },
                centroid: function (geoJson) {
                    var x = 0, y = 0;
                    var count = 0;
                    var coords;

                    this.feature(geoJson, null, function (point, p) {
                        x += point[0];
                        y += point[1];
                        count++;
                    });

                    coords = [x / count, y / count];
                    return coords;
                },
                bounds: function (geoJson) {
                    var bounds = [[Infinity, Infinity], [-Infinity, -Infinity]]; 
                    this.feature(geoJson, null, function (p, point) {
                        var x = point[0],
                            y = point[1];
                        if (x < bounds[0][0]) bounds[0][0] = x;
                        if (x > bounds[1][0]) bounds[1][0] = x;
                        if (y < bounds[0][1]) bounds[0][1] = y;
                        if (y > bounds[1][1]) bounds[1][1] = y;
                    });
                    return bounds;
                },
                centerAndZoom: function (geoJson) {
                    var center = this._center;
                    var width = this.width,
                        height = this.height;
                    var bounds = [[Infinity, Infinity], [-Infinity, -Infinity]];
                    if (!isArray(center)) {
                        this.center(center = this.centroid(geoJson));//no projection
                        this.centerX = this.celler[0];
                        this.centerY = this.celler[1];
                    }
                    if (!isNumber(this._scale, true)) {
                        new Dalaba.geo.Projection({
                            center: center,
                            scale: 1,
                            translate: [0, 0]
                        }).feature(geoJson, null, function (p, point) {
                            var x = point[0],
                                y = point[1];
                            if (x < bounds[0][0]) bounds[0][0] = x;
                            if (x > bounds[1][0]) bounds[1][0] = x;
                            if (y < bounds[0][1]) bounds[0][1] = y;
                            if (y > bounds[1][1]) bounds[1][1] = y;
                        });

                        this._center = center;
                        this.scale(this._scale = rescale(bounds, width, height));
                        this.centerX = this.celler[0];
                        this.centerY = this.celler[1];
                    }
                    // from call center()
                    if (isArray(center) && !(isNumber(this.centerX, true) && isNumber(this.centerY, true))) {
                        this.center(center);
                        this.centerX = this.celler[0];
                        this.centerY = this.celler[1];
                    }
                },
                projection: function (point) {
                    var lat = clamp(point[0] * PI / 180),
                        lng = point[1] * PI / 180;
                    return Projection.mercator(lat, lng);// [centerX + point[0] * scale, centerY - point[1] * scale];
                }
            });
            
            return function () {
                var parsed = null;

                var fixed = function (params) {
                    if (isObject(params)) {
                        parsed = new Parse.parse(params);
                    }
                    else if (isFunction(params)) parsed = new Parse.parse(params);
                };

                var args = [].slice.call(arguments, 0),
                    n = args.length;
                
                fixed(args[0]);
                if (n > 1) {
                    fixed(args[1]);
                }
                return new GeoParse(parsed || new Parse.parse({}));
            };
        };

        var geo = {
            Projection: Projector()
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