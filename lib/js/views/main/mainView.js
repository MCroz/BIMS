
const electron = require('electron');
const $ = require('jquery');
const Backbone = require('backbone');
const _ = require('underscore');
const ipc = electron.ipcRenderer; // talk to /lib/main.js if you need (see electron docs for ipcRenderer/ipcMain)

// APP MODULES
const Util = require('../../util');
require('jQuery.NiceScroll');

//Declare the Views
const UsersView = require("../users/usersView");

var LoginView = Backbone.View.extend({
    // any events this view should control
    el: ".htmlBody",
    events: {
        "click #showToggle" : "onShowMenu",
        "click #hideToggle" : "onHideMenu",
        "click .btnSideUsers" : "onClickUsers"
    },
    initialize: function() {
        var self = this;
        let util = new Util();
        this.template = util.getTmpl('mainView.html');
    },

    render: function() {
        //LoginView.__super__.render.apply(this, arguments);
        this.$el.html(this.template);
        //this.$el.find(".main-view").replaceWith(this.template);
        //this.$el = this.template;
        this.$el.find('#verticalMenu').niceScroll({ cursorcolor: "transparent" });
        this.onShowMenu();
        this.$el.find('a[data-toggle="popup"]').each(function() {
            $(this).popup({
                popup: $(this).attr('data-content'),
                position: $(this).attr('data-position'),
                on: 'click'
            })
        });
    
        this.$el.find('a[data-toggle="slide"]').on('click', function(e) {
            e.preventDefault();
    
            var target = this.hash;
            var $target = $(target);
    
            $('html, body').stop().animate({
                'scrollTop': $target.offset().top - 60
            }, 900, 'swing');
        });
        this.$el.find('.ui.accordion').accordion();
        this.$el.find('.ui.dropdown').dropdown();
        this.$el.find('.ui.checkbox').checkbox();
        this.$el.find('.ui.progress').progress();
        return this;
    },
    onShowMenu: function (e) {
        this.$el.find('#showToggle').hide();
        this.$el.find('#hideToggle').show();
        this.$el.find('#sideMenu').removeClass('hide');
    },
    onHideMenu: function (e) {
        this.$el.find('#hideToggle').hide();
        this.$el.find('#showToggle').show();
        this.$el.find('#sideMenu').addClass('hide');
    },
    onClickUsers: function(e) {
        let usersView = new UsersView();
        this.$el.find("#content").html(usersView.render().$el);
    }
});
module.exports = LoginView;
