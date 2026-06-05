/**
 * Web resource: new_/scripts/common/utils.js
 * Utilidades reutilizables compartidas por los demás scripts.
 *
 * Cárgalo en el formulario ANTES de los scripts que lo usen.
 */
"use strict";

var Cap = window.Cap || {};
Cap.Common = (function () {

    /** Tipos de formulario de Dynamics 365. */
    var FormType = {
        Undefined: 0,
        Create: 1,
        Update: 2,
        ReadOnly: 3,
        Disabled: 4,
        BulkEdit: 6
    };

    /**
     * Muestra una notificación a nivel de formulario.
     * @param {Xrm.FormContext} formContext
     * @param {string} message
     * @param {"ERROR"|"WARNING"|"INFO"} [level="INFO"]
     * @param {string} [uniqueId]
     */
    function notify(formContext, message, level, uniqueId) {
        formContext.ui.setFormNotification(message, level || "INFO", uniqueId || message);
    }

    /**
     * Limpia una notificación previamente mostrada.
     * @param {Xrm.FormContext} formContext
     * @param {string} uniqueId
     */
    function clearNotify(formContext, uniqueId) {
        formContext.ui.clearFormNotification(uniqueId);
    }

    /**
     * Devuelve true si el valor está vacío (null, undefined o cadena en blanco).
     * @param {*} value
     * @returns {boolean}
     */
    function isEmpty(value) {
        return value === null || value === undefined ||
            (typeof value === "string" && value.trim() === "");
    }

    /**
     * Obtiene el id de registro actual sin llaves ni mayúsculas.
     * @param {Xrm.FormContext} formContext
     * @returns {string}
     */
    function getRecordId(formContext) {
        return (formContext.data.entity.getId() || "")
            .replace(/[{}]/g, "")
            .toLowerCase();
    }

    return {
        FormType: FormType,
        notify: notify,
        clearNotify: clearNotify,
        isEmpty: isEmpty,
        getRecordId: getRecordId
    };
})();
