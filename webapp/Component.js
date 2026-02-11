jQuery.sap.declare("customer.report.incident.Component");

// use the load function for getting the optimized preload file if present
sap.ui.component.load({
	name: "ehs.inc.reportincidents1",
	// Use the below URL to run the extended application when SAP-delivered application is deployed on SAPUI5 ABAP Repository
	url: "/sap/bc/ui5_ui5/sap/REPINCIDENTS1"

	// we use a URL relative to our own component
	// extension application is deployed with customer namespace
});

ehs.inc.reportincidents1.Component.extend("customer.report.incident.Component", {
	metadata: {
		manifest: "json"
	}	
});
