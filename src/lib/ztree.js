(function(factoy) {
    var exports = {
        deps: function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return factoy.apply(null, [].concat(args));
        }
    };
    return exports;
}).call(this, function(partition) {

    var Tree = function(parent, leaf) {
        this.parent = parent;
        if(leaf !== null)
            this.leaf = leaf;
    };

    var buildTree = function(data, parent, dimensions, depth) {
        var dim = dimensions[depth];
        var tree;
        var length, i;
        var id = 0, key;

        if (depth >= dimensions.length) {
            return new Tree(parent, data);
        }
        var groups = partition(data, function(a, b) {
            if(typeof a[dim] === "undefined" && typeof b[dim] === "undefined")
                return false;
            return a[dim] === b[dim];
        });
        tree = new Tree(parent, null);//no leaf
        //tree.node = [];
        for(i = 0, length = groups.length; i < length; i++){
            //tree.node.push(buildTree(groups[i], tree, dimensions, depth + 1));
            key = groups[i][0][dim];
            if(typeof key === "undefined"){
                key = "z-" + ++id;//会有冲突
            }
            tree[key] = buildTree(groups[i], tree, dimensions, depth + 1);
        }
        return tree;
    };

    var ZTree = function(data, dimensions) {
        return new ZTree.init(data.slice(0), dimensions);
    };

    ZTree.init = function(data, dimensions) {
        this.build(data, dimensions);
        return this;
    };
    ZTree.prototype = {
        build: function(data, dimensions){
            this.root = buildTree(data, null, dimensions, 0);
            //console.log(this.root);
        },
        update: function(add, modify){
            var root = this.root;

            var setProp = function(node, attrs){
                for(var p in attrs){
                    node[p] = attrs[p];
                }
            };

            var each = function(root){
                var props,
                    newProps = { };

                if(!root){
                    return null;
                }
                if(root.leaf){
                    newProps = props = add && add(root.leaf);
                    setProp(root, props);
                    return props;
                }
                
                for(var p in root) if(root.hasOwnProperty(p)){
                    if(p !== "parent"){
                        props = each(root[p]);
                        if(props){
                            newProps = modify && modify(newProps, props);
                        }
                    }
                }
                setProp(root, newProps);
                return newProps;
            };

            each(root);

            return this;
        },
        getRoot: function(){
            return this.root;
        }
    };
    ZTree.init.prototype = ZTree.prototype;
    return ZTree;
})