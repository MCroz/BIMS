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
var Moment = require('moment');;

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
        "keyup .userTabSearch": "onSearchUser",
        //"click .crUploadImage": "onClickUploadImage"
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
                    _.each(response.data, function(resid) {
                        resid.FormattedBirthDate = Moment(resid.BirthDate).format('LL');
                    });
                    
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
        $('.crOtherCitizenship').hide();
        
        $(".add-residents-modal").modal({
            closable: false,
            onApprove: function(e) {
                let fName = $(this).find(".crFname").val();
                let mName = $(this).find(".crMname").val();
                let lName = $(this).find(".crLname").val();
                // let gender = $(this).find(".crGender").dropdown('get value');
                let male = $(this).find(".crMale").checkbox('is checked') == true ? "Male" : "";
                let female = $(this).find(".crFemale").checkbox('is checked') == true ? "Female" : "";
                let gender = male + female;
                let civilstatus = $(this).find(".crCivilStatus").dropdown('get value');
                let birthdate = $(this).find('.crBirthDate').calendar('get date');
                let address = $(this).find('.crAddress').val();
                // let addressno = $(this).find('.crAddressNo').val();
                // let addressst = $(this).find('.crAddressSt').val();
                let addresszone = $(this).find('.crAddressZone').dropdown('get value');
                let birthplace = $(this).find('.crBirthPlace').val();
                // let citizenship = $(this).find('.crCitizenship').val();
                let imgUrl = $(this).find('.crImageURL').val();
                let citizenship = $(this).find('.crCitizenship').dropdown('get value');
                if (citizenship == "Others") {
                    citizenship = $(this).find('.crOtherCitizenship').val();
                }

                if (fName.trim() == "" || mName.trim() == "" || lName.trim() == "" || gender.trim() == "" || address.trim() == "" || civilstatus.trim() == "" || addresszone.trim() == "" || birthplace.trim() == "" || citizenship.trim() == "" || birthdate == null) {
                    swal("Error","Please Fill-Out All The Fields!","error" );
                    return false;
                }
                let dateBirthDate = new Date(birthdate);
                let now = new Date();
                if (dateBirthDate >= now) {
                    swal("Error","Invalid Birth Date. Birth Date Should Be Below the Current Date.","error" );
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
                    Address: address,
                    // AddressNo: addressno,
                    // AddressSt:addressst,
                    AddressZone:addresszone,
                    BirthPlace: birthplace,
                    Citizenship: citizenship,
                    Image: imgUrl,
                    CreatedBy: window.bims.currentUser.ID,
                    ModifiedBy: window.bims.currentUser.ID
                });
                $(this).modal('hide');
                window.bims.showPreloader();
                addResident.save(null, {
                    success: function(modelRes, response) {
                        window.bims.hidePreloader();
                        if (response.status == 1) {
                            swal("Success", "Successfully Added", "success").then((value) => {
                                //$(".add-residents-modal").modal('hide');
                                $(".btnSideResidents").click();
                            });
                        } else {
                            swal("Error", response.message, "error").then((value) => {
                                $(this).modal('show');
                            });
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
        $('.crImage').off("change").change(function(){
            if ($('.crImage')[0].files.length > 0) {
                //Only run ajax call if there's a file
                var attachments = $('.crImage');
                var attachmentFiles = attachments[0].files;
                var file = attachmentFiles[0];
                var thisSize = file.size / 1024 / 1024;
                if (thisSize > 20) {
                    swal("Unable to upload image, image exceeds 20mb size");
                    return false;
                }
                var formData = new FormData();
                formData.append("myFile", file);

                $(".uploadLoadingModal").modal({
                    closable: false,
                }).modal("show");
                $('.imageUploadProgress').progress({
                    percent: 0
                });
                $.ajax({
                    url: window.bims.endpointUrl + "Upload/UploadImages",
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    xhr: function () {  // custom xhr
                        myXhr = $.ajaxSettings.xhr();
                        if (myXhr.upload) { // check if upload property exists
                            myXhr.upload.addEventListener('progress', function (evt) {
                                //console.log('updateProgress');
                                if (evt.lengthComputable) {
                                    var percentComplete = evt.loaded / evt.total;
                                    //console.log(percentComplete);
                                    $('.imageUploadProgress').progress({
                                        percent: percentComplete
                                    });

                                } else {
                                    // Unable to compute progress information since the total size is unknown
                                    swal("Error","Unable to Complete Upload.", error);
                                    setTimeout(function(){ 
                                        $(".uploadLoadingModal").modal("hide");
                                    }, 1000);
                                }
                            }, false); 
                        }
                        return myXhr;
                    },
                    success: _.bind(function (res) {
                        console.log(res);
                        $('.imageUploadProgress').progress({
                            percent: 100
                        });
                        if (res.status == 0) {
                            setTimeout(function(){ 
                                swal("Error",res.message, "error");
                            }, 500);
                        } else {
                            //Set URL and Src
                            $(".crImageURL").val(res.data);
                            $(".crImagePreview").attr("src", window.bims.imageLocations + "ResidentImages/" + res.data);
                        }
                        setTimeout(function(){ 
                            $(".uploadLoadingModal").modal("hide");
                            $(".add-residents-modal").modal("show");
                        }, 1000);
                    }, this), 
                    error: function (jqXHR) {
                        setTimeout(function(){ 
                            $(".uploadLoadingModal").modal("hide");
                        }, 1000);
                        swal("Error","Unable to Complete Upload.", "error");
                        $(".add-residents-modal").modal("show");
                    }
                });
                //End of AJAX
            } else {
                $(".crImageURL").val("");
                let thisGender = $(".crGender").dropdown('get value');
                if (thisGender == "") {
                    $(".crImagePreview").attr("src", window.bims.imageLocations  + "Blank.png");
                } else {
                    $(".crImagePreview").attr("src", window.bims.imageLocations + thisGender + ".png");
                }
            }
        });
        $('.crUploadImage').off("click").click(function (e) {
            $(".crImage").click();
            return false;
        });

        // $('.crGender').dropdown({ values: [{name: 'Male', value: 'Male'},{name: 'Female', value: 'Female'}],
        //     onChange: function(value, text, $selectedItem) {
        //         //check if image url is set
        //         if ($(".crImageURL").val() == "") {
        //             if ( value == "") {
        //                 $(".crImagePreview").attr("src", window.bims.imageLocations  + "Blank.png");
        //             } else {
        //                 $(".crImagePreview").attr("src", window.bims.imageLocations + value + ".png");
        //             }
        //         }
        //     }
        // });
        $(".crMale").checkbox({
            onChecked: function (e) {
                if ($(".crImageURL").val() == "") {
                    $(".crImagePreview").attr("src", window.bims.imageLocations + "Male.png");
                }
            }
        });
        $(".crFemale").checkbox({
            onChecked: function (e) {
                if ($(".crImageURL").val() == "") {
                    $(".crImagePreview").attr("src", window.bims.imageLocations + "Female.png");
                }
            }
        });

        //Citizenship
        let citizenshipValues = [{name: 'American', value: 'American'},{name: 'Canadian', value: 'Canadian'},{name: 'Chinese', value: 'Chinese'},{name: 'Filipino', value: 'Filipino'},{name: 'Japanese', value: 'Japanese'},{name: 'Korean', value: 'Korean'},{name: 'Others', value: 'Others'}];
        $('.crCitizenship').dropdown({
            values: citizenshipValues,
            onChange: function(value, text, $selectedItem) {
                if (value == "Others") {
                    $(".crOtherCitizenship").show();
                } else {
                    $(".crOtherCitizenship").val("");
                    $(".crOtherCitizenship").hide();
                }
            }
        });

        $('.crCivilStatus').dropdown({ values: [{name: 'Single', value: 'Single'},{name: 'Married', value: 'Married'},{name: 'Widowed', value: 'Widowed'},{name: 'Divorced', value: 'Divorced'},{name: 'Separated', value: 'Separated'}]});
        $('.crAddressZone').dropdown({ values: [{name: 'Ausmolo', value: 'Ausmolo'},{name: 'Ilaya', value: 'Ilaya'},{name: 'Manggahan I', value: 'Manggahan I'},{name: 'Manggahan II', value: 'Manggahan II'},{name: 'Looban', value: 'Looban'},{name: 'Aliw', value: 'Aliw'},{name: 'Gitna', value: 'Gitna'},{name: 'Bukid', value: 'Bukid'}]});
        let dt = new Date();
        dt.setDate( dt.getDate() - 1 );
        $('.crBirthDate').calendar({type: 'date', maxDate: dt});
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
        $(".erOtherCitizenship").show();
        $(".erOtherCitizenship").val("");
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
                // $(".erAddressNo").val(resp.data.AddressNo);
                // $(".erAddressSt").val(resp.data.AddressSt);
                $(".erAddress").val(resp.data.Address);
                $(".erBirthPlace").val(resp.data.BirthPlace);
                //$(".erCitizenship").val(resp.data.Citizenship);
                $(".erImagePreview").attr("src", window.bims.imageLocations + "ResidentImages/" + resp.data.Image);
                $(".erImageURL").val(resp.data.Image);

                let thisGenderVal = resp.data.Gender;
                // var genderValues = [{name: 'Male', value: 'Male'},{name: 'Female', value: 'Female'}];
                // _.each(genderValues, function(valueOption) {
                //     if (valueOption.value == thisGenderVal) {
                //         valueOption.selected = true;
                //     }
                // });
                // $('.erGender').dropdown({ values: genderValues,
                //     onChange: function(value, text, $selectedItem) {
                //         //check if image url is set
                //         if ($(".erImageURL").val() == "") {
                //             if ( value == "") {
                //                 $(".erImagePreview").attr("src", window.bims.imageLocations  + "Blank.png");
                //             } else {
                //                 $(".erImagePreview").attr("src", window.bims.imageLocations + value + ".png");
                //             }
                //         }
                //     }
                // });
                $(".erMale").checkbox({
                    onChecked: function (e) {
                        if ($(".erImageURL").val() == "") {
                            $(".erImagePreview").attr("src", window.bims.imageLocations + "Male.png");
                        }
                    }
                });
                $(".erFemale").checkbox({
                    onChecked: function (e) {
                        if ($(".erImageURL").val() == "") {
                            $(".erImagePreview").attr("src", window.bims.imageLocations + "Female.png");
                        }
                    }
                });
                thisGenderVal == "Male" ? $(".erMale").checkbox("set checked") : $(".erFemale").checkbox("set checked")
                if ($(".erImageURL").val() == "") {
                    $(".erImagePreview").attr("src", window.bims.imageLocations + thisGenderVal + ".png");
                }


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
                

                let citizenshipValues = [{name: 'American', value: 'American'},{name: 'Canadian', value: 'Canadian'},{name: 'Chinese', value: 'Chinese'},{name: 'Filipino', value: 'Filipino'},{name: 'Japanese', value: 'Japanese'},{name: 'Korean', value: 'Korean'},{name: 'Others', value: 'Others'}];
                let otherChecker = 0;
                _.each(citizenshipValues, function(valueOption) {
                    if (valueOption.value == resp.data.Citizenship) {
                        valueOption.selected = true;
                        otherChecker++;
                    }
                });
                console.log(resp.data.Citizenship);
                if (otherChecker == 0) {
                    citizenshipValues[6].selected = true;
                    $(".erOtherCitizenship").val(resp.data.Citizenship);
                    $(".erOtherCitizenship").show();
                }
                $('.erCitizenship').dropdown({
                    values: citizenshipValues,
                    onChange: function(value, text, $selectedItem) {
                        if (value == "Others") {
                            $(".erOtherCitizenship").show();
                        } else {
                            $(".erOtherCitizenship").hide();
                        }
                    }
                });

                window.bims.hidePreloader();
                $(".edit-residents-modal").modal({
                    closable: false,
                    onApprove: function(e) {
                        let fName = $(this).find(".erFname").val();
                        let mName = $(this).find(".erMname").val();
                        let lName = $(this).find(".erLname").val();
                        // let gender = $(this).find(".erGender").dropdown('get value');
                        let male = $(this).find(".erMale").checkbox('is checked') == true ? "Male" : "";
                        let female = $(this).find(".erFemale").checkbox('is checked') == true ? "Female" : "";
                        let gender = male + female;
                        let civilstatus = $(this).find(".erCivilStatus").dropdown('get value');
                        let birthdate = $(this).find('.erBirthDate').calendar('get date');
                        // let addressno = $(this).find('.erAddressNo').val();
                        // let addressst = $(this).find('.erAddressSt').val();
                        let address = $(this).find('.erAddress').val();
                        let addresszone = $(this).find('.erAddressZone').dropdown('get value');
                        let birthplace = $(this).find('.erBirthPlace').val();
                        //let citizenship = $(this).find('.erCitizenship').val();
                        let citizenship = $(this).find(".erCitizenship").dropdown('get value');
                        let imgUrl = $(this).find('.erImageURL').val();
                        
                        if (fName.trim() == "" || mName.trim() == "" || lName.trim() == "" || gender.trim() == "" || civilstatus.trim() == "" || address.trim() == "" || addresszone.trim() == "" || birthplace.trim() == "" || citizenship.trim() == "" || birthdate == null) {
                            swal("Error","Please Fill-Out All The Fields!","error" );
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
                            // AddressNo: addressno,
                            // AddressSt:addressst,
                            Address: address,
                            AddressZone:addresszone,
                            BirthPlace: birthplace,
                            Citizenship: citizenship,
                            Image: imgUrl,
                            ModifiedBy: window.bims.currentUser.ID
                        });
                        window.bims.showPreloader();
                        $(this).modal('hide');
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
                $('.erImage').off("change").change(function(){
                    if ($('.erImage')[0].files.length > 0) {
                        //Only run ajax call if there's a file
                        var attachments = $('.erImage');
                        var attachmentFiles = attachments[0].files;
                        var file = attachmentFiles[0];
                        var thisSize = file.size / 1024 / 1024;
                        if (thisSize > 20) {
                            swal("Unable to upload image, image exceeds 20mb size");
                            return false;
                        }
                        var formData = new FormData();
                        formData.append("myFile", file);
        
                        $(".uploadLoadingModal").modal({
                            closable: false,
                        }).modal("show");
                        $('.imageUploadProgress').progress({
                            percent: 0
                        });
                        $.ajax({
                            url: window.bims.endpointUrl + "Upload/UploadImages",
                            type: 'POST',
                            data: formData,
                            processData: false,
                            contentType: false,
                            xhr: function () {  // custom xhr
                                myXhr = $.ajaxSettings.xhr();
                                if (myXhr.upload) { // check if upload property exists
                                    myXhr.upload.addEventListener('progress', function (evt) {
                                        //console.log('updateProgress');
                                        if (evt.lengthComputable) {
                                            var percentComplete = evt.loaded / evt.total;
                                            //console.log(percentComplete);
                                            $('.imageUploadProgress').progress({
                                                percent: percentComplete
                                            });
        
                                        } else {
                                            // Unable to compute progress information since the total size is unknown
                                            swal("Error","Unable to Complete Upload.", error);
                                            setTimeout(function(){ 
                                                $(".uploadLoadingModal").modal("hide");
                                            }, 1000);
                                        }
                                    }, false); 
                                }
                                return myXhr;
                            },
                            success: _.bind(function (res) {
                                console.log(res);
                                $('.imageUploadProgress').progress({
                                    percent: 100
                                });
                                if (res.status == 0) {
                                    setTimeout(function(){ 
                                        swal("Error",res.message, "error");
                                    }, 500);
                                } else {
                                    //Set URL and Src
                                    $(".erImageURL").val(res.data);
                                    $(".erImagePreview").attr("src", window.bims.imageLocations + "ResidentImages/" + res.data);
                                }
                                setTimeout(function(){ 
                                    $(".uploadLoadingModal").modal("hide");
                                    $(".edit-residents-modal").modal("show");
                                }, 1000);
                            }, this), 
                            error: function (jqXHR) {
                                setTimeout(function(){ 
                                    $(".uploadLoadingModal").modal("hide");
                                }, 1000);
                                swal("Error","Unable to Complete Upload.", "error");
                                $(".edit-residents-modal").modal("show");
                            }
                        });
                        //End of AJAX
                    } else {
                        $(".erImageURL").val("");
                        let thisGender = $(".erGender").dropdown('get value');
                        if (thisGender == "") {
                            $(".erImagePreview").attr("src", window.bims.imageLocations  + "Blank.png");
                        } else {
                            $(".erImagePreview").attr("src", window.bims.imageLocations + thisGender + ".png");
                        }
                    }
                });
                $('.erUploadImage').off("click").click(function (e) {
                    $(".erImage").click();
                    return false;
                });
                let dt = new Date();
                dt.setDate( dt.getDate() - 1 );
                $('.erBirthDate').calendar({type: 'date', maxDate: dt });
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
