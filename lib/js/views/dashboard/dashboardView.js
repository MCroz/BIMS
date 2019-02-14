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

var Chart = require('chart.js');

var InsertUser = Backbone.Model.extend({
    url: window.bims.endpointUrl + "Users/AddUser"
});

var View = Backbone.View.extend({
    // any events this view should control
    events: {

    },
    initialize: function() {
        let util = new Util();
        this.template = util.getTmpl('dashboardView.html');
    },

    render: function() {
        //LoginView.__super__.render.apply(this, arguments);
        //this.$el.html(this.template);
        //Set Values Show Loading Screen First
        //Let's fetch info from database
        let self = this;
        // window.localStorage.setItem('myCat', 'Tom');

        // var ctx = this.$el.find("#myChart");
        // var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		// var config = {
		// 	type: 'line',
		// 	data: {
		// 		labels: MONTHS,
		// 		datasets: [{
		// 			label: 'My First dataset',
		// 			backgroundColor: window.chartColors.red,
		// 			borderColor: window.chartColors.red,
		// 			data: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 0, 0],
		// 			fill: false,
		// 		}, {
		// 			label: 'My Second dataset',
		// 			fill: false,
		// 			backgroundColor: window.chartColors.blue,
		// 			borderColor: window.chartColors.blue,
		// 			data: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 0, 0],
		// 		}]
		// 	},
		// 	options: {
		// 		responsive: true,
		// 		title: {
		// 			display: true,
		// 			text: 'Chart.js Line Chart'
		// 		},
		// 		tooltips: {
		// 			mode: 'index',
		// 			intersect: false,
		// 		},
		// 		hover: {
		// 			mode: 'nearest',
		// 			intersect: true
		// 		},
		// 		scales: {
		// 			xAxes: [{
		// 				display: true,
		// 				scaleLabel: {
		// 					display: true,
		// 					labelString: 'Month'
		// 				}
		// 			}],
		// 			yAxes: [{
		// 				display: true,
		// 				scaleLabel: {
		// 					display: true,
		// 					labelString: 'Value'
		// 				}
		// 			}]
		// 		}
		// 	}
		// };
		// var myLineChart = new Chart(ctx, config);
		

		//Render Starts Here
		window.bims.showPreloader();
		let DashboardInfo = Backbone.Model.extend({
			url: window.bims.endpointUrl + "dashboard/GetDashboardInfo"
		});
		let dashboardInfo = new DashboardInfo();
		dashboardInfo.fetch({
			success: function(model, response) {
				let html = self.template.replace("{{DInfo}}", response.data.DCount);
				html = html.replace("{{BInfo}}", response.data.BCount);
				html = html.replace("{{IInfo}}", response.data.ICount);
				html = html.replace("{{BCInfo}}", response.data.BCCount);
				
				self.$el.html(_.template(html));
				window.bims.hidePreloader();
			},
			error: function(err) {
				swal("Error", "An Error Occured on Server.", "error");
			}
		});

        return this;
    }
});
module.exports = View;
