# Servicio de Exportación a Excel

Este servicio permite exportar datos de pagos a archivos Excel (.xlsx) con formato profesional.

## Características

- ✅ Exportación de reportes completos de pagos
- ✅ Exportación de pagos individuales
- ✅ Incluye estadísticas en hoja separada
- ✅ Formato de fecha localizado (es-PE)
- ✅ Cálculo automático de totales con recargos
- ✅ Columnas optimizadas para legibilidad

## Archivos creados

### Servicio principal

- `src/app/services/utilitarios/excel/excel-export.service.ts`
- `src/app/services/utilitarios/excel/excel-export.service.spec.ts`

### Dependencias agregadas

- `xlsx` - Librería para generar archivos Excel
- `@types/xlsx` - Tipos de TypeScript para xlsx

## Uso en el Reporte de Pagos

### Botón "Exportar Reporte"

- Genera un archivo Excel con todos los pagos filtrados
- Incluye una hoja con estadísticas del reporte
- Nombre del archivo: `reporte-pagos-YYYY-MM-DD_a_YYYY-MM-DD.xlsx`

### Botón "Exportar" por fila

- Genera un archivo Excel con los detalles de un pago específico
- Nombre del archivo: `pago-{codCotizacion}-{codPago}.xlsx`

## Estructura del Excel exportado

### Hoja "Pagos"

Contiene las siguientes columnas:

- Cotización
- Código Pago
- Cliente
- Documento
- Total Facturar
- Total Pagado
- Falta Pagar
- Medio de Pago
- Monto
- Recargo
- Monto Total (con recargo)
- Fecha Pago
- Nro Operación
- Estado
- Referencia Médica

### Hoja "Estadísticas" (solo en reporte completo)

- Total de Pagos
- Monto Total
- Monto Pagado
- Monto Faltante
- Pagos Completos
- Pagos Pendientes
- Ingresos por Medio de Pago

## Métodos del servicio

### `exportarPagosAExcel(datos, nombreArchivo?, estadisticas?)`

Exporta un array de pagos a Excel con estadísticas opcionales.

### `exportarDatosSimples(datos, nombreArchivo, nombreHoja?)`

Método genérico para exportar cualquier array de objetos a Excel.

## Características técnicas

- Formato de fecha: `dd/mm/yyyy` (es-PE)
- Moneda: `S/ XX.XX` (Soles peruanos)
- Ancho de columnas optimizado automáticamente
- Soporte para pagos con múltiples detalles
- Manejo de recargos incluidos en totales
- Filtrado automático de pagos anulados en estadísticas

## Mejoras futuras

- [ ] Agregar gráficos a las estadísticas
- [ ] Incluir filtros automáticos en Excel
- [ ] Agregar formato condicional para estados
- [ ] Exportación a PDF usando jsPDF (ya disponible en el proyecto)
