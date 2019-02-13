const electron = require('electron');
const $ = require('jquery');
const Backbone = require('backbone');
const _ = require('underscore');
const ipc = electron.ipcRenderer; // talk to /lib/main.js if you need (see electron docs for ipcRenderer/ipcMain)

// APP MODULES
const Util = require('../../util');
require('jQuery.NiceScroll');
require('datatables.net-se')();
const swal = require('sweetalert');
require('../../../semantic-calendar/calendar');
var Moment = require('moment');


var View = Backbone.View.extend({
    // any events this view should control
    events: {
    },
    initialize: function() {
        let util = new Util();
        this.template = util.getTmpl('reportsView.html');
    },

    render: function() {
        self = this;
        this.$el.html(this.template);
        //window.bims.showPreloader();
        return this;
    }
});
module.exports = View;
