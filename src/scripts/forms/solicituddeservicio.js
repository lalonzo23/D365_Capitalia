/**
 * Web resource : new_/scripts/forms/solicituddeservicio.js
 * Entidad      : Solicitud de Servicio
 *
 * Dependencia  : new_/scripts/common/utils.js  (Excel.Common)
 *                Cargar utils.js ANTES que este archivo en las bibliotecas del formulario.
 *
 * Registro de eventos (marcar "pasar contexto de ejecución como primer parámetro")
 * ─────────────────────────────────────────────────────────────────────────────
 * OnLoad  →  Excel.SolicitudDeServicio.onLoad
 * OnSave  →  Excel.SolicitudDeServicio.onSave
 *
 * OnChange: new_entidad          →  Excel.SolicitudDeServicio.onConfiguracionChange
 * OnChange: new_precios_servicio →  Excel.SolicitudDeServicio.onConfiguracionChange
 * OnChange: new_producto         →  Excel.SolicitudDeServicio.onConfiguracionChange
 *
 * Reglas aplicadas (según config devuelta por new_configuracionsolicitudservicio):
 *   new_rangofecha → Desde y hasta (100000000) : muestra+requiere new_fechadesde + new_fechahasta
 *                  → Día de la operación (100000001) : oculta ambas fechas
 *
 *   Campos de comportamiento (3 estados) — controlan el campo del mismo nombre:
 *     100000000 No mostrar        → oculto
 *     100000001 Mostrar + opcional→ visible, no obligatorio
 *     100000002 Mostrar + requerido→ visible, obligatorio
 *   Aplica a: new_banco, new_correoelectroniconuevo, new_tipodecuenta,
 *             new_identificacionnueva, new_titularcuenta, new_moneda
 */
"use strict";

var Excel = window.Excel || {};
Excel.SolicitudDeServicio = (function () {

    // ── Nombre lógico de la entidad de configuración ─────────────────────────
    var ENTIDAD_CONFIGURACION = "new_configuracionsolicitudservicio";

    // ── Valores OptionSet de la tabla de configuración ───────────────────────
    // TODO: verificar los valores enteros contra el editor de soluciones de D365
    var RangoFecha  = { DesdeYHasta: 100000000, DiaOperacion: 100000001 };
    // Campos de comportamiento (3 estados):
    var CampoSimple = {
        NoMostrar:        100000000,
        MostrarOpcional:  100000001,
        MostrarRequerido: 100000002
    };

    // ── Campo Lookup "Configuración de la Solicitud de Servicio" en el formulario ──
    var CAMPO_CONFIG_LOOKUP = "new_configuracionsolicitudservicio";

    // ── Campos del formulario Solicitud de Servicio controlados por config ───
    var CAMPOS_RANGO_FECHA = ["new_fechadesde", "new_fechahasta"];

    // ════════════════════════════════════════════════════════════════════════
    //  EVENTOS PRINCIPALES
    // ════════════════════════════════════════════════════════════════════════

    function onLoad(executionContext) {
        var fc = executionContext.getFormContext();
        // new_solicitudcompleta es de solo lectura (incluido en el BPF).
        deshabilitarTodosLosControles(fc, "new_solicitudcompleta");
        buscarConfiguracion(fc);
    }

    function onSave(executionContext) {
        // placeholder
    }

    // ────────────────────────────────────────────────────────────────────────
    //  HANDLERS DE ONCHANGE
    // ────────────────────────────────────────────────────────────────────────

    /** Mismo handler para los tres campos disparadores. */
    function onConfiguracionChange(executionContext) {
        buscarConfiguracion(executionContext.getFormContext());
    }

    /** Re-evalúa la regla de Solicitud Completa al cambiar el documento solicitado. */
    function onDocumentoSolicitadoChange(executionContext) {
        evaluarSolicitudCompleta(executionContext.getFormContext());
    }

    // ════════════════════════════════════════════════════════════════════════
    //  LÓGICA DE CONSULTA
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Lee los tres campos del formulario, arma el FetchXML y consulta la
     * entidad de configuración (activos, el más reciente primero).
     * Las configuraciones encontradas se pasan a aplicarConfiguraciones().
     */
    function buscarConfiguracion(fc) {
        var valEntidad       = getVal(fc, "new_entidad");        // OptionSet → entero
        var idPrecioServicio = getLookupId(fc, "new_precios_servicio"); // Lookup → GUID
        var idProducto       = getLookupId(fc, "new_producto");        // Lookup → GUID

        // La configuración se identifica por los TRES campos juntos.
        // Si falta cualquiera, no hay coincidencia válida → limpiar.
        if (valEntidad === null || !idPrecioServicio || !idProducto) {
            aplicarConfiguraciones(fc, []);
            return;
        }

        var fetchXml =
            '<fetch version="1.0" mapping="logical" no-lock="false" distinct="true">' +
              '<entity name="new_configuracionsolicitudservicio">' +
                '<attribute name="new_name"/>' +
                '<attribute name="statecode"/>' +
                '<attribute name="new_configuracionsolicitudservicioid"/>' +
                '<attribute name="new_entidad"/>' +
                '<attribute name="new_tipodesolicitud"/>' +
                '<attribute name="new_producto"/>' +
                '<attribute name="new_rangofecha"/>' +
                '<attribute name="new_enviar_a"/>' +
                '<attribute name="new_opcionesantesdelcierre"/>' +
                '<attribute name="new_areadeatencion"/>' +
                '<attribute name="new_banco"/>' +
                '<attribute name="new_tipodecuenta"/>' +
                '<attribute name="new_moneda"/>' +
                '<attribute name="new_titularcuenta"/>' +
                '<attribute name="new_identificacionnueva"/>' +
                '<attribute name="new_correoelectroniconuevo"/>' +
                '<attribute name="createdon"/>' +
                '<order attribute="createdon" descending="true"/>' +
                '<filter type="and">' +
                  '<condition attribute="statecode" operator="eq" value="0"/>' +
                  '<condition attribute="new_entidad" operator="eq" value="' + valEntidad + '"/>' +
                  '<condition attribute="new_tipodesolicitud" operator="eq" value="' + idPrecioServicio + '"/>' +
                  '<condition attribute="new_producto" operator="eq" value="' + idProducto + '"/>' +
                '</filter>' +
              '</entity>' +
            '</fetch>';

        Xrm.WebApi.retrieveMultipleRecords(ENTIDAD_CONFIGURACION, "?fetchXml=" + encodeURIComponent(fetchXml))
            .then(function (resultado) {
                aplicarConfiguraciones(fc, resultado.entities);
            })
            .catch(function (error) {
                Excel.Common.notify(fc,
                    "Error al consultar la configuración: " + error.message,
                    "ERROR", "ss_config_error");
            });
    }

    // ════════════════════════════════════════════════════════════════════════
    //  APLICAR CONFIGURACIONES
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Recibe el arreglo de registros devueltos por la tabla de configuración
     * y aplica las reglas de visibilidad / valores al formulario.
     *
     * @param {Xrm.FormContext} fc
     * @param {object[]} configs  - Registros de la entidad de configuración.
     */
    function aplicarConfiguraciones(fc, configs) {
        Excel.Common.clearNotify(fc, "ss_config_error");

        if (!configs || configs.length === 0) {
            setLookup(fc, CAMPO_CONFIG_LOOKUP, null);
            ocultarTodosPorDefecto(fc);
            return;
        }

        var config = configs[0];

        setLookup(fc, CAMPO_CONFIG_LOOKUP, {
            id:         config.new_configuracionsolicitudservicioid,
            name:       config.new_name,
            entityType: ENTIDAD_CONFIGURACION
        });

        aplicarRangoFecha(fc, config.new_rangofecha);
        aplicarCampoSimple(fc, "new_banco",                  config.new_banco);
        aplicarCampoSimple(fc, "new_correoelectroniconuevo", config.new_correoelectroniconuevo);
        aplicarCampoSimple(fc, "new_tipodecuenta",           config.new_tipodecuenta);
        aplicarCampoSimple(fc, "new_identificacionnueva",    config.new_identificacionnueva);
        aplicarCampoSimple(fc, "new_titularcuenta",          config.new_titularcuenta);
        aplicarCampoSimple(fc, "new_moneda",                 config.new_moneda);

        aplicarDocumentoRequerido(fc, config.new_opcionesantesdelcierre);
        evaluarSolicitudCompleta(fc);
    }

    // ── Regla: Documento solicitado requerido ────────────────────────────────
    // statuscode = En Ejecución (100000001) + new_opcionesantesdelcierre =
    // "Solicitado a Área / Adjuntar documento" (100000000) → new_documentosolicitado requerido.
    var OPCION_SOLICITADO_AREA = 100000000;

    function aplicarDocumentoRequerido(fc, opcionCierre) {
        var enEjecucion = (getVal(fc, "statuscode") === STATUS_REQUIERE_DOCUMENTO);
        var requerido   = (enEjecucion && opcionCierre === OPCION_SOLICITADO_AREA);
        setRequerido(fc, ["new_documentosolicitado"], requerido);
    }

    // ── Regla: Solicitud Completa ────────────────────────────────────────────
    // Si hay configuración (lookup poblado) + statuscode = 100000001 +
    // new_documentosolicitado tiene datos → new_solicitudcompleta = true.
    var STATUS_REQUIERE_DOCUMENTO = 100000001;

    function evaluarSolicitudCompleta(fc) {
        // El BPF puede cargar después del onLoad; re-asegurar readonly aquí.
        deshabilitarTodosLosControles(fc, "new_solicitudcompleta");

        var tieneConfig = !!getLookupId(fc, CAMPO_CONFIG_LOOKUP);
        var estatus     = getVal(fc, "statuscode");

        // Si ya falla config o estatus, no hace falta consultar el archivo.
        if (!(tieneConfig && estatus === STATUS_REQUIERE_DOCUMENTO)) {
            setValor(fc, "new_solicitudcompleta", false);
            return;
        }

        // new_documentosolicitado es columna File: getValue() no es confiable en
        // cliente, así que verificamos vía Web API si hay archivo (filesize > 0).
        verificarDocumento(fc, function (tieneDoc) {
            setValor(fc, "new_solicitudcompleta", tieneDoc === true);
        });
    }

    /**
     * Consulta vía Web API si new_documentosolicitado tiene archivo.
     * @param {Xrm.FormContext} fc
     * @param {function(boolean)} callback
     */
    function verificarDocumento(fc, callback) {
        var entidad = fc.data.entity.getEntityName();
        var id      = Excel.Common.getRecordId(fc);

        // Registro nuevo / sin guardar → no puede tener archivo aún.
        if (!id) { callback(false); return; }

        Xrm.WebApi.retrieveRecord(entidad, id, "?$select=new_documentosolicitado")
            .then(function (rec) {
                callback(!Excel.Common.isEmpty(rec.new_documentosolicitado));
            })
            .catch(function () {
                callback(false);
            });
    }

    /** Estado por defecto cuando no hay configuración: ocultar todos los campos controlados. */
    function ocultarTodosPorDefecto(fc) {
        setVisible(fc, CAMPOS_RANGO_FECHA, false);
        setRequerido(fc, CAMPOS_RANGO_FECHA, false);
        // Limpiar los valores de Fecha desde / Fecha hasta
        CAMPOS_RANGO_FECHA.forEach(function (campo) { setValor(fc, campo, null); });
        ["new_correoelectroniconuevo", "new_tipodecuenta",
         "new_identificacionnueva", "new_titularcuenta", "new_moneda"
        ].forEach(function (campo) { setControl(fc, campo, false); });


        // Sin configuración: documento solicitado oculto y no requerido.
        setControl(fc, "new_documentosolicitado", false);
        setRequerido(fc, ["new_documentosolicitado"], false);

        // Sin configuración: solicitud completa oculta (incl. BPF) y no requerida.
        ocultarTodosLosControles(fc, "new_solicitudcompleta");
        setRequerido(fc, ["new_solicitudcompleta"], false);
    }

    // ── Regla: Rango de Fecha ────────────────────────────────────────────────
    function aplicarRangoFecha(fc, valor) {
        var mostrar = (valor === RangoFecha.DesdeYHasta);
        setVisible(fc, CAMPOS_RANGO_FECHA, mostrar);
        setRequerido(fc, CAMPOS_RANGO_FECHA, mostrar);
    }

    // ── Regla genérica: No mostrar / Mostrar opcional / Mostrar requerido ─────
    function aplicarCampoSimple(fc, campo, valor) {
        var visible   = (valor === CampoSimple.MostrarOpcional ||
                         valor === CampoSimple.MostrarRequerido);
        var requerido = (valor === CampoSimple.MostrarRequerido);
        setControl(fc, campo, visible);
        setRequerido(fc, [campo], requerido);
    }

    // ════════════════════════════════════════════════════════════════════════
    //  HELPERS INTERNOS
    // ════════════════════════════════════════════════════════════════════════

    /** Obtiene el valor de un atributo de forma segura. */
    function getVal(fc, campo) {
        var attr = fc.getAttribute(campo);
        return attr ? attr.getValue() : null;
    }

    /**
     * Devuelve el GUID limpio (sin llaves) de un campo Lookup,
     * o null si el campo está vacío.
     */
    function getLookupId(fc, campo) {
        var val = getVal(fc, campo);
        if (!val || !val[0] || !val[0].id) return null;
        return val[0].id.replace(/[{}]/g, "").toLowerCase();
    }

    /** Muestra u oculta una lista de campos. */
    function setVisible(fc, campos, visible) {
        campos.forEach(function (campo) {
            var ctrl = fc.getControl(campo);
            if (ctrl) ctrl.setVisible(visible);
        });
    }

    /** Muestra u oculta un control. */
    function setControl(fc, campo, visible) {
        var ctrl = fc.getControl(campo);
        if (ctrl) ctrl.setVisible(visible);
    }

    /**
     * Deshabilita (solo lectura) TODOS los controles de un atributo, incluido
     * el control que aparece en el Business Process Flow (BPF).
     */
    function deshabilitarTodosLosControles(fc, campo) {
        var attr = fc.getAttribute(campo);
        if (!attr) return;
        attr.controls.forEach(function (ctrl) {
            if (ctrl && ctrl.setDisabled) ctrl.setDisabled(true);
        });
    }

    /**
     * Oculta TODOS los controles de un atributo, incluido el del BPF.
     */
    function ocultarTodosLosControles(fc, campo) {
        var attr = fc.getAttribute(campo);
        if (!attr) return;
        attr.controls.forEach(function (ctrl) {
            if (ctrl && ctrl.setVisible) ctrl.setVisible(false);
        });
    }

    /** Establece el valor de un atributo de forma segura. */
    function setValor(fc, campo, valor) {
        var attr = fc.getAttribute(campo);
        if (attr) attr.setValue(valor);
    }

    /**
     * Establece u limpia un campo Lookup.
     * @param {Xrm.FormContext} fc
     * @param {string} campo
     * @param {{id: string, name: string, entityType: string}|null} ref
     */
    function setLookup(fc, campo, ref) {
        var attr = fc.getAttribute(campo);
        if (!attr) return;
        attr.setValue(ref ? [ref] : null);
    }

    /** Marca o desmarca campos como obligatorios. */
    function setRequerido(fc, campos, requerido) {
        campos.forEach(function (campo) {
            var attr = fc.getAttribute(campo);
            if (attr) attr.setRequiredLevel(requerido ? "required" : "none");
        });
    }

    // ── API pública ──────────────────────────────────────────────────────────
    return {
        onLoad:                      onLoad,
        onSave:                      onSave,
        onConfiguracionChange:       onConfiguracionChange,
        onDocumentoSolicitadoChange: onDocumentoSolicitadoChange
    };
})();
