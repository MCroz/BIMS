const electron = require('electron');
const $ = require('jquery');
const Backbone = require('backbone');
const _ = require('underscore');
const ipc = electron.ipcRenderer; // talk to /lib/main.js if you need (see electron docs for ipcRenderer/ipcMain)

// APP MODULES
const Util = require('../../util');
require('jQuery.NiceScroll');
require( 'datatables.net-se' )();
const swal = require('sweetalert');

var InsertUser = Backbone.Model.extend({
    url: window.bims.endpointUrl + "Users/AddUser"
});



var Collection = Backbone.Collection.extend({
    url: window.bims.endpointUrl + "Users/GetUserList"
});


var View = Backbone.View.extend({
    // any events this view should control
    events: {
        "click .btnAddUser":"onClickAddUser",
        "click .btnRemoveUser": "onClickRemoveUser"
    },
    initialize: function() {
        let util = new Util();
        this.template = util.getTmpl('usersView.html');
    },

    render: function() {
        //LoginView.__super__.render.apply(this, arguments);
        //this.$el.html(this.template);
        var self = this;
        window.bims.showPreloader();
        //fetch data
        let userList = new Collection({ url : window.bims.endpointUrl + "Users/GetUserList"});
        userList.fetch({
            success: function (models, response) {
                if (response.data) {
                    var compiled = _.template(self.template);
                    
                    self.$el.html(compiled({users: response.data }));
                    window.bims.hidePreloader();
                }
            },
            error: function(e) {
                window.bims.hidePreloader();
            }
        });

        this.$el.find('.usersDataTable').DataTable({searching: false,lengthChange: false});
        return this;
    },
    onClickAddUser: function() {
        //this.$el.find(".add-users-modal").modal('show');
        $(".cFname").val("");
        $(".cMname").val("");
        $(".cLname").val("");
        $(".cUsername").val("");
        $(".cPassword").val("");
        $(".cRPassword").val("");
        $(".cRole").val("");
        $(".add-users-modal").modal({
            closable: false,
            onApprove: function(e) {
                let fName = $(this).find(".cFname").val();
                let mName = $(this).find(".cMname").val();
                let lName = $(this).find(".cLname").val();
                let username = $(this).find(".cUsername").val();
                let password = $(this).find(".cPassword").val();
                let rpassword = $(this).find(".cRPassword").val();
                let role = $(this).find(".cRole").val();
                
                if (fName.trim() == "" || mName.trim() == "" || lName.trim() == "" || username.trim() == "" || password.trim() == "" || rpassword.trim() == "" || role.trim() == "") {
                    swal("Error","Please Fill All The Fields!","error" );
                    return false;
                }
                if (password != rpassword) {
                    swal("Error","Password doesnt match!","error" );
                    return false;
                }
                let addUser = new InsertUser();
                addUser.set({
                    fname: fName,
                    mname: mName,
                    lname: lName,
                    username: username,
                    password: password,
                    role: role,
                    updated_by: "1",
                });
                window.bims.showPreloader();
                addUser.save(null, {
                    success: function() {
                        swal("Success", "Successfully Added", "success").then((value) => {
                            $(".btnSideUsers").click();
                        });
                    },
                    error: function() {
                        window.bims.hidePreloader();
                        swal("Error", "An Error Occured, Please Try Again Later", "error");
                    }
                });
            }
        }).modal('show');
        $('.roleSelect').dropdown();
        $('#hideToggle').click();
    },
    onClickRemoveUser: function(e) {
        var fName = $($(e.currentTarget).closest("tr").find("td")[1]).text();
        var mName = $($(e.currentTarget).closest("tr").find("td")[2]).text();
        var lName = $($(e.currentTarget).closest("tr").find("td")[3]).text();
        var userId = $(e.currentTarget).closest("tr").attr("data-id");
        swal({
            title: "Are you sure?",
            text: "Do you want to remove " + fName + " " + mName + " " + lName + "?",
            icon: "warning",
            buttons: true,
            dangerMode: true,
          })
          .then((willDelete) => {
            if (willDelete) {
                let RemoveUser = Backbone.Model.extend({
                    url: window.bims.endpointUrl + "Users/DeleteUser/" + userId
                });
                let deleteUser = new RemoveUser();
                deleteUser.fetch({
                    success: function() {
                        swal("Success", "Successfully Deleted", "success").then((value) => {
                            $(".btnSideUsers").click();
                        });
                    },
                    error: function() {

                    }
                });

            }
          });
    }
});
module.exports = View;
