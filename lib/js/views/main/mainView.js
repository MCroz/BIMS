
const electron = require('electron');
const $ = require('jquery');
const Backbone = require('backbone');
const _ = require('underscore');
const ipc = electron.ipcRenderer; // talk to /lib/main.js if you need (see electron docs for ipcRenderer/ipcMain)

// APP MODULES
const Util = require('../../util');
require('jQuery.NiceScroll');
require('datatables.net-se')();
var Moment = require('moment');

//Declare the Views
const UsersView = require("../users/usersView");
const ResidentsView = require("../residents/residentsView");
const MedicinesMasterListView = require("../medicines/medicinesMasterListView");
const MedicineInventoryView = require("../medicines/MedicineInventoryView");
const ResidentTransactionView = require("../resident-transactions/residentTransactionsView");
const FirstTimeLoginView = require("./firstTimeLoginView");
const ProfileView = require("../profile/profileView");
const DashboardView = require("../dashboard/dashboardView");
const BusinessClearanceView = require("../business-clearance/businessClearanceView");
const BusinessOwnersView = require("../business-owner/businessOwnerView");
const ReportsView = require("../reports/reportsView");

var LoginView = Backbone.View.extend({
    // any events this view should control
    el: ".htmlBody",
    events: {
        "click .btnRemoveFromDispenseList" : "btnRemoveFromDispenseList",
        "click .btnRemoveFromDispenseList" : "btnUpdateFromDispenseList",
        "click #showToggle" : "onShowMenu",
        "click #hideToggle" : "onHideMenu",
        "click .btnSideUsers" : "onClickUsers",
        "click .btnDashboard": "onClickDashboard",
        "click .btnSideResidents": "onClickResidents",
        "click .btnMedicinesMasterList": "onClickMedicinesMasterList",
        "click .btnInventory": "onClickMedicineInventory",
        "click .btnResidentTransactions": "onClickResidentTransactions",
        "click .btnUserProfile": "btnUserProfile",
        "click .btnBusinessClearance": "onClickBusinessClearance",
        "click .btnBusinessOwners": "onClickBusinessOwners",
        "click .btnLogout": "onClickLogout",
        "click .btnReports": "onClickReports"
    },
    initialize: function() {
        let util = new Util();
        this.template = util.getTmpl('mainView.html');

        let ChangingModel = Backbone.Model.extend({
            url: ""
        });

        this.changingModel = new ChangingModel();
        this.changingModel.set({ toUpdate: 1 });
        this.listenTo(this.changingModel, 'change', this.rerenderName);
        window.bims.mainView = this;
    },
    rerenderName: function() {
        this.$el.find(".mainViewNameContainer").text(window.bims.currentUser.FirstName + " " + window.bims.currentUser.MiddleName + " " + window.bims.currentUser.LastName);
    },
    render: function() {
        //LoginView.__super__.render.apply(this, arguments);
        this.$el.html(_.template(this.template));
        //this.$el.find(".main-view").replaceWith(this.template);
        //this.$el = this.template;
        this.$el.find('#verticalMenu').niceScroll({ cursorcolor: "transparent" });
        
        this.$el.find('a[data-toggle="popup"]').each(function() {
            $(this).popup({
                popup: $(this).attr('data-content'),
                position: $(this).attr('data-position'),
                on: 'click'
            })
        });
    
        // this.$el.find('a[data-toggle="slide"]').on('click', function(e) {
        //     e.preventDefault();
    
        //     var target = this.hash;
        //     var $target = $(target);
    
        //     $('html, body').stop().animate({
        //         'scrollTop': $target.offset().top - 60
        //     }, 900, 'swing');
        // });
        // this.$el.find('.ui.accordion').accordion();
        // this.$el.find('.ui.dropdown').dropdown();
        // this.$el.find('.ui.checkbox').checkbox();
        // this.$el.find('.ui.progress').progress();

        
        if (window.bims.currentUser.SecretQuestion1ID == null || window.bims.currentUser.SecretQuestion2ID == null) {
            this.$el.find('#showToggle').hide();
            this.$el.find('#hideToggle').hide();
            this.$el.find('#sideMenu').addClass('hide');
            this.$el.find(".btnUserProfile").hide();
            //Show First Time Login
            if (typeof(window.bims.firstTimeLogin) != "undefined") {
                //window.bims.medicineInventoryView.render();
                this.$el.find("#content").html(window.bims.firstTimeLogin.render().$el);
            } else {
                window.bims.firstTimeLogin = new FirstTimeLoginView();
                this.$el.find("#content").html(window.bims.firstTimeLogin.render().$el);
            }
            window.bims.firstTimeLogin.delegateEvents();
        } else {
            this.onShowMenu();
            $(".btnDashboard").click();
        }
        this.$el.find('.vtMenu .tabBtnMedicines').tab();
        this.$el.find('.vtMenu .tabBtnIndigency').tab();
        this.$el.find('.vtMenu .tabBtnClearance').tab();
        let self = this;
        this.$el.find('.vtMenu .tabBtnMedicines').click(self.onClicktabBtnMedicines);
        this.$el.find('.vtMenu .tabBtnIndigency').click(self.onClicktabBtnIndigency);
        this.$el.find('.vtMenu .tabBtnClearance').click(self.onClicktabBtnClearance);
        window.bims.dispenseTransactionsDatatable = this.$el.find(".dispenseTransactionsDatatable").DataTable();
        window.bims.indigencyTransactionsDatatable = this.$el.find(".indigencyTransactionsDatatable").DataTable();
        window.bims.clearanceTransactionsDatatable = this.$el.find(".clearanceTransactionsDatatable").DataTable();
        window.bims.tMedsDatatable = this.$el.find(".tmedsTable").DataTable();

        if (window.bims.currentUser.Role == 'Document Staff') {
            $(".tabBtnMedicines").hide();
        }


        if (window.bims.currentUser.Role == 'Inventory/Medicine Staff') {
            $(".tabBtnIndigency").hide();
            $(".tabBtnClearance").hide();
        }
        return this;
    },
    onClicktabBtnMedicines: function(e) {
        //window.bims.dispenseTransactionsDatatable.clear().draw();
        window.bims.dispenseTransactionsDatatable.clear().destroy();
        $(".DispenseTransactionsLoader").addClass("active");
        $(".dispenseTransactionsTableBody").empty();
        let thisId = $(e.currentTarget).closest(".vtMenu").attr("data-id");
        let DispenseTransactionListModel = Backbone.Model.extend({
            url: window.bims.endpointUrl + "Dispense/ListDispenseTransaction/" + thisId
        });
        let dispenseTransactionListModel = new DispenseTransactionListModel();
        dispenseTransactionListModel.fetch({
            success: function(model,response) {
                if (response.status == 1) {
                    _.each(response.data, function (transac) {
                        let trHtml = "<tr data-id='" + transac.ID + "'>" +
                        "<td class='collapsing'>" +
                            "<button class='ui secondary button btnViewDispenseDetails'>" +
                                "View" +
                            "</button>" +
                        "</td>" +
                        "<td>" + transac.CreatedBy + "</td>" +
                        "<td>" + Moment(transac.DateDispensed).format('LL') + "</td>" +
                        "<td>" + transac.PreparationDescription + "</td>" +
                        "</tr>";
                        $(".dispenseTransactionsTableBody").append(trHtml);
                    });
                    window.bims.dispenseTransactionsDatatable = $('.dispenseTransactionsDatatable').DataTable({
                        destroy: true,
                        "fnDrawCallback": function() {
                            $('.btnViewDispenseDetails').unbind('click');
                            $('.btnViewDispenseDetails').on('click', function(evt) {
                                let dispenseTransacID = $(evt.currentTarget).closest("tr").attr("data-id");
                                let DispenseTransactionMedicinesModel = Backbone.Model.extend({
                                    url: window.bims.endpointUrl + "Dispense/ListDispenseMedicines/" + dispenseTransacID
                                });
                                let dispenseTransactionMedicinesModels = new DispenseTransactionMedicinesModel();
                                dispenseTransactionMedicinesModels.fetch({
                                    success: function(model, response) {
                                        if (response.status == 1) {
                                            //Show Modal List
                                            window.bims.tMedsDatatable.clear().destroy();
                                            $(".tmedsBody").empty();
                                            
                                            _.each(response.data,function(data) {
                                                let trHtml = "<tr>" +
                                                "<td>" + data.Medicine + "</td>" +
                                                "<td>" + data.Description + "</td>" +
                                                "<td>" + Moment(data.ExpirationDate).format('LL') + "</td>" +
                                                "<td>" + data.Quantity + "</td>" +
                                                "</tr>";
                                                $(".tmedsBody").append(trHtml);
                                            });
                                            window.bims.tMedsDatatable = $(".tmedsTable").DataTable({
                                                destroy: true
                                            });
                                            // return false;
                                            $('.vtModal').modal('hide');
                                            $(".resident-transaction-medicines").modal({
                                                closable: false,
                                                autofocus: false,
                                                onHidden: function() {
                                                    $('.vtModal').modal({
                                                        autofocus: false,
                                                        closable: false
                                                    }).modal('show');
                                                }
                                            }).modal("show");
                                        } else {
                                            swal("Error",response.message, "error");
                                        }
                                    },
                                    error: function(err) {
                                        swal("Error","An Error Occured on Server Please Try Again.", "error");
                                    }
                                });
                                return false;
                            });
                        }
                    });
                    $(".DispenseTransactionsLoader").removeClass("active");
                } else {
                    swal("Error",response.message, "error");
                    $(".DispenseTransactionsLoader").removeClass("active");
                }
            },
            error: function(err) {
                swal("Error","An Error Occured on Server Please Try Again.", "error");
                $(".DispenseTransactionsLoader").removeClass("active");
            }
        });
    },
    onClicktabBtnIndigency: function(e) {
        window.bims.indigencyTransactionsDatatable.clear().destroy();
        $(".IndigencyTransactionsLoader").addClass("active");
        $(".indigencyTransactionsTBody").empty();
        let thisId = $(e.currentTarget).closest(".vtMenu").attr("data-id");
        let IndigencyTransactionListModel = Backbone.Model.extend({
            url: window.bims.endpointUrl + "Print/GetUserIndigencyTransactions/" + thisId
        });
        let indigencyTransactionListModel = new IndigencyTransactionListModel();
        indigencyTransactionListModel.fetch({
            success: function(model,response) {
                if (response.status == 1) {
                    _.each(response.data, function (transac) {
                        let trHtml = "<tr data-id='" + transac.ID + "'>" +
                        "<td>" + transac.ControlNo + "</td>" +
                        "<td>" + transac.PrintedBy + "</td>" +
                        "<td>" + transac.Purpose + "</td>" +
                        "<td>" + Moment(transac.DateCreated).format('LL') + "</td>" +
                        "</tr>";
                        $(".indigencyTransactionsTBody").append(trHtml);
                    });
                    window.bims.indigencyTransactionsDatatable = $('.indigencyTransactionsDatatable').DataTable({
                        destroy: true 
                    });
                    $(".IndigencyTransactionsLoader").removeClass("active");
                } else {
                    swal("Error",response.message, "error");
                    $(".IndigencyTransactionsLoader").removeClass("active");
                }
            },
            error: function(err) {
                swal("Error","An Error Occured on Server Please Try Again.", "error");
                $(".IndigencyTransactionsLoader").removeClass("active");
            }
        });
    },
    onClicktabBtnClearance: function(e) {
        window.bims.clearanceTransactionsDatatable.clear().destroy();
        $(".ClearanceTransactionsLoader").addClass("active");
        $(".clearanceTransactionsTBody").empty();
        let thisId = $(e.currentTarget).closest(".vtMenu").attr("data-id");
        let ClearanceTransactionListModel = Backbone.Model.extend({
            url: window.bims.endpointUrl + "Print/GetUserBarangayClearanceTransactions/" + thisId
        });
        let clearanceTransactionListModel = new ClearanceTransactionListModel();
        clearanceTransactionListModel.fetch({
            success: function(model,response) {
                if (response.status == 1) {
                    _.each(response.data, function (transac) {
                        let trHtml = "<tr data-id='" + transac.ID + "'>" +
                        "<td>" + transac.ControlNo + "</td>" +
                        "<td>" + transac.PrintedBy + "</td>" +
                        "<td>" + transac.Purpose + "</td>" +
                        "<td>" + Moment(transac.DateCreated).format('LL') + "</td>" +
                        "</tr>";
                        $(".clearanceTransactionsTBody").append(trHtml);
                    });
                    window.bims.clearanceTransactionsDatatable = $('.clearanceTransactionsDatatable').DataTable({
                        destroy: true 
                    });
                    $(".ClearanceTransactionsLoader").removeClass("active");
                } else {
                    swal("Error",response.message, "error");
                    $(".ClearanceTransactionsLoader").removeClass("active");
                }
            },
            error: function(err) {
                swal("Error","An Error Occured on Server Please Try Again.", "error");
                $(".ClearanceTransactionsLoader").removeClass("active");
            }
        });
    },
    onShowMenu: function (e) {
        this.$el.find('#showToggle').hide();
        this.$el.find('#hideToggle').show();
        this.$el.find('#sideMenu').removeClass('hide');
    },
    onHideMenu: function (e) {
        this.$el.find('#hideToggle').hide();
        this.$el.find('#showToggle').show();
        this.$el.find('#sideMenu').addClass('hide');
    },
    onClickUsers: function(e) {
        if (typeof(window.bims.usersView) != "undefined") {
            this.$el.find("#content").html(window.bims.usersView.render().$el);
            //window.bims.usersView.render();
        } else {
            window.bims.usersView = new UsersView();
            this.$el.find("#content").html(window.bims.usersView.render().$el);
        }
        window.bims.usersView.delegateEvents();
        this.$el.find('#hideToggle').click();
    },
    onClickResidents: function (e) {
        if (typeof(window.bims.residentsView) != "undefined") {
            //window.bims.residentsView.render();
            this.$el.find("#content").html(window.bims.residentsView.render().$el);
        } else {
            window.bims.residentsView = new ResidentsView();
            this.$el.find("#content").html(window.bims.residentsView.render().$el);
        }
        window.bims.residentsView.delegateEvents();
        this.$el.find('#hideToggle').click();
    },
    onClickMedicinesMasterList: function(e) {
        if (typeof(window.bims.medicinesMasterList) != "undefined") {
            //window.bims.medicinesMasterList.render();
            this.$el.find("#content").html(window.bims.medicinesMasterList.render().$el);
        } else {
            window.bims.medicinesMasterList = new MedicinesMasterListView();
            this.$el.find("#content").html(window.bims.medicinesMasterList.render().$el);
        }
        window.bims.medicinesMasterList.delegateEvents();
        this.$el.find('#hideToggle').click();
    },
    onClickMedicineInventory: function(e) {
        if (typeof(window.bims.medicineInventoryView) != "undefined") {
            //window.bims.medicineInventoryView.render();
            this.$el.find("#content").html(window.bims.medicineInventoryView.render().$el);
        } else {
            window.bims.medicineInventoryView = new MedicineInventoryView();
            this.$el.find("#content").html(window.bims.medicineInventoryView.render().$el);
        }
        window.bims.medicineInventoryView.delegateEvents();
        this.$el.find('#hideToggle').click();
    },
    onClickResidentTransactions: function(e) {
        if (typeof(window.bims.residentTransactionView) != "undefined") {
            //window.bims.medicineInventoryView.render();
            this.$el.find("#content").html(window.bims.residentTransactionView.render().$el);
        } else {
            window.bims.residentTransactionView = new ResidentTransactionView();
            this.$el.find("#content").html(window.bims.residentTransactionView.render().$el);
        }
        window.bims.residentTransactionView.delegateEvents();
        this.$el.find('#hideToggle').click();
    },
    btnRemoveFromDispenseList: function(e) {
        $(e.currentTarget).closest('tr').remove();
        return false;
    },
    btnUpdateFromDispenseList: function(e) {
        $(e.currentTarget).closest('tr').remove();
        return false;
    },
    btnUserProfile: function(evt) {
        if (typeof(window.bims.UserProfileView) != "undefined") {
            //window.bims.medicineInventoryView.render();
            this.$el.find("#content").html(window.bims.UserProfileView.render().$el);
        } else {
            window.bims.UserProfileView = new ProfileView();
            this.$el.find("#content").html(window.bims.UserProfileView.render().$el);
        }
        window.bims.UserProfileView.delegateEvents();
        this.$el.find('#hideToggle').click();
        return false;
    },
    onClickBusinessClearance: function(evt) {
        if (typeof(window.bims.businessClearanceView) != "undefined") {
            //window.bims.medicineInventoryView.render();
            this.$el.find("#content").html(window.bims.businessClearanceView.render().$el);
        } else {
            window.bims.businessClearanceView = new BusinessClearanceView();
            this.$el.find("#content").html(window.bims.businessClearanceView.render().$el);
        }
        window.bims.businessClearanceView.delegateEvents();
        this.$el.find('#hideToggle').click();
    },
    onClickDashboard: function(evt) {
        if (typeof(window.bims.dashboardView) != "undefined") {
            this.$el.find("#content").html(window.bims.dashboardView.render().$el);
        } else {
            window.bims.dashboardView = new DashboardView();
            this.$el.find("#content").html(window.bims.dashboardView.render().$el);
        }
        window.bims.dashboardView.delegateEvents();
        this.$el.find('#hideToggle').click();
    },
    onClickBusinessOwners: function(evt) {
        if (typeof(window.bims.businessOwnersView) != "undefined") {
            this.$el.find("#content").html(window.bims.businessOwnersView.render().$el);
        } else {
            window.bims.businessOwnersView = new BusinessOwnersView();
            this.$el.find("#content").html(window.bims.businessOwnersView.render().$el);
        }
        window.bims.businessOwnersView.delegateEvents();
        this.$el.find('#hideToggle').click();
    },
    onClickLogout: function(e) {
        let LogoutModel = Backbone.Model.extend({
            url: window.bims.endpointUrl + "Login/Logout/" + window.bims.currentUser.ID
        });
        let logoutModel = new LogoutModel();
        logoutModel.fetch({
            success: function(model, resp) {
                //return false;
                window.location.href = "index.html";
            },
            error: function (err) {
                //Error
            }
        });
        return false;
    },
    onClickReports: function() {
        if (typeof(window.bims.reportsView) != "undefined") {
            this.$el.find("#content").html(window.bims.reportsView.render().$el);
        } else {
            window.bims.reportsView = new ReportsView();
            this.$el.find("#content").html(window.bims.reportsView.render().$el);
        }
        window.bims.reportsView.delegateEvents();
        this.$el.find('#hideToggle').click();
    }
});
module.exports = LoginView;
