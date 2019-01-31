
const electron = require('electron');
const $ = require('jquery');
const Backbone = require('backbone');
const _ = require('underscore');
const ipc = electron.ipcRenderer; // talk to /lib/main.js if you need (see electron docs for ipcRenderer/ipcMain)

// APP MODULES
const Util = require('../../util');
require('jQuery.NiceScroll');

//Declare the Views
const UsersView = require("../users/usersView");
const ResidentsView = require("../residents/residentsView");
const MedicinesMasterListView = require("../medicines/medicinesMasterListView");
const MedicineInventoryView = require("../medicines/MedicineInventoryView");
const ResidentTransactionView = require("../resident-transactions/residentTransactionsView");

var LoginView = Backbone.View.extend({
    // any events this view should control
    el: ".htmlBody",
    events: {
        "click .btnRemoveFromDispenseList" : "btnRemoveFromDispenseList",
        "click .btnRemoveFromDispenseList" : "btnUpdateFromDispenseList",
        "click #showToggle" : "onShowMenu",
        "click #hideToggle" : "onHideMenu",
        "click .btnSideUsers" : "onClickUsers",
        "click .btnTest": "onClickTest",
        "click .btnSideResidents": "onClickResidents",
        "click .btnMedicinesMasterList": "onClickMedicinesMasterList",
        "click .btnInventory": "onClickMedicineInventory",
        "click .btnResidentTransactions": "onClickResidentTransactions"
    },
    initialize: function() {
        var self = this;
        let util = new Util();
        this.template = util.getTmpl('mainView.html');
    },

    render: function() {
        //LoginView.__super__.render.apply(this, arguments);
        this.$el.html(_.template(this.template));
        //this.$el.find(".main-view").replaceWith(this.template);
        //this.$el = this.template;
        this.$el.find('#verticalMenu').niceScroll({ cursorcolor: "transparent" });
        this.onShowMenu();
        this.$el.find('a[data-toggle="popup"]').each(function() {
            $(this).popup({
                popup: $(this).attr('data-content'),
                position: $(this).attr('data-position'),
                on: 'click'
            })
        });
    
        this.$el.find('a[data-toggle="slide"]').on('click', function(e) {
            e.preventDefault();
    
            var target = this.hash;
            var $target = $(target);
    
            $('html, body').stop().animate({
                'scrollTop': $target.offset().top - 60
            }, 900, 'swing');
        });
        this.$el.find('.ui.accordion').accordion();
        this.$el.find('.ui.dropdown').dropdown();
        this.$el.find('.ui.checkbox').checkbox();
        this.$el.find('.ui.progress').progress();

        this.$el.find('.vtMenu .item').tab();
        return this;
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
    },
    onClickTest: function (e) {
        // var fs = require('fs');
        // var pdf = require('html-pdf');
        // var html = fs.readFileSync('./lib/js/views/main/test.html', 'utf8');
        // var options = { format: 'Letter' };
         
        // pdf.create(html, options).toFile('./lib/js/views/main/test.pdf', function(err, res) {
        //   if (err) return console.log(err);
        //   console.log(res); // { filename: '/app/businesscard.pdf' }
        // });


        // e.preventDefault();
        // var fs = require('fs');
        // var pdf = require('html-pdf');
        // var html = fs.readFileSync('./lib/js/views/main/test.html', 'utf8');
        // // var options = { format: 'Letter' };
        // var options = { height: '13in', width: '8.5in' };
            
        // pdf.create(html, options).toFile('./lib/js/views/main/test.pdf', function(err, res) {
        //     if (err) return console.log(err);
        //     console.log(res); // { filename: '/app/businesscard.pdf' }
        //     return false;
        // });
        // return false;

        //window.open('', 'PDF View');
        let PDFGenerator = require("../../pdf-generator");
        let pdfGen = new PDFGenerator();
        pdfGen.generatePdf();
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
    },
    btnRemoveFromDispenseList: function(e) {
        $(e.currentTarget).closest('tr').remove();
        return false;
    },
    btnUpdateFromDispenseList: function(e) {
        $(e.currentTarget).closest('tr').remove();
        return false;
    },
});
module.exports = LoginView;
