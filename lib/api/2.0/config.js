// Copyright 2016, EMC, Inc.

'use strict';

var injector = require('../../../index.js').injector;
var controller = injector.get('Http.Services.Swagger').controller;
var config = injector.get('Http.Services.Api.Config');

var configGet = controller(function(req) {
    return config.configGetAll(req.query);
});

var configPatch = controller(function(req) {
    return config.configSet(req.body);
});

var configColorGet = controller(function(req) {
    return config.configGetColor(req.query);
});

var configColorPut = controller(function(req) {
    return config.configSetColor(req.body);
});

module.exports = {
    configGet: configGet,
    configPut: configPatch,
    configPatch: configPatch,
    configColorPut: configColorPut,
    configColorGet: configColorGet
};

