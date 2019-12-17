function find (parents, i) {
    if (!(i in parents)) return "" + i;
    return find(parents, parents[i]);
}
function union (parents, x, y) {
    var xset = find(parents, x),
        yset = find(parents, y);
    xset !== yset && (parents[xset] = yset);
}