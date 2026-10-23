# Módulo de terceros: especificación funcional y técnica

Fecha: 23 de octubre de 2026. Estado: diseño para revisión e implementación posterior.

Este documento consolida los acuerdos de la conversación y una propuesta de implementación basada en la revisión del frontend Angular y backend Express/Mongoose. No representa funcionalidad implementada ni validada en producción. Las decisiones de diseño adicionales se identifican como propuestas; no sustituyen acuerdos comerciales ni reglas clínicas.

## 1. Objetivo y alcance

Gestionar atenciones remitidas por terceros desde el registro de pacientes y muestras hasta los resultados, liquidaciones, cuentas por cobrar y comisiones por pagar. Reutilizar el circuito clínico existente y mantener la trazabilidad entre cada prueba, sus recipientes, resultados y movimientos económicos.

Incluye centros médicos, clínicas y consultorios, con médicos asociados, contactos y múltiples sedes. Lab Fray dispone inicialmente de sucursal y central. Central decide la aceptación técnica final.

### Modalidades acordadas

| Modalidad | Inicio operativo | Identificación mínima | Obligación económica |
| --- | --- | --- | --- |
| Muestra tomada por tercero | Primera recepción en sucursal o central | Nombre completo y edad; documento opcional | Cuenta por cobrar al tercero |
| Toma por Lab Fray en clínica | Toma en clínica, registrada retrospectivamente al llegar | Nombre completo y edad; Prevecon proporciona DNI | Cuenta por cobrar al tercero |
| Paciente enviado por médico | Atención particular en Lab Fray | DNI obligatorio | Pago del paciente y eventual comisión al médico |

Fuera de esta versión: portal de terceros, emisión electrónica de facturas, integración directa con el sistema de Prevecon, monitoreo continuo de transporte y cargos adicionales por transporte/toma. El modelo podrá admitir cargos adicionales futuros sin cobrarlos ahora.

## 2. Separaciones fundamentales

1. Remitente comercial, médico referente, paciente, empleador del paciente y laboratorio al que se deriva una prueba son entidades o papeles distintos.
2. Prevecon es el cliente de Lab Fray. La columna EMPRESA de su archivo identifica el contexto empresarial del paciente; no debe convertirse automáticamente en el deudor.
3. Solicitud, prueba facturable, ítem de resultado y recipiente físico no son equivalentes. Un hemograma puede contener muchos resultados y generar un cargo por prueba; un recipiente puede servir a varias pruebas.
4. Envío del tercero y traslado entre sedes no son la misma operación. Un traslado puede agrupar recipientes de varias atenciones.
5. Estado clínico, estado de cobro y estado de liquidación evolucionan independientemente.
6. LaboratorioReferencia existente se mantiene para procesamiento externo. No se reutiliza como si representara al remitente comercial.

## 3. Recorrido de las pantallas

### 3.1 Terceros y convenios

Lista con búsqueda por nombre, documento, tipo y estado. Ficha con datos comerciales, sedes, contactos por función, médicos asociados, convenios y tarifarios vigentes.

Convenio: modalidad habitual, condiciones de pago, periodicidad de liquidación, plazo de crédito y punto de inicio, preferencias de informe, porcentaje de comisión cuando aplique. Son valores predeterminados; cada atención conserva su contexto histórico.

Tarifario estándar de terceros y versiones especiales por tercero. Precio por prueba/servicio facturable, moneda y tratamiento tributario explícitos. Vigencia sin superposición ambigua. El sistema selecciona el tarifario especial vigente o, en su ausencia, el estándar.

Propuesta: un tercero puede tener más de un papel comercial sin duplicar sus datos. El médico se vincula al catálogo RefMedico y a su consultorio. Los nombres exactos y campos obligatorios se adaptarán a los modelos existentes.

### 3.2 Ingresos de terceros

Bandeja por fecha, tercero/sede, sede Lab Fray, modalidad, prioridad, estado clínico y pendientes de identificación. Contadores por pacientes, pruebas y recipientes, con unidades claramente diferenciadas.

Acciones: nuevo ingreso manual, importar pacientes Prevecon, abrir atención, agregar pruebas, adjuntar orden, imprimir etiquetas y consultar historial.

Registro manual:

1. Seleccionar tercero, sede remitente, modalidad y sede de ingreso.
2. Registrar paciente o vincularlo mediante documento verificado. Mostrar coincidencias para revisión, nunca unir por nombre automáticamente.
3. Registrar pruebas y precio previsto; todavía no crear deuda.
4. Registrar recipientes efectivamente recibidos y contrastarlos con los requeridos. Un recipiente faltante permanece pendiente; no se simula su recepción.
5. Adjuntar fotografía de la orden e indicar prioridad.
6. Para toma por Lab Fray: responsable, fecha/hora declarada de toma y precisión de la hora (exacta/aproximada). Conservar aparte usuario y fecha de digitación.
7. Guardar solicitud y vinculación de muestras mediante una operación consistente. Una recepción en sucursal no equivale a aceptación técnica.

Propuesta para carga rápida: tabla editable de pacientes con selección de pruebas, conjuntos reutilizables de selección y revisión individual. Los conjuntos solo facilitan la digitación; no permiten inferir automáticamente lo solicitado a partir de empresa o tipo de examen.

### 3.3 Detalle de atención

Cabecera con paciente, identificadores internos/externos, tercero y sede, modalidad, prioridad y origen del plazo. Secciones: pruebas, recipientes, traslado, resultados, documentos, cargos e historial.

Agregar una prueba conserva la orden. Se verifica si las muestras existentes cubren sus requerimientos y están disponibles; si no, queda pendiente de nueva muestra. La disponibilidad y aptitud clínica no se deducen solo de que el recipiente exista.

### 3.4 Traslados

Preparar envío desde sucursal: seleccionar recipientes, indicar destino, responsable, fecha/hora y temperatura de despacho en °C. Confirmar despacho con manifiesto de recipientes.

Recepción central: cotejar cada recipiente, registrar responsable, fecha/hora, temperatura de llegada e incidencias/faltantes. Permitir recepción parcial y dejar diferencias visibles.

El rango habitual informado por Lab Fray es 2–8 °C. En esta versión las temperaturas son registros de trazabilidad: no generan rechazo automático. No se afirma que capturar estos campos por sí solo certifique cumplimiento normativo.

### 3.5 Evaluación central

Reutilizar aceptación, rechazo, evidencias e historial de muestras. Recepción administrativa y aceptación técnica son acciones separadas. Personal de laboratorio autorizado en central puede ejecutarlas juntas, registrando ambos eventos.

Rechazo: motivo, evidencia cuando corresponda y posibilidad de reposición dentro de la misma orden. Cada intento tiene identificador propio y vínculo al anterior. Las pruebas cubiertas por otras muestras aceptadas continúan.

### 3.6 Resultados e informes

Reutilizar captura, revisión, validación, liberación, firmas, historial y entrega. Añadir filtros por tercero, sede y modalidad. Mantener controles de muestras por unidad de prueba.

Informe con o sin membrete, conservando firma profesional, identificación y verificación de Lab Fray. La excepción de documento se limita a muestras de terceros y tomas por Lab Fray para terceros; no flexibiliza atenciones particulares referidas por médicos.

Comunicación de resultados críticos al médico/contacto pertinente: conservar responsable, destinatario, fecha y estado de comunicación. Reutilizar capacidades existentes cuando correspondan; no confundir la alerta clínica con alertas de informes vencidos.

### 3.7 Liquidaciones y cuentas corrientes

Lista por tercero, período y estado. Detalle por atención y prueba: importe original, ajustes, importe vigente, fecha de cargo y vínculo clínico.

Acciones: preparar productividad, revisar, ajustar, aprobar internamente, registrar envío al cliente, aprobación/observación del cliente, registrar factura externa, abonos y conciliación de saldo.

Solo administrador o superadministrador autorizado modifica importes y aprueba internamente. Todo ajuste exige motivo y conserva autor, fecha, valor anterior y nuevo. Agregar o retirar una línea económica no modifica silenciosamente la orden clínica.

Prevecon: productividad mensual, aprobación del cliente, factura externa y vencimiento a 60 días desde su fecha. La fecha aproximada de facturación a mitad del mes siguiente no se impone como automatismo. El vencimiento se calcula desde la fecha real registrada.

### 3.8 Comisiones y reportes

Comisiones por médico, período, atención y prueba, con base, deducibles, impuesto, porcentaje, ajustes, estado y pagos. No generar comisión hasta completar la atención vigente y el pago total, considerando cancelaciones y reembolsos.

Reportes: productividad por tercero/sede/prueba, cuentas por cobrar sin facturar/facturadas/vencidas, abonos, comisiones pendientes/pagadas, rechazos y reposiciones, trazabilidad de traslados, tiempos y exportaciones Prevecon.

Propuesta: no compensar automáticamente deudas y comisiones de una misma contraparte; mostrar saldos separados. Cualquier compensación futura requerirá una operación explícita.

## 4. Pacientes e identidad

- Preferir fecha de nacimiento cuando exista; en su ausencia guardar edad declarada con valor, unidad y fecha de referencia. Años por defecto; permitir meses/días. No inventar fecha de nacimiento.
- Conservar sexo informado. Si falta, no asignarlo ni aplicar como si fuera conocida una referencia específica por sexo. Mostrar que falta contexto para la referencia aplicable; la regla clínica exacta se validará al implementar.
- Importación con nombres completos: preservar texto original y permitir revisar separación de nombres/apellidos. No adivinar una separación definitiva para vincular identidades.
- Reutilizar HC provisional y conciliación existentes, ampliando el origen a terceros. Sin documento, no vincular pacientes por nombre ni por edad.
- Documento importado no implica por sí mismo verificación. Propuesta: registrar fuente y revisión, detectar conflictos con el maestro antes de vincular.
- Permitir informes sin DNI solo en las dos modalidades autorizadas, con nombre completo y edad como mínimo. Un paciente provisional no debe heredar una excepción aplicable a otra atención.
- Regularización posterior auditada; no reescribir silenciosamente informes históricos ya emitidos.
- Revisar las obligaciones actuales de domicilio del maestro: no inventar departamento/provincia/distrito para importar pacientes con DNI.

## 5. Estados e invariantes

| Objeto | Estados propuestos o reutilizados | Regla |
| --- | --- | --- |
| Registro de ingreso | BORRADOR, REGISTRADO, ANULADO | Un borrador no genera deuda |
| Muestra | Estados existentes: PENDIENTE, RECOLECTADA, RECEPCIONADA, ACEPTADA, RECHAZADA, ANULADA | Incorporar recepción externa sin fingir recolección por usuario interno |
| Traslado | BORRADOR, DESPACHADO, RECIBIDO_PARCIAL, RECIBIDO, CERRADO_CON_INCIDENCIAS, CANCELADO | Cancelación ordinaria solo antes de despacho; incidencias posteriores quedan auditadas |
| Resultado | Reutilizar estados actuales | Solo muestras aptas habilitan captura conforme a reglas existentes |
| Liquidación | BORRADOR, APROBADA_INTERNA, ENVIADA, OBSERVADA, APROBADA_CLIENTE | Cambios de contenido producen nueva revisión |
| Facturación y pago | Dimensiones separadas | Una liquidación puede estar aprobada sin factura o facturada con pago parcial |
| Exportación | GENERADA, CARGA_CONFIRMADA, CARGA_FALLIDA, SUSTITUIDA | Generar archivo no confirma importación en Prevecon |

La facturación externa y sus abonos se vinculan explícitamente a los cargos/liquidaciones cubiertos. No se fuerza un único estado que mezcle aprobación, facturación y pago.

### Cargos

Una prueba genera exactamente un cargo base cuando todas sus coberturas requeridas están aceptadas. La condición y creación del cargo deben ser atómicas o reconciliables e idempotentes. Aceptar dos veces o reponer una muestra no duplica el cargo.

Prueba rechazada antes de habilitarse y nunca repuesta: sin deuda. Reposición: misma línea facturable y cadena clínica. Cancelación por cliente después de entrar a proceso: conserva cargo. Error de procesamiento: anulación/corrección clínica según permisos y ajuste económico autorizado, conservando ambos historiales.

Fecha de productividad: fecha de habilitación por aceptación completa de muestras de esa prueba, usando calendario de America/Lima. No mover cargos históricos al mes de finalización del informe ni al mes de facturación. Propuesta para pruebas sin muestra física: definir evento equivalente de entrada a proceso antes de admitirlas en este circuito.

### Plazos

Toma externa: primera recepción en Lab Fray, incluida sucursal. Toma por Lab Fray en clínica: fecha/hora de toma declarada, marcada si es aproximada. Trasladar a central no reinicia el plazo.

Propuesta: reposiciones y cambios de compromiso conservan el compromiso original y registran una revisión explícita; no reiniciar silenciosamente el reloj. Los plazos especiales/urgentes quedan guardados por atención o prueba.

### Comisiones

Orden acordado: precio final después de descuentos comerciales; restar deducibles de derivación/insumos; retirar impuesto; aplicar porcentaje del médico.

Si el remanente incluye una tasa uniforme t, la fórmula propuesta es: base sin impuesto = (importe final elegible − deducibles) / (1 + t); comisión = base sin impuesto × porcentaje. Esto formaliza la regla comercial indicada, no constituye una regla tributaria general. La tasa y si cada importe incluye impuesto deben estar expresamente configuradas; no se deducen del nombre de la prueba.

Calcular por líneas elegibles cuando existan tratamientos diferentes. Conservar porcentaje, deducibles y tratamiento aplicados. Administrador autorizado puede cambiar deducibles con motivo. Cancelaciones parciales recalculan las pruebas vigentes. Propuesta: si una comisión ya fue liquidada/pagada, registrar ajuste de diferencia, nunca eliminar el pago previo. Base negativa o configuración tributaria incompleta requiere revisión, no un cálculo silencioso.

## 6. Integración Prevecon

### Evidencia revisada

- Fuente de pacientes: `C:/Users/nando/Desktop/EXPORT LABORATORIO.xlsx`, hoja Worksheet. En el ejemplo hay 27 registros y 124 columnas usadas; dos filas de cabeceras. No incluye selección efectiva de pruebas. HC incompleta, nacimiento vacío y sin una columna explícita de sexo en la estructura revisada.
- Plantilla de salida: `C:/Users/nando/Desktop/planilla_ingreso_resultado.xlsx`, hoja Consolidado, 232 columnas (A:HX). El usuario confirma que su cantidad y orden son obligatorios. Hoja1 no es el contrato de importación.
- Consolidado contiene cabeceras repetidas, bloques SI/NO y bloques de resultados. N° LAB es el correlativo mensual de atención asignado por Lab Fray en Prevecon.
- La aceptación de parciales y el borrado por celdas vacías son comportamientos confirmados por el usuario; todavía no probados contra el sistema de Prevecon.

### Importación

1. Validar estructura y leer identificadores como texto, conservando ceros iniciales.
2. Mostrar previsualización, errores por fila, coincidencias y atenciones ya existentes.
3. Identidad de atención propuesta: tercero + código externo de atención; verificar alcance de unicidad con datos reales antes de crear índice definitivo. El DNI identifica paciente, no una visita.
4. Conservar HC externa, código de atención, empresa empleadora y tipo de examen en contexto externo separado.
5. No sustituir HC externa faltante por HC Lab Fray ni usar el correlativo mensual como identificador externo universal.
6. Capturar manualmente pruebas, sexo y datos faltantes. La lista de cabeceras del archivo no genera solicitudes automáticamente.
7. Registrar correlativo ya asignado en la clínica. Clave propuesta: tercero + período mensual + correlativo; el alcance por sede se confirma con una muestra operativa si aparecen colisiones. No renumerar tubos recibidos para resolver errores.
8. Confirmar asociación de recipientes por correlativo, nombre y contexto de atención; detener asociaciones ambiguas para revisión.

### Contrato de salida

Mantener versión de plantilla con 232 definiciones ordenadas: índice, cabecera exacta, bloque, origen del valor y regla de transformación. Cabeceras repetidas se distinguen por posición y bloque. No ordenar alfabéticamente, eliminar columnas vacías ni renombrar encabezados.

Cada columna se clasifica como identificación, indicador de prueba, resultado, resumen/comentario o campo sin correspondencia. Una correspondencia ambigua queda pendiente de configuración; no se rellenan resultados por semejanza de nombres.

Los SI/NO se derivan de pruebas solicitadas vigentes y su correspondencia configurada. Cada celda de resultado procede de un ítem o transformación explícita, con compatibilidad de unidades, formato numérico/textual y vocabulario. Los campos compuestos necesitan reglas revisadas; no basta mapear un nombre de prueba al de una columna.

Exportar una fila completa por atención seleccionada, incluyendo todos sus resultados liberados vigentes, tanto nuevos como enviados antes. No exportar resultados en borrador ni convertir pendiente en normal/negativo/cero. Diferenciar pendiente, no solicitado y resultado anulado. El uso literal de «No incluye en protocolo» se configura por columna a partir de la plantilla validada, no se generaliza sin revisión.

Advertir antes de exportar si una celda que se envió con valor quedaría vacía por anulación/corrección. El vaciado intencional requiere trazabilidad y revisión. El último Excel no sustituye la fuente clínica actual.

Lab Fray será la fuente propuesta para los resultados que exporta. Una edición exclusiva en Prevecon puede ser sobrescrita: el operador debe poder registrar o conciliar esa corrección antes de una nueva carga. No es posible detectar cambios remotos con estos archivos de entrada.

Guardar por exportación: usuario, fecha, versión de plantilla/mapeo, atenciones y versiones de resultados, valores enviados, huella del archivo y estado de carga reportado. Confirmar carga manualmente; no presentar una descarga como envío exitoso.

La plantilla reutilizable de producción debe contener estructura y estilos, sin pacientes/resultados del archivo de ejemplo. Los originales no se modifican.

## 7. Modelo de datos propuesto

Los nombres son orientativos hasta la implementación. Todos los documentos transaccionales incluyen auditoría y control de concurrencia.

| Entidad | Contenido / relación |
| --- | --- |
| Tercero | Datos comerciales, papeles, sedes, contactos, vínculos a Empresa/RefMedico existentes cuando corresponda |
| ConvenioTercero | Versiones/vigencias, condiciones de pago, liquidación, preferencias y comisiones |
| TarifarioTercero | Estándar/especial; líneas de servicios facturables con precio y tratamiento tributario |
| IngresoTercero | Agrupación de llegada; sede, tercero, referencias a solicitudes, documentos y auditoría |
| SolicitudAtencion ampliada | Origen TERCERO, modalidad, tercero/sede, contexto externo, demografía declarada y condiciones históricas |
| MuestraLaboratorio ampliada | Procedencia de toma, dato externo o responsable Lab Fray, precisión temporal, primera recepción y vínculos de traslado |
| TrasladoMuestras | Manifiesto por recipiente/intento, origen/destino, despacho, temperaturas, recepciones e incidencias |
| CargoTercero | Solicitud + unidad facturable, evento que genera cargo, precio histórico, fecha, moneda y clave idempotente |
| AjusteEconomico | Débito/crédito explícito, concepto afectado, motivo, autorización y valores anteriores/nuevos |
| LiquidacionTercero | Período, revisión, líneas y totales congelados, aprobaciones y relación entre revisiones |
| FacturaExterna | Número, emisor, fecha, vencimiento, importe y asignación a liquidaciones/cargos |
| PagoTercero | Abono, medio, referencia y asignaciones a deuda; reversión auditada |
| ComisionMedica | Base por prueba, deducibles, impuestos, porcentaje, elegibilidad, revisión y ajustes |
| PagoComision | Pago al médico y asignaciones, separado del cobro al tercero |
| PlantillaIntegracion | Contrato ordenado de columnas y versiones de correspondencia |
| Importacion / ExportacionTercero | Archivo/huella, filas procesadas, errores, versiones y resultado de operación |

Propuesta de integridad: restricciones únicas para cargo por unidad facturable, asignaciones de identificadores y operaciones repetibles. Usar precisión monetaria consistente con el proyecto, evitando acumular errores binarios; definir redondeo de líneas y totales antes de implementar finanzas.

Los saldos se reconstruyen desde cargos, ajustes y asignaciones de pagos. Los totales almacenados son conciliables, no campos editables directamente. Bloquear sobreasignación de un abono y doble inclusión de un mismo cargo en liquidaciones activas.

## 8. Permisos y responsabilidades

| Acción | Recepción | Laboratorio central | Administración autorizada |
| --- | --- | --- | --- |
| Registrar pacientes, pruebas, ingreso y recipientes | Sí, con permiso | Sí, con permiso | Según función |
| Despachar/recibir traslado | Según sede y permiso | Según sede y permiso | No implícito |
| Aceptar/rechazar muestra | No por rol administrativo | Sí, con permiso | No implícito |
| Capturar/validar/liberar resultados | No | Permisos actuales separados | No implícito |
| Consultar precios/saldos | Según permiso | Según permiso | Sí |
| Modificar importes/deducibles y aprobar liquidación | No | No | Administrador/superadministrador autorizado |
| Registrar abonos/factura externa/pagos de comisión | Permiso financiero específico | No implícito | Sí, según permiso |
| Exportar resultados Prevecon | Permiso específico, solo liberados | Permiso específico | No permite liberar resultados |

Aplicar autorización en backend, además de ocultar acciones en frontend. Propuesta de permisos nuevos: TERCEROS_GESTIONAR, TERCEROS_REGISTRAR_ATENCION, TRASLADOS_DESPACHAR, TRASLADOS_RECIBIR, MUESTRAS_EVALUAR, TERCEROS_VER_FINANZAS, LIQUIDACIONES_AJUSTAR, LIQUIDACIONES_APROBAR, TERCEROS_REGISTRAR_PAGOS, COMISIONES_GESTIONAR y PREVECON_EXPORTAR. Revisar permisos existentes de muestras para no crear duplicidades.

## 9. Reutilización y puntos de cambio

Rutas relativas al frontend `Front-LABFRAY-2.0/src/app` y backend `Back-LABFRAY`.

| Código existente | Cambio previsto |
| --- | --- |
| Backend models/Gestion/SolicitudAtencion.js y controllers/Gestion/solicitudAtencionController.js | Añadir origen TERCERO y modalidad; constructor común de snapshot clínico sin exigir pago particular ni programación empresarial |
| Backend models/Mantenimiento/Paciente.js y flujos de conciliación | Extender origen provisional y contexto demográfico; revisar altas con documento sin domicilio disponible |
| Backend models/Gestion/MuestraLaboratorio.js y controllers/Gestion/muestraLaboratorioController.js | Recepción externa, toma retrospectiva, primera recepción, trazabilidad de traslado y aceptación central |
| Backend controllers/Gestion/resultadoLaboratorioController.js | Reutilizar cobertura de muestras, captura y liberación; ampliar filtros/orígenes y edad declarada |
| Backend utils/Gestion/validarIdentidadLiberacion.js | Excepción acotada por modalidad; conservar exigencia para particulares |
| Backend utils/Gestion/compromisoEntregaLaboratorio.js | Elegir inicio según modalidad; no usar siempre recolección |
| Backend entregaResultadoLaboratorioController y despachoResultadoLaboratorioController | Contexto de tercero, destinatarios y preferencias de informe |
| Backend utils/permisosAccion.js y middleware de permisos | Acciones nuevas, autorización financiera y ámbito de sede |
| Frontend models/Gestion y services/gestion | Ampliar contratos, filtros y DTO; añadir servicios específicos de terceros/traslados/finanzas/integración |
| Frontend pages/gestionar/toma-muestras | Reutilizar diálogos y evidencias donde la semántica coincida; crear entrada específica para terceros |
| Frontend pages/gestionar/resultados-laboratorio y entrega-resultados | Filtros, contexto externo y acciones de exportación |
| Frontend services/utilitarios/pdf/laboratorio/informe-laboratorio-pdf.service.ts | Variante sin membrete, edad declarada y datos del remitente conservando firma/verificación |
| Frontend app.routes.ts y navegación | Incorporar pantallas con permisos; preservar rutas actuales |

Las atenciones de médicos referentes conservan origen PARTICULAR y agregan contexto comercial de referencia/comisión. No deben marcarse TERCERO para eludir su requisito de DNI.

No se harán reemplazos globales de EMPRESA por TERCERO: las validaciones, consultas, bandejas, PDF y resúmenes tienen supuestos propios. Se debe buscar cada bifurcación de origen y probar compatibilidad.

## 10. Contratos de operaciones propuestos

- Maestros: listar/crear/editar tercero, sedes, convenios y versiones de tarifa.
- Ingreso: previsualizar importación, confirmar filas válidas, crear atención manual, agregar/cancelar prueba y adjuntar orden.
- Muestras: recibir externa, registrar toma retrospectiva, despachar traslado, cotejar recepción, aceptar/rechazar/reposición mediante reglas existentes extendidas.
- Finanzas: consultar cargos, preparar/revisar liquidación, registrar ajuste, aprobar, registrar aprobación externa, factura y abono/asignaciones.
- Comisiones: calcular elegibilidad, revisar deducibles, aprobar cálculo y registrar pago/ajuste.
- Integración: validar correspondencia, previsualizar fila completa, generar archivo, registrar confirmación/fallo de carga.

Los comandos que cambian estado validan versión esperada e idempotencia. Respuestas masivas informan filas procesadas y errores por fila sin presentar éxito total si hubo fallos. No implementar generación de deuda solamente desde el frontend.

## 11. Entregas de implementación

1. **Fundación:** tercero/sedes/convenios/tarifas, permisos, origen y demografía. Contratos compatibles con PARTICULAR y EMPRESA.
2. **Ingreso clínico completo:** solicitud, recipientes, recepción externa/toma retrospectiva, traslado, aceptación central y reposición. Registrar desde esta etapa el precio histórico y evento de generación de cargo, aunque la pantalla de liquidación llegue después.
3. **Prevecon operativo:** importar pacientes, capturar pruebas/correlativo, etiquetar, mapear plantilla, exportar fila completa y auditar cargas. Revisar cada columna con ejemplos controlados.
4. **Liquidaciones y cobros:** productividad, ajustes, aprobación, factura externa, vencimiento y abonos.
5. **Referencias médicas y comisiones:** integrar atención particular, elegibilidad, deducibles, ajustes y pagos.
6. **Reportes e integración final:** informes sin membrete, trazabilidad, saldos, conciliaciones y pruebas de regresión.

Las entregas son incrementos internos; no significan que la primera versión acordada excluya finanzas o comisiones. No activar el módulo en producción con atenciones económicas sin captura durable de cargos.

## 12. Criterios de aceptación

| Caso | Resultado esperado |
| --- | --- |
| Tercero sin DNI, nombre y edad completos | Procesa y libera con excepción trazable; no inventa documento/nacimiento |
| Particular referido sin DNI | Mantiene bloqueo correspondiente |
| Homónimos sin documento | No se unen automáticamente |
| Reimportar el mismo Excel | No duplica pacientes vinculados, atenciones, muestras ni cargos |
| Cambio de tarifario | No altera precios históricos; nuevas atenciones usan versión vigente |
| Un recipiente sirve a varias pruebas | Se conserva una identidad física con múltiples coberturas |
| Una prueba exige dos recipientes, falta uno | No habilita esa prueba ni genera cargo; otras continúan |
| Reposición de muestra rechazada | Mismo contexto de orden y correlativo, nuevo intento; sin cobro duplicado |
| Aceptación repetida/concurrente | Un solo cargo base por unidad facturable |
| Ingreso en sucursal y traslado | Primera recepción conservada; manifiesto, temperaturas y responsables auditados |
| Recepción por personal administrativo | No otorga aceptación técnica automática |
| Hora de toma aproximada | Se conserva su precisión y fecha de digitación separada |
| Prueba aceptada al cierre de mes | Cargo en ese mes local, aunque resultado/factura sean posteriores |
| Cancelación por cliente tras proceso | Conserva cargo; corrección por error usa ajuste autorizado |
| Ajustar liquidación ya emitida | Conserva revisión original e historial; no borra prueba clínica |
| Abono parcial | Saldo correcto y asignación sin duplicidad |
| Comisión con cancelación/reembolso parcial | Usa pruebas vigentes, monto final, deducibles, impuesto y porcentaje históricos |
| Segundo envío parcial de resultados | Conserva todos los resultados liberados previos en fila completa |
| Resultado anulado antes de reexportar | Identifica celdas que se vaciarán y exige revisión de cambio |
| Plantilla alterada | No genera archivo como compatible; informa diferencia de columna/orden |
| DNI con cero inicial | Conserva identidad textual en importación y exportación |
| Informe sin membrete | Mantiene firma, identificador y verificación |

Validación: pruebas de dominio para dinero/estados/idempotencia, integración transaccional, permisos negativos, regresión de particulares y empresas y comparación estructural del Excel. Una carga controlada en Prevecon debe confirmar compatibilidad real; no basta que Excel abra el archivo.

## 13. Decisiones técnicas pendientes de verificación

No bloquean esta especificación; deben resolverse con evidencia al implementar, sin asumir comportamientos silenciosamente:

- Correspondencia exacta de cada columna de Consolidado con ítems actuales, unidades y vocabulario; tratamiento de columnas compuestas y cancelaciones SI/NO.
- Unicidad real del código externo de atención y alcance del correlativo mensual si Prevecon incorpora más sedes.
- Tasas/tratamientos tributarios de los importes y deducibles, reglas de redondeo y distribución de descuentos globales para comisiones.
- Regla de compromiso ante reposición, y comportamiento clínico de referencias cuando falte sexo o edad suficiente.
- Integración de ámbitos de sede con usuarios actuales y reutilización de permisos de muestras existentes.
- Identificación de columnas que Prevecon exige aunque estén vacías (por ejemplo HC), y ensayo de importación sin alterar la estructura.
- Ajustes del maestro de pacientes para admitir correctamente datos externos sin exigir datos domiciliarios no disponibles.

## 14. Alcance de la revisión realizada

Se revisaron modelos, rutas, controladores y servicios relacionados con cotizaciones, pagos, solicitudes, muestras, resultados, identidad, entrega, PDF y permisos, además de la estructura y datos de los dos Excel proporcionados. No se consultó una base de datos, no se ejecutó el flujo en producción y no se verificó el importador de Prevecon. Este archivo es el único cambio de esta entrega.
