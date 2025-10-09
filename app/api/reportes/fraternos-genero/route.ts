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

    const [rows] = await connection.execute(`
      SELECT 
        b.nombre_bloque,
        COUNT(f.id) as total_fraternos,
        SUM(CASE WHEN f.genero = 'Masculino' THEN 1 ELSE 0 END) as varones,
        SUM(CASE WHEN f.genero = 'Femenino' THEN 1 ELSE 0 END) as mujeres
      FROM bloques b
      LEFT JOIN fraternos f ON f.bloque_id = b.id
      WHERE f.estado = 1
      GROUP BY b.id, b.nombre_bloque
      ORDER BY b.nombre_bloque
    `);

    await connection.end();

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
    page.drawText('REPORTE: DISTRIBUCIÓN POR GÉNERO', {
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

    // CONTENIDO PRINCIPAL
    let yPosition = height - 180;

    // Tarjeta de estadísticas
    page.drawRectangle({
      x: width - 160 - margin,
      y: yPosition - 45,
      width: 160,
      height: 40,
      color: secondaryColor,
    });

    const totalFraternos = (rows as any[]).reduce((sum, row) => sum + row.total_fraternos, 0);
    page.drawText('TOTAL FRATERNOS', {
      x: width - 150 - margin,
      y: yPosition - 20,
      size: 8,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    page.drawText(`${totalFraternos}`, {
      x: width - 150 - margin,
      y: yPosition - 40,
      size: 16,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    // TABLA ELEGANTE DE GÉNEROS
    yPosition -= 60;

    page.drawRectangle({
      x: margin,
      y: yPosition - 25,
      width: width - (margin * 2),
      height: 25,
      color: rgb(0.95, 0.95, 0.95),
    });

    // Encabezados de tabla
    page.drawText('BLOQUE', { x: margin + 10, y: yPosition - 18, size: 9, font: boldFont, color: darkColor });
    page.drawText('TOTAL', { x: margin + 120, y: yPosition - 18, size: 9, font: boldFont, color: darkColor });
    page.drawText('VARONES', { x: margin + 180, y: yPosition - 18, size: 9, font: boldFont, color: darkColor });
    page.drawText('MUJERES', { x: margin + 250, y: yPosition - 18, size: 9, font: boldFont, color: darkColor });
    page.drawText('% VARONES', { x: margin + 320, y: yPosition - 18, size: 9, font: boldFont, color: darkColor });
    page.drawText('% MUJERES', { x: margin + 390, y: yPosition - 18, size: 9, font: boldFont, color: darkColor });

    yPosition -= 40;

    // Línea separadora
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    yPosition -= 20;

    // Datos de géneros
    (rows as any[]).forEach((bloque, index) => {
      if (yPosition < 100) {
        // NUEVA PÁGINA
        page = pdfDoc.addPage([600, 850]);
        yPosition = height - 80;
        
        // Logos en páginas siguientes
        if (logo1) {
          const logo1Dims = scaleImageToFit(logo1, 60, 45);
          page.drawImage(logo1, {
            x: margin,
            y: height - logo1Dims.height - 10,
            width: logo1Dims.width,
            height: logo1Dims.height,
          });
        }

        if (logo2) {
          const logo2Dims = scaleImageToFit(logo2, 60, 45);
          page.drawImage(logo2, {
            x: width - logo2Dims.width - margin,
            y: height - logo2Dims.height - 10,
            width: logo2Dims.width,
            height: logo2Dims.height,
          });
        }

        // Encabezado de tabla en nueva página
        page.drawRectangle({
          x: margin,
          y: yPosition - 25,
          width: width - (margin * 2),
          height: 25,
          color: rgb(0.95, 0.95, 0.95),
        });

        page.drawText('BLOQUE', { x: margin + 10, y: yPosition - 18, size: 9, font: boldFont, color: darkColor });
        page.drawText('TOTAL', { x: margin + 120, y: yPosition - 18, size: 9, font: boldFont, color: darkColor });
        page.drawText('VARONES', { x: margin + 180, y: yPosition - 18, size: 9, font: boldFont, color: darkColor });
        page.drawText('MUJERES', { x: margin + 250, y: yPosition - 18, size: 9, font: boldFont, color: darkColor });
        page.drawText('% VARONES', { x: margin + 320, y: yPosition - 18, size: 9, font: boldFont, color: darkColor });
        page.drawText('% MUJERES', { x: margin + 390, y: yPosition - 18, size: 9, font: boldFont, color: darkColor });

        yPosition -= 40;
        page.drawLine({
          start: { x: margin, y: yPosition },
          end: { x: width - margin, y: yPosition },
          thickness: 0.5,
          color: rgb(0.8, 0.8, 0.8),
        });
        yPosition -= 20;
      }

      // Fondo alternado para filas
      if (index % 2 === 0) {
        page.drawRectangle({
          x: margin,
          y: yPosition - 2,
          width: width - (margin * 2),
          height: 15,
          color: rgb(0.98, 0.98, 0.98),
        });
      }

      // Calcular porcentajes
      const porcentajeVarones = bloque.total_fraternos > 0 ? ((bloque.varones / bloque.total_fraternos) * 100).toFixed(1) : '0.0';
      const porcentajeMujeres = bloque.total_fraternos > 0 ? ((bloque.mujeres / bloque.total_fraternos) * 100).toFixed(1) : '0.0';

      // Datos
      page.drawText(bloque.nombre_bloque || 'Sin bloque', { x: margin + 10, y: yPosition, size: 8, font: font, color: darkColor });
      page.drawText(`${bloque.total_fraternos}`, { x: margin + 120, y: yPosition, size: 8, font: font, color: darkColor });
      page.drawText(`${bloque.varones}`, { x: margin + 180, y: yPosition, size: 8, font: font, color: darkColor });
      page.drawText(`${bloque.mujeres}`, { x: margin + 250, y: yPosition, size: 8, font: font, color: darkColor });
      page.drawText(`${porcentajeVarones}%`, { x: margin + 320, y: yPosition, size: 8, font: font, color: darkColor });
      page.drawText(`${porcentajeMujeres}%`, { x: margin + 390, y: yPosition, size: 8, font: font, color: darkColor });

      yPosition -= 15;
    });

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
        'Content-Disposition': 'attachment; filename="distribucion-genero-fmn.pdf"',
      },
    });

  } catch (error) {
    console.error('Error en reporte genero:', error);
    return NextResponse.json(
      { success: false, message: 'Error generando reporte PDF' },
      { status: 500 }
    );
  }
}