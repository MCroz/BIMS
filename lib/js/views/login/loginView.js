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
const swal = require('sweetalert');

var LoginModel = Backbone.Model.extend({
    url: window.bims.endpointUrl + "Login/InitialLogin"
});

var LoginView = Backbone.View.extend({
    el: ".htmlBody",
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
        e.preventDefault();
        let username = $(".login-username").val();
        let password = $(".login-password").val();
        if (username.trim() == "") {
            swal("Error","Please Enter Your Username!","error" );
            return false;
        }
        if (password.trim() == "") {
            swal("Error","Please Enter Your Password!","error" );
            return false;
        }
        $(".login-loader").addClass("active");
        let loginModel = new LoginModel({},{url: window.bims.endpointUrl + "Login/InitialLogin"});
        loginModel.set({ username: username, password: password});
        loginModel.save(null,{
            success: function(loginModel, response) {
                if (response.status == 1) {
                    window.bims.currentUser = {
                        id: response.data[0].id,
                        fname: response.data[0].fname,
                        mname: response.data[0].mname,
                        lname: response.data[0].lname,
                        role: response.data[0].role,
                        username: response.data[0].username,
                    }
                    $(".login-loader").removeClass("active");
                    let mainView = new MainView();
                    mainView.render().$el;
                    $(".htmlBody").toggleClass("loginBackground");
                    $('.ui.sidebar').sidebar('toggle');
                } else {
                    $(".login-loader").removeClass("active");
                    swal("Error",response.message,"error" );
                }
            },
            error: function(e) {
                $(".login-loader").removeClass("active");
                swal("Error","No Connection to Server","error" );
                console.log(e);
            }
        });
    }
});
module.exports = LoginView;
