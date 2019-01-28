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



var LoginView = Backbone.View.extend({
    el: ".htmlBody",
    // any events this view should control
    events: {
        "click .btnLogin" : "onClickLogin",
        "keydown .login-div" : "onOpenSettings"
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
    onClickTest: function() {
        var TestModel = Backbone.Model.extend({
            url: window.bims.endpointUrl + "Dispense/GetMedicineStocksList"
        });
        let loginModel = new TestModel();
        loginModel.fetch({
            success: function(model,response) {
                console.log(response);
            },
            error: function() {

            }
        });
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
        var LoginModel = Backbone.Model.extend({
            url: window.bims.endpointUrl + "Login/InitialLogin"
        });
        let loginModel = new LoginModel({},{url: window.bims.endpointUrl + "Login/InitialLogin"});
        loginModel.set({ Username: username, Password: password});
        loginModel.save(null,{
            success: function(loginModel, response) {
                if (response.status == 1) {
                    window.bims.currentUser = {
                        id: response.data.ID,
                        fname: response.data.FirstName,
                        mname: response.data.MiddleName,
                        lname: response.data.LastName,
                        role: response.Role,
                        username: response.data.Username,
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
    },
    onOpenSettings: function(event) {
        if (event.keyCode == 118) {
            $('.serverUrlForm').form('clear');
        
            $(".connection-settings").modal({
                closable: false,
                onApprove: function(e) {
                    if ($(this).find('.serverURL').val() == "") {
                        swal('Error','Please Enter a Server URL.','error');
                    } else {
                        swal('Success','Successfully Updated','success');
                        $(".connection-settings").modal('hide');
                        window.bims.endpointUrl = "http://" + $(this).find('.serverURL').val() + ":6513/api/";
                        window.bims.imageLocations = "http://" + $(this).find('.serverURL').val() + ":6513/api/";
                        console.log(window.bims.endpointUrl);
                    }
                    return false;
                }
            }).modal('show');
        }
    },
});
module.exports = LoginView;
