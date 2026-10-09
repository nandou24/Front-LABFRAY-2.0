import { Injectable } from '@angular/core';

export interface IArchivoZip {
  nombre: string;
  blob: Blob;
}

interface IEntradaCentralZip {
  nombre: Uint8Array;
  crc32: number;
  tamano: number;
  offset: number;
  fecha: Date;
}

@Injectable({ providedIn: 'root' })
export class ZipArchivosService {
  private readonly tablaCrc32 = this.construirTablaCrc32();

  // ====== Crear ZIP sin dependencias externas ======
  async crear(archivos: IArchivoZip[]): Promise<Blob> {
    if (!archivos.length) {
      throw new Error('No existen archivos para comprimir');
    }

    if (archivos.length > 65535) {
      throw new Error('La cantidad de archivos excede el límite del formato ZIP');
    }

    const partesLocales: BlobPart[] = [];
    const entradasCentrales: IEntradaCentralZip[] = [];
    let offset = 0;

    for (const archivo of archivos) {
      const nombre = new TextEncoder().encode(this.normalizarNombre(archivo.nombre));
      const contenido = new Uint8Array(await archivo.blob.arrayBuffer());
      const crc32 = this.calcularCrc32(contenido);
      const fecha = new Date();
      const cabeceraLocal = this.crearCabeceraLocal({
        nombre,
        crc32,
        tamano: contenido.byteLength,
        fecha,
      });

      partesLocales.push(this.aArrayBuffer(cabeceraLocal));
      partesLocales.push(this.aArrayBuffer(nombre));
      partesLocales.push(this.aArrayBuffer(contenido));

      entradasCentrales.push({
        nombre,
        crc32,
        tamano: contenido.byteLength,
        offset,
        fecha,
      });

      offset += cabeceraLocal.byteLength + nombre.byteLength + contenido.byteLength;
    }

    const partesCentrales: BlobPart[] = [];
    let tamanoDirectorioCentral = 0;

    for (const entrada of entradasCentrales) {
      const cabeceraCentral = this.crearCabeceraCentral(entrada);
      partesCentrales.push(this.aArrayBuffer(cabeceraCentral));
      partesCentrales.push(this.aArrayBuffer(entrada.nombre));
      tamanoDirectorioCentral += cabeceraCentral.byteLength + entrada.nombre.byteLength;
    }

    const finDirectorio = this.crearFinDirectorioCentral({
      totalEntradas: entradasCentrales.length,
      tamanoDirectorioCentral,
      offsetDirectorioCentral: offset,
    });

    return new Blob(
      [
        ...partesLocales,
        ...partesCentrales,
        this.aArrayBuffer(finDirectorio),
      ],
      { type: 'application/zip' },
    );
  }

  // ====== Cabecera local ======
  private crearCabeceraLocal({
    nombre,
    crc32,
    tamano,
    fecha,
  }: {
    nombre: Uint8Array;
    crc32: number;
    tamano: number;
    fecha: Date;
  }): Uint8Array {
    const cabecera = new Uint8Array(30);
    const vista = new DataView(cabecera.buffer);
    const { horaDos, fechaDos } = this.obtenerFechaDos(fecha);

    vista.setUint32(0, 0x04034b50, true);
    vista.setUint16(4, 20, true);
    vista.setUint16(6, 0x0800, true);
    vista.setUint16(8, 0, true);
    vista.setUint16(10, horaDos, true);
    vista.setUint16(12, fechaDos, true);
    vista.setUint32(14, crc32, true);
    vista.setUint32(18, tamano, true);
    vista.setUint32(22, tamano, true);
    vista.setUint16(26, nombre.byteLength, true);
    vista.setUint16(28, 0, true);

    return cabecera;
  }

  // ====== Cabecera central ======
  private crearCabeceraCentral(entrada: IEntradaCentralZip): Uint8Array {
    const cabecera = new Uint8Array(46);
    const vista = new DataView(cabecera.buffer);
    const { horaDos, fechaDos } = this.obtenerFechaDos(entrada.fecha);

    vista.setUint32(0, 0x02014b50, true);
    vista.setUint16(4, 20, true);
    vista.setUint16(6, 20, true);
    vista.setUint16(8, 0x0800, true);
    vista.setUint16(10, 0, true);
    vista.setUint16(12, horaDos, true);
    vista.setUint16(14, fechaDos, true);
    vista.setUint32(16, entrada.crc32, true);
    vista.setUint32(20, entrada.tamano, true);
    vista.setUint32(24, entrada.tamano, true);
    vista.setUint16(28, entrada.nombre.byteLength, true);
    vista.setUint16(30, 0, true);
    vista.setUint16(32, 0, true);
    vista.setUint16(34, 0, true);
    vista.setUint16(36, 0, true);
    vista.setUint32(38, 0, true);
    vista.setUint32(42, entrada.offset, true);

    return cabecera;
  }

  // ====== Fin del directorio central ======
  private crearFinDirectorioCentral({
    totalEntradas,
    tamanoDirectorioCentral,
    offsetDirectorioCentral,
  }: {
    totalEntradas: number;
    tamanoDirectorioCentral: number;
    offsetDirectorioCentral: number;
  }): Uint8Array {
    const fin = new Uint8Array(22);
    const vista = new DataView(fin.buffer);

    vista.setUint32(0, 0x06054b50, true);
    vista.setUint16(4, 0, true);
    vista.setUint16(6, 0, true);
    vista.setUint16(8, totalEntradas, true);
    vista.setUint16(10, totalEntradas, true);
    vista.setUint32(12, tamanoDirectorioCentral, true);
    vista.setUint32(16, offsetDirectorioCentral, true);
    vista.setUint16(20, 0, true);

    return fin;
  }

  // ====== Fecha DOS del formato ZIP ======
  private obtenerFechaDos(fecha: Date): { horaDos: number; fechaDos: number } {
    const anio = Math.min(2107, Math.max(1980, fecha.getFullYear()));
    const mes = fecha.getMonth() + 1;
    const dia = fecha.getDate();
    const hora = fecha.getHours();
    const minuto = fecha.getMinutes();
    const segundo = Math.floor(fecha.getSeconds() / 2);

    return {
      horaDos: (hora << 11) | (minuto << 5) | segundo,
      fechaDos: ((anio - 1980) << 9) | (mes << 5) | dia,
    };
  }

  // ====== CRC32 ======
  private calcularCrc32(datos: Uint8Array): number {
    let crc = 0xffffffff;

    for (const byte of datos) {
      crc = (crc >>> 8) ^ this.tablaCrc32[(crc ^ byte) & 0xff];
    }

    return (crc ^ 0xffffffff) >>> 0;
  }

  private construirTablaCrc32(): Uint32Array {
    const tabla = new Uint32Array(256);

    for (let i = 0; i < 256; i += 1) {
      let valor = i;

      for (let bit = 0; bit < 8; bit += 1) {
        valor = (valor & 1) !== 0
          ? 0xedb88320 ^ (valor >>> 1)
          : valor >>> 1;
      }

      tabla[i] = valor >>> 0;
    }

    return tabla;
  }

  private normalizarNombre(nombre: string): string {
    return String(nombre || 'ARCHIVO.pdf')
      .replace(/[\\/:*?"<>|]+/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 180) || 'ARCHIVO.pdf';
  }

  private aArrayBuffer(datos: Uint8Array): ArrayBuffer {
    const copia = new Uint8Array(datos.byteLength);
    copia.set(datos);
    return copia.buffer;
  }
}
