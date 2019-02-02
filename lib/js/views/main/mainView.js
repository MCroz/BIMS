
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
        // this.$el.find('.ui.accordion').accordion();
        // this.$el.find('.ui.dropdown').dropdown();
        // this.$el.find('.ui.checkbox').checkbox();
        // this.$el.find('.ui.progress').progress();

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
        this.$el.find('#hideToggle').click();
    },
    onClickTest: function (e) {

        // window.open('', 'PDF View');
        var fs = require('fs');
        var pdf = require('html-pdf');
        var path = require('path');
        var html = fs.readFileSync(path.resolve(__dirname, 'test.html'), 'utf8');
        var options = { height: '13in', width: '8.5in' };
        var i2b = require("imageurl-base64");
        i2b(window.bims.imageLocations + 'Male.png', function(err, data){
            html = html.replace('{{brgyUrl}}', data.dataUri);
            console.log(html);
            //var compiled = _.template(html);
            //compiled({brgyLogo: ""});
    
            pdf.create(html, options).toFile(path.resolve(__dirname, 'test.pdf'), function(err, res) {
                if (err) {
                  console.log(err);
                }
            });
            window.open("", 'PDF View');
        });

        //console.log(base64Str);
        return false;

        // const fs = require('fs')
        // const http = require('http')
        // const pdf = require('html-pdf')v  
        // const path = require('path')
        // const tmpl = fs.readFileSync(path.resolve(__dirname, 'test.html'), 'utf8');
        
        // const server = http.createServer(function (req, res) {
        //   if (req.url === '/favicon.ico') return res.end('404')
        //   const html = tmpl.replace('{{brgyUrl}}', window.bims.imageLocations + 'Male.png')
        //   //html = tmpl;
        //   pdf.create(html, { height: '13in', width: '8.5in' }).toStream((err, stream) => {
        //     if (err) return res.end(err.stack)
        //     res.setHeader('Content-type', 'application/pdf')
        //     stream.pipe(res)
        //   })
        // })
        
        // server.listen(8080, function (err) {
        //   if (err) throw err
        //   console.log('Listening on http://localhost:%s', server.address().port)
        // })
        //Open Window
        //window.open('http://localhost:' + server.address().port, 'PDF View',server);
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
});
module.exports = LoginView;
