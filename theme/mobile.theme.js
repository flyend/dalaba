if (Dalaba.Chart.hasTouch) {
    Dalaba.Chart.setOptions({
        legend: {
            itemMarginBottom: 12
        },
        tooltip: {
            backgroundColor: "#00bfa9",
            shadow: false,
            style: {
                fontSize: "14px",
                color: "#FFFFFF"
            },
            positioner: function(x, y, position){
                return {x: position.plotX, y: 0};
            },
            hideDelay: 0
        },
        plotOptions: {
            line: {
                lineWidth: 3,
                marker: {
                    fillColor: "#FFFFFF",
                    lineWidth: 2
                }
            },
            spline: {
                lineWidth: 3,
                marker: {
                    fillColor: "#FFFFFF",
                    lineWidth: 2
                }
            },
            area: {
                lineWidth: 1,
                marker: {
                    fillColor: "#FFFFFF",
                    lineWidth: 2
                }
            },
            areaspline: {
                lineWidth: 1,
                marker: {
                    fillColor: "#FFFFFF",
                    lineWidth: 2
                }
            },
            pie: {
                borderWidth: 0,
                dataLabels: {
                    connectorWidth: 1.5,
                    inside: true,
                    style: {
                        fontSize: "14px"
                    }
                }
            },
            funnel: {
                borderWidth: 0
            }
        }
    });
}