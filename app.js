document.addEventListener('DOMContentLoaded', async () => {
    // REGISTRO GLOBAL DEL PLUGIN DE ETIQUETAS
    Chart.register(ChartDataLabels);
    // DESACTIVAMOS EL PLUGIN POR DEFECTO PARA TODOS LOS GRÁFICOS
    Chart.defaults.plugins.datalabels.display = false;

    // --- ELEMENTOS DEL DOM ---
    const produccionContinua50cSpan = document.getElementById('produccion-continua-50c');
    const produccionContinuaTempSpan = document.getElementById('prod-continua-temp');
    const produccionContinuaValorSpan = document.getElementById('produccion-continua-valor');
    const deptoInputs = document.querySelectorAll('#depto-table input[type="number"]');
    const totalUnidadesCell = document.getElementById('total-unidades');
    const totalPersonasGeneralCell = document.getElementById('total-personas-general');
    const viewMode = document.getElementById('param-view-mode');
    const editMode = document.getElementById('param-edit-mode');
    const editBtn = document.getElementById('edit-params-btn');
    const saveBtn = document.getElementById('save-params-btn');
    const filasHoraPunta = document.querySelectorAll('.fila-hora-punta');

    const metodoCalculoSelect = document.getElementById('metodo-calculo');
    const ingresoDepartamentosGroup = document.getElementById('ingreso-departamentos-group');
    const ingresoTotalPersonasGroup = document.getElementById('ingreso-total-personas-group');
    const inputTotalPersonas = document.getElementById('input-total-personas');
    
    const potenciaSalaCalderasRow = document.getElementById('potencia-sala-calderas-group');
    const potenciaBcRow = document.getElementById('potencia-bc-group');
    const potenciaReRow = document.getElementById('potencia-re-group');
    const potenciaTotalDisplayRow = document.getElementById('potencia-total-display-row');
    const potenciaBcInput = document.getElementById('potencia-bc');
    const potenciaReInput = document.getElementById('potencia-re');
    const potenciaTotalDisplaySpan = document.getElementById('potencia-total-display');
    const potenciaIngresadaInput = document.getElementById('potencia-ingresada');
    const tipoSistemaSelect = document.getElementById('tipo-sistema');
    const acumulacionIngresadaInput = document.getElementById('acumulacion-ingresada');

    const resultadoTable = document.getElementById('resultado-table');
    const resultadoTableBody = document.querySelector('#resultado-table tbody');
    const consumoPuntaBox = document.getElementById('consumo-punta-box');
    const consumoPuntaValorSpan = document.getElementById('consumo-punta-valor');
    const generacionPuntaValorSpan = document.getElementById('generacion-punta-valor');

    // Elementos de la tarjeta de consumo anual
    const consumoDiarioValorSpan = document.getElementById('consumo-diario-valor');
    const ratioEsperadoValorSpan = document.getElementById('ratio-esperado-valor');
    const costoAcsValorSpan = document.getElementById('costo-acs-valor');
    const costoAnualValorSpan = document.getElementById('costo-anual-valor');
    
    const tabLine = document.getElementById('tab-line');
    const tabBar = document.getElementById('tab-bar');
    const tabMonthly = document.getElementById('tab-monthly');
    const tabEfficiency = document.getElementById('tab-efficiency');
    const lineChartContainer = document.getElementById('line-chart-container');
    const barChartContainer = document.getElementById('bar-chart-container');
    const monthlyChartContainer = document.getElementById('monthly-chart-container');
    const efficiencyChartContainer = document.getElementById('efficiency-chart-container');
    const lineChartCanvas = document.getElementById('lineChart').getContext('2d');
    const barChartCanvas = document.getElementById('barChart').getContext('2d');
    const monthlyChartCanvas = document.getElementById('monthlyChart').getContext('2d');
    const efficiencyChartCanvas = document.getElementById('efficiencyChart').getContext('2d');

    // --- VARIABLES GLOBALES ---
    let lineChartInstance = null;
    let barChartInstance = null;
    let monthlyChartInstance = null;
    let efficiencyChartInstance = null;
    let monitoringData = [];
    let params = {
        demandaGuia: 'low-medium',
        litrosPersonaDia: 60,
        eficiencia: 0.90, 
        usoAcumulador: 0.80, 
        tempFria: 10,
        tempAcumulacion: 45, 
        tempConsumo: 45,
        horaPuntaInicio: 19,
        horaPuntaFin: 21,
        valorGas: 1250,
        valorKwh: 150
    };
    const demandaGuiaMap = { 'low': 'Baja', 'low-medium': 'Baja-Media', 'medium': 'Media', 'high': 'Alta' };
    const demandaData = { low: { "5min": 1.5, "15min": 3.8, "30min": 6.4, "60min": 10.6, "120min": 17.0, "180min": 23.1, "diarioAvg": 53, "diarioMax": 76 }, "low-medium": { "5min": 2.1, "15min": 5.1, "30min": 8.7, "60min": 14.4, "120min": 23.7, "180min": 32.4, "diarioAvg": 84, "diarioMax": 131 }, medium: { "5min": 2.6, "15min": 6.4, "30min": 11.0, "60min": 18.2, "120min": 30.3, "180min": 41.6, "diarioAvg": 114, "diarioMax": 185 }, high: { "5min": 4.5, "15min": 11.4, "30min": 19.3, "60min": 32.2, "120min": 54.9, "180min": 71.9, "diarioAvg": 204, "diarioMax": 340 }, monitoreo: { "5min": 1.85, "15min": 4.19, "30min": 5.66, "60min": 9.25, "120min": 14.50, "180min": 20.00, "diarioAvg": "N/A", "diarioMax": 67 } };
    const consumoMensualDistribucion = { enero: 0.0682, febrero: 0.0603, marzo: 0.0778, abril: 0.0818, mayo: 0.0899, junio: 0.0944, julio: 0.0972, agosto: 0.0931, septiembre: 0.0923, octubre: 0.0896, noviembre: 0.0814, diciembre: 0.0740 };
    const efficiencyData = { bc: [ { x: 3, y: 40 }, { x: 4, y: 36 }, { x: 6, y: 34 }, { x: 8, y: 31.5 }, { x: 9, y: 30 }, { x: 10, y: 28.2 }, { x: 11, y: 26.5 }, { x: 12, y: 25.8 }, { x: 14, y: 25.1 }, { x: 15, y: 24 }, { x: 17, y: 23.5 }, { x: 18, y: 23.1 }, { x: 20, y: 22.8 }, { x: 22, y: 22.5 }, { x: 23, y: 22.3 }, { x: 25, y: 22.1 }, { x: 27, y: 21.9 }, { x: 28, y: 21.8 }, { x: 30, y: 21.6 }, { x: 32, y: 21.5 }, { x: 33, y: 21.4 } ], scm: [ { x: 2, y: 11.55 }, { x: 3, y: 9.02 }, { x: 4, y: 7.26 }, { x: 6, y: 6.16 }, { x: 8, y: 5.61 }, { x: 10, y: 5.28 }, { x: 14, y: 4.95 }, { x: 17, y: 4.84 }, { x: 21, y: 4.73 }, { x: 25, y: 4.62 }, { x: 30, y: 4.4 }, { x: 60, y: 4.4 } ], traditional: [ { x: 2, y: 11.8 }, { x: 5, y: 9 }, { x: 10, y: 7.8 }, { x: 20, y: 7.2 }, { x: 30, y: 7 }, { x: 50, y: 6.9 } ] };

    // --- LÓGICA PRINCIPAL DE LA APP ---
    const handleMetodoCalculoChange = () => {
        const metodo = metodoCalculoSelect.value;
        if (metodo === 'departamentos') {
            ingresoDepartamentosGroup.style.display = 'block';
            ingresoTotalPersonasGroup.style.display = 'none';
        } else {
            ingresoDepartamentosGroup.style.display = 'none';
            ingresoTotalPersonasGroup.style.display = 'block';
        }
        updateComparison();
    };

    const updateTotals = () => {
        let totalUnidades = 0, totalPersonas = 0;
        deptoInputs.forEach(input => {
            const row = input.closest('tr');
            const unidades = parseFloat(input.value) || 0;
            const personasPorDepto = parseFloat(row.querySelector('.total-personas-row').dataset.pers);
            const totalPersonasFila = unidades * personasPorDepto;
            row.querySelector('.total-personas-row').textContent = unidades > 0 ? totalPersonasFila.toFixed(1) : '';
            totalUnidades += unidades;
            totalPersonas += totalPersonasFila;
        });
        totalUnidadesCell.textContent = totalUnidades > 0 ? totalUnidades : '';
        totalPersonasGeneralCell.textContent = totalPersonas > 0 ? totalPersonas.toFixed(1) : '';
    };

    const updateComparison = () => {
        // --- 1. CÁLCULO DE PERSONAS ---
        let totalPersonas = 0;
        if (metodoCalculoSelect.value === 'departamentos') {
            updateTotals();
            totalPersonas = parseFloat(totalPersonasGeneralCell.textContent) || 0;
        } else {
            totalPersonas = parseFloat(inputTotalPersonas.value) || 0;
        }
        
        // --- 2. OBTENCIÓN DE PARÁMETROS ---
        const acumulacionIngresada = parseFloat(acumulacionIngresadaInput.value) || 0;
        const { eficiencia, usoAcumulador, tempFria, tempAcumulacion, tempConsumo } = params;
        const calorEspecificoAgua = 4.186;
        const tempConsumoFijaParaCalculo = 50;
        
        const tipoSistema = tipoSistemaSelect.value;
        const pBC = parseFloat(potenciaBcInput.value) || 0;
        const pRE = parseFloat(potenciaReInput.value) || 0;
        let potenciaParaCalculo = 0;

        if (tipoSistema === 'sala_calderas') {
            potenciaParaCalculo = parseFloat(potenciaIngresadaInput.value) || 0;
        } else if (tipoSistema === 'apoyo_re') {
            potenciaParaCalculo = pBC + pRE;
            potenciaTotalDisplaySpan.textContent = potenciaParaCalculo;
        } else if (tipoSistema === 'falla_re') {
            potenciaParaCalculo = pBC;
            potenciaTotalDisplaySpan.textContent = pBC + pRE;
        }

        // --- 3. CÁLCULOS PARA TARJETAS DE INFO ---
        const duracionPuntaHoras = params.horaPuntaFin - params.horaPuntaInicio;
        if (duracionPuntaHoras > 0 && tipoSistema !== 'sala_calderas') {
            const duracionPuntaSegundos = duracionPuntaHoras * 3600;
            const energiaPotenciaPunta = potenciaParaCalculo * eficiencia * duracionPuntaSegundos;
            const energiaAcumulacion = (acumulacionIngresada * usoAcumulador) * calorEspecificoAgua * (tempAcumulacion - tempFria);
            const valorGeneracionPunta = (energiaPotenciaPunta + energiaAcumulacion) / (calorEspecificoAgua * (tempConsumoFijaParaCalculo - tempFria));
            generacionPuntaValorSpan.textContent = Math.round(valorGeneracionPunta).toLocaleString('es-CL');
        } else {
            generacionPuntaValorSpan.textContent = `0`;
        }

        const litrosPorMinuto_50c = (potenciaParaCalculo * eficiencia * 60) / (calorEspecificoAgua * (50 - tempFria));
        produccionContinua50cSpan.textContent = litrosPorMinuto_50c.toFixed(2);
        
        const litrosPorMinuto_seleccionado = (potenciaParaCalculo * eficiencia * 60) / (calorEspecificoAgua * (tempConsumo - tempFria));
        produccionContinuaTempSpan.textContent = tempConsumo;
        produccionContinuaValorSpan.textContent = litrosPorMinuto_seleccionado.toFixed(2);
        
        // --- 4. CÁLCULOS DE CONSUMO Y COSTOS ---
        const dailyM3 = (totalPersonas * params.litrosPersonaDia) / 1000;
        const diasEnJulio = 31;
        const consumoMensualTotalJulio = (dailyM3 * 1000) * diasEnJulio;
        const consumoAnualTotalLitros = (consumoMensualDistribucion.julio > 0) ? (consumoMensualTotalJulio / consumoMensualDistribucion.julio) : 0;
        const consumoAnualTotalM3 = consumoAnualTotalLitros / 1000;
        
        let ratioEsperado = 0;
        let costoACS = 0;
        let ratioUnit = '';
        if (tipoSistema === 'sala_calderas') {
            ratioEsperado = interpolate(dailyM3, efficiencyData.scm);
            costoACS = ratioEsperado * params.valorGas;
            ratioUnit = 'm³ gas/m³';
        } else {
            ratioEsperado = interpolate(dailyM3, efficiencyData.bc);
            costoACS = ratioEsperado * params.valorKwh;
            ratioUnit = 'kWh/m³';
        }
        const costoAnual = costoACS * consumoAnualTotalM3;

        consumoDiarioValorSpan.textContent = dailyM3.toFixed(2);
        ratioEsperadoValorSpan.textContent = `${ratioEsperado.toFixed(2)} ${ratioUnit}`;
        costoAcsValorSpan.textContent = `$${Math.round(costoACS).toLocaleString('es-CL')}`;
        costoAnualValorSpan.textContent = `$${Math.round(costoAnual).toLocaleString('es-CL')}`;

        // --- 5. CÁLCULOS PARA TABLA DE RESULTADOS ---
        resultadoTableBody.innerHTML = '';
        const demanda = demandaData[params.demandaGuia];
        const peakTimes = { "Peak 5 min": "5min", "Peak 15 min": "15min", "Peak 30 min": "30min", "Peak 60 min": "60min", "Peak 120 min": "120min", "Peak 180 min": "180min", "Diario Promedio": "diarioAvg", "Diario Máximo": "diarioMax" };
        
        for (const [label, key] of Object.entries(peakTimes)) {
            const volumenRequerido = totalPersonas * demanda[key];
            const boetekValue = demandaData.monitoreo[key];
            const volumenBoetek = typeof boetekValue === 'number' ? totalPersonas * boetekValue : boetekValue;
            
            let volumenProporcionado = 0;
            if (key.includes('min')) {
                const tiempoSegundos = parseInt(key) * 60;
                const energiaPotencia = potenciaParaCalculo * eficiencia * tiempoSegundos;
                const energiaAcumulacion = (acumulacionIngresada * usoAcumulador) * calorEspecificoAgua * (tempAcumulacion - tempFria);
                volumenProporcionado = (energiaPotencia + energiaAcumulacion) / (calorEspecificoAgua * (tempConsumoFijaParaCalculo - tempFria));
            } else {
                volumenProporcionado = (potenciaParaCalculo * eficiencia * (24*3600)) / (calorEspecificoAgua * (tempConsumoFijaParaCalculo - tempFria));
            }

            let capacidadModoFalla = null;
            let estadoFalla = null;
            if (tipoSistema === 'falla_re' && typeof boetekValue === 'number') {
                const potenciaSoloRe = pRE;
                if (key.includes('min')) {
                    const tiempoSegundos = parseInt(key) * 60;
                    const energiaPotencia = potenciaSoloRe * eficiencia * tiempoSegundos;
                    const energiaAcumulacion = (acumulacionIngresada * usoAcumulador) * calorEspecificoAgua * (tempAcumulacion - tempFria);
                    capacidadModoFalla = (energiaPotencia + energiaAcumulacion) / (calorEspecificoAgua * (tempConsumoFijaParaCalculo - tempFria));
                } else {
                     capacidadModoFalla = (potenciaSoloRe * eficiencia * (24*3600)) / (calorEspecificoAgua * (tempConsumoFijaParaCalculo - tempFria));
                }
                estadoFalla = capacidadModoFalla >= volumenBoetek;
            }
            
            createResultRow(resultadoTableBody, label, volumenRequerido, volumenProporcionado, boetekValue, volumenBoetek, capacidadModoFalla, estadoFalla);
        }

        // --- 6. ACTUALIZACIÓN DE GRÁFICOS ---
        updateCharts(totalPersonas, dailyM3, consumoAnualTotalM3, ratioEsperado);
    };

    const createResultRow = (tbody, param, requerido, ingresado, boetekValue, volumenBoetek, capacidadFalla, estadoFalla) => {
        const row = tbody.insertRow();
        const statusClass = ingresado >= requerido ? 'status-ok' : 'status-insuficiente';
        const boetekBgClass = (typeof boetekValue === 'number' && ingresado < volumenBoetek) ? 'monitoreo-insuficiente' : '';
        const sobredimensionamiento = (typeof boetekValue === 'number' && volumenBoetek > 0) ? `${(((ingresado / volumenBoetek) - 1) * 100).toFixed(0)}%` : 'N/A';
        const fallaCellHtml = `<td class="col-falla">${typeof capacidadFalla === 'number' ? Math.round(capacidadFalla).toLocaleString('es-CL') + ' L' : ''}</td>`;
        const estadoFallaText = estadoFalla === null ? '' : (estadoFalla ? 'OK' : 'Insuficiente');
        const estadoFallaClass = estadoFalla === null ? '' : (estadoFalla ? 'status-ok' : 'status-insuficiente');
        const estadoFallaCellHtml = `<td class="col-falla ${estadoFallaClass}">${estadoFallaText}</td>`;

        row.innerHTML = `<td>${param}</td>
                         <td>${Math.round(requerido).toLocaleString('es-CL')} L</td>
                         <td>${Math.round(ingresado).toLocaleString('es-CL')} L</td>
                         <td class="${statusClass}">${ingresado >= requerido ? 'OK' : 'Insuficiente'}</td>
                         <td class="boetek-col ${boetekBgClass}">${typeof volumenBoetek === 'number' ? Math.round(volumenBoetek).toLocaleString('es-CL') + ' L' : volumenBoetek}</td>
                         <td class="sobre-dimensionamiento-col">${sobredimensionamiento}</td>
                         ${fallaCellHtml}
                         ${estadoFallaCellHtml}`;
    };
    
    const handleSistemaChange = () => {
        const tipoSistema = tipoSistemaSelect.value;
        const esBombaDeCalor = tipoSistema !== 'sala_calderas';
        
        const selectedText = tipoSistemaSelect.options[tipoSistemaSelect.selectedIndex].text;
        tipoSistemaSelect.title = selectedText;

        potenciaSalaCalderasRow.style.display = esBombaDeCalor ? 'none' : '';
        potenciaBcRow.style.display = esBombaDeCalor ? '' : 'none';
        potenciaReRow.style.display = esBombaDeCalor ? '' : 'none';
        potenciaTotalDisplayRow.style.display = esBombaDeCalor ? '' : 'none';

        consumoPuntaBox.style.display = esBombaDeCalor ? 'block' : 'none';
        filasHoraPunta.forEach(fila => {
            fila.style.display = esBombaDeCalor ? '' : 'none';
        });

        if (esBombaDeCalor) {
            potenciaBcInput.value = 0;
            potenciaReInput.value = 0;
        }
        resultadoTable.classList.toggle('falla-re-active', tipoSistema === 'falla_re');
        updateComparison();
    };

    const toggleEditMode = (isSaving = false) => {
        const isCurrentlyEditing = editMode.style.display !== 'none';
        const formatHour = (hour) => `${String(hour).padStart(2, '0')}:00`;

        if (isSaving && isCurrentlyEditing) {
            params = {
                demandaGuia: document.getElementById('demanda-guia').value,
                litrosPersonaDia: parseInt(document.getElementById('edit-litros-persona-dia').value, 10),
                eficiencia: parseFloat(document.getElementById('edit-eficiencia').value),
                usoAcumulador: parseFloat(document.getElementById('edit-uso-acumulador').value),
                tempFria: parseFloat(document.getElementById('edit-temp-fria').value),
                tempAcumulacion: parseFloat(document.getElementById('edit-temp-acumulacion').value),
                tempConsumo: parseFloat(document.getElementById('edit-temp-consumo').value),
                horaPuntaInicio: parseInt(document.getElementById('edit-hora-punta-inicio').value, 10),
                horaPuntaFin: parseInt(document.getElementById('edit-hora-punta-fin').value, 10),
                valorGas: parseFloat(document.getElementById('edit-valor-gas').value),
                valorKwh: parseFloat(document.getElementById('edit-valor-kwh').value)
            };
            
            document.getElementById('view-demanda-guia').textContent = demandaGuiaMap[params.demandaGuia];
            document.getElementById('view-litros-persona-dia').textContent = `${params.litrosPersonaDia} L`;
            document.getElementById('view-eficiencia').textContent = `${(params.eficiencia * 100).toFixed(0)}%`;
            document.getElementById('view-uso-acumulador').textContent = `${(params.usoAcumulador * 100).toFixed(0)}%`;
            document.getElementById('view-temp-fria').textContent = `${params.tempFria}°C`;
            document.getElementById('view-temp-acumulacion').textContent = `${params.tempAcumulacion}°C`;
            document.getElementById('view-temp-consumo').textContent = `${params.tempConsumo}°C`;
            document.getElementById('view-hora-punta-inicio').textContent = formatHour(params.horaPuntaInicio);
            document.getElementById('view-hora-punta-fin').textContent = formatHour(params.horaPuntaFin);
            document.getElementById('view-valor-gas').textContent = `$${params.valorGas.toLocaleString('es-CL')}`;
            document.getElementById('view-valor-kwh').textContent = `$${params.valorKwh.toLocaleString('es-CL')}`;

            viewMode.style.display = 'block';
            editMode.style.display = 'none';
            updateComparison();
        } else if (!isCurrentlyEditing) {
            document.getElementById('demanda-guia').value = params.demandaGuia;
            document.getElementById('edit-litros-persona-dia').value = params.litrosPersonaDia;
            document.getElementById('edit-eficiencia').value = params.eficiencia;
            document.getElementById('edit-uso-acumulador').value = params.usoAcumulador;
            document.getElementById('edit-temp-fria').value = params.tempFria;
            document.getElementById('edit-temp-acumulacion').value = params.tempAcumulacion;
            document.getElementById('edit-temp-consumo').value = params.tempConsumo;
            document.getElementById('edit-hora-punta-inicio').value = params.horaPuntaInicio;
            document.getElementById('edit-hora-punta-fin').value = params.horaPuntaFin;
            document.getElementById('edit-valor-gas').value = params.valorGas;
            document.getElementById('edit-valor-kwh').value = params.valorKwh;

            viewMode.style.display = 'none';
            editMode.style.display = 'block';
        }
    };

    const aggregateHourlyData = () => {
        if (!monitoringData.length) return new Array(24).fill(0);
        const hourlyConsumption = new Array(24).fill(0);
        monitoringData.forEach(d => {
            const hour = new Date(d.created_at).getHours();
            hourlyConsumption[hour] += d["caudal L/min"];
        });
        return hourlyConsumption;
    };
    
    // --- LÓGICA DE GRÁFICOS ---
    const interpolate = (x, dataPoints) => {
        const sortedPoints = dataPoints.slice().sort((a, b) => a.x - b.x);
        if (x <= sortedPoints[0].x) return sortedPoints[0].y;
        if (x >= sortedPoints[sortedPoints.length - 1].x) return sortedPoints[sortedPoints.length - 1].y;

        let p1, p2;
        for (let i = 0; i < sortedPoints.length - 1; i++) {
            if (x >= sortedPoints[i].x && x <= sortedPoints[i + 1].x) {
                p1 = sortedPoints[i];
                p2 = sortedPoints[i + 1];
                break;
            }
        }
        if (!p1) return sortedPoints[sortedPoints.length - 1].y; // Fallback
        return p1.y + ((x - p1.x) / (p2.x - p1.x)) * (p2.y - p1.y);
    };

    const updateEfficiencyChart = (dailyM3, ratioEsperado) => {
        const tipoSistema = tipoSistemaSelect.value;
        let datasets = [], yAxisTitle = '', chartTitle = '';

        if (tipoSistema === 'sala_calderas') {
            yAxisTitle = 'm³ Gas / m³ H₂O';
            chartTitle = 'Eficiencia Sala de Calderas';
            datasets = [
                { label: 'SCM Boetek', data: efficiencyData.scm, borderColor: 'rgba(0, 86, 179, 1)', tension: 0.1, type: 'line', pointRadius: 0 },
                { label: 'Sistema Tradicional', data: efficiencyData.traditional, borderColor: 'rgba(108, 117, 125, 1)', tension: 0.1, type: 'line', pointRadius: 0 },
                { label: 'Punto de Operación', data: [{ x: dailyM3, y: ratioEsperado }], backgroundColor: 'red', type: 'scatter', pointRadius: 6, pointHoverRadius: 8 }
            ];
        } else {
            yAxisTitle = 'kWh / m³ H₂O';
            chartTitle = 'Eficiencia Bomba de Calor';
            datasets = [
                { label: 'Eficiencia BC', data: efficiencyData.bc, borderColor: 'rgba(0, 86, 179, 1)', tension: 0.1, type: 'line', pointRadius: 0 },
                { label: 'Punto de Operación', data: [{ x: dailyM3, y: ratioEsperado }], backgroundColor: 'red', type: 'scatter', pointRadius: 6, pointHoverRadius: 8 }
            ];
        }

        if (efficiencyChartInstance) efficiencyChartInstance.destroy();
        efficiencyChartInstance = new Chart(efficiencyChartCanvas, {
            data: { datasets: datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: chartTitle, font: { size: 16 } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += `(${context.parsed.x.toFixed(2)} m³/día, ${context.parsed.y.toFixed(2)})`;
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear', position: 'bottom',
                        title: { display: true, text: 'Consumo Promedio (m³/día)' }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: yAxisTitle }
                    }
                }
            }
        });
    };

    const updateCharts = (totalPersonas, dailyM3, consumoAnualTotalM3, ratioEsperado) => {
        // ---- Gráfico Perfil Diario (L/min) y Consumo por Hora (L) ----
        if (monitoringData.length > 0) {
            const tipoSistema = tipoSistemaSelect.value;
            const esBombaDeCalor = tipoSistema !== 'sala_calderas';
            const personasBase = 769.5;
            const factor = totalPersonas > 0 ? totalPersonas / personasBase : 0;
            
            const lineLabels = monitoringData.map(d => new Date(d.created_at).toTimeString().substring(0, 5));
            const lineScaledData = monitoringData.map(d => d["caudal L/min"] * factor);
            if (lineChartInstance) lineChartInstance.destroy();
            lineChartInstance = new Chart(lineChartCanvas, {
                type: 'line', data: { labels: lineLabels, datasets: [{ label: 'Caudal Simulado (L/min)', data: lineScaledData, borderColor: 'rgba(0, 86, 179, 1)', backgroundColor: 'rgba(0, 86, 179, 0.2)', borderWidth: 1.5, pointRadius: 0, fill: true }] },
                options: { 
                    responsive: true, maintainAspectRatio: false, 
                    scales: { 
                        x: { ticks: { maxTicksLimit: 24 } }, 
                        y: { 
                            beginAtZero: true,
                            title: { display: true, text: 'Litros por minuto (L/min)' }
                        } 
                    } 
                }
            });

            const hourlyAggregatedData = aggregateHourlyData();
            const barScaledData = hourlyAggregatedData.map(d => d * factor);
            
            let consumoTotalPunta = 0;
            const barColors = [], borderColors = [];
            const peakColor = 'rgba(255, 99, 132, 0.5)', defaultColor = 'rgba(0, 86, 179, 0.5)';
            const peakBorderColor = 'rgba(255, 99, 132, 1)', defaultBorderColor = 'rgba(0, 86, 179, 1)';

            for (let hour = 0; hour < 24; hour++) {
                if (esBombaDeCalor && hour >= params.horaPuntaInicio && hour < params.horaPuntaFin) {
                    consumoTotalPunta += barScaledData[hour];
                    barColors.push(peakColor); borderColors.push(peakBorderColor);
                } else {
                    barColors.push(defaultColor); borderColors.push(defaultBorderColor);
                }
            }
            consumoPuntaValorSpan.textContent = esBombaDeCalor ? Math.round(consumoTotalPunta).toLocaleString('es-CL') : '0';

            const barLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
            if (barChartInstance) barChartInstance.destroy();
            barChartInstance = new Chart(barChartCanvas, {
                type: 'bar', 
                data: { 
                    labels: barLabels, 
                    datasets: [{ 
                        label: 'Consumo Total (Litros)', 
                        data: barScaledData, 
                        backgroundColor: barColors, 
                        borderColor: borderColors, 
                        borderWidth: 1 
                    }] 
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    scales: { 
                        y: { 
                            beginAtZero: true,
                            title: { display: true, text: 'Litros (Lts)' }
                        } 
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        datalabels: {
                            display: true,
                            color: '#333',
                            anchor: 'end',
                            align: 'top',
                            font: {
                                weight: 'bold',
                                size: 10
                            },
                            formatter: function(value) {
                                if (value > 1) {
                                    return Math.round(value);
                                } else {
                                    return '';
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // ---- Gráfico de Consumo Mensual (m³) ----
        const monthlyLabels = Object.keys(consumoMensualDistribucion).map(m => m.charAt(0).toUpperCase() + m.slice(1));
        const monthlyDataM3 = Object.values(consumoMensualDistribucion).map(dist => consumoAnualTotalM3 * dist);

        if (monthlyChartInstance) monthlyChartInstance.destroy();
        monthlyChartInstance = new Chart(monthlyChartCanvas, {
            type: 'bar',
            data: {
                labels: monthlyLabels,
                datasets: [{
                    label: 'Consumo Mensual (m³)',
                    data: monthlyDataM3,
                    backgroundColor: 'rgba(0, 86, 179, 0.5)',
                    borderColor: 'rgba(0, 86, 179, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: true,
                        title: { display: true, text: 'Metros Cúbicos (m³)' }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'top',
                        color: '#333',
                        font: {
                            weight: 'bold',
                        },
                        formatter: function(value) {
                            if (value > 0) {
                                return Math.round(value).toLocaleString('es-CL');
                            } else {
                                return '';
                            }
                        }
                    }
                }
            }
        });

        // Llamada a la nueva función del gráfico de eficiencia
        updateEfficiencyChart(dailyM3, ratioEsperado);
    };
    
    // --- INICIALIZACIÓN Y EVENT LISTENERS ---
    try {
        const response = await fetch('Data/datos_caudal.json');
        if (!response.ok) throw new Error('No se pudieron cargar los datos de monitoreo.');
        monitoringData = await response.json();
    } catch (error) {
        console.error('Error al cargar datos_caudal.json:', error);
        alert('No se pudo cargar el perfil de consumo para los gráficos de L/min y L/h. El resto de la aplicación funcionará correctamente.');
    } finally {
        const allInputs = document.querySelectorAll('#calculadora-form input, #calculadora-form select');
        allInputs.forEach(input => input.addEventListener('input', updateComparison));
        
        metodoCalculoSelect.addEventListener('change', handleMetodoCalculoChange);
        editBtn.addEventListener('click', () => toggleEditMode(false));
        saveBtn.addEventListener('click', () => toggleEditMode(true));
        tipoSistemaSelect.addEventListener('change', handleSistemaChange);
        
        const tabs = [tabLine, tabBar, tabMonthly, tabEfficiency];
        const containers = [lineChartContainer, barChartContainer, monthlyChartContainer, efficiencyChartContainer];

        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                containers.forEach(c => c.style.display = 'none');
                containers[index].style.display = 'block';
            });
        });
        
        const initializeApp = () => {
            const formatHour = (hour) => `${String(hour).padStart(2, '0')}:00`;
            document.getElementById('view-demanda-guia').textContent = demandaGuiaMap[params.demandaGuia];
            document.getElementById('view-litros-persona-dia').textContent = `${params.litrosPersonaDia} L`;
            document.getElementById('view-eficiencia').textContent = `${(params.eficiencia * 100).toFixed(0)}%`;
            document.getElementById('view-uso-acumulador').textContent = `${(params.usoAcumulador * 100).toFixed(0)}%`;
            document.getElementById('view-temp-fria').textContent = `${params.tempFria}°C`;
            document.getElementById('view-temp-acumulacion').textContent = `${params.tempAcumulacion}°C`;
            document.getElementById('view-temp-consumo').textContent = `${params.tempConsumo}°C`;
            document.getElementById('view-hora-punta-inicio').textContent = formatHour(params.horaPuntaInicio);
            document.getElementById('view-hora-punta-fin').textContent = formatHour(params.horaPuntaFin);
            document.getElementById('view-valor-gas').textContent = `$${params.valorGas.toLocaleString('es-CL')}`;
            document.getElementById('view-valor-kwh').textContent = `$${params.valorKwh.toLocaleString('es-CL')}`;

            handleMetodoCalculoChange();
            handleSistemaChange();
            updateComparison(); 
        };

        initializeApp();
    }
});