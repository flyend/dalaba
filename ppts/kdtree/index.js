var Chart = Dalaba.Chart;
var hasTouch = Chart.hasTouch;

(function () {
  
  function Node(obj, dimension, parent) {
    this.obj = obj;
    this.left = null;
    this.right = null;
    this.parent = parent;
    this.dimension = dimension;
  }

  function kdTree(points, metric, dimensions) {

    var self = this;
    
    function buildTree(points, depth, parent) {
      var dim = depth % dimensions.length,
        median,
        node;

      if (points.length === 0) {
        return null;
      }
      if (points.length === 1) {
        return new Node(points[0], dim, parent);
      }

      points.sort(function (a, b) {
        return a[dimensions[dim]] - b[dimensions[dim]];
      });

      median = Math.floor(points.length / 2);
      node = new Node(points[median], dim, parent);
      node.left = buildTree(points.slice(0, median), depth + 1, node);
      node.right = buildTree(points.slice(median + 1), depth + 1, node);

      return node;
    }

    this.root = buildTree(points, 0, null);

    this.insert = function (point) {
      function innerSearch(node, parent) {

        if (node === null) {
          return parent;
        }

        var dimension = dimensions[node.dimension];
        if (point[dimension] < node.obj[dimension]) {
          return innerSearch(node.left, node);
        } else {
          return innerSearch(node.right, node);
        }
      }

      var insertPosition = innerSearch(this.root, null),
        newNode,
        dimension;

      if (insertPosition === null) {
        this.root = new Node(point, 0, null);
        return;
      }

      newNode = new Node(point, (insertPosition.dimension + 1) % dimensions.length, insertPosition);
      dimension = dimensions[insertPosition.dimension];

      if (point[dimension] < insertPosition.obj[dimension]) {
        insertPosition.left = newNode;
      } else {
        insertPosition.right = newNode;
      }
    };

    this.remove = function (point) {
      var node;

      function nodeSearch(node) {
        if (node === null) {
          return null;
        }

        if (node.obj === point) {
          return node;
        }

        var dimension = dimensions[node.dimension];

        if (point[dimension] < node.obj[dimension]) {
          return nodeSearch(node.left, node);
        } else {
          return nodeSearch(node.right, node);
        }
      }

      function removeNode(node) {
        var nextNode,
          nextObj,
          pDimension;

        function findMax(node, dim) {
          var dimension,
            own,
            left,
            right,
            max;

          if (node === null) {
            return null;
          }

          dimension = dimensions[dim];
          if (node.dimension === dim) {
            if (node.right !== null) {
              return findMax(node.right, dim);
            }
            return node;
          }

          own = node.obj[dimension];
          left = findMax(node.left, dim);
          right = findMax(node.right, dim);
          max = node;

          if (left !== null && left.obj[dimension] > own) {
            max = left;
          }

          if (right !== null && right.obj[dimension] > max.obj[dimension]) {
            max = right;
          }
          return max;
        }

        function findMin(node, dim) {
          var dimension,
            own,
            left,
            right,
            min;

          if (node === null) {
            return null;
          }

          dimension = dimensions[dim];

          if (node.dimension === dim) {
            if (node.left !== null) {
              return findMin(node.left, dim);
            }
            return node;
          }

          own = node.obj[dimension];
          left = findMin(node.left, dim);
          right = findMin(node.right, dim);
          min = node;

          if (left !== null && left.obj[dimension] < own) {
            min = left;
          }
          if (right !== null && right.obj[dimension] < min.obj[dimension]) {
            min = right;
          }
          return min;
        }

        if (node.left === null && node.right === null) {
          if (node.parent === null) {
            self.root = null;
            return;
          }

          pDimension = dimensions[node.parent.dimension];

          if (node.obj[pDimension] < node.parent.obj[pDimension]) {
            node.parent.left = null;
          } else {
            node.parent.right = null;
          }
          return;
        }

        if (node.left !== null) {
          nextNode = findMax(node.left, node.dimension);
        } else {
          nextNode = findMin(node.right, node.dimension);
        }

        nextObj = nextNode.obj;
        removeNode(nextNode);
        node.obj = nextObj;

      }

      node = nodeSearch(self.root);

      if (node === null) { return; }

      removeNode(node);
    };

    this.nearest = function (point, maxNodes, maxDistance) {
      var i,
        result,
        bestNodes;

      bestNodes = new Dalaba.Heap(
        function (e) { return e[1]; }
      );

      function nearestSearch(node) {
        var bestChild,
          dimension = dimensions[node.dimension],
          ownDistance = metric(point, node.obj),
          linearPoint = {},
          linearDistance,
          otherChild,
          i;

        function saveNode(node, distance) {
          bestNodes.push([node, distance]);
          if (bestNodes.size() > maxNodes) {
            bestNodes.pop();
          }
        }

        for (i = 0; i < dimensions.length; i += 1) {
          if (i === node.dimension) {
            linearPoint[dimensions[i]] = point[dimensions[i]];
          } else {
            linearPoint[dimensions[i]] = node.obj[dimensions[i]];
          }
        }

        linearDistance = metric(linearPoint, node.obj);

        if (node.right === null && node.left === null) {
          if (bestNodes.size() < maxNodes || ownDistance < bestNodes.peek()[1]) {
            saveNode(node, ownDistance);
          }
          return;
        }

        if (node.right === null) {
          bestChild = node.left;
        } else if (node.left === null) {
          bestChild = node.right;
        } else {
          if (point[dimension] < node.obj[dimension]) {
            bestChild = node.left;
          } else {
            bestChild = node.right;
          }
        }

        nearestSearch(bestChild);

        if (bestNodes.size() < maxNodes || ownDistance < bestNodes.peek()[1]) {
          saveNode(node, ownDistance);
        }

        if (bestNodes.size() < maxNodes || Math.abs(linearDistance) < bestNodes.peek()[1]) {
          if (bestChild === node.left) {
            otherChild = node.right;
          } else {
            otherChild = node.left;
          }
          if (otherChild !== null) {
            nearestSearch(otherChild);
          }
        }
      }

      if (maxDistance) {
        for (i = 0; i < maxNodes; i += 1) {
          bestNodes.push([null, maxDistance]);
        }
      }

      nearestSearch(self.root);

      result = [];

      for (i = 0; i < maxNodes; i += 1) {
        if (bestNodes[i][0]) {
          result.push([bestNodes[i][0].obj, bestNodes[i][1]]);
        }
      }
      return result;
    };
  }

    var tree;
    var points = [];
    var canvas = document.getElementById("kdtree"),
        ctx = canvas.getContext("2d"),
        dom = canvas.parentNode,
        bbox = dom.getBoundingClientRect();
    var width = bbox.width * 0.9,
        height = bbox.height * 0.75;

    function buildTree (node, bounds) {
        var leftBounds = [],
            rightBounds = [];
        if (node !== null) {
            leftBounds[0] = bounds[0].slice(0);
            leftBounds[1] = bounds[1].slice(0);
            rightBounds[0] = bounds[0].slice(0);
            rightBounds[1] = bounds[1].slice(0);

            ctx.beginPath();
            if (node.dimension == 0) { // was split on x value
                ctx.moveTo(node.obj.x, bounds[1][0]);
                ctx.lineTo(node.obj.x, bounds[1][1]);
                leftBounds[0][1] = node.obj.x;
                rightBounds[0][0] = node.obj.x;
            } else {
                ctx.moveTo(bounds[0][0], node.obj.y);
                ctx.lineTo(bounds[0][1], node.obj.y);
                leftBounds[1][1] = node.obj.y;
                rightBounds[1][0] = node.obj.y;
            }
            ctx.closePath();
            ctx.strokeStyle = "#673ab7";
            ctx.stroke();
            ctx.fillStyle = "rgba(255,255,255,0.02)";
            ctx.fillRect(bounds[0][0], bounds[1][0], bounds[0][1]-bounds[0][0], bounds[1][1]-bounds[1][0]);
            ctx.beginPath();
            ctx.arc(node.obj.x, node.obj.y, 5, 0, Math.PI*2);
            ctx.closePath();
            ctx.fillStyle = "#fff";
            ctx.fill();
            ctx.font = "normal 18px Arial";
            ctx.fillText("(" + node.obj.x + ", " + node.obj.y + ")", node.obj.x - 20, node.obj.y - 10);
            buildTree(node.left, leftBounds);
            buildTree(node.right, rightBounds);
        }
    }

    function render (root, width, height) {
        ctx.clearRect(0, 0, width,  height);
        buildTree(root, [[0, width], [0, height]]);
    }

    for(var i = 0; i < 10; i++){
        points.push({
            x: Math.random() * width | 0,
            y: Math.random() * height | 0
        });
    }

    tree = new kdTree(points, function (a, b) {
        var dx = a.x - b.x,
            dy = a.y - b.y;
        return dx * dx + dy * dy;
    }, ["x", "y"]);

    canvas.width = width;
    canvas.height = height;

    render(tree.root, width, height);
    canvas.addEventListener(["click", "touchstart"][+hasTouch], function (e) {
        var bbox = this.getBoundingClientRect();
        var offset = {left: 0, top: 0},
            offsetX = (e.offsetX || e.clientX - offset.left),
            offsetY = (e.offsetY || e.clientY - offset.top);
        if (hasTouch) {
            offsetX = e.targetTouches[0];
            offsetY = offsetX.clientX - bbox.left;
            offsetX = offsetX.clientY - bbox.top;
        }
        var point = tree.nearest({x: offsetX, y: offsetY}, 1)[0][0];
        points.splice(points.indexOf(point), 1);
        tree.remove(point);
        render(tree.root, width, height);
    });
})();

//chartData
(function(){
    new Dalaba.Chart(document.getElementById("chartData"), {
        type: "line",
        chart: {
            height: 450,
            backgroundColor: null
        },
        title: {
            enabled: false
        },
        plotOptions: {
            line: {
                dataLabels: {
                    enabled: true,
                    style: {
                        fontSize: "18px",
                        color: "#fff"
                    }
                },
                marker: {
                    lineWidth: 6,
                    radius: 4,
                    enabled: true
                }
            }
        },
        xAxis: {
            categories: ["均值", "Q1", "Q2", "Q3", "Q4"],
            labels: {
                style: {
                    fontSize: "18px",
                    color: "#fff"
                }
            },
            gridLineWidth: 0
        },
        yAxis: {
            title: { enabled: false},
            //enabled: false,
            min: 0,
            labels: {
                style: {
                    fontSize: "18px",
                    color: "#fff"
                }
            }
        },
        legend: {enabled: false},
        
        series: [{
            data: ["80%", "2018Q1,85%", "2018Q2,76%", "2018Q3,79%", "2018Q4,86%"],
            lineWidth: 6
        }]
    });
})();
//chartTooltip
(function(){
    new Dalaba.Chart(document.getElementById("chartTooltip"), {
        type: "line",
        chart: {
            height: 450,
            backgroundColor: null
        },
        title: {
            enabled: false
        },
        plotOptions: {
            line: {
                dataLabels: {
                    enabled: true,
                    style: {
                        fontSize: "18px",
                        color: "#fff"
                    }
                },
                marker: {
                    lineWidth: 6,
                    lineColor: "#673ab7",
                    fillColor: "#fff",
                    radius: 10,
                    enabled: true
                }
            }
        },
        xAxis: {
            categories: ["A", "B", "C", "D", "E"],
            labels: {
                style: {
                    fontSize: "18px",
                    color: "#fff"
                }
            },
            gridLineWidth: 0
        },
        yAxis: {
            title: { enabled: false},
            //enabled: false,
            gridLineWidth: 1,
            lineWidth: 0,
            tickWidth: 0,
            tickLength: 10,
            labels: {
                style: {
                    fontSize: "18px",
                    color: "#fff"
                }
            }
        },
        legend: {enabled: false},
        tooltip: {
            shared: false
        },
        
        series: [{
            data: [9, 2, 1, 4, 6],
            color: "#673ab7",
            lineWidth: 6
        }, {
            data: [7, 4, 5, 9, 2],
            color: "#8bc34a",
            lineWidth: 6,
            marker: {
                lineWidth: 6,
                lineColor: "#8bc34a",
                fillColor: "#fff",
                radius: 10,
                enabled: true
            }
        }]
    });
})();

//colorTable
(function(){
    var table = document.getElementById("colorTable");
    var colorSelected = document.getElementById("colorSelected");
    var selectedText = colorSelected.innerHTML;
    var n = 10;
    var kdtree;
    var rgbs = [],
        cells,
        prevs;
    window.K = 2;

    var distance = function (a, b) {
        return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
    };
    var indexAt = function (d) {
        return d.j + d.i * n;
    };
    var reset = function () {
        var args = [].slice.call(arguments),
            tds = args[0],
            prop = args[1];
        var i = -1, n;
        if (Array.isArray(tds) && tds.length && prop && (n = (args = args.slice(2)).length)) {
            while (++i < n) cells[indexAt(tds[args[i]])].style.boxShadow = prop;
        }
    };
    
    table.innerHTML = Array.apply(null, {length: n}).map(function (_, i) {
        return "<tr>" + Array.apply(null, {length: n}).map(function (_, j) {
            var r = Math.random() * 256 | 0,
                g = Math.random() * 256 | 0,
                b = Math.random() * 256 | 0;
            rgbs.push({r: r, g: g, b: b, i: i, j: j});
            return "<td style='background-color: rgb(" + r + "," + g + "," + b + ")'>" + [r, g, b] + "</td>";
        }).join("") + "</tr>";
    }).join("");
    cells = table.getElementsByTagName("td");
    kdtree = new Dalaba.KDTree(rgbs, ["r", "g", "b"]);// 创建颜色空间，根据r，g，b维度划分

    table.addEventListener(["mouseover", "touchstart"][+hasTouch], function (e) {
        var target = e.target;
        var rgb, tds;
        if (target && target.tagName === "TD") {
            rgb = (target.textContent || "").split(",");
            tds = kdtree.nearest({r: +rgb[0], g: +rgb[1], b: +rgb[2]}, distance, window.K);// 搜索k近邻
            reset.apply(null, [prevs || [], "none"].concat((prevs || []).map(Number.call, Number)));
            reset.apply(null, [tds, "0px 0px 50px #000 inset"].concat(tds.map(Number.call, Number)));
            prevs = tds;// 状态转移
            colorSelected.innerHTML = "当前选择: " + rgb + "，近邻节点：" + tds.slice(0, -1).map(function (d) { return "(" + [d.r, d.g, d.b] + ")"; });
        }
    });
    table.addEventListener(["mouseout", "touchend"][+hasTouch], function (e) {
        var target = e.target;
        if (target && target.tagName === "TD") {
            reset.apply(null, [prevs || [], "none"].concat((prevs || []).map(Number.call, Number)));
            colorSelected.innerHTML = selectedText;
            prevs = null;
        }
    });
})();

//page 10 node
(function(){
    var container = document.getElementById("page10Canvas");
    var bbox = container.getBoundingClientRect();
    new Chart(container, {
        type: "node",
        chart: {
            backgroundColor: null
        },
        title: {
            enabled: false
        },
        legend: {
            enabled: false
        },
        series: [{
            data: [{
                name: "MChart",
                x: bbox.width / 2 + 40,
                y: 230,
                symbol: "hexagon",
                color: "#8085e9",
                radius: 80
            }, {
                name: "Line",
                x: 300,
                y: 110,
                color: "#8085e9",
                width: 100,
                height: 40
            },  {
                name: "Spline",
                x: 1,
                y: 1,
                width: 100,
                height: 40
            },  {
                name: "Area",
                x: 1,
                y: 65,
                width: 100,
                height: 40
            },  {
                name: "Areaspline",
                x: 1,
                y: 130,
                width: 100,
                height: 40
            },  {
                name: "Bar",
                x: 1,
                y: 230,
                width: 100,
                height: 40
            },  {
                name: "Column",
                x: 1,
                y: 330,
                width: 100,
                height: 40
            }, {
                name: "Pie",
                x: 1,
                y: 430,
                width: 100,
                height: 40
            }, {
                name: "Node",
                x: bbox.width - 100,
                y: 30,
                width: 100,
                height: 40
            }, {
                name: "Venn",
                x: bbox.width - 100,
                y: 130,
                width: 100,
                height: 40
            }, {
                name: "Funnel",
                x: bbox.width - 100,
                y: 230,
                width: 100,
                height: 40
            }, {
                name: "Map",
                x: bbox.width - 100,
                y: 330,
                width: 100,
                height: 40
            }, {
                name: "Heatmap",
                x: bbox.width - 100,
                y: 430,
                width: 100,
                height: 40
            }, {
                name: "Color",
                x: bbox.width / 7 - 50,
                y: bbox.height - 50,
                symbol: "circle",
                radius: 50
            }, {
                name: "Animation",
                x: bbox.width / 7 * 2 - 50,
                y: bbox.height - 50,
                symbol: "circle",
                radius: 50
            }, {
                name: "Text",
                x: bbox.width / 7 * 3 - 50,
                y: bbox.height - 50,
                symbol: "circle",
                radius: 50
            }, {
                name: "Tooltip",
                x: bbox.width / 7 * 4 - 50,
                y: bbox.height - 50,
                symbol: "circle",
                radius: 50
            }, {
                name: "Axis",
                x: bbox.width / 7 * 5 - 50,
                y: bbox.height - 50,
                symbol: "circle",
                radius: 50
            }, {
                name: "Legend",
                x: bbox.width / 7 * 6 - 50,
                y: bbox.height - 50,
                symbol: "circle",
                radius: 50
            }],
            links: [
                {source: "MChart", target: "Line"},
                {source: "Line", target: "Spline", lineWidth: 2, lineColor: "#2b908f"},
                {source: "Line", target: "Area", lineWidth: 2, lineColor: "#2b908f"},
                {source: "Line", target: "Areaspline", lineWidth: 2, lineColor: "#2b908f"},
                {source: "MChart", target: "Bar"},
                {source: "MChart", target: "Column"},
                {source: "MChart", target: "Pie"},
                {source: "MChart", target: "Node"},
                {source: "MChart", target: "Venn"},
                {source: "MChart", target: "Funnel"},
                {source: "MChart", target: "Map"},
                {source: "MChart", target: "Heatmap"},
                {source: "MChart", target: "Color", lineWidth: 2},
                {source: "MChart", target: "Animation", lineWidth: 2},
                {source: "MChart", target: "Text", lineWidth: 2},
                {source: "MChart", target: "Tooltip", lineWidth: 2},
                {source: "MChart", target: "Axis", lineWidth: 2},
                {source: "MChart", target: "Legend", lineWidth: 2}
            ],
            lineWidth: 4,
            lineColor: "#fff",
            dataLabels: {
                style: {
                    color: "#fff",
                    fontSize: "24px",
                    fontWeight: "100"
                }
            }
        }]
    });
});

//主要工作内容
(function(){
    new Chart(document.getElementById("pie"), {
        type: "pie",
        chart: {
            backgroundColor: null
        },
        title: {
            enabled: false
        },
        series: [{
            data: [
                {name: "MChart组件", value: 70, sliced: true},
                {name: "星空及其他项目", value: 15},
                {name: "学习", value: 10},
                {name: "其他", value: 5}
            ],
            dataLabels: {
                style: {
                    fontSize: "24px",
                    color: "#fff"
                },
                formatter: function(){
                    return this.name + "(" + this.value + "%)";
                }
            }
        }]
    });
});

//工作能力 bar
(function(){
    new Chart(document.getElementById("bar"), {
        type: "column",
        chart: {
            backgroundColor: null
        },
        title: {
            text: "工作能力",
            style: {
                fontSize: "48px",
                color: "#fff"
            }
        },
        legend: {
            style: {
                color: "#fff",
                fontSize: "18px"
            }
        },
        xAxis: {
            categories: ["代码量", "bug率", "delay率", "学习能力", "爆发力"],
            labels: {
                style: {
                    color: "#fff",
                    fontSize: "18px"
                }
            },
            gridLineColor: "#fff",
            lineColor: "#fff"
        },
        yAxis: {
            title: { text: "最高10分", style: { color: "#fff"}},
            labels: {
                style: {
                    color: "#fff",
                    fontSize: "18px"
                }
            },
            max: 10,
            gridLineColor: "#fff",
            lineColor: "#fff"
        },
        
        series: [{
            name: "数据指标",
            data: [8, 0.1, 0.001, 5, 7]
        }]
    });
});

//end
(function(){
    var container = document.getElementById("end"),
        canvas = container.getElementsByTagName("canvas")[0],
        bbox = container.getBoundingClientRect();
    var context = canvas.getContext("2d");
    var width = bbox.width,
        height = bbox.height;
    var Event = Chart.Event;

    var hasDragging = false;

    var postion = {x: 0, y: 0};

    canvas.width = width;
    canvas.height = height;

    context.fillStyle = "#333";
    context.fillRect(0, 0, width, height);
   
    canvas.addEventListener("mousedown", function(e){
        var box = canvas.getBoundingClientRect();
        e = Event.normalize(e, this);
        container.style.cursor = "default";
        
        hasDragging = true;
        postion.x = e.x * (canvas.width / box.width);
        postion.y = e.y * (canvas.height / box.height);
    }, false);
    canvas.addEventListener("mousemove", function(e){
        e.preventDefault();
        if(hasDragging){
            var box = canvas.getBoundingClientRect();
            e = Event.normalize(e, this);
            e.x = e.x * (canvas.width / box.width);
            e.y = e.y * (canvas.height / box.height);
            container.style.cursor = "default";
            context.lineWidth = 8;
            context.lineCap = "round";
            context.strokeStyle = "#fff";
            context.beginPath();
            context.moveTo(postion.x, postion.y);
            context.lineTo(postion.x = e.x, postion.y = e.y);
            context.stroke();
        }
    }, true);
    canvas.addEventListener("mouseup",function(){
        hasDragging = false;
    }, false);

    canvas.addEventListener("dblclick", function(){
        context.clearRect(0, 0, width, height); 
    });
});