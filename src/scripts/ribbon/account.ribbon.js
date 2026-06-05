/**
 * Web resource: new_/scripts/ribbon/account.ribbon.js
 * Comandos de cinta (ribbon / command bar) para la entidad Account.
 *
 * Enlaza estas funciones desde Ribbon Workbench (XrmToolBox):
 *   - Command Action -> Cap.AccountRibbon.openPortal
 *   - Enable Rule    -> Cap.AccountRibbon.canOpenPortal
 *
 * Parámetro recomendado en el botón: PrimaryControl (CRM Parameter).
 */
"use strict";

var Cap = window.Cap || {};
Cap.AccountRibbon = (function () {

    /**
     * @param {Xrm.FormContext} primaryControl
     */
    function openPortal(primaryControl) {
        var id = Cap.Common.getRecordId(primaryControl);
        Xrm.Navigation.openUrl("https://portal.example.com/account/" + id);
    }

    /**
     * Enable rule: solo habilita el botón si el registro ya está guardado.
     * @param {Xrm.FormContext} primaryControl
     * @returns {boolean}
     */
    function canOpenPortal(primaryControl) {
        return primaryControl.ui.getFormType() === Cap.Common.FormType.Update;
    }

    return {
        openPortal: openPortal,
        canOpenPortal: canOpenPortal
    };
})();
