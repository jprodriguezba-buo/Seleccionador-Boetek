// reporte.js 
document.addEventListener('DOMContentLoaded', () => {
    const generarReporteBtn = document.getElementById('generar-reporte-btn');

    // --- OBJETOS DE ESTILO --- //
    const tituloEstilos = {
        fontSize: 14,
        fontStyle: 'bold',
        textColor: [0, 86, 179],
        fontFamily: 'helvetica'
    };

    const tablaEstilos = {
        headStyles: { 
            textColor: [40, 40, 40],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'left',
            lineWidth: { top: 0, right: 0, bottom: 0.5, left: 0 },
            lineColor: [128, 128, 128],
            cellPadding: 2
        },
        bodyStyles: { 
            fontSize: 9,
            textColor: [40, 40, 40],
            lineWidth: 0,
            cellPadding: 1
        }
    };

    // --- FUNCIÓN PARA AGREGAR TÍTULOS DE SECCIÓN --- //
    const addTitle = (doc, title, yPos) => {
        doc.setFontSize(tituloEstilos.fontSize);
        doc.setFont(tituloEstilos.fontFamily, tituloEstilos.fontStyle);
        doc.setTextColor(...tituloEstilos.textColor);
        doc.text(title, 14, yPos);
    };

    // --- FUNCIÓN PARA AGREGAR LÍNEA DE SEPARACIÓN --- //
    const addSectionSeparator = (doc, yPos, margin, pageWidth) => {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    };

    /**
     * NUEVA FUNCIÓN: Carga una imagen desde una URL y la convierte a Base64.
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

    // --- FUNCIONES AUXILIARES (Sin cambios, pero asegúrate de tenerlas) --- //
    const addElementToPdf = async (doc, elementId, currentY) => { const element = document.getElementById(elementId); if (!element) { console.warn(`Elemento HTML "${elementId}" no encontrado.`); return currentY; } const canvas = await html2canvas(element, { scale: 2, logging: false, useCORS: true }); const imgData = canvas.toDataURL('image/png'); return addImageToPage(doc, imgData, currentY, canvas.width, canvas.height); };
    const addChartToPdf = (doc, chartName, currentY) => { const imgData = window.getChartImage(chartName); if (!imgData) { console.warn(`Gráfico "${chartName}" no encontrado.`); return currentY; } return addImageToPage(doc, imgData, currentY, 1000, 500, 0.7); };
    const addImageToPage = (doc, imgData, currentY, canvasWidth = 1000, canvasHeight = 500, scaleFactor = 1.0) => { const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight = doc.internal.pageSize.getHeight(); const margin = 14; const imgWidth = pageWidth - (margin * 2); const imgHeight = ((canvasHeight * imgWidth) / canvasWidth) * scaleFactor; if (currentY + imgHeight > pageHeight - margin) { doc.addPage(); currentY = margin + 10; } doc.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight); return currentY + imgHeight + 10; };

    const generarPDF = async () => {
        // --- CONSTANTES DE PÁGINA ---
        const margin = 14;
        const pageWidth = 210; // A4 width in mm
        const halfWidth = (pageWidth - margin * 2) / 2;

        // Solicitar nombre y dirección del proyecto
        let projectNameInput = prompt('Por favor, ingrese el nombre del proyecto:', 'Proyecto ACS');
        if (projectNameInput === null) return;
        projectNameInput = projectNameInput.trim() || 'Proyecto Genérico Boetek';

        let direccionInput = prompt('Por favor, ingrese la dirección del proyecto:', '');
        if (direccionInput === null) return;
        direccionInput = direccionInput.trim() || 'Pendiente';

        generarReporteBtn.disabled = true;
        generarReporteBtn.textContent = 'Generando Reporte...';
        const originalStyles = new Map();
        try {
            const logoBase64 = await imageToBase64('./Images/Boetek PNG.png');

            // Mostrar todos los elementos HTML necesarios para los gráficos/tablas
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
            
            // --- HEADER ---
            const addHeader = (data) => {
                const docInstance = data.doc ? data.doc : data;
                docInstance.addImage(logoBase64, 'PNG', margin, 8, 40, 10);
                const title = 'Informe de Selección Boetek';
                docInstance.setFontSize(12);
                docInstance.setFont('helvetica', 'bold');
                docInstance.setTextColor(40, 40, 40);
                const titleWidth = docInstance.getTextWidth(title);
                docInstance.text(title, (pageWidth - titleWidth) / 2, 15);
                const now = new Date();
                const dateTimeString = now.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                docInstance.setFontSize(8);
                docInstance.setFont('helvetica', 'normal');
                docInstance.setTextColor(100, 100, 100);
                const dateWidth = docInstance.getTextWidth(dateTimeString);
                docInstance.text(dateTimeString, pageWidth - margin - dateWidth, 15);
                docInstance.setDrawColor(200, 200, 200);
                docInstance.line(margin, 22, pageWidth - margin, 22);
            };
            addHeader(doc);

            let yPos = 30;
            const inputData = window.getInputDataForReport();


            // --- RESUMEN DEL PROYECTO ---
            addTitle(doc, 'Resumen del Proyecto', yPos);
            addSectionSeparator(doc, yPos, margin, pageWidth);
            yPos += 6;

            // --- TABLA IZQUIERDA: Nombre y Dirección del Proyecto ---
            doc.autoTable({
                startY: yPos,
                head: [['Datos del Cliente', '']],
                body: [
                    ['Nombre del proyecto', projectNameInput],
                    ['Dirección', direccionInput]
                ],
                theme: 'plain',
                margin: { left: margin, right: pageWidth - margin - halfWidth + 5 },
                didDrawPage: addHeader,
                ...tablaEstilos
            });

            let finalY = doc.lastAutoTable.finalY;

            // --- TABLA DERECHA: Departamentos o Total de Personas ---
            if (inputData.metodoCalculo === 'departamentos' && inputData.detalleDepartamentos.length > 0) {
                let totalUnidades = 0;
                let totalPersonas = 0;
                inputData.detalleDepartamentos.forEach(row => {
                    const unidades = parseFloat(row[2]) || 0;
                    const personas = parseFloat(row[3]) || 0;
                    totalUnidades += unidades;
                    totalPersonas += personas;
                });
                const detalleConTotal = [...inputData.detalleDepartamentos, ['Total', '', totalUnidades, totalPersonas]];

                doc.autoTable({
                    startY: yPos,
                    head: [['Cant. Dorms', 'Pers/depto', 'Unidades', 'Total Pers.']],
                    body: detalleConTotal,
                    theme: 'plain',
                    margin: { left: margin + halfWidth + 5 },
                    didDrawPage: addHeader,
                    ...tablaEstilos,
                    didParseCell: function (data) {
                        if (data.row.index === detalleConTotal.length - 1) {
                            data.cell.styles.lineWidth = { top: 0.5, right: 0, bottom: 0, left: 0 };
                            data.cell.styles.lineColor = [128, 128, 128];
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                });
                finalY = Math.max(finalY, doc.lastAutoTable.finalY);
            } else if (inputData.metodoCalculo === 'total_personas') {
                // Si el método es por total de personas, muestra solo una fila con el total
                doc.autoTable({
                    startY: yPos,
                    head: [['Total de Personas', 'Valor']],
                    body: [
                        ['Total de Personas', inputData.totalPersonas || '']
                    ],
                    theme: 'plain',
                    margin: { left: margin + halfWidth + 5 },
                    didDrawPage: addHeader,
                    ...tablaEstilos
                });
                finalY = Math.max(finalY, doc.lastAutoTable.finalY);
            }

            yPos = finalY + 10;

            // --- DATOS DE SELECCIÓN ---
            addTitle(doc, 'Datos de Selección', yPos);
            addSectionSeparator(doc, yPos, margin, pageWidth);
            yPos += 8;

            // --- IMAGEN DIAGRAMA SEGÚN TIPO DE SISTEMA (al inicio de la sección) ---
            let diagramaImgPath = '';
            let imgWidth, imgHeight;
            if (inputData.tipoSistema === 'sala_calderas') {
                diagramaImgPath = './Images/Diagrama_SCM.png';
                imgWidth = 100;  // ancho en mm para Sala de Calderas
                imgHeight = 35; // alto en mm para Sala de Calderas
            } else {
                diagramaImgPath = './Images/Diagrama_MBC.png';
                imgWidth = 100;  // ancho en mm para Bomba de Calor
                imgHeight = 35; // alto en mm para Bomba de Calor
            }
            let diagramaBase64 = '';
            try {
                diagramaBase64 = await imageToBase64(diagramaImgPath);
            } catch (imgErr) {
                console.warn('No se pudo cargar el diagrama:', imgErr);
            }

            // Centra la imagen en la página
            const imgX = margin + ((pageWidth - margin * 2) - imgWidth) / 2;
            const imgY = yPos;

            if (diagramaBase64) {
                doc.addImage(diagramaBase64, 'PNG', imgX, imgY, imgWidth, imgHeight);
            }

            yPos = imgY + imgHeight + 6;

            // --- TABLAS EN PARALELO BAJO LA IMAGEN ---
            const tablaWidth = (pageWidth - margin * 2 - 8) / 2; // 8mm espacio entre tablas

            // Tabla izquierda: Datos principales del sistema
            doc.autoTable({
                startY: yPos,
                head: [['Parámetro', 'Valor']],
                body: [
                    ['Método de Cálculo', inputData.metodoCalculoTexto || ''],
                    ['Tipo de Sistema', inputData.tipoSistemaTexto || ''],
                    ['Acumulación (Litros)', inputData.acumulacionIngresada || ''],
                    ...(inputData.tipoSistema === 'sala_calderas' 
                        ? [['Potencia Térmica (kW)', inputData.potenciaIngresada || '']]
                        : [['Potencia Bombas de Calor (kW)', inputData.pBC || ''], ['Potencia R.E. (kW)', inputData.pRE || '']]
                    )
                ],
                theme: 'plain',
                margin: { left: margin, right: pageWidth - margin - tablaWidth - 8 },
                tableWidth: tablaWidth,
                didDrawPage: addHeader,
                ...tablaEstilos
            });
            const tablaIzqFinalY = doc.lastAutoTable.finalY;

            // Tabla derecha: Parámetros de Selección
            doc.autoTable({
                startY: yPos,
                head: [['Parámetro de Selección', 'Valor']],
                body: [
                    ['Guía de Demanda', inputData.demandaGuia.replace('_', ' ')],
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
                theme: 'plain',
                margin: { left: margin + tablaWidth + 8 },
                tableWidth: tablaWidth,
                didDrawPage: addHeader,
                ...tablaEstilos
            });
            const tablaDerFinalY = doc.lastAutoTable.finalY;

            // Calcula la posición vertical más baja de ambas tablas
            const tablasFinalY = Math.max(tablaIzqFinalY, tablaDerFinalY);
            yPos = tablasFinalY + 8;

            // --- IMÁGENES ASHRAE AL FINAL DE DATOS DE SELECCIÓN ---
            const logoAshraePath = './Images/logo_ashrae.png';
            const perfilesAshraePath = './Images/perfiles_ashrae.png';
            const ashraeLogoScale = 0.13;
            const ashraePerfilesScale = 0.13;

            let logoAshraeBase64 = '';
            let perfilesAshraeBase64 = '';
            try {
                logoAshraeBase64 = await imageToBase64(logoAshraePath);
                perfilesAshraeBase64 = await imageToBase64(perfilesAshraePath);
            } catch (imgErr) {
                console.warn('No se pudo cargar una imagen ASHRAE:', imgErr);
            }

            let imgLogo = null;
            let imgPerfiles = null;

            // --- LOGO ASHRAE IZQUIERDA ---
            if (logoAshraeBase64) {
                imgLogo = new Image();
                imgLogo.src = logoAshraeBase64;
                await new Promise(resolve => { imgLogo.onload = resolve; });

                const logoWidth = imgLogo.width * ashraeLogoScale;
                const logoHeight = imgLogo.height * ashraeLogoScale;
                const logoX = 35; // valor fijo, ajusta aquí

                doc.addImage(logoAshraeBase64, 'PNG', logoX, yPos, logoWidth, logoHeight);
            }

            // --- PERFILES ASHRAE DERECHA ---
            if (perfilesAshraeBase64) {
                imgPerfiles = new Image();
                imgPerfiles.src = perfilesAshraeBase64;
                await new Promise(resolve => { imgPerfiles.onload = resolve; });

                const perfilesWidth = imgPerfiles.width * ashraePerfilesScale;
                const perfilesHeight = imgPerfiles.height * ashraePerfilesScale;
                const perfilesX = 80; // valor fijo, ajusta aquí

                doc.addImage(perfilesAshraeBase64, 'PNG', perfilesX, yPos, perfilesWidth, perfilesHeight);
            }

            // Actualiza yPos para continuar debajo de las imágenes
            yPos = yPos + Math.max(
                imgLogo ? (imgLogo.height * ashraeLogoScale) : 0,
                imgPerfiles ? (imgPerfiles.height * ashraePerfilesScale) : 0
            ) + 8;

            // --- RESULTADOS Y ANÁLISIS ---
            doc.addPage();
            addHeader(doc);
            yPos = 30;
            addTitle(doc, 'Resultados de Selección y Análisis', yPos);
            addSectionSeparator(doc, yPos, margin, pageWidth);
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
            addHeader(doc);
            yPos = 30;
            addTitle(doc, 'Gráficos de Consumo y Eficiencia', yPos);
            addSectionSeparator(doc, yPos, margin, pageWidth);
            yPos += 10;
            yPos = addChartToPdf(doc, 'line', yPos);
            yPos = addChartToPdf(doc, 'bar', yPos);
            yPos = addChartToPdf(doc, 'monthly', yPos);
            yPos = addChartToPdf(doc, 'efficiency', yPos);

            

            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const formattedDate = `${year}.${month}.${day}`;
            const fileName = `${formattedDate} - ${projectNameInput}.pdf`;

            doc.save(fileName);

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