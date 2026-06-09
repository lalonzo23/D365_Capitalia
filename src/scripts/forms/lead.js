/**
 * Web resource : new_/scripts/forms/lead.js
 * Entidad      : Lead (Cliente Potencial)
 *
 * Dependencia  : new_/scripts/common/utils.js  (Cap.Common)
 *                Cargar utils.js ANTES que este archivo en las bibliotecas del formulario.
 *
 * Registro de eventos
 * ─────────────────────────────────────────────────────────────────────────────
 * OnLoad     →  Cap.Lead.onLoad          (pasar contexto de ejecución)
 * OnSave     →  Cap.Lead.onSave          (pasar contexto de ejecución)
 *
 * OnChange: new_tipodepersona            →  Cap.Lead.onTipoPersonaChange
 * OnChange: new_tipodeidentificacin      →  Cap.Lead.onTipoIdChange
 * OnChange: new_estadocivil              →  Cap.Lead.onEstadoCivilChange
 * OnChange: new_espep                    →  Cap.Lead.onEsPepChange
 * OnChange: new_aplicarepresentantelegal →  Cap.Lead.onRepresentanteLegalChange
 * OnChange: new_poseetin                 →  Cap.Lead.onTinChange
 * OnChange: new_naturaleza               →  Cap.Lead.onNaturalezaChange
 * OnChange: new_controlaccionistasultimos5annos → Cap.Lead.onVinculadoCapitaliaChange
 */
"use strict";

var Cap = window.Cap || {};
Cap.Lead = (function () {

    // ── Constantes de OptionSet ──────────────────────────────────────────────

    var TipoPersona = { Fisica: 100000000, Juridica: 100000001 };
    var TipoId      = { Pasaporte: 100000000, Cedula: 100000001, ActaNacimiento: 100000002 };
    var EstadoCivil = { Soltero: 1, Casado: 2, UnionLibre: 5, NoAplica: 3 };
    var EsPep       = { No: 0, Si: 1 };
    var Naturaleza  = { Titular: 1, CoTitular: 2 };

    // ── Campos Persona Física ────────────────────────────────────────────────
    var CAMPOS_FISICA = [
        "firstname", "middlename", "new_primerapellido", "new_segundoapellido",
        "new_sexo", "new_fechadenacimiento", "new_estadocivil",
        "new_tipodeidentificacin", "new_cedula", "new_pasaporte",
        "new_fechaexpiracioncedula", "new_fechaexpiracionpasaporte",
        "new_nacionalidad", "new_segundanacionalidad", "new_paisdeorigen",
        "new_profesion", "new_ocupacion", "new_suma_nivelacademico",
        "new_espep", "new_poseetin", "new_tin"
    ];

    // ── Campos Persona Jurídica ──────────────────────────────────────────────
    var CAMPOS_JURIDICA = [
        "companyname", "new_rnc", "new_noderegistromercantil",
        "new_fechadeconstitucin", "new_anosdeoperacion",
        "new_numerodeaccionesemitidas", "new_numerodeaccionesdistribuidas",
        "new_controlaccionistasultimos5annos", "new_ventaspromediomensual",
        "new_ventasultimoperiodo", "numberofemployees",
        "new_aplicarepresentantelegal", "new_representante"
    ];

    // ── Campos cónyuge ───────────────────────────────────────────────────────
    var CAMPOS_CONYUGE = [
        "new_primernombredelcnyuge", "new_segundonombredelcnyuge",
        "new_primerapellidodelcnyuge", "new_segundoapellidodelcnyuge",
        "new_tipodeidentificacindelcnyuge"
    ];

    // ── Campos PEP ───────────────────────────────────────────────────────────
    var CAMPOS_PEP = [
        "new_indiqueelcargo", "new_estactualmenteocupandoelcargo"
    ];

    // ── Notificaciones ───────────────────────────────────────────────────────
    var NOTIF = {
        EMAIL:   "lead_email",
        CEDULA:  "lead_cedula",
        RNC:     "lead_rnc",
        EDAD:    "lead_edad",
        FECEXP:  "lead_fecexp",
        FECEXPP: "lead_fecexpp",
        CONTACTO:"lead_contacto"
    };

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // ════════════════════════════════════════════════════════════════════════
    //  EVENTOS PRINCIPALES
    // ════════════════════════════════════════════════════════════════════════

    /** OnLoad */
    function onLoad(executionContext) {
        var fc = executionContext.getFormContext();
        aplicarReglasIniciales(fc);
    }

    /** OnSave */
    function onSave(executionContext) {
        var fc   = executionContext.getFormContext();
        var args = executionContext.getEventArgs();
        var ok   = true;

        ok = validarEmail(fc)           && ok;
        ok = validarContacto(fc)        && ok;
        ok = validarIdentificacion(fc)  && ok;
        ok = validarFecExpiracion(fc)   && ok;

        if (!ok) { args.preventDefault(); }
    }

    // ────────────────────────────────────────────────────────────────────────
    //  HANDLERS DE ONCHANGE
    // ────────────────────────────────────────────────────────────────────────

    function onTipoPersonaChange(executionContext) {
        aplicarTipoPersona(executionContext.getFormContext());
    }

    function onTipoIdChange(executionContext) {
        aplicarTipoIdentificacion(executionContext.getFormContext());
    }

    function onEstadoCivilChange(executionContext) {
        aplicarEstadoCivil(executionContext.getFormContext());
    }

    function onEsPepChange(executionContext) {
        aplicarPep(executionContext.getFormContext());
    }

    function onRepresentanteLegalChange(executionContext) {
        aplicarRepresentanteLegal(executionContext.getFormContext());
    }

    function onTinChange(executionContext) {
        aplicarTin(executionContext.getFormContext());
    }

    function onNaturalezaChange(executionContext) {
        aplicarClienteTitular(executionContext.getFormContext());
    }


    // ════════════════════════════════════════════════════════════════════════
    //  REGLAS DE NEGOCIO
    // ════════════════════════════════════════════════════════════════════════

    /** Aplica todas las reglas al cargar el formulario. */
    function aplicarReglasIniciales(fc) {
        aplicarTipoPersona(fc);
        aplicarTipoIdentificacion(fc);
        aplicarEstadoCivil(fc);
        aplicarPep(fc);
        aplicarRepresentanteLegal(fc);
        aplicarTin(fc);
        aplicarClienteTitular(fc);
    }

    // ── Regla 7: Cliente Potencial Titular ───────────────────────────────────
    // Visible solo cuando Naturaleza = Co-Titular
    function aplicarClienteTitular(fc) {
        var naturaleza = getVal(fc, "new_naturaleza");
        var mostrar    = (naturaleza === Naturaleza.CoTitular);

        setControl(fc, "new_clientepotencialtitular", mostrar);
        setRequerido(fc, ["new_clientepotencialtitular"], mostrar);
    }

    // ── Tabs / secciones exclusivos de Persona Jurídica ─────────────────────
    var TABS_JURIDICA     = ["tab_fatca", "tab_empresas", "tab_accionistas", "tab_consejo"];
    var SECCIONES_JURIDICA = ["secc_datos_cliente", "secc_desc_negocio"];

    // ── Regla 1: Tipo de Persona ─────────────────────────────────────────────
    function aplicarTipoPersona(fc) {
        var tipo = getVal(fc, "new_tipodepersona");

        if (tipo === TipoPersona.Fisica) {
            // Campos
            setVisible(fc, CAMPOS_FISICA,   true);
            setVisible(fc, CAMPOS_JURIDICA, false);
            setRequerido(fc, ["new_primerapellido", "new_fechadenacimiento",
                               "new_tipodeidentificacin", "new_sexo"], true);
            setRequerido(fc, ["companyname", "new_rnc"], false);
            // Tabs y secciones exclusivas de Jurídica → ocultar
            setTabsVisible(fc, TABS_JURIDICA, false);
            setSeccionesVisible(fc, SECCIONES_JURIDICA, false);

        } else if (tipo === TipoPersona.Juridica) {
            // Campos
            setVisible(fc, CAMPOS_JURIDICA, true);
            setVisible(fc, CAMPOS_FISICA,   false);
            setVisible(fc, CAMPOS_CONYUGE,  false);
            setVisible(fc, CAMPOS_PEP,      false);
            setRequerido(fc, ["companyname", "new_rnc"], true);
            setRequerido(fc, ["new_primerapellido", "new_fechadenacimiento",
                               "new_tipodeidentificacin", "new_sexo"], false);
            // Tabs y secciones exclusivas de Jurídica → mostrar
            setTabsVisible(fc, TABS_JURIDICA, true);
            setSeccionesVisible(fc, SECCIONES_JURIDICA, true);

        } else {
            // Sin selección: ocultar todo
            setVisible(fc, CAMPOS_FISICA,   false);
            setVisible(fc, CAMPOS_JURIDICA, false);
            setTabsVisible(fc, TABS_JURIDICA, false);
            setSeccionesVisible(fc, SECCIONES_JURIDICA, false);
        }

        // Re-evaluar sub-reglas que dependen del tipo de persona
        if (tipo === TipoPersona.Fisica) {
            aplicarTipoIdentificacion(fc);
            aplicarEstadoCivil(fc);
            aplicarPep(fc);
            aplicarTin(fc);
        }
        if (tipo === TipoPersona.Juridica) {
            aplicarRepresentanteLegal(fc);
        }
    }

    // ── Regla 2: Tipo de Identificación ─────────────────────────────────────
    function aplicarTipoIdentificacion(fc) {
        var tipoId = getVal(fc, "new_tipodeidentificacin");

        // Cédula
        setControl(fc, "new_cedula",              tipoId === TipoId.Cedula);
        setControl(fc, "new_fechaexpiracioncedula", tipoId === TipoId.Cedula);
        setRequerido(fc, ["new_cedula"], tipoId === TipoId.Cedula);

        // Pasaporte
        setControl(fc, "new_pasaporte",               tipoId === TipoId.Pasaporte);
        setControl(fc, "new_fechaexpiracionpasaporte", tipoId === TipoId.Pasaporte);
        setRequerido(fc, ["new_pasaporte"], tipoId === TipoId.Pasaporte);

        // Acta de nacimiento: solo número genérico de identificación
        if (tipoId === TipoId.ActaNacimiento) {
            setControl(fc, "new_cedula",               false);
            setControl(fc, "new_pasaporte",            false);
            setControl(fc, "new_fechaexpiracioncedula",false);
            setControl(fc, "new_fechaexpiracionpasaporte", false);
        }

        // Limpiar validaciones anteriores de identificación
        Cap.Common.clearNotify(fc, NOTIF.CEDULA);
    }

    // ── Regla 3: Estado Civil ────────────────────────────────────────────────
    function aplicarEstadoCivil(fc) {
        var ec       = getVal(fc, "new_estadocivil");
        var esCasado = (ec === EstadoCivil.Casado);

        setSeccionesVisible(fc, ["secc_datos_conyugue"], esCasado);
        setVisible(fc, CAMPOS_CONYUGE, esCasado);
        setRequerido(fc, ["new_primernombredelcnyuge", "new_primerapellidodelcnyuge"], esCasado);
    }

    // ── Regla 4: PEP ────────────────────────────────────────────────────────
    function aplicarPep(fc) {
        var esPep = getVal(fc, "new_espep");
        var esSi  = (esPep === EsPep.Si);
        setVisible(fc, CAMPOS_PEP, esSi);
        setRequerido(fc, ["new_indiqueelcargo"], esSi);

        if (esSi) {
            Cap.Common.notify(fc,
                "Este cliente es una Persona Expuesta Políticamente (PEP). Complete los campos requeridos.",
                "WARNING", "lead_pep_aviso");
        } else {
            Cap.Common.clearNotify(fc, "lead_pep_aviso");
        }
    }

    // ── Regla 5: Representante Legal ─────────────────────────────────────────
    function aplicarRepresentanteLegal(fc) {
        var aplica = getVal(fc, "new_aplicarepresentantelegal");
        setControl(fc, "new_representante", aplica === true);
        setRequerido(fc, ["new_representante"], aplica === true);
    }

    // ── Regla 6: TIN / EIN ──────────────────────────────────────────────────
    function aplicarTin(fc) {
        var posee = getVal(fc, "new_poseetin");
        setControl(fc, "new_tin", posee === true);
        setRequerido(fc, ["new_tin"], posee === true);
    }



    // ════════════════════════════════════════════════════════════════════════
    //  VALIDACIONES OnSave
    // ════════════════════════════════════════════════════════════════════════

    /** Validar formato de email */
    function validarEmail(fc) {
        var val = getVal(fc, "emailaddress1");
        if (Cap.Common.isEmpty(val) || EMAIL_RE.test(val)) {
            Cap.Common.clearNotify(fc, NOTIF.EMAIL);
            limpiarNotifControl(fc, "emailaddress1", NOTIF.EMAIL);
            return true;
        }
        Cap.Common.notify(fc, "El correo electrónico no tiene un formato válido.", "ERROR", NOTIF.EMAIL);
        notifControl(fc, "emailaddress1", "Formato inválido.", NOTIF.EMAIL);
        return false;
    }

    /** Al menos email o teléfono */
    function validarContacto(fc) {
        var email  = getVal(fc, "emailaddress1");
        var tel1   = getVal(fc, "telephone1");
        var movil  = getVal(fc, "mobilephone");
        if (!Cap.Common.isEmpty(email) || !Cap.Common.isEmpty(tel1) || !Cap.Common.isEmpty(movil)) {
            Cap.Common.clearNotify(fc, NOTIF.CONTACTO);
            return true;
        }
        Cap.Common.notify(fc,
            "Debe indicar al menos un medio de contacto: correo electrónico, teléfono de trabajo o teléfono móvil.",
            "ERROR", NOTIF.CONTACTO);
        return false;
    }

    /** Validar cédula (11 dígitos) y RNC (9 dígitos) */
    function validarIdentificacion(fc) {
        var tipoId = getVal(fc, "new_tipodeidentificacin");
        var ok = true;

        if (tipoId === TipoId.Cedula) {
            var cedula = (getVal(fc, "new_cedula") || "").replace(/[-\s]/g, "");
            if (!Cap.Common.isEmpty(cedula) && !/^\d{11}$/.test(cedula)) {
                Cap.Common.notify(fc, "La cédula debe tener 11 dígitos numéricos.", "ERROR", NOTIF.CEDULA);
                notifControl(fc, "new_cedula", "Deben ser 11 dígitos.", NOTIF.CEDULA);
                ok = false;
            } else {
                Cap.Common.clearNotify(fc, NOTIF.CEDULA);
                limpiarNotifControl(fc, "new_cedula", NOTIF.CEDULA);
            }
        }

        // RNC: aplica a persona jurídica (9 dígitos)
        var rnc = (getVal(fc, "new_rnc") || "").replace(/[-\s]/g, "");
        if (!Cap.Common.isEmpty(rnc) && !/^\d{9}$/.test(rnc)) {
            Cap.Common.notify(fc, "El RNC debe tener 9 dígitos numéricos.", "ERROR", NOTIF.RNC);
            notifControl(fc, "new_rnc", "Deben ser 9 dígitos.", NOTIF.RNC);
            ok = false;
        } else {
            Cap.Common.clearNotify(fc, NOTIF.RNC);
            limpiarNotifControl(fc, "new_rnc", NOTIF.RNC);
        }

        return ok;
    }


    /** Validar que la cédula/pasaporte no estén vencidos */
    function validarFecExpiracion(fc) {
        var ok   = true;
        var hoy  = new Date();
        hoy.setHours(0, 0, 0, 0);

        var tipoId = getVal(fc, "new_tipodeidentificacin");

        if (tipoId === TipoId.Cedula) {
            var expCed = getVal(fc, "new_fechaexpiracioncedula");
            if (expCed && new Date(expCed) < hoy) {
                Cap.Common.notify(fc, "La cédula se encuentra vencida.", "WARNING", NOTIF.FECEXP);
                ok = false;
            } else {
                Cap.Common.clearNotify(fc, NOTIF.FECEXP);
            }
        }

        if (tipoId === TipoId.Pasaporte) {
            var expPas = getVal(fc, "new_fechaexpiracionpasaporte");
            if (expPas && new Date(expPas) < hoy) {
                Cap.Common.notify(fc, "El pasaporte se encuentra vencido.", "WARNING", NOTIF.FECEXPP);
                ok = false;
            } else {
                Cap.Common.clearNotify(fc, NOTIF.FECEXPP);
            }
        }

        return ok;
    }

    // ════════════════════════════════════════════════════════════════════════
    //  HELPERS INTERNOS
    // ════════════════════════════════════════════════════════════════════════

    /** Obtiene el valor de un atributo de forma segura. */
    function getVal(fc, campo) {
        var attr = fc.getAttribute(campo);
        return attr ? attr.getValue() : null;
    }

    /** Muestra u oculta una lista de campos (controles). */
    function setVisible(fc, campos, visible) {
        campos.forEach(function (campo) {
            setControl(fc, campo, visible);
        });
    }

    /** Muestra u oculta una lista de tabs por su nombre lógico. */
    function setTabsVisible(fc, tabs, visible) {
        tabs.forEach(function (tabName) {
            var tab = fc.ui.tabs.get(tabName);
            if (tab) { tab.setVisible(visible); }
        });
    }

    /**
     * Muestra u oculta una lista de secciones buscándolas en todos los tabs.
     * No es necesario conocer el tab contenedor.
     */
    function setSeccionesVisible(fc, secciones, visible) {
        secciones.forEach(function (secName) {
            fc.ui.tabs.forEach(function (tab) {
                var sec = tab.sections.get(secName);
                if (sec) { sec.setVisible(visible); }
            });
        });
    }

    /** Muestra u oculta un control. */
    function setControl(fc, campo, visible) {
        fc.getControl(campo) && fc.getControl(campo).setVisible(visible);
    }

    /** Marca o desmarca campos como obligatorios. */
    function setRequerido(fc, campos, requerido) {
        campos.forEach(function (campo) {
            var attr = fc.getAttribute(campo);
            if (attr) {
                attr.setRequiredLevel(requerido ? "required" : "none");
            }
        });
    }

    /** Pone notificación en el control de un campo. */
    function notifControl(fc, campo, msg, id) {
        var ctrl = fc.getControl(campo);
        if (ctrl) { ctrl.setNotification(msg, id); }
    }

    /** Limpia la notificación de un control. */
    function limpiarNotifControl(fc, campo, id) {
        var ctrl = fc.getControl(campo);
        if (ctrl) { ctrl.clearNotification(id); }
    }

    // ── API pública ──────────────────────────────────────────────────────────
    return {
        // Eventos del formulario
        onLoad:                    onLoad,
        onSave:                    onSave,
        // Eventos OnChange
        onTipoPersonaChange:       onTipoPersonaChange,
        onTipoIdChange:            onTipoIdChange,
        onEstadoCivilChange:       onEstadoCivilChange,
        onEsPepChange:             onEsPepChange,
        onRepresentanteLegalChange: onRepresentanteLegalChange,
        onTinChange:               onTinChange,
        onNaturalezaChange:        onNaturalezaChange
    };
})();
