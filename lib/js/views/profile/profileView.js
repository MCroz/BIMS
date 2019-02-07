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
        this.template = util.getTmpl('userProfile.html');
    },

    render: function() {
        //LoginView.__super__.render.apply(this, arguments);
        //this.$el.html(this.template);
        //Set Values Show Loading Screen First
        //Let's fetch info from database
        var self = this;
        let GetUserInfo = Backbone.Model.extend({
            url: window.bims.endpointUrl + "Users/GetUserInfo/" + window.bims.currentUser.ID
        });
        let getUserInfo = new GetUserInfo();
        window.bims.showPreloader();
        getUserInfo.fetch({
            success: function(model, resp) {
                self.$el.html(self.template);
                $(".upFname").val(resp.data.FirstName);
                $(".upMname").val(resp.data.MiddleName);
                $(".upLname").val(resp.data.LastName);
                $(".upSA1").val(resp.data.SecretAnswer1);
                $(".upSA2").val(resp.data.SecretAnswer2);
                // $(".upRole").val(resp.data.Role);
                // $(".upUsername").val(resp.data.Username);
                $(".upRole").text(resp.data.Role);
                $(".upUsername").text(resp.data.Username);
                let secretQuestionOptions1 = [{name: 'What was your childhood nickname?', value: '1'},{name: 'What is the name of your favorite childhood friend?', value: '2'},{name: 'In what city or town did your mother and father meet?', value: '3'},{name: 'What is the middle name of your oldest child?', value: '4'},{name: 'What is the first name of the boy or girl that you first kissed?', value: '5'},{name: 'What was the make and model of your first car?', value: '6'}];
                let secretQuestionOptions2 = [{name: 'What was your childhood nickname?', value: '1'},{name: 'What is the name of your favorite childhood friend?', value: '2'},{name: 'In what city or town did your mother and father meet?', value: '3'},{name: 'What is the middle name of your oldest child?', value: '4'},{name: 'What is the first name of the boy or girl that you first kissed?', value: '5'},{name: 'What was the make and model of your first car?', value: '6'}];
                let secretQuestionOptions11 = _.map(secretQuestionOptions1, function(opt) {
                    opt.value == resp.data.SecretQuestion1ID ? opt.selected = true : opt.selected = false ;
                    return opt;
                });
                let secretQuestionOptions22 = _.map(secretQuestionOptions2, function(opt) {
                    opt.value == resp.data.SecretQuestion2ID ? opt.selected = true : opt.selected = false ;
                    return opt;
                });
                self.$el.find('.upSQ1').dropdown({ values: secretQuestionOptions11});
                self.$el.find('.upSQ2').dropdown({ values: secretQuestionOptions22});
                $(".upUPassword").checkbox({
                    onChecked: function(evtt) {
                        $(".upCurPassword").prop('disabled', false);
                        $(".upPassword").prop('disabled', false);
                        $(".upCPassword").prop('disabled', false);
                    },
                    onUnchecked: function(evtt) {
                        $(".upCurPassword").prop('disabled', true);
                        $(".upPassword").prop('disabled', true);
                        $(".upCPassword").prop('disabled', true);
                    }
                });

                window.bims.hidePreloader();
            },
            error: function(err) {

            }
        });

        return this;
    },
    onClickSubmit: function(evt) {
        evt.preventDefault();
        let sq1 = $(".upSQ1").dropdown("get value");
        let sq2 = $(".upSQ2").dropdown("get value");
        let sa1 = $(".upSA1").val();
        let sa2 = $(".upSA2").val();
        let password = $(".upPassword").val();
        let cpassword = $(".upCPassword").val();

        if (sq1.trim() == "" || sq2.trim() == "" || sa1.trim() == "" || sa2.trim() == "" || password.trim() == "" || cpassword.trim() == "") {
            swal("Error", "Please Fill All the fields.", "error");
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
