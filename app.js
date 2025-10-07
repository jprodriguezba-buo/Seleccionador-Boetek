document.addEventListener('DOMContentLoaded', async () => {
    // REGISTRO GLOBAL DEL PLUGIN DE ETIQUETAS
    Chart.register(ChartDataLabels);
    Chart.defaults.plugins.datalabels.display = false;

    // --- 1. OBJETO CENTRALIZADO PARA ELEMENTOS DEL DOM ---
    const DOM = {
        calculadoraForm: document.getElementById('calculadora-form'),
        metodoCalculoSelect: document.getElementById('metodo-calculo'),
        ingresoDepartamentosGroup: document.getElementById('ingreso-departamentos-group'),
        ingresoTotalPersonasGroup: document.getElementById('ingreso-total-personas-group'),
        inputTotalPersonas: document.getElementById('input-total-personas'),
        deptoInputs: document.querySelectorAll('#depto-table input[type="number"]'),
        totalUnidadesCell: document.getElementById('total-unidades'),
        totalPersonasGeneralCell: document.getElementById('total-personas-general'),
        tipoSistemaSelect: document.getElementById('tipo-sistema'),
        acumulacionIngresadaInput: document.getElementById('acumulacion-ingresada'),
        potenciaIngresadaInput: document.getElementById('potencia-ingresada'),
        potenciaBcInput: document.getElementById('potencia-bc'),
        potenciaReInput: document.getElementById('potencia-re'),
        potenciaSalaCalderasRow: document.getElementById('potencia-sala-calderas-group'),
        potenciaBcRow: document.getElementById('potencia-bc-group'),
        potenciaReRow: document.getElementById('potencia-re-group'),
        potenciaTotalDisplayRow: document.getElementById('potencia-total-display-row'),
        potenciaTotalDisplaySpan: document.getElementById('potencia-total-display'),
        viewMode: document.getElementById('param-view-mode'),
        editMode: document.getElementById('param-edit-mode'),
        editBtn: document.getElementById('edit-params-btn'),
        saveBtn: document.getElementById('save-params-btn'),
        filasHoraPunta: document.querySelectorAll('.fila-hora-punta'),
        resultadoTable: document.getElementById('resultado-table'),
        resultadoTableBody: document.querySelector('#resultado-table tbody'),
        tabLine: document.getElementById('tab-line'),
        tabBar: document.getElementById('tab-bar'),
        tabMonthly: document.getElementById('tab-monthly'),
        tabEfficiency: document.getElementById('tab-efficiency'),
        lineChartContainer: document.getElementById('line-chart-container'),
        barChartContainer: document.getElementById('bar-chart-container'),
        monthlyChartContainer: document.getElementById('monthly-chart-container'),
        efficiencyChartContainer: document.getElementById('efficiency-chart-container'),
        lineChartCanvas: document.getElementById('lineChart').getContext('2d'),
        barChartCanvas: document.getElementById('barChart').getContext('2d'),
        monthlyChartCanvas: document.getElementById('monthlyChart').getContext('2d'),
        efficiencyChartCanvas: document.getElementById('efficiencyChart').getContext('2d'),
        tabComparative: document.getElementById('tab-comparative'),
        tabSelection: document.getElementById('tab-selection'),
        tabPeakHours: document.getElementById('tab-peak-hours'),
        tabInstantFlow: document.getElementById('tab-instant-flow'),
        comparativeTableContainer: document.getElementById('comparative-table-container'),
        selectionTableContainer: document.getElementById('selection-table-container'),
        peakHoursContainer: document.getElementById('peak-hours-container'),
        instantFlowContainer: document.getElementById('instant-flow-container'),
        selectionHeader: document.getElementById('selection-header'),
        compScmAnualM3: document.getElementById('comp-scm-anual-m3'),
        compBcAnualM3: document.getElementById('comp-bc-anual-m3'),
        compTradAnualM3: document.getElementById('comp-trad-anual-m3'),
        compScmDiarioM3: document.getElementById('comp-scm-diario-m3'),
        compBcDiarioM3: document.getElementById('comp-bc-diario-m3'),
        compTradDiarioM3: document.getElementById('comp-trad-diario-m3'),
        compScmRatio: document.getElementById('comp-scm-ratio'),
        compBcRatio: document.getElementById('comp-bc-ratio'),
        compTradRatio: document.getElementById('comp-trad-ratio'),
        compScmCostoM3: document.getElementById('comp-scm-costo-m3'),
        compBcCostoM3: document.getElementById('comp-bc-costo-m3'),
        compTradCostoM3: document.getElementById('comp-trad-costo-m3'),
        compScmCostoAnual: document.getElementById('comp-scm-costo-anual'),
        compBcCostoAnual: document.getElementById('comp-bc-costo-anual'),
        compTradCostoAnual: document.getElementById('comp-trad-costo-anual'),
        selAnualM3: document.getElementById('sel-anual-m3'),
        selDiarioM3: document.getElementById('sel-diario-m3'),
        selRatio: document.getElementById('sel-ratio'),
        selCostoM3: document.getElementById('sel-costo-m3'),
        selCostoAnual: document.getElementById('sel-costo-anual'),
        consumoPuntaCells: document.querySelectorAll('.consumo-punta-cell'),
        validadorPunta100: document.getElementById('validador-punta-100'),
        validadorPunta75: document.getElementById('validador-punta-75'),
        validadorPunta50: document.getElementById('validador-punta-50'),
        validadorPunta25: document.getElementById('validador-punta-25'),
        validadorPunta0: document.getElementById('validador-punta-0'),
        genPunta100: document.getElementById('gen-punta-100'),
        genPunta75: document.getElementById('gen-punta-75'),
        genPunta50: document.getElementById('gen-punta-50'),
        genPunta25: document.getElementById('gen-punta-25'),
        genPunta0: document.getElementById('gen-punta-0'),
        produccionContinua50cSpan: document.getElementById('produccion-continua-50c'),
        produccionContinua60cSpan: document.getElementById('produccion-continua-60c'),
        produccionContinuaTempSpan: document.getElementById('prod-continua-temp'),
        produccionContinuaValorSpan: document.getElementById('produccion-continua-valor'),
    };

    // --- VARIABLES GLOBALES Y CONSTANTES ---
    let lineChartInstance, barChartInstance, monthlyChartInstance, efficiencyChartInstance;
    let monitoringData = [];
    let params = {
        demandaGuia: 'low-medium', litrosPersonaDia: 60, eficiencia: 0.90, usoAcumulador: 0.80, tempFria: 10, tempAcumulacion: 45, tempConsumo: 45, horaPuntaInicio: 18, horaPuntaFin: 22, valorGas: 1250, valorKwh: 150
    };
    const demandaGuiaMap = { 'low': 'Baja', 'low-medium': 'Baja-Media', 'medium': 'Media', 'high': 'Alta' };
    const demandaData = { low: { "5min": 1.5, "15min": 3.8, "30min": 6.4, "60min": 10.6, "120min": 17.0, "180min": 23.1, "diarioAvg": 53, "diarioMax": 76 }, "low-medium": { "5min": 2.1, "15min": 5.1, "30min": 8.7, "60min": 14.4, "120min": 23.7, "180min": 32.4, "diarioAvg": 84, "diarioMax": 131 }, medium: { "5min": 2.6, "15min": 6.4, "30min": 11.0, "60min": 18.2, "120min": 30.3, "180min": 41.6, "diarioAvg": 114, "diarioMax": 185 }, high: { "5min": 4.5, "15min": 11.4, "30min": 19.3, "60min": 32.2, "120min": 54.9, "180min": 71.9, "diarioAvg": 204, "diarioMax": 340 }, monitoreo: { "5min": 1.85, "15min": 4.19, "30min": 5.66, "60min": 9.25, "120min": 14.50, "180min": 20.00, "diarioAvg": "N/A", "diarioMax": 67 } };
    const consumoMensualDistribucion = { enero: 0.0682, febrero: 0.0603, marzo: 0.0778, abril: 0.0818, mayo: 0.0899, junio: 0.0944, julio: 0.0972, agosto: 0.0931, septiembre: 0.0923, octubre: 0.0896, noviembre: 0.0814, diciembre: 0.0740 };
    const efficiencyData = { bc: [ { x: 3, y: 40 }, { x: 4, y: 36 }, { x: 6, y: 34 }, { x: 8, y: 31.5 }, { x: 9, y: 30 }, { x: 10, y: 28.2 }, { x: 11, y: 26.5 }, { x: 12, y: 25.8 }, { x: 14, y: 25.1 }, { x: 15, y: 24 }, { x: 17, y: 23.5 }, { x: 18, y: 23.1 }, { x: 20, y: 22.8 }, { x: 22, y: 22.5 }, { x: 23, y: 22.3 }, { x: 25, y: 22.1 }, { x: 27, y: 21.9 }, { x: 28, y: 21.8 }, { x: 30, y: 21.6 }, { x: 32, y: 21.5 }, { x: 33, y: 21.4 } ], scm: [ { x: 2, y: 11.55 }, { x: 3, y: 9.02 }, { x: 4, y: 7.26 }, { x: 6, y: 6.16 }, { x: 8, y: 5.61 }, { x: 10, y: 5.28 }, { x: 14, y: 4.95 }, { x: 17, y: 4.84 }, { x: 21, y: 4.73 }, { x: 25, y: 4.62 }, { x: 30, y: 4.4 }, { x: 60, y: 4.4 } ], traditional: [ { x: 2, y: 11.8 }, { x: 5, y: 9 }, { x: 10, y: 7.8 }, { x: 20, y: 7.2 }, { x: 30, y: 7 }, { x: 50, y: 6.9 } ] };
    const CALOR_ESPECIFICO_AGUA = 4.186;
    const PERSONAS_BASE_MONITOREO = 769.5;

    // --- SEPARACIÓN DE LÓGICA ---
    
    // 2. OBTIENE VALORES DE ENTRADA DEL USUARIO
    const getInputData = () => {
        updateTotals();
        const totalPersonas = (DOM.metodoCalculoSelect.value === 'departamentos')
            ? parseFloat(DOM.totalPersonasGeneralCell.textContent) || 0
            : parseFloat(DOM.inputTotalPersonas.value) || 0;
        return {
            totalPersonas,
            acumulacionIngresada: parseFloat(DOM.acumulacionIngresadaInput.value) || 0,
            tipoSistema: DOM.tipoSistemaSelect.value,
            pBC: parseFloat(DOM.potenciaBcInput.value) || 0,
            pRE: parseFloat(DOM.potenciaReInput.value) || 0,
            potenciaIngresada: parseFloat(DOM.potenciaIngresadaInput.value) || 0,
        };
    };

    // 3. REALIZA TODOS LOS CÁLCULOS Y DEVUELVE UN OBJETO DE RESULTADOS
    const calculateResults = (inputs) => {
        const { eficiencia, usoAcumulador, tempFria, tempAcumulacion, tempConsumo } = params;
        const results = {};

        // Potencia efectiva
        results.potenciaParaCalculo = 0;
        if (inputs.tipoSistema === 'sala_calderas') {
            results.potenciaParaCalculo = inputs.potenciaIngresada;
        } else if (inputs.tipoSistema === 'apoyo_re') {
            results.potenciaParaCalculo = inputs.pBC + inputs.pRE;
        } else if (inputs.tipoSistema === 'falla_re') {
            results.potenciaParaCalculo = inputs.pBC;
        }
        
        // Consumos y costos
        const consumoDiarioBaseLitros = inputs.totalPersonas * params.litrosPersonaDia;
        const consumoMensualJulioLitros = consumoDiarioBaseLitros * 31;
        results.consumoAnualTotalLitros = (consumoMensualDistribucion.julio > 0) ? (consumoMensualJulioLitros / consumoMensualDistribucion.julio) : 0;
        results.consumoAnualTotalM3 = results.consumoAnualTotalLitros / 1000;
        results.dailyM3 = results.consumoAnualTotalM3 / 365;
        
        results.scmRatio = interpolate(results.dailyM3, efficiencyData.scm);
        results.scmCostoM3 = results.scmRatio * params.valorGas;
        results.scmCostoAnual = results.scmCostoM3 * results.consumoAnualTotalM3;
        
        results.bcRatio = interpolate(results.dailyM3, efficiencyData.bc);
        results.bcCostoM3 = results.bcRatio * params.valorKwh;
        results.bcCostoAnual = results.bcCostoM3 * results.consumoAnualTotalM3;

        results.traditionalRatio = interpolate(results.dailyM3, efficiencyData.traditional);
        results.traditionalCostoM3 = results.traditionalRatio * params.valorGas;
        results.traditionalCostoAnual = results.traditionalCostoM3 * results.consumoAnualTotalM3;

        // Hora Punta
        results.consumoPuntaLts = 0;
        if (monitoringData.length > 0 && inputs.tipoSistema !== 'sala_calderas') {
            const factor = inputs.totalPersonas > 0 ? inputs.totalPersonas / PERSONAS_BASE_MONITOREO : 0;
            const hourlyAggregatedData = aggregateHourlyData();
            const barScaledData = hourlyAggregatedData.map(d => d * factor);
            for (let hour = 0; hour < 24; hour++) {
                if (hour >= params.horaPuntaInicio && hour < params.horaPuntaFin) {
                    results.consumoPuntaLts += barScaledData[hour];
                }
            }
        }

        const duracionPuntaHoras = params.horaPuntaFin - params.horaPuntaInicio;
        results.generacionPunta = {};
        if (duracionPuntaHoras > 0 && inputs.tipoSistema !== 'sala_calderas') {
            const duracionPuntaSegundos = duracionPuntaHoras * 3600;
            const energiaAcumulacion = (inputs.acumulacionIngresada * usoAcumulador) * CALOR_ESPECIFICO_AGUA * (tempAcumulacion - tempFria);
            // USA LA TEMPERATURA DE CONSUMO DE LOS PARÁMETROS
            const calculatePeakGeneration = (power) => (power * eficiencia * duracionPuntaSegundos + energiaAcumulacion) / (CALOR_ESPECIFICO_AGUA * (tempConsumo - tempFria));
            
            results.generacionPunta['100'] = calculatePeakGeneration(inputs.pBC * 1.0);
            results.generacionPunta['75'] = calculatePeakGeneration(inputs.pBC * 0.75);
            results.generacionPunta['50'] = calculatePeakGeneration(inputs.pBC * 0.50);
            results.generacionPunta['25'] = calculatePeakGeneration(inputs.pBC * 0.25);
            results.generacionPunta['0'] = calculatePeakGeneration(0);
        }

        // Caudales instantáneos
        results.caudal50c = (results.potenciaParaCalculo * eficiencia * 60) / (CALOR_ESPECIFICO_AGUA * (50 - tempFria));
        results.caudal60c = (results.potenciaParaCalculo * eficiencia * 60) / (CALOR_ESPECIFICO_AGUA * (60 - tempFria));
        results.caudalSeleccionado = (results.potenciaParaCalculo * eficiencia * 60) / (CALOR_ESPECIFICO_AGUA * (tempConsumo - tempFria));

        return results;
    };
    
    // --- 4. FUNCIONES QUE ACTUALIZAN LA UI ---
    
    const updateUITables = (inputs, results) => {
        updateCostTables(inputs, results);
        updateResultsTable(inputs, results);
        updateOperationPanels(results);
    };

    const updateCostTables = (inputs, results) => {
        const formatCurrency = (value) => `$${Math.round(value).toLocaleString('es-CL')}`;
        const formattedAnualM3 = `${Math.round(results.consumoAnualTotalM3).toLocaleString('es-CL')} m³`;
        const formattedDailyM3 = `${results.dailyM3.toFixed(2)} m³`;

        DOM.compScmAnualM3.textContent = formattedAnualM3;
        DOM.compBcAnualM3.textContent = formattedAnualM3;
        DOM.compTradAnualM3.textContent = formattedAnualM3;
        DOM.compScmDiarioM3.textContent = formattedDailyM3;
        DOM.compBcDiarioM3.textContent = formattedDailyM3;
        DOM.compTradDiarioM3.textContent = formattedDailyM3;
        DOM.compScmRatio.textContent = `${results.scmRatio.toFixed(2)} m³ gas/m³`;
        DOM.compBcRatio.textContent = `${results.bcRatio.toFixed(2)} kWh/m³`;
        DOM.compTradRatio.textContent = `${results.traditionalRatio.toFixed(2)} m³ gas/m³`;
        DOM.compScmCostoM3.textContent = formatCurrency(results.scmCostoM3);
        DOM.compBcCostoM3.textContent = formatCurrency(results.bcCostoM3);
        DOM.compTradCostoM3.textContent = formatCurrency(results.traditionalCostoM3);
        DOM.compScmCostoAnual.textContent = formatCurrency(results.scmCostoAnual);
        DOM.compBcCostoAnual.textContent = formatCurrency(results.bcCostoAnual);
        DOM.compTradCostoAnual.textContent = formatCurrency(results.traditionalCostoAnual);
        
        if (inputs.tipoSistema === 'sala_calderas') {
            DOM.selectionHeader.textContent = 'SCM (a Gas)';
            DOM.selAnualM3.textContent = formattedAnualM3;
            DOM.selDiarioM3.textContent = formattedDailyM3;
            DOM.selRatio.textContent = `${results.scmRatio.toFixed(2)} m³ gas/m³`;
            DOM.selCostoM3.textContent = formatCurrency(results.scmCostoM3);
            DOM.selCostoAnual.textContent = formatCurrency(results.scmCostoAnual);
        } else {
            DOM.selectionHeader.textContent = 'Bomba de Calor';
            DOM.selAnualM3.textContent = formattedAnualM3;
            DOM.selDiarioM3.textContent = formattedDailyM3;
            DOM.selRatio.textContent = `${results.bcRatio.toFixed(2)} kWh/m³`;
            DOM.selCostoM3.textContent = formatCurrency(results.bcCostoM3);
            DOM.selCostoAnual.textContent = formatCurrency(results.bcCostoAnual);
        }
    };
    
    const updateResultsTable = (inputs, results) => {
        DOM.resultadoTableBody.innerHTML = '';
        const { eficiencia, usoAcumulador, tempFria, tempAcumulacion } = params;
        const demanda = demandaData[params.demandaGuia];
        const peakTimes = { "Peak 5 min": "5min", "Peak 15 min": "15min", "Peak 30 min": "30min", "Peak 60 min": "60min", "Peak 120 min": "120min", "Peak 180 min": "180min", "Diario Promedio": "diarioAvg", "Diario Máximo": "diarioMax" };
        
        for (const [label, key] of Object.entries(peakTimes)) {
            const volumenRequerido = inputs.totalPersonas * demanda[key];
            const boetekValue = demandaData.monitoreo[key];
            const volumenBoetek = typeof boetekValue === 'number' ? inputs.totalPersonas * boetekValue : boetekValue;
            
            let volumenProporcionado = 0;
            // ESTA SECCIÓN MANTIENE LA TEMP. FIJA A 50°C PARA COMPARACIÓN
            const tempFijaComparacion = 50;
            if (key.includes('min')) {
                const tiempoSegundos = parseInt(key) * 60;
                const energiaPotencia = results.potenciaParaCalculo * eficiencia * tiempoSegundos;
                const energiaAcumulacion = (inputs.acumulacionIngresada * usoAcumulador) * CALOR_ESPECIFICO_AGUA * (tempAcumulacion - tempFria);
                volumenProporcionado = (energiaPotencia + energiaAcumulacion) / (CALOR_ESPECIFICO_AGUA * (tempFijaComparacion - tempFria));
            } else {
                volumenProporcionado = (results.potenciaParaCalculo * eficiencia * (24 * 3600)) / (CALOR_ESPECIFICO_AGUA * (tempFijaComparacion - tempFria));
            }

            let capacidadModoFalla = null, estadoFalla = null;
            if (inputs.tipoSistema === 'falla_re' && typeof boetekValue === 'number') {
                const energiaAcumulacion = (inputs.acumulacionIngresada * usoAcumulador) * CALOR_ESPECIFICO_AGUA * (tempAcumulacion - tempFria);
                if (key.includes('min')) {
                    const tiempoSegundos = parseInt(key) * 60;
                    const energiaPotencia = inputs.pRE * eficiencia * tiempoSegundos;
                    capacidadModoFalla = (energiaPotencia + energiaAcumulacion) / (CALOR_ESPECIFICO_AGUA * (tempFijaComparacion - tempFria));
                } else {
                     capacidadModoFalla = (inputs.pRE * eficiencia * (24 * 3600)) / (CALOR_ESPECIFICO_AGUA * (tempFijaComparacion - tempFria));
                }
                estadoFalla = capacidadModoFalla >= volumenBoetek;
            }
            createResultRow(label, volumenRequerido, volumenProporcionado, boetekValue, volumenBoetek, capacidadModoFalla, estadoFalla);
        }
    };

    const updateOperationPanels = (results) => {
        // Panel Hora Punta
        const formattedConsumo = `${Math.round(results.consumoPuntaLts).toLocaleString('es-CL')} L`;
        DOM.consumoPuntaCells.forEach(cell => { cell.textContent = formattedConsumo; });
        
        const scenarios = [
            { key: '100', genCell: DOM.genPunta100, valCell: DOM.validadorPunta100 },
            { key: '75', genCell: DOM.genPunta75, valCell: DOM.validadorPunta75 },
            { key: '50', genCell: DOM.genPunta50, valCell: DOM.validadorPunta50 },
            { key: '25', genCell: DOM.genPunta25, valCell: DOM.validadorPunta25 },
            { key: '0', genCell: DOM.genPunta0, valCell: DOM.validadorPunta0 },
        ];
        scenarios.forEach(scenario => {
            if (results.generacionPunta[scenario.key] !== undefined) {
                scenario.genCell.textContent = `${Math.round(results.generacionPunta[scenario.key]).toLocaleString('es-CL')} L`;
                updateStatusCell(scenario.valCell, results.generacionPunta[scenario.key] >= results.consumoPuntaLts);
            }
        });

        // Panel Caudales
        DOM.produccionContinua50cSpan.textContent = results.caudal50c.toFixed(2);
        DOM.produccionContinua60cSpan.textContent = results.caudal60c.toFixed(2);
        DOM.produccionContinuaTempSpan.textContent = params.tempConsumo;
        DOM.produccionContinuaValorSpan.textContent = results.caudalSeleccionado.toFixed(2);
        
        // Actualizar potencia total en UI
        const inputs = getInputData(); // Necesitamos los inputs para la potencia total
        if(inputs.tipoSistema === 'apoyo_re') DOM.potenciaTotalDisplaySpan.textContent = inputs.pBC + inputs.pRE;
        else if(inputs.tipoSistema === 'falla_re') DOM.potenciaTotalDisplaySpan.textContent = inputs.pBC + inputs.pRE;
    };


    // --- LÓGICA PRINCIPAL Y ORQUESTACIÓN ---
    const updateComparison = () => {
        const userInputs = getInputData();
        const calculatedResults = calculateResults(userInputs);
        
        updateUITables(userInputs, calculatedResults);
        updateCharts(userInputs, calculatedResults);
    };

    // --- FUNCIONES AUXILIARES DE UI (sin cambios) ---
    const updateTotals = () => {
        let totalUnidades = 0, totalPersonas = 0;
        DOM.deptoInputs.forEach(input => {
            const row = input.closest('tr');
            const unidades = parseFloat(input.value) || 0;
            const personasPorDepto = parseFloat(row.querySelector('.total-personas-row').dataset.pers);
            const totalPersonasFila = unidades * personasPorDepto;
            row.querySelector('.total-personas-row').textContent = unidades > 0 ? totalPersonasFila.toFixed(1) : '';
            totalUnidades += unidades;
            totalPersonas += totalPersonasFila;
        });
        DOM.totalUnidadesCell.textContent = totalUnidades > 0 ? totalUnidades : '';
        DOM.totalPersonasGeneralCell.textContent = totalPersonas > 0 ? totalPersonas.toFixed(1) : '';
    };
    const updateStatusCell = (cell, isOk) => { cell.textContent = isOk ? 'OK' : 'Insuficiente'; cell.className = isOk ? 'status-ok' : 'status-insuficiente'; };
    const createResultRow = (param, requerido, ingresado, boetekValue, volumenBoetek, capacidadFalla, estadoFalla) => {
        const row = DOM.resultadoTableBody.insertRow();
        const statusClass = ingresado >= requerido ? 'status-ok' : 'status-insuficiente';
        const sobredimensionamiento = (typeof boetekValue === 'number' && volumenBoetek > 0) ? `${(((ingresado / volumenBoetek) - 1) * 100).toFixed(0)}%` : 'N/A';
        const fallaCellHtml = `<td class="col-falla">${typeof capacidadFalla === 'number' ? Math.round(capacidadFalla).toLocaleString('es-CL') + ' L' : ''}</td>`;
        const estadoFallaText = estadoFalla === null ? '' : (estadoFalla ? 'OK' : 'Insuficiente');
        const estadoFallaClass = estadoFalla === null ? '' : (estadoFalla ? 'status-ok' : 'status-insuficiente');
        const estadoFallaCellHtml = `<td class="col-falla ${estadoFallaClass}">${estadoFallaText}</td>`;
        row.innerHTML = `<td>${param}</td><td>${Math.round(requerido).toLocaleString('es-CL')} L</td><td>${Math.round(ingresado).toLocaleString('es-CL')} L</td><td class="${statusClass}">${ingresado >= requerido ? 'OK' : 'Insuficiente'}</td><td class="boetek-col">${typeof volumenBoetek === 'number' ? Math.round(volumenBoetek).toLocaleString('es-CL') + ' L' : volumenBoetek}</td><td class="sobre-dimensionamiento-col">${sobredimensionamiento}</td>${fallaCellHtml}${estadoFallaCellHtml}`;
    };
    const handleSistemaChange = () => {
        const tipoSistema = DOM.tipoSistemaSelect.value;
        const esBombaDeCalor = tipoSistema !== 'sala_calderas';
        DOM.potenciaSalaCalderasRow.style.display = esBombaDeCalor ? 'none' : 'table-row';
        DOM.potenciaBcRow.style.display = esBombaDeCalor ? 'table-row' : 'none';
        DOM.potenciaReRow.style.display = esBombaDeCalor ? 'table-row' : 'none';
        DOM.potenciaTotalDisplayRow.style.display = esBombaDeCalor ? 'table-row' : 'none';
        DOM.tabPeakHours.style.display = esBombaDeCalor ? 'inline-block' : 'none';
        DOM.filasHoraPunta.forEach(fila => { fila.style.display = esBombaDeCalor ? 'table-row' : 'none'; });
        if (!esBombaDeCalor && DOM.tabPeakHours.classList.contains('active')) { switchTab(DOM.tabComparative, [DOM.tabComparative, DOM.tabSelection, DOM.tabPeakHours, DOM.tabInstantFlow], [DOM.comparativeTableContainer, DOM.selectionTableContainer, DOM.peakHoursContainer, DOM.instantFlowContainer]); }
        DOM.resultadoTable.classList.toggle('falla-re-active', tipoSistema === 'falla_re');
        updateComparison();
    };
    const toggleEditMode = (isSaving = false) => {
        const isCurrentlyEditing = DOM.editMode.style.display !== 'none';
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
            updateViewModeDisplay();
            DOM.viewMode.style.display = 'block';
            DOM.editMode.style.display = 'none';
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
            DOM.viewMode.style.display = 'none';
            DOM.editMode.style.display = 'block';
        }
    };
    const updateViewModeDisplay = () => {
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
    };
    const aggregateHourlyData = () => {
        if (!monitoringData.length) return new Array(24).fill(0);
        const hourlyConsumption = new Array(24).fill(0);
        monitoringData.forEach(d => { const hour = new Date(d.created_at).getHours(); hourlyConsumption[hour] += d["caudal L/min"]; });
        return hourlyConsumption;
    };
    const interpolate = (x, dataPoints) => {
        const sortedPoints = dataPoints.slice().sort((a, b) => a.x - b.x);
        if (x <= sortedPoints[0].x) return sortedPoints[0].y;
        if (x >= sortedPoints[sortedPoints.length - 1].x) return sortedPoints[sortedPoints.length - 1].y;
        let p1, p2;
        for (let i = 0; i < sortedPoints.length - 1; i++) { if (x >= sortedPoints[i].x && x <= sortedPoints[i + 1].x) { p1 = sortedPoints[i]; p2 = sortedPoints[i + 1]; break; } }
        if (!p1) return sortedPoints[sortedPoints.length - 1].y;
        return p1.y + ((x - p1.x) / (p2.x - p1.x)) * (p2.y - p1.y);
    };

    // --- LÓGICA DE GRÁFICOS ---
    const updateCharts = (inputs, results) => {
        if (monitoringData.length > 0) {
            const factor = inputs.totalPersonas > 0 ? inputs.totalPersonas / PERSONAS_BASE_MONITOREO : 0;
            const lineLabels = monitoringData.map(d => new Date(d.created_at).toTimeString().substring(0, 5));
            const lineScaledData = monitoringData.map(d => d["caudal L/min"] * factor);
            if (lineChartInstance) lineChartInstance.destroy();
            lineChartInstance = new Chart(DOM.lineChartCanvas, {
                 type: 'line',
                  data: {
                      labels: lineLabels,
                      datasets: [{
                         label: 'Caudal Simulado (L/min)',
                         data: lineScaledData,
                         borderColor: 'rgba(0, 86, 179, 1)',
                         backgroundColor: 'rgba(0, 86, 179, 0.2)',
                         borderWidth: 1.5,
                         pointRadius: 0,
                         fill: true 
                        }]
                         },
                             options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    x: { ticks: { maxTicksLimit: 24 } },
                                    y: { 
                                        beginAtZero: true,
                                        title: { display: true,
                                        text: 'Litros por minuto (L/min)' }
                                         } 
                                    },
                                plugins: { legend: { display: false }} 
                                } 
                });

            const hourlyAggregatedData = aggregateHourlyData();
            const barScaledData = hourlyAggregatedData.map(d => d * factor);
            const barColors = Array.from({ length: 24 }, (_, i) => (inputs.tipoSistema !== 'sala_calderas' && i >= params.horaPuntaInicio && i < params.horaPuntaFin) ? 'rgba(255, 99, 132, 0.5)' : 'rgba(0, 86, 179, 0.5)');
            const borderColors = Array.from({ length: 24 }, (_, i) => (inputs.tipoSistema !== 'sala_calderas' && i >= params.horaPuntaInicio && i < params.horaPuntaFin) ? 'rgba(255, 99, 132, 1)' : 'rgba(0, 86, 179, 1)');
            const barLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
            if (barChartInstance) barChartInstance.destroy();
            barChartInstance = new Chart(DOM.barChartCanvas, { type: 'bar', data: { labels: barLabels, datasets: [{ label: 'Consumo Total (Litros)', data: barScaledData, backgroundColor: barColors, borderColor: borderColors, borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: 'Litros (Lts)' } } }, plugins: { legend: { display: false }, datalabels: { display: true, color: '#333', anchor: 'end', align: 'top', font: { weight: 'bold', size: 10 }, formatter: (v) => (v > 1) ? Math.round(v) : '' } } } });
        }

        const monthlyLabels = Object.keys(consumoMensualDistribucion).map(m => m.charAt(0).toUpperCase() + m.slice(1));
        const monthlyDataM3 = Object.values(consumoMensualDistribucion).map(dist => results.consumoAnualTotalM3 * dist);
        if (monthlyChartInstance) monthlyChartInstance.destroy();
        monthlyChartInstance = new Chart(DOM.monthlyChartCanvas, { type: 'bar', data: { labels: monthlyLabels, datasets: [{ label: 'Consumo Mensual (m³)', data: monthlyDataM3, backgroundColor: 'rgba(0, 86, 179, 0.5)', borderColor: 'rgba(0, 86, 179, 1)', borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: 'Metros Cúbicos (m³)' } } }, plugins: { legend: { display: false }, datalabels: { display: true, anchor: 'end', align: 'top', color: '#333', font: { weight: 'bold' }, formatter: (v) => v > 0 ? Math.round(v).toLocaleString('es-CL') : '' } } } });
        
        const ratioEsperado = (inputs.tipoSistema === 'sala_calderas') ? results.scmRatio : results.bcRatio;
        const tipoSistema = inputs.tipoSistema;
        let datasets = [], yAxisTitle = '', chartTitle = '';
        if (tipoSistema === 'sala_calderas') {
            yAxisTitle = 'm³ Gas / m³ H₂O'; chartTitle = 'Eficiencia Sala de Calderas';
            datasets = [ { label: 'SCM Boetek', data: efficiencyData.scm, borderColor: 'rgba(0, 86, 179, 1)', tension: 0.1, type: 'line', pointRadius: 0 }, { label: 'Sistema Tradicional', data: efficiencyData.traditional, borderColor: 'rgba(108, 117, 125, 1)', tension: 0.1, type: 'line', pointRadius: 0 }, { label: 'Punto de Operación', data: [{ x: results.dailyM3, y: ratioEsperado }], backgroundColor: 'red', type: 'scatter', pointRadius: 6, pointHoverRadius: 8 } ];
        } else {
            yAxisTitle = 'kWh / m³ H₂O'; chartTitle = 'Eficiencia Bomba de Calor';
            datasets = [ { label: 'Eficiencia BC', data: efficiencyData.bc, borderColor: 'rgba(0, 86, 179, 1)', tension: 0.1, type: 'line', pointRadius: 0 }, { label: 'Punto de Operación', data: [{ x: results.dailyM3, y: ratioEsperado }], backgroundColor: 'red', type: 'scatter', pointRadius: 6, pointHoverRadius: 8 } ];
        }
        if (efficiencyChartInstance) efficiencyChartInstance.destroy();
        efficiencyChartInstance = new Chart(DOM.efficiencyChartCanvas, { data: { datasets: datasets }, options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: false, text: chartTitle, font: { size: 16 } }, tooltip: { callbacks: { label: (c) => `${c.dataset.label || ''}: (${c.parsed.x.toFixed(2)} m³/día, ${c.parsed.y.toFixed(2)})` } } }, scales: { x: { type: 'linear', position: 'bottom', title: { display: true, text: 'Consumo Promedio (m³/día)' } }, y: { beginAtZero: true, title: { display: true, text: yAxisTitle } } } } });
    };

    const switchTab = (clickedTab, allTabs, allContainers) => {
        allTabs.forEach(t => t.classList.remove('active'));
        clickedTab.classList.add('active');
        const index = allTabs.findIndex(t => t === clickedTab);
        allContainers.forEach(c => c.style.display = 'none');
        if (index !== -1) allContainers[index].style.display = 'block';
    };

    // --- INICIALIZACIÓN Y EVENT LISTENERS ---
    const initializeApp = async () => {
        try {
            const response = await fetch('Data/datos_caudal.json');
            if (!response.ok) throw new Error('No se pudieron cargar los datos de monitoreo.');
            monitoringData = await response.json();
        } catch (error) {
            console.error('Error al cargar datos_caudal.json:', error);
            alert('No se pudo cargar el perfil de consumo para los gráficos. El resto de la aplicación funcionará.');
        }

        DOM.calculadoraForm.addEventListener('input', (event) => { if (event.target.matches('input, select')) { updateComparison(); } });
        DOM.metodoCalculoSelect.addEventListener('change', () => {
            const isDeptos = DOM.metodoCalculoSelect.value === 'departamentos';
            DOM.ingresoDepartamentosGroup.style.display = isDeptos ? 'block' : 'none';
            DOM.ingresoTotalPersonasGroup.style.display = isDeptos ? 'none' : 'block';
            updateComparison();
        });
        DOM.editBtn.addEventListener('click', () => toggleEditMode(false));
        DOM.saveBtn.addEventListener('click', () => toggleEditMode(true));
        DOM.tipoSistemaSelect.addEventListener('change', handleSistemaChange);

        const graphTabs = [DOM.tabLine, DOM.tabBar, DOM.tabMonthly, DOM.tabEfficiency];
        const graphContainers = [DOM.lineChartContainer, DOM.barChartContainer, DOM.monthlyChartContainer, DOM.efficiencyChartContainer];
        graphTabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab, graphTabs, graphContainers)));

        const analysisTabs = [DOM.tabComparative, DOM.tabSelection, DOM.tabPeakHours, DOM.tabInstantFlow];
        const analysisContainers = [DOM.comparativeTableContainer, DOM.selectionTableContainer, DOM.peakHoursContainer, DOM.instantFlowContainer];
        analysisTabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab, analysisTabs, analysisContainers)));

        updateViewModeDisplay();
        handleSistemaChange();
        DOM.metodoCalculoSelect.dispatchEvent(new Event('change'));
    };

    initializeApp();
    /**
     * Función global para exportar un gráfico de Chart.js como una imagen Base64.
     * Esto permite que otros scripts, como reporte.js, obtengan una imagen perfecta del gráfico.
     * @param {string} chartName - El nombre de la instancia del gráfico ('line', 'bar', 'monthly', 'efficiency').
     * @returns {string|null} - La imagen en formato Base64 o null si el gráfico no existe.
     */
    window.getChartImage = (chartName) => {
        let chartInstance;
        switch (chartName) {
            case 'line': chartInstance = lineChartInstance; break;
            case 'bar': chartInstance = barChartInstance; break;
            case 'monthly': chartInstance = monthlyChartInstance; break;
            case 'efficiency': chartInstance = efficiencyChartInstance; break;
            default: return null;
        }

        if (chartInstance) {
            return chartInstance.toBase64Image('image/png', 1); // Devuelve la imagen del gráfico
        }
        return null;
    };
    window.getInputDataForReport = () => {
    // Obtenemos los datos del formulario a través de la función existente
    const inputs = getInputData();

    // Obtenemos los textos seleccionados de los menús desplegables
    inputs.metodoCalculoTexto = DOM.metodoCalculoSelect.options[DOM.metodoCalculoSelect.selectedIndex].text;
    inputs.tipoSistemaTexto = DOM.tipoSistemaSelect.options[DOM.tipoSistemaSelect.selectedIndex].text;

    // AÑADIMOS LÓGICA PARA LEER LA TABLA DE DEPARTAMENTOS
    inputs.detalleDepartamentos = [];
    if (inputs.metodoCalculo === 'departamentos') {
        const filas = document.querySelectorAll('#depto-table tbody tr');
        filas.forEach(fila => {
            const columnas = fila.querySelectorAll('td');
            const unidades = fila.querySelector('input').value;
            // Solo agregamos la fila al reporte si tiene unidades
            if (parseInt(unidades, 10) > 0) {
                inputs.detalleDepartamentos.push([
                    columnas[0].textContent, // Cant. De Dormitorios
                    columnas[1].textContent, // Pers / depto
                    unidades,                // Unidades
                    columnas[3].textContent  // Total Personas
                ]);
            }
        });
        // Añadimos la fila de totales
        inputs.detalleDepartamentos.push([
            'Total',
            '',
            document.getElementById('total-unidades').textContent,
            document.getElementById('total-personas-general').textContent
        ]);
    }

    // Combinamos los inputs con los parámetros fijos
    return { ...inputs, ...params };
};
});

