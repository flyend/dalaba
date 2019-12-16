function distance (a, b) {
    // a is current node, b is new node
    var minX, minY, maxX, maxY;
    var area;

    if (a.isRoot === true) return b.width * b.height;
    area = a.width * a.height;
    minX = nativeMin(a.x, b.x);
    minY = nativeMin(a.y, b.y);
    maxX = nativeMax(a.x + a.width, b.x + b.width);
    maxY = nativeMax(a.y + a.height, b.y + b.height);

    return (maxX - minX) * (maxY - minY) - area;
}