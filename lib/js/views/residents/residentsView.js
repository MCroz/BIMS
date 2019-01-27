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

var InsertResident = Backbone.Model.extend({
    url: window.bims.endpointUrl + "Residents/AddResident"
});

var UpdateResident = Backbone.Model.extend({
    url: window.bims.endpointUrl + "Residents/UpdateResident"
});


var Collection = Backbone.Collection.extend({
    url: window.bims.endpointUrl + "Residents/GetResidentList"
});

var ResidentsDataTable;
var View = Backbone.View.extend({
    // any events this view should control
    events: {
        "click .btnAddResidents":"onClickAddResidents",
        "click .btnRemoveResident": "onClickRemoveResident",
        "click .btnUpdateResident":"onClickEditResident",
        "keyup .userTabSearch": "onSearchUser"
    },
    initialize: function() {
        let util = new Util();
        this.template = util.getTmpl('residentsView.html');
    },

    render: function() {
        //LoginView.__super__.render.apply(this, arguments);
        //this.$el.html(this.template);
        var self = this;
        window.bims.showPreloader();
        //fetch data
        let residentList = new Collection();
        residentList.fetch({
            success: function (models, response) {
                if (response.data) {
                    var compiled = _.template(self.template);
                    
                    self.$el.html(compiled({residents: response.data }));
                    window.bims.hidePreloader();
                    ResidentsDataTable = self.$el.find('.residentsDataTable').DataTable();
                }
            },
            error: function(e) {
                swal("Error", "An Error Occured, Please Try Again Later", "error");
                window.bims.hidePreloader();
            }
        });

        //this.$el.find('.usersDataTable').DataTable({searching: false,lengthChange: false});
        //this.$el.find('.usersDataTable').DataTable({searching: true,lengthChange: false});
        
        return this;
    },
    onClickAddResidents: function() {
        $('.crForm').form('clear');
        
        $(".add-residents-modal").modal({
            closable: false,
            onApprove: function(e) {
                let fName = $(this).find(".crFname").val();
                let mName = $(this).find(".crMname").val();
                let lName = $(this).find(".crLname").val();
                let gender = $(this).find(".crGender").dropdown('get value');
                let civilstatus = $(this).find(".crCivilStatus").dropdown('get value');
                let birthdate = $(this).find('.crBirthDate').calendar('get date');
                let addressno = $(this).find('.crAddressNo').val();
                let addressst = $(this).find('.crAddressSt').val();
                let addresszone = $(this).find('.crAddressZone').dropdown('get value');
                let birthplace = $(this).find('.crBirthPlace').val();
                let citizenship = $(this).find('.crCitizenship').val();
                
                if (fName.trim() == "" || mName.trim() == "" || lName.trim() == "" || gender.trim() == "" || addressno.trim() == "" || civilstatus.trim() == "" || addressst.trim() == "" || addresszone.trim() == "" || birthplace.trim() == "" || citizenship.trim() == "" || birthdate == "") {
                    swal("Error","Please Fill All The Fields!","error" );
                    return false;
                }
                let addResident = new InsertResident();
                addResident.set({
                    FirstName: fName,
                    MiddleName: mName,
                    LastName: lName,
                    Gender: gender,
                    CivilStatus: civilstatus,
                    BirthDate: birthdate,
                    AddressNo: addressno,
                    AddressSt:addressst,
                    AddressZone:addresszone,
                    BirthPlace: birthplace,
                    Citizenship: citizenship,
                    CreatedBy: window.bims.currentUser.id,
                    ModifiedBy: window.bims.currentUser.id
                });
                window.bims.showPreloader();
                addResident.save(null, {
                    success: function(modelRes, response) {
                        if (response.status == 1) {
                            swal("Success", "Successfully Added", "success").then((value) => {
                                $(".add-residents-modal").modal('hide');
                                $(".btnSideResidents").click();
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
        $('.crGender').dropdown({ values: [{name: 'Male', value: 'Male'},{name: 'Female', value: 'Female'}]});
        $('.crCivilStatus').dropdown({ values: [{name: 'Single', value: 'Single'},{name: 'Married', value: 'Married'},{name: 'Widowed', value: 'Widowed'},{name: 'Divorced', value: 'Divorced'},{name: 'Separated', value: 'Separated'}]});
        $('.crAddressZone').dropdown({ values: [{name: 'Ausmolo', value: 'Ausmolo'},{name: 'Ilaya', value: 'Ilaya'},{name: 'Manggahan I', value: 'Manggahan I'},{name: 'Manggahan II', value: 'Manggahan II'},{name: 'Looban', value: 'Looban'},{name: 'Aliw', value: 'Aliw'},{name: 'Gitna', value: 'Gitna'},{name: 'Bukid', value: 'Bukid'}]});
        $('.crBirthDate').calendar({type: 'date'});
        $('#hideToggle').click();
    },
    onClickRemoveResident: function(e) {
        var fName = $($(e.currentTarget).closest("tr").find("td")[1]).text();
        var mName = $($(e.currentTarget).closest("tr").find("td")[2]).text();
        var lName = $($(e.currentTarget).closest("tr").find("td")[3]).text();
        var residentId = $(e.currentTarget).closest("tr").attr("data-id");
        swal({
            title: "Are you sure?",
            text: "Do you want to remove " + fName + " " + mName + " " + lName + "?",
            icon: "warning",
            buttons: true,
            dangerMode: true,
          })
          .then((willDelete) => {
            if (willDelete) {
                let RemoveResident = Backbone.Model.extend({
                    url: window.bims.endpointUrl + "Residents/DeleteResident/" + residentId
                });
                let deleteResident = new RemoveResident();
                deleteResident.fetch({
                    success: function() {
                        swal("Success", "Successfully Deleted", "success").then((value) => {
                            $(".btnSideResidents").click();
                        });
                    },
                    error: function() {
                        window.bims.hidePreloader();
                        swal("Error", "An Error Occured, Please Try Again Later", "error");
                        return false;
                    }
                });

            }
          });
    },
    onClickEditResident: function(e) {
        var residentId = $(e.currentTarget).closest("tr").attr("data-id");
        //Clear first

        //Let's fetch info from database
        let GetResidentInfo = Backbone.Model.extend({
            url: window.bims.endpointUrl + "Residents/GetResidentInfo/" + residentId
        });
        let getUserInfo = new GetResidentInfo();
        window.bims.showPreloader();
        getUserInfo.fetch({
            success: function(model, resp) {
                $(".erFname").val(resp.data.FirstName);
                $(".erMname").val(resp.data.MiddleName);
                $(".erLname").val(resp.data.LastName);

                $(".erBirthDate").val(resp.data.BirthDate);
                $(".erAddressNo").val(resp.data.AddressNo);
                $(".erAddressSt").val(resp.data.AddressSt);
                $(".erBirthPlace").val(resp.data.BirthPlace);
                $(".erCitizenship").val(resp.data.Citizenship);

                let thisGenderVal = resp.data.Gender;
                var genderValues = [{name: 'Male', value: 'Male'},{name: 'Female', value: 'Female'}];
                _.each(genderValues, function(valueOption) {
                    if (valueOption.value == thisGenderVal) {
                        valueOption.selected = true;
                    }
                });
                $('.erGender').dropdown({ values: genderValues });
                let thisCivilStatus = resp.data.CivilStatus;
                let civilStatusValues = [{name: 'Single', value: 'Single'},{name: 'Married', value: 'Married'},{name: 'Widowed', value: 'Widowed'},{name: 'Divorced', value: 'Divorced'},{name: 'Separated', value: 'Separated'}];
                _.each(civilStatusValues, function(valueOption) {
                    if (valueOption.value == thisCivilStatus) {
                        valueOption.selected = true;
                    }
                });
                $('.erCivilStatus').dropdown({ values: civilStatusValues });
                let thisAddressZoneValue = resp.data.AddressZone;
                let addressZoneValues = [{name: 'Ausmolo', value: 'Ausmolo'},{name: 'Ilaya', value: 'Ilaya'},{name: 'Manggahan I', value: 'Manggahan I'},{name: 'Manggahan II', value: 'Manggahan II'},{name: 'Looban', value: 'Looban'},{name: 'Aliw', value: 'Aliw'},{name: 'Gitna', value: 'Gitna'},{name: 'Bukid', value: 'Bukid'}];
                _.each(addressZoneValues, function(valueOption) {
                    if (valueOption.value == thisAddressZoneValue) {
                        valueOption.selected = true;
                    }
                });
                $('.erAddressZone').dropdown({ values: addressZoneValues});
                let thisBirthDate = resp.data.BirthDate;
                let convertedDate = new Date(thisBirthDate);
                $('.erBirthDate').calendar('set date', convertedDate, updateInput = true, fireChange = true)
                
                window.bims.hidePreloader();
                $(".edit-residents-modal").modal({
                    closable: false,
                    onApprove: function(e) {
                        let fName = $(this).find(".erFname").val();
                        let mName = $(this).find(".erMname").val();
                        let lName = $(this).find(".erLname").val();
                        let gender = $(this).find(".erGender").dropdown('get value');
                        let civilstatus = $(this).find(".erCivilStatus").dropdown('get value');
                        let birthdate = $(this).find('.erBirthDate').calendar('get date');
                        let addressno = $(this).find('.erAddressNo').val();
                        let addressst = $(this).find('.erAddressSt').val();
                        let addresszone = $(this).find('.erAddressZone').dropdown('get value');
                        let birthplace = $(this).find('.erBirthPlace').val();
                        let citizenship = $(this).find('.erCitizenship').val();
                        
                        if (fName.trim() == "" || mName.trim() == "" || lName.trim() == "" || gender.trim() == "" || addressno.trim() == "" || civilstatus.trim() == "" || addressst.trim() == "" || addresszone.trim() == "" || birthplace.trim() == "" || citizenship.trim() == "" || birthdate == "") {
                            swal("Error","Please Fill All The Fields!","error" );
                            return false;
                        }
                        let updateResident = new UpdateResident();
                        updateResident.set({
                            ID: residentId,
                            FirstName: fName,
                            MiddleName: mName,
                            LastName: lName,
                            Gender: gender,
                            CivilStatus: civilstatus,
                            BirthDate: birthdate,
                            AddressNo: addressno,
                            AddressSt:addressst,
                            AddressZone:addresszone,
                            BirthPlace: birthplace,
                            Citizenship: citizenship,
                            ModifiedBy: window.bims.currentUser.id
                        });
                        window.bims.showPreloader();
                        updateResident.save(null, {
                            success: function(modelRes, response) {
                                window.bims.hidePreloader();
                                if (response.status == 1) {
                                    swal("Success", "Successfully Updated", "success").then((value) => {
                                        $(".edit-residents-modal").modal('hide');
                                        $(".btnSideResidents").click();
                                    });
                                } else {
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
                $('.erBirthDate').calendar({type: 'date'});
                $('#hideToggle').click();
            },
            error: function(e) {
                window.bims.hidePreloader();
                swal("Error", "An Error Occured, Please Try Again Later", "error");
            }
        });
    },
    onSearchUser: function(e) {
        let searchVal = $(e.currentTarget).val();
        console.log(searchVal);
        if (searchVal != "") {
            ResidentsDataTable.search(searchVal).draw();
        } else {
            ResidentsDataTable.draw();
        }
    }
});
module.exports = View;
