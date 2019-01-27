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
var Moment = require('moment');

var InsertStock = Backbone.Model.extend({
    url: window.bims.endpointUrl + "Stocks/AddStock"
});

var MedicinesDropdown = Backbone.Model.extend({
    url: window.bims.endpointUrl + "Medicines/GetMedicinesListDropdown"
});


var Collection = Backbone.Collection.extend({
    url: window.bims.endpointUrl + "Residents/GetResidentList"
});

var MedicinesDataTable;
var View = Backbone.View.extend({
    // any events this view should control
    events: {
        "click .btnAddStock":"onClickAddStock",
        "click .btnRemoveMedicine": "onClickRemoveMedicine",
        "click .btnUpdateMedicine":"onClickEditMedicine",
        "keyup .userTabSearch": "onSearchUser"
    },
    initialize: function() {
        let util = new Util();
        this.template = util.getTmpl('residentsTransactionsView.html');
    },

    render: function() {
        //LoginView.__super__.render.apply(this, arguments);
        this.$el.html(this.template);
        var self = this;
        window.bims.showPreloader();
        //fetch data
        let residentList = new Collection();
        residentList.fetch({
            success: function (models, response) {
                if (response.data) {
                    var compiled = _.template(self.template);
                    _.each(response.data, function(resid) {
                        resid.FormattedBirthDate = Moment(resid.BirthDate).format('LL');
                    });
                    
                    self.$el.html(compiled({residents: response.data }));
                    window.bims.hidePreloader();
                    self.$el.find('.hovering-image').dimmer({
                        on: 'hover'
                    });
                    $('.rtFilter').dropdown();
                    $('.btnDispenseMedicine').click(function(e) {
                        //Get Resident Info First
                        window.bims.showPreloader();
                        let residentId = $(e.currentTarget).closest('.cardContainer').attr('data-id');
                        console.log(residentId);
                        let GetResidentInfo = Backbone.Model.extend({
                            url: window.bims.endpointUrl + "Residents/GetResidentInfo/" + residentId
                        });
                        let getUserInfo = new GetResidentInfo();
                        window.bims.showPreloader();
                        getUserInfo.fetch({
                            success: function(model, response) {
                                window.bims.hidePreloader();
                                $('.dispense-medicine-modal').modal('show');
                                $('.dmFirstName').val(response.data.FirstName);
                                $('.dmMiddleName').val(response.data.MiddleName);
                                $('.dmLastName').val(response.data.LastName);
                                $('.dmGender').val(response.data.Gender);
                                $('.dmAddressZone').val(response.data.AddressZone);
                            },
                            error: function() {
                                window.bims.hidePreloader();
                                swal("Error", "An Error Occured, Please Try Again Later", "error");
                                return false;
                            }
                        });
                    });
                }
            },
            error: function(e) {
                swal("Error", "An Error Occured, Please Try Again Later", "error");
                window.bims.hidePreloader();
            }
        });
        return this;
    },
    onClickAddStock: function() {
        $('.asForm').form('clear');
        //Get Medicine Drop Down
        let medicinesDropdown = new MedicinesDropdown();
        medicinesDropdown.fetch({
            success: function(model, response){
                var dropdownValues = [];
                _.each(response.data, function(resp) {
                    dropdownValues.push({value: resp.ID, name: resp.MedicineName});
                });

                $(".add-stocks-modal").modal({
                    closable: false,
                    onApprove: function(e) {
                        let medicineID = $(this).find(".asMedicine").dropdown('get value');
                        let qty = $(this).find(".asQuantity").val();
                        let expDate = $(this).find(".asExpirationDate").calendar('get date');
                        //let role = $(this).find(".cRole").val();
                        
                        if (medicineID.trim() == "" || qty.trim() == "" || expDate == "") {
                            swal("Error","Please Fill All The Fields!","error" );
                            return false;
                        }
                        if (Number(qty) <= 0) {
                            swal("Error","Quantity Should Be Greater Than Zero!","error" );
                            return false;
                        }
                        let addStock = new InsertStock();
                        addStock.set({
                            MedicineID: medicineID,
                            Quantity: qty,
                            ExpirationDate: expDate,
                            CreatedBy: window.bims.currentUser.id,
                            ModifiedBy: window.bims.currentUser.id
                        });
                        window.bims.showPreloader();
                        addStock.save(null, {
                            success: function(modelRes, response) {
                                if (response.status == 1) {
                                    swal("Success", "Successfully Added", "success").then((value) => {
                                        $(".add-stocks-modal").modal('hide');
                                        $(".btnInventory").click();
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
                $('.asExpirationDate').calendar({type: 'date'});
                $('.asMedicine').dropdown({
                    values: dropdownValues,
                    onChange: function(value, text, $selectedItem) {
                        let found = _.find(response.data, function(datam){ 
                            return Number(datam.ID) == Number(value);
                        });
                        if (typeof (found) != "undefined") {
                            $(".asDescription").val(found.Description);
                        }
                    }
                });
                $('#hideToggle').click();
            },
            error: function (err) {
                window.bims.hidePreloader();
                swal("Error", "An Error Occured, Please Try Again Later", "error");
                return false;
            }
        });
    },
    onClickRemoveMedicine: function(e) {
    },
    onClickEditMedicine: function(e) {

    }
});
module.exports = View;
