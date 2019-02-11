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

var OwnersDataTable;
var View = Backbone.View.extend({
    // any events this view should control
    events: {
        "click .btnAddOwner":"onClickAddOwner",
        "click .btnRemoveOwner": "onClickRemoveOwner",
        "click .btnUpdateOwner":"onClickUpdateOwner"
    },
    initialize: function() {
        let util = new Util();
        this.template = util.getTmpl('ownerView.html');
    },

    render: function() {
        //LoginView.__super__.render.apply(this, arguments);
        //this.$el.html(this.template);
        var self = this;
        window.bims.showPreloader();
        //fetch data
        let OwnerListModel = Backbone.Model.extend({
            url: window.bims.endpointUrl + "Owner/GetOwnerList"
        });
        let ownerListModel = new OwnerListModel();
        ownerListModel.fetch({
            success: function (models, response) {
                window.bims.hidePreloader();
                if (response.data) {
                    var compiled = _.template(self.template);
                    self.$el.html(compiled({owners: response.data }));
                    OwnersDataTable = self.$el.find('.ownersDataTable').DataTable();
                }
            },
            error: function(e) {
                swal("Error", "An Error Occured, Please Try Again Later", "error");
                window.bims.hidePreloader();
            }
        });
        return this;
    },
    onClickAddOwner: function(e) {
        $('.aoForm').form('clear');
        $(".aoBusinessTableBody").empty();
        var self = this;
        let addOwnerModal = $(".add-owner-modal").modal({
            closable: false,
            onApprove: function(e) {
                let fName = $(this).find(".aoFname").val();
                let mName = $(this).find(".aoMname").val();
                let lName = $(this).find(".aoLname").val();
                let address = $(this).find(".aoAddress").val();
                let contactno = $(this).find(".aoContactNo").val();
                let imgUrl = $(this).find('.aoImageURL').val();
                
                if (fName.trim() == "" || mName.trim() == "" || lName.trim() == "" || address.trim() == "" || contactno.trim() == "") {
                    swal("Error","Please Fill All The Fields!","error" );
                    return false;
                }
                if ($(this).find(".aoToAddBusinessRow").length < 1) {
                    swal("Error","Please Add Atleast 1 Business For This Owner.","error" );
                    return false;
                }

                let InsertOwner = Backbone.Model.extend({
                    url: window.bims.endpointUrl + "Owner/AddOwner"
                });
                let addOwnerData = {
                    FirstName: fName,
                    MiddleName: mName,
                    LastName: lName,
                    Address: address,
                    ContactNo: contactno,
                    Image: imgUrl,
                    CreatedBy: window.bims.currentUser.ID,
                    ModifiedBy: window.bims.currentUser.ID,
                    Businesses: []
                }
                let DTISecCheck = [];
                _.each($(this).find(".aoToAddBusinessRow"), function(elmnt) {
                    let businessData = {
                        BusinessName: $($(elmnt).find("input")[0]).val(),
                        BusinessAddress: $($(elmnt).find("input")[1]).val(),
                        FloorArea: $($(elmnt).find("input")[2]).val(),
                        DTI_SEC_RegNo: $($(elmnt).find("input")[3]).val(),
                        BusinessContactNo: $($(elmnt).find("input")[4]).val(),
                        KindOfBusiness: $($(elmnt).find("input")[5]).val(),
                        Capitalization: $($(elmnt).find("input")[6]).val()
                    }
                    addOwnerData.Businesses.push(businessData);
                    DTISecCheck.push(businessData.DTI_SEC_RegNo);
                });

                function hasDuplicates(array) {
                    var valuesSoFar = Object.create(null);
                    for (var i = 0; i < array.length; ++i) {
                        var value = array[i];
                        if (value in valuesSoFar) {
                            return true;
                        }
                        valuesSoFar[value] = true;
                    }
                    return false;
                }
                if (hasDuplicates(DTISecCheck)) {
                    swal("Error","One Or More Businesses Has The Same DTI/SEC Reg. No.","error" );
                    return false;
                }

                let addOwner = new InsertOwner();
                $(this).modal('hide');
                var selfModal = $(this);
                window.bims.showPreloader();
                addOwner.save(addOwnerData, {
                    success: function(modelRes, response) {
                        window.bims.hidePreloader();
                        if (response.status == 1) {
                            swal("Success", "Successfully Added", "success").then((value) => {
                                //$(".add-residents-modal").modal('hide');
                                $(".btnBusinessOwners").click();
                            });
                        } else {
                            swal("Error", response.message, "error").then((value) => {
                                selfModal.modal('show');
                            });
                        }
                    },
                    error: function() {
                        window.bims.hidePreloader();
                        selfModal.modal('show');
                        swal("Error", "An Error Occured, Please Try Again Later", "error");
                        return false;
                    }
                });
                return false;
            }
        }).modal('show');
        $('.aoImage').off("change").change(function(){
            if ($('.aoImage')[0].files.length > 0) {
                //Only run ajax call if there's a file
                var attachments = $('.aoImage');
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
                    url: window.bims.endpointUrl + "Upload/UploadOwnerImage",
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
                            $(".aoImageURL").val(res.data);
                            $(".aoImagePreview").attr("src", window.bims.imageLocations + "OwnerImages/" + res.data);
                        }
                        setTimeout(function(){ 
                            $(".uploadLoadingModal").modal("hide");
                            $(".add-owner-modal").modal("show");
                        }, 1000);
                    }, this), 
                    error: function (jqXHR) {
                        setTimeout(function(){ 
                            $(".uploadLoadingModal").modal("hide");
                        }, 1000);
                        swal("Error","Unable to Complete Upload.", "error");
                        $(".add-owner-modal").modal("show");
                    }
                });
                //End of AJAX
            } else {
                $(".aoImageURL").val("");
                $(".aoImagePreview").attr("src", window.bims.imageLocations  + "Blank.png");
            }
        });
        $('.aoUploadImage').off("click").click(function (e) {
            $(".aoImage").click();
            return false;
        });
        
        $('.aoAddBusiness').off("click").click(function (e) {
            self.onClickAddOwnerAddBusiness(addOwnerModal);
            return false;
        });

        $(".aoImagePreview").attr("src", window.bims.imageLocations  + "Blank.png");
        $('#hideToggle').click();
    },
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
    onClickAddOwnerAddBusiness: function(addOwnerModal) {
        var self = this;
        addOwnerModal.modal('hide');
        $(".aobForm").form("clear");
        $(".add-owner-add-business-modal").modal({
            onApprove: function() {
                let businessName = $(".aobName").val();
                let businessAddress = $(".aobAddress").val();
                let businessFloorArea = $(".aobFloorArea").val();
                let dti = $(".aobDTI_SEC_RegNo").val();
                let capital = $(".aobCapitalization").val();
                let contactNo = $(".aobContactNo").val();
                let kindofbusiness = $(".aobKindOfBusiness").val();

                if (businessName.trim() == "" || businessAddress.trim() == "" || businessFloorArea.trim() == "" || dti.trim() == "" || capital.trim() == "" || contactNo.trim() == "" || kindofbusiness.trim() == "") {
                    swal("Error", "Please Fill All The Fields.", "error");
                    return false;
                }
                if (Number(capital) < 0) {
                    swal("Error", "Capital Should be Greater Than 0.", "error");
                    return false;
                }
                //Add To BusinessList
                let trHtml = "<tr class='aoToAddBusinessRow'>'" +
                '<td class="collapsing">' +
                '<button class="ui icon button btnRemoveFromBusinessToAddList">' +
                '<i class="red remove icon"></i>' +
                '</button>' +
                '</td>' +
                "<td>" + businessName + "<input type='hidden' value='" + businessName + "'></td>" +
                "<td>" + businessAddress + "<input type='hidden' value='" + businessAddress + "'></td>" +
                "<td>" + businessFloorArea + "<input type='hidden' value='" + businessFloorArea + "'></td>" +
                "<td>" + dti + "<input type='hidden' value='" + dti + "'></td>" +
                "<td>" + contactNo + "<input type='hidden' value='" + contactNo + "'></td>" +
                "<td>" + kindofbusiness + "<input type='hidden' value='" + kindofbusiness + "'></td>" +
                "<td>₱ " + self.formatMoney(self.toFixed(capital,2)) + "<input type='hidden' value='" + self.toFixed(capital,2) + "'></td>" +
                "</tr>";
                $(".aoBusinessTableBody").append(trHtml);
                addOwnerModal.find(".btnRemoveFromBusinessToAddList").off("click").on("click", function(e) {
                    $(e.currentTarget).closest("tr").remove();
                });
                addOwnerModal.modal('show');
            },
            onHidden: function() {
                addOwnerModal.modal('show');
            }
        }).modal('show');
    },
    onClickUpdateOwner: function(e) {
        var self = this;
        var ownerId = $(e.currentTarget).closest("tr").attr("data-id");
        //Clear first
        $(".eoForm").form("clear");
        $(".eoBusinessTableBody").empty();

        //Let's fetch info from database
        let GetOwnerInfo = Backbone.Model.extend({
            url: window.bims.endpointUrl + "Owner/GetOwnerInfo/" + ownerId
        });
        let getOwnerInfo = new GetOwnerInfo();
        window.bims.showPreloader();
        getOwnerInfo.fetch({
            success: function(model, resp) {
                $(".eoFname").val(resp.data.Owner.FirstName);
                $(".eoMname").val(resp.data.Owner.MiddleName);
                $(".eoLname").val(resp.data.Owner.LastName);
                if (resp.data.Owner.Image != "") {
                    $(".eoImagePreview").attr("src", window.bims.imageLocations + "OwnerImages/" + resp.data.Owner.Image);
                } else {
                    $(".eoImagePreview").attr("src", window.bims.imageLocations  + "Blank.png");
                }
                $(".eoImageURL").val(resp.data.Owner.Image);
                $(".eoContactNo").val(resp.data.Owner.ContactNo);
                $(".eoAddress").val(resp.data.Owner.Address);
                _.each(resp.data.OwnerBusiness, function(business) {
                    let trHtml = "<tr class='eoToAddBusinessRow' data-id=" + business.ID + ">'" +
                    '<td class="collapsing">' +
                    '<button class="ui icon button btnEditBusiness">' +
                    '<i class="yellow pencil icon"></i>' +
                    '</button>' +
                    '</td>' +
                    "<td>" + business.BusinessName + "<input type='hidden' value='" + business.BusinessName + "'></td>" +
                    "<td>" + business.BusinessAddress + "<input type='hidden' value='" + business.BusinessAddress + "'></td>" +
                    "<td>" + business.FloorArea + "<input type='hidden' value='" + business.FloorArea + "'></td>" +
                    "<td>" + business.DTI_SEC_RegNo + "<input type='hidden' value='" + business.DTI_SEC_RegNo + "'></td>" +
                    "<td>" + business.BusinessContactNo + "<input type='hidden' value='" + business.BusinessContactNo + "'></td>" +
                    "<td>" + business.KindOfBusiness + "<input type='hidden' value='" + business.KindOfBusiness + "'></td>" +
                    "<td>₱ " + self.formatMoney(self.toFixed(business.Capitalization,2)) + "<input type='hidden' value='" + self.toFixed(business.Capitalization,2) + "'></td>" +
                    "</tr>";
                    $(".eoBusinessTableBody").append(trHtml);
                });


                window.bims.hidePreloader();
                let editOwnerModal = $(".edit-owner-modal").modal({
                    closable: false,
                    onApprove: function(e) {
                        let fName = $(this).find(".eoFname").val();
                        let mName = $(this).find(".eoMname").val();
                        let lName = $(this).find(".eoLname").val();
                        let address = $(this).find(".eoAddress").val();
                        let contactno = $(this).find(".eoContactNo").val();
                        let imgUrl = $(this).find('.eoImageURL').val();
                        
                        if (fName.trim() == "" || mName.trim() == "" || lName.trim() == "" || address.trim() == "" || contactno.trim() == "") {
                            swal("Error","Please Fill All The Fields!","error" );
                            return false;
                        }
                        let UpdateOwner = Backbone.Model.extend({
                            url: window.bims.endpointUrl + "Owner/UpdateOwner"
                        });
                        let updateOwner = new UpdateOwner();
                        let updateOwnerData = {
                            FirstName: fName,
                            MiddleName: mName,
                            LastName: lName,
                            Address: address,
                            ContactNo: contactno,
                            Image: imgUrl,
                            ModifiedBy: window.bims.currentUser.ID,
                            ID: ownerId,
                            Businesses: []
                        }

                        let DTISecCheck = [];
                        _.each($(this).find(".eoToAddBusinessRow"), function(elmnt) {
                            let businessData = {
                                BusinessName: $($(elmnt).find("input")[0]).val(),
                                BusinessAddress: $($(elmnt).find("input")[1]).val(),
                                FloorArea: $($(elmnt).find("input")[2]).val(),
                                DTI_SEC_RegNo: $($(elmnt).find("input")[3]).val(),
                                BusinessContactNo: $($(elmnt).find("input")[4]).val(),
                                KindOfBusiness: $($(elmnt).find("input")[5]).val(),
                                Capitalization: $($(elmnt).find("input")[6]).val(),
                                ID: $(elmnt).attr("data-id")
                            }
                            updateOwnerData.Businesses.push(businessData);
                            DTISecCheck.push(businessData.DTI_SEC_RegNo);
                        });
                        
                        function hasDuplicates(array) {
                            var valuesSoFar = Object.create(null);
                            for (var i = 0; i < array.length; ++i) {
                                var value = array[i];
                                if (value in valuesSoFar) {
                                    return true;
                                }
                                valuesSoFar[value] = true;
                            }
                            return false;
                        }
                        if (hasDuplicates(DTISecCheck)) {
                            swal("Error","One Or More Businesses Has The Same DTI/SEC Reg. No.","error" );
                            return false;
                        }
                        
                        window.bims.showPreloader();
                        $(this).modal('hide');
                        updateOwner.save(updateOwnerData, {
                            success: function(modelRes, response) {
                                window.bims.hidePreloader();
                                if (response.status == 1) {
                                    swal("Success", "Successfully Updated", "success").then((value) => {
                                        $(".edit-owner-modal").modal('hide');
                                        $(".btnBusinessOwners").click();
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
                $('.eoImage').off("change").change(function(){
                    if ($('.eoImage')[0].files.length > 0) {
                        //Only run ajax call if there's a file
                        var attachments = $('.eoImage');
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
                            url: window.bims.endpointUrl + "Upload/UploadOwnerImage",
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
                                    $(".eoImageURL").val(res.data);
                                    $(".eoImagePreview").attr("src", window.bims.imageLocations + "OwnerImages/" + res.data);
                                }
                                setTimeout(function(){ 
                                    $(".uploadLoadingModal").modal("hide");
                                    $(".edit-owner-modal").modal("show");
                                }, 1000);
                            }, this), 
                            error: function (jqXHR) {
                                setTimeout(function(){ 
                                    $(".uploadLoadingModal").modal("hide");
                                }, 1000);
                                swal("Error","Unable to Complete Upload.", "error");
                                $(".edit-owner-modal").modal("show");
                            }
                        });
                        //End of AJAX
                    } else {
                        $(".eoImagePreview").attr("src", window.bims.imageLocations  + "Blank.png");
                        $(".eoImageURL").val("");
                    }
                });
                $('.eoUploadImage').off("click").click(function (e) {
                    $(".eoImage").click();
                    return false;
                });
                $('.eoAddBusiness').off("click").click(function (e) {
                    self.onClickEditOwnerAddBusiness(editOwnerModal);
                    return false;
                });

                $(".btnEditBusiness").off("click").on("click", function(e) {
                    let thisRow = $(e.currentTarget).closest("tr");
                    editOwnerModal.modal("hide");
                    
                    $(".eoebName").val($(thisRow.find("input")[0]).val());
                    $(".eoebAddress").val($(thisRow.find("input")[1]).val());
                    $(".eoebFloorArea").val($(thisRow.find("input")[2]).val());
                    $(".eoebDTI_SEC_RegNo").val($(thisRow.find("input")[3]).val());
                    $(".eoebContactNo").val($(thisRow.find("input")[4]).val());
                    $(".eoebKindOfBusiness").val($(thisRow.find("input")[5]).val());
                    $(".eoebCapitalization").val($(thisRow.find("input")[6]).val());
                    
                    self.onClickEditBusiness(thisRow,editOwnerModal);
                    
                });


                $('#hideToggle').click();
            },
            error: function(e) {
                window.bims.hidePreloader();
                swal("Error", "An Error Occured, Please Try Again Later", "error");
            }
        });
    },
    onClickEditOwnerAddBusiness: function (editOwnerModal) {
        var self = this;
        editOwnerModal.modal('hide');
        $(".eobForm").form("clear");
        $(".edit-owner-add-business-modal").modal({
            onApprove: function() {
                let businessName = $(".eobName").val();
                let businessAddress = $(".eobAddress").val();
                let businessFloorArea = $(".eobFloorArea").val();
                let dti = $(".eobDTI_SEC_RegNo").val();
                let capital = $(".eobCapitalization").val();
                let contactNo = $(".eobContactNo").val();
                let kindofbusiness = $(".eobKindOfBusiness").val();

                if (businessName.trim() == "" || businessAddress.trim() == "" || businessFloorArea.trim() == "" || dti.trim() == "" || capital.trim() == "" || contactNo.trim() == "" || kindofbusiness.trim() == "") {
                    swal("Error", "Please Fill All The Fields.", "error");
                    return false;
                }
                if (Number(capital) < 0) {
                    swal("Error", "Capital Should be Greater Than 0.", "error");
                    return false;
                }
                //Add To BusinessList
                let trHtml = "<tr class='eoToAddBusinessRow' data-id=" + null + ">'" +
                '<td class="collapsing">' +
                '<button class="ui icon button btnEditBusiness">' +
                '<i class="yellow pencil icon"></i>' +
                '</button>' +
                '</td>' +
                "<td>" + businessName + "<input type='hidden' value='" + businessName + "'></td>" +
                "<td>" + businessAddress + "<input type='hidden' value='" + businessAddress + "'></td>" +
                "<td>" + businessFloorArea + "<input type='hidden' value='" + businessFloorArea + "'></td>" +
                "<td>" + dti + "<input type='hidden' value='" + dti + "'></td>" +
                "<td>" + contactNo + "<input type='hidden' value='" + contactNo + "'></td>" +
                "<td>" + kindofbusiness + "<input type='hidden' value='" + kindofbusiness + "'></td>" +
                "<td>₱ " + self.formatMoney(self.toFixed(capital,2)) + "<input type='hidden' value='" + self.toFixed(capital,2) + "'></td>" +
                "</tr>";
                $(".eoBusinessTableBody").append(trHtml);
                editOwnerModal.find(".btnEditBusiness").off("click").on("click", function(e) {
                    let thisRow = $(e.currentTarget).closest("tr");
                    editOwnerModal.modal("hide");
                    
                    $(".eoebName").val($(thisRow.find("input")[0]).val());
                    $(".eoebAddress").val($(thisRow.find("input")[1]).val());
                    $(".eoebFloorArea").val($(thisRow.find("input")[2]).val());
                    $(".eoebDTI_SEC_RegNo").val($(thisRow.find("input")[3]).val());
                    $(".eoebContactNo").val($(thisRow.find("input")[4]).val());
                    $(".eoebKindOfBusiness").val($(thisRow.find("input")[5]).val());
                    $(".eoebCapitalization").val($(thisRow.find("input")[6]).val());
                    
                    self.onClickEditBusiness(thisRow,editOwnerModal);
                    
                });
                editOwnerModal.modal('show');
            },
            onHidden: function() {
                editOwnerModal.modal('show');
            }
        }).modal('show');
    },
    onClickRemoveOwner: function(e) {
        var fName = $($(e.currentTarget).closest("tr").find("td")[1]).text();
        var mName = $($(e.currentTarget).closest("tr").find("td")[2]).text();
        var lName = $($(e.currentTarget).closest("tr").find("td")[3]).text();
        var ownerId = $(e.currentTarget).closest("tr").attr("data-id");
        swal({
            title: "Are you sure?",
            text: "Do you want to remove " + fName + " " + mName + " " + lName + "?",
            icon: "warning",
            buttons: true,
            dangerMode: true,
          })
          .then((willDelete) => {
            if (willDelete) {
                let RemoveOwner = Backbone.Model.extend({
                    url: window.bims.endpointUrl + "Owner/DeleteOwner/" + ownerId
                });
                let removeOwner = new RemoveOwner();
                removeOwner.fetch({
                    success: function() {
                        swal("Success", "Successfully Deleted", "success").then((value) => {
                            $(".btnBusinessOwners").click();
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
    onClickEditBusiness: function(thisRow,editOwnerModal) {
        var self = this;
        $(".edit-owner-edit-business-modal").modal({
            onApprove: function() {
                let businessName1 = $(".eoebName").val();
                let businessAddress1 = $(".eoebAddress").val();
                let businessFloorArea1 = $(".eoebFloorArea").val();
                let dti1 = $(".eoebDTI_SEC_RegNo").val();
                let capital1 = $(".eoebCapitalization").val();
                let contactNo1 = $(".eoebContactNo").val();
                let kindofbusiness1 = $(".eoebKindOfBusiness").val();

                if (businessName1.trim() == "" || businessAddress1.trim() == "" || businessFloorArea1.trim() == "" || dti1.trim() == "" || capital1.trim() == "" || contactNo1.trim() == "" || kindofbusiness1.trim() == "") {
                    swal("Error", "Please Fill All The Fields.", "error");
                    return false;
                }
                if (Number(capital1) < 0) {
                    swal("Error", "Capital Should be Greater Than 0.", "error");
                    return false;
                }
                //Add To BusinessList
                let trHtml1 = "<td>" + businessName1 + "<input type='hidden' value='" + businessName1 + "'></td>" +
                "<td>" + businessAddress1 + "<input type='hidden' value='" + businessAddress1 + "'></td>" +
                "<td>" + businessFloorArea1 + "<input type='hidden' value='" + businessFloorArea1 + "'></td>" +
                "<td>" + dti1 + "<input type='hidden' value='" + dti1 + "'></td>" +
                "<td>" + contactNo1 + "<input type='hidden' value='" + contactNo1 + "'></td>" +
                "<td>" + kindofbusiness1 + "<input type='hidden' value='" + kindofbusiness1 + "'></td>" +
                "<td>₱ " + self.formatMoney(self.toFixed(capital1,2)) + "<input type='hidden' value='" + self.toFixed(capital1,2) + "'></td>" ;
                //thisRow.replaceWith(trHtml1);
                thisRow.find("td.collapsing").next("td").remove();
                thisRow.find("td.collapsing").next("td").remove();
                thisRow.find("td.collapsing").next("td").remove();
                thisRow.find("td.collapsing").next("td").remove();
                thisRow.find("td.collapsing").next("td").remove();
                thisRow.find("td.collapsing").next("td").remove();
                thisRow.find("td.collapsing").next("td").remove();
                thisRow.append(trHtml1);
                editOwnerModal.modal("show");
            },
            onHidden: function() {
                editOwnerModal.modal("show");
            }
        }).modal("show");
    }
});
module.exports = View;
