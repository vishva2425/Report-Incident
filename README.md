# Report Incident – Extensibility Project (App ID: F3163)

## Overview

This Project is a **Frontend Extensibility Application** for the **SAP Fiori Report Incident app (F3163)**.
The purpose of this app is to **Extend the Standard SAP Incident Reporting UI** by adding custom fields, sections, validations, and logic **Without Modifying the Standard SAP Code**.

This Project is developed **Only for Frontend** using **SAPUI5** in **SAP Business Application Studio (BAS)**.

---

## Project Type

* **SAP Fiori Elements / SAPUI5 Extensibility**
* **Frontend Only**
* **Extension Project (UI Adaptation / Controller Extension / View Extension)**

---

## App Details

* **Standard App Name:** Report Incident
* **App ID:** F3163
* **Technology:** SAPUI5
* **Development Tool:** SAP Business Application Studio (BAS)
* **Deployment:** Frontend Extension (No backend changes)

---

## Purpose of the Extension

This Extensibility Project is used to:

* Add **Custom UI Sections** to the Report Incident screen
* Add **Custom Fields** (Input, ComboBox, DatePicker, etc.)
* Control **Visibility and Enablement** of fields
* Add **Custom Validation Logic**
* Handle **Dropdown Data Binding**
* Implement **Business Rules using Controller Logic**

---

## Scope 

This Project Includes:

* XML View Extensions
* Controller Extensions
* Fragment usage for Reusable UI
* JSON Models for Temporary UI data
* Formatter Functions for UI Display Logic

This Project **Now does NOT include**:

* Backend (ABAP / CAP) changes
* OData service changes
* Database changes

---

## Folder Structure 

```
webapp/
│── controller/
│   └── CreateIncidentCustom.controller.js
│
│── i18n/
│   └── i18n.properties
│
│── view/
│   └── CreateIncidentCustom.view.xml
│
│── manifest.json
```

---

## Key Features Implemented

* Custom Incident Classification Sections (GOR, HSR, DGOR, SOR.)
* Dynamic Dropdown Binding
* Conditional Field Visibility
* Validation Before Submit
* Reusable UI using Fragments
* Clean Separation of Logic and UI

---

## Development Environment

* SAP Business Application Studio (BAS)
* SAP Fiori Tools Extension
* Node.js (provided by BAS)
* SAPUI5 Framework

---

## How to Run the Application

1. Open **SAP Business Application Studio**
2. Open this project in the workspace
3. Run the application using **npm start**
4. Preview the app in browser
5. Launch via **Fiori Launchpad** (If Configured Deploy)

---

## Extensibility Approach

* Uses **SAP-Supported Extensibility** Methods
* No Modification of Standard SAP Code
* Safe for Upgrades
* Follows SAP Best Practices

---

## New Incident
<img width="1586" height="808" alt="image" src="https://github.com/user-attachments/assets/f68ce198-203c-4f21-96ca-e232b829147f" />

---

## GOR
<img width="1177" height="802" alt="image" src="https://github.com/user-attachments/assets/d6cb86c5-85ea-4acb-8235-0ded69e329db" />

---

## HSR
<img width="1182" height="801" alt="image" src="https://github.com/user-attachments/assets/1a6e646b-da28-4fc1-9a5a-b0ad219feadb" />

---

## DGOR
<img width="1177" height="797" alt="image" src="https://github.com/user-attachments/assets/dc8d8e52-2aa3-4aee-9eae-153ab12a499c" />

---

## SOR
<img width="1176" height="802" alt="image" src="https://github.com/user-attachments/assets/bc240365-a561-4e14-9f0c-be87a6dc72a2" />

---
