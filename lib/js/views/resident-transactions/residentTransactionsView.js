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

var self;
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
        self = this;
        //LoginView.__super__.render.apply(this, arguments);
        this.$el.html(this.template);
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
                        let GetResidentInfo = Backbone.Model.extend({
                            url: window.bims.endpointUrl + "Residents/GetResidentInfo/" + residentId
                        });
                        let getUserInfo = new GetResidentInfo();
                        window.bims.showPreloader();
                        getUserInfo.fetch({
                            success: function(model, response) {
                                window.bims.hidePreloader();
                                var myModal = $('.dispense-medicine-modal').modal('show');
                                $(myModal).find('.dmFirstName').val(response.data.FirstName);
                                $(myModal).find('.dmMiddleName').val(response.data.MiddleName);
                                $(myModal).find('.dmLastName').val(response.data.LastName);
                                $(myModal).find('.dmGender').val(response.data.Gender);
                                $(myModal).find('.dmAddressZone').val(response.data.AddressZone);
                                //$(myModal).find('.btnDispenseAddMedicine').click();
                                $(myModal).find('.btnDispenseAddMedicine').off("click").on("click",function() {
                                    //Lets Show Stock List
                                    //$(myModal).modal('hide');
                                    $('.dmAddMedicineTableBody').empty();
                                    window.bims.showPreloader();
                                    //Show Medicine Selection
                                    //fetch medicine list first
                                    var MedicineStockList = Backbone.Model.extend({
                                        url: window.bims.endpointUrl + "Dispense/GetMedicineStocksList"
                                    });
                                    let medicineStockListModel = new MedicineStockList();
                                    medicineStockListModel.fetch({
                                        success: function(model,response) {
                                            _.each(response.data, function(stock) {
                                                //Append to Table
                                                let html = '<tr data-id="' + stock.StockID + '">' +
                                                '<td class="collapsing">' +
                                                '<button class="ui icon button btnAddStockToDispense">' +
                                                '<i class="blue edit icon"></i>' +
                                                '</button>' +
                                                '</td>' +
                                                '<td>' + stock.MedicineName + '</td>' +
                                                '<td>' + stock.Description + '</td>' +
                                                '<td>' + stock.Total + '</td>' +
                                                '<td>' + stock.ExpirationDate + '</td>' +
                                                '<td>' +
                                                '<div class="field">' +
                                                '<input type="number" placeholder="Quantity" class="addStockToDispenseQty" min="1" max="10">'
                                                '</td>' +
                                                '</tr>';
                                                $('.dmAddMedicineTableBody').append(html);
                                            });
                                            window.bims.hidePreloader();
                                            $('.dispense-select-medicine-modal').modal({
                                                onHidden: function() {
                                                    $(myModal).modal('show');
                                                },
                                                closable: false,
                                                autofocus: false
                                            }).modal('show');
                                            let dT = $('.dmAddMedicineTable').DataTable();
                                            //Add Event Listener
                                            $('.btnAddStockToDispense').off("click").on("click",function (evt) {
                                                let stockId = $(evt.currentTarget).closest('tr').attr('data-id');
                                                //Get Quantity
                                                let qty = $(evt.currentTarget).closest('tr').find('.addStockToDispenseQty').val();
                                                //Add sa List
                                                let html1 = "<tr>" +
                                                "<td class='collapsing'>" +
                                                    "<button class='ui icon button'>" +
                                                        "<i class='blue edit icon'></i>" +
                                                    "</button>" +
                                                    "<button class='ui icon button'>" +
                                                        "<i class='red trash icon'></i>" +
                                                    "</button>" +
                                                "</td>" +
                                                "<td>" + $(($(evt.currentTarget).closest('tr').find('td'))[1]).text() + "</td>" +
                                                "<td>" + $(($(evt.currentTarget).closest('tr').find('td'))[2]).text() + "</td>" +
                                                "<td>" + $(($(evt.currentTarget).closest('tr').find('td'))[4]).text() + "</td>" +
                                                "<td>" + qty + "</td>" +
                                                "</tr>";
                                                $('.dmMedicineItems').append(html1);
                                                dT.row($(evt.currentTarget).closest('tr')).remove().draw();
                                                return false;
                                            });
                                        },
                                        error: function() {
                                            window.bims.hidePreloader();
                                            swal("Error", "An Error Occured, Please Try Again Later", "error");
                                        }
                                    });
                                    return false;
                                });
                                
                            },
                            error: function() {
                                window.bims.hidePreloader();
                                swal("Error", "An Error Occured, Please Try Again Later", "error");
                                
                            }
                        });
                        return false;
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

    },
    onClickRemoveMedicine: function(e) {
    },
    onClickEditMedicine: function(e) {

    }
});
module.exports = View;
