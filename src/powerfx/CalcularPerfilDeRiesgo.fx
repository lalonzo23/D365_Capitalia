// ═══════════════════════════════════════════════════════════════════════════
//  Function : Calcular Perfil de Riesgo (AML/KYC)
//  Tabla    : Cliente potencial  (enlace/binding = Entity -> usa ThisRecord)
//  Salidas  : Puntaje (Decimal), Nivel (Whole Number)
//
//  ESTADO: alternativa, NO desplegada. El calculo en uso es el flujo de Power
//  Automate "Calcular Perfil de Riesgo (Cliente Potencial)". Esta version
//  existe por si se migra a Functions cuando salga de preview; ambas aplican
//  exactamente la misma matriz y las mismas bandas. Si cambian las reglas,
//  actualizar las dos o retirar esta.
//
//  Matriz de Factores de Riesgo AML/KYC - Capitalia Puesto de Bolsa
//  Manual de Politicas y Procedimientos PLAFT, pag. 32
//
//    Puntaje = Sum( indicador(0..3) x ponderacion% / 10 )
//    Bandas  : 11-21 Bajo | 22-32 Moderado | 33-54 Alto
//    PEP y jurisdicciones GAFI califican Alto de forma automatica.
//
//  Las ponderaciones se leen de 'Configuraciones del Perfil' (Tipo de perfil =
//  Perfil de Riesgo), asi que se ajustan sin tocar esta formula.
// ═══════════════════════════════════════════════════════════════════════════

With(
    {
        // Ponderaciones vigentes del Perfil de Riesgo (Tipo de perfil = 2)
        cfg: Filter( 'Configuraciones del Perfil', Value('Tipo de perfil') = 2 )
    },
    With(
        {
            // ── Puntaje indicador 0..3 de cada factor ────────────────────────
            // Los lookups leen Riesgo de su tabla maestra.
            iAct: Value( 'Actividad Economica'.Riesgo ),
            iTip: Value( Profesión.Riesgo ),
            iRes: Value( 'País de Residencia'.Riesgo ),
            iOri: Value( 'Lugar de Nacimiento'.Riesgo ),
            iPro: Value( 'Producto Utilizado'.Riesgo ),
            iCan: Value( 'Canal de distribucion'.Riesgo ),

            // PEP es un choice del Lead: Si=3 (Alto), No=1 (Bajo)
            iPep: If( Value('¿Consideras eres PEP?') = 1, 3, 1 ),

            // Monto: el choice del Lead se mapea al riesgo de 'Monto de Inversión'
            iMon: Switch( Value('¿Qué monto estimado tienes disponible?'),
                          0, 1,   // Desde RD$100,000 hasta RD$1,200,000  -> Bajo
                          1, 2,   // Mas de RD$1,200,001 hasta RD$5,000,000 -> Medio
                          2, 2,   // Entre RD$5,000,001 y RD$20,000,000     -> Medio
                          3, 3 ), // Mas de RD$20,000,000                   -> Alto

            // Relacion operacion / ingresos (ya viene resuelta en el Lead)
            iRel: Value( 'Relacion operacion / ingresos' ),

            // ── Ponderacion (%) de cada factor ───────────────────────────────
            pAct: LookUp( cfg, 'Logical Name' = "new_actividadeconomica"           ).Ponderación,
            pTip: LookUp( cfg, 'Logical Name' = "new_profesion"                    ).Ponderación,
            pRes: LookUp( cfg, 'Logical Name' = "new_pasderesidencia"              ).Ponderación,
            pOri: LookUp( cfg, 'Logical Name' = "new_paisdeorigen"                 ).Ponderación,
            pPro: LookUp( cfg, 'Logical Name' = "new_productoutilizado"            ).Ponderación,
            pCan: LookUp( cfg, 'Logical Name' = "new_canaldistribucion"            ).Ponderación,
            pPep: LookUp( cfg, 'Logical Name' = "new_espep"                        ).Ponderación,
            pMon: LookUp( cfg, 'Logical Name' = "new_monto_aproximado_inv_inicial" ).Ponderación,
            pRel: LookUp( cfg, 'Logical Name' = "new_relacionoperacioningresos"    ).Ponderación,

            // ── Calificacion Alta automatica: PEP o jurisdiccion GAFI ────────
            altoAuto:
                   ( Value('¿Consideras eres PEP?') = 1 )
                || 'País de Residencia'.'Es de Alto Riesgo por GAFI?'
                || 'Lugar de Nacimiento'.'Es de Alto Riesgo por GAFI?'
        },
        With(
            {
                // Suma ponderada. Los factores sin dato aportan 0.
                puntaje:
                      Coalesce(iAct,0) * Coalesce(pAct,0) / 10
                    + Coalesce(iTip,0) * Coalesce(pTip,0) / 10
                    + Coalesce(iRes,0) * Coalesce(pRes,0) / 10
                    + Coalesce(iOri,0) * Coalesce(pOri,0) / 10
                    + Coalesce(iPro,0) * Coalesce(pPro,0) / 10
                    + Coalesce(iCan,0) * Coalesce(pCan,0) / 10
                    + Coalesce(iPep,0) * Coalesce(pPep,0) / 10
                    + Coalesce(iMon,0) * Coalesce(pMon,0) / 10
                    + Coalesce(iRel,0) * Coalesce(pRel,0) / 10
            },
            With(
                {
                    // 0=No aplica, 1=Bajo, 2=Moderado, 3=Alto
                    nivel:
                        If( altoAuto,                3,
                            puntaje >= 33,           3,
                            puntaje >= 22,           2,
                            puntaje >  0,            1,
                                                     0 )
                },
                // ── Persistir en el Lead ─────────────────────────────────────
                Patch( 'Clientes potenciales', ThisRecord,
                    {
                        'Puntaje Perfil de riesgo': puntaje,
                        'Riesgo Arrojado':
                            Switch( nivel,
                                3, 'Riesgo Arrojado (Clientes potenciales)'.Alto,
                                2, 'Riesgo Arrojado (Clientes potenciales)'.Medio,
                                1, 'Riesgo Arrojado (Clientes potenciales)'.Bajo,
                                   'Riesgo Arrojado (Clientes potenciales)'.'No aplica / Sin Riesgo' )
                    }
                );

                // ── Salidas de la Function ───────────────────────────────────
                { Puntaje: puntaje, Nivel: nivel }
            )
        )
    )
)
