(function () {

    var hasOwnProperty = ({}).hasOwnProperty;

    function streamGeometry (geometry, stream) {
        var type;
        if (geometry && hasOwnProperty.call(streamGeometryType, type = geometry.type)) {
            streamGeometryType[type](geometry, stream);
        }
    }

    var streamObjectType = {
        Feature: function (object, stream) {
            streamGeometry(object.geometry, stream);
        },
        FeatureCollection: function (object, stream) {
            object.features.forEach(function (feature) {
                streamGeometry(feature.geometry, stream);
                stream.feature && stream.feature(feature);
            });
        }
    };

    var streamGeometryType = {
        Sphere: function (object, stream) {
            stream.sphere();
        },
        Point: function (object, stream) {
            object = object.coordinates;
            stream.point(object[0], object[1], object[2]);
        },
        MultiPoint: function (object, stream) {
            object.coordinates.forEach(function (coordinates) {
                stream.point(coordinates[0], coordinates[1], coordinates[2]);
            });
        },
        LineString: function (object, stream) {
            streamLine(object.coordinates, stream, 0);
        },
        MultiLineString: function (object, stream) {
            object.coordinates.forEach(function (coordinates) {
                streamLine(coordinates, stream, 0);
            });
        },
        Polygon: function (object, stream) {
            streamPolygon(object.coordinates, stream);
        },
        MultiPolygon: function (object, stream) {
            object.coordinates.forEach(function (coordinates) {
                streamPolygon(coordinates, stream);
            });
        },
        GeometryCollection: function (object, stream) {
            object.geometries.forEach(function (geometries) {
                streamGeometry(geometries, stream);
            });
        }
    };

    function streamLine (coordinates, stream, closed) {
        var i = -1, n = coordinates.length - closed, coordinate;
        stream.lineStart && stream.lineStart(coordinates);
        while (++i < n) coordinate = coordinates[i], stream.point(coordinate[0], coordinate[1], coordinate[2]);
        stream.lineEnd && stream.lineEnd(coordinates);
    }

    function streamPolygon (coordinates, stream) {
        stream.polygonStart && stream.polygonStart(coordinates);
        if (!coordinates.length) streamLine(coordinates, stream, 0);
        coordinates.forEach(function (coordinates) {
            streamLine(coordinates, stream, 1);
        });
        stream.polygonEnd && stream.polygonEnd(coordinates);
    }

    function geomCollection (geojson, context) {
        var type = geojson.type;
        geojson && hasOwnProperty.call(streamObjectType, type)
            ? streamObjectType[type](geojson, context)
            : streamGeometry(geojson, context);
    }

    if (typeof module === "object" && module.exports) {
        module.exports = geomCollection;
    }
    else if (typeof define === "function" && define.amd) {
        define(function () {
            return geomCollection;
        });
    }
    return geomCollection;
}).call(typeof window !== "undefined" ? window : this);