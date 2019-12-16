function linklistAdd (node, prev, prevprev) {
    if (!prev) {
        node.next = node.prev = null;
    }
    else {
        node.next = null, node.prev = prev.id;
        prev.next = node.id, prev.prev = prevprev ? prevprev.id : null;
    }
}
function linklistInsert (prev, cur, next) {
    cur.next = cur.prev = null;

    if (prev) {
        cur.prev = prev.id;
        prev.next = cur.id;
    }
    if (next) {
        cur.next = next.id;
        next.prev = cur.id;
    }
}
function linklistRemove (prev, cur, next) {
    var nextId = cur.next,
        prevId = cur.prev;

    if (prev) prev.next = nextId;
    if (next) next.prev = prevId;
    cur.prev = cur.next = null;
}
function linklistJoin (alink, blink) {
    var n = alink.length, i = 0;
    var node, last;
    var sortWeighted;

    if (n) {
        last = alink[n - 1];
        sortWeighted = last.sortWeighted;
        if (sortWeighted != null && (n = blink.length)) {
            for (i = 0; i < n; i++) {
                node = blink[i];
                node.sortWeighted = sortWeighted + i + 1;
                alink.push(node);
            }
        }
    }
    else {
        [].push.apply(alink, blink);
    }
}