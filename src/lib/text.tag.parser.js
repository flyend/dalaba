(function(){
    var regLib = {
        tag: {
            br: /<br\s*\/?>/,
            all: /<([b|i|u])>(.*?)<\/\1>/g
        },
        specialSym: /([<>&])/g
    };

    var specialMap = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;'
    };

    var utils = {
        filterIllegalSym: function (str) {
            return str.replace(regLib.specialSym, function (unit, sym) {
                return specialMap[sym] || unit;
            });
        }
    };

    var parseBr = function (str, keepPure) {
        if (!(str = "" + str) || !regLib.tag.br.test(str)) {
            return [{type: 'normal', value: str}];
        }
        var group = str.split(regLib.tag.br);
        var parsedGroup = [];
        var strUnit;
        var gL = group.length;
        var gLLess = gL - 1;
        for (var i = 0; i < gLLess; i++) {
            strUnit = group[i];
            if (strUnit === '') {
                parsedGroup.push({
                    type: 'br'
                });
                continue;
            }
            if (keepPure) {
                strUnit = utils.filterIllegalSym(strUnit);
            }
            parsedGroup
                .splice(parsedGroup.length, 0, {type: 'normal', value: strUnit}, {type: 'br'});
        }

        // 结尾处特殊处理
        if (gLLess >= 0) {
            strUnit = group[gLLess];
            if (strUnit !== '') {
                if (keepPure) {
                    strUnit = utils.filterIllegalSym(strUnit);
                }
                parsedGroup.push({
                    type: 'normal',
                    value: strUnit
                });
            }
        }

        return parsedGroup;
    };

    var tagParser = function (strUnit, keepPure) {
        var tagReg = /<([b|i|u])>(.*?)<\/\1>/ig;
        if (!(strUnit = "" + strUnit)) {
            return parseBr(strUnit, keepPure);
        }
        var group = [];
        var execResult;
       
        //var startPos = strUnit.search(tagReg);
        var lastPos = 0;

        while (execResult = tagReg.exec(strUnit)) {
            var fullStr = execResult[0];
            var tagType = execResult[1];
            var mixinStr = execResult[2];
            var leftOffset = tagReg.lastIndex - lastPos - fullStr.length;
            if (leftOffset > 0) {
                var extraStr = strUnit.substr(lastPos, leftOffset);
                group = group.concat(parseBr(extraStr, keepPure));
            }
            var nextParsedVal = tagParser(mixinStr, keepPure);
            lastPos = tagReg.lastIndex;
            group.push({
                type: tagType,
                value: nextParsedVal
            });
        }

        if (lastPos < strUnit.length) {
            group = group.concat(parseBr(strUnit.slice(lastPos), keepPure));
        }

        return group.length ? group : parseBr(strUnit, keepPure);
    };

    var btagParser = function (str, keepPure) {
        return tagParser(str, keepPure);
    };
    
    return btagParser;
})()