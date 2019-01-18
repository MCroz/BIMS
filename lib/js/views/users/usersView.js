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

var View = Backbone.View.extend({
    // any events this view should control
    events: {
        "click .btnAddUser":"onClickAddUser"
    },
    initialize: function() {
        let util = new Util();
        this.template = util.getTmpl('usersView.html');
    },

    render: function() {
        //LoginView.__super__.render.apply(this, arguments);
        this.$el.html(this.template);
        this.$el.find('.usersDataTable').DataTable({searching: false,lengthChange: false});
        return this;
    },
    onClickAddUser: function() {
        //this.$el.find(".add-users-modal").modal('show');
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
                window.alert("asa");
            }
        }).modal('show');
        $('.roleSelect').dropdown();
        $('#hideToggle').click();
    }
});
module.exports = View;
