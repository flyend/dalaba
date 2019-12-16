;(function (global, factory) {
    typeof exports === "object" && typeof module !== "undefined"
        ? factory(exports)
        : typeof define === "function" && define.amd
            ? define(["exports"], factory)
            : factory((global.Dalaba = global.Dalaba || {}));
}(typeof window !== "undefined" ? window : typeof this !== "undefined" ? this : global, (function (exports) {
    "use strict";

    require("lib/dalaba")(exports);

    require("geom/geom").deps(exports);

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
    require("boxplot/boxplot");
    require("sankey/sankey");
    require("diagram/diagram");

    require("lib/animation");
    require("lib/touch");
    require("../theme/mobile.theme");

    //layout
    require("lib/layout").deps(exports);

    Object.defineProperty(exports, "__esModule", { value: true });
})));