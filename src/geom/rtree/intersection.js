function intersects (p0, p1) {
    var rx = (p0.x - p1.x) * (p0.x - (p1.x + p1.width));
    var ry = (p0.y - p1.y) * (p0.y - (p1.y + p1.height));
    return rx <= 0.0 && ry <= 0.0;
}

function contains (p0, p1) {
    return p0.x <= p1.x &&
        p0.x + p0.width >= p1.x + p1.width &&
        p0.y <= p1.y &&
        p0.y + p0.height >= p1.y + p1.height;
}