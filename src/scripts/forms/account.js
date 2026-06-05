/**
 * Web resource: new_/scripts/forms/account.js
 * Lógica de formulario para la entidad Account (Cuenta).
 *
 * Registra las funciones en los eventos del formulario:
 *   - OnLoad  -> Cap.Account.onLoad
 *   - OnSave  -> Cap.Account.onSave
 *   - OnChange (campo telephone1) -> Cap.Account.onPhoneChange
 *
 * Activa "Pasar contexto de ejecución como primer parámetro" en el editor de eventos.
 */
"use strict";

var Cap = window.Cap || {};
Cap.Account = (function () {

    /**
     * @param {Xrm.Events.EventContext} executionContext
     */
    function onLoad(executionContext) {
        var formContext = executionContext.getFormContext();

        // Ejemplo: ocultar un campo si la cuenta es nueva.
        if (formContext.ui.getFormType() === Cap.Common.FormType.Create) {
            // ...
        }
    }

    /**
     * @param {Xrm.Events.SaveEventContext} executionContext
     */
    function onSave(executionContext) {
        var formContext = executionContext.getFormContext();

        // Ejemplo de validación: bloquear el guardado si falta el teléfono.
        var phone = formContext.getAttribute("telephone1");
        if (phone && !phone.getValue()) {
            // executionContext.getEventArgs().preventDefault();
            // Cap.Common.notify(formContext, "El teléfono es obligatorio.", "ERROR", "phone_required");
        }
    }

    /**
     * @param {Xrm.Events.EventContext} executionContext
     */
    function onPhoneChange(executionContext) {
        var formContext = executionContext.getFormContext();
        var phone = formContext.getAttribute("telephone1").getValue();
        // ... lógica al cambiar el teléfono
    }

    return {
        onLoad: onLoad,
        onSave: onSave,
        onPhoneChange: onPhoneChange
    };
})();
