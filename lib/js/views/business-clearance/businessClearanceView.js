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
var Moment = require('moment');

var BusinessDataTable;
var View = Backbone.View.extend({
    formatMoney: function (amount, decimalCount = 2, decimal = ".", thousands = ",") {
        try {
            decimalCount = Math.abs(decimalCount);
            decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

            const negativeSign = amount < 0 ? "-" : "";

            let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
            let j = (i.length > 3) ? i.length % 3 : 0;

            return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
        } catch (e) {
            console.log(e)
        }
    },
    toFixed: function (num, fixed) {
        var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
        return num.toString().match(re)[0];
    },
    // any events this view should control
    events: {
        "click .btnOpenPrintBusinessClearance":"onOpenPrintModal",
        "click .btnViewPrintHistory":"onViewPrintHistory"
    },
    initialize: function() {
        let util = new Util();
        this.template = util.getTmpl('businessClearanceView.html');
    },

    render: function() {
        var self = this;
        window.bims.showPreloader();
        //fetch data
        var Model = Backbone.Model.extend({
            url: window.bims.endpointUrl + "Business/GetBusinessList"
        });
        let businessList = new Model();
        businessList.fetch({
            success: function (models, response) {
                if (response.data) {
                    var compiled = _.template(self.template);
                    _.each(response.data, function(business) {
                        business.formattedCurrency = "₱ " + self.formatMoney(self.toFixed(business.Capitalization,2));
                    });
                    self.$el.html(compiled({businesses: response.data }));
                    window.bims.hidePreloader();
                    BusinessDataTable = self.$el.find('.businessListDataTable').DataTable();
                }
            },
            error: function(e) {
                window.bims.hidePreloader();
            }
        });
        
        return this;
        
    },
    onViewPrintHistory: function(e) {
        var self = this;
        if ($.fn.DataTable.isDataTable(".printHistoryDatatable")) {
            $('.printHistoryDatatable').DataTable().clear().destroy();
        }
        $(".printHistoryDatatableBody").empty();
        let businessId = $(e.currentTarget).closest("tr").attr("data-id");
        let GetBusinessPrintHistory = Backbone.Model.extend({
            url: window.bims.endpointUrl + "Print/GetBusinessPrintHistory/" + businessId
        });
        window.bims.showPreloader();
        let getBusinessPrintHistory = new GetBusinessPrintHistory();
        getBusinessPrintHistory.fetch({
            success: function(model, response) {
                
                if (response.status == 1) {
                    //Show Modal
                    _.each(response.data, function (data) {
                        let trHtml = "<tr>" +
                        "<td>" + data.ControlNo + "</td>" +
                        "<td>" + data.PrintedBy + "</td>" +
                        "<td>" + Moment(data.DateCreated).format("LL") + "</td>" +
                        "</tr>";
                        $(".printHistoryDatatableBody").append(trHtml);
                    });
                    window.bims.hidePreloader();
                    $('.printHistoryDatatable').DataTable();
                    $(".view-print-history-modal").modal({
                        autofocus: false
                    }).modal("show");
                } else {
                    window.bims.hidePreloader();
                    swal("Error",response.message, "error");
                }
            },
            error: function (err) {
                window.bims.hidePreloader();
                swal("Error","An Error Occured On Server. Please Try Again.", "error");
            }
        });

        return false;
    },
    onOpenPrintModal: function (e) {
        var self = this;
        let businessId = $(e.currentTarget).closest("tr").attr("data-id");
        let GetBusinessInfo = Backbone.Model.extend({
            url: window.bims.endpointUrl + "Business/GetBusinessInfo/" + businessId
        });
        let getBusinessInfo = new GetBusinessInfo();
        window.bims.showPreloader();
        getBusinessInfo.fetch({
            success: function(model,response) {
                window.bims.hidePreloader();
                if (response.status == 1) {
                    $(".bcOwnerName").text(response.data.OwnerName);
                    $(".bcOwnerAddress").text(response.data.OwnerAddress);
                    $(".bcOwnerContactNo").text(response.data.OwnerContactNo);
                    $(".bcBusinessName").text(response.data.BusinessName);
                    $(".bcBusinessAddress").text(response.data.BusinessAddress);
                    $(".bcBusinessContactNo").text(response.data.BusinessContactNo);
                    $(".bcBusinessFloorArea").text(response.data.FloorArea);
                    $(".bcBusinessDTI").text(response.data.DTI_SEC_RegNo);
                    $(".bcKindOfBusiness").text(response.data.KindOfBusiness);
                    $(".bcBusinessCapitalization").text("₱ " + self.formatMoney(self.toFixed(response.data.Capitalization,2)));
                    $(".bcBusinessID").val(response.data.ID);
                    var businessClearanceModal = $(".business-clearance-print-modal").modal({
                        onApprove: function(evt) {
                            //Process Info and Show Preloader
                            let ProcessPrint = Backbone.Model.extend({
                                url: window.bims.endpointUrl + "Print/GenerateBusinessClearanceTransaction"
                            });
                            let processPrint = new ProcessPrint();
                            //window.bims.showPreloader();
                            let PrintModel = {
                                BusinessID : businessId,
                                ProcessedByID : window.bims.currentUser.ID
                            };
                            businessClearanceModal.modal('hide');
                            processPrint.save(PrintModel,{
                                success: function(model, response) {
                                    if (response.status == 1) {
                                        let PdfGenerator = require("../../pdf-generator/pdf-generator");
                                        let pdfGen = new PdfGenerator();
                                        pdfGen.generateBusinessClearance(response.data);
                                        window.open('http://localhost:8080', 'PDF View');
                                    }
                                },
                                error: function(err) {

                                }
                            });
                        }
                    }).modal("show");
                } else {
                    swal("Error","An Error Occured On Server. Please Try Again.", "error");
                }
            },
            error: function(err) {
                swal("Error","An Error Occured On Server. Please Try Again.", "error");
            }
        });

    }
});
module.exports = View;
