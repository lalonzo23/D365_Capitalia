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

    /**
     * Muestra u oculta una pestaña del formulario.
     * @param {Xrm.FormContext} formContext
     * @param {string} tabName - Nombre lógico de la pestaña.
     * @param {boolean} visible
     */
    function setTabVisible(formContext, tabName, visible) {
        var tab = formContext.ui.tabs.get(tabName);
        if (tab) tab.setVisible(visible);
    }

    /**
     * Muestra una pestaña del formulario.
     * @param {Xrm.FormContext} formContext
     * @param {string} tabName
     */
    function showTab(formContext, tabName) {
        setTabVisible(formContext, tabName, true);
    }

    /**
     * Oculta una pestaña del formulario.
     * @param {Xrm.FormContext} formContext
     * @param {string} tabName
     */
    function hideTab(formContext, tabName) {
        setTabVisible(formContext, tabName, false);
    }

    /**
     * Muestra u oculta una sección dentro de una pestaña.
     * @param {Xrm.FormContext} formContext
     * @param {string} tabName - Nombre lógico de la pestaña que contiene la sección.
     * @param {string} sectionName - Nombre lógico de la sección.
     * @param {boolean} visible
     */
    function setSectionVisible(formContext, tabName, sectionName, visible) {
        var tab = formContext.ui.tabs.get(tabName);
        if (!tab) return;
        var section = tab.sections.get(sectionName);
        if (section) section.setVisible(visible);
    }

    /**
     * Muestra una sección dentro de una pestaña.
     * @param {Xrm.FormContext} formContext
     * @param {string} tabName
     * @param {string} sectionName
     */
    function showSection(formContext, tabName, sectionName) {
        setSectionVisible(formContext, tabName, sectionName, true);
    }

    /**
     * Oculta una sección dentro de una pestaña.
     * @param {Xrm.FormContext} formContext
     * @param {string} tabName
     * @param {string} sectionName
     */
    function hideSection(formContext, tabName, sectionName) {
        setSectionVisible(formContext, tabName, sectionName, false);
    }

    return {
        FormType: FormType,
        notify: notify,
        clearNotify: clearNotify,
        isEmpty: isEmpty,
        getRecordId: getRecordId,
        setTabVisible: setTabVisible,
        showTab: showTab,
        hideTab: hideTab,
        setSectionVisible: setSectionVisible,
        showSection: showSection,
        hideSection: hideSection
    };
})();
