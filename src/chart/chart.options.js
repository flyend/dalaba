(function () {
    return {
        type: "line",
        chart: {
            width: undefined,
            height: undefined,
            spacing: hasTouch ? [0, 0, 0, 0] : [10, 10, 15, 10],
            backgroundColor: "#FFFFFF",
            style: {
                fontFamily: "\"Lucida Grande\", \"Lucida Sans Unicode\", Verdana, Arial, Helvetica, sans-serif",
                fontSize: "12px",
                fontWeight: "normal",
                color: "#333333"
            },
            reflow: true,
            animation: {
                duration: 500,
                easing: "ease-in-out"
            }
        },
        colors: ["#50E3C2", "#21A6EE", "#807CCC", "#72e6f7", "#8cd49c", "#ffc977", "#b794d5", "#f7a35c", "#434348", "#f15c80", "#e4d354", "#2b908f", "#f45b5b", "#91e8e1"],
        title: {
            enabled: true,
            text: "Chart title",
            align: "center",
            margin: [0, 0, 10, 0],
            style: {
                fontSize: "16px",
                fontWeight: "bold"
            },
            x: 0,
            y: 0
        },
        subtitle: {
            enabled: false,
            text: undefined,
            align: "center",
            style: {
                fontSize: "13px"
            },
            x: 0,
            y: 0,
            margin: [3, 0, 5, 0]
        },
        legend: {
            enabled: true,
            style: {
                color: "#606060",
                fontWeight: "bold",
                cursor: "default"
            }
        },
        tooltip: {
            enabled: true,
            shared: true,
            useHTML: true
        },
        yAxis: {
            title: {
                enabled: true
            },
            type: "linear",
            lineColor: "#d3d0cb",
            lineWidth: 1,
            tickColor: "#d3d0cb",
            tickWidth: 1,
            gridLineColor: "#f3f2f0",
            gridLineWidth: 1
        },
        xAxis: {
            type: "categories",
            title: {
                enabled: false
            },
            lineColor: "#d3d0cb",
            lineWidth: 1,
            tickColor: "#d3d0cb",
            tickWidth: 1,
            gridLineColor: "#f3f2f0",
            gridLineWidth: 1
        },
        colorAxis: {
            //enabled: true,
            title: {
                enabled: false
            },
            layout: "vertical",
            floating: true,
            verticalAlign: "top",
            tickLength: 20,
            lineWidth: 0,
            labels: {
                align: "center"
            },
            size: 150,
            x: 10,
            y: 15,
            stops: [
                [0, "#EFEFFF"],
                [1, "#102D4C"]
            ]//default stops
        },
        polarAxis: {
            //type: "categories",
            //enabled: true,
            startAngle: undefined,//default -90,//top
            endAngle: undefined,
            //size: "85%",
            //center: ["50%", "50%"],//center
            //tickLength: 6,
            tickColor: "rgba(0,0,0,.5)",
        },
        radiusAxis: {
            type: "linear",
            enabled: false
        },
        plotOptions: {
            series: {
                allowOverlap: false
            },
            line: {
                lineWidth: 2,
                marker: {
                    //enabled: null,//auto
                    radius: 4,
                    //lineColor: "#ffffff",
                    lineWidth: 0
                },
                dataLabels: {
                    enabled: false,
                    style: {
                        color: "#606060"
                    }
                }
            },
            spline: {
                lineWidth: 2,
                marker: {
                    radius: 4
                },
                dataLabels: {
                    enabled: false,
                    style: {
                        color: "#606060"
                    }
                }
            },
            area: {
                lineWidth: 2,
                marker: {
                    radius: 4
                },
                dataLabels: {
                    enabled: false,
                    style: {
                        color: "#606060"
                    }
                }
            },
            areaspline: {
                lineWidth: 2,
                marker: {
                    radius: 4
                },
                dataLabels: {
                    enabled: false,
                    style: {
                        color: "#606060"
                    }
                }
            },
            column: {
                borderColor: "#FFFFFF",
                borderRadius: 0,
                borderWidth: 0,
                dataLabels: {
                    enabled: false,
                    //align: "center",[left|center|right]
                    //verticalAlign: "top",[top|middle|bottom]
                    style: {
                        color: "#606060"
                    }
                }
            },
            bar: {
                borderColor: "#FFFFFF",
                borderRadius: 0,
                borderWidth: 0,
                dataLabels: {
                    enabled: false,
                    //align: "right",[left|center|right]
                    //verticalAlign: "middle",[top|middle|bottom]
                    style: {
                        color: "#606060"
                    }
                }
            },
            pie: {
                showInLegend: false,
                borderColor: "#FFFFFF",
                borderWidth: 1,
                dataLabels: {
                    enabled: true,
                    distance: hasTouch ? 0 : 15,
                    inside: hasTouch ? true : undefined,
                    connectorWidth: 1,
                    connectorPadding: 10,
                    style: {
                        color: "#606060"
                    }
                }
            },
            funnel: {
                showInLegend: false,
                borderColor: "#FFFFFF",
                borderWidth: 1,
                dataLabels: {
                    enabled: true,
                    distance: hasTouch ? 0 : 30,
                    inside: hasTouch ? true : undefined,
                    style: {
                        color: "#606060"
                    }
                }
            },
            map: {
                borderColor: "rgb(204, 204, 204)",
                borderWidth: 1,
                dataLabels: {
                    enabled: false,
                    align: "center",
                    style: {
                        color: "#606060"
                    }
                }
            },
            venn: {
                borderColor: "#FFFFFF",
                borderWidth: 1,
                dataLabels: {
                    enabled: true,
                    style: {
                        color: "#606060"
                    }
                }
            },
            heatmap: {
                dataLabels: {
                    enabled: false
                },
                radius: 30,
                blur: 0.15,
                fillColor: {
                    linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 256,
                        y2: 1
                    },
                    stops: [
                        [0.25, "rgb(0,0,255)"],
                        [0.55, "rgb(0,255,0)"],
                        [0.85, "yellow"],
                        [1, "rgb(255,0,0)"]
                    ]
                }
            },
            diagram: {
                borderColor: "#333333",
                borderWidth: 1,
                lineWidth: 1,
                dataLabels: {
                    enabled: true,
                    align: "center",
                    style: {
                        color: "#606060"
                    }
                }
            },
            radar: {
                lineWidth: 2,
                marker: {
                    radius: 4,
                    lineWidth: 0
                },
                dataLabels: {
                    enabled: false,
                    style: {
                        color: "#606060"
                    }
                }
            },
            scatter: {
                marker: {
                    enabled: true,
                    radius: 4
                }
            },
            candlestick: {
                lineWidth: 0,
                color: ["green", "red"],
                lineColor: ["green", "red"]
            },
            boxplot: {
                maxPointWidth: 50
            }
        },
        credits: {
            enabled: true,
            text: "Dalaba",
            style: {
                cursor: "pointer",
                color: "#909090",
                fontSize: "10px"
            },
            href: undefined,
            position: {
                align: "right",
                x: -10,
                y: -5,
                verticalAlign: "bottom"
            }
        },
        rangeSelector: {
            //enabled: false,
            //start: "0%",
            //end: "100%"
        },
        layout: {
            type: "flow"//grid, border, box
        },
        toolbar: {
            enabled: false
        }
    };
})();