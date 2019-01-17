/* jshint esversion: 6 */

/**
 * The "meat" of your app will be controlled in this file.
 * Use the Main View to control how to display
 * Models/Collections in Views and how the user will interact
 * with those views. Feel free to scrap this entirely and start
 * fresh.
 */

// NODE MODULES/LIBRARIES
const electron = require('electron');
const $ = require('jquery');
const Backbone = require('backbone');
const _ = require('underscore');
const ipc = electron.ipcRenderer; // talk to /lib/main.js if you need (see electron docs for ipcRenderer/ipcMain)

// APP MODULES
const Util = require('../../util');
const MainView = require('../main/mainView');

var LoginView = Backbone.View.extend({
    // any events this view should control
    events: {
        "click .btnLogin" : "onClickLogin"
    },
    initialize: function() {
        var self = this;
        let util = new Util();
        this.template = util.getTmpl('loginView.html');
    },

    render: function() {
        //LoginView.__super__.render.apply(this, arguments);
        this.$el.html(this.template);
        return this;
    },
    onClickLogin: function (e) {
        let mainView = new MainView();
        $(".htmlBody").html(mainView.render().$el);
        $('.ui.sidebar').sidebar('toggle');
    }
});
module.exports = LoginView;
