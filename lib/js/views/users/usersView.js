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

var UpdateUser = Backbone.Model.extend({
    url: window.bims.endpointUrl + "Users/UpdateUser"
});


var Collection = Backbone.Collection.extend({
    url: window.bims.endpointUrl + "Users/GetUserList"
});

var UsersDatatable;
var View = Backbone.View.extend({
    // any events this view should control
    events: {
        "click .btnAddUser":"onClickAddUser",
        "click .btnRemoveUser": "onClickRemoveUser",
        "click .btnUpdateUser":"onClickEditUser",
        "keyup .userTabSearch": "onSearchUser"
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
                    UsersDatatable = self.$el.find('.usersDataTable').DataTable();
                }
            },
            error: function(e) {
                window.bims.hidePreloader();
            }
        });

        //this.$el.find('.usersDataTable').DataTable({searching: false,lengthChange: false});
        //this.$el.find('.usersDataTable').DataTable({searching: true,lengthChange: false});
        
        return this;
    },
    onClickAddUser: function() {
        //this.$el.find(".add-users-modal").modal('show');
        // $(".cFname").val("");
        // $(".cMname").val("");
        // $(".cLname").val("");
        // $(".cUsername").val("");
        // $(".cPassword").val("");
        // $(".cRPassword").val("");
        // $(".cRole").val("");
        $('.cuForm').form('clear');
        
        $(".add-users-modal").modal({
            closable: false,
            onApprove: function(e) {
                let fName = $(this).find(".cFname").val();
                let mName = $(this).find(".cMname").val();
                let lName = $(this).find(".cLname").val();
                let username = $(this).find(".cUsername").val();
                let password = $(this).find(".cPassword").val();
                let rpassword = $(this).find(".cRPassword").val();
                //let role = $(this).find(".cRole").val();
                let role = $(this).find('.cuRoleSelect').dropdown('get value');
                
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
                    FirstName: fName,
                    MiddleName: mName,
                    LastName: lName,
                    Username: username,
                    Password: password,
                    Role: role,
                    CreatedBy: window.bims.currentUser.ID,
                    ModifiedBy: window.bims.currentUser.ID
                });
                $(".add-users-modal").modal('hide');
                window.bims.showPreloader();
                addUser.save(null, {
                    success: function(modelRes, response) {
                        if (response.status == 1) {
                            swal("Success", "Successfully Added", "success").then((value) => {
                                $(".add-users-modal").modal('hide');
                                $(".btnSideUsers").click();
                            });
                        } else {
                            window.bims.hidePreloader();
                            $(".add-users-modal").modal('show');
                            swal("Error", response.message, "error");
                        }
                    },
                    error: function() {
                        window.bims.hidePreloader();
                        swal("Error", "An Error Occured, Please Try Again Later", "error");
                        $(".add-users-modal").modal('show');
                        return false;
                    }
                });
                return false;
            }
        }).modal('show');
        $('.cuRoleSelect').dropdown({ values: [{name: 'Administrator', value: 'Administrator'},{name: 'Inventory/Medicine Staff', value: 'Inventory/Medicine Staff'},{name: 'Document Staff', value: 'Document Staff'}]});
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
    },
    onClickEditUser: function(e) {
        var userId = $(e.currentTarget).closest("tr").attr("data-id");
        //Clear first

        //Let's fetch info from database
        let GetUserInfo = Backbone.Model.extend({
            url: window.bims.endpointUrl + "Users/GetUserInfo/" + userId
        });
        let getUserInfo = new GetUserInfo();
        window.bims.showPreloader();
        getUserInfo.fetch({
            success: function(model, resp) {
                $(".euFname").val(resp.data.FirstName);
                $(".euMname").val(resp.data.MiddleName);
                $(".euLname").val(resp.data.LastName);
                $(".euUsername").val(resp.data.Username);
                $(".euPassword").val(resp.data.Password);
                $(".euRPassword").val(resp.data.Password);
                let thisRole = resp.data.Role;
                let roleSelections = [{name: 'Administrator', value: 'Administrator'},{name: 'Inventory/Medicine Staff', value: 'Inventory/Medicine Staff'},{name: 'Document Staff', value: 'Document Staff'}];
                _.each(roleSelections, function(roleOption) {
                    if (roleOption.value == thisRole) {
                        roleOption.selected = true;
                    }
                });
                $('.euRoleSelect').dropdown({ values: roleSelections});
                if (Number(resp.data.Attempt) >= 4) {
                    $(".btnUnblockUser").removeClass("disabled");
                } else {
                    $(".btnUnblockUser").addClass("disabled");
                }
                
                window.bims.hidePreloader();
                $(".edit-users-modal").modal({
                    closable: false,
                    onApprove: function(e) {
                        let fName = $(this).find(".euFname").val();
                        let mName = $(this).find(".euMname").val();
                        let lName = $(this).find(".euLname").val();
                        let username = $(this).find(".euUsername").val();
                        //let password = $(this).find(".euPassword").val();
                        //let rpassword = $(this).find(".euRPassword").val();
                        let role = $(this).find('.euRoleSelect').dropdown('get value');
                        
                        if (fName.trim() == "" || mName.trim() == "" || lName.trim() == "" || username.trim() == "" || role.trim() == "") {
                            swal("Error","Please Fill All The Fields!","error" );
                            return false;
                        }
                        if (password != rpassword) {
                            swal("Error","Password doesnt match!","error" );
                            return false;
                        }

                        let updateUser = new UpdateUser();
                        updateUser.set({
                            ID: Number(userId),
                            FirstName: fName,
                            MiddleName: mName,
                            LastName: lName,
                            Username: username,
                            Password: password,
                            Role: role,
                            ModifiedBy: window.bims.currentUser.ID
                        });
                        window.bims.showPreloader();
                        updateUser.save(null, {
                            success: function(modelRes, response) {
                                if (response.status == 1) {
                                    swal("Success", "Successfully Updated", "success").then((value) => {
                                        $(".edit-users-modal").modal('hide');
                                        $(".btnSideUsers").click();
                                    });
                                } else {
                                    window.bims.hidePreloader();
                                    swal("Error", response.message, "error");
                                }
                            },
                            error: function() {
                                window.bims.hidePreloader();
                                return false;
                                swal("Error", "An Error Occured, Please Try Again Later", "error");
                            }
                        });
                        return false;
                    }
                }).modal('show');
                $('.btnResetPassword').off("click").on("click",function (evt) { 
                    let ResetPasswordModel = Backbone.Model.extend({
                        url: window.bims.endpointUrl + "Users/ResetPassword/" + userId
                    });
                    let resetPasswordModel = new ResetPasswordModel();
                    $(".edit-users-modal").modal('hide');
                    window.bims.showPreloader();
                    resetPasswordModel.fetch({
                        success: function(modelRes, response) {
                            if (response.status == 1) {
                                swal("Success", response.message, "success").then((value) => {
                                    //$(".edit-users-modal").modal('hide');
                                    $(".btnSideUsers").click();
                                });
                            } else {
                                window.bims.hidePreloader();
                                swal("Error", response.message, "error");
                            }
                        },
                        error: function() {
                            window.bims.hidePreloader();
                            swal("Error", "An Error Occured, Please Try Again Later", "error");
                            return false;
                        }
                    });
                });
                $('.btnUnblockUser').off("click").on("click",function (evt) { 
                    let UnblockUserModel = Backbone.Model.extend({
                        url: window.bims.endpointUrl + "Users/UnblockUser/" + userId
                    });
                    let unblockUserModel = new UnblockUserModel();
                    $(".edit-users-modal").modal('hide');
                    window.bims.showPreloader();
                    unblockUserModel.fetch({
                        success: function(modelRes, response) {
                            if (response.status == 1) {
                                swal("Success", response.message, "success").then((value) => {
                                    //$(".edit-users-modal").modal('hide');
                                    $(".btnSideUsers").click();
                                });
                            } else {
                                window.bims.hidePreloader();
                                swal("Error", response.message, "error");
                            }
                        },
                        error: function() {
                            window.bims.hidePreloader();
                            swal("Error", "An Error Occured, Please Try Again Later", "error");
                            return false;
                        }
                    });
                });
                $('#hideToggle').click();
            },
            error: function(e) {
                window.bims.hidePreloader();
                swal("Error", "An Error Occured, Please Try Again Later", "error");
            }
        });
    },
    onSearchUser: function(e) {
        let searchVal = $(e.currentTarget).val();
        console.log(searchVal);
        if (searchVal != "") {
            UsersDatatable.search(searchVal).draw();
        } else {
            UsersDatatable.draw();
        }
    }
});
module.exports = View;
