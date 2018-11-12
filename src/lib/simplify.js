(function () {

    var abs = Math.abs;

    var lerp = function (a, b, t) {
        return a + (b - a) * t;
    };

    var area = function () {
        var sum = 0,
            n = 0;
        return [].forEach.call(arguments, function (d, _, v) {
            ++n & 1 && (sum += d * v[n]);
        }), n < 1 && n & 1 ? NaN : sum;
    };

    var length = function (p0, p1, p2) {
        var p01x = p0.x - p1.x,
            p01y = p0.y - p1.y,
            p21x = p2.x - p1.x,
            p21y = p2.y - p1.y,
            p20x = p2.x - p0.x,
            p20y = p2.y - p0.y;
        var p12length = area(p21x, p21x, p21y, p21y);
        var t = p12length === 0
            ? area(p01x, p01x, p01y, p01y)
            : area(p01x, p21x, p01y, p21y) / p12length;
        if (t < 0) {
            return area(p01x, p01x, p01y, p01y);
        }
        else if (t > 1) {
            return area(p20x, p20x, p20y, p20y);
        }
        p21x = lerp(p1.x, p2.x, t);
        p21y = lerp(p1.y, p2.y, t);
        return area(p0.x - p21x, p0.x - p21x, p0.y - p21y, p0.y - p21y);
    };

    var triangle = function (p0, p1, p2) {
        return abs(
            (p0.x - p2.x) * (p1.y - p0.y) - 
            (p0.x - p1.x) * (p2.y - p0.y)
        );
    };

    function simplify (points, left, right, weights, threshold) {
        var maxValue = 0,//distance > 0
            maxIndex = 0;
        var distance;
        var i;

        if (right > (i = left + 1)) {
            for (; i < right; i++) {
                distance = length(points[i], points[left], points[right]);//最长的线段距离
                if (distance > maxValue) {
                    maxIndex = i;
                    maxValue = distance;
                }
            }
            if (maxValue > threshold) {
                weights[maxIndex] = true;

                simplify(points, left, maxIndex, weights, threshold);// 分治
                simplify(points, maxIndex, right, weights, threshold);
            }
        }
    }

    function filter (buffer, caller) {
        var points = [];
        var n = buffer.length - 1,// not last point
            i, j;
        for (i = j = 0; i < n; i++) if (caller(buffer[i], i) === true) {
            points[j++] = buffer[i];
        }
        return points;
    }

    function douglasPeucker (threshold) {

        function toBuffer (points, tol) {
            var prev = points[0],
                curt;
            var buffer = [];
            var n = points.length - 1,
                i, j;

            buffer[0] = points[0];

            for (j = i = 1; i <= n; i++) {
                curt = points[i];
                if (area.apply(null, Array(2).fill(curt.x - prev.x).concat(Array(2).fill(curt.y - prev.y))) < tol) {
                    continue;
                }
                buffer[j++] = prev = curt;
            }

            if (j < n) buffer.push(points[n]);

            return buffer;
        }

        return function (points) {
            var weights = [];
            var tol;
            
            var buffer, n;
            var ret = [];

            if (!isNaN(+arguments[1]))
                threshold = arguments[1];

            tol = threshold * threshold;
            buffer = toBuffer(points, tol);
            n = buffer.length - 1;

            weights[0] = weights[n] = 1;

            simplify(buffer, 0, n, weights, tol);

            ret = filter(buffer, function (_, i) { return weights[i] === true; });
            
            weights = buffer = null;

            return ret;
        };
    }

    function visvalingam (Heap, LinkedList) {

        var compare = function (a, b) {
            return a.value - b.value;
        };

        var heap = new Heap(compare);

        function buildLL (points, values) {
            var n = points.length;
            var linklist;
            (linklist = new LinkedList(Array(n))).forEach(function (d, i) {
                var prev = this.head,// i - 1;
                    next = this.tail;// i + 1;
                var point = prev < 0 || /*next >= n*/ next < 0 ? Infinity : triangle(points[prev], points[i], points[next]);
                point = { value: point, index: i};
                values[i] = point;
                heap.push(point);
            });
            return linklist;
        }

        function updateLL (linklist, points, values) {
            var prev, next;
            var maxValue = -Infinity;
            var point, value, index;
            var node;
            var n = points.length;

            while (!heap.empty()) {
                point = heap.pop();
                index = point.index;
                value = values[index].value;

                if (value === Infinity) break;

                if (value < maxValue) values[index] = maxValue;
                else maxValue = value;

                node = linklist[index];

                prev = node.head;
                next = node.tail;

                if (prev > 0) {
                    heap.update(prev, {
                        index: prev,
                        value: triangle(points[linklist[prev].head], points[prev], points[next])
                    });
                }
                if (next < n - 1 && next !== -1) {
                    heap.update(next, {
                        index: next,
                        value: triangle(points[prev], points[next], points[linklist[next].tail])
                    });
                }
                linklist[prev].tail = next;// update linklist
                linklist[next].head = prev;
            }
        }

        return function (points, threshold) {
            var values;
            var tol = threshold * threshold;

            var linklist;

            if (isNaN(+tol))
                tol = 0;

            heap = new Heap(compare);
            linklist = buildLL(points, values = []);// init linked list

            updateLL(linklist, points, values);// update

            values = [];

            filter(heap.data, function (d) {
                if (d.value >= tol) {
                    values.push(points[d.index]);
                }
            });
            values.push(points[heap.data.slice(-1)[0].index]);
            //console.log(values.length, tol, heap.data.length);
            heap = null, linklist = null;

            return values;
        };
    }

    return {
        deps: function (Heap, LinkedList) {
            return {
                douglasPeucker: douglasPeucker(0),// default threshold is 0
                visvalingam: visvalingam(Heap, LinkedList)
            };
        }
    };
})()