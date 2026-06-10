/**
 * Web resource : new_/scripts/forms/lead.js
 * Entidad      : Lead (Cliente Potencial)
 *
 * Dependencia  : new_/scripts/common/utils.js  (Cap.Common)
 *                Cargar utils.js ANTES que este archivo en las bibliotecas del formulario.
 *
 * Registro de eventos (marcar "pasar contexto de ejecución como primer parámetro")
 * ─────────────────────────────────────────────────────────────────────────────
 * OnLoad     →  Cap.Lead.onLoad
 * OnSave     →  Cap.Lead.onSave          (sin validaciones; placeholder)
 *
 * OnChange: new_tipodepersona            →  Cap.Lead.onTipoPersonaChange
 * OnChange: new_tipodeidentificacin      →  Cap.Lead.onTipoIdChange
 * OnChange: new_estadocivil              →  Cap.Lead.onEstadoCivilChange
 * OnChange: new_espep                    →  Cap.Lead.onEsPepChange
 * OnChange: new_aplicarepresentantelegal →  Cap.Lead.onRepresentanteLegalChange
 * OnChange: new_poseetin                 →  Cap.Lead.onTinChange
 * OnChange: new_naturaleza               →  Cap.Lead.onNaturalezaChange
 * OnChange: new_tipodecuenta             →  Cap.Lead.onTipoCuentaChange
 * OnChange: new_pasderesidencia          →  Cap.Lead.onPaisResidenciaChange
 * OnChange: new_pas                      →  Cap.Lead.onPaisLaboralChange
 *
 * Reglas de visibilidad/obligatoriedad aplicadas:
 *   1. Tipo de Persona       → bloques Física / Jurídica (campos, tabs y secciones)
 *   2. Tipo de Identificación → Cédula / Pasaporte / Acta de Nacimiento
 *   3. Estado Civil          → sección del cónyuge (solo Casado)
 *   4. PEP                   → cargo y período (solo si es PEP)
 *   5. Representante Legal   → lookup representante (solo si aplica)
 *   6. TIN/EIN              → número TIN (solo si posee)
 *   7. Naturaleza           → cliente titular (solo Co-Titular)
 *   7b. Naturaleza readonly  → cuando Física + Cuenta Individual
 *   7c. Domicilio por país   → campos locales vs. dirección completa según residencia
 *   7d. Lugar de trabajo     → campos locales según país laboral
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
    // Mapeo del Formulario Conozca Su Cliente (CSC) Persona Física v2025-12-03
    var CAMPOS_FISICA = [
        // Datos del cliente (1-18)
        "firstname",                         // 1. Nombres
        "middlename",                        // (segundo nombre)
        "new_primerapellido",                // 2. Primer Apellido
        "new_segundoapellido",               // 2. Segundo Apellido
        "new_cedula",                        // 3. Cédula de identidad
        "new_fechadenacimiento",             // 4. Fecha de nacimiento
        "new_paisdeorigen",                  // 5. Lugar de nacimiento
        "new_nacionalidad",                  // 6. Nacionalidad
        "new_segundanacionalidad",           // 7. Segunda Nacionalidad
        "new_pasaporte",                     // 8. Pasaporte
        "new_sexo",                          // 9. Sexo
        "emailaddress1",                     // 10. Correo electrónico
        "mobilephone",                       // 11. Teléfono celular
        "new_pasderesidencia",// 12. País de residencia
        "address1_line1",                    // 13. Calle o Avenida
        "address1_line2",                    // 14. Núm.
        "address1_line3",                    // 15. Edificio
        "new_sectorresidencia",              // 16. Sector
        "new_provinciaderesidencia",         // 17. Provincia o Estado
        "new_estadocivil",                   // 18. Estado Civil
        // Datos del cónyuge (19-20) — visibilidad detallada en regla Estado Civil
        "new_primernombredelcnyuge",         // 19. Nombres del cónyuge
        "new_primerapellidodelcnyuge",       // (apellidos del cónyuge)
        "new_tipodeidentificacindelcnyuge",  // 20. Cédula del cónyuge (tipo)
        // Datos profesionales y laborables (21-31)
        "new_suma_nivelacademico",           // 22. Nivel académico
        "new_profesion",                     // 23. Profesión
        "new_ocupacion",                     // 24. Ocupación
        "new_nombrecompania",                // 25. Nombre de la empresa
        "new_actividadeconomica",            // 26. Actividad económica
        "telephone1",                        // 28. Teléfono de la empresa
        "emailaddress2",                     // 29. Correo electrónico (empresa)
        "jobtitle",                          // 30. Cargo en la empresa
        "address1_composite",                // 31. Dirección de la empresa
        // Lugar de trabajo (secc_lugar_trabajo)
        "new_pas",                           // País laboral
        "new_provincia",                     // Provincia laboral
        "new_municipio",                     // Municipio laboral
        "new_sectorlaboral",                 // Sector laboral
        // address1_line2 (Número) y address1_line3 (Edificio/Local) ya están incluidos arriba
        // PEP (38-45)
        "new_espep",                         // 38. ¿Es PEP?
        "new_indiqueelcargo",                // 39. Cargo público
        "new_estactualmenteocupandoelcargo", // 40. Período de ocupación
        // Vinculado a Capitalia (46-50)
        "new_controlaccionistasultimos5annos",  // 46. ¿Vinculado a Capitalia?
        "new_dequeformavinculado",              // 47. ¿De qué forma?
        "new_nombrecompletovinculadoacapitalia",// 48. Nombres y Apellidos
        "new_parentescovinculadoacapitalia",    // 49. Vínculo
        // FATCA (51-52)
        "new_poseetin",                      // 51. ¿Ciudadano/residente USA?
        "new_tin",                           // 52. Núm. seguridad social / residencia
        // Identificación complementaria
        "new_tipodeidentificacin",
        "new_fechaexpiracioncedula",
        "new_fechaexpiracionpasaporte"
    ];

    // ── Campos Persona Jurídica ──────────────────────────────────────────────
    // Mapeo del Formulario Conozca Su Cliente (CSC) Persona Jurídica v2025-12-03
    var CAMPOS_JURIDICA = [
        // Datos del cliente (1-7)
        "companyname",                       // 1. Denominación Social
        "new_fechadeconstitucin",            // 2. Fecha de Constitución
        "telephone1",                        // 3. Teléfono
        "new_rnc",                           // 4. RNC
        "websiteurl",                        // 5. Página web
        "new_noderegistromercantil",         // 6. Registro Mercantil
        "address1_composite",                // 7. Domicilio
        "address1_line1",                    //    Calle o Avenida
        "address1_line2",                    //    Núm.
        "address1_line3",                    //    Edificio
        "new_sectorlaboral",                 //    Sector
        "new_provincia",                     //    Provincia o Estado
        "new_pas",                           //    País laboral
        // Datos del representante legal (8-21)
        "new_aplicarepresentantelegal",      //    ¿Aplica representante legal?
        "new_representante",                 // 8-9. Representante (lookup a contact)
        // 10-21 viven en la entidad Contact (representante)
        // Datos económicos / empresariales (22-30)
        "new_actividadeconomica",            // 22. Actividad económica
        "industrycode",                      // 23. Sector
        "numberofemployees",                 // 25. Número de empleados
        "new_ingresosefectivo",              // 26. % Ingresos en efectivo
        "new_ventaspromediomensual",         // 27. Ventas promedio mensual
        "new_ventasultimoperiodo",           // 28. Ventas último período
        "new_anosdeoperacion",               // 30. Años de operación
        // Control accionario y administración (33-34)
        "new_numerodeaccionesemitidas",      //    Acciones emitidas
        "new_numerodeaccionesdistribuidas",  //    Acciones distribuidas
        "new_controlaccionistasultimos5annos", // 34. Control accionistas últimos 5 años
        // FATCA (37-40)
        "new_poseetin",                      // 39. ¿Posee TIN o EIN?
        "new_tin",                           // 40. Número TIN o EIN
        // PEP (41-42)
        "new_espep",                         // 41. ¿Accionista/socio es PEP?
        "new_indiqueelcargo",                //    Cargo público
        "new_estactualmenteocupandoelcargo", //    Período
        // Vinculado a Capitalia (43-44)
        "new_dequeformavinculado",           // 44. ¿De qué forma?
        "new_nombrecompletovinculadoacapitalia", //    Nombres y apellidos
        "new_parentescovinculadoacapitalia"  //    Vínculo
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

    // ════════════════════════════════════════════════════════════════════════
    //  EVENTOS PRINCIPALES
    // ════════════════════════════════════════════════════════════════════════

    /** OnLoad */
    function onLoad(executionContext) {
        var fc = executionContext.getFormContext();
        aplicarReglasIniciales(fc);
    }

    /** OnSave — sin validaciones (solo placeholder por si se requiere a futuro) */
    function onSave(executionContext) {
        // Todas las validaciones fueron retiradas.
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

    function onTipoCuentaChange(executionContext) {
        aplicarNaturalezaReadOnly(executionContext.getFormContext());
    }

    function onPaisResidenciaChange(executionContext) {
        aplicarDomicilioPorPais(executionContext.getFormContext());
    }

    function onPaisLaboralChange(executionContext) {
        aplicarLugarTrabajoPorPais(executionContext.getFormContext());
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
        aplicarNaturalezaReadOnly(fc);
        aplicarDomicilioPorPais(fc);
        aplicarLugarTrabajoPorPais(fc);
    }

    // ── Regla 7b: Naturaleza readonly cuando Física + Individual ─────────────
    function aplicarNaturalezaReadOnly(fc) {
        var tipo       = getVal(fc, "new_tipodepersona");
        var tipoCuenta = getVal(fc, "new_tipodecuenta");

        // Persona Física (100000000) + Individual (1) → readonly
        var bloquear = (tipo === TipoPersona.Fisica && tipoCuenta === 1);

        var ctrl = fc.getControl("new_naturaleza");
        if (ctrl) {
            ctrl.setDisabled(bloquear);
        }
    }

    // ── Regla 7c: Domicilio segun País de Residencia ─────────────────────────
    // RD: muestra Provincia/Municipio/Sector/Número/Edificio, oculta Dirección Completa.
    // Otro país: muestra solo Dirección Completa (más País), oculta el resto.
    var ID_REPUBLICA_DOMINICANA = "680DA2A1-169C-E711-8111-C4346BDCF161";

    var CAMPOS_DOM_LOCAL = [
        "new_provinciaderesidencia",
        "new_municipioderesidencia",
        "new_sectorresidencia",
        "address2_line2",
        "address2_line3"
    ];
    var CAMPOS_DOM_EXTRANJERO = ["new_addressfullhome"];

    function aplicarDomicilioPorPais(fc) {
        var pais   = getVal(fc, "new_pasderesidencia");
        var idPais = (pais && pais[0] && pais[0].id) ? pais[0].id.replace(/[{}]/g, "").toUpperCase() : "";
        var sinPais = (idPais === "");
        var esRD    = (idPais === ID_REPUBLICA_DOMINICANA);

        setVisible(fc, CAMPOS_DOM_LOCAL,      esRD);
        // Direccion Completa: oculta si pais vacio o si es RD; visible solo si hay pais distinto a RD
        setVisible(fc, CAMPOS_DOM_EXTRANJERO, !sinPais && !esRD);
    }

    // ── Regla 7d: Lugar de Trabajo segun País laboral ────────────────────────
    // Misma logica que domicilio: solo muestra los campos locales si es RD.
    // La seccion secc_lugar_trabajo no tiene un campo "direccion completa".
    var CAMPOS_TRAB_LOCAL = [
        "new_provincia",
        "new_municipio",
        "new_sectorlaboral",
        "address1_line2",
        "address1_line3"
    ];

    function aplicarLugarTrabajoPorPais(fc) {
        var pais   = getVal(fc, "new_pas");
        var idPais = (pais && pais[0] && pais[0].id) ? pais[0].id.replace(/[{}]/g, "").toUpperCase() : "";
        var esRD   = (idPais === ID_REPUBLICA_DOMINICANA);

        setVisible(fc, CAMPOS_TRAB_LOCAL, esRD);
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
    var TABS_JURIDICA      = ["tab_fatca", "tab_empresas", "tab_accionistas", "tab_consejo"];
    var SECCIONES_JURIDICA = ["secc_datos_cliente", "secc_desc_negocio"];
    var SECCIONES_FISICA   = ["secc_lugar_trabajo"];

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
            // Tabs y secciones
            setTabsVisible(fc, TABS_JURIDICA, false);
            setSeccionesVisible(fc, SECCIONES_JURIDICA, false);
            setSeccionesVisible(fc, SECCIONES_FISICA, true);

        } else if (tipo === TipoPersona.Juridica) {
            // Campos
            setVisible(fc, CAMPOS_JURIDICA, true);
            setVisible(fc, CAMPOS_FISICA,   false);
            setVisible(fc, CAMPOS_CONYUGE,  false);
            setVisible(fc, CAMPOS_PEP,      false);
            setRequerido(fc, ["companyname", "new_rnc"], true);
            setRequerido(fc, ["new_primerapellido", "new_fechadenacimiento",
                               "new_tipodeidentificacin", "new_sexo"], false);
            // Tabs y secciones
            setTabsVisible(fc, TABS_JURIDICA, true);
            setSeccionesVisible(fc, SECCIONES_JURIDICA, true);
            setSeccionesVisible(fc, SECCIONES_FISICA, false);

        } else {
            // Sin selección: ocultar todo
            setVisible(fc, CAMPOS_FISICA,   false);
            setVisible(fc, CAMPOS_JURIDICA, false);
            setTabsVisible(fc, TABS_JURIDICA, false);
            setSeccionesVisible(fc, SECCIONES_JURIDICA, false);
            setSeccionesVisible(fc, SECCIONES_FISICA, false);
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
        aplicarNaturalezaReadOnly(fc);
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
        onNaturalezaChange:        onNaturalezaChange,
        onTipoCuentaChange:        onTipoCuentaChange,
        onPaisResidenciaChange:    onPaisResidenciaChange,
        onPaisLaboralChange:       onPaisLaboralChange
    };
})();
