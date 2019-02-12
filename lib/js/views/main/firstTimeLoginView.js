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

var InsertUser = Backbone.Model.extend({
    url: window.bims.endpointUrl + "Users/AddUser"
});

var View = Backbone.View.extend({
    // any events this view should control
    events: {
        "click .btnSubmitFTL":"onClickSubmit"
    },
    initialize: function() {
        let util = new Util();
        this.template = util.getTmpl('firstTimeLogin.html');
    },

    render: function() {
        //LoginView.__super__.render.apply(this, arguments);
        this.$el.html(this.template);
        let secretQuestionOptions = [{name: 'What was your childhood nickname?', value: '1'},{name: 'What is the name of your favorite childhood friend?', value: '2'},{name: 'In what city or town did your mother and father meet?', value: '3'},{name: 'What is the middle name of your oldest child?', value: '4'},{name: 'What is the first name of the boy or girl that you first kissed?', value: '5'},{name: 'What was the make and model of your first car?', value: '6'}];
        this.$el.find('.ftlSQ1').dropdown({ values: secretQuestionOptions});
        this.$el.find('.ftlSQ2').dropdown({ values: secretQuestionOptions});

        return this;
    },
    onClickSubmit: function(evt) {
        evt.preventDefault();
        let sq1 = $(".ftlSQ1").dropdown("get value");
        let sq2 = $(".ftlSQ2").dropdown("get value");
        let sa1 = $(".ftlSA1").val();
        let sa2 = $(".ftlSA2").val();
        let password = $(".ftlPassword").val();
        let cpassword = $(".ftlCPassword").val();

        if (sq1.trim() == "" || sq2.trim() == "" || sa1.trim() == "" || sa2.trim() == "" || password.trim() == "" || cpassword.trim() == "") {
            swal("Error", "Please Fill-Out All the fields.", "error");
            return false;
        }
        if (Number(sq1) == Number(sq2)) {
            swal("Error", "Secret Questions Should Be Different.", "error");
            return false;
        }
        if (password != cpassword) {
            swal("Error", "Password Doesn't Match.", "error");
            return false;
        }
        //Run API
        var FirstTimeLoginModel = Backbone.Model.extend({
            url: window.bims.endpointUrl + "Users/FirstTimeLogin"
        });
        let firstTimeLoginModel = new FirstTimeLoginModel();
        let ftlData = {
            UserID: window.bims.currentUser.ID,
            SecretQuestion1: sq1,
            SecretQuestion2: sq2,
            SecretAnswer1: sa1,
            SecretAnswer2: sa2,
            Password: password
        }
        window.bims.showPreloader();
        firstTimeLoginModel.save(ftlData, {
            success: function(model,response) {
                window.bims.hidePreloader();
                if (response.status == 1) {
                    swal("Success", response.message, "success").then((value) => {
                        //Show MainView
                        $('#showToggle').hide();
                        $('#hideToggle').show();
                        $('#sideMenu').removeClass('hide');
                        $(".btnUserProfile").show();
                        //Open Dashboard base on USER or Click the Dashboard
                        $(".btnDashboard").click();
                    });
                } else {
                    swal("Error", response.message, "error");
                }
            },
            error: function(err) {
                window.bims.hidePreloader();
                swal("Error", "An Error Occured on Server Please Try Again", "error");
            }
        });
        return false;
    }
});
module.exports = View;
