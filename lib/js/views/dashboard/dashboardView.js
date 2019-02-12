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
        this.$el.html(this.template);
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
		


        return this;
    }
});
module.exports = View;
