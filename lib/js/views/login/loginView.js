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
        "keydown .login-div" : "onOpenSettings",
        "click .btnForgotPassword" : "onOpenForgotPasswordModal"
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
                    window.bims.currentUser = response.data;
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
                        //window.bims.endpointUrl = "http://" + $(this).find('.serverURL').val() + ":6513/api/";
                        //window.bims.imageLocations = "http://" + $(this).find('.serverURL').val() + ":6513/api/";
                        window.bims.endpointUrl = "http://" + $(this).find('.serverURL').val() + ":45455/api/";
                        window.bims.imageLocations = "http://" + $(this).find('.serverURL').val() + ":45455/Images/";
                        
                    }
                    return false;
                }
            }).modal('show');
        }
    },
    onOpenForgotPasswordModal: function(evt) {
        $(".forgotPassForm").form("clear");
        $(".forgot-password").modal({
            closable: false,
            onApprove: function() {
                let sq1 = $('.fpSQ1').dropdown('get value');
                let sq2 = $('.fpSQ2').dropdown('get value');
                let sa1 = $('.fpSA1').val();
                let sa2 = $('.fpSA2').val();
                let username = $('.fpUsername').val();
                if (sq1.trim() == "" || sq2.trim() == "" || username.trim() == "" || sa1.trim() == "" || sa2.trim() == "") {
                    swal("Error", "Please Fill All The Fields", "error");
                    return false;
                }
                //Run API
                var ForgotPasswordModel = Backbone.Model.extend({
                    url: window.bims.endpointUrl + "Users/ForgotPassword"
                });
                let forgotPasswordModel = new ForgotPasswordModel();
                let ForgotPasswordData = {
                    Username: username,
                    SecretQuestion1 : sq1,
                    SecretAnswer1 : sa1,
                    SecretQuestion2 : sq2,
                    SecretAnswer2 : sa2
                }
                $(".login-loader").addClass("active");
                $(".forgot-password").modal('hide');
                forgotPasswordModel.save(ForgotPasswordData, {
                    success: function(model,response) {
                        if (response.status == 1) {
                            swal("Success", response.message, "success").then((value) => {
                                $(".login-loader").removeClass("active");
                                
                            });
                        } else {
                            $(".login-loader").removeClass("active");
                            $(".forgot-password").modal('show');
                            swal("Error", response.message, "error");
                        }
                    },
                    error: function(err) {
                        $(".login-loader").removeClass("active");
                        $(".forgot-password").modal('show');
                        swal("Error", "An Error Occured on Server Please Try Again", "error");
                    }
                });

                return false;
            }
        }).modal('show');
        let secretQuestionOptions = [{name: 'What was your childhood nickname?', value: '1'},{name: 'What is the name of your favorite childhood friend?', value: '2'},{name: 'In what city or town did your mother and father meet?', value: '3'},{name: 'What is the middle name of your oldest child?', value: '4'},{name: 'What is the first name of the boy or girl that you first kissed?', value: '5'},{name: 'What was the make and model of your first car?', value: '6'}];
        $('.fpSQ1').dropdown({ values: secretQuestionOptions});
        $('.fpSQ2').dropdown({ values: secretQuestionOptions});

    }
});
module.exports = LoginView;
