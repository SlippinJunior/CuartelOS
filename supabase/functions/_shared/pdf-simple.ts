import { PDFDocument, StandardFonts, rgb } from "../_vendor/pdf-lib.esm.min.js";
import qrcode from "../_vendor/qrcode.js";

const ROJO = rgb(0.608, 0.11, 0.11);
const GRIS = rgb(0.48, 0.42, 0.38);
const NEGRO = rgb(0.17, 0.145, 0.13);
const CREMA = rgb(0.98, 0.97, 0.95);
const ANCHO = 595.28;
const ALTO = 841.89;
const MARGEN = 48;

function textoFecha(valor: unknown): string {
  const s = String(valor ?? "");
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
}

function textoPlano(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "-";
  return String(valor);
}

/** Constructor de PDF sencillo para actas y órdenes. */
export class DocumentoPdf {
  private pdf!: PDFDocument;
  private page!: any;
  private y = 760;
  private normal!: any;
  private negrita!: any;
  private titulo = "";
  private subtitulo = "";
  private folio = "";
  private url = "";

  static async crear(titulo: string, subtitulo: string, folio: string, urlVerificacion: string) {
    const d = new DocumentoPdf();
    d.pdf = await PDFDocument.create();
    d.normal = await d.pdf.embedFont(StandardFonts.Helvetica);
    d.negrita = await d.pdf.embedFont(StandardFonts.HelveticaBold);
    d.titulo = titulo;
    d.subtitulo = subtitulo;
    d.folio = folio;
    d.url = urlVerificacion;
    d.nuevaPagina(true);
    return d;
  }

  private nuevaPagina(primera = false) {
    this.page = this.pdf.addPage([ANCHO, ALTO]);
    this.page.drawRectangle({ x: 0, y: 792, width: ANCHO, height: 50, color: ROJO });
    this.texto("CUERPO DE BOMBEROS DE LIMACHE", MARGEN, 823, 8.5, this.normal, rgb(1, 1, 1));
    this.texto("SEGUNDA COMPAÑÍA", MARGEN, 806, 15, this.negrita, rgb(1, 1, 1));
    this.texto("ATENCIÓN · SACRIFICIO · LEALTAD", MARGEN, 797, 6.5, this.normal, rgb(1, 0.95, 0.92));
    this.texto("FOLIO", ANCHO - MARGEN - 70, 823, 7.5, this.normal, rgb(1, 0.9, 0.88));
    this.texto(this.folio, ANCHO - MARGEN - 70, 806, 13, this.negrita, rgb(1, 1, 1));
    this.y = 765;
    if (primera) {
      this.texto(this.titulo, MARGEN, this.y, 15, this.negrita, NEGRO);
      this.y -= 6;
      this.page.drawLine({ start: { x: MARGEN, y: this.y }, end: { x: ANCHO - MARGEN, y: this.y }, thickness: 1.4, color: ROJO });
      this.y -= 18;
      if (this.subtitulo) {
        this.texto(this.subtitulo, MARGEN, this.y, 10.5, this.negrita, GRIS);
        this.y -= 20;
      }
    } else {
      this.texto(`${this.titulo} · ${this.subtitulo}`, MARGEN, this.y, 9, this.negrita, GRIS);
      this.y -= 20;
    }
  }

  private asegurar(espacio = 40) {
    if (this.y < espacio + 80) this.nuevaPagina(false);
  }

  texto(t: string, x: number, yy: number, size = 10, font = this.normal, color = NEGRO) {
    this.page.drawText(t, { x, y: yy, size, font, color });
  }

  private envolver(t: string, size: number, max = ANCHO - MARGEN * 2): string[] {
    const palabras = t.split(/\s+/);
    const lineas: string[] = [];
    let actual = "";
    for (const palabra of palabras) {
      const prueba = actual ? `${actual} ${palabra}` : palabra;
      if (this.normal.widthOfTextAtSize(prueba, size) > max && actual) {
        lineas.push(actual);
        actual = palabra;
      } else {
        actual = prueba;
      }
    }
    if (actual) lineas.push(actual);
    return lineas;
  }

  seccion(titulo: string) {
    this.asegurar(110);
    this.y -= 8;
    this.texto(titulo.toUpperCase(), MARGEN, this.y, 9.5, this.negrita, ROJO);
    this.y -= 5;
    this.page.drawLine({ start: { x: MARGEN, y: this.y }, end: { x: ANCHO - MARGEN, y: this.y }, thickness: 0.6, color: ROJO });
    this.y -= 14;
  }

  parrafo(t: string, size = 10, color = NEGRO) {
    const lineas = this.envolver(textoPlano(t), size);
    for (const linea of lineas) {
      this.asegurar();
      this.texto(linea, MARGEN, this.y, size, this.normal, color);
      this.y -= size + 3;
    }
    this.y -= 3;
  }

  campo(etiqueta: string, valor: unknown, size = 9.5) {
    this.asegurar(90);
    this.texto(etiqueta.toUpperCase(), MARGEN, this.y, 7.5, this.normal, GRIS);
    this.y -= 12;
    this.parrafo(textoPlano(valor), size, NEGRO);
    this.y -= 2;
  }

  caja(resumen: Array<[string, string]>) {
    this.asegurar(110);
    const alto = 22 + resumen.length * 14;
    this.page.drawRectangle({ x: MARGEN, y: this.y - alto, width: ANCHO - MARGEN * 2, height: alto, color: CREMA });
    let yy = this.y - 14;
    for (const [etiqueta, valor] of resumen) {
      this.texto(etiqueta, MARGEN + 10, yy, 8, this.normal, GRIS);
      this.texto(valor, MARGEN + 170, yy, 9.5, this.negrita, NEGRO);
      yy -= 14;
    }
    this.y -= alto + 10;
  }

  lista(items: string[], numerada = false) {
    if (items.length === 0) {
      this.parrafo("Sin registro.", 9.5, GRIS);
      return;
    }
    items.forEach((item, i) => {
      this.asegurar(90);
      const prefijo = numerada ? `${i + 1}. ` : "• ";
      const lineas = this.envolver(prefijo + item, 9.5);
      lineas.forEach((linea, j) => {
        this.asegurar();
        if (j === 0) this.texto(linea, MARGEN, this.y, 9.5, this.normal, NEGRO);
        else this.texto(linea, MARGEN + 12, this.y, 9.5, this.normal, NEGRO);
        this.y -= 13;
      });
      this.y -= 2;
    });
  }

  finalizar() {
    const paginas = this.pdf.getPages();
    paginas.forEach((p, i) => {
      p.drawLine({ start: { x: MARGEN, y: 62 }, end: { x: ANCHO - MARGEN, y: 62 }, thickness: 0.4, color: GRIS });
      p.drawText(`Documento emitido por el sistema de gestión de la Segunda Compañía. Folio ${this.folio}.`, {
        x: MARGEN, y: 50, size: 7, font: this.normal, color: GRIS,
      });
      p.drawText(`Verifique en ${this.url}`, { x: MARGEN, y: 40, size: 6.5, font: this.normal, color: GRIS });
      p.drawText(`Página ${i + 1} de ${paginas.length}`, {
        x: ANCHO - MARGEN - 60, y: 40, size: 7, font: this.normal, color: GRIS,
      });
    });

    const ultima = paginas[paginas.length - 1];
    const qr = qrcode(0, "M");
    qr.addData(this.url);
    qr.make();
    const modulos = qr.getModuleCount();
    const tam = 58;
    const qx = ANCHO - MARGEN - tam;
    const qy = 70;
    ultima.drawRectangle({ x: qx - 4, y: qy - 4, width: tam + 8, height: tam + 8, color: rgb(1, 1, 1) });
    for (let fila = 0; fila < modulos; fila++) {
      for (let col = 0; col < modulos; col++) {
        if (qr.isDark(fila, col)) {
          ultima.drawRectangle({
            x: qx + (col * tam) / modulos,
            y: qy + tam - ((fila + 1) * tam) / modulos,
            width: tam / modulos,
            height: tam / modulos,
            color: NEGRO,
          });
        }
      }
    }
  }

  async bytes(): Promise<Uint8Array> {
    return new Uint8Array(await this.pdf.save());
  }
}

export { textoFecha };
