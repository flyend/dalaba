(function () {

    var MAX_VALUE = Number.MAX_VALUE;

    var nativeMin = Math.min;

    //a0[p0,p1) and a1[q0,q1)
    function left (a0, a1, p1, p2, q1, q2, compare, memo) {
        var i, j;
        var diag;

        memo[p1 % 2][q1] = 0;

        for (j = q1 + 1; j <= q2; j++)
            memo[p1 % 2][j] = memo[p1 % 2][j - 1] + 1;

        for (i = p1 + 1; i <= p2; i++) {
            memo[i % 2][q1] = memo[(i - 1) % 2][q1] + 1;
            for (j = q1 + 1; j <= q2; j++) {
                diag = memo[(i - 1) % 2][j - 1];
                if (!compare(a0[i - 1], a1[j - 1]))
                    diag += 1;
                memo[i % 2][j] = nativeMin(diag, nativeMin(memo[(i - 1) % 2][j] + 1, memo[i % 2][j - 1] +  1));
            }
        }
    }

    //reverse(a0[p1..p2)) and reverse(a1[q1..q2))
    function right (a0, a1, p1, p2, q1, q2, compare, memo) {
        var i, j;
        var diag;

        memo[p2 % 2][q2] = 0;

        for (j = q2 - 1; j >= q1; j--)
            memo[p2 % 2][j] = memo[p2 % 2][j + 1] + 1;

        for (i = p2 - 1; i >= p1; i--) {
            memo[i % 2][q2] = memo[(i + 1) % 2][q2] + 1;
            for (j = q2 - 1; j >= q1; j--) {
                diag = memo[(i + 1) % 2][j + 1];
                if (!compare(a0[i], a1[j]))
                    diag += 1;
                memo[i % 2][j] = nativeMin(diag, nativeMin(memo[(i + 1) % 2][j] + 1, memo[i % 2][j + 1] + 1));
            }
        }
    }

    //align a0[p1..p2) with a1[q1..q2)
    function align (a0, a1, p0, p1, q0, q1, score0, score1, compare, append) {
        var ret = [];
        var item, memo = 0;
        var i, j;
        //a0 is empty
        if(p1 <= p0) {
            for (j = q0; j < q1; j++) {
                ret.push(append("+", j));
            }
        }
        //a1 is empty
        else if (q1 <= q0) {
            for (i = p0; i < p1; i++) {
                ret.push(append("-", i));
            }
        }
        //a0 is one, a1 is not empty
        else if (p1 - 1 === p0) {
            item = a0[p0];
            memo = 0;
            for (j = q0; j < q1; j++) if (compare(item, a1[j]) && !memo && (memo = 1)) {
                ret.push(append("=", p0, j));
            }
            else ret.push(append("+", j));
            !memo && ret.push(append("-", p0));
        }
        else if (q1 - 1 === q0) {
            item = a1[q0];
            memo = 0;
            for (i = p0; i < p1; i++) {
                if (compare(item, a0[i]) && !memo && (memo = 1)) {
                    ret.push(append("=", i, q0));
                }
                else {
                    ret.push(append("-", i));
                }
            }
            !memo && ret.push(append("+", q0));
        }
        else {
            var middle = p0 + p1 >> 1;
            var bestSum, bestIndex, sum;

            left(a0, a1, p0, middle, q0, q1, compare, score0);// 分治
            right(a0, a1, middle, p1, q0, q1, compare, score1);

            bestIndex = q0;
            bestSum = MAX_VALUE;

            for (i = q0; i <= q1; i++) {
                sum = score0[middle % 2][i] + score1[middle % 2][i];
                if (sum < bestSum) {
                    bestSum = sum;
                    bestIndex = i;
                }
            }
            // 合并 merge
            ret = align(a0, a1, p0, middle, q0, bestIndex, score0, score1, compare, append)
                .concat(align(a0, a1, middle, p1, bestIndex, q1, score0, score1, compare, append));
        }
        return ret;
    }
    return align;
})