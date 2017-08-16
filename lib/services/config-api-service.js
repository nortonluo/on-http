// Copyright 2016, EMC, Inc.

'use strict';

var di = require('di');

module.exports = configApiServiceFactory;
di.annotate(configApiServiceFactory, new di.Provide('Http.Services.Api.Config'));
di.annotate(configApiServiceFactory,
    new di.Inject(
        'Services.Configuration',
        '_',
        'LogEvent'
    )
);
function configApiServiceFactory(
    configuration,
    _,
    LogEvent
) {
    function ConfigApiService() {
    }

    /**
     * Get server configuration
     * @return {Promise}
     */

    ConfigApiService.prototype.configGetAll = function () {
        // get the config

        return configuration.getAll();
    };

    ConfigApiService.prototype.configGetColor = function () {
        // get the config
        
        var val=configuration.get("logColorEnable");
        return {enable:(val === undefined) ? false : val};
    };

    /**
     * Set server configuration
     * @param {Object} [req] HTTP request
     * @param {Object} [res] HTTP response
     * @return {Promise}
     */

    ConfigApiService.prototype.configSet = function(config) {

        _.forOwn(config, function (value, key) {
            configuration.set(key, value);
        });

        return configuration.getAll();
    };
  
    ConfigApiService.prototype.configSetColor = function(config) {
        var value = config.enable;
        configuration.set("color", value);
        configuration.set("logColorEnable", value); 
        LogEvent.setColorEnable(value); 
        return {color:configuration.get("color"),logColoerEnable:configuration.get("logColorEnable")};
    };
    return new ConfigApiService();
}
