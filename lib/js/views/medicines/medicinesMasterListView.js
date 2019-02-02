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

var InsertMedicine = Backbone.Model.extend({
    url: window.bims.endpointUrl + "Medicines/AddMedicine"
});

var UpdateMedicine = Backbone.Model.extend({
    url: window.bims.endpointUrl + "Medicines/UpdateMedicine"
});


var Collection = Backbone.Collection.extend({
    url: window.bims.endpointUrl + "Medicines/GetMedicineList"
});

var MedicinesDataTable;
var View = Backbone.View.extend({
    // any events this view should control
    events: {
        "click .btnAddMedicine":"onClickAddMedicine",
        "click .btnRemoveMedicine": "onClickRemoveMedicine",
        "click .btnUpdateMedicine":"onClickEditMedicine",
        "keyup .userTabSearch": "onSearchUser"
    },
    initialize: function() {
        let util = new Util();
        this.template = util.getTmpl('medicinesMasterListView.html');
    },

    render: function() {
        //LoginView.__super__.render.apply(this, arguments);
        //this.$el.html(this.template);
        var self = this;
        window.bims.showPreloader();
        //fetch data
        let medicineList = new Collection();
        medicineList.fetch({
            success: function (models, response) {
                if (response.data) {
                    var compiled = _.template(self.template);
                    
                    self.$el.html(compiled({medicines: response.data }));
                    window.bims.hidePreloader();
                    MedicinesDataTable = self.$el.find('.medicinesMasterListDataTable').DataTable();
                }
            },
            error: function(e) {
                swal("Error", "An Error Occured, Please Try Again Later", "error");
                window.bims.hidePreloader();
            }
        });

        //this.$el.find('.usersDataTable').DataTable({searching: false,lengthChange: false});
        //this.$el.find('.usersDataTable').DataTable({searching: true,lengthChange: false});
        
        return this;
    },
    onClickAddMedicine: function() {
        $('.cmForm').form('clear');
        
        $(".add-medicines-modal").modal({
            closable: false,
            onApprove: function(e) {
                let mName = $(this).find(".cmMedicineName").val();
                let desc = $(this).find(".cmDescription").val();
                
                if (mName.trim() == "" || desc.trim() == "") {
                    swal("Error","Please Fill All The Fields!","error" );
                    return false;
                }
                let addMedicine = new InsertMedicine();
                addMedicine.set({
                    MedicineName: mName,
                    Description: desc,
                    CreatedBy: window.bims.currentUser.ID,
                    ModifiedBy: window.bims.currentUser.ID
                });
                window.bims.showPreloader();
                addMedicine.save(null, {
                    success: function(modelRes, response) {
                        if (response.status == 1) {
                            swal("Success", "Successfully Added", "success").then((value) => {
                                $(".add-medicines-modal").modal('hide');
                                $(".btnMedicinesMasterList").click();
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
                return false;
            }
        }).modal('show');
        $('#hideToggle').click();
    },
    onClickRemoveMedicine: function(e) {
        var medicineName = $($(e.currentTarget).closest("tr").find("td")[1]).text();
        var description = $($(e.currentTarget).closest("tr").find("td")[2]).text();
        var medicineId = $(e.currentTarget).closest("tr").attr("data-id");
        swal({
            title: "Are you sure?",
            text: "Do you want to remove " + medicineName + " " + description + "?",
            icon: "warning",
            buttons: true,
            dangerMode: true,
          })
          .then((willDelete) => {
            if (willDelete) {
                let RemoveMedicine = Backbone.Model.extend({
                    url: window.bims.endpointUrl + "Medicines/DeleteMedicine/" + medicineId
                });
                let deleteMedicine = new RemoveMedicine();
                deleteMedicine.fetch({
                    success: function() {
                        swal("Success", "Successfully Deleted", "success").then((value) => {
                            $(".btnMedicinesMasterList").click();
                        });
                    },
                    error: function() {
                        window.bims.hidePreloader();
                        swal("Error", "An Error Occured, Please Try Again Later", "error");
                        return false;
                    }
                });

            }
          });
    },
    onClickEditMedicine: function(e) {
        var medicineId = $(e.currentTarget).closest("tr").attr("data-id");
        //Clear first

        //Let's fetch info from database
        let GetMedicineInfo = Backbone.Model.extend({
            url: window.bims.endpointUrl + "Medicines/GetMedicineInfo/" + medicineId
        });
        let getMedicineInfo = new GetMedicineInfo();
        window.bims.showPreloader();
        getMedicineInfo.fetch({
            success: function(model, resp) {
                $(".emMedicineName").val(resp.data.MedicineName);
                $(".emDescription").val(resp.data.Description);
                
                window.bims.hidePreloader();
                $(".edit-medicines-modal").modal({
                    closable: false,
                    onApprove: function(e) {
                        let mName = $(this).find(".emMedicineName").val();
                        let desc = $(this).find(".emDescription").val();
                        
                        if (mName.trim() == "" || desc.trim() == "") {
                            swal("Error","Please Fill All The Fields!","error" );
                            return false;
                        }
                        let updateMedicine = new UpdateMedicine();
                        updateMedicine.set({
                            ID: medicineId,
                            MedicineName: mName,
                            Description: desc,
                            ModifiedBy: window.bims.currentUser.ID
                        });
                        window.bims.showPreloader();
                        updateMedicine.save(null, {
                            success: function(modelRes, response) {
                                window.bims.hidePreloader();
                                if (response.status == 1) {
                                    swal("Success", "Successfully Updated", "success").then((value) => {
                                        $(".edit-medicines-modal").modal('hide');
                                        $(".btnMedicinesMasterList").click();
                                    });
                                } else {
                                    swal("Error", response.message, "error");
                                }
                            },
                            error: function() {
                                window.bims.hidePreloader();
                                swal("Error", "An Error Occured, Please Try Again Later", "error");
                                return false;
                            }
                        });
                        return false;
                    }
                }).modal('show');
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
            ResidentsDataTable.search(searchVal).draw();
        } else {
            ResidentsDataTable.draw();
        }
    }
});
module.exports = View;
