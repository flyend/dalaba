var connect = require('gulp-connect');
var gulp = require('gulp');
var modRewrite = require('connect-modrewrite');

var registerReload = function (channel, globalConf, utils) {
    channel.addListener('RELOAD', function (taskName, reloadFiles) {
        if (reloadFiles) {
            utils.log('Task', 'Reload By [' + taskName + ']');
            gulp.src(reloadFiles)
                .pipe(connect.reload());
        }
    });
};

var taskServer = function (channel, conf, globalConf, utils) {
    utils.log('Sys', 'Start Server');
    var rewriteRules = globalConf.rewriteRules || [];
    var middlewareList = [];
    if (rewriteRules.length) {
        middlewareList = [
            modRewrite(rewriteRules)
        ];
    }
    connect.server({
        root: [globalConf.root],
        port: conf.port,
        debug: !!globalConf.debug,
        livereload: {
            port: conf.port * 10
        },
        middleware: function () {
            return middlewareList;
        },
        fallback: conf.fallback
    });

    // 注册刷新
    registerReload(channel, globalConf, utils);
};

module.exports = taskServer;