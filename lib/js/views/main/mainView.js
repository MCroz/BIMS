
const electron = require('electron');
const $ = require('jquery');
const Backbone = require('backbone');
const _ = require('underscore');
const ipc = electron.ipcRenderer; // talk to /lib/main.js if you need (see electron docs for ipcRenderer/ipcMain)

// APP MODULES
const Util = require('../../util');

var LoginView = Backbone.View.extend({
    // any events this view should control
    className: "main-view",
    events: {
        "click .btnLogin" : "onClickLogin"
    },
    initialize: function() {
        var self = this;
        let util = new Util();
        this.template = util.getTmpl('mainView.html');
    },

    render: function() {
        //LoginView.__super__.render.apply(this, arguments);
        //this.$el.html(this.template);
        //this.$el.find(".main-view").replaceWith(this.template);
        this.$el = this.template;
        return this;
    },
    onClickLogin: function (e) {
    }
});
module.exports = LoginView;
