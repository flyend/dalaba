(function () {
    var hasOwnProperty = ({}).hasOwnProperty;

    var toString = ({}).toString;

    var isString = function (d) {
        return toString.call(d) === "[object Object]";
    };

    var isFunction = function (d) {
        return toString.call(d) === "[object Function]";
    };

    var camelize = function (s) {
        return s.replace(/-(\w)/g, function (_, c) {
            return c ? c.toUpperCase() : "";
        });
    };

    var namespace = function (context, selector, value) {
        var tokens = selector.split(/\s+/g),
            ns = context[tokens[0]] = context[tokens[0]] || {};
        tokens.slice(1).forEach(function (d) {
            ns = ns[d] = ns[d] || {};
        });
        return Object.assign(ns, value);
    };

    var merge = function (source, target) {
        var p;
        for (p in target) if (!hasOwnProperty.call(source, p) && hasOwnProperty.call(target, p)) {
            source[p] = target[p];
        }
    };

    var isPrimitive = function (content) {
        var start = content[0],
            end = content[content.length - 1];
        var primitive = 0;

        switch (true) {
            case start.charCodeAt() === 0x7B && end.charCodeAt() === 0x7D: primitive = 1; break;
            case start.charCodeAt() === 0x5B && end.charCodeAt() === 0x5D: primitive = 1; break;
            default: primitive = 0; break;
        }
        return primitive;
    };

    var parseJSON = function (content) {
        var vars = this.var;
        var start = content[0],
            args = [].slice.call(arguments, 1);
        var primitive = 0;
        var evalFn = content;
        var callArgs;

        try {
            if (primitive = isPrimitive(content)) {
                evalFn = JSON.parse(content);
            }
            else if (content.substr(0, 1) === "@") {
                start = content.indexOf("(");
                primitive = content.substr(1, start < 0 ? content.length : start - 1).trim();
                if (primitive && hasOwnProperty.call(vars, primitive)) {
                    if (start < 0) {
                        evalFn = isFunction(vars[primitive]) ? vars[primitive].apply(vars, args) : vars[primitive];
                    }
                    else {
                        // only one call is supported
                        callArgs = content.substr(-~start, content.lastIndexOf(")") - start - 1);
                        callArgs = new Function("", "return [" + callArgs + "]")();
                        evalFn = vars[primitive].apply(null, callArgs);
                        return isFunction(evalFn) ? evalFn.apply(vars, args) : evalFn;
                    }
                }
            }
            else if (content.substr(0, 8) === "function") {
                start = content.indexOf("{");
                evalFn = new Function("", [
                    "return " + content.substr(0, start - 1) + " {",
                    vars == null ? "if (true) {" : "with (this.var) {",
                    content.substr(start + 1),
                    "}"
                ].join("\n"))().apply(this, args);
            }
            return evalFn;
        }
        catch (_) {
            console.error("error parse " + _ + ".");
            return content;
        }
    };

    var CSSParser = (function () {

        var propertyMap = function (styles, isvar) {
            var props;
            [].forEach.call(styles, function (prop) {
                var name = prop.trim(),
                    value;
                var prefix;
                name = name.substr(name.substr(0, 2) === "--" ? 2 : 0);
                value = (styles.getPropertyValue(prop) || "").trim();
                if (isvar) {
                    prefix = value.indexOf("{");
                    value = new Function("", "return " +
                        (value.substr(0, 8) === "function"
                            ? [value.substr(0, prefix - 1),
                                " { ",
                                "with (this) {",
                                value.substr(prefix + 1),
                                " }"
                            ].join("\n")
                            : value)
                    ).apply(this, [prop]);
                }
                if (name && value) {
                    props || (props = {});
                    props[camelize(name)] = value;
                }
            }, this);
            return props;
        };

        var attrMap = function (rule) {
            var prefix, suffix, ns, attr;
            if (!isString(rule) && (rule = (rule || "").trim()) && !rule.length) {
                return null;
            }
            prefix = rule.indexOf("[");
            suffix = rule.lastIndexOf("]");
            if (prefix * suffix < 0) {
                return null;
            }
            ns = rule.substr(0, prefix).trim();
            attr = rule.substr(-~prefix, ~-suffix - prefix).trim();
            if (!ns.length || !attr.length || attr.indexOf("[") + attr.lastIndexOf("]") > -1) {
                return null;
            }
            return {
                ns: ns,
                name: attr,
                value: null // TODO parse attribute value
            };
        };

        var styleSheets = function (cssText) {
            var style = document.createElement("style");
            style.type = "text/css";
            style.innerText = cssText;
            document.head.appendChild(style);
            return style.sheet;// document.styleSheets[0];
        };

        var parser = function (rule) {
            var selector = (rule.selectorText || "").trim(),
                styles = rule.style;
            var props;
            var isvar = selector === "var" || selector === "function";
            
            if (selector.length) {
                props = propertyMap.call(this, styles, isvar);
                if (isvar) {
                    Object.assign(this.var, props);
                }
                else {
                    if (hasOwnProperty.call(this.rules, selector)) {
                        props = Object.assign(this.rules[selector], props);
                    }
                    else {
                        this.rules[selector] = props;
                    }
                    props && namespace(this._json, selector, props);
                }
            }
        };

        function CSSParser (cssText, options) {
            return new CSSParser.fn.init(cssText, options);
        }

        CSSParser.parse = function (cssText, options) {
            return new CSSParser.fn.init(cssText, options);
        };

        CSSParser.fn = CSSParser.prototype = {
            constructor: CSSParser,
            init: function (cssText, options) {
                this.rules = {};
                this.var = {};
                this._json = {};

                this.useJSON = !!options || !!(options && options.useJSON);
                
                if (cssText) {
                    if (cssText.sheet instanceof CSSStyleSheet) {
                        this.sheet = cssText.sheet;
                    }
                    else {
                        this.sheet = styleSheets(cssText);
                    }
                    if (this.sheet.cssRules != null) {
                        [].forEach.call(this.sheet.cssRules, function (rule) {
                            parser.call(this, rule);
                        }, this);

                        merge(this, this._json);
                    }
                }

                return this;
            },
            addRule: function (rule, value) {
                var newRule, rules;
                this.sheet.addRule(rule, value);
                rules = this.sheet.cssRules;
                if (rules != null) {
                    newRule = rules[rules.length - 1];
                    parser.call(this, newRule);
                    merge(this, this._json);
                }
            },
            attr: function (rule) {
                var rules = this.rules,
                    vars = this.var,
                    useJSON = this.useJSON,
                    context = this;
                var attr = attrMap(rule), ns;// namespace and attr name&value
                var args = [].slice.call(arguments, 1),
                    objects,
                    n,
                    i = -1,
                    ob;

                var parseTo = function (d) {
                    return useJSON ? parseJSON.apply(context, [d].concat(args)) : d;
                };

                if (attr === null) return null;
                ns = attr.ns;
                attr = attr.name;
                objects = args.concat(rules[ns]);//[].splice.call(objects, objects.length, 0, rules[ns]);
                n = objects.length;

                while (++i < n) if (ob = objects[i]) {
                    if (hasOwnProperty.call(ob, attr)) {
                        return parseTo(ob[attr]);
                    }
                }
                return null;
            },
            rule: function (rule) {
                var rules = this.rules;
                var newRule = null, p;
                var context = this;

                var toPrimitive = function (content) {
                    var evalFn = content;

                    if (content.includes("false")) return false;
                    else if (content.includes("true")) return true;

                    try {
                        if (isPrimitive(content)) {
                            evalFn = JSON.parse(content);
                        }
                    }
                    catch (_) {
                        console.error("Uncaught SyntaxError: Unexpected token o in JSON " + _ + ".");
                    }
                    return evalFn;
                };

                if (hasOwnProperty.call(rules, rule)) {
                    rule = rules[rule];
                    if (!this.useJSON) return rule;

                    for (p in rule) if (hasOwnProperty.call(rule, p)) {
                        newRule || (newRule = {});
                        newRule[p] = toPrimitive.call(context, rule[p]);
                    }
                    return newRule;
                }
                return null;
            },
            toJSON: function () {
                return this._json;
            },
            clear: function () {
                this.sheet.deleteRule();
                this.rules = {};
                this._json = {};
            }
        };

        CSSParser.fn.init.prototype = CSSParser.fn;

        return CSSParser;
    })();

    if (typeof module === "object" && module.exports) {
        module.exports = CSSParser;
    }
    else if (typeof define === "function" && define.amd) {
        define(function () {
            return CSSParser;
        });
    }
    else {
        global.CSSParser = CSSParser;
    }
    return CSSParser;
}).call(typeof global !== "undefined" ? global : window);