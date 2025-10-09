import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { dbConfig } from '@/lib/db-config'

async function loadImageToPdf(pdfDoc: PDFDocument, imagePath: string) {
  try {
    const fullPath = path.join(process.cwd(), 'public', imagePath);
    const imageBytes = fs.readFileSync(fullPath);
    const ext = path.extname(imagePath).toLowerCase();
    
    if (ext === '.png') {
      return await pdfDoc.embedPng(imageBytes);
    } else if (ext === '.jpg' || ext === '.jpeg') {
      return await pdfDoc.embedJpg(imageBytes);
    } else {
      throw new Error('Formato no soportado');
    }
  } catch (error) {
    console.warn('No se pudo cargar la imagen:', imagePath, error);
    return null;
  }
}

function scaleImageToFit(image: any, maxWidth: number, maxHeight: number) {
  const { width, height } = image;
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return image.scale(ratio);
}

export async function GET() {
  try {
    const connection = await mysql.createConnection(dbConfig);

    // Consultas para estadísticas generales
    const [totalFraternosRows] = await connection.execute(`SELECT COUNT(*) as total FROM fraternos`);
    const [activosRows] = await connection.execute(`SELECT COUNT(*) as total FROM fraternos WHERE estado = 1`);
    const [inactivosRows] = await connection.execute(`SELECT COUNT(*) as total FROM fraternos WHERE estado = 0`);
    const [varonesRows] = await connection.execute(`SELECT COUNT(*) as total FROM fraternos WHERE genero = 'Masculino'`);
    const [mujeresRows] = await connection.execute(`SELECT COUNT(*) as total FROM fraternos WHERE genero = 'Femenino'`);
    const [bloquesRows] = await connection.execute(`SELECT COUNT(*) as total FROM bloques`);
    const [sinHuellaRows] = await connection.execute(`SELECT COUNT(*) as total FROM fraternos WHERE huella_template IS NULL OR huella_template = ''`);
    const [eventosRows] = await connection.execute(`SELECT COUNT(*) as total FROM eventos WHERE fecha >= CURDATE()`);

    // Estadísticas por tipo de bloque
    const [bloquesTipoRows] = await connection.execute(`
      SELECT tipobloque, COUNT(*) as total 
      FROM bloques 
      GROUP BY tipobloque
    `);

    await connection.end();

    // Extraer datos
    const totalFraternos = (totalFraternosRows as any[])[0]?.total || 0;
    const fraternosActivos = (activosRows as any[])[0]?.total || 0;
    const fraternosInactivos = (inactivosRows as any[])[0]?.total || 0;
    const totalVarones = (varonesRows as any[])[0]?.total || 0;
    const totalMujeres = (mujeresRows as any[])[0]?.total || 0;
    const totalBloques = (bloquesRows as any[])[0]?.total || 0;
    const sinHuella = (sinHuellaRows as any[])[0]?.total || 0;
    const proximosEventos = (eventosRows as any[])[0]?.total || 0;

    // CREAR PDF ELEGANTE
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([600, 850]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // CARGAR DOS LOGOS
    const logo1 = await loadImageToPdf(pdfDoc, 'logo2026.png');
    const logo2 = await loadImageToPdf(pdfDoc, 'logofrate.png');

    // COLORES CORPORATIVOS
    const primaryColor = rgb(0.2, 0.4, 0.6);
    const secondaryColor = rgb(0.9, 0.3, 0.2);
    const accentColor = rgb(0.1, 0.7, 0.3);
    const darkColor = rgb(0.2, 0.2, 0.2);

    // ENCABEZADO ELEGANTE
    page.drawRectangle({
      x: 0,
      y: height - 140,
      width: width,
      height: 140,
      color: primaryColor,
    });

    // MÁRGENES Y PADDING
    const margin = 40;
    const padding = 15;

    // LOGO 1 (ESQUINA IZQUIERDA)
    if (logo1) {
      const logo1Dims = scaleImageToFit(logo1, 80, 60);
      page.drawImage(logo1, {
        x: margin,
        y: height - logo1Dims.height - padding,
        width: logo1Dims.width,
        height: logo1Dims.height,
      });
    }

    // LOGO 2 (ESQUINA DERECHA)
    if (logo2) {
      const logo2Dims = scaleImageToFit(logo2, 80, 60);
      page.drawImage(logo2, {
        x: width - logo2Dims.width - margin,
        y: height - logo2Dims.height - padding,
        width: logo2Dims.width,
        height: logo2Dims.height,
      });
    }

    // TÍTULOS CENTRADOS ENTRE LOS DOS LOGOS
    const titleX = margin + 100;
    const titleWidth = width - (margin * 2) - 200;

    page.drawText('FRATERNIDAD', {
      x: titleX,
      y: height - 60,
      size: 18,
      font: titleFont,
      color: rgb(1, 1, 1),
      maxWidth: titleWidth,
    });

    page.drawText('MORENOS NOVENANTES', {
      x: titleX,
      y: height - 85,
      size: 16,
      font: titleFont,
      color: rgb(1, 1, 1),
      maxWidth: titleWidth,
    });

    // LÍNEA DECORATIVA BAJO EL TÍTULO
    page.drawLine({
      start: { x: titleX, y: height - 100 },
      end: { x: titleX + titleWidth, y: height - 100 },
      thickness: 2,
      color: rgb(1, 1, 1),
    });

    // Título del reporte
    page.drawText('REPORTE: ESTADÍSTICAS GENERALES', {
      x: margin,
      y: height - 170,
      size: 14,
      font: boldFont,
      color: darkColor,
    });

    // Información de generación
    page.drawText(`Generado: ${new Date().toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, {
      x: margin,
      y: height - 180,
      size: 9,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // CONTENIDO PRINCIPAL - TARJETAS DE ESTADÍSTICAS
    let yPosition = height - 180;

    // PRIMERA FILA DE TARJETAS
    yPosition -= 30;

    // Tarjeta 1: Total Fraternos
    page.drawRectangle({
      x: margin,
      y: yPosition - 50,
      width: 160,
      height: 50,
      color: primaryColor,
    });

    page.drawText('TOTAL FRATERNOS', {
      x: margin + 10,
      y: yPosition - 25,
      size: 9,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    page.drawText(`${totalFraternos}`, {
      x: margin + 10,
      y: yPosition - 45,
      size: 20,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    // Tarjeta 2: Fraternos Activos
    page.drawRectangle({
      x: margin + 180,
      y: yPosition - 50,
      width: 160,
      height: 50,
      color: accentColor,
    });

    page.drawText('FRATERNOS ACTIVOS', {
      x: margin + 190,
      y: yPosition - 25,
      size: 9,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    page.drawText(`${fraternosActivos}`, {
      x: margin + 190,
      y: yPosition - 45,
      size: 20,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    // Tarjeta 3: Total Bloques
    page.drawRectangle({
      x: margin + 360,
      y: yPosition - 50,
      width: 160,
      height: 50,
      color: secondaryColor,
    });

    page.drawText('TOTAL BLOQUES', {
      x: margin + 370,
      y: yPosition - 25,
      size: 9,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    page.drawText(`${totalBloques}`, {
      x: margin + 370,
      y: yPosition - 45,
      size: 20,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    // SEGUNDA FILA DE TARJETAS
    yPosition -= 70;

    // Tarjeta 4: Distribución por Género
    page.drawRectangle({
      x: margin,
      y: yPosition - 50,
      width: 250,
      height: 50,
      color: rgb(0.8, 0.6, 0.2),
    });

    page.drawText('DISTRIBUCIÓN POR GÉNERO', {
      x: margin + 10,
      y: yPosition - 25,
      size: 9,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    page.drawText(`Varones: ${totalVarones} | Mujeres: ${totalMujeres}`, {
      x: margin + 10,
      y: yPosition - 45,
      size: 10,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    // Tarjeta 5: Sin Huella
    page.drawRectangle({
      x: margin + 270,
      y: yPosition - 50,
      width: 250,
      height: 50,
      color: rgb(0.8, 0.2, 0.2),
    });

    page.drawText('FRATERNOS SIN HUELLA', {
      x: margin + 280,
      y: yPosition - 25,
      size: 9,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    page.drawText(`${sinHuella}`, {
      x: margin + 280,
      y: yPosition - 45,
      size: 20,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    // TERCERA SECCIÓN: DETALLES ADICIONALES
    yPosition -= 80;

    page.drawText('DETALLES ADICIONALES', {
      x: margin,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: darkColor,
    });

    yPosition -= 20;

    // Lista de detalles
    const detalles = [
      `• Fraternos Inactivos: ${fraternosInactivos}`,
      `• Próximos Eventos: ${proximosEventos}`,
      `• Tasa de Actividad: ${totalFraternos > 0 ? ((fraternosActivos / totalFraternos) * 100).toFixed(1) : 0}%`,
      `• Distribución Género: ${totalFraternos > 0 ? ((totalVarones / totalFraternos) * 100).toFixed(1) : 0}% Varones, ${totalFraternos > 0 ? ((totalMujeres / totalFraternos) * 100).toFixed(1) : 0}% Mujeres`,
      `• Promedio por Bloque: ${totalBloques > 0 ? (totalFraternos / totalBloques).toFixed(1) : 0} fraternos/bloque`
    ];

    detalles.forEach((detalle, index) => {
      page.drawText(detalle, {
        x: margin + 10,
        y: yPosition - (index * 15),
        size: 9,
        font: font,
        color: darkColor,
      });
    });

    yPosition -= (detalles.length * 15) + 20;

    // CUARTA SECCIÓN: TIPOS DE BLOQUES
    if ((bloquesTipoRows as any[]).length > 0) {
      page.drawText('DISTRIBUCIÓN POR TIPO DE BLOQUE', {
        x: margin,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: darkColor,
      });

      yPosition -= 20;

      page.drawRectangle({
        x: margin,
        y: yPosition - 25,
        width: width - (margin * 2),
        height: 25,
        color: rgb(0.95, 0.95, 0.95),
      });

      page.drawText('TIPO DE BLOQUE', { x: margin + 10, y: yPosition - 18, size: 9, font: boldFont, color: darkColor });
      page.drawText('CANTIDAD', { x: margin + 200, y: yPosition - 18, size: 9, font: boldFont, color: darkColor });
      page.drawText('PORCENTAJE', { x: margin + 280, y: yPosition - 18, size: 9, font: boldFont, color: darkColor });

      yPosition -= 40;

      (bloquesTipoRows as any[]).forEach((tipo, index) => {
        if (yPosition < 100) {
          // NUEVA PÁGINA si es necesario
          page = pdfDoc.addPage([600, 850]);
          yPosition = height - 80;
        }

        const porcentaje = totalBloques > 0 ? ((tipo.total / totalBloques) * 100).toFixed(1) : '0.0';

        // Fondo alternado
        if (index % 2 === 0) {
          page.drawRectangle({
            x: margin,
            y: yPosition - 2,
            width: width - (margin * 2),
            height: 15,
            color: rgb(0.98, 0.98, 0.98),
          });
        }

        page.drawText(tipo.tipobloque || 'No especificado', { x: margin + 10, y: yPosition, size: 8, font: font, color: darkColor });
        page.drawText(`${tipo.total}`, { x: margin + 200, y: yPosition, size: 8, font: font, color: darkColor });
        page.drawText(`${porcentaje}%`, { x: margin + 280, y: yPosition, size: 8, font: font, color: darkColor });

        yPosition -= 15;
      });
    }

    // PIE DE PÁGINA
    const footerY = 50;
    page.drawLine({
      start: { x: margin, y: footerY + 15 },
      end: { x: width - margin, y: footerY + 15 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText(`Fraternidad Moreno Novenantes - Sistema de Gestión`, {
      x: margin,
      y: footerY,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    page.drawText(`Página 1 - ${new Date().getFullYear()}`, {
      x: width - margin - 80,
      y: footerY,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="estadisticas-generales-fmn.pdf"',
      },
    });

  } catch (error) {
    console.error('Error en reporte estadisticas-generales:', error);
    return NextResponse.json(
      { success: false, message: 'Error generando reporte PDF' },
      { status: 500 }
    );
  }
}