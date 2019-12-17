"use strict";
var Event = require('events');
var gulp = require('gulp');
var config = require('./tools/config.json');
var utils = require('./tools/utils');
var channel = new Event();

var taskList = [
    {
        name: 'server',
        core: require('./tools/task/taskServer')
    },
    {
        name: 'dalaba',
        core: require('./tools/task/taskDalaba')
    }
];
var taskConf = config.task;
var globalConf = config.global;

var runTask = function () {
    taskList.forEach(function (task) {
        task.core(channel, taskConf[task.name] || {}, globalConf, utils, task.extra);
    });
};

gulp.task('pre-publish-cdn', function () {
    var mchartBuild = require('./tools/task/taskBuild');
    mchartBuild(taskConf['dalababuild'], globalConf, utils);
});
gulp.task('default', runTask);