(function() {
    var d3 = {
        version: "3.4.4"
    };
    !function() {
        var π = Math.PI, τ = 2 * π, halfπ = π / 2, ε = 1e-6, ε2 = ε * ε, d3_radians = π / 180, d3_degrees = 180 / π;
        function d3_sgn(x) {
            return x > 0 ? 1 : x < 0 ? -1 : 0;
        }
        function d3_cross2d(a, b, c) {
            return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
        }
        function d3_acos(x) {
            return x > 1 ? 0 : x < -1 ? π : Math.acos(x);
        }
        function d3_asin(x) {
            return x > 1 ? halfπ : x < -1 ? -halfπ : Math.asin(x);
        }
        function d3_sinh(x) {
            return ((x = Math.exp(x)) - 1 / x) / 2;
        }
        function d3_cosh(x) {
            return ((x = Math.exp(x)) + 1 / x) / 2;
        }
        function d3_tanh(x) {
            return ((x = Math.exp(2 * x)) - 1) / (x + 1);
        }
        function d3_haversin(x) {
            return (x = Math.sin(x / 2)) * x;
        }
        d3.geo = {};
        function d3_identity(d) {
            return d;
        }
        d3.rebind = function(target, source) {
            var i = 1, n = arguments.length, method;
            while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
            return target;
        };
        function d3_rebind(target, source, method) {
            return function() {
                var value = method.apply(source, arguments);
                return value === source ? target : value;
            };
        }
        function d3_true() {
            return true;
        }
        var abs = Math.abs;
        d3.merge = function(arrays) {
            var n = arrays.length, m, i = -1, j = 0, merged, array;
            while (++i < n) j += arrays[i].length;
            merged = new Array(j);
            while (--n >= 0) {
                array = arrays[n];
                m = array.length;
                while (--m >= 0) {
                    merged[--j] = array[m];
                }
            }
            return merged;
        };
        function d3_noop() {}
        function d3_geo_spherical(cartesian) {
            return [ Math.atan2(cartesian[1], cartesian[0]), d3_asin(cartesian[2]) ];
        }
        function d3_geo_sphericalEqual(a, b) {
            return abs(a[0] - b[0]) < ε && abs(a[1] - b[1]) < ε;
        }
        function d3_geo_clipPolygon(segments, compare, clipStartInside, interpolate, listener) {
            var subject = [], clip = [];
            segments.forEach(function(segment) {
                if ((n = segment.length - 1) <= 0) return;
                var n, p0 = segment[0], p1 = segment[n];
                if (d3_geo_sphericalEqual(p0, p1)) {
                    listener.lineStart();
                    for (var i = 0; i < n; ++i) listener.point((p0 = segment[i])[0], p0[1]);
                    listener.lineEnd();
                    return;
                }
                var a = new d3_geo_clipPolygonIntersection(p0, segment, null, true), b = new d3_geo_clipPolygonIntersection(p0, null, a, false);
                a.o = b;
                subject.push(a);
                clip.push(b);
                a = new d3_geo_clipPolygonIntersection(p1, segment, null, false);
                b = new d3_geo_clipPolygonIntersection(p1, null, a, true);
                a.o = b;
                subject.push(a);
                clip.push(b);
            });
            clip.sort(compare);
            d3_geo_clipPolygonLinkCircular(subject);
            d3_geo_clipPolygonLinkCircular(clip);
            if (!subject.length) return;
            for (var i = 0, entry = clipStartInside, n = clip.length; i < n; ++i) {
                clip[i].e = entry = !entry;
            }
            var start = subject[0], points, point;
            while (1) {
                var current = start, isSubject = true;
                while (current.v) if ((current = current.n) === start) return;
                points = current.z;
                listener.lineStart();
                do {
                    current.v = current.o.v = true;
                    if (current.e) {
                        if (isSubject) {
                            for (var i = 0, n = points.length; i < n; ++i) listener.point((point = points[i])[0], point[1]);
                        } else {
                            interpolate(current.x, current.n.x, 1, listener);
                        }
                        current = current.n;
                    } else {
                        if (isSubject) {
                            points = current.p.z;
                            for (var i = points.length - 1; i >= 0; --i) listener.point((point = points[i])[0], point[1]);
                        } else {
                            interpolate(current.x, current.p.x, -1, listener);
                        }
                        current = current.p;
                    }
                    current = current.o;
                    points = current.z;
                    isSubject = !isSubject;
                } while (!current.v);
                listener.lineEnd();
            }
        }
        function d3_geo_clipPolygonLinkCircular(array) {
            if (!(n = array.length)) return;
            var n, i = 0, a = array[0], b;
            while (++i < n) {
                a.n = b = array[i];
                b.p = a;
                a = b;
            }
            a.n = b = array[0];
            b.p = a;
        }
        function d3_geo_clipPolygonIntersection(point, points, other, entry) {
            this.x = point;
            this.z = points;
            this.o = other;
            this.e = entry;
            this.v = false;
            this.n = this.p = null;
        }
        function d3_geo_clip(pointVisible, clipLine, interpolate, clipStart) {
            return function(rotate, listener) {
                var line = clipLine(listener), rotatedClipStart = rotate.invert(clipStart[0], clipStart[1]);
                var clip = {
                    point: point,
                    lineStart: lineStart,
                    lineEnd: lineEnd,
                    polygonStart: function() {
                        clip.point = pointRing;
                        clip.lineStart = ringStart;
                        clip.lineEnd = ringEnd;
                        segments = [];
                        polygon = [];
                        listener.polygonStart();
                    },
                    polygonEnd: function() {
                        clip.point = point;
                        clip.lineStart = lineStart;
                        clip.lineEnd = lineEnd;
                        segments = d3.merge(segments);
                        var clipStartInside = d3_geo_pointInPolygon(rotatedClipStart, polygon);
                        if (segments.length) {
                            d3_geo_clipPolygon(segments, d3_geo_clipSort, clipStartInside, interpolate, listener);
                        } else if (clipStartInside) {
                            listener.lineStart();
                            interpolate(null, null, 1, listener);
                            listener.lineEnd();
                        }
                        listener.polygonEnd();
                        segments = polygon = null;
                    },
                    sphere: function() {
                        listener.polygonStart();
                        listener.lineStart();
                        interpolate(null, null, 1, listener);
                        listener.lineEnd();
                        listener.polygonEnd();
                    }
                };
                function point(λ, φ) {
                    var point = rotate(λ, φ);
                    if (pointVisible(λ = point[0], φ = point[1])) listener.point(λ, φ);
                }
                function pointLine(λ, φ) {
                    var point = rotate(λ, φ);
                    line.point(point[0], point[1]);
                }
                function lineStart() {
                    clip.point = pointLine;
                    line.lineStart();
                }
                function lineEnd() {
                    clip.point = point;
                    line.lineEnd();
                }
                var segments;
                var buffer = d3_geo_clipBufferListener(), ringListener = clipLine(buffer), polygon, ring;
                function pointRing(λ, φ) {
                    ring.push([ λ, φ ]);
                    var point = rotate(λ, φ);
                    ringListener.point(point[0], point[1]);
                }
                function ringStart() {
                    ringListener.lineStart();
                    ring = [];
                }
                function ringEnd() {
                    pointRing(ring[0][0], ring[0][1]);
                    ringListener.lineEnd();
                    var clean = ringListener.clean(), ringSegments = buffer.buffer(), segment, n = ringSegments.length;
                    ring.pop();
                    polygon.push(ring);
                    ring = null;
                    if (!n) return;
                    if (clean & 1) {
                        segment = ringSegments[0];
                        var n = segment.length - 1, i = -1, point;
                        listener.lineStart();
                        while (++i < n) listener.point((point = segment[i])[0], point[1]);
                        listener.lineEnd();
                        return;
                    }
                    if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));
                    segments.push(ringSegments.filter(d3_geo_clipSegmentLength1));
                }
                return clip;
            };
        }
        function d3_geo_clipSegmentLength1(segment) {
            return segment.length > 1;
        }
        function d3_geo_clipBufferListener() {
            var lines = [], line;
            return {
                lineStart: function() {
                    lines.push(line = []);
                },
                point: function(λ, φ) {
                    line.push([ λ, φ ]);
                },
                lineEnd: d3_noop,
                buffer: function() {
                    var buffer = lines;
                    lines = [];
                    line = null;
                    return buffer;
                },
                rejoin: function() {
                    if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
                }
            };
        }
        function d3_geo_clipSort(a, b) {
            return ((a = a.x)[0] < 0 ? a[1] - halfπ - ε : halfπ - a[1]) - ((b = b.x)[0] < 0 ? b[1] - halfπ - ε : halfπ - b[1]);
        }
        function d3_adder() {}
        d3_adder.prototype = {
            s: 0,
            t: 0,
            add: function(y) {
                d3_adderSum(y, this.t, d3_adderTemp);
                d3_adderSum(d3_adderTemp.s, this.s, this);
                if (this.s) this.t += d3_adderTemp.t; else this.s = d3_adderTemp.t;
            },
            reset: function() {
                this.s = this.t = 0;
            },
            valueOf: function() {
                return this.s;
            }
        };
        var d3_adderTemp = new d3_adder();
        function d3_adderSum(a, b, o) {
            var x = o.s = a + b, bv = x - a, av = x - bv;
            o.t = a - av + (b - bv);
        }
        d3.geo.stream = function(object, listener) {
            if (object && d3_geo_streamObjectType.hasOwnProperty(object.type)) {
                d3_geo_streamObjectType[object.type](object, listener);
            } else {
                d3_geo_streamGeometry(object, listener);
            }
        };
        function d3_geo_streamGeometry(geometry, listener) {
            if (geometry && d3_geo_streamGeometryType.hasOwnProperty(geometry.type)) {
                d3_geo_streamGeometryType[geometry.type](geometry, listener);
            }
        }
        var d3_geo_streamObjectType = {
            Feature: function(feature, listener) {
                d3_geo_streamGeometry(feature.geometry, listener);
            },
            FeatureCollection: function(object, listener) {
                var features = object.features, i = -1, n = features.length;
                while (++i < n) d3_geo_streamGeometry(features[i].geometry, listener);
            }
        };
        var d3_geo_streamGeometryType = {
            Sphere: function(object, listener) {
                listener.sphere();
            },
            Point: function(object, listener) {
                object = object.coordinates;
                listener.point(object[0], object[1], object[2]);
            },
            MultiPoint: function(object, listener) {
                var coordinates = object.coordinates, i = -1, n = coordinates.length;
                while (++i < n) object = coordinates[i], listener.point(object[0], object[1], object[2]);
            },
            LineString: function(object, listener) {
                d3_geo_streamLine(object.coordinates, listener, 0);
            },
            MultiLineString: function(object, listener) {
                var coordinates = object.coordinates, i = -1, n = coordinates.length;
                while (++i < n) d3_geo_streamLine(coordinates[i], listener, 0);
            },
            Polygon: function(object, listener) {
                d3_geo_streamPolygon(object.coordinates, listener);
            },
            MultiPolygon: function(object, listener) {
                var coordinates = object.coordinates, i = -1, n = coordinates.length;
                while (++i < n) d3_geo_streamPolygon(coordinates[i], listener);
            },
            GeometryCollection: function(object, listener) {
                var geometries = object.geometries, i = -1, n = geometries.length;
                while (++i < n) d3_geo_streamGeometry(geometries[i], listener);
            }
        };
        function d3_geo_streamLine(coordinates, listener, closed) {
            var i = -1, n = coordinates.length - closed, coordinate;
            listener.lineStart();
            while (++i < n) coordinate = coordinates[i], listener.point(coordinate[0], coordinate[1], coordinate[2]);
            listener.lineEnd();
        }
        function d3_geo_streamPolygon(coordinates, listener) {
            var i = -1, n = coordinates.length;
            listener.polygonStart();
            while (++i < n) d3_geo_streamLine(coordinates[i], listener, 1);
            listener.polygonEnd();
        }
        d3.geo.area = function(object) {
            d3_geo_areaSum = 0;
            d3.geo.stream(object, d3_geo_area);
            return d3_geo_areaSum;
        };
        var d3_geo_areaSum, d3_geo_areaRingSum = new d3_adder();
        var d3_geo_area = {
            sphere: function() {
                d3_geo_areaSum += 4 * π;
            },
            point: d3_noop,
            lineStart: d3_noop,
            lineEnd: d3_noop,
            polygonStart: function() {
                d3_geo_areaRingSum.reset();
                d3_geo_area.lineStart = d3_geo_areaRingStart;
            },
            polygonEnd: function() {
                var area = 2 * d3_geo_areaRingSum;
                d3_geo_areaSum += area < 0 ? 4 * π + area : area;
                d3_geo_area.lineStart = d3_geo_area.lineEnd = d3_geo_area.point = d3_noop;
            }
        };
        function d3_geo_areaRingStart() {
            var λ00, φ00, λ0, cosφ0, sinφ0;
            d3_geo_area.point = function(λ, φ) {
                d3_geo_area.point = nextPoint;
                λ0 = (λ00 = λ) * d3_radians, cosφ0 = Math.cos(φ = (φ00 = φ) * d3_radians / 2 + π / 4), 
                sinφ0 = Math.sin(φ);
            };
            function nextPoint(λ, φ) {
                λ *= d3_radians;
                φ = φ * d3_radians / 2 + π / 4;
                var dλ = λ - λ0, sdλ = dλ >= 0 ? 1 : -1, adλ = sdλ * dλ, cosφ = Math.cos(φ), sinφ = Math.sin(φ), k = sinφ0 * sinφ, u = cosφ0 * cosφ + k * Math.cos(adλ), v = k * sdλ * Math.sin(adλ);
                d3_geo_areaRingSum.add(Math.atan2(v, u));
                λ0 = λ, cosφ0 = cosφ, sinφ0 = sinφ;
            }
            d3_geo_area.lineEnd = function() {
                nextPoint(λ00, φ00);
            };
        }
        function d3_geo_cartesian(spherical) {
            var λ = spherical[0], φ = spherical[1], cosφ = Math.cos(φ);
            return [ cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ) ];
        }
        function d3_geo_cartesianDot(a, b) {
            return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        }
        function d3_geo_cartesianCross(a, b) {
            return [ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] ];
        }
        function d3_geo_cartesianAdd(a, b) {
            a[0] += b[0];
            a[1] += b[1];
            a[2] += b[2];
        }
        function d3_geo_cartesianScale(vector, k) {
            return [ vector[0] * k, vector[1] * k, vector[2] * k ];
        }
        function d3_geo_cartesianNormalize(d) {
            var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
            d[0] /= l;
            d[1] /= l;
            d[2] /= l;
        }
        function d3_geo_pointInPolygon(point, polygon) {
            var meridian = point[0], parallel = point[1], meridianNormal = [ Math.sin(meridian), -Math.cos(meridian), 0 ], polarAngle = 0, winding = 0;
            d3_geo_areaRingSum.reset();
            for (var i = 0, n = polygon.length; i < n; ++i) {
                var ring = polygon[i], m = ring.length;
                if (!m) continue;
                var point0 = ring[0], λ0 = point0[0], φ0 = point0[1] / 2 + π / 4, sinφ0 = Math.sin(φ0), cosφ0 = Math.cos(φ0), j = 1;
                while (true) {
                    if (j === m) j = 0;
                    point = ring[j];
                    var λ = point[0], φ = point[1] / 2 + π / 4, sinφ = Math.sin(φ), cosφ = Math.cos(φ), dλ = λ - λ0, sdλ = dλ >= 0 ? 1 : -1, adλ = sdλ * dλ, antimeridian = adλ > π, k = sinφ0 * sinφ;
                    d3_geo_areaRingSum.add(Math.atan2(k * sdλ * Math.sin(adλ), cosφ0 * cosφ + k * Math.cos(adλ)));
                    polarAngle += antimeridian ? dλ + sdλ * τ : dλ;
                    if (antimeridian ^ λ0 >= meridian ^ λ >= meridian) {
                        var arc = d3_geo_cartesianCross(d3_geo_cartesian(point0), d3_geo_cartesian(point));
                        d3_geo_cartesianNormalize(arc);
                        var intersection = d3_geo_cartesianCross(meridianNormal, arc);
                        d3_geo_cartesianNormalize(intersection);
                        var φarc = (antimeridian ^ dλ >= 0 ? -1 : 1) * d3_asin(intersection[2]);
                        if (parallel > φarc || parallel === φarc && (arc[0] || arc[1])) {
                            winding += antimeridian ^ dλ >= 0 ? 1 : -1;
                        }
                    }
                    if (!j++) break;
                    λ0 = λ, sinφ0 = sinφ, cosφ0 = cosφ, point0 = point;
                }
            }
            return (polarAngle < -ε || polarAngle < ε && d3_geo_areaRingSum < 0) ^ winding & 1;
        }
        var d3_geo_clipAntimeridian = d3_geo_clip(d3_true, d3_geo_clipAntimeridianLine, d3_geo_clipAntimeridianInterpolate, [ -π, -π / 2 ]);
        function d3_geo_clipAntimeridianLine(listener) {
            var λ0 = NaN, φ0 = NaN, sλ0 = NaN, clean;
            return {
                lineStart: function() {
                    listener.lineStart();
                    clean = 1;
                },
                point: function(λ1, φ1) {
                    var sλ1 = λ1 > 0 ? π : -π, dλ = abs(λ1 - λ0);
                    if (abs(dλ - π) < ε) {
                        listener.point(λ0, φ0 = (φ0 + φ1) / 2 > 0 ? halfπ : -halfπ);
                        listener.point(sλ0, φ0);
                        listener.lineEnd();
                        listener.lineStart();
                        listener.point(sλ1, φ0);
                        listener.point(λ1, φ0);
                        clean = 0;
                    } else if (sλ0 !== sλ1 && dλ >= π) {
                        if (abs(λ0 - sλ0) < ε) λ0 -= sλ0 * ε;
                        if (abs(λ1 - sλ1) < ε) λ1 -= sλ1 * ε;
                        φ0 = d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1);
                        listener.point(sλ0, φ0);
                        listener.lineEnd();
                        listener.lineStart();
                        listener.point(sλ1, φ0);
                        clean = 0;
                    }
                    listener.point(λ0 = λ1, φ0 = φ1);
                    sλ0 = sλ1;
                },
                lineEnd: function() {
                    listener.lineEnd();
                    λ0 = φ0 = NaN;
                },
                clean: function() {
                    return 2 - clean;
                }
            };
        }
        function d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1) {
            var cosφ0, cosφ1, sinλ0_λ1 = Math.sin(λ0 - λ1);
            return abs(sinλ0_λ1) > ε ? Math.atan((Math.sin(φ0) * (cosφ1 = Math.cos(φ1)) * Math.sin(λ1) - Math.sin(φ1) * (cosφ0 = Math.cos(φ0)) * Math.sin(λ0)) / (cosφ0 * cosφ1 * sinλ0_λ1)) : (φ0 + φ1) / 2;
        }
        function d3_geo_clipAntimeridianInterpolate(from, to, direction, listener) {
            var φ;
            if (from == null) {
                φ = direction * halfπ;
                listener.point(-π, φ);
                listener.point(0, φ);
                listener.point(π, φ);
                listener.point(π, 0);
                listener.point(π, -φ);
                listener.point(0, -φ);
                listener.point(-π, -φ);
                listener.point(-π, 0);
                listener.point(-π, φ);
            } else if (abs(from[0] - to[0]) > ε) {
                var s = from[0] < to[0] ? π : -π;
                φ = direction * s / 2;
                listener.point(-s, φ);
                listener.point(0, φ);
                listener.point(s, φ);
            } else {
                listener.point(to[0], to[1]);
            }
        }
        function d3_geo_equirectangular(λ, φ) {
            return [ λ, φ ];
        }
        (d3.geo.equirectangular = function() {
            return d3_geo_projection(d3_geo_equirectangular);
        }).raw = d3_geo_equirectangular.invert = d3_geo_equirectangular;
        d3.geo.rotation = function(rotate) {
            rotate = d3_geo_rotation(rotate[0] % 360 * d3_radians, rotate[1] * d3_radians, rotate.length > 2 ? rotate[2] * d3_radians : 0);
            function forward(coordinates) {
                coordinates = rotate(coordinates[0] * d3_radians, coordinates[1] * d3_radians);
                return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;
            }
            forward.invert = function(coordinates) {
                coordinates = rotate.invert(coordinates[0] * d3_radians, coordinates[1] * d3_radians);
                return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;
            };
            return forward;
        };
        function d3_geo_identityRotation(λ, φ) {
            return [ λ > π ? λ - τ : λ < -π ? λ + τ : λ, φ ];
        }
        d3_geo_identityRotation.invert = d3_geo_equirectangular;
        function d3_geo_rotation(δλ, δφ, δγ) {
            return δλ ? δφ || δγ ? d3_geo_compose(d3_geo_rotationλ(δλ), d3_geo_rotationφγ(δφ, δγ)) : d3_geo_rotationλ(δλ) : δφ || δγ ? d3_geo_rotationφγ(δφ, δγ) : d3_geo_identityRotation;
        }
        function d3_geo_forwardRotationλ(δλ) {
            return function(λ, φ) {
                return λ += δλ, [ λ > π ? λ - τ : λ < -π ? λ + τ : λ, φ ];
            };
        }
        function d3_geo_rotationλ(δλ) {
            var rotation = d3_geo_forwardRotationλ(δλ);
            rotation.invert = d3_geo_forwardRotationλ(-δλ);
            return rotation;
        }
        function d3_geo_rotationφγ(δφ, δγ) {
            var cosδφ = Math.cos(δφ), sinδφ = Math.sin(δφ), cosδγ = Math.cos(δγ), sinδγ = Math.sin(δγ);
            function rotation(λ, φ) {
                var cosφ = Math.cos(φ), x = Math.cos(λ) * cosφ, y = Math.sin(λ) * cosφ, z = Math.sin(φ), k = z * cosδφ + x * sinδφ;
                return [ Math.atan2(y * cosδγ - k * sinδγ, x * cosδφ - z * sinδφ), d3_asin(k * cosδγ + y * sinδγ) ];
            }
            rotation.invert = function(λ, φ) {
                var cosφ = Math.cos(φ), x = Math.cos(λ) * cosφ, y = Math.sin(λ) * cosφ, z = Math.sin(φ), k = z * cosδγ - y * sinδγ;
                return [ Math.atan2(y * cosδγ + z * sinδγ, x * cosδφ + k * sinδφ), d3_asin(k * cosδφ - x * sinδφ) ];
            };
            return rotation;
        }
        d3.geo.circle = function() {
            var origin = [ 0, 0 ], angle, precision = 6, interpolate;
            function circle() {
                var center = typeof origin === "function" ? origin.apply(this, arguments) : origin, rotate = d3_geo_rotation(-center[0] * d3_radians, -center[1] * d3_radians, 0).invert, ring = [];
                interpolate(null, null, 1, {
                    point: function(x, y) {
                        ring.push(x = rotate(x, y));
                        x[0] *= d3_degrees, x[1] *= d3_degrees;
                    }
                });
                return {
                    type: "Polygon",
                    coordinates: [ ring ]
                };
            }
            circle.origin = function(x) {
                if (!arguments.length) return origin;
                origin = x;
                return circle;
            };
            circle.angle = function(x) {
                if (!arguments.length) return angle;
                interpolate = d3_geo_circleInterpolate((angle = +x) * d3_radians, precision * d3_radians);
                return circle;
            };
            circle.precision = function(_) {
                if (!arguments.length) return precision;
                interpolate = d3_geo_circleInterpolate(angle * d3_radians, (precision = +_) * d3_radians);
                return circle;
            };
            return circle.angle(90);
        };
        function d3_geo_circleInterpolate(radius, precision) {
            var cr = Math.cos(radius), sr = Math.sin(radius);
            return function(from, to, direction, listener) {
                var step = direction * precision;
                if (from != null) {
                    from = d3_geo_circleAngle(cr, from);
                    to = d3_geo_circleAngle(cr, to);
                    if (direction > 0 ? from < to : from > to) from += direction * τ;
                } else {
                    from = radius + direction * τ;
                    to = radius - .5 * step;
                }
                for (var point, t = from; direction > 0 ? t > to : t < to; t -= step) {
                    listener.point((point = d3_geo_spherical([ cr, -sr * Math.cos(t), -sr * Math.sin(t) ]))[0], point[1]);
                }
            };
        }
        function d3_geo_circleAngle(cr, point) {
            var a = d3_geo_cartesian(point);
            a[0] -= cr;
            d3_geo_cartesianNormalize(a);
            var angle = d3_acos(-a[1]);
            return ((-a[2] < 0 ? -angle : angle) + 2 * Math.PI - ε) % (2 * Math.PI);
        }
        function d3_geo_clipCircle(radius) {
            var cr = Math.cos(radius), smallRadius = cr > 0, notHemisphere = abs(cr) > ε, interpolate = d3_geo_circleInterpolate(radius, 6 * d3_radians);
            return d3_geo_clip(visible, clipLine, interpolate, smallRadius ? [ 0, -radius ] : [ -π, radius - π ]);
            function visible(λ, φ) {
                return Math.cos(λ) * Math.cos(φ) > cr;
            }
            function clipLine(listener) {
                var point0, c0, v0, v00, clean;
                return {
                    lineStart: function() {
                        v00 = v0 = false;
                        clean = 1;
                    },
                    point: function(λ, φ) {
                        var point1 = [ λ, φ ], point2, v = visible(λ, φ), c = smallRadius ? v ? 0 : code(λ, φ) : v ? code(λ + (λ < 0 ? π : -π), φ) : 0;
                        if (!point0 && (v00 = v0 = v)) listener.lineStart();
                        if (v !== v0) {
                            point2 = intersect(point0, point1);
                            if (d3_geo_sphericalEqual(point0, point2) || d3_geo_sphericalEqual(point1, point2)) {
                                point1[0] += ε;
                                point1[1] += ε;
                                v = visible(point1[0], point1[1]);
                            }
                        }
                        if (v !== v0) {
                            clean = 0;
                            if (v) {
                                listener.lineStart();
                                point2 = intersect(point1, point0);
                                listener.point(point2[0], point2[1]);
                            } else {
                                point2 = intersect(point0, point1);
                                listener.point(point2[0], point2[1]);
                                listener.lineEnd();
                            }
                            point0 = point2;
                        } else if (notHemisphere && point0 && smallRadius ^ v) {
                            var t;
                            if (!(c & c0) && (t = intersect(point1, point0, true))) {
                                clean = 0;
                                if (smallRadius) {
                                    listener.lineStart();
                                    listener.point(t[0][0], t[0][1]);
                                    listener.point(t[1][0], t[1][1]);
                                    listener.lineEnd();
                                } else {
                                    listener.point(t[1][0], t[1][1]);
                                    listener.lineEnd();
                                    listener.lineStart();
                                    listener.point(t[0][0], t[0][1]);
                                }
                            }
                        }
                        if (v && (!point0 || !d3_geo_sphericalEqual(point0, point1))) {
                            listener.point(point1[0], point1[1]);
                        }
                        point0 = point1, v0 = v, c0 = c;
                    },
                    lineEnd: function() {
                        if (v0) listener.lineEnd();
                        point0 = null;
                    },
                    clean: function() {
                        return clean | (v00 && v0) << 1;
                    }
                };
            }
            function intersect(a, b, two) {
                var pa = d3_geo_cartesian(a), pb = d3_geo_cartesian(b);
                var n1 = [ 1, 0, 0 ], n2 = d3_geo_cartesianCross(pa, pb), n2n2 = d3_geo_cartesianDot(n2, n2), n1n2 = n2[0], determinant = n2n2 - n1n2 * n1n2;
                if (!determinant) return !two && a;
                var c1 = cr * n2n2 / determinant, c2 = -cr * n1n2 / determinant, n1xn2 = d3_geo_cartesianCross(n1, n2), A = d3_geo_cartesianScale(n1, c1), B = d3_geo_cartesianScale(n2, c2);
                d3_geo_cartesianAdd(A, B);
                var u = n1xn2, w = d3_geo_cartesianDot(A, u), uu = d3_geo_cartesianDot(u, u), t2 = w * w - uu * (d3_geo_cartesianDot(A, A) - 1);
                if (t2 < 0) return;
                var t = Math.sqrt(t2), q = d3_geo_cartesianScale(u, (-w - t) / uu);
                d3_geo_cartesianAdd(q, A);
                q = d3_geo_spherical(q);
                if (!two) return q;
                var λ0 = a[0], λ1 = b[0], φ0 = a[1], φ1 = b[1], z;
                if (λ1 < λ0) z = λ0, λ0 = λ1, λ1 = z;
                var δλ = λ1 - λ0, polar = abs(δλ - π) < ε, meridian = polar || δλ < ε;
                if (!polar && φ1 < φ0) z = φ0, φ0 = φ1, φ1 = z;
                if (meridian ? polar ? φ0 + φ1 > 0 ^ q[1] < (abs(q[0] - λ0) < ε ? φ0 : φ1) : φ0 <= q[1] && q[1] <= φ1 : δλ > π ^ (λ0 <= q[0] && q[0] <= λ1)) {
                    var q1 = d3_geo_cartesianScale(u, (-w + t) / uu);
                    d3_geo_cartesianAdd(q1, A);
                    return [ q, d3_geo_spherical(q1) ];
                }
            }
            function code(λ, φ) {
                var r = smallRadius ? radius : π - radius, code = 0;
                if (λ < -r) code |= 1; else if (λ > r) code |= 2;
                if (φ < -r) code |= 4; else if (φ > r) code |= 8;
                return code;
            }
        }
        function d3_geom_clipLine(x0, y0, x1, y1) {
            return function(line) {
                var a = line.a, b = line.b, ax = a.x, ay = a.y, bx = b.x, by = b.y, t0 = 0, t1 = 1, dx = bx - ax, dy = by - ay, r;
                r = x0 - ax;
                if (!dx && r > 0) return;
                r /= dx;
                if (dx < 0) {
                    if (r < t0) return;
                    if (r < t1) t1 = r;
                } else if (dx > 0) {
                    if (r > t1) return;
                    if (r > t0) t0 = r;
                }
                r = x1 - ax;
                if (!dx && r < 0) return;
                r /= dx;
                if (dx < 0) {
                    if (r > t1) return;
                    if (r > t0) t0 = r;
                } else if (dx > 0) {
                    if (r < t0) return;
                    if (r < t1) t1 = r;
                }
                r = y0 - ay;
                if (!dy && r > 0) return;
                r /= dy;
                if (dy < 0) {
                    if (r < t0) return;
                    if (r < t1) t1 = r;
                } else if (dy > 0) {
                    if (r > t1) return;
                    if (r > t0) t0 = r;
                }
                r = y1 - ay;
                if (!dy && r < 0) return;
                r /= dy;
                if (dy < 0) {
                    if (r > t1) return;
                    if (r > t0) t0 = r;
                } else if (dy > 0) {
                    if (r < t0) return;
                    if (r < t1) t1 = r;
                }
                if (t0 > 0) line.a = {
                    x: ax + t0 * dx,
                    y: ay + t0 * dy
                };
                if (t1 < 1) line.b = {
                    x: ax + t1 * dx,
                    y: ay + t1 * dy
                };
                return line;
            };
        }
        var d3_geo_clipExtentMAX = 1e9;
        d3.geo.clipExtent = function() {
            var x0, y0, x1, y1, stream, clip, clipExtent = {
                stream: function(output) {
                    if (stream) stream.valid = false;
                    stream = clip(output);
                    stream.valid = true;
                    return stream;
                },
                extent: function(_) {
                    if (!arguments.length) return [ [ x0, y0 ], [ x1, y1 ] ];
                    clip = d3_geo_clipExtent(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]);
                    if (stream) stream.valid = false, stream = null;
                    return clipExtent;
                }
            };
            return clipExtent.extent([ [ 0, 0 ], [ 960, 500 ] ]);
        };
        function d3_geo_clipExtent(x0, y0, x1, y1) {
            return function(listener) {
                var listener_ = listener, bufferListener = d3_geo_clipBufferListener(), clipLine = d3_geom_clipLine(x0, y0, x1, y1), segments, polygon, ring;
                var clip = {
                    point: point,
                    lineStart: lineStart,
                    lineEnd: lineEnd,
                    polygonStart: function() {
                        listener = bufferListener;
                        segments = [];
                        polygon = [];
                        clean = true;
                    },
                    polygonEnd: function() {
                        listener = listener_;
                        segments = d3.merge(segments);
                        var clipStartInside = insidePolygon([ x0, y1 ]), inside = clean && clipStartInside, visible = segments.length;
                        if (inside || visible) {
                            listener.polygonStart();
                            if (inside) {
                                listener.lineStart();
                                interpolate(null, null, 1, listener);
                                listener.lineEnd();
                            }
                            if (visible) {
                                d3_geo_clipPolygon(segments, compare, clipStartInside, interpolate, listener);
                            }
                            listener.polygonEnd();
                        }
                        segments = polygon = ring = null;
                    }
                };
                function insidePolygon(p) {
                    var wn = 0, n = polygon.length, y = p[1];
                    for (var i = 0; i < n; ++i) {
                        for (var j = 1, v = polygon[i], m = v.length, a = v[0], b; j < m; ++j) {
                            b = v[j];
                            if (a[1] <= y) {
                                if (b[1] > y && d3_cross2d(a, b, p) > 0) ++wn;
                            } else {
                                if (b[1] <= y && d3_cross2d(a, b, p) < 0) --wn;
                            }
                            a = b;
                        }
                    }
                    return wn !== 0;
                }
                function interpolate(from, to, direction, listener) {
                    var a = 0, a1 = 0;
                    if (from == null || (a = corner(from, direction)) !== (a1 = corner(to, direction)) || comparePoints(from, to) < 0 ^ direction > 0) {
                        do {
                            listener.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0);
                        } while ((a = (a + direction + 4) % 4) !== a1);
                    } else {
                        listener.point(to[0], to[1]);
                    }
                }
                function pointVisible(x, y) {
                    return x0 <= x && x <= x1 && y0 <= y && y <= y1;
                }
                function point(x, y) {
                    if (pointVisible(x, y)) listener.point(x, y);
                }
                var x__, y__, v__, x_, y_, v_, first, clean;
                function lineStart() {
                    clip.point = linePoint;
                    if (polygon) polygon.push(ring = []);
                    first = true;
                    v_ = false;
                    x_ = y_ = NaN;
                }
                function lineEnd() {
                    if (segments) {
                        linePoint(x__, y__);
                        if (v__ && v_) bufferListener.rejoin();
                        segments.push(bufferListener.buffer());
                    }
                    clip.point = point;
                    if (v_) listener.lineEnd();
                }
                function linePoint(x, y) {
                    x = Math.max(-d3_geo_clipExtentMAX, Math.min(d3_geo_clipExtentMAX, x));
                    y = Math.max(-d3_geo_clipExtentMAX, Math.min(d3_geo_clipExtentMAX, y));
                    var v = pointVisible(x, y);
                    if (polygon) ring.push([ x, y ]);
                    if (first) {
                        x__ = x, y__ = y, v__ = v;
                        first = false;
                        if (v) {
                            listener.lineStart();
                            listener.point(x, y);
                        }
                    } else {
                        if (v && v_) listener.point(x, y); else {
                            var l = {
                                a: {
                                    x: x_,
                                    y: y_
                                },
                                b: {
                                    x: x,
                                    y: y
                                }
                            };
                            if (clipLine(l)) {
                                if (!v_) {
                                    listener.lineStart();
                                    listener.point(l.a.x, l.a.y);
                                }
                                listener.point(l.b.x, l.b.y);
                                if (!v) listener.lineEnd();
                                clean = false;
                            } else if (v) {
                                listener.lineStart();
                                listener.point(x, y);
                                clean = false;
                            }
                        }
                    }
                    x_ = x, y_ = y, v_ = v;
                }
                return clip;
            };
            function corner(p, direction) {
                return abs(p[0] - x0) < ε ? direction > 0 ? 0 : 3 : abs(p[0] - x1) < ε ? direction > 0 ? 2 : 1 : abs(p[1] - y0) < ε ? direction > 0 ? 1 : 0 : direction > 0 ? 3 : 2;
            }
            function compare(a, b) {
                return comparePoints(a.x, b.x);
            }
            function comparePoints(a, b) {
                var ca = corner(a, 1), cb = corner(b, 1);
                return ca !== cb ? ca - cb : ca === 0 ? b[1] - a[1] : ca === 1 ? a[0] - b[0] : ca === 2 ? a[1] - b[1] : b[0] - a[0];
            }
        }
        function d3_geo_compose(a, b) {
            function compose(x, y) {
                return x = a(x, y), b(x[0], x[1]);
            }
            if (a.invert && b.invert) compose.invert = function(x, y) {
                return x = b.invert(x, y), x && a.invert(x[0], x[1]);
            };
            return compose;
        }
        function d3_geo_conic(projectAt) {
            var φ0 = 0, φ1 = π / 3, m = d3_geo_projectionMutator(projectAt), p = m(φ0, φ1);
            p.parallels = function(_) {
                if (!arguments.length) return [ φ0 / π * 180, φ1 / π * 180 ];
                return m(φ0 = _[0] * π / 180, φ1 = _[1] * π / 180);
            };
            return p;
        }
        function d3_geo_conicEqualArea(φ0, φ1) {
            var sinφ0 = Math.sin(φ0), n = (sinφ0 + Math.sin(φ1)) / 2, C = 1 + sinφ0 * (2 * n - sinφ0), ρ0 = Math.sqrt(C) / n;
            function forward(λ, φ) {
                var ρ = Math.sqrt(C - 2 * n * Math.sin(φ)) / n;
                return [ ρ * Math.sin(λ *= n), ρ0 - ρ * Math.cos(λ) ];
            }
            forward.invert = function(x, y) {
                var ρ0_y = ρ0 - y;
                return [ Math.atan2(x, ρ0_y) / n, d3_asin((C - (x * x + ρ0_y * ρ0_y) * n * n) / (2 * n)) ];
            };
            return forward;
        }
        (d3.geo.conicEqualArea = function() {
            return d3_geo_conic(d3_geo_conicEqualArea);
        }).raw = d3_geo_conicEqualArea;
        d3.geo.albers = function() {
            return d3.geo.conicEqualArea().rotate([ 96, 0 ]).center([ -.6, 38.7 ]).parallels([ 29.5, 45.5 ]).scale(1070);
        };
        d3.geo.albersUsa = function() {
            var lower48 = d3.geo.albers();
            var alaska = d3.geo.conicEqualArea().rotate([ 154, 0 ]).center([ -2, 58.5 ]).parallels([ 55, 65 ]);
            var hawaii = d3.geo.conicEqualArea().rotate([ 157, 0 ]).center([ -3, 19.9 ]).parallels([ 8, 18 ]);
            var point, pointStream = {
                point: function(x, y) {
                    point = [ x, y ];
                }
            }, lower48Point, alaskaPoint, hawaiiPoint;
            function albersUsa(coordinates) {
                var x = coordinates[0], y = coordinates[1];
                point = null;
                (lower48Point(x, y), point) || (alaskaPoint(x, y), point) || hawaiiPoint(x, y);
                return point;
            }
            albersUsa.invert = function(coordinates) {
                var k = lower48.scale(), t = lower48.translate(), x = (coordinates[0] - t[0]) / k, y = (coordinates[1] - t[1]) / k;
                return (y >= .12 && y < .234 && x >= -.425 && x < -.214 ? alaska : y >= .166 && y < .234 && x >= -.214 && x < -.115 ? hawaii : lower48).invert(coordinates);
            };
            albersUsa.stream = function(stream) {
                var lower48Stream = lower48.stream(stream), alaskaStream = alaska.stream(stream), hawaiiStream = hawaii.stream(stream);
                return {
                    point: function(x, y) {
                        lower48Stream.point(x, y);
                        alaskaStream.point(x, y);
                        hawaiiStream.point(x, y);
                    },
                    sphere: function() {
                        lower48Stream.sphere();
                        alaskaStream.sphere();
                        hawaiiStream.sphere();
                    },
                    lineStart: function() {
                        lower48Stream.lineStart();
                        alaskaStream.lineStart();
                        hawaiiStream.lineStart();
                    },
                    lineEnd: function() {
                        lower48Stream.lineEnd();
                        alaskaStream.lineEnd();
                        hawaiiStream.lineEnd();
                    },
                    polygonStart: function() {
                        lower48Stream.polygonStart();
                        alaskaStream.polygonStart();
                        hawaiiStream.polygonStart();
                    },
                    polygonEnd: function() {
                        lower48Stream.polygonEnd();
                        alaskaStream.polygonEnd();
                        hawaiiStream.polygonEnd();
                    }
                };
            };
            albersUsa.precision = function(_) {
                if (!arguments.length) return lower48.precision();
                lower48.precision(_);
                alaska.precision(_);
                hawaii.precision(_);
                return albersUsa;
            };
            albersUsa.scale = function(_) {
                if (!arguments.length) return lower48.scale();
                lower48.scale(_);
                alaska.scale(_ * .35);
                hawaii.scale(_);
                return albersUsa.translate(lower48.translate());
            };
            albersUsa.translate = function(_) {
                if (!arguments.length) return lower48.translate();
                var k = lower48.scale(), x = +_[0], y = +_[1];
                lower48Point = lower48.translate(_).clipExtent([ [ x - .455 * k, y - .238 * k ], [ x + .455 * k, y + .238 * k ] ]).stream(pointStream).point;
                alaskaPoint = alaska.translate([ x - .307 * k, y + .201 * k ]).clipExtent([ [ x - .425 * k + ε, y + .12 * k + ε ], [ x - .214 * k - ε, y + .234 * k - ε ] ]).stream(pointStream).point;
                hawaiiPoint = hawaii.translate([ x - .205 * k, y + .212 * k ]).clipExtent([ [ x - .214 * k + ε, y + .166 * k + ε ], [ x - .115 * k - ε, y + .234 * k - ε ] ]).stream(pointStream).point;
                return albersUsa;
            };
            return albersUsa.scale(1070);
        };
        d3.geo.bounds = function() {
            var λ0, φ0, λ1, φ1, λ_, λ__, φ__, p0, dλSum, ranges, range;
            var bound = {
                point: point,
                lineStart: lineStart,
                lineEnd: lineEnd,
                polygonStart: function() {
                    bound.point = ringPoint;
                    bound.lineStart = ringStart;
                    bound.lineEnd = ringEnd;
                    dλSum = 0;
                    d3_geo_area.polygonStart();
                },
                polygonEnd: function() {
                    d3_geo_area.polygonEnd();
                    bound.point = point;
                    bound.lineStart = lineStart;
                    bound.lineEnd = lineEnd;
                    if (d3_geo_areaRingSum < 0) λ0 = -(λ1 = 180), φ0 = -(φ1 = 90); else if (dλSum > ε) φ1 = 90; else if (dλSum < -ε) φ0 = -90;
                    range[0] = λ0, range[1] = λ1;
                }
            };
            function point(λ, φ) {
                ranges.push(range = [ λ0 = λ, λ1 = λ ]);
                if (φ < φ0) φ0 = φ;
                if (φ > φ1) φ1 = φ;
            }
            function linePoint(λ, φ) {
                var p = d3_geo_cartesian([ λ * d3_radians, φ * d3_radians ]);
                if (p0) {
                    var normal = d3_geo_cartesianCross(p0, p), equatorial = [ normal[1], -normal[0], 0 ], inflection = d3_geo_cartesianCross(equatorial, normal);
                    d3_geo_cartesianNormalize(inflection);
                    inflection = d3_geo_spherical(inflection);
                    var dλ = λ - λ_, s = dλ > 0 ? 1 : -1, λi = inflection[0] * d3_degrees * s, antimeridian = abs(dλ) > 180;
                    if (antimeridian ^ (s * λ_ < λi && λi < s * λ)) {
                        var φi = inflection[1] * d3_degrees;
                        if (φi > φ1) φ1 = φi;
                    } else if (λi = (λi + 360) % 360 - 180, antimeridian ^ (s * λ_ < λi && λi < s * λ)) {
                        var φi = -inflection[1] * d3_degrees;
                        if (φi < φ0) φ0 = φi;
                    } else {
                        if (φ < φ0) φ0 = φ;
                        if (φ > φ1) φ1 = φ;
                    }
                    if (antimeridian) {
                        if (λ < λ_) {
                            if (angle(λ0, λ) > angle(λ0, λ1)) λ1 = λ;
                        } else {
                            if (angle(λ, λ1) > angle(λ0, λ1)) λ0 = λ;
                        }
                    } else {
                        if (λ1 >= λ0) {
                            if (λ < λ0) λ0 = λ;
                            if (λ > λ1) λ1 = λ;
                        } else {
                            if (λ > λ_) {
                                if (angle(λ0, λ) > angle(λ0, λ1)) λ1 = λ;
                            } else {
                                if (angle(λ, λ1) > angle(λ0, λ1)) λ0 = λ;
                            }
                        }
                    }
                } else {
                    point(λ, φ);
                }
                p0 = p, λ_ = λ;
            }
            function lineStart() {
                bound.point = linePoint;
            }
            function lineEnd() {
                range[0] = λ0, range[1] = λ1;
                bound.point = point;
                p0 = null;
            }
            function ringPoint(λ, φ) {
                if (p0) {
                    var dλ = λ - λ_;
                    dλSum += abs(dλ) > 180 ? dλ + (dλ > 0 ? 360 : -360) : dλ;
                } else λ__ = λ, φ__ = φ;
                d3_geo_area.point(λ, φ);
                linePoint(λ, φ);
            }
            function ringStart() {
                d3_geo_area.lineStart();
            }
            function ringEnd() {
                ringPoint(λ__, φ__);
                d3_geo_area.lineEnd();
                if (abs(dλSum) > ε) λ0 = -(λ1 = 180);
                range[0] = λ0, range[1] = λ1;
                p0 = null;
            }
            function angle(λ0, λ1) {
                return (λ1 -= λ0) < 0 ? λ1 + 360 : λ1;
            }
            function compareRanges(a, b) {
                return a[0] - b[0];
            }
            function withinRange(x, range) {
                return range[0] <= range[1] ? range[0] <= x && x <= range[1] : x < range[0] || range[1] < x;
            }
            return function(feature) {
                φ1 = λ1 = -(λ0 = φ0 = Infinity);
                ranges = [];
                d3.geo.stream(feature, bound);
                var n = ranges.length;
                if (n) {
                    ranges.sort(compareRanges);
                    for (var i = 1, a = ranges[0], b, merged = [ a ]; i < n; ++i) {
                        b = ranges[i];
                        if (withinRange(b[0], a) || withinRange(b[1], a)) {
                            if (angle(a[0], b[1]) > angle(a[0], a[1])) a[1] = b[1];
                            if (angle(b[0], a[1]) > angle(a[0], a[1])) a[0] = b[0];
                        } else {
                            merged.push(a = b);
                        }
                    }
                    var best = -Infinity, dλ;
                    for (var n = merged.length - 1, i = 0, a = merged[n], b; i <= n; a = b, ++i) {
                        b = merged[i];
                        if ((dλ = angle(a[1], b[0])) > best) best = dλ, λ0 = b[0], λ1 = a[1];
                    }
                }
                ranges = range = null;
                return λ0 === Infinity || φ0 === Infinity ? [ [ NaN, NaN ], [ NaN, NaN ] ] : [ [ λ0, φ0 ], [ λ1, φ1 ] ];
            };
        }();
        d3.geo.centroid = function(object) {
            d3_geo_centroidW0 = d3_geo_centroidW1 = d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 = d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 = d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;
            d3.geo.stream(object, d3_geo_centroid);
            var x = d3_geo_centroidX2, y = d3_geo_centroidY2, z = d3_geo_centroidZ2, m = x * x + y * y + z * z;
            if (m < ε2) {
                x = d3_geo_centroidX1, y = d3_geo_centroidY1, z = d3_geo_centroidZ1;
                if (d3_geo_centroidW1 < ε) x = d3_geo_centroidX0, y = d3_geo_centroidY0, z = d3_geo_centroidZ0;
                m = x * x + y * y + z * z;
                if (m < ε2) return [ NaN, NaN ];
            }
            return [ Math.atan2(y, x) * d3_degrees, d3_asin(z / Math.sqrt(m)) * d3_degrees ];
        };
        var d3_geo_centroidW0, d3_geo_centroidW1, d3_geo_centroidX0, d3_geo_centroidY0, d3_geo_centroidZ0, d3_geo_centroidX1, d3_geo_centroidY1, d3_geo_centroidZ1, d3_geo_centroidX2, d3_geo_centroidY2, d3_geo_centroidZ2;
        var d3_geo_centroid = {
            sphere: d3_noop,
            point: d3_geo_centroidPoint,
            lineStart: d3_geo_centroidLineStart,
            lineEnd: d3_geo_centroidLineEnd,
            polygonStart: function() {
                d3_geo_centroid.lineStart = d3_geo_centroidRingStart;
            },
            polygonEnd: function() {
                d3_geo_centroid.lineStart = d3_geo_centroidLineStart;
            }
        };
        function d3_geo_centroidPoint(λ, φ) {
            λ *= d3_radians;
            var cosφ = Math.cos(φ *= d3_radians);
            d3_geo_centroidPointXYZ(cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ));
        }
        function d3_geo_centroidPointXYZ(x, y, z) {
            ++d3_geo_centroidW0;
            d3_geo_centroidX0 += (x - d3_geo_centroidX0) / d3_geo_centroidW0;
            d3_geo_centroidY0 += (y - d3_geo_centroidY0) / d3_geo_centroidW0;
            d3_geo_centroidZ0 += (z - d3_geo_centroidZ0) / d3_geo_centroidW0;
        }
        function d3_geo_centroidLineStart() {
            var x0, y0, z0;
            d3_geo_centroid.point = function(λ, φ) {
                λ *= d3_radians;
                var cosφ = Math.cos(φ *= d3_radians);
                x0 = cosφ * Math.cos(λ);
                y0 = cosφ * Math.sin(λ);
                z0 = Math.sin(φ);
                d3_geo_centroid.point = nextPoint;
                d3_geo_centroidPointXYZ(x0, y0, z0);
            };
            function nextPoint(λ, φ) {
                λ *= d3_radians;
                var cosφ = Math.cos(φ *= d3_radians), x = cosφ * Math.cos(λ), y = cosφ * Math.sin(λ), z = Math.sin(φ), w = Math.atan2(Math.sqrt((w = y0 * z - z0 * y) * w + (w = z0 * x - x0 * z) * w + (w = x0 * y - y0 * x) * w), x0 * x + y0 * y + z0 * z);
                d3_geo_centroidW1 += w;
                d3_geo_centroidX1 += w * (x0 + (x0 = x));
                d3_geo_centroidY1 += w * (y0 + (y0 = y));
                d3_geo_centroidZ1 += w * (z0 + (z0 = z));
                d3_geo_centroidPointXYZ(x0, y0, z0);
            }
        }
        function d3_geo_centroidLineEnd() {
            d3_geo_centroid.point = d3_geo_centroidPoint;
        }
        function d3_geo_centroidRingStart() {
            var λ00, φ00, x0, y0, z0;
            d3_geo_centroid.point = function(λ, φ) {
                λ00 = λ, φ00 = φ;
                d3_geo_centroid.point = nextPoint;
                λ *= d3_radians;
                var cosφ = Math.cos(φ *= d3_radians);
                x0 = cosφ * Math.cos(λ);
                y0 = cosφ * Math.sin(λ);
                z0 = Math.sin(φ);
                d3_geo_centroidPointXYZ(x0, y0, z0);
            };
            d3_geo_centroid.lineEnd = function() {
                nextPoint(λ00, φ00);
                d3_geo_centroid.lineEnd = d3_geo_centroidLineEnd;
                d3_geo_centroid.point = d3_geo_centroidPoint;
            };
            function nextPoint(λ, φ) {
                λ *= d3_radians;
                var cosφ = Math.cos(φ *= d3_radians), x = cosφ * Math.cos(λ), y = cosφ * Math.sin(λ), z = Math.sin(φ), cx = y0 * z - z0 * y, cy = z0 * x - x0 * z, cz = x0 * y - y0 * x, m = Math.sqrt(cx * cx + cy * cy + cz * cz), u = x0 * x + y0 * y + z0 * z, v = m && -d3_acos(u) / m, w = Math.atan2(m, u);
                d3_geo_centroidX2 += v * cx;
                d3_geo_centroidY2 += v * cy;
                d3_geo_centroidZ2 += v * cz;
                d3_geo_centroidW1 += w;
                d3_geo_centroidX1 += w * (x0 + (x0 = x));
                d3_geo_centroidY1 += w * (y0 + (y0 = y));
                d3_geo_centroidZ1 += w * (z0 + (z0 = z));
                d3_geo_centroidPointXYZ(x0, y0, z0);
            }
        }
        var d3_geo_pathAreaSum, d3_geo_pathAreaPolygon, d3_geo_pathArea = {
            point: d3_noop,
            lineStart: d3_noop,
            lineEnd: d3_noop,
            polygonStart: function() {
                d3_geo_pathAreaPolygon = 0;
                d3_geo_pathArea.lineStart = d3_geo_pathAreaRingStart;
            },
            polygonEnd: function() {
                d3_geo_pathArea.lineStart = d3_geo_pathArea.lineEnd = d3_geo_pathArea.point = d3_noop;
                d3_geo_pathAreaSum += abs(d3_geo_pathAreaPolygon / 2);
            }
        };
        function d3_geo_pathAreaRingStart() {
            var x00, y00, x0, y0;
            d3_geo_pathArea.point = function(x, y) {
                d3_geo_pathArea.point = nextPoint;
                x00 = x0 = x, y00 = y0 = y;
            };
            function nextPoint(x, y) {
                d3_geo_pathAreaPolygon += y0 * x - x0 * y;
                x0 = x, y0 = y;
            }
            d3_geo_pathArea.lineEnd = function() {
                nextPoint(x00, y00);
            };
        }
        var d3_geo_pathBoundsX0, d3_geo_pathBoundsY0, d3_geo_pathBoundsX1, d3_geo_pathBoundsY1;
        var d3_geo_pathBounds = {
            point: d3_geo_pathBoundsPoint,
            lineStart: d3_noop,
            lineEnd: d3_noop,
            polygonStart: d3_noop,
            polygonEnd: d3_noop
        };
        function d3_geo_pathBoundsPoint(x, y) {
            if (x < d3_geo_pathBoundsX0) d3_geo_pathBoundsX0 = x;
            if (x > d3_geo_pathBoundsX1) d3_geo_pathBoundsX1 = x;
            if (y < d3_geo_pathBoundsY0) d3_geo_pathBoundsY0 = y;
            if (y > d3_geo_pathBoundsY1) d3_geo_pathBoundsY1 = y;
        }
        function d3_geo_pathBuffer() {
            var pointCircle = d3_geo_pathBufferCircle(4.5), buffer = [], points = [];
            var stream = {
                point: point,
                lineStart: function() {
                    stream.point = pointLineStart;
                },
                lineEnd: lineEnd,
                polygonStart: function() {
                    stream.lineEnd = lineEndPolygon;
                },
                polygonEnd: function() {
                    stream.lineEnd = lineEnd;
                    stream.point = point;
                },
                pointRadius: function(_) {
                    pointCircle = d3_geo_pathBufferCircle(_);
                    return stream;
                },
                result: function() {
                    if (buffer.length) {
                        var result = buffer.join("");
                        buffer = [];
                        return result;
                    }
                },
                points: function(){
                    return points;
                }
            };
            function point(x, y) {
                buffer.push("M", x, ",", y, pointCircle);
                //points.push("M", x, y, pointCircle);
            }
            function pointLineStart(x, y) {
                buffer.push("M", x, ",", y);
                points.push("M", x, y);
                stream.point = pointLine;
            }
            function pointLine(x, y) {
                buffer.push("L", x, ",", y);
                points.push("L", x, y);
            }
            function lineEnd() {
                stream.point = point;
            }
            function lineEndPolygon() {
                buffer.push("Z");
                //points.push("Z");
            }
            return stream;
        }
        function d3_geo_pathBufferCircle(radius) {
            return "m0," + radius + "a" + radius + "," + radius + " 0 1,1 0," + -2 * radius + "a" + radius + "," + radius + " 0 1,1 0," + 2 * radius + "z";
        }
        var d3_geo_pathCentroid = {
            point: d3_geo_pathCentroidPoint,
            lineStart: d3_geo_pathCentroidLineStart,
            lineEnd: d3_geo_pathCentroidLineEnd,
            polygonStart: function() {
                d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidRingStart;
            },
            polygonEnd: function() {
                d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
                d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidLineStart;
                d3_geo_pathCentroid.lineEnd = d3_geo_pathCentroidLineEnd;
            }
        };
        function d3_geo_pathCentroidPoint(x, y) {
            d3_geo_centroidX0 += x;
            d3_geo_centroidY0 += y;
            ++d3_geo_centroidZ0;
        }
        function d3_geo_pathCentroidLineStart() {
            var x0, y0;
            d3_geo_pathCentroid.point = function(x, y) {
                d3_geo_pathCentroid.point = nextPoint;
                d3_geo_pathCentroidPoint(x0 = x, y0 = y);
            };
            function nextPoint(x, y) {
                var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
                d3_geo_centroidX1 += z * (x0 + x) / 2;
                d3_geo_centroidY1 += z * (y0 + y) / 2;
                d3_geo_centroidZ1 += z;
                d3_geo_pathCentroidPoint(x0 = x, y0 = y);
            }
        }
        function d3_geo_pathCentroidLineEnd() {
            d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
        }
        function d3_geo_pathCentroidRingStart() {
            var x00, y00, x0, y0;
            d3_geo_pathCentroid.point = function(x, y) {
                d3_geo_pathCentroid.point = nextPoint;
                d3_geo_pathCentroidPoint(x00 = x0 = x, y00 = y0 = y);
            };
            function nextPoint(x, y) {
                var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
                d3_geo_centroidX1 += z * (x0 + x) / 2;
                d3_geo_centroidY1 += z * (y0 + y) / 2;
                d3_geo_centroidZ1 += z;
                z = y0 * x - x0 * y;
                d3_geo_centroidX2 += z * (x0 + x);
                d3_geo_centroidY2 += z * (y0 + y);
                d3_geo_centroidZ2 += z * 3;
                d3_geo_pathCentroidPoint(x0 = x, y0 = y);
            }
            d3_geo_pathCentroid.lineEnd = function() {
                nextPoint(x00, y00);
            };
        }
        function d3_geo_pathContext(context) {
            var pointRadius = 4.5;
            var stream = {
                point: point,
                lineStart: function() {
                    stream.point = pointLineStart;
                },
                lineEnd: lineEnd,
                polygonStart: function() {
                    stream.lineEnd = lineEndPolygon;
                },
                polygonEnd: function() {
                    stream.lineEnd = lineEnd;
                    stream.point = point;
                },
                pointRadius: function(_) {
                    pointRadius = _;
                    return stream;
                },
                result: d3_noop
            };
            function point(x, y) {
                context.moveTo(x, y);
                context.arc(x, y, pointRadius, 0, τ);
            }
            function pointLineStart(x, y) {
                context.moveTo(x, y);
                stream.point = pointLine;
            }
            function pointLine(x, y) {
                context.lineTo(x, y);
            }
            function lineEnd() {
                stream.point = point;
            }
            function lineEndPolygon() {
                context.closePath();
            }
            return stream;
        }
        function d3_geo_resample(project) {
            var δ2 = .5, cosMinDistance = Math.cos(30 * d3_radians), maxDepth = 16;
            function resample(stream) {
                return (maxDepth ? resampleRecursive : resampleNone)(stream);
            }
            function resampleNone(stream) {
                return d3_geo_transformPoint(stream, function(x, y) {
                    x = project(x, y);
                    stream.point(x[0], x[1]);
                });
            }
            function resampleRecursive(stream) {
                var λ00, φ00, x00, y00, a00, b00, c00, λ0, x0, y0, a0, b0, c0;
                var resample = {
                    point: point,
                    lineStart: lineStart,
                    lineEnd: lineEnd,
                    polygonStart: function() {
                        stream.polygonStart();
                        resample.lineStart = ringStart;
                    },
                    polygonEnd: function() {
                        stream.polygonEnd();
                        resample.lineStart = lineStart;
                    }
                };
                function point(x, y) {
                    x = project(x, y);
                    stream.point(x[0], x[1]);
                }
                function lineStart() {
                    x0 = NaN;
                    resample.point = linePoint;
                    stream.lineStart();
                }
                function linePoint(λ, φ) {
                    var c = d3_geo_cartesian([ λ, φ ]), p = project(λ, φ);
                    resampleLineTo(x0, y0, λ0, a0, b0, c0, x0 = p[0], y0 = p[1], λ0 = λ, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
                    stream.point(x0, y0);
                }
                function lineEnd() {
                    resample.point = point;
                    stream.lineEnd();
                }
                function ringStart() {
                    lineStart();
                    resample.point = ringPoint;
                    resample.lineEnd = ringEnd;
                }
                function ringPoint(λ, φ) {
                    linePoint(λ00 = λ, φ00 = φ), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
                    resample.point = linePoint;
                }
                function ringEnd() {
                    resampleLineTo(x0, y0, λ0, a0, b0, c0, x00, y00, λ00, a00, b00, c00, maxDepth, stream);
                    resample.lineEnd = lineEnd;
                    lineEnd();
                }
                return resample;
            }
            function resampleLineTo(x0, y0, λ0, a0, b0, c0, x1, y1, λ1, a1, b1, c1, depth, stream) {
                var dx = x1 - x0, dy = y1 - y0, d2 = dx * dx + dy * dy;
                if (d2 > 4 * δ2 && depth--) {
                    var a = a0 + a1, b = b0 + b1, c = c0 + c1, m = Math.sqrt(a * a + b * b + c * c), φ2 = Math.asin(c /= m), λ2 = abs(abs(c) - 1) < ε || abs(λ0 - λ1) < ε ? (λ0 + λ1) / 2 : Math.atan2(b, a), p = project(λ2, φ2), x2 = p[0], y2 = p[1], dx2 = x2 - x0, dy2 = y2 - y0, dz = dy * dx2 - dx * dy2;
                    if (dz * dz / d2 > δ2 || abs((dx * dx2 + dy * dy2) / d2 - .5) > .3 || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) {
                        resampleLineTo(x0, y0, λ0, a0, b0, c0, x2, y2, λ2, a /= m, b /= m, c, depth, stream);
                        stream.point(x2, y2);
                        resampleLineTo(x2, y2, λ2, a, b, c, x1, y1, λ1, a1, b1, c1, depth, stream);
                    }
                }
            }
            resample.precision = function(_) {
                if (!arguments.length) return Math.sqrt(δ2);
                maxDepth = (δ2 = _ * _) > 0 && 16;
                return resample;
            };
            return resample;
        }
        d3.geo.path = function() {
            var pointRadius = 4.5, projection, context, projectStream, contextStream, cacheStream;
            function path(object) {
                if (object) {
                    if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
                    if (!cacheStream || !cacheStream.valid) cacheStream = projectStream(contextStream);
                    d3.geo.stream(object, cacheStream);
                }
                return contextStream;//.result();
            }
            path.area = function(object) {
                d3_geo_pathAreaSum = 0;
                d3.geo.stream(object, projectStream(d3_geo_pathArea));
                return d3_geo_pathAreaSum;
            };
            path.centroid = function(object) {
                d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 = d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 = d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;
                d3.geo.stream(object, projectStream(d3_geo_pathCentroid));
                return d3_geo_centroidZ2 ? [ d3_geo_centroidX2 / d3_geo_centroidZ2, d3_geo_centroidY2 / d3_geo_centroidZ2 ] : d3_geo_centroidZ1 ? [ d3_geo_centroidX1 / d3_geo_centroidZ1, d3_geo_centroidY1 / d3_geo_centroidZ1 ] : d3_geo_centroidZ0 ? [ d3_geo_centroidX0 / d3_geo_centroidZ0, d3_geo_centroidY0 / d3_geo_centroidZ0 ] : [ NaN, NaN ];
            };
            path.bounds = function(object) {
                d3_geo_pathBoundsX1 = d3_geo_pathBoundsY1 = -(d3_geo_pathBoundsX0 = d3_geo_pathBoundsY0 = Infinity);
                d3.geo.stream(object, projectStream(d3_geo_pathBounds));
                return [ [ d3_geo_pathBoundsX0, d3_geo_pathBoundsY0 ], [ d3_geo_pathBoundsX1, d3_geo_pathBoundsY1 ] ];
            };
            path.projection = function(_) {
                if (!arguments.length) return projection;
                projectStream = (projection = _) ? _.stream || d3_geo_pathProjectStream(_) : d3_identity;
                return reset();
            };
            path.context = function(_) {
                if (!arguments.length) return context;
                contextStream = (context = _) == null ? new d3_geo_pathBuffer() : new d3_geo_pathContext(_);
                if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
                return reset();
            };
            path.pointRadius = function(_) {
                if (!arguments.length) return pointRadius;
                pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
                return path;
            };
            function reset() {
                cacheStream = null;
                return path;
            }
            return path.projection(d3.geo.albersUsa()).context(null);
        };
        function d3_geo_pathProjectStream(project) {
            var resample = d3_geo_resample(function(x, y) {
                return project([ x * d3_degrees, y * d3_degrees ]);
            });
            return function(stream) {
                return d3_geo_projectionRadians(resample(stream));
            };
        }
        var d3_arraySlice = [].slice, d3_array = function(list) {
            return d3_arraySlice.call(list);
        };
        d3.geo.transform = function(methods) {
            return {
                stream: function(stream) {
                    var transform = new d3_geo_transform(stream);
                    for (var k in methods) transform[k] = methods[k];
                    return transform;
                }
            };
        };
        function d3_geo_transform(stream) {
            this.stream = stream;
        }
        d3_geo_transform.prototype = {
            point: function(x, y) {
                this.stream.point(x, y);
            },
            sphere: function() {
                this.stream.sphere();
            },
            lineStart: function() {
                this.stream.lineStart();
            },
            lineEnd: function() {
                this.stream.lineEnd();
            },
            polygonStart: function() {
                this.stream.polygonStart();
            },
            polygonEnd: function() {
                this.stream.polygonEnd();
            }
        };
        function d3_geo_transformPoint(stream, point) {
            return {
                point: point,
                sphere: function() {
                    stream.sphere();
                },
                lineStart: function() {
                    stream.lineStart();
                },
                lineEnd: function() {
                    stream.lineEnd();
                },
                polygonStart: function() {
                    stream.polygonStart();
                },
                polygonEnd: function() {
                    stream.polygonEnd();
                }
            };
        }
        d3.geo.projection = d3_geo_projection;
        d3.geo.projectionMutator = d3_geo_projectionMutator;
        function d3_geo_projection(project) {
            return d3_geo_projectionMutator(function() {
                return project;
            })();
        }
        function d3_geo_projectionMutator(projectAt) {
            var project, rotate, projectRotate, projectResample = d3_geo_resample(function(x, y) {
                x = project(x, y);
                return [ x[0] * k + δx, δy - x[1] * k ];
            }), k = 150, x = 480, y = 250, λ = 0, φ = 0, δλ = 0, δφ = 0, δγ = 0, δx, δy, preclip = d3_geo_clipAntimeridian, postclip = d3_identity, clipAngle = null, clipExtent = null, stream;
            function projection(point) {
                point = projectRotate(point[0] * d3_radians, point[1] * d3_radians);
                return [ point[0] * k + δx, δy - point[1] * k ];
            }
            function invert(point) {
                point = projectRotate.invert((point[0] - δx) / k, (δy - point[1]) / k);
                return point && [ point[0] * d3_degrees, point[1] * d3_degrees ];
            }
            projection.stream = function(output) {
                if (stream) stream.valid = false;
                stream = d3_geo_projectionRadians(preclip(rotate, projectResample(postclip(output))));
                stream.valid = true;
                return stream;
            };
            projection.clipAngle = function(_) {
                if (!arguments.length) return clipAngle;
                preclip = _ == null ? (clipAngle = _, d3_geo_clipAntimeridian) : d3_geo_clipCircle((clipAngle = +_) * d3_radians);
                return invalidate();
            };
            projection.clipExtent = function(_) {
                if (!arguments.length) return clipExtent;
                clipExtent = _;
                postclip = _ ? d3_geo_clipExtent(_[0][0], _[0][1], _[1][0], _[1][1]) : d3_identity;
                return invalidate();
            };
            projection.scale = function(_) {
                if (!arguments.length) return k;
                k = +_;
                return reset();
            };
            projection.translate = function(_) {
                if (!arguments.length) return [ x, y ];
                x = +_[0];
                y = +_[1];
                return reset();
            };
            projection.center = function(_) {
                if (!arguments.length) return [ λ * d3_degrees, φ * d3_degrees ];
                λ = _[0] % 360 * d3_radians;
                φ = _[1] % 360 * d3_radians;
                return reset();
            };
            projection.rotate = function(_) {
                if (!arguments.length) return [ δλ * d3_degrees, δφ * d3_degrees, δγ * d3_degrees ];
                δλ = _[0] % 360 * d3_radians;
                δφ = _[1] % 360 * d3_radians;
                δγ = _.length > 2 ? _[2] % 360 * d3_radians : 0;
                return reset();
            };
            d3.rebind(projection, projectResample, "precision");
            function reset() {
                projectRotate = d3_geo_compose(rotate = d3_geo_rotation(δλ, δφ, δγ), project);
                var center = project(λ, φ);
                δx = x - center[0] * k;
                δy = y + center[1] * k;
                return invalidate();
            }
            function invalidate() {
                if (stream) stream.valid = false, stream = null;
                return projection;
            }
            return function() {
                project = projectAt.apply(this, arguments);
                projection.invert = project.invert && invert;
                return reset();
            };
        }
        function d3_geo_projectionRadians(stream) {
            return d3_geo_transformPoint(stream, function(x, y) {
                stream.point(x * d3_radians, y * d3_radians);
            });
        }
        function d3_geo_mercator(λ, φ) {
            return [ λ, Math.log(Math.tan(π / 4 + φ / 2)) ];
        }
        d3_geo_mercator.invert = function(x, y) {
            return [ x, 2 * Math.atan(Math.exp(y)) - halfπ ];
        };
        function d3_geo_mercatorProjection(project) {
            var m = d3_geo_projection(project), scale = m.scale, translate = m.translate, clipExtent = m.clipExtent, clipAuto;
            m.scale = function() {
                var v = scale.apply(m, arguments);
                return v === m ? clipAuto ? m.clipExtent(null) : m : v;
            };
            m.translate = function() {
                var v = translate.apply(m, arguments);
                return v === m ? clipAuto ? m.clipExtent(null) : m : v;
            };
            m.clipExtent = function(_) {
                var v = clipExtent.apply(m, arguments);
                if (v === m) {
                    if (clipAuto = _ == null) {
                        var k = π * scale(), t = translate();
                        clipExtent([ [ t[0] - k, t[1] - k ], [ t[0] + k, t[1] + k ] ]);
                    }
                } else if (clipAuto) {
                    v = null;
                }
                return v;
            };
            return m.clipExtent(null);
        }
        (d3.geo.mercator = function() {
            return d3_geo_mercatorProjection(d3_geo_mercator);
        }).raw = d3_geo_mercator;
        function d3_geo_transverseMercator(λ, φ) {
            return [ Math.log(Math.tan(π / 4 + φ / 2)), -λ ];
        }
        d3_geo_transverseMercator.invert = function(x, y) {
            return [ -y, 2 * Math.atan(Math.exp(x)) - halfπ ];
        };
        (d3.geo.transverseMercator = function() {
            var projection = d3_geo_mercatorProjection(d3_geo_transverseMercator), center = projection.center, rotate = projection.rotate;
            projection.center = function(_) {
                return _ ? center([ -_[1], _[0] ]) : (_ = center(), [ -_[1], _[0] ]);
            };
            projection.rotate = function(_) {
                return _ ? rotate([ _[0], _[1], _.length > 2 ? _[2] + 90 : 90 ]) : (_ = rotate(), 
                [ _[0], _[1], _[2] - 90 ]);
            };
            return projection.rotate([ 0, 0 ]);
        }).raw = d3_geo_transverseMercator;
        if (typeof define === "function" && define.amd) {
            define(d3);
        } else if (typeof module === "object" && module.exports) {
            module.exports = d3;
        } else {
            this.d3 = d3;
        }
    }();
    return d3;
})();