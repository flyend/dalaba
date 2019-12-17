(function () {

    require("./tree.weight");
    require("./linklist");
    require("./union");

    function factoy (Dalaba) {
        var isArray = Dalaba.isArray;

        function addEdge (adj, u, v, mask) {
            if (mask & 1) return (adj[v] = adj[v] || []);
            if (mask & 2) return (adj[u] = adj[u] || []).push(v), adj[u];
        }
        function addNode (adj, id, node, copy) {
            node.parent = node.pid;
            adj[id] = node;
            adj[id].data = copy;
        }

        var Tree = (function () {

            var Tree, protoAccessors;

            var indices, nodes;

            function build (data, indices, nodes, addRoot) {
                var root = null;
                var parents = {};
                var cycling = false;
                var n, i;
                var node, x, y;

                data = (isArray(data) ? data : []);
                n = data.length, i = 0;

                for (; !addRoot && i < n; i++) {
                    node = data[i];
                    x = find(parents, node.id);
                    y = find(parents, node.pid);
                    if (n > 1 && x === y) {
                        cycling = true;// if both subsets are same, then there is cycle in graph.
                        break;
                    }
                    union(parents, x, y);
                    nodeAdd(node, node.pid);
                }

                if (cycling) {
                    indices = Object.create(null);
                    nodes = Object.create(null);
                    parents = null;
                    console.error("tree data exists cycling.");
                    return null;
                }

                function parentRoot (nodes, id, pid) {
                    var node = nodes[id];
                    if (id === pid || node == null) return "" + id;

                    return parentRoot(nodes, node.parent, id);
                }

                parents = null;
                root = isArray(data) && data.length ? parentRoot(nodes, data[0].id, data[0].pid) : null;
                return root !== null ? (nodes[root] = { pid: null, id: "" + root, parent: null, next: null, prev: null }) : null;
            }

            function checkInserted (parents, id) {
                var n = parents.length, i;
                var parent;
                var checkin = false;

                for (i = 0; i < n && !checkin; i++) if (checkin = (parent = parents[i]).id === id);

                return checkin;
            }

            var nodeAdd = function (node, pid, beforeId) {
                var index, id;
                var childs, copy;
                var prev, next, cur;

                if (node && (id = node.id) != null) {
                    copy = Object.assign({}, node);

                    childs = addEdge(indices, node, pid, 0x01);

                    // if (pid === beforeId) beforeId = null;

                    if (beforeId == null || protoAccessors.get(beforeId) === null) {
                        index = sortWeight(childs, node);// first node push
                        if (childs.length) {
                            prev = childs[index - 1], next = childs[index + 1];
                            // for (var i = 1; i < childs.length; i++) linklistAdd(childs[i], childs[i - 1], childs[i - 2]);
                            linklistInsert(prev, node, next);
                        }
                    }
                    else {
                        index = childs.length;// childs.indexOf(protoAccessors.get(beforeId));
                        do {
                            cur = childs[--index];
                            childs[index + 1] = childs[index];
                            if (cur.id === beforeId) break;
                        } while (index >= 0);
                        if (index === -1) {
                            sortWeight(childs, node);
                        }
                        else {
                            next = childs[index], prev = childs[index - 1];
                            childs[index] = node;
                            linklistInsert(prev, node, next);
                        }
                    }
                    
                    addNode(nodes, id, node, copy);

                    // reset weight
                    if (childs.length && node.sortWeighted === 0) {
                        prev = protoAccessors.prev(id), next = protoAccessors.next(id);
                        resetWeight(prev, node, next);
                    }
                }
                return node;
            };

            /**
             * insertBefore
             * 源节点存在用insertBefore
             * 源节点不存在则用appendChild
            **/

            var nodeInserted = function (id, pid, beforeId) {
                var source = this.get(id),
                    target;
                var before, childs;
                var beforePrev, beforeNext;
                var parent, inserted = id === pid || checkInserted(this.parents(pid, id) || [], id);// 弱检测

                if (arguments.length === 1) {
                    pid = this.root.id;
                }
                target = this.get(pid);
                // TODO beforeId not pid

                if (target !== null && !inserted) {
                    parent = this.parents(id);

                    if (parent !== null && source) {
                        childs = this.childrens(parent.id, false) || [];
                        childs.splice(childs.indexOf(source), 1);
                        if (childs.length === 0) {
                            delete indices[parent.id];// this.remove(parent.id, false);
                        }
                    }
                    childs = this.childrens(pid, false);
                    before = this.get(beforeId);

                    // insertBefore
                    if (source !== null) {
                        if (beforeId == null || before === null) {
                            beforePrev = childs[childs.length - 1];
                            childs.splice(childs.indexOf(source), 0);
                            childs.push(source);
                            beforeNext = null;
                            
                            linklistRemove(this.prev(source.id), source, this.next(source.id));
                            linklistInsert(beforePrev, source, beforeNext);
                            resetWeight(beforePrev, source, beforeNext);
                        }
                        else {
                            childs.splice(childs.indexOf(before), 0, source);
                            beforePrev = this.prev(before.id);
                            beforeNext = this.get(before.id);
                            
                            linklistRemove(this.prev(source.id), source, this.next(source.id));
                            linklistInsert(beforePrev, source, beforeNext);
                            resetWeight(beforePrev, source, beforeNext);
                        }
                        source.parent = source.pid = pid;
                        //childs.length && linklistAdd(childs[childs.length - 1], childs[childs.length - 2], childs[childs.length - 3]);
                    }
                    else {
                        // append
                        if (beforeId == null || before === null) {
                            //delete source.sortWeighted;// unbind sort weight
                            if (this.isleaf(pid)) {
                                (childs = addEdge(indices, source, pid, 0x01)).push(source);
                            }
                            else {
                                linklistJoin(childs, [source]);
                                //childs = sortWeighted(addEdge(indices, source, pid, 0x01), source);
                            }
                        }
                    }
                }
            };

            Tree = function (data) {
                this.root = build(data, indices = Object.create(null), nodes = Object.create(null));
                this.indices = indices; this.nodes = nodes;
            };
            protoAccessors = {
                // append new node
                add: function (node, pid, beforeId) {
                    if (arguments.length) {
                        if (this.root === null) return this.root = build([node], indices, nodes, true);
                        if (pid == null) pid = this.root.id;
                        return nodeAdd(node, pid, beforeId);
                    }
                    return null;
                },
                remove: function (id, noDeep) {
                    var parent = this.parents(id);
                    var childs = this.childrens(id, false),
                        child;
                    var lastSibling;
                    var siblings, node = this.get(id);
                    var i;

                    if (id != null && parent !== null) {
                        // 从父节点中删除自身
                        if (parent != null) {
                            siblings = this.childrens(parent.id, false); // 删除父索引，兄弟节点包含自己
                            for (i = 0; i < siblings.length; i++) {
                                child = siblings[i];
                                if ("" + child.id === "" + id) {
                                    linklistRemove(siblings[i - 1], child, siblings[i + 1]);
                                    siblings.splice(i, 1);// 删除子节点， 删除自身
                                }
                            }
                        }

                        if (noDeep !== false) {
                            // deep remove all children
                            this.dfs(id, function (node) {
                                delete nodes[node.id];
                                //maps[node.id] = node.id;
                            });
                        }
                        // no leaf
                        else if (childs.length) {
                            parent = this.get(parent.id);

                            if (parent != null) {
                                if (siblings.length) {
                                    lastSibling = siblings[siblings.length - 1];
                                    lastSibling.next = childs[0].id;
                                    childs[0].prev = lastSibling.id;
                                    childs.forEach(function (node) {
                                        node.parent = node.pid = parent.id;
                                        siblings.push(node);
                                        typeof lastSibling.sortWeighted === "number" && (node.sortWeighted = ++lastSibling.sortWeighted);
                                    });
                                }
                                else {
                                    indices[parent.id] = childs;// no sort
                                }
                            }
                        }
                        delete nodes[id];
                        delete indices[id];

                        // 更新关系
                        if (parent != null && siblings.length === 0) {
                            delete indices[parent.id];
                        }
                        
                        siblings = childs = null;
                        return node;
                    }
                },
                // move exists node
                insert: nodeInserted,
                get: function (id) {
                    if (id != null) {
                        //if (id === this.root.id) return this.root;
                        return nodes[id] || null;
                    }
                    return null;
                },
                next: function (id) {
                    var node = nodes[id];
                    var nextId;
                    if (node != null) {
                        node = nodes[nextId = node.next];
                        return nextId !== null && node != null ? node : null;
                    }
                    return null;
                },
                prev: function (id) {
                    var node = nodes[id];
                    var prevId;
                    if (node != null) {
                        node = nodes[prevId = node.prev];
                        return prevId !== null && node != null ? node : null;
                    }
                    return null;
                },
                treeify: function () {

                },
                parents: function (id, toId, contains) {
                    var root = this.root;
                    var parentId = id;
                    var node = nodes[id];
                    var ancestors = [], ancestor;

                    if ("" + id === root.id + "") return null;
                    if (node == null) return null;
                    parentId = "" + node.parent;// if ((parentId = "" + node.parent) == null) return null;

                    if (toId != null) {
                        if (contains === true && parentId === root.id && toId !== parentId) return null;
                        while (parentId != null) {
                            ancestor = nodes[parentId];
                            if (ancestor == null) break;
                            ancestors.push(ancestor);

                            if (contains === true && parentId === root.id && toId !== parentId) return null;// check parent id not root
                            if (toId === parentId) break;// no parents to root
                            parentId = ancestor.parent;
                        }
                        return ancestors;
                    }
                    else {
                        node = nodes[parentId];
                        return node || null;
                    }
                },
                childrens: function (id, noDeep) {
                    var nodes = [];
                    if (id == null) id = this.root.id;
                    if (noDeep === false) {
                        return indices[id] || [];
                    }
                    this.dfs(id, function (node) {
                        if ("" + node.id !== "" + id) nodes.push(node);
                    });
                    return nodes;
                },
                siblings: function (id) {
                    var parentId = nodes[id];

                    if (parentId && (parentId = parentId.parent) != null) {
                        return (indices[parentId] || []).filter(function (node) {
                            return "" + node.id !== "" + id;
                        });
                    }
                    return null;
                },
                isleaf: function (id) {
                    if (id === this.root.id) return false;
                    return indices[id] == null;
                },
                hasSibling: function (id) {
                    var parent = this.parents(id);
                    if (parent != null) {
                        return (indices[parent.id] || []).length > 1;
                    }
                    return false;
                },
                dfs: require("./dfs"),
                bfs: function (fromId, callback) {
                    var queue = [this.root];
                    var edges, node;
                    var i = 0;

                    while (queue.length) {
                        node = queue.shift();
                        edges = indices[node.id] || [];
                        if (edges.length) [].push.apply(queue, edges);
                        callback && callback.call(node, node, i, edges);
                        i++;
                    }
                    queue = null;
                },
                clear: function () {
                    indices = nodes = null;
                }
            };

            Tree.prototype = protoAccessors;

            return Tree;
        })();

        return Tree;
    }

    var exports = (function (global) {
        return {
            deps: function (Dalaba) {
                return factoy.call(global, Dalaba);
            }
        };
    })(this);

    if (typeof module === "object" && module.exports) {
        module.exports = exports;
    }
    else if (typeof define === "function" && define.amd) {
        define(function () {
            return exports;
        });
    }
    return exports;
})(typeof window !== "undefined" ? window : this)