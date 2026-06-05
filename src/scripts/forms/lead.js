/**
 * Web resource: new_/scripts/forms/lead.js
 * Lógica de formulario para la entidad Lead (Cliente potencial).
 *
 * Registra las funciones en los eventos del formulario:
 *   - OnLoad                       -> Cap.Lead.onLoad
 *   - OnSave                       -> Cap.Lead.onSave
 *   - OnChange (emailaddress1)     -> Cap.Lead.onEmailChange
 *   - OnChange (companyname)       -> Cap.Lead.onCompanyChange
 *
 * Activa "Pasar contexto de ejecución como primer parámetro" en cada evento.
 * Carga primero la librería new_/scripts/common/utils.js.
 */
"use strict";

var Cap = window.Cap || {};
Cap.Lead = (function () {

    var NOTIF_EMAIL = "lead_email_invalid";
    var NOTIF_CONTACT = "lead_contact_required";

    // Regex simple para validación de email (no exhaustivo, suficiente para UI).
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    /**
     * @param {Xrm.Events.EventContext} executionContext
     */
    function onLoad(executionContext) {
        var formContext = executionContext.getFormContext();

        // En creación, marca el origen por defecto si está vacío.
        if (formContext.ui.getFormType() === Cap.Common.FormType.Create) {
            var source = formContext.getAttribute("leadsourcecode");
            if (source && Cap.Common.isEmpty(source.getValue())) {
                // source.setValue(1); // 1 = ejemplo, ajusta a tu optionset.
            }
        }

        // Revalida el email al cargar (por si llega con datos previos).
        validateEmail(formContext);
    }

    /**
     * @param {Xrm.Events.SaveEventContext} executionContext
     */
    function onSave(executionContext) {
        var formContext = executionContext.getFormContext();

        // Debe existir al menos un medio de contacto: email o teléfono.
        var email = getValue(formContext, "emailaddress1");
        var phone = getValue(formContext, "telephone1");

        if (Cap.Common.isEmpty(email) && Cap.Common.isEmpty(phone)) {
            Cap.Common.notify(formContext,
                "Indica al menos un email o un teléfono de contacto.",
                "ERROR", NOTIF_CONTACT);
            executionContext.getEventArgs().preventDefault(); // Bloquea el guardado.
            return;
        }
        Cap.Common.clearNotify(formContext, NOTIF_CONTACT);

        // No permitir guardar con email inválido.
        if (!validateEmail(formContext)) {
            executionContext.getEventArgs().preventDefault();
        }
    }

    /**
     * @param {Xrm.Events.EventContext} executionContext
     */
    function onEmailChange(executionContext) {
        validateEmail(executionContext.getFormContext());
    }

    /**
     * @param {Xrm.Events.EventContext} executionContext
     */
    function onCompanyChange(executionContext) {
        var formContext = executionContext.getFormContext();
        var company = getValue(formContext, "companyname");

        // Sugerencia de asunto a partir de la empresa, si el asunto está vacío.
        var subject = formContext.getAttribute("subject");
        if (subject && Cap.Common.isEmpty(subject.getValue()) && !Cap.Common.isEmpty(company)) {
            subject.setValue("Oportunidad - " + company);
        }
    }

    // ---- Helpers internos -------------------------------------------------

    /**
     * Valida el campo email y muestra/limpia la notificación.
     * @param {Xrm.FormContext} formContext
     * @returns {boolean} true si es válido o está vacío.
     */
    function validateEmail(formContext) {
        var attr = formContext.getAttribute("emailaddress1");
        if (!attr) { return true; }

        var value = attr.getValue();
        if (Cap.Common.isEmpty(value) || EMAIL_RE.test(value)) {
            Cap.Common.clearNotify(formContext, NOTIF_EMAIL);
            attr.controls.forEach(function (c) { c.clearNotification(NOTIF_EMAIL); });
            return true;
        }

        Cap.Common.notify(formContext, "El email no tiene un formato válido.", "WARNING", NOTIF_EMAIL);
        attr.controls.forEach(function (c) {
            c.setNotification("Formato de email no válido.", NOTIF_EMAIL);
        });
        return false;
    }

    /**
     * Obtiene el valor de un atributo de forma segura.
     * @param {Xrm.FormContext} formContext
     * @param {string} name
     * @returns {*}
     */
    function getValue(formContext, name) {
        var attr = formContext.getAttribute(name);
        return attr ? attr.getValue() : null;
    }

    return {
        onLoad: onLoad,
        onSave: onSave,
        onEmailChange: onEmailChange,
        onCompanyChange: onCompanyChange
    };
})();
