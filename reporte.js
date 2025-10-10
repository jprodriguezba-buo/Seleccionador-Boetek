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
            fillColor: [242, 242, 242],
            textColor: [40, 40, 40],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'left',
            lineWidth: { bottom: 0.5, top: 0, left: 0, right: 0 },
            lineColor: [220, 220, 220],
            minCellHeight: 6,
            cellPadding: 1
        },
        bodyStyles: { 
            fontSize: 8.5,
            textColor: [40, 40, 40],
            lineWidth: 0,
            lineColor: [220, 220, 220],
            minCellHeight: 6,
            cellPadding: 1
        },
        alternateRowStyles: {
            fillColor: [249, 249, 249]
        }
    };
    
    // --- FUNCIONES AUXILIARES PARA EL PDF --- //
    const addTitle = (doc, title, yPos) => {
        doc.setFontSize(tituloEstilos.fontSize);
        doc.setFont(tituloEstilos.fontFamily, tituloEstilos.fontStyle);
        doc.setTextColor(...tituloEstilos.textColor);
        doc.text(title, 14, yPos);
    };

    const addSectionSeparator = (doc, yPos, margin, pageWidth) => {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    };

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
   
    // AHORA ES UNA FUNCIÓN ASÍNCRONA PORQUE ESPERA LA IMAGEN DEL GRÁFICO
    const addChartToPdf = async (
        doc, 
        chartName, 
        currentY, 
        format = 'jpeg', 
        quality = 0.92, 
        width = 1200, 
        height = 600, 
        scaleWidth = 1.0, 
        scaleHeight = 1.0
    ) => {
        // Await espera a que la nueva función 'getChartImage' termine
        const imgData = await window.getChartImage(chartName, format, quality, width, height);
        if (!imgData) {
            console.warn(`Gráfico "${chartName}" no encontrado.`);
            return currentY;
        }
        const imgType = format.toLowerCase() === 'jpeg' ? 'JPEG' : 'PNG';
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 14;
        
        const maxWidthMM = (pageWidth - margin * 2) * scaleWidth; 
        const aspectRatio = width / height;
        const scaledWidthMM = maxWidthMM;
        const scaledHeightMM = (maxWidthMM / aspectRatio) * scaleHeight;
        
        const imgX = (pageWidth - scaledWidthMM) / 2;
        
        if (currentY + scaledHeightMM > pageHeight - margin) {
            doc.addPage();
            currentY = margin + 10;
        }
        
        doc.addImage(imgData, imgType, imgX, currentY, scaledWidthMM, scaledHeightMM);
        
        return currentY + scaledHeightMM + 10;
    };

    // --- FUNCIÓN PRINCIPAL PARA GENERAR EL PDF --- //
    const generarPDF = async () => {
        // Obtener la versión desde el HTML
        const version = document.querySelector('.version-indicator')?.textContent?.trim() || '';
        const footerText = `informe emitido por software de seleccion Boetek ${version}`;

        // Función para agregar el footer en cada página
        const addFooter = (doc, pageNum, pageCount) => {
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 14;
            const yFooter = doc.internal.pageSize.getHeight() - 8;
            // Línea de separación superior
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(margin, yFooter - 6, pageWidth - margin, yFooter - 6);
            // Texto del footer
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(120, 120, 120);
            doc.text(footerText, margin, yFooter, { align: 'left' });
        };
        const margin = 14;
        const pageWidth = 210;
        const halfWidth = (pageWidth - margin * 2) / 2;

        let projectNameInput = prompt('Por favor, ingrese el nombre del proyecto:', 'Proyecto ACS');
        if (projectNameInput === null) return;
        projectNameInput = projectNameInput.trim() || 'Proyecto Genérico Boetek';

        let direccionInput = prompt('Por favor, ingrese la dirección del proyecto:', '');
        if (direccionInput === null) return;
        direccionInput = direccionInput.trim() || 'Pendiente';

        generarReporteBtn.disabled = true;
        generarReporteBtn.textContent = 'Generando Reporte...';
        
        try {
            const reportData = window.getReportData();
            if (!reportData || Object.keys(reportData).length === 0) {
                alert("No hay datos para generar el reporte. Por favor, realice un cálculo primero.");
                return;
            }

            const { inputs, params, tableData } = reportData;
            const logoBase64 = await imageToBase64('./Images/Boetek PNG.png');
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            
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

            // Agregar footer a la primera página
            addFooter(doc, 1, 1);
            let yPos = 30;

            // --- RESUMEN DEL PROYECTO ---
            addTitle(doc, 'Resumen del Proyecto', yPos);
            addSectionSeparator(doc, yPos, margin, pageWidth);
            yPos += 6;

            doc.autoTable({
                startY: yPos,
                head: [['Datos del Cliente', '']],
                body: [['Nombre del proyecto', projectNameInput], ['Dirección', direccionInput]],
                theme: 'plain',
                margin: { left: margin, right: pageWidth - margin - halfWidth + 5 },
                ...tablaEstilos
            });
            let finalY = doc.lastAutoTable.finalY;

            if (inputs.metodoCalculo === 'departamentos' && inputs.detalleDepartamentos.length > 0) {
                // Mostrar todos los departamentos, incluso con 0 unidades
                const bodyDorms = Array.isArray(inputs.detalleDepartamentos)
                    ? inputs.detalleDepartamentos.map(row => [row[0], row[1], row[2], row[3]])
                    : [];
                // Calcular totales
                const totalUnidades = bodyDorms.reduce((sum, row) => sum + (parseFloat(row[2]) || 0), 0);
                const totalPersonas = bodyDorms.reduce((sum, row) => sum + (parseFloat(row[3]) || 0), 0);
                bodyDorms.push([
                    'Totales',
                    '',
                    totalUnidades,
                    totalPersonas
                ]);
                doc.autoTable({
                    startY: yPos,
                    head: [['Cant. Dorms', 'Pers/depto', 'Unidades', 'Total Pers.']],
                    body: bodyDorms,
                    theme: 'plain',
                    margin: { left: margin + halfWidth + 5 },
                    ...tablaEstilos,
                    didParseCell: function (data) {
                        // Si es la última fila (totales)
                        if (data.row.index === bodyDorms.length - 1 && data.section === 'body') {
                            data.cell.styles.fontStyle = 'bold';
                            data.cell.styles.lineWidth = { top: 0.7, bottom: 0, left: 0, right: 0 };
                            data.cell.styles.lineColor = [40, 40, 40];
                        }
                    }
                });
                finalY = Math.max(finalY, doc.lastAutoTable.finalY);
            } else if (inputs.metodoCalculo === 'total_personas') {
                doc.autoTable({
                    startY: yPos,
                    head: [['Total de Personas', 'Valor']],
                    body: [['Total de Personas', inputs.totalPersonas]],
                    theme: 'plain',
                    margin: { left: margin + halfWidth + 5 },
                    ...tablaEstilos
                });
                finalY = Math.max(finalY, doc.lastAutoTable.finalY);
            }
            yPos = finalY + 10;

            // --- DATOS DE SELECCIÓN ---
            addTitle(doc, 'Datos de Selección', yPos);
            addSectionSeparator(doc, yPos, margin, pageWidth);
            yPos += 8;

            let diagramaImgPath = inputs.tipoSistema === 'sala_calderas' ? './Images/Diagrama_SCM.png' : './Images/Diagrama_MBC.png';
            var diagramaBase64 = await imageToBase64(diagramaImgPath);
            var imgWidth = 100, imgHeight = 35;
            var tablaWidth = (pageWidth - margin * 2 - 8) / 2;

            // Tabla de parámetros de diseño a la izquierda
            var tablaDiseno = [];
            tablaDiseno.push(['Método de Cálculo', inputs.metodoCalculoTexto]);
            tablaDiseno.push(['Tipo de Sistema', inputs.tipoSistemaTexto]);
            tablaDiseno.push(['Guía de Demanda', params.demandaGuia.replace('_', ' ')]);
            tablaDiseno.push(['Eficiencia de Generación', `${(params.eficiencia * 100).toFixed(0)}%`]);
            tablaDiseno.push(['% Uso Acumulador', `${(params.usoAcumulador * 100).toFixed(0)}%`]);
            tablaDiseno.push(['Temperatura Agua Fría', `${params.tempFria}°C`]);
            tablaDiseno.push(['Temperatura de Consumo', `${params.tempConsumo}°C`]);
            tablaDiseno.push(['Temperatura de Acumulación', `${params.tempAcumulacion}°C`]);

            doc.autoTable({
                startY: yPos,
                head: [['Parámetro de Diseño', 'Valor']],
                body: tablaDiseno,
                theme: 'plain',
                margin: { left: margin },
                tableWidth: tablaWidth,
                ...tablaEstilos
            });
            var tablaDisenoFinalY = doc.lastAutoTable.finalY;

            // Imagen de diagrama a la derecha de la tabla de diseño
            doc.addImage(diagramaBase64,'PNG', margin + tablaWidth + 8, yPos, imgWidth, imgHeight);
            var diagramaFinalY = yPos + imgHeight;

            // Tabla de parámetros de selección debajo de la de diseño
            var tablaSeleccion = [];
            tablaSeleccion.push(['Acumulación (Litros)', inputs.acumulacionIngresada]);
            tablaSeleccion.push(['Prom. L/persona/día', `${params.litrosPersonaDia} L`]);
            tablaSeleccion.push(['Hora Punta', `${params.horaPuntaInicio}:00 - ${params.horaPuntaFin}:00`]);
            tablaSeleccion.push(['Valor m³ Gas', `$${params.valorGas.toLocaleString('es-CL')}`]);
            tablaSeleccion.push(['Valor kWh Electricidad', `$${params.valorKwh.toLocaleString('es-CL')}`]);

            var seleccionStartY = Math.max(tablaDisenoFinalY, diagramaFinalY) + 6;
            doc.autoTable({
                startY: seleccionStartY,
                head: [['Parámetro de Selección', 'Valor']],
                body: tablaSeleccion,
                theme: 'plain',
                margin: { left: margin },
                tableWidth: tablaWidth,
                ...tablaEstilos
            });
            yPos = doc.lastAutoTable.finalY + 10;
            // ...existing code...

            // --- LOGO ASHRAE IZQUIERDA ---
                let logoAshraeBase64 = '';
                let perfilesAshraeBase64 = '';
                const logoAshraePath = './Images/Logo_Ashrae.png';
                const perfilesAshraePath = './Images/Perfiles_Ashrae.png';
                const ashraeLogoScale = 0.13;
                const ashraePerfilesScale = 0.13;

                try {
                    logoAshraeBase64 = await imageToBase64(logoAshraePath);
                    perfilesAshraeBase64 = await imageToBase64(perfilesAshraePath);
                } catch (imgErr) {
                    console.warn('No se pudo cargar una imagen ASHRAE:', imgErr);
                }
            if (logoAshraeBase64) {
                imgLogo = new Image();
                imgLogo.src = logoAshraeBase64;
                await new Promise(resolve => { imgLogo.onload = resolve; });

                const logoWidth = imgLogo.width * ashraeLogoScale;
                const logoHeight = imgLogo.height * ashraeLogoScale;
                const logoX = 35; // valor fijo, ajusta aquí

                doc.addImage(logoAshraeBase64, 'JPEG', logoX, yPos, logoWidth, logoHeight, undefined, 0.5);
            }

            // --- PERFILES ASHRAE DERECHA ---
            if (perfilesAshraeBase64) {
                imgPerfiles = new Image();
                imgPerfiles.src = perfilesAshraeBase64;
                await new Promise(resolve => { imgPerfiles.onload = resolve; });

                const perfilesWidth = imgPerfiles.width * ashraePerfilesScale;
                const perfilesHeight = imgPerfiles.height * ashraePerfilesScale;
                const perfilesX = 80; // valor fijo, ajusta aquí

                doc.addImage(perfilesAshraeBase64, 'JPEG', perfilesX, yPos, perfilesWidth, perfilesHeight, undefined, 0.5);
            }

            // Actualiza yPos para continuar debajo de las imágenes
            yPos = yPos + Math.max(
                imgLogo ? (imgLogo.height * ashraeLogoScale) : 0,
                imgPerfiles ? (imgPerfiles.height * ashraePerfilesScale) : 0
            ) + 8;

            // --- RESULTADOS Y ANÁLISIS ---
            // Solo agregar nueva página si hay contenido pendiente
            doc.addPage();
            addHeader(doc);
            addFooter(doc, doc.internal.getCurrentPageInfo().pageNumber, doc.getNumberOfPages());
            yPos = 30;
            addTitle(doc, 'Resultados de Selección y Análisis', yPos);
            addSectionSeparator(doc, yPos, margin, pageWidth);
            yPos += 10;

            const resultadoHead = [['Parámetro', 'Requerido', 'Seleccionado', 'Cumple', 'Monitoreo', 'Sobredim.', 'Sel. Falla', 'Cumple Falla']];
            if (inputs.tipoSistema !== 'falla_re') {
                resultadoHead[0] = resultadoHead[0].slice(0, -2);
            }
            doc.autoTable({
                startY: yPos,
                head: resultadoHead,
                body: inputs.tipoSistema !== 'falla_re' ? tableData.resultado.map(row => row.slice(0, -2)) : tableData.resultado,
                ...tablaEstilos
            });
            yPos = doc.lastAutoTable.finalY + 10;
            
            doc.autoTable({ startY: yPos, head: [['Parámetro', 'SCM (a Gas)', 'Bomba de Calor', 'Sistema Tradicional']], body: tableData.comparative, ...tablaEstilos });
            yPos = doc.lastAutoTable.finalY + 10;

            doc.autoTable({ startY: yPos, head: [['Parámetro', tableData.selection.header]], body: tableData.selection.body, ...tablaEstilos });
            yPos = doc.lastAutoTable.finalY + 10;

            if (inputs.tipoSistema !== 'sala_calderas') {
                doc.autoTable({ startY: yPos, head: [['Escenario de Suministro', 'Consumo Hora Punta', 'Cumple', 'Generación Hora Punta']], body: tableData.peakHours, ...tablaEstilos });
                yPos = doc.lastAutoTable.finalY + 10;
            }

            addTitle(doc, 'Caudales Instantáneos', yPos);
            yPos += 8;
            const caudalesBody = [
                ['Caudal a 50°C', tableData.instantFlow['50c']],
                ['Caudal a 60°C', tableData.instantFlow['60c']],
                [`Caudal a Temp. Consumo (${tableData.instantFlow.tempConsumo})`, tableData.instantFlow.consumo]
            ];
            doc.autoTable({
                startY: yPos,
                head: [['Parámetro', 'Valor']],
                body: caudalesBody,
                theme: 'plain',
                margin: { left: margin },
                ...tablaEstilos
            });
            yPos = doc.lastAutoTable.finalY + 10;

            // --- GRÁFICOS ---
            doc.addPage();
            addHeader(doc);
            addFooter(doc, doc.internal.getCurrentPageInfo().pageNumber, doc.getNumberOfPages());
            yPos = 30;
            addTitle(doc, 'Gráficos de Consumo y Eficiencia', yPos);
            addSectionSeparator(doc, yPos, margin, pageWidth);
            yPos += 10;
            
            // AHORA LAS LLAMADAS USAN 'await' PARA ESPERAR LA IMAGEN
            yPos = await addChartToPdf(doc, 'line', yPos, 'jpeg', 0.4, 1200, 600, 0.7, 0.7);     
            yPos = await addChartToPdf(doc, 'bar', yPos, 'jpeg', 0.4, 1200, 600, 0.7, 0.7);    
            yPos = await addChartToPdf(doc, 'monthly', yPos, 'jpeg', 0.4, 1200, 600, 0.7, 0.7);  
            yPos = await addChartToPdf(doc, 'efficiency', yPos, 'jpeg', 0.4, 1200, 600, 0.7, 0.7);

        // Al final, asegurarse que la última página tiene footer
        const pageCount = doc.getNumberOfPages();
        doc.setPage(pageCount);
        addFooter(doc, pageCount, pageCount);

        const now = new Date();
        const formattedDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
        const fileName = `${formattedDate} - ${projectNameInput}.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error('Error detallado al generar el PDF:', error);
            alert('Hubo un error al generar el reporte. Revisa la consola para más detalles.');
        } finally {
            generarReporteBtn.disabled = false;
            generarReporteBtn.textContent = 'Generar Reporte PDF';
        }
    };

    generarReporteBtn.addEventListener('click', generarPDF);
});