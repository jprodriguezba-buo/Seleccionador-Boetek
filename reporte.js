// reporte.js 
document.addEventListener('DOMContentLoaded', () => {
    const generarReporteBtn = document.getElementById('generar-reporte-btn');

     /**
     * NUEVA FUNCIÓN: Carga una imagen desde una URL y la convierte a Base64.
     * @param {string} url - La ruta a la imagen (ej. './Images/logo.png').
     * @returns {Promise<string>} - Una promesa que se resuelve con la imagen en formato data URI.
     */
    const imageToBase64 = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const dataURL = canvas.toDataURL('image/png');
                resolve(dataURL);
            };
            img.onerror = reject;
            img.src = url;
        });
    };

    // --- FUNCIONES AUXILIARES (Sin cambios, pero asegúrate de tenerlas) ---
    const addTitle = (doc, title, yPos) => { doc.setFontSize(16); doc.setTextColor(0, 86, 179); doc.text(title, 14, yPos); };
    const addElementToPdf = async (doc, elementId, currentY) => { const element = document.getElementById(elementId); if (!element) { console.warn(`Elemento HTML "${elementId}" no encontrado.`); return currentY; } const canvas = await html2canvas(element, { scale: 2, logging: false, useCORS: true }); const imgData = canvas.toDataURL('image/png'); return addImageToPage(doc, imgData, currentY, canvas.width, canvas.height); };
    const addChartToPdf = (doc, chartName, currentY) => { const imgData = window.getChartImage(chartName); if (!imgData) { console.warn(`Gráfico "${chartName}" no encontrado.`); return currentY; } return addImageToPage(doc, imgData, currentY, 1000, 500, 0.7); };
    const addImageToPage = (doc, imgData, currentY, canvasWidth = 1000, canvasHeight = 500, scaleFactor = 1.0) => { const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight = doc.internal.pageSize.getHeight(); const margin = 14; const imgWidth = pageWidth - (margin * 2); const imgHeight = ((canvasHeight * imgWidth) / canvasWidth) * scaleFactor; if (currentY + imgHeight > pageHeight - margin) { doc.addPage(); currentY = margin + 10; } doc.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight); return currentY + imgHeight + 10; };

const generarPDF = async () => {
    generarReporteBtn.disabled = true;
    generarReporteBtn.textContent = 'Generando Reporte...';
    const originalStyles = new Map();
    try {
        const logoBase64 = await imageToBase64('./Images/Boetek PNG.png');

        const toggleableElementIds = [
            'comparative-table-container', 'selection-table-container', 
            'peak-hours-container', 'instant-flow-container',
            'line-chart-container', 'bar-chart-container', 
            'monthly-chart-container', 'efficiency-chart-container'
        ];
        
        toggleableElementIds.forEach(id => { 
            const el = document.getElementById(id); 
            if (el) { 
                originalStyles.set(id, el.style.display); 
                el.style.display = 'block'; 
            } 
        });

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const addHeader = (data) => {
            // Si 'data.doc' existe, es del hook; si no, 'data' es el doc mismo.
            const docInstance = data.doc ? data.doc : data;

            const pageWidth = docInstance.internal.pageSize.getWidth();
            const margin = 14;
            docInstance.addImage(logoBase64, 'PNG', pageWidth - margin - 40, 8, 40, 10);
            docInstance.setDrawColor(200, 200, 200);
            docInstance.line(margin, 22, pageWidth - margin, 22);
        };
        // --- DIBUJAMOS EL ENCABEZADO EN LA PRIMERA PÁGINA ---
        addHeader(doc);

        let yPos = 30; // Posición inicial después del header
        const inputData = window.getInputDataForReport(); 
        
        addTitle(doc, 'Resumen del Proyecto', yPos);
        yPos += 8;

        // TABLA 1: Detalle de Departamentos
        if (inputData.metodoCalculo === 'departamentos' && inputData.detalleDepartamentos.length > 0) {
            doc.autoTable({
                startY: yPos,
                head: [['Cant. De Dormitorios', 'Pers / depto', 'Unidades', 'Total Personas']],
                body: inputData.detalleDepartamentos,
                theme: 'grid',
                headStyles: { fillColor: [0, 86, 179] },
                didParseCell: function (data) {
                    if (data.row.raw[0] === 'Total') {
                        data.cell.styles.fillColor = '#f2f2f2';
                        data.cell.styles.fontStyle = 'bold';
                    }
                },
                didDrawPage: addHeader // <== AÑADIDO
            });
            yPos = doc.lastAutoTable.finalY + 10;
        }

        // TABLA 2: Parámetros del Sistema
        doc.autoTable({
            startY: yPos,
            head: [['Parámetros del Sistema', 'Valor']],
            body: [
                ['Método de Cálculo', inputData.metodoCalculoTexto],
                ['Total de Personas', inputData.totalPersonas.toFixed(1)],
                ['Tipo de Sistema', inputData.tipoSistemaTexto],
                ['Acumulación (Litros)', inputData.acumulacionIngresada],
                ...(inputData.tipoSistema === 'sala_calderas' 
                    ? [['Potencia Térmica (kW)', inputData.potenciaIngresada]]
                    : [['Potencia Bombas de Calor (kW)', inputData.pBC], ['Potencia R.E. (kW)', inputData.pRE]]
                )
            ],
            theme: 'grid',
            headStyles: { fillColor: [0, 86, 179] },
            didDrawPage: addHeader // <== AÑADIDO
        });
        yPos = doc.lastAutoTable.finalY + 10;

        // TABLA 3: Datos de Selección
        addTitle(doc, 'Datos de Selección', yPos);
        yPos += 8;
        doc.autoTable({
            startY: yPos,
            head: [['Parámetro de Selección', 'Valor']],
            body: [
                ['Guía de Demanda', inputData.demandaGuia.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())],
                ['Prom. L/persona/día', `${inputData.litrosPersonaDia} L`],
                ['Eficiencia de Generación', `${(inputData.eficiencia * 100).toFixed(0)}%`],
                ['% Uso Acumulador', `${(inputData.usoAcumulador * 100).toFixed(0)}%`],
                ['Temperatura Agua Fría', `${inputData.tempFria}°C`],
                ['Temperatura de Acumulación', `${inputData.tempAcumulacion}°C`],
                ['Temperatura de Consumo', `${inputData.tempConsumo}°C`],
                ['Hora Punta', `${inputData.horaPuntaInicio}:00 - ${inputData.horaPuntaFin}:00`],
                ['Valor m³ Gas', `$${inputData.valorGas.toLocaleString('es-CL')}`],
                ['Valor kWh Electricidad', `$${inputData.valorKwh.toLocaleString('es-CL')}`]
            ],
            theme: 'grid',
            headStyles: { fillColor: [0, 86, 179] },
            didDrawPage: addHeader // <== AÑADIDO
        });

        // --- RESULTADOS Y ANÁLISIS ---
        doc.addPage();
        addHeader(doc); // <== AÑADIDO
        yPos = 30; // Resetear yPos para la nueva página
        addTitle(doc, 'Resultados de Selección y Análisis', yPos);
        yPos += 10;
        yPos = await addElementToPdf(doc, 'resultado-table', yPos);
        yPos = await addElementToPdf(doc, 'comparative-table-container', yPos);
        yPos = await addElementToPdf(doc, 'selection-table-container', yPos);
        if (inputData.tipoSistema !== 'sala_calderas') {
            yPos = await addElementToPdf(doc, 'peak-hours-container', yPos);
        }
        yPos = await addElementToPdf(doc, 'instant-flow-container', yPos);

        // --- GRÁFICOS ---
        doc.addPage();
        addHeader(doc); // <== AÑADIDO
        yPos = 30; // Resetear yPos para la nueva página
        addTitle(doc, 'Gráficos de Consumo y Eficiencia', yPos);
        yPos += 10;
        yPos = addChartToPdf(doc, 'line', yPos);
        yPos = addChartToPdf(doc, 'bar', yPos);
        yPos = addChartToPdf(doc, 'monthly', yPos);
        yPos = addChartToPdf(doc, 'efficiency', yPos);

        doc.save('Reporte-Calculadora-ACS-Boetek.pdf');

    } catch (error) {
        console.error('Error detallado al generar el PDF:', error);
        alert('Hubo un error al generar el reporte. Revisa la consola para más detalles.');
    } finally {
        originalStyles.forEach((style, id) => { const el = document.getElementById(id); if (el) el.style.display = style; });
        generarReporteBtn.disabled = false;
        generarReporteBtn.textContent = 'Generar Reporte PDF';
    }
};

    generarReporteBtn.addEventListener('click', generarPDF);
});