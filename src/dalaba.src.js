"use strict";
!(function(global) {

    var Dalaba = require("lib/dalaba");

    require("chart/chart");
    require("chart/tooltip");
    require("chart/legend");
    require("chart/axis");
    require("chart/rangeselector");

    require("line/line");
    require("column/column");
    require("pie/pie");
    require("scatter/scatter");
    require("funnel/funnel");
    require("radar/radar");
    require("map/map");
    require("venn/venn");
    require("heatmap/heatmap");
    require("k/k");
    require("sankey/sankey");
    require("diagram/diagram");

    require("lib/animation");
    require("lib/touch");
    require("../theme/mobile.theme");

    //layout
    require("lib/layout").deps(Dalaba);

    if (typeof module === "object" && module.exports) {
        module.exports = Dalaba;
    }
    else if (typeof define === "function" && define.amd) {
        define(function() {
            return Dalaba;
        });
    }
    else {
        global.Dalaba = Dalaba;
    }
})(typeof window !== "undefined" ? window : this);