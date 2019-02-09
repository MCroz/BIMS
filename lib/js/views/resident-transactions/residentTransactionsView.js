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
        //"keyup .rtSearch": "onSearchUser",
        "click .btnDispenseMedicine" : "onClickDispenseMedicine",
        "click .rtBtnSearch" : "onClickSearch",
        "click .btnViewTransaction" : "onClickViewTransactions",
        "click .btnCardPrint" : "onClickCardPrint"
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

                }
            },
            error: function(e) {
                swal("Error", "An Error Occured, Please Try Again Later", "error");
                window.bims.hidePreloader();
            }
        });
        return this;
    },
    onClickDispenseMedicine: function(e) {
        //Clear Table of Dispense
        $('.dmMedicineItems').empty();
        $('.dmForm').form('clear');
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
                var myModal = $('.dispense-medicine-modal').modal({
                    onApprove : function() {
                        var myself = this;
                        if ($(".rowToDispenseMedicine").length < 1) {
                            window.bims.hidePreloader();
                            $(this).modal('show');
                            swal('Error', 'Please Add a Medicine to Dispense.','error');
                            return false;
                        }
                        if ($(".dmPrescriptionDescription").val().trim() == "") {
                            window.bims.hidePreloader();
                            $(this).modal('show');
                            swal('Error', 'Please Enter a Prescription Description.','error');
                            return false;
                        }
                        var allowed = true;
                        let inputs = $(".toDispenseInput");
                        _.each(inputs,function(elmnt) {
                            let max = Number($(elmnt).attr('max'));
                            let sQty = $(elmnt).val();
                            if (sQty == "") {
                                window.bims.hidePreloader();
                                $(myself).modal('show');
                                swal('Error', 'Invalid Quantity To Dispense.','error');
                                allowed = false;
                            }
                            if (Number(sQty) <= 0) {
                                allowed = false;
                            }
                            if (Number(sQty) > max) {
                                allowed = false;
                            }
                        });
                        if (allowed == false) {
                            window.bims.hidePreloader();
                            $(this).modal('show');
                            swal('Error', 'Invalid Quantity To Dispense.','error');
                            return false;
                        }
                        $(this).modal('hide');
                        window.bims.showPreloader();
                        //Proceed with adding
                        let objectToDispense = _.map($(".rowToDispenseMedicine"),function(elmnt) {
                            let sId = $(elmnt).attr('data-id');
                            // let sName = $(elmnt).attr('data-mname');
                            // let sDesc = $(elmnt).attr('data-desc');
                            // let sExp = $(elmnt).attr('data-exp');
                            let sQty = $(elmnt).find(".toDispenseInput").val();
                            return {
                                StockID: sId,
                                Quantity: sQty
                            }
                        });
                        //return false;
                        let toSendData = {
                            ResidentID : residentId,
                            Items : objectToDispense,
                            PrescriptionDescription: $(".dmPrescriptionDescription").val(),
                            CreatedBy: window.bims.currentUser.ID,
                            ModifiedBy: window.bims.currentUser.ID
                        }
                        let DispenseModel = Backbone.Model.extend({
                            url: window.bims.endpointUrl + "Dispense/DispenseTransaction"
                        });
                        let dispenseModel = new DispenseModel();
                        //dispenseModel.set(toSendData);
                        dispenseModel.save(toSendData,{
                            success: function(model, resp) {
                                window.bims.hidePreloader();
                                swal("Success", "Transaction Completed", "success");
                                return true;
                            },
                            error: function() {
                                window.bims.hidePreloader();
                                swal("Error", "An Error Occured, Please Try Again Later", "error");
                                return true;
                            }
                        });
                        return false;
                    }
                }).modal('show');
                $(myModal).find('.dmResidentId').val(response.data.ID);
                $(myModal).find('.dmFirstName').val(response.data.FirstName);
                $(myModal).find('.dmMiddleName').val(response.data.MiddleName);
                $(myModal).find('.dmLastName').val(response.data.LastName);
                $(myModal).find('.dmGender').val(response.data.Gender);
                $(myModal).find('.dmAddressZone').val(response.data.AddressZone);
                //$(myModal).find('.btnDispenseAddMedicine').click();
                $(myModal).find('.btnDispenseAddMedicine').off("click").on("click",function() {
                    //get existing to dispense medicine
                    let toDispenseMedicines = _.map($(".rowToDispenseMedicine"),function(elmnt) {
                        let sId = $(elmnt).attr('data-id');
                        let sName = $(elmnt).attr('data-mname');
                        let sDesc = $(elmnt).attr('data-desc');
                        let sExp = $(elmnt).attr('data-exp');
                        let sQty = $(elmnt).attr('data-qty');
                        return {
                            StockID: sId,
                            MedicineName: sName,
                            Description: sDesc,
                            ExpirationDate: sExp,
                            Quantity: sQty
                        }
                    });
                    let util = new Util();
                    $('.dmAddForm').empty();
                    $('.dmAddForm').append(util.getTmpl('dispenseAddMedicineDatatable.html'));
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
                            let filteredList = _.reject(response.data, function(returnedData) {
                                let found = _.find(toDispenseMedicines, function(test) {
                                    return Number(returnedData.StockID) == Number(test.StockID)
                                });
                                if (typeof(found) == "undefined") {
                                    return false;
                                }
                                return true;
                            });
                            _.each(filteredList, function(stock) {
                                let min, max;
                                if (stock.Total > 0) {
                                    min = 1;
                                    max = stock.Total;
                                } else {
                                    min = 0;
                                    max = 0;
                                }
                                //Append to Table
                                let html = '<tr data-id="' + stock.StockID + '">' +
                                '<td class="collapsing">' +
                                '<button class="ui icon button btnAddStockToDispense">' +
                                '<i class="blue plus icon"></i>' +
                                '</button>' +
                                '</td>' +
                                '<td>' + stock.MedicineName + '</td>' +
                                '<td>' + stock.Description + '</td>' +
                                '<td>' + Moment(stock.ExpirationDate).format('LL') + '</td>' +
                                '<td>' + stock.Total + '</td>' +
                                '<td>' +
                                '<div class="field">' +
                                '<input type="number" value="'+min+'" placeholder="Quantity" class="addStockToDispenseQty" min="'+ min +'" max="'+max+'">'
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
                            if ($.fn.DataTable.isDataTable(".dmAddMedicineTable")) {
                                $('.dmAddMedicineTable').DataTable().clear().destroy();
                            }
                            let dT = $('.dmAddMedicineTable').DataTable({
                                destroy: true,
                                "fnDrawCallback": function() {
                                    $('.btnAddStockToDispense').unbind('click');
                                    $('.btnAddStockToDispense').on('click', function(evt) {
                                        let stockId = $(evt.currentTarget).closest('tr').attr('data-id');
                                        //Get Quantity
                                        let qty = $(evt.currentTarget).closest('tr').find('.addStockToDispenseQty').val();
                                        let mName = $(($(evt.currentTarget).closest('tr').find('td'))[1]).text();
                                        let mDesc = $(($(evt.currentTarget).closest('tr').find('td'))[2]).text();
                                        let mExpiration = $(($(evt.currentTarget).closest('tr').find('td'))[3]).text();
                                        let thisMin = $(evt.currentTarget).closest('tr').find('.addStockToDispenseQty').attr('min');
                                        let thisMax = $(evt.currentTarget).closest('tr').find('.addStockToDispenseQty').attr('max');
                                        if (Number(qty) <= 0) {
                                            swal("Error","Invalid Quantity to Add.","error");
                                            return false;
                                        }
                                        if (Number(qty) > Number(thisMax)) {
                                            swal("Error","Invalid Quantity to Add.","error");
                                            return false;
                                        }
                                        //Add sa List
                                        let html1 = "<tr class='rowToDispenseMedicine' data-id='"+stockId+"' data-mname='"+mName+"' data-desc='"+mDesc+"' data-exp='"+mExpiration+"'>" +
                                        "<td class='collapsing'>" +
                                            // "<button class='ui icon button' btnUpdateFromDispenseList>" +
                                            //     "<i class='blue edit icon'></i>" +
                                            // "</button>" +
                                            "<button class='ui icon button btnRemoveFromDispenseList'>" +
                                                "<i class='red trash icon'></i>" +
                                            "</button>" +
                                        "</td>" +
                                        "<td>" + mName + "</td>" +
                                        "<td>" + mDesc + "</td>" +
                                        "<td>" + mExpiration + "</td>" +
                                        "<td>" + thisMax + "</td>" +
                                        // "<td>" + qty + "</td>" +
                                        '<td><input class="toDispenseInput" type="number" value="'+qty+'" placeholder="Quantity" class="" min="'+ thisMin +'" max="'+thisMax+'"></td>'
                                        "</tr>";
                                        $('.dmMedicineItems').append(html1);
                                        dT.row($(evt.currentTarget).closest('tr')).remove().draw();
                                        //$(e.currentTarget).closest('tr').remove();
                                        return false;
                                    });
                                }
                            });
                            //Add Event Listener
                            // $('.btnAddStockToDispense').off("click").on("click",function (evt) {
                            //     let stockId = $(evt.currentTarget).closest('tr').attr('data-id');
                            //     //Get Quantity
                            //     let qty = $(evt.currentTarget).closest('tr').find('.addStockToDispenseQty').val();
                            //     let mName = $(($(evt.currentTarget).closest('tr').find('td'))[1]).text();
                            //     let mDesc = $(($(evt.currentTarget).closest('tr').find('td'))[2]).text();
                            //     let mExpiration = $(($(evt.currentTarget).closest('tr').find('td'))[3]).text();
                            //     let thisMin = $(evt.currentTarget).closest('tr').find('.addStockToDispenseQty').attr('min');
                            //     let thisMax = $(evt.currentTarget).closest('tr').find('.addStockToDispenseQty').attr('max');
                            //     if (qty <= 0) {
                            //         swal("Error","Invalid Quantity to Add.","error");
                            //         return false;
                            //     }
                            //     if (qty > thisMax) {
                            //         swal("Error","Invalid Quantity to Add.","error");
                            //         return false;
                            //     }
                            //     //Add sa List
                            //     let html1 = "<tr class='rowToDispenseMedicine' data-id='"+stockId+"' data-mname='"+mName+"' data-desc='"+mDesc+"' data-exp='"+mExpiration+"'>" +
                            //     "<td class='collapsing'>" +
                            //         // "<button class='ui icon button' btnUpdateFromDispenseList>" +
                            //         //     "<i class='blue edit icon'></i>" +
                            //         // "</button>" +
                            //         "<button class='ui icon button btnRemoveFromDispenseList'>" +
                            //             "<i class='red trash icon'></i>" +
                            //         "</button>" +
                            //     "</td>" +
                            //     "<td>" + mName + "</td>" +
                            //     "<td>" + mDesc + "</td>" +
                            //     "<td>" + mExpiration + "</td>" +
                            //     // "<td>" + qty + "</td>" +
                            //     '<td><input class="toDispenseInput" type="number" value="'+qty+'" placeholder="Quantity" class="" min="'+ thisMin +'" max="'+thisMax+'"></td>'
                            //     "</tr>";
                            //     $('.dmMedicineItems').append(html1);
                            //     dT.row($(evt.currentTarget).closest('tr')).remove().draw();
                            //     //$(e.currentTarget).closest('tr').remove();
                            //     return false;
                            // });
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
        $('#hideToggle').click();
        return false;
    },
    onSearchUser: function(e) {
        $(e.currentTarget).val();
    },
    onClickSearch: function() {
        let searchVal = $(".rtSearch").val();
        var self = this;
        if (searchVal != "") {
            let SearchVal = searchVal.toLowerCase();
            var SearchModel = Backbone.Model.extend({
                url: window.bims.endpointUrl + "Residents/SearchResident"
            });
            let searchData = {
                SearchString: SearchVal,
                FilterType: $('.rtFilter').dropdown('get value')
            }
            let searchModel = new SearchModel();
            window.bims.showPreloader();
            searchModel.save(searchData, {
                success: function (model,response) {
                    $('.rtCardContainer').empty();
                    let util = new Util();
                    let cardHtml = util.getTmpl('residentCardView.html');
                    _.each(response.data, function(resid) {
                        resid.FormattedBirthDate = Moment(resid.BirthDate).format('LL');
                        var compiled = _.template(cardHtml);
                        $('.rtCardContainer').append(compiled({resident: resid }));
                    });

                    window.bims.hidePreloader();
                    self.$el.find('.hovering-image').dimmer({
                        on: 'hover'
                    });
                },
                error: function () {
                    window.bims.hidePreloader();
                    swal("Error", "An Error Occured, Please Try Again Later", "error");
                }
            })
        } else {
            //Show All
            let AllResident = Backbone.Model.extend({
                url: window.bims.endpointUrl + "Residents/GetResidentList"
            });
            let allResident = new AllResident();
            allResident.fetch({
                success: function (model,response) {
                    $('.rtCardContainer').empty();
                    let util = new Util();
                    let cardHtml = util.getTmpl('residentCardView.html');
                    _.each(response.data, function(resid) {
                        resid.FormattedBirthDate = Moment(resid.BirthDate).format('LL');
                        var compiled = _.template(cardHtml);
                        $('.rtCardContainer').append(compiled({resident: resid }));
                    });

                    window.bims.hidePreloader();
                    self.$el.find('.hovering-image').dimmer({
                        on: 'hover'
                    });
                },
                error: function () {
                    window.bims.hidePreloader();
                    swal("Error", "An Error Occured, Please Try Again Later", "error");
                }
            });
        }
        return false;
    },
    onClickViewTransactions: function (e) {
        let residentId = $(e.currentTarget).closest('.cardContainer').attr('data-id');
        $('.vtModal').modal({
            autofocus: false,
            closable: false
        }).modal('show');
        $(".vtMenu").attr("data-id", residentId);
        if (window.bims.currentUser.Role == 'Document Staff') {
            $(".tabBtnIndigency").click();
        } else {
            $(".tabBtnMedicines").click();
        }
        

        $('#hideToggle').click();
    },
    onClickCardPrint: function (e) {
        let residentId = $(e.currentTarget).closest('.cardContainer').attr('data-id');
        // let GetResidentInfo = Backbone.Model.extend({
        //     url: window.bims.endpointUrl + "Residents/GetResidentInfo/" + residentId
        // });
        // let getUserInfo = new GetResidentInfo();
        $(".rpPurpose").val("");
        $(".rpResidentID").val(residentId);
        $('.resident-print-modal').modal({
            closable: false,
            autofocus: false,
            onApprove: function() {
                let certType = $(".rpCertificate").dropdown("get value");
                let purpose = $(".rpPurpose").val();
                if (certType == "") {
                    swal("Error", "Please Select a Certificate Type", "error");
                    return false;
                }
                if (purpose == "" || purpose.trim() == "") {
                    swal("Error", "Please Enter A Purpose", "error");
                    return false;
                }
                //Process Info and Show Preloader
                let ProcessPrint = Backbone.Model.extend({
                    url: window.bims.endpointUrl + "Print/InitialPrint"
                });
                let processPrint = new ProcessPrint();
                //window.bims.showPreloader();
                let PrintModel = {
                    ResidentID : residentId,
                    Purpose : purpose,
                    ProcessedByID : window.bims.currentUser.ID,
                    CertificateType: certType
                };
                $('.resident-print-modal').modal('hide');
                processPrint.save(PrintModel,{
                    success: function(model, response) {
                        if (response.status == 1) {
                            let printData = {
                                AddressNo: response.data.Resident.AddressNo,
                                AddressSt: response.data.Resident.AddressSt,
                                FirstName: response.data.Resident.FirstName,
                                MiddleName: response.data.Resident.MiddleName,
                                LastName: response.data.Resident.LastName,
                                Image: window.bims.imageLocations + "ResidentImages/" + response.data.Resident.Image,
                                Purpose: response.data.Purpose,
                                DateCreated: response.data.DateCreated,
                                ControlNo: response.data.ControlNo
                            }
                            let PdfGenerator = require("../../pdf-generator/pdf-generator");
                            let pdfGen = new PdfGenerator();
                            pdfGen.generatePdf(certType,printData);
                            window.open('http://localhost:8080', 'PDF View');
                        }
                    },
                    error: function(err) {

                    }
                });
                return false;
            }
        }).modal('show');
        $('.rpCertificate').dropdown({
            values: [{ name : "Barangay Clearance", value: "Barangay Clearance"},
                     { name : "Certificate of Indigency", value: "Certificate of Indigency"}
                    ]
        });
    }
});
module.exports = View;
