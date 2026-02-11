sap.ui.define([
    "ehs/inc/reportincidents1/util/Constants",
    "ehs/inc/reportincidents1/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "ehs/inc/reportincidents1/model/formatter",
    "sap/ui/model/Filter",
    "ehs/inc/reportincidents1/util/PictureHelper",
    "ehs/inc/reportincidents1/util/CreateIncidentHelper",
    "sap/ui/core/ValueState",
    "sap/m/MessageToast",
    "sap/ui/Device",
    "ehs/inc/reportincidents1/offline/OfflineInterface",
    "ehs/inc/reportincidents1/util/Utils",
    "ehs/inc/reportincidents1/util/GeoLocationHelper",
    "ehs/inc/reportincidents1/util/CurrentPositionWarningDialog",
    "sap/ui/core/mvc/XMLView",
    "sap/m/ColumnListItem",
    "sap/m/Label"
], function (C, B, J, M, f, F, P, a, V, b, D, O, U, G, c, X, d, L) {
    "use strict";

    return sap.ui.controller("customer.report.incident.controller.CreateIncidentCustom", {

        formatter: f,
        XMLView: X,

        onInit: function () {
            var t = this;

            // Attach route matched event
            this.getRouter().getRoute("create")
                .attachPatternMatched(this._onObjectMatched, this);

            a.defineCustomPartHandler();

            // Main view model
            this._oViewModel = new J({
                delay: 0,
                busy: false,
                viewTitle: "",
                incidentCategory: "",
                bIsGSEIncident: false,
				bIsaircraftDamageOccurrence: false,
				bIsaircraftDamageNoticed: false,
				bIsaircraftLoadingError: false,
				bIsBoardingCheckinError: false,
				bIsInjuredSickStaffDetails: false,
				bIsPostIncidentAction: false,
				bIsIncidentWitnessType: false,
				bIsAnyGSEInvolvementinInjuryCase: false // ✅ Needed for GSE panel visibility
            });

            this.setModel(this._oViewModel, "createView");
            this.setModel(new J(C), "constants");

            // Clear existing messages
            if (this.getOwnerComponent().oMessageManager.getMessageModel().getData().length) {
                this.getOwnerComponent().oMessageManager.removeAllMessages();
            }

            // Get controls for location, person, witness, geolocation
            var l = this.getView().byId("idIncidentLocation");
            var p = this.getView().byId("personInput");
            var w = this.getView().byId("witnessInput");
            var g = this.getView().byId("GeoLocationRadioButton");

            // Device-specific logic
            if (this._IsMobileDevice()) {
                l.attachValueHelpRequest(this.onLocationValueHelp, this);
                p.setShowValueHelp(false);
                p.setShowSuggestion(false);
                w.setShowValueHelp(false);
                w.setShowSuggestion(false);
                g.setVisible(true);
                G._getCurrentPosition(this).then(function () {
                    G.updateGeoLocationModel(t);
                });
            } else {
                l.attachValueHelpRequest(this.onLocationHierarchyValueHelp, this);
            }

            // ---------------- Occurrence Type Model ----------------
            // JSON Model for ComboBox
            var oOccModel = new J({
                occurrenceTypes: []
            });
            this.getView().setModel(oOccModel, "occModel");

            // JSON Model for dropdown binding
            var oDropdownModel = new J({
                dropdownItems: []
            });
            this.getView().setModel(oDropdownModel, "ui");

            // Initialize with GOR occurrence type by default
            this._updateOccurrenceTypes(0);

            // Set default radio button selection if exists
            var oRadioBtnGroup = this.getView().byId("classificationRadioButton");
            if (oRadioBtnGroup) {
                oRadioBtnGroup.setSelectedIndex(0);
            }
        },

        // ---------------- OCCURRENCE TYPE METHODS ----------------

        /**
         * Update Occurrence Types dynamically based on classification
         */
        _updateOccurrenceTypes: function (iIndex) {
            var oOccModel = this.getView().getModel("occModel");
            var aTypes = [];

            switch (iIndex) {
                case 0: // GOR
                    aTypes = [
                        { key: "GSE_Incidents", text: "GSE Incident" },
                        { key: "Aircraft_Damage_Occurrence", text: "Aircraft Damage Occurrence" },
                        { key: "Aircraft_Damage_Noticed", text: "Aircraft Damage Noticed" },
                        { key: "Aircraft_Loading_Error", text: "Aircraft Loading Error" },
                        { key: "Boarding_CheckIn_Error", text: "Boarding/Check-in Error" }
                    ];
                    break;
                case 1: // HSR
                    aTypes = [
                        { key: "Injured/Sick_Staff_Details", text: "Injured/Sick Staff Details" },
                        { key: "Post_Incident_Action", text: "Post Incident Action" },
                        { key: "Incident_Witness_Details", text: "Incident Witness Details" },
                        { key: "Any_GSE_Involvement_in_Injury_Case", text: "Any GSE Involvement in Injury Case" },
                    ];
                    break;
                case 2: // DGOR
                    aTypes = [
                        { key: "DGOR_Type1", text: "DGOR Type 1" },
                        { key: "DGOR_Type2", text: "DGOR Type 2" }
                    ];
                    break;
                case 3: // SOR
                    aTypes = [
                        { key: "SOR_Type1", text: "SOR Type 1" },
                        { key: "SOR_Type2", text: "SOR Type 2" }
                    ];
                    break;
                default:
                    aTypes = [];
            }

            // Update occurrence type models
            oOccModel.setProperty("/occurrenceTypes", aTypes);
            this.getView().getModel("ui").setProperty("/dropdownItems", aTypes);
        },

        /**
         * Hide all sub-panels related to occurrence types
         */
        _hideAllOccurrencePanels: function () {
            var aPanelIds = [
                "idPanelGSEIncident",
                "idPanelAircraftDamageOccurrence",
                "idPanelAircraftDamageNoticed",
                "idPanelAircraftLoadingError",
                "idPanelBoardingCheckInError"
            ];

            aPanelIds.forEach(function (sId) {
                var oPanel = this.byId(sId);
                if (oPanel) {
                    oPanel.setVisible(false);
                }
            }.bind(this));
        },

        /**
         * RadioButtonGroup selection handler
         */
        onCategoryChange: function (oEvent) {
            var iSelectedIndex = oEvent.getParameter("selectedIndex");

            // Update ComboBox items
            this._updateOccurrenceTypes(iSelectedIndex);

            // Reset ComboBox selection
            var oComboBox = this.byId("idSelOccurrenceType");
            if (oComboBox) {
                oComboBox.setSelectedKey("");
            }

            // Hide all panels
            this._hideAllOccurrencePanels();
        },

        /**
         * Occurrence Type ComboBox selection handler
         */
        onOccurrenceTypeChange: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            var sText = oSelectedItem ? oSelectedItem.getText() : "";
            var oViewModel = this.getModel("createView");

            // Toggle GSE Incident panel visibility
            if (sText === "GSE Incident") {
                oViewModel.setProperty("/bIsGSEIncident", true);
            } else {
                oViewModel.setProperty("/bIsGSEIncident", false);
            }

			// Toggle Aircraft Damage Occurrence panel visibility
            if (sText === "Aircraft Damage Occurrence") {
                oViewModel.setProperty("/bIsaircraftDamageOccurrence", true);
            } else {
                oViewModel.setProperty("/bIsaircraftDamageOccurrence", false);
            }

			// Toggle Aircraft Damage Noticed panel visibility
            if (sText === "Aircraft Damage Noticed") {
                oViewModel.setProperty("/bIsaircraftDamageNoticed", true);
            } else {
                oViewModel.setProperty("/bIsaircraftDamageNoticed", false);
            }

			// Toggle Aircraft Loading Error panel visibility
            if (sText === "Aircraft Loading Error") {
                oViewModel.setProperty("/bIsaircraftLoadingError", true);
            } else {
                oViewModel.setProperty("/bIsaircraftLoadingError", false);
            }

			if (sText === "Boarding/Check-in Error") {
                oViewModel.setProperty("/bIsBoardingCheckinError", true);
            } else {
                oViewModel.setProperty("/bIsBoardingCheckinError", false);
            }

			//HSR

			if (sText === "Injured/Sick Staff Details") {
                oViewModel.setProperty("/bIsInjuredSickStaffDetails", true);
            } else {
                oViewModel.setProperty("/bIsInjuredSickStaffDetails", false);
            }

			if (sText === "Post Incident Action") {
                oViewModel.setProperty("/bIsPostIncidentAction", true);
            } else {
                oViewModel.setProperty("/bIsPostIncidentAction", false);
            }

			if (sText === "Incident Witness Details") {
                oViewModel.setProperty("/bIsIncidentWitnessType", true);
            } else {
                oViewModel.setProperty("/bIsIncidentWitnessType", false);
            }

			if (sText === "Any GSE Involvement in Injury Case") {
                oViewModel.setProperty("/bIsAnyGSEInvolvementinInjuryCase", true);
            } else {
                oViewModel.setProperty("/bIsAnyGSEInvolvementinInjuryCase", false);
            }

            // Hide all panels first
            this._hideAllOccurrencePanels();

            // Show the specific panel based on selection
            switch (sText) {
                case "GSE Incident":
                    this.byId("idPanelGSEIncident")?.setVisible(true);
                    break;
                case "Aircraft Damage Occurrence":
                    this.byId("idPanelAircraftDamageOccurrence")?.setVisible(true);
                    break;
                case "Aircraft Damage Noticed":
                    this.byId("idPanelAircraftDamageNoticed")?.setVisible(true);
                    break;
                case "Aircraft Loading Error":
                    this.byId("idPanelAircraftLoadingError")?.setVisible(true);
                    break;
                case "Boarding/Check-in Error":
                    this.byId("idPanelBoardingCheckInError")?.setVisible(true);
                    break;
                default:
                    break;
            }
        },


		    onBeforeRendering: function (E) {
		        var o = this.getModel();
		        var t = this;
		        o.read("/AppSettings", {
		            success: function (e, r) {
		                var g = e.results;
		                var h = g.filter(function (s) {
		                    return s.Key === "IsCloudEnvironment";
		                });
		                if (h.length > 0) {
		                    var i = h[0].Value === "X";
		                    var A = t.getModel(C.MODEL.APP_MODEL.NAME);
		                    A.setProperty(C.MODEL.APP_MODEL.PROPERTIES.IS_IN_CLOUD, i);
		                }
		            },
		            error: function (e) {
		                M.show(e);
		                var A = this.getModel(C.MODEL.APP_MODEL.NAME);
		                A.setProperty(C.MODEL.APP_MODEL.PROPERTIES.IS_IN_CLOUD, false);
		            }
		        });
		    },
		    onExit: function (e) {
		        this._clearValueHelpDialogs();
		    },
		    onSave: function () {
		        if (this.getAppBusy()) {
		            return;
		        }
		        this.removeAllOwnMessages();
		        var e = this._checkEmptyMandatoryFields();
		        var g = this._checkDateTimeInFuture(this.byId("idDateTimePicker"));
		        var i = this._checkInvolvedPersonsForDuplicates();
		        var E = true;
		        var I = this._checkLocationValidity();
		        this._validatePersonsIdName();
		        if (this.extHookFieldsValidation) {
		            E = this.extHookFieldsValidation();
		        }
		        if (!e && !g && !i && !this._checkFieldWithError() && E && I) {
		            this.setAppBusy();
		            var A = this.getModel(C.MODEL.APP_MODEL.NAME);
		            var h = A.getProperty(C.MODEL.APP_MODEL.PROPERTIES.IS_OFFLINE_ENABLED);
		            var o = this.getView().getBindingContext().getObject();
		            var s = this._getEstRiskType();
		            o.EstimatedRiskTypeCode = s;
		            this._setIncidentGeoLocation(o);
		            var j = this._getControlsByGroupIdAndFieldType("personInputFilterGroup", "sap.m.Input");
		            j = j.concat(this._getControlsByGroupIdAndFieldType("witnessInputFilterGroup", "sap.m.Input"));
		            var S = this.byId("mcGroup").getSelectedItems();
		            var k = this._mapGroupsToCorrectGroupObjects(S);
		            var l = {
		                "incident": o,
		                "persons": j.map(function (m) {
		                    return m.getBindingContext().getObject();
		                }),
		                "asset": this.byId("assetInput").getBindingContext().getObject(),
		                "release": this.byId("releaseContainer").getBindingContext().getObject(),
		                "groups": k
		            };
		            l.release.MaterialRelUom = A.getProperty(C.MODEL.APP_MODEL.DATA.UOM_CODE);
		            a.saveIncident(this.getModel(), l, this.getModel(C.MODEL.APP_MODEL.NAME).getObject(C.MODEL.APP_MODEL.DATA.PICTURES), jQuery.proxy(this._onSaveSuccess, this), jQuery.proxy(this._onSaveFailed, this), h, this.getModel("device"));
		        }
		    },
		    onCancel: function () {
		        if (this.hasUserEnteredData()) {
		            this.showDataLossDialog(this._onCreateScreenClose.bind(this));
		        } else {
		            this._onCreateScreenClose();
		        }
		    },
		    onAddFileUploaderPicture: function (e) {
		        P.onChangeFileUploader(e, this);
		    },
		    onPressPicture: function (e) {
		        this.getOwnerComponent().pictureDialog.openDialog(this.getView(), e);
		    },
		    onChangeEstRiskType: function (e) {
		        var E = e.getSource();
		        var i = E.getItems();
		        var s = E.getValue();
		        var o = i.find(function (I) {
		            return I.getProperty("text") === s;
		        });
		        if (!o) {
		            this._setDefaultTypeForEstRisk();
		        }
		    },
		    onLocationValueHelp: function (e) {
		        if (!this._locationValueHelpDialog) {
		            this._locationValueHelpDialog = sap.ui.xmlfragment("ehs.inc.reportincidents1.view.fragments.LocationSelectionDialog", this);
		            this.getView().addDependent(this._locationValueHelpDialog);
		            var i = this._locationValueHelpDialog.getContent()[0];
		            if (i && !D.system.desktop) {
		                i.setSelectedKey("1");
		            }
		            var I = this.getModel(C.MODEL.APP_MODEL.NAME).getProperty(C.MODEL.APP_MODEL.PROPERTIES.IS_OFFLINE_ENABLED);
		            if (I) {
		                this._locationValueHelpDialog.open();
		                this._locationValueHelpDialog.close();
		            }
		        }
		        this._locationValueHelpDialog.open();
		        if (U.getAppSettings().maxShownDistance > 0 && G.getCurrentPositionValue(this) === undefined) {
		            if (!this.oCurrentPostionDialog) {
		                this.oCurrentPostionDialog = new c();
		            }
		            this.oCurrentPostionDialog.openDialog(this.getView());
		        }
		    },
		    onLocationHierarchyValueHelp: function (e) {
		        this.Util.openLocationValueHelpDialogSingleSelect(this.oView, undefined, undefined, true);
		    },
		    onPersonValueHelp: function (e) {
		        var s = this.getView().getModel("i18n").getResourceBundle().getText("personDialog");
		        var i = this.oView.getModel(C.MODEL.APP_MODEL.NAME).getProperty(C.MODEL.APP_MODEL.PROPERTIES.IS_IN_CLOUD);
		        this.Util.openPersonValueHelpDialogSingleSelect(this.oView, i, s, e.getSource());
		    },
		    onLocationCloseDialog: function (e) {
		        this._locationValueHelpDialog.close();
		    },
		    onUOMValueHelp: function (e) {
		        if (!this._uomValueHelpDialog) {
		            this._uomValueHelpDialog = sap.ui.xmlfragment("ehs.inc.reportincidents1.view.fragments.UOMValueHelpDialog", this);
		            this.getView().addDependent(this._uomValueHelpDialog);
		        }
		        this._uomValueHelpDialog.getBinding("items").filter([]);
		        var i = this.getModel(C.MODEL.APP_MODEL.NAME).getProperty(C.MODEL.APP_MODEL.PROPERTIES.IS_OFFLINE_ENABLED);
		        if (i) {
		            this._uomValueHelpDialog.getBinding("items").refresh();
		        }
		        this._uomValueHelpDialog.open();
		    },
		    onAddCordovaPicture: function () {
		        if (!this._cameraSettingsDialog) {
		            this._cameraSettingsDialog = sap.ui.xmlfragment("ehs.inc.reportincidents1.view.fragments.CameraSettings", this);
		            this.getView().addDependent(this._cameraSettingsDialog);
		        }
		        this._cameraSettingsDialog.open();
		    },
		    onCameraSettingsRBSelect: function (e) {
		        var r = e.getSource();
		        var s = e.getParameter("selectedIndex");
		        var A = this.getModel(C.MODEL.APP_MODEL.NAME);
		        A.setProperty("/data/cameraSettings." + r.getId(), s);
		    },
		    handleCameraConfirm: function (e) {
		        var A = this.getModel(C.MODEL.APP_MODEL.NAME);
		        var i = A.getProperty("/data/cameraSettings.rdSrcType");
		        i = i === undefined ? 1 : i;
		        navigator.camera.getPicture(jQuery.proxy(this._cameraSuccess, this), this._cameraError, {
		            quality: 70,
		            targetWidth: 1024,
		            targetHeight: 768,
		            destinationType: 0,
		            sourceType: i,
		            correctOrientation: true
		        });
		    },
		    onChangeDateTime: function (e) {
		        var o = e.getSource();
		        var g = this.getModel(C.MODEL.APP_MODEL.NAME).getProperty(C.MODEL.APP_MODEL.DATA.OWN_MESSAGES);
		        g.forEach(function (m) {
		            if (m.getTarget() === o.getId() + "/value") {
		                this.removeOwnMessage(m);
		            }
		        }, this);
		        this._checkDateTimeInFuture(o);
		    },
		    onSelectAssetRadioButton: function (e) {
		        var s = e.getParameter("selectedIndex");
		        if (s === 0) {
		            this.getModel(C.MODEL.APP_MODEL.NAME).setProperty(C.MODEL.APP_MODEL.DATA.IS_ASSET_INVOLVED, true);
		        } else if (s === 1) {
		            this.getModel(C.MODEL.APP_MODEL.NAME).setProperty(C.MODEL.APP_MODEL.DATA.IS_ASSET_INVOLVED, false);
		            var A = this.byId("assetInput");
		            this._resetInputField(A);
		        }
		    },
		    onSelectReleaseRadioButton: function (e) {
		        var s = e.getParameter("selectedIndex");
		        if (s === 0) {
		            this.getModel(C.MODEL.APP_MODEL.NAME).setProperty(C.MODEL.APP_MODEL.DATA.IS_RELEASE_INVOLVED, true);
		        } else if (s === 1) {
		            this.getModel(C.MODEL.APP_MODEL.NAME).setProperty(C.MODEL.APP_MODEL.DATA.IS_RELEASE_INVOLVED, false);
		            this.byId("releaseType").setSelectedKey("");
		            this.byId("releaseAmount").setValue("");
		            this.byId("releaseUOM").setValue("");
		            this._resetInputField(this.byId("releaseChemical"));
		        }
		    },
		    onSelectPersonRadioButton: function (e) {
		        var E = e.getParameter("id");
		        var s = e.getParameter("selectedIndex");
		        var i = E.includes("witnessRadioButton");
		        var r = i ? C.MODEL.APP_MODEL.DATA.IS_WITNESS_INVOLVED : C.MODEL.APP_MODEL.DATA.IS_PERSON_INVOLVED;
		        var p = i ? "witnessInputFilterGroup" : "personInputFilterGroup";
		        var A = i ? "witnessInputContainerGroup" : "personInputContainerGroup";
		        if (s === 0) {
		            this.getModel(C.MODEL.APP_MODEL.NAME).setProperty(r, true);
		        } else if (s === 1) {
		            this.getModel(C.MODEL.APP_MODEL.NAME).setProperty(r, false);
		        }
		        this._destroyAdditionalPersons(A);
		        var I = this._getControlsByGroupIdAndFieldType(p, "sap.m.Input")[0];
		        this._resetInputField(I);
		    },
		    onSelectGroupRadioButton: function (e) {
		        var s = e.getParameter("selectedIndex");
		        var m = this.byId("mcGroup");
		        if (s === 0) {
		            this.getModel(C.MODEL.APP_MODEL.NAME).setProperty(C.MODEL.APP_MODEL.DATA.IS_GROUPS_INVOLVED, true);
		            m.setValueState(sap.ui.core.ValueState.None);
		            m.setValueStateText("");
		            m.setSelectedKeys([]);
		            this._setDefaultTypeForEstRisk();
		        } else if (s === 1) {
		            this.getModel(C.MODEL.APP_MODEL.NAME).setProperty(C.MODEL.APP_MODEL.DATA.IS_GROUPS_INVOLVED, false);
		            var E = this.byId("estRiskType");
		            E.setSelectedItem(null);
		        }
		        this.removeOwnMessage(this.getOwnMessageByTargetId(m.getId()));
		    },
		    onAddInputForPerson: function (e) {
		        var g = e.getSource().getId().includes("addInputForWitness") ? "witnessInputFilterGroup" : "personInputFilterGroup";
		        var o = this._getControlsByGroupIdAndFieldType(g, "sap.m.Input")[0];
		        var s = o.getModel().getProperty(o.getBindingContext().getPath() + "/PersonInvolvedRole");
		        var n = o.clone();
		        var N = this.getModel().createEntry("Persons");
		        n.setBindingContext(N);
		        var h = n.getBindingContext().getModel();
		        var i = n.getBindingContext().getPath();
		        h.setProperty(i + "/PersonInvolvedId", "");
		        h.setProperty(i + "/PersonFullName", "");
		        h.setProperty(i + "/PersonInvolvedRole", s);
		        var j = new sap.m.Button({
		            icon: "sap-icon:sys-cancel",
		            type: "Reject",
		            tooltip: this.getResourceBundle().getText("removePersonTooltip"),
		            press: s === C.MODEL.ODATA.PERSON_ROLE_WITNESS ? this._onDeleteWitnessInput.bind(this) : this._onDeletePersonInput.bind(this)
		        });
		        var k = new sap.m.FlexBox({
		            items: [
		                n,
		                j
		            ],
		            fieldGroupIds: s === C.MODEL.ODATA.PERSON_ROLE_WITNESS ? "witnessInputContainerGroup" : "personInputContainerGroup"
		        });
		        var A = o.getParent().getParent();
		        var I = A.getItems().length - 1;
		        A.insertItem(k, I);
		    },
		    _onObjectMatched: function (e) {
		        if (this._isCreateEvent(e)) {
		            var i = e.getParameter("arguments").IncidentCategory;
		            this._initializeUI(i);
		            this.clearData();
		            var I = a.createIncidentObject(this.getModel(), i);
		            this.getView().setBindingContext(I.incident);
		            this.getView().byId("personInput").setBindingContext(I.person);
		            this.getView().byId("witnessInput").setBindingContext(I.witness);
		            this.getView().byId("assetInput").setBindingContext(I.asset);
		            this.getView().byId("mcGroup").setBindingContext(I.group);
		            this.getView().byId("releaseContainer").setBindingContext(I.release);
		            var g = [];
		            g.push(I.incident, I.person, I.witness, I.asset, I.release);
		            this.getModel(C.MODEL.APP_MODEL.NAME).setProperty(C.MODEL.APP_MODEL.DATA.CREATED_ENTRY, g);
		            this.getModel(C.MODEL.APP_MODEL.NAME).setProperty(C.MODEL.APP_MODEL.DATA.DEFAULT_DATE_TIME, I.incident.getObject().IncidentUTCDateTime);
		        }
		    },
		    _isCreateEvent: function (e) {
		        if (e.getParameter("name") && e.getParameter("name") === "create") {
		            return true;
		        } else {
		            return false;
		        }
		    },
		    _initializeUI: function (i) {
		        var t;
		        switch (i) {
		        case C.MODEL.ODATA.INC_CAT_INC:
		            t = this.getResourceBundle().getText("newIncident");
		            break;
		        case C.MODEL.ODATA.INC_CAT_NEAR_MISS:
		            t = this.getResourceBundle().getText("newNearMiss");
		            break;
		        case C.MODEL.ODATA.INC_CAT_SAFE_OBS:
		            t = this.getResourceBundle().getText("newSafetyObservation");
		            break;
		        default:
		        }
		        this.getModel(C.MODEL.CREATE_MODEL.NAME).setProperty(C.MODEL.CREATE_MODEL.PROPERTIES.INCIDENT_CATEGORY, i);
		        this.getModel(C.MODEL.CREATE_MODEL.NAME).setProperty(C.MODEL.CREATE_MODEL.PROPERTIES.VIEW_TITLE, t);
		        this.getView().byId("personRadioButton").setSelectedIndex(1);
		        this.getView().byId("witnessRadioButton").setSelectedIndex(1);
		        this.getView().byId("assetRadioButton").setSelectedIndex(1);
		        this.getView().byId("releaseRadioButton").setSelectedIndex(1);
		        this.getView().byId("groupsRadioButton").setSelectedIndex(1);
		        this.getView().byId("GeoLocationRadioButton").setSelectedIndex(1);
		        var e = [new sap.ui.model.Filter("IncidentCategory", sap.ui.model.FilterOperator.EQ, i)];
		        this.byId("mcGroup").getBinding("items").filter(e);
		    },
		    _cameraSuccess: function (s) {
		        P.uploadSuccess("data:image/jpeg;base64," + s, this, "Picture.jpeg", "image/jpeg");
		    },
		    _cameraError: function (m) {
		        sap.m.MessageToast.show(m);
		    },
		    _onCreateScreenClose: function (e) {
		        if (e !== M.Action.NO) {
		            if (D.system.phone) {
		                this.onNavBack();
		                this.clearData();
		            } else {
		                this._navToFirstIncident();
		            }
		        }
		    },
		    _handleUOMValueHelpClose: function (e) {
		        var s = e.getParameter("selectedItem");
		        if (s) {
		            var A = this.getModel(C.MODEL.APP_MODEL.NAME);
		            var g = this.getModel().getProperty(s.getBindingContextPath());
		            A.setProperty(C.MODEL.APP_MODEL.DATA.UOM_DESCRIPTION, g.UOMDescription);
		            A.setProperty(C.MODEL.APP_MODEL.DATA.UOM_CODE, g.UOMCode);
		        }
		        e.getSource().getBinding("items").filter([]);
		    },
		    _handleUOMSearch: function (e) {
		        var v = e.getParameter("value");
		        var o = new F("UOMDescription", sap.ui.model.FilterOperator.Contains, v);
		        e.getSource().getBinding("items").filter([o]);
		    },
		    _getMandatoryFields: function () {
		        var m = [];
		        var e = this.byId("newIncidentForm").getContent();
		        e.forEach(function (o) {
		            if (o instanceof sap.m.Label && o.getRequired()) {
		                var g = this.byId(o.getLabelFor());
		                if (g instanceof sap.m.VBox) {
		                    var s = g.getFieldGroupIds()[0];
		                    m = m.concat(this._getControlsByGroupIdAndFieldType(s, "sap.m.Input"));
		                } else {
		                    m.push(g);
		                }
		            }
		        }, this);
		        if (this.byId("releaseRadioButton").getSelectedIndex() === 0) {
		            m.push(this.byId("releaseChemical"));
		            if (this.byId("releaseAmount").getValue().length > 0) {
		                m.push(this.byId("releaseUOM"));
		            }
		        }
		        return m;
		    },
		    _checkEmptyMandatoryFields: function () {
		        var e = false;
		        var m = this._getMandatoryFields();
		        m.forEach(function (i) {
		            if (i instanceof sap.m.MultiComboBox) {
		                if (i.getSelectedItems().length === 0) {
		                    e = true;
		                    i.setValueState(sap.ui.core.ValueState.Error);
		                    i.setValueStateText(i.data(C.GENERAL.MANDATORY_ERROR.MESSAGE));
		                    this.addOwnMessage(i.data(C.GENERAL.MANDATORY_ERROR.MESSAGE), sap.ui.core.MessageType.Error, i.getId() + "/value", this.getOwnerComponent().oMessageProcessor, i.data(C.GENERAL.MANDATORY_ERROR.DESCRIPTION));
		                } else {
		                    i.setValueState(sap.ui.core.ValueState.None);
		                    i.setValueStateText("");
		                }
		            } else if (!i.getValue() || i.getValue().trim() === "") {
		                e = true;
		                this.addOwnMessage(i.data(C.GENERAL.MANDATORY_ERROR.MESSAGE), sap.ui.core.MessageType.Error, i.getId() + "/value", this.getOwnerComponent().oMessageProcessor, i.data(C.GENERAL.MANDATORY_ERROR.DESCRIPTION));
		            }
		        }, this);
		        return e;
		    },
		    _getInputFields: function () {
		        var i = [];
		        var e = this.byId("newIncidentForm").getContent();
		        e.forEach(function (o) {
		            if (o instanceof sap.m.InputBase) {
		                i.push(o);
		            }
		        }, this);
		        if (this.byId("releaseRadioButton").getSelectedIndex() === 0) {
		            i.push(this.byId("releaseChemical"));
		            i.push(this.byId("releaseAmount"));
		        }
		        return i;
		    },
		    _resetInputField: function (i) {
		        i.setValue("");
		        var o = this.getOwnMessageByTargetId(i.getId());
		        this.removeOwnMessage(o);
		    },
		    _checkDateTimeInFuture: function (o) {
		        var i = false;
		        if (o.getDateValue() && Date.parse(o.getDateValue()) > Date.now()) {
		            i = true;
		            this.addOwnMessage(this.getResourceBundle().getText("futureDateTime"), sap.ui.core.MessageType.Error, o.getId() + "/value", this.getOwnerComponent().oMessageProcessor, this.getResourceBundle().getText("futureDateTimeLong"));
		        }
		        return i;
		    },
		    _checkInvolvedPersonsForDuplicates: function () {
		        var h = false;
		        var i = this._getControlsByGroupIdAndFieldType("personInputFilterGroup", "sap.m.Input");
		        i = i.concat(this._getControlsByGroupIdAndFieldType("witnessInputFilterGroup", "sap.m.Input"));
		        var I = [];
		        var t = this;
		        i.forEach(function (o) {
		            var p = o.getBindingContext().getObject().PersonInvolvedId || "";
		            var s = o.getBindingContext().getObject().PersonFullName;
		            var e = o.getBindingContext().getObject().PersonInvolvedRole;
		            var g = I.find(function (j) {
		                return j.PersonInvolvedId === p && j.PersonFullName === s && j.PersonInvolvedRole === e;
		            });
		            if (g) {
		                t.addOwnMessage(t.getResourceBundle().getText("duplicatedPerson"), sap.ui.core.MessageType.Error, o.getId() + "/value", t.getOwnerComponent().oMessageProcessor, t.getResourceBundle().getText("duplicatedPersonLong"));
		                h = true;
		            } else if (p) {
		                I.push({
		                    PersonInvolvedId: p,
		                    PersonFullName: s,
		                    PersonInvolvedRole: e
		                });
		            }
		        });
		        return h;
		    },
		    _checkFieldWithError: function () {
		        var I = this._getInputFields();
		        var m = this.getOwnerComponent().oMessageManager.getMessageModel().getData();
		        for (var i = 0; i < m.length; i++) {
		            if (m[i].getType() === sap.ui.core.MessageType.Error) {
		                for (var j = 0; j < I.length; j++) {
		                    if (m[i].getTarget() === I[j].getId() + "/value") {
		                        return true;
		                    }
		                }
		            }
		        }
		        return false;
		    },
		    _onSaveSuccess: function (o) {
		        var i = this.getModel(C.MODEL.APP_MODEL.NAME).getProperty(C.MODEL.APP_MODEL.PROPERTIES.IS_OFFLINE_ENABLED);
		        var m = {
		            closeOnBrowserNavigation: false,
		            autoClose: false
		        };
		        if (i && new O().isDeviceOnline()) {
		            new O().flush(jQuery.proxy(this.callbackFlushSuccess, this), jQuery.proxy(this.callbackTechnicalError, this), null);
		            this._navToFirstIncident();
		        } else if (i && !new O().isDeviceOnline()) {
		            M.warning(this._getMessageTextForSuccessfulCreation(o.IncidentCategory, false), {
		                actions: [M.Action.OK],
		                onClose: jQuery.proxy(this._navToFirstIncident, this)
		            });
		            this.setAppBusy(false);
		        } else {
		            b.show(this._getMessageTextForSuccessfulCreation(o.IncidentCategory, true), m);
		            this.setAppBusy(false);
		            this._navToFirstIncident();
		        }
		    },
		    _navToFirstIncident: function () {
		        var l = this.getOwnerComponent().byId("master").byId("list");
		        var o = l.getItems()[0];
		        if (o) {
		            var i = o.getBindingContext().getPath();
		            var I = o.getBindingContext().getObject();
		            this._navAfterCreation(i, I.IncidentCategory);
		        } else {
		            this.onNavBack();
		        }
		        this.clearData();
		    },
		    _onSaveFailed: function (e) {
		        this.setAppBusy(false);
		    },
		    _onSuggestionItemSelected: function (e) {
		        var s = e.getParameter("selectedRow");
		        var m = this.oView.getBindingContext().getModel();
		        var S = s.getBindingContextPath();
		        var n = m.getProperty(S).EHSLocationUUID;
		        var p = this.oView.getBindingContext().getPath();
		        m.setProperty(p + "/EHSLocationUUID", n);
		    },
		    _onDeletePersonInput: function (e) {
		        var i = e.getSource().getParent().getParent();
		        if (i.getItems().length > 2) {
		            e.getSource().getParent().destroy();
		        } else {
		            this.getModel(C.MODEL.APP_MODEL.NAME).setProperty(C.MODEL.APP_MODEL.DATA.IS_PERSON_INVOLVED, false);
		            this.getView().byId("personRadioButton").setSelectedIndex(1);
		            e.getSource().getParent().getItems()[0].setValue("");
		        }
		    },
		    _onDeleteWitnessInput: function (e) {
		        var w = e.getSource().getParent().getParent();
		        if (w.getItems().length > 2) {
		            e.getSource().getParent().destroy();
		        } else {
		            this.getModel(C.MODEL.APP_MODEL.NAME).setProperty(C.MODEL.APP_MODEL.DATA.IS_WITNESS_INVOLVED, false);
		            this.getView().byId("witnessRadioButton").setSelectedIndex(1);
		            e.getSource().getParent().getItems()[0].setValue("");
		        }
		    },
		    _checkLocationValidity: function () {
		        var l = this.oView.byId("idIncidentLocation");
		        var s = l.getValue();
		        var m = this.getModel();
		        var p = this.oView.getBindingContext().getPath();
		        if (s === "") {
		            m.setProperty(p + "/EHSLocationUUID");
		            return true;
		        }
		        var A = this.oView.getBindingContext().getObject().EHSLocationUUID;
		        if (!A) {
		            this.addOwnMessage(this.getResourceBundle().getText("invalidLocationName"), sap.ui.core.MessageType.Error, l.getId() + "/value", this.getOwnerComponent().oMessageProcessor);
		            return false;
		        }
		        if (A === C.GENERAL.INITIAL_GUID) {
		            this.addOwnMessage(this.getResourceBundle().getText("rootLocationIsSelected"), sap.ui.core.MessageType.Error, l.getId() + "/value", this.getOwnerComponent().oMessageProcessor);
		            return false;
		        }
		        var e = "/C_EHSLocationValueHelp(guid'" + A + "')";
		        var S = m.getProperty(e);
		        if (!S) {
		            e = "/C_CurEHSLocationInclRootHier(guid'" + A + "')";
		            S = m.getProperty(e);
		        }
		        if (S && S.EHSLocationName !== s) {
		            m.setProperty(p + "/EHSLocationUUID");
		            this.addOwnMessage(this.getResourceBundle().getText("invalidLocationName"), sap.ui.core.MessageType.Error, l.getId() + "/value", this.getOwnerComponent().oMessageProcessor);
		            return false;
		        } else {
		            return true;
		        }
		    },
		    _validatePersonsIdName: function () {
		        var m = this.getModel();
		        var i = this._getControlsByGroupIdAndFieldType("personInputFilterGroup", "sap.m.Input");
		        i = i.concat(this._getControlsByGroupIdAndFieldType("witnessInputFilterGroup", "sap.m.Input"));
		        i.forEach(function (I) {
		            var A = I.getBindingContext().getObject().PersonInvolvedId;
		            var s = I.getBindingContext().getObject().PersonFullName;
		            if (!A) {
		                return;
		            }
		            A = A.replace(/^0+/, "");
		            var p = "/C_EHSPersonValueHelp('" + A + "')";
		            var S = m.getProperty(p);
		            if (S.BusinessPartnerName.substring(0, 80) !== s) {
		                var o = I.getBindingContext().getModel();
		                var e = I.getBindingContext().getPath();
		                o.setProperty(e + "/PersonInvolvedId");
		            }
		        });
		    },
		    _getEstRiskType: function () {
		        var s = this.byId("estRiskType").getSelectedItem();
		        return s && s.getKey() || "";
		    },
		    _getControlsByGroupIdAndFieldType: function (g, t) {
		        var v = this.getView();
		        var e = v.getControlsByFieldGroupId(g);
		        return e.filter(function (o) {
		            return o.isA(t) && !o.getId().includes("popup");
		        });
		    },
		    _destroyAdditionalPersons: function (g) {
		        var A = this._getControlsByGroupIdAndFieldType(g, "sap.m.FlexBox");
		        A.forEach(function (p, i) {
		            if (i !== 0) {
		                p.destroy();
		            }
		        });
		    },
		    _setDefaultTypeForEstRisk: function () {
		        var e = this.byId("estRiskType");
		        var E = e.getItems();
		        var o = E.find(function (t) {
		            return t.getBindingContext().getProperty("IsDefault") === true;
		        });
		        if (o) {
		            e.setSelectedKey(o.getBindingContext().getProperty("Code"));
		        } else {
		            e.setSelectedKey("");
		        }
		    },
		    _mapGroupsToCorrectGroupObjects: function (g) {
		        var t = this;
		        return g.map(function (o) {
		            var n = t.getModel().createEntry("Groups").getObject();
		            n.IncidentCategory = o.getBindingContext().getProperty("IncidentCategory");
		            n.IncidentGroupCode = o.getBindingContext().getProperty("IncidentGroupCode");
		            n.IncidentGroupCodeText = "";
		            return n;
		        });
		    },
		    _setIncidentGeoLocation: function (i) {
		        var A = this.getModel(C.MODEL.APP_MODEL.NAME);
		        var g = A.getProperty(C.MODEL.APP_MODEL.PROPERTIES.GEO_LOCATION);
		        var s = this.getView().byId("GeoLocationRadioButton").getSelectedIndex();
		        if (g && s === 0) {
		            i.IncidentLongitudeMeasure = "" + g.longitude;
		            i.IncidentLatitudeMeasure = "" + g.latitude;
		        }
		    },
		    onPersonSuggestionItemSelected: function (e) {
		        var s = e.getParameter("selectedRow");
		        var m = this.oView.getBindingContext().getModel();
		        var S = s.getBindingContextPath();
		        var g = m.getProperty(S).BusinessPartner;
		        var h = m.getProperty(S).BusinessPartnerName;
		        var p = e.getSource().getBindingContext().getModel();
		        var i = e.getSource().getBindingContext().getPath();
		        if (h.length > 80) {
		            h = h.substring(0, 80);
		        }
		        p.setProperty(i + "/PersonInvolvedId", g);
		        p.setProperty(i + "/PersonFullName", h);
		        e.getSource().setValue(h);
		    },
		    handlePersonSuggest: function (e) {
		        var v = e.getParameter("suggestValue");
		        var i = this.oView.getModel(C.MODEL.APP_MODEL.NAME).getProperty(C.MODEL.APP_MODEL.PROPERTIES.IS_IN_CLOUD);
		        var g = [];
		        if (i) {
		            g.push(new F("PersonWorkAgreement", sap.ui.model.FilterOperator.NE, "00000000"));
		        }
		        if (v) {
		            var o = { search: v };
		            var l = e.getSource();
		            l.bindAggregation("suggestionRows", {
		                path: "/C_EHSPersonValueHelp",
		                template: new d({
		                    cells: [
		                        new L({
		                            text: {
		                                parts: [
		                                    { path: "BusinessPartnerName" },
		                                    { path: "BusinessPartner" }
		                                ],
		                                formatter: f.formatBusinessUserFullNameID
		                            }
		                        }),
		                        new L({
		                            text: {
		                                parts: [{ path: "PersonWorkAgreement" }],
		                                formatter: f.formatPersonID
		                            }
		                        })
		                    ]
		                }),
		                filters: g,
		                parameters: {
		                    custom: o,
		                    select: "BusinessPartner,BusinessPartnerName,PersonWorkAgreement"
		                },
		                templateShareable: true
		            });
		        }
		    },
		    handleLocationSuggest: function (e) {
		        var v = e.getParameter("suggestValue");
		        var g = [new F("EHSLocationStatus", sap.ui.model.FilterOperator.NE, "04")];
		        if (v) {
		            var o = { search: v };
		            var l = this.oView.byId("idIncidentLocation");
		            l.bindAggregation("suggestionRows", {
		                path: "/C_EHSLocationValueHelp",
		                template: new d({
		                    cells: [
		                        new L({ text: "{EHSLocationName}" }),
		                        new L({ text: "{EHSLocationID}" }),
		                        new L({ text: "{EHSLocationType_Text}" })
		                    ]
		                }),
		                filters: g,
		                parameters: {
		                    custom: o,
		                    select: "EHSLocationUUID,EHSLocationName,EHSLocationID,EHSLocationType_Text"
		                },
		                templateShareable: true
		            });
		        }
		    },
		    onLocationTableRowSelected: function (e) {
		        var o = e.getParameter("rowContext");
		        if (o.oModel) {
		            var g = o.oModel.getProperty(o.sPath);
		            var l = g.EHSLocationUUID;
		            var s = g.EHSLocationName;
		            var m = this.getView().getBindingContext().getModel();
		            var p = this.getView().getBindingContext().getPath();
		            m.setProperty(p + "/EHSLocationUUID", l);
		            this.getView().byId("idIncidentLocation").setValue(s);
		            this._locationValueHelpDialog.close();
		        }
		    },
		    filterByLocationName: function (e) {
		        var q = e.getParameter("newValue");
		        var t = e.getSource().getParent();
		        if (q) {
		            t.getBinding("rows").filter([new F("EHSLocationName", sap.ui.model.FilterOperator.Contains, q)]);
		        } else {
		            t.getBinding("rows").filter([]);
		        }
		    },
		    setPersonInputFields: function (s, e, p) {
		        var o = p.getBindingContext().getModel();
		        var g = p.getBindingContext().getPath();
		        if (s.length > 80) {
		            s = s.substring(0, 80);
		        }
		        o.setProperty(g + "/PersonInvolvedId", e);
		        o.setProperty(g + "/PersonFullName", s);
		    },
		    updateLocationInputValue: function (n, N) {
		        this.getView().byId("idIncidentLocation").setValue(N);
		        var m = this.oView.getBindingContext().getModel();
		        var p = this.oView.getBindingContext().getPath();
		        m.setProperty(p + "/EHSLocationUUID", n);
		    },
		    handleTypeMissmatch: function (e) {
		        var g = e.getSource().getFileType();
		        jQuery.each(g, function (k, v) {
		            g[k] = "*." + v;
		        });
		        var s = g.join(", ");
		        b.show(this.getResourceBundle().getText("msgNotSupportedType", [
		            e.getParameter("fileType"),
		            s
		        ]));
		    }
	});
});