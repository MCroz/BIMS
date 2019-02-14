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


var View = Backbone.View.extend({
    // any events this view should control
    events: {
        "click .btnDaily": "onClickDaily",
        "click .btnMonthly": "onClickMonthly",
        "click .btnYearly": "onClickYearly"
    },
    initialize: function() {
        let util = new Util();
        this.template = util.getTmpl('reportsView.html');
    },

    render: function() {
        self = this;
        this.$el.html(this.template);
        this.$el.find(".reportsPreMade").dropdown({
            values: [
                {name: "System Logs", value: "System Logs", selected: true},
                {name: "Dispense Report", value: "Dispense Report"},
                {name: "Certificate of Indigency Report", value: "Certificate of Indigency Report"},
                {name: "Barangay Clearance Report", value: "Barangay Clearance Report"},
                {name: "Business Clearance Report", value: "Business Clearance Report"},
            ]
        });
        return this;
    },
    onClickDaily: function() {
        let reportType = this.$el.find(".reportsPreMade").dropdown("get value");
        var startDate = Moment().startOf('day').format(); // set to 12:00 am today
        var endDate = Moment().endOf('day').format(); // set to 23:59 pm today
        let reportData = {
            ReportType: reportType,
            StartDate: startDate,
            EndDate: endDate
        }
        this.generatePremade(reportData,"Daily");
    },
    onClickMonthly: function() {
        let reportType = this.$el.find(".reportsPreMade").dropdown("get value");
        var startDate = Moment().startOf('month').format();
        var endDate = Moment().endOf('month').format();
        let reportData = {
            ReportType: reportType,
            StartDate: startDate,
            EndDate: endDate
        }
        this.generatePremade(reportData, "Monthly");
    },
    onClickYearly: function() {
        let reportType = this.$el.find(".reportsPreMade").dropdown("get value");
        var startDate = Moment().startOf('year').format();
        var endDate = Moment().endOf('year').format();
        let reportData = {
            ReportType: reportType,
            StartDate: startDate,
            EndDate: endDate
        }
        this.generatePremade(reportData, "Yearly");
    },
    generatePremade: function(reportData, dateType) {
        let GetPreMadeReports = Backbone.Model.extend({
            url: window.bims.endpointUrl + "Reports/GetPreMadeReports"
        });
        let getPreMadeReports = new GetPreMadeReports();
        getPreMadeReports.save(reportData,{
            success: function(model,response) {
                var dateTypeStr = "";
                if (dateType == "Daily") {
                    dateTypeStr = Moment().format("LL");
                } else if (dateType == "Monthly") {
                    dateTypeStr = Moment().format("MMMM YYYY");
                } else {
                    dateTypeStr = Moment().format("YYYY");
                }
                var html = "<h1>" + reportData.ReportType + ": " + dateTypeStr + "</h1>";
                console.log(reportData);
                if (reportData.ReportType == "Dispense Report") {
                    html += "<table class='alt'>";
                    html += "<thead><tr>";
                    html += "<td>Date Dispensed</td>";
                    html += "<td>Resident</td>";
                    html += "<td>Dispensed By</td>";
                    html += "<td>Prescription Description</td>";
                    html += "<td>Medicines</td>";
                    html += "</tr></thead>";
                    html += "<tbody>";
                    _.each(response.data, function (data) {
                        html += "<tr>";
                        html += "<td>" + Moment(data.DateDispensed).format("LL") + "</td>";
                        html += "<td>" + data.Resident + "</td>";
                        html += "<td>" + data.User + "</td>";
                        html += "<td>" + data.PrescriptionDescription + "</td>";
                        html += "<td>";
                        _.each(data.DispensedMedicines, function(medicineData){
                            //html += medicineData.MedicineName + " - " + medicineData.MedicineDescription + " - " + medicineData.Quantity + "<br>";
                            html += medicineData.MedicineName + " - " + medicineData.Quantity + "<br>";
                        });
                        html += "</td>";
                        html += "</tr>";
                    });
                    html += "</tbody>";
                    html += "</table>";
                } else if (reportData.ReportType == "Certificate of Indigency Report") {
                    html += "<table class='alt'>";
                    html += "<thead><tr>";
                    html += "<td>Control No.</td>";
                    html += "<td>Resident</td>";
                    html += "<td>Purpose</td>";
                    html += "<td>Date Printed</td>";
                    html += "<td>Printed By</td>";
                    html += "</tr></thead>";
                    html += "<tbody>";
                    _.each(response.data, function (data) {
                        html += "<tr>";
                        html += "<td>" + data.ControlNo + "</td>";
                        html += "<td>" + data.Resident + "</td>";
                        html += "<td>" + data.Purpose + "</td>";
                        html += "<td>" + Moment(data.DateCreated).format("LL") + "</td>";
                        html += "<td>" + data.PrintedBy + "</td>";
                        html += "</td>";
                        html += "</tr>";
                    });
                    html += "</tbody>";
                    html += "</table>";
                } else if (reportData.ReportType == "Barangay Clearance Report") {
                    html += "<table class='alt'>";
                    html += "<thead><tr>";
                    html += "<td>Control No.</td>";
                    html += "<td>Resident</td>";
                    html += "<td>Purpose</td>";
                    html += "<td>Date Printed</td>";
                    html += "<td>Printed By</td>";
                    html += "</tr></thead>";
                    html += "<tbody>";
                    _.each(response.data, function (data) {
                        html += "<tr>";
                        html += "<td>" + data.ControlNo + "</td>";
                        html += "<td>" + data.Resident + "</td>";
                        html += "<td>" + data.Purpose + "</td>";
                        html += "<td>" + Moment(data.DateCreated).format("LL") + "</td>";
                        html += "<td>" + data.PrintedBy + "</td>";
                        html += "</td>";
                        html += "</tr>";
                    });
                    html += "</tbody>";
                    html += "</table>";
                } else if (reportData.ReportType == "Business Clearance Report") {
                    html += "<table class='alt'>";
                    html += "<thead><tr>";
                    html += "<td>Control No.</td>";
                    html += "<td>Owner</td>";
                    html += "<td>Business</td>";
                    html += "<td>Date Printed</td>";
                    html += "<td>Printed By</td>";
                    html += "</tr></thead>";
                    html += "<tbody>";
                    _.each(response.data, function (data) {
                        html += "<tr>";
                        html += "<td>" + data.ControlNo + "</td>";
                        html += "<td>" + data.Owner + "</td>";
                        html += "<td>" + data.Business + "</td>";
                        html += "<td>" + Moment(data.DateCreated).format("LL") + "</td>";
                        html += "<td>" + data.PrintedBy + "</td>";
                        html += "</td>";
                        html += "</tr>";
                    });
                    html += "</tbody>";
                    html += "</table>";
                } else {
                    html += "<table class='alt'>";
                    html += "<thead><tr>";
                    html += "<td>Log Time</td>";
                    html += "<td>Log Type</td>";
                    html += "<td>Log Action</td>";
                    html += "</tr></thead>";
                    html += "<tbody>";
                    _.each(response.data, function (data) {
                        html += "<tr>";
                        html += "<td>" + Moment(data.LogTime).format("LL") + "</td>";
                        html += "<td>" + data.LogType + "</td>";
                        html += "<td>" + data.LogAction + "</td>";
                        html += "</td>";
                        html += "</tr>";
                    });
                    html += "</tbody>";
                    html += "</table>";
                }
                let PdfGenerator = require("../../pdf-generator/pdf-generator");
                let pdfGen = new PdfGenerator();
                pdfGen.generateReport(html);
                window.open('http://localhost:8080', 'PDF View');
            },
            error: function(err) {

            }
        });
    }
});
module.exports = View;
