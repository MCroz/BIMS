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
    url: window.bims.endpointUrl + "Stocks/GetStocksList"
});


var View = Backbone.View.extend({
    // any events this view should control
    events: {
        "click .btnAddStock":"onClickAddStock",
        "click .btnRemoveMedicine": "onClickRemoveMedicine",
        "click .btnUpdateMedicine":"onClickEditMedicine",
        "click .btnOpenMedicineStocks": "onClickViewStocks",
        "keyup .userTabSearch": "onSearchUser"
    },
    initialize: function() {
        let util = new Util();
        this.template = util.getTmpl('medicineInventoryView.html');
    },

    render: function() {
        //LoginView.__super__.render.apply(this, arguments);
        //this.$el.html(this.template);
        var self = this;
        window.bims.showPreloader();
        //fetch data
        let stocksList = new Collection();
        stocksList.fetch({
            success: function (models, response) {
                if (response.data) {
                    var compiled = _.template(self.template);
                    
                    self.$el.html(compiled({medicines: response.data }));
                    window.bims.hidePreloader();
                    MedicinesDataTable = self.$el.find('.medicineInventoryDataTable').DataTable();
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
                    autofocus: false,
                    onApprove: function(e) {
                        let medicineID = $(this).find(".asMedicine").dropdown('get value');
                        let qty = $(this).find(".asQuantity").val();
                        let expDate = $(this).find(".asExpirationDate").calendar('get date');
                        //let role = $(this).find(".cRole").val();
                        if (medicineID.trim() == "" || qty.trim() == "" || expDate == "" || expDate == null) {
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
    onClickViewStocks: function(e) {
        let medId = $(e.currentTarget).closest('tr').attr('data-id');
        var MedicineStocksModel = Backbone.Model.extend({
            url: window.bims.endpointUrl + "Stocks/GetMedicineStocks/" + $(e.currentTarget).closest('tr').attr('data-id')
        });
        let medicineStocksModel = new MedicineStocksModel();
        medicineStocksModel.fetch({
            success: function(model,response) {
                //Open Modal
                let util = new Util();
                $('.svForm').html(util.getTmpl('stocksViewStocksDatatable.html'));
                $('.svMedicineStocksTableBody').empty();
                _.each(response.data, function(stock) {
                    //Append to Table
                    let html = '<tr>' +
                    '<td>' + stock.MedicineName + '</td>' +
                    '<td>' + stock.Description + '</td>' +
                    '<td>' + Moment(stock.ExpirationDate).format('LL') + '</td>' +
                    '<td>' + stock.Total + '</td>' +
                    '</tr>';
                    $('.svMedicineStocksTableBody').append(html);
                });
                $('.svMedicineStocksDatatable').DataTable();
                $('.stocks-view-modal').modal({
                    autofocus: false
                }).modal('show');
            },
            error: function() {

            }
        });
    }
});
module.exports = View;
