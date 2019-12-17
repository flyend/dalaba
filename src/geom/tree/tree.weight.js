function sortWeight (arrays, value) {
    var n = arrays.length,
        i = 0, m;
    if (value.sortWeighted == null) value.sortWeighted = 0;

    if (!n || (arrays[n - 1].sortWeighted === 0 && value.sortWeighted === 0)) return arrays.push(value) - 1;
    else {
        while (i < n) {
            m = i + n >>> 1;
            if (/*arrays[m].sortWeighted === 0 || */arrays[m].sortWeighted < value.sortWeighted) i = m + 1;
            else n = m;
        }
        arrays.splice(i, 0, value);
    }
    return i;
}

function resetWeight (prev, node, next) {
    if (prev && next) {
        node.sortWeighted = (prev.sortWeighted + next.sortWeighted) / 2;
    }
    else if (prev === null && next) {
        node.sortWeighted = next.sortWeighted - 1;
    }
    else if (prev && next === null) {
        node.sortWeighted = prev.sortWeighted === 0 ? 0 : prev.sortWeighted + 1;
    }
}