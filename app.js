// app.js
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
        // TABS GRÁFICOS
        tabLine: document.getElementById('tab-line'),
        tabBar: document.getElementById('tab-bar'),
        tabMonthly: document.getElementById('tab-monthly'),
        tabEfficiency: document.getElementById('tab-efficiency'),
        // CONTAINERS GRÁFICOS
        lineChartContainer: document.getElementById('line-chart-container'),
        barChartContainer: document.getElementById('bar-chart-container'),
        monthlyChartContainer: document.getElementById('monthly-chart-container'),
        efficiencyChartContainer: document.getElementById('efficiency-chart-container'),
        lineChartCanvas: document.getElementById('lineChart').getContext('2d'),
        barChartCanvas: document.getElementById('barChart').getContext('2d'),
        monthlyChartCanvas: document.getElementById('monthlyChart').getContext('2d'),
        efficiencyChartCanvas: document.getElementById('efficiencyChart').getContext('2d'),
        // TABS ANÁLISIS
        tabEquipoSeleccionado: document.getElementById('tab-equipo-seleccionado'),
        tabSelection: document.getElementById('tab-selection'),
        tabPeakHours: document.getElementById('tab-peak-hours'),
        tabInstantFlow: document.getElementById('tab-instant-flow'),
        // CONTAINERS ANÁLISIS
        equipoSeleccionadoContainer: document.getElementById('equipo-seleccionado-container'),
        selectionTableContainer: document.getElementById('selection-table-container'),
        peakHoursContainer: document.getElementById('peak-hours-container'),
        instantFlowContainer: document.getElementById('instant-flow-container'),
        // ELEMENTOS NUEVA TABLA
        equipoSeleccionadoTableBody: document.querySelector('#equipo-seleccionado-table tbody'),
        equipoSelTempConsumo: document.getElementById('equipo-sel-temp-consumo'),
        equipoSelTempAcumulacion: document.getElementById('equipo-sel-temp-acumulacion'),
        equipoSelTempFria: document.getElementById('equipo-sel-temp-fria'),
        // ELEMENTOS TABLA SELECCIÓN
        selectionHeader: document.getElementById('selection-header'),
        selAnualM3: document.getElementById('sel-anual-m3'),
        selDiarioM3: document.getElementById('sel-diario-m3'),
        selRatio: document.getElementById('sel-ratio'),
        selCostoM3: document.getElementById('sel-costo-m3'),
        selCostoAnual: document.getElementById('sel-costo-anual'),
        // ELEMENTOS TABLA COMPARATIVA
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
        // ELEMENTOS TABLA HORA PUNTA
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
        // ELEMENTOS CAUDALES
        produccionContinua50cSpan: document.getElementById('produccion-continua-50c'),
        produccionContinua60cSpan: document.getElementById('produccion-continua-60c'),
        produccionContinuaTempSpan: document.getElementById('prod-continua-temp'),
        produccionContinuaValorSpan: document.getElementById('produccion-continua-valor'),
        // DISCLAIMER
        disclaimerTempAcumulacion: document.getElementById('disclaimer-temp-acumulacion'),
        disclaimerTempFria: document.getElementById('disclaimer-temp-fria'),
    };

    // --- VARIABLES GLOBALES Y CONSTANTES ---
    let lineChartInstance, barChartInstance, monthlyChartInstance, efficiencyChartInstance;
    let chartConfigs = {};
    let monitoringData = [];
    let globalResults = {};
    let config = {};
    let params = {
        demandaGuia: 'Low_Medium',
        litrosPersonaDia: 60,
        eficiencia: 0.90,
        usoAcumulador: 0.80,
        tempFria: 10,
        tempAcumulacion: 45,
        tempConsumo: 45,
        horaPuntaInicio: 18,
        horaPuntaFin: 22,
        valorGas: 1250,
        valorKwh: 150
    };
    

    // --- LÓGICA DE CÁLCULO Y DATOS ---

    const getInputData = () => {
        updateTotals();
        const totalPersonas = (DOM.metodoCalculoSelect.value === 'departamentos') ?
            parseFloat(DOM.totalPersonasGeneralCell.textContent) || 0 :
            parseFloat(DOM.inputTotalPersonas.value) || 0;

        let potenciaParaCalculo = 0;
        const tipoSistema = DOM.tipoSistemaSelect.value;
        const pBC = parseFloat(DOM.potenciaBcInput.value) || 0;
        const pRE = parseFloat(DOM.potenciaReInput.value) || 0;
        const potenciaIngresada = parseFloat(DOM.potenciaIngresadaInput.value) || 0;

        if (tipoSistema === 'sala_calderas') potenciaParaCalculo = potenciaIngresada;
        else if (tipoSistema === 'apoyo_re') potenciaParaCalculo = pBC + pRE;
        else if (tipoSistema === 'falla_re') potenciaParaCalculo = pBC;

        let detalleDepartamentos = [];
        if (DOM.metodoCalculoSelect.value === 'departamentos') {
            document.querySelectorAll('#depto-table tbody tr').forEach(row => {
                const cells = row.querySelectorAll('td');
                const unidades = parseInt(cells[2].querySelector('input').value, 10);
                detalleDepartamentos.push([
                    cells[0].textContent.trim(),
                    cells[1].textContent.trim(),
                    isNaN(unidades) ? 0 : unidades,
                    cells[3].textContent.trim()
                ]);
            });
        }

        return {
            totalPersonas,
            acumulacionIngresada: parseFloat(DOM.acumulacionIngresadaInput.value) || 0,
            tipoSistema,
            pBC,
            pRE,
            potenciaIngresada,
            potenciaParaCalculo,
            metodoCalculo: DOM.metodoCalculoSelect.value,
            metodoCalculoTexto: DOM.metodoCalculoSelect.options[DOM.metodoCalculoSelect.selectedIndex].text,
            tipoSistemaTexto: DOM.tipoSistemaSelect.options[DOM.tipoSistemaSelect.selectedIndex].text,
            detalleDepartamentos
        };
    };

const calculateResults = (inputs) => {
    const { eficiencia, usoAcumulador, tempFria, tempAcumulacion, tempConsumo } = params;
    const results = {};
    results.potenciaParaCalculo = inputs.potenciaParaCalculo;

    const consumoDiarioBaseLitros = inputs.totalPersonas * params.litrosPersonaDia;
    const consumoMensualJulioLitros = consumoDiarioBaseLitros * 31;
    // MODIFICADO
    results.consumoAnualTotalLitros = (config.consumoMensualDistribucion.julio > 0) ? (consumoMensualJulioLitros / config.consumoMensualDistribucion.julio) : 0;
    results.consumoAnualTotalM3 = results.consumoAnualTotalLitros / 1000;
    results.dailyM3 = results.consumoAnualTotalM3 / 365;

    // MODIFICADO
    results.scmRatio = interpolate(results.dailyM3, config.efficiencyData.scm);
    results.scmCostoM3 = results.scmRatio * params.valorGas;
    results.scmCostoAnual = results.scmCostoM3 * results.consumoAnualTotalM3;

    // MODIFICADO
    results.bcRatio = interpolate(results.dailyM3, config.efficiencyData.bc);
    results.bcCostoM3 = results.bcRatio * params.valorKwh;
    results.bcCostoAnual = results.bcCostoM3 * results.consumoAnualTotalM3;

    // MODIFICADO
    results.traditionalRatio = interpolate(results.dailyM3, config.efficiencyData.traditional);
    results.traditionalCostoM3 = results.traditionalRatio * params.valorGas;
    results.traditionalCostoAnual = results.traditionalCostoM3 * results.consumoAnualTotalM3;

    results.consumoPuntaLts = 0;
    if (monitoringData.length > 0 && inputs.tipoSistema !== 'sala_calderas') {
        // MODIFICADO
        const factor = inputs.totalPersonas > 0 ? inputs.totalPersonas / config.constants.PERSONAS_BASE_MONITOREO : 0;
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
        // MODIFICADO
        const energiaAcumulacion = (inputs.acumulacionIngresada * usoAcumulador) * config.constants.CALOR_ESPECIFICO_AGUA * (tempAcumulacion - tempFria);
        const calculatePeakGeneration = (power) => (power * eficiencia * duracionPuntaSegundos + energiaAcumulacion) / (config.constants.CALOR_ESPECIFICO_AGUA * (tempConsumo - tempFria));
        results.generacionPunta['100'] = calculatePeakGeneration(inputs.pBC * 1.0);
        results.generacionPunta['75'] = calculatePeakGeneration(inputs.pBC * 0.75);
        results.generacionPunta['50'] = calculatePeakGeneration(inputs.pBC * 0.50);
        results.generacionPunta['25'] = calculatePeakGeneration(inputs.pBC * 0.25);
        results.generacionPunta['0'] = calculatePeakGeneration(0);
    }

    // MODIFICADO
    results.caudal50c = (results.potenciaParaCalculo * eficiencia * 60) / (config.constants.CALOR_ESPECIFICO_AGUA * (50 - tempFria));
    results.caudal60c = (results.potenciaParaCalculo * eficiencia * 60) / (config.constants.CALOR_ESPECIFICO_AGUA * (60 - tempFria));
    results.caudalSeleccionado = (results.potenciaParaCalculo * eficiencia * 60) / (config.constants.CALOR_ESPECIFICO_AGUA * (tempConsumo - tempFria));

    return results;
};

    // --- FUNCIONES PARA OBTENER DATOS DE TABLAS ---

    const getResultadoTableData = (inputs, results) => {
    const { eficiencia, usoAcumulador, tempFria, tempAcumulacion } = params;
    const demanda = config.demandaData[params.demandaGuia];
    const peakTimes = { "Peak 5 min": "5min", "Peak 15 min": "15min", "Peak 30 min": "30min", "Peak 60 min": "60min", "Peak 120 min": "120min", "Peak 180 min": "180min", "Diario Promedio": "diarioAvg", "Diario Máximo": "diarioMax" };
    const data = [];

    for (const [label, key] of Object.entries(peakTimes)) {
        const volumenRequerido = inputs.totalPersonas * demanda[key];
        const boetekValue = config.demandaData.Monitoreo[key];
        const volumenBoetek = typeof boetekValue === 'number' ? inputs.totalPersonas * boetekValue : boetekValue;

        let volumenProporcionado = 0;
        const tempFijaComparacion = 50; // USA 50°C FIJO PARA ASHRAE
        if (key.includes('min')) {
            const tiempoSegundos = parseInt(key.match(/\d+/)[0]) * 60;
            const energiaPotencia = results.potenciaParaCalculo * eficiencia * tiempoSegundos;
            const energiaAcumulacion = (inputs.acumulacionIngresada * usoAcumulador) * config.constants.CALOR_ESPECIFICO_AGUA * (tempAcumulacion - tempFria);
            volumenProporcionado = (energiaPotencia + energiaAcumulacion) / (config.constants.CALOR_ESPECIFICO_AGUA * (tempFijaComparacion - tempFria));
        } else {
            volumenProporcionado = (results.potenciaParaCalculo * eficiencia * (24 * 3600)) / (config.constants.CALOR_ESPECIFICO_AGUA * (tempFijaComparacion - tempFria));
        }

        const cumple = volumenProporcionado >= volumenRequerido ? 'OK' : 'Insuficiente';
        const sobredimensionamiento = (typeof boetekValue === 'number' && volumenBoetek > 0) ? `${(((volumenProporcionado / volumenBoetek) - 1) * 100).toFixed(0)}%` : 'N/A';
        
        let capacidadFalla = '', cumpleFalla = '';
        if (inputs.tipoSistema === 'falla_re' && typeof boetekValue === 'number') {
            let capacidadModoFalla = 0;
            const energiaAcumulacion = (inputs.acumulacionIngresada * usoAcumulador) * config.constants.CALOR_ESPECIFICO_AGUA * (tempAcumulacion - tempFria);
             if (key.includes('min')) {
                const tiempoSegundos = parseInt(key.match(/\d+/)[0]) * 60;
                const energiaPotencia = inputs.pRE * eficiencia * tiempoSegundos;
                capacidadModoFalla = (energiaPotencia + energiaAcumulacion) / (config.constants.CALOR_ESPECIFICO_AGUA * (tempFijaComparacion - tempFria));
            } else {
                capacidadModoFalla = (inputs.pRE * eficiencia * (24 * 3600)) / (config.constants.CALOR_ESPECIFICO_AGUA * (tempFijaComparacion - tempFria));
            }
            capacidadFalla = `${Math.round(capacidadModoFalla).toLocaleString('es-CL')} L`;
            cumpleFalla = capacidadModoFalla >= volumenBoetek ? 'OK' : 'Insuficiente';
        }

        data.push([
            label,
            `${Math.round(volumenRequerido).toLocaleString('es-CL')} L`,
            `${Math.round(volumenProporcionado).toLocaleString('es-CL')} L`,
            cumple,
            typeof volumenBoetek === 'number' ? `${Math.round(volumenBoetek).toLocaleString('es-CL')} L` : volumenBoetek,
            sobredimensionamiento,
            capacidadFalla,
            cumpleFalla
        ]);
    }
    return data;
};

   const getEquipoSeleccionadoTableData = (inputs) => {
    const { eficiencia, usoAcumulador, tempFria, tempAcumulacion, tempConsumo } = params;
    const data = [];
    const peakTimes = {
        "5 min": 5 * 60,
        "15 min": 15 * 60,
        "30 min": 30 * 60,
        "60 min": 60 * 60,
        "120 min": 120 * 60,
        "180 min": 180 * 60,
        "Día Completo": 24 * 3600
    };

    for (const [label, tiempoSegundos] of Object.entries(peakTimes)) {
        const energiaPotencia = inputs.potenciaParaCalculo * eficiencia * tiempoSegundos;
        const energiaAcumulacion = (inputs.acumulacionIngresada * usoAcumulador) * config.constants.CALOR_ESPECIFICO_AGUA * (tempAcumulacion - tempFria);
        // USA tempConsumo (parámetro de usuario)
        const volumenProporcionado = (energiaPotencia + energiaAcumulacion) / (config.constants.CALOR_ESPECIFICO_AGUA * (tempConsumo - tempFria));
        
        data.push([
            label,
            `${Math.round(volumenProporcionado).toLocaleString('es-CL')} L`
        ]);
    }
    return data;
};
    
    const getComparativeTableData = (results) => {
        const formatCurrency = (value) => `$${Math.round(value).toLocaleString('es-CL')}`;
        return [
            ['M3 ACS anual', `${Math.round(results.consumoAnualTotalM3).toLocaleString('es-CL')} m³`, `${Math.round(results.consumoAnualTotalM3).toLocaleString('es-CL')} m³`, `${Math.round(results.consumoAnualTotalM3).toLocaleString('es-CL')} m³`],
            ['Prom M3 Dia', `${results.dailyM3.toFixed(2)} m³`, `${results.dailyM3.toFixed(2)} m³`, `${results.dailyM3.toFixed(2)} m³`],
            ['Ratio de generación', `${results.scmRatio.toFixed(2)} m³ gas/m³`, `${results.bcRatio.toFixed(2)} kWh/m³`, `${results.traditionalRatio.toFixed(2)} m³ gas/m³`],
            ['Valor m³ ACS', formatCurrency(results.scmCostoM3), formatCurrency(results.bcCostoM3), formatCurrency(results.traditionalCostoM3)],
            ['Costo Anual ACS', formatCurrency(results.scmCostoAnual), formatCurrency(results.bcCostoAnual), formatCurrency(results.traditionalCostoAnual)]
        ];
    };

    const getSelectionTableData = (inputs, results) => {
        const formatCurrency = (value) => `$${Math.round(value).toLocaleString('es-CL')}`;
        const header = inputs.tipoSistema === 'sala_calderas' ? 'SCM (a Gas)' : 'Bomba de Calor';
        const ratioText = inputs.tipoSistema === 'sala_calderas' ? `${results.scmRatio.toFixed(2)} m³ gas/m³` : `${results.bcRatio.toFixed(2)} kWh/m³`;
        const costoM3 = inputs.tipoSistema === 'sala_calderas' ? results.scmCostoM3 : results.bcCostoM3;
        const costoAnual = inputs.tipoSistema === 'sala_calderas' ? results.scmCostoAnual : results.bcCostoAnual;
        
        const body = [
            ['M3 ACS anual', `${Math.round(results.consumoAnualTotalM3).toLocaleString('es-CL')} m³`],
            ['Prom M3 Dia', `${results.dailyM3.toFixed(2)} m³`],
            ['Ratio de generación', ratioText],
            ['Valor m³ ACS', formatCurrency(costoM3)],
            ['Costo Anual ACS', formatCurrency(costoAnual)]
        ];
        return { header, body };
    };

    const getPeakHoursTableData = (results) => {
        const consumoPunta = `${Math.round(results.consumoPuntaLts).toLocaleString('es-CL')} L`;
        const scenarios = [
            { label: 'Suministro con BC al 100%', key: '100' },
            { label: 'Suministro con BC al 75%', key: '75' },
            { label: 'Suministro con BC al 50%', key: '50' },
            { label: 'Suministro con BC al 25%', key: '25' },
            { label: 'Suministro sin BC (solo acumulación)', key: '0' }
        ];
        return scenarios.map(s => {
            const generacion = results.generacionPunta[s.key] !== undefined ? Math.round(results.generacionPunta[s.key]) : 0;
            const cumple = generacion >= results.consumoPuntaLts ? 'OK' : 'Insuficiente';
            return [s.label, consumoPunta, cumple, `${generacion.toLocaleString('es-CL')} L`];
        });
    };

    const getInstantFlowData = (results) => {
        return {
            '50c': `${results.caudal50c.toFixed(2)} L/min`,
            '60c': `${results.caudal60c.toFixed(2)} L/min`,
            'consumo': `${results.caudalSeleccionado.toFixed(2)} L/min`,
            'tempConsumo': `${params.tempConsumo}°C`
        };
    };

    // --- FUNCIÓN PRINCIPAL DE ACTUALIZACIÓN ---

    const updateComparison = () => {
        const userInputs = getInputData();
        const calculatedResults = calculateResults(userInputs);
        
        updateUITables(userInputs, calculatedResults);
        updateCharts(userInputs, calculatedResults);

        globalResults = {
            inputs: userInputs,
            params: params,
            calculatedResults: calculatedResults,
            tableData: {
                resultado: getResultadoTableData(userInputs, calculatedResults),
                equipoSeleccionado: getEquipoSeleccionadoTableData(userInputs),
                comparative: getComparativeTableData(calculatedResults),
                selection: getSelectionTableData(userInputs, calculatedResults),
                peakHours: getPeakHoursTableData(calculatedResults),
                instantFlow: getInstantFlowData(calculatedResults)
            }
        };
    };
    
    // --- FUNCIONES DE ACTUALIZACIÓN DE UI ---

    const updateUITables = (inputs, results) => {
        updateEquipoSeleccionadoTable(inputs);
        updateCostTables(inputs, results);
        updateResultsTable(inputs, results);
        updateOperationPanels(results);
        updateDisclaimerText();
    };

    const updateEquipoSeleccionadoTable = (inputs) => {
        if (!DOM.equipoSeleccionadoTableBody) return; // Verificación de seguridad
        DOM.equipoSeleccionadoTableBody.innerHTML = '';
        const tableData = getEquipoSeleccionadoTableData(inputs);
        tableData.forEach(rowData => {
            const row = DOM.equipoSeleccionadoTableBody.insertRow();
            row.innerHTML = `
                <td>${rowData[0]}</td>
                <td>${rowData[1]}</td>
            `;
        });
        // ACTUALIZAR LOS TRES SPANS
        DOM.equipoSelTempConsumo.textContent = params.tempConsumo;
        DOM.equipoSelTempAcumulacion.textContent = params.tempAcumulacion;
        DOM.equipoSelTempFria.textContent = params.tempFria;
    };
    const updateCostTables = (inputs, results) => {
        const comparativeData = getComparativeTableData(results);
        DOM.compScmAnualM3.textContent = comparativeData[0][1];
        DOM.compBcAnualM3.textContent = comparativeData[0][2];
        DOM.compTradAnualM3.textContent = comparativeData[0][3];
        DOM.compScmDiarioM3.textContent = comparativeData[1][1];
        DOM.compBcDiarioM3.textContent = comparativeData[1][2];
        DOM.compTradDiarioM3.textContent = comparativeData[1][3];
        DOM.compScmRatio.textContent = comparativeData[2][1];
        DOM.compBcRatio.textContent = comparativeData[2][2];
        DOM.compTradRatio.textContent = comparativeData[2][3];
        DOM.compScmCostoM3.textContent = comparativeData[3][1];
        DOM.compBcCostoM3.textContent = comparativeData[3][2];
        DOM.compTradCostoM3.textContent = comparativeData[3][3];
        DOM.compScmCostoAnual.textContent = comparativeData[4][1];
        DOM.compBcCostoAnual.textContent = comparativeData[4][2];
        DOM.compTradCostoAnual.textContent = comparativeData[4][3];

        const selectionData = getSelectionTableData(inputs, results);
        DOM.selectionHeader.textContent = selectionData.header;
        DOM.selAnualM3.textContent = selectionData.body[0][1];
        DOM.selDiarioM3.textContent = selectionData.body[1][1];
        DOM.selRatio.textContent = selectionData.body[2][1];
        DOM.selCostoM3.textContent = selectionData.body[3][1];
        DOM.selCostoAnual.textContent = selectionData.body[4][1];
    };
    
    const updateResultsTable = (inputs, results) => {
        DOM.resultadoTableBody.innerHTML = '';
        const tableData = getResultadoTableData(inputs, results);
        tableData.forEach(rowData => {
            const row = DOM.resultadoTableBody.insertRow();
            row.innerHTML = `
                <td>${rowData[0]}</td>
                <td>${rowData[1]}</td>
                <td>${rowData[2]}</td>
                <td class="${rowData[3] === 'OK' ? 'status-ok' : 'status-insuficiente'}">${rowData[3]}</td>
                <td class="boetek-col">${rowData[4]}</td>
                <td class="sobre-dimensionamiento-col">${rowData[5]}</td>
                <td class="col-falla">${rowData[6]}</td>
                <td class="col-falla ${rowData[7] === 'OK' ? 'status-ok' : (rowData[7] ? 'status-insuficiente' : '')}">${rowData[7]}</td>
            `;
        });
    };

    const updateOperationPanels = (results) => {
        const peakHoursData = getPeakHoursTableData(results);
        DOM.consumoPuntaCells.forEach(cell => { cell.textContent = peakHoursData.length ? peakHoursData[0][1] : ''; });
        
        const scenarios = [
            { valCell: DOM.validadorPunta100, genCell: DOM.genPunta100, dataIndex: 0 },
            { valCell: DOM.validadorPunta75, genCell: DOM.genPunta75, dataIndex: 1 },
            { valCell: DOM.validadorPunta50, genCell: DOM.genPunta50, dataIndex: 2 },
            { valCell: DOM.validadorPunta25, genCell: DOM.genPunta25, dataIndex: 3 },
            { valCell: DOM.validadorPunta0, genCell: DOM.genPunta0, dataIndex: 4 },
        ];
        scenarios.forEach(s => {
            if (peakHoursData[s.dataIndex]) {
                updateStatusCell(s.valCell, peakHoursData[s.dataIndex][2] === 'OK');
                s.genCell.textContent = peakHoursData[s.dataIndex][3];
            }
        });

        const flowData = getInstantFlowData(results);
        DOM.produccionContinua50cSpan.textContent = flowData['50c'].replace(' L/min','');
        DOM.produccionContinua60cSpan.textContent = flowData['60c'].replace(' L/min','');
        DOM.produccionContinuaTempSpan.textContent = params.tempConsumo;
        DOM.produccionContinuaValorSpan.textContent = flowData['consumo'].replace(' L/min','');
        
        const inputs = getInputData();
        if(inputs.tipoSistema === 'apoyo_re' || inputs.tipoSistema === 'falla_re') {
            DOM.potenciaTotalDisplaySpan.textContent = (inputs.pBC + inputs.pRE).toString();
        }
    };
    
    const updateDisclaimerText = () => {
        DOM.disclaimerTempAcumulacion.textContent = params.tempAcumulacion;
        DOM.disclaimerTempFria.textContent = params.tempFria;
    };

    // --- GRÁFICOS ---
   const updateCharts = (inputs, results) => {
    // Gráfico de Líneas (Perfil Diario)
    if (monitoringData.length > 0) {
        const factor = inputs.totalPersonas > 0 ? inputs.totalPersonas / config.constants.PERSONAS_BASE_MONITOREO : 0;
        const lineLabels = monitoringData.map(d => new Date(d.created_at).toTimeString().substring(0, 5));
        const lineScaledData = monitoringData.map(d => d["caudal L/min"] * factor);
        
        chartConfigs.line = {
             type: 'line', data: { labels: lineLabels, datasets: [{ label: 'Caudal Simulado (L/min)', data: lineScaledData, borderColor: 'rgba(0, 86, 179, 1)', backgroundColor: 'rgba(0, 86, 179, 0.2)', borderWidth: 1.5, pointRadius: 0, fill: true }] }, options: { responsive: true, maintainAspectRatio: true, scales: { x: { ticks: { maxTicksLimit: 24 } }, y: { beginAtZero: true, title: { display: true, text: 'Litros por minuto (L/min)' } } }, plugins: { legend: { display: false }} } 
        };
        if (lineChartInstance) lineChartInstance.destroy();
        lineChartInstance = new Chart(DOM.lineChartCanvas, chartConfigs.line);
    }

    // Gráfico de Barras (Consumo por Hora)
    if (monitoringData.length > 0) {
        const hourlyAggregatedData = aggregateHourlyData();
        const factor = inputs.totalPersonas > 0 ? inputs.totalPersonas / config.constants.PERSONAS_BASE_MONITOREO : 0;
        const barScaledData = hourlyAggregatedData.map(d => d * factor);
        const barColors = Array.from({ length: 24 }, (_, i) => (inputs.tipoSistema !== 'sala_calderas' && i >= params.horaPuntaInicio && i < params.horaPuntaFin) ? 'rgba(255, 99, 132, 0.5)' : 'rgba(0, 86, 179, 0.5)');
        const borderColors = Array.from({ length: 24 }, (_, i) => (inputs.tipoSistema !== 'sala_calderas' && i >= params.horaPuntaInicio && i < params.horaPuntaFin) ? 'rgba(255, 99, 132, 1)' : 'rgba(0, 86, 179, 1)');
        const barLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
        
        chartConfigs.bar = { type: 'bar', data: { labels: barLabels, datasets: [{ label: 'Consumo Total (Litros)', data: barScaledData, backgroundColor: barColors, borderColor: borderColors, borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true, title: { display: true, text: 'Litros (Lts)' } } }, plugins: { legend: { display: false }, datalabels: { display: true, color: '#333', anchor: 'end', align: 'top', font: { weight: 'bold', size: 10 }, formatter: (v) => (v > 1) ? Math.round(v) : '' } } } };
        if (barChartInstance) barChartInstance.destroy();
        barChartInstance = new Chart(DOM.barChartCanvas, chartConfigs.bar);
    }

    // Gráfico Mensual
    const monthlyLabels = Object.keys(config.consumoMensualDistribucion).map(m => m.charAt(0).toUpperCase() + m.slice(1));
    const monthlyDataM3 = Object.values(config.consumoMensualDistribucion).map(dist => results.consumoAnualTotalM3 * dist);
    
    chartConfigs.monthly = { type: 'bar', data: { labels: monthlyLabels, datasets: [{ label: 'Consumo Mensual (m³)', data: monthlyDataM3, backgroundColor: 'rgba(0, 86, 179, 0.5)', borderColor: 'rgba(0, 86, 179, 1)', borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true, title: { display: true, text: 'Metros Cúbicos (m³)' } } }, plugins: { legend: { display: false }, datalabels: { display: true, anchor: 'end', align: 'top', color: '#333', font: { weight: 'bold' }, formatter: (v) => v > 0 ? Math.round(v).toLocaleString('es-CL') : '' } } } };
    if (monthlyChartInstance) monthlyChartInstance.destroy();
    monthlyChartInstance = new Chart(DOM.monthlyChartCanvas, chartConfigs.monthly);
    
    // Gráfico de Eficiencia
    const ratioEsperado = (inputs.tipoSistema === 'sala_calderas') ? results.scmRatio : results.bcRatio;
    const tipoSistema = inputs.tipoSistema;
    let datasets = [], yAxisTitle = '';
    if (tipoSistema === 'sala_calderas') {
        yAxisTitle = 'm³ Gas / m³ H₂O';
        datasets = [ { label: 'SCM Boetek', data: config.efficiencyData.scm, borderColor: 'rgba(0, 86, 179, 1)', tension: 0.1, type: 'line', pointRadius: 0 }, { label: 'Sistema Tradicional', data: config.efficiencyData.traditional, borderColor: 'rgba(108, 117, 125, 1)', tension: 0.1, type: 'line', pointRadius: 0 }, { label: 'Punto de Operación', data: [{ x: results.dailyM3, y: ratioEsperado }], backgroundColor: 'red', type: 'scatter', pointRadius: 6, pointHoverRadius: 8 } ];
    } else {
        yAxisTitle = 'kWh / m³ H₂O';
        datasets = [ { label: 'Eficiencia BC', data: config.efficiencyData.bc, borderColor: 'rgba(0, 86, 179, 1)', tension: 0.1, type: 'line', pointRadius: 0 }, { label: 'Punto de Operación', data: [{ x: results.dailyM3, y: ratioEsperado }], backgroundColor: 'red', type: 'scatter', pointRadius: 6, pointHoverRadius: 8 } ];
    }
    
    chartConfigs.efficiency = { data: { datasets: datasets }, options: { responsive: true, maintainAspectRatio: true, plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label || ''}: (${c.parsed.x.toFixed(2)} m³/día, ${c.parsed.y.toFixed(2)})` } } }, scales: { x: { type: 'linear', position: 'bottom', title: { display: true, text: 'Consumo Promedio (m³/día)' } }, y: { beginAtZero: true, title: { display: true, text: yAxisTitle } } } } };
    if (efficiencyChartInstance) efficiencyChartInstance.destroy();
    efficiencyChartInstance = new Chart(DOM.efficiencyChartCanvas, chartConfigs.efficiency);
};

    // --- FUNCIONES AUXILIARES Y DE MANEJO DE ESTADO ---

    const updateTotals = () => {
        let totalUnidades = 0,
            totalPersonas = 0;
        DOM.deptoInputs.forEach(input => {
            const row = input.closest('tr');
            const unidades = parseFloat(input.value) || 0;
            const personasPorDepto = parseFloat(row.querySelector('td:nth-child(2)').textContent);
            const totalPersonasFila = unidades * personasPorDepto;
            row.querySelector('.total-personas-row').textContent = unidades > 0 ? totalPersonasFila.toFixed(1) : '';
            totalUnidades += unidades;
            totalPersonas += totalPersonasFila;
        });
        DOM.totalUnidadesCell.textContent = totalUnidades > 0 ? totalUnidades : '';
        DOM.totalPersonasGeneralCell.textContent = totalPersonas > 0 ? totalPersonas.toFixed(1) : '';
    };

    const updateStatusCell = (cell, isOk) => {
        cell.textContent = isOk ? 'OK' : 'Insuficiente';
        cell.className = isOk ? 'status-ok' : 'status-insuficiente';
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
        
        if (!esBombaDeCalor && DOM.tabPeakHours.classList.contains('active')) {
            switchTab(DOM.tabEquipoSeleccionado, 
                [DOM.tabEquipoSeleccionado, DOM.tabSelection, DOM.tabPeakHours, DOM.tabInstantFlow], 
                [DOM.equipoSeleccionadoContainer, DOM.selectionTableContainer, DOM.peakHoursContainer, DOM.instantFlowContainer]
            );
        }
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
        document.getElementById('view-demanda-guia').textContent = params.demandaGuia.replace('_', ' ');
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
        monitoringData.forEach(d => {
            const hour = new Date(d.created_at).getHours();
            hourlyConsumption[hour] += d["caudal L/min"];
        });
        return hourlyConsumption;
    };

    const interpolate = (x, dataPoints) => {
        if (!Array.isArray(dataPoints) || dataPoints.length === 0) return 0;
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
        if (!p1) return sortedPoints[sortedPoints.length - 1].y;
        return p1.y + ((x - p1.x) / (p2.x - p1.x)) * (p2.y - p1.y);
    };

    const switchTab = (clickedTab, allTabs, allContainers) => {
        allTabs.forEach(t => t.classList.remove('active'));
        clickedTab.classList.add('active');
        const index = allTabs.findIndex(t => t === clickedTab);
        allContainers.forEach(c => c.style.display = 'none');
        if (index !== -1) allContainers[index].style.display = 'block';
    };

    // --- INICIALIZACIÓN DE LA APP ---

   const initializeApp = async () => {
    try {
        // Carga los dos archivos de datos en paralelo para mayor eficiencia
        const [monitoringResponse, configResponse] = await Promise.all([
            fetch('Data/datos_caudal.json'),
            fetch('Data/config.json') 
        ]);

        if (!monitoringResponse.ok) throw new Error('No se pudieron cargar los datos de monitoreo.');
        if (!configResponse.ok) throw new Error('No se pudo cargar el archivo de configuración.');

        monitoringData = await monitoringResponse.json();
        config = await configResponse.json(); // Carga la configuración en la variable global

    } catch (error) {
        console.error('Error durante la inicialización:', error);
        // Opcional: Mostrar un mensaje de error al usuario en la página
        alert('Error al cargar los datos necesarios para la aplicación. Por favor, recargue la página.');
        return; // Detiene la ejecución si los datos no se cargan
    }

    // El resto de los listeners permanece igual
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

    // Listeners de pestañas
    const graphTabs = [DOM.tabLine, DOM.tabBar, DOM.tabMonthly, DOM.tabEfficiency];
    const graphContainers = [DOM.lineChartContainer, DOM.barChartContainer, DOM.monthlyChartContainer, DOM.efficiencyChartContainer];
    graphTabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab, graphTabs, graphContainers)));

    const analysisTabs = [DOM.tabEquipoSeleccionado, DOM.tabSelection, DOM.tabPeakHours];
    const analysisContainers = [DOM.equipoSeleccionadoContainer, DOM.selectionTableContainer, DOM.peakHoursContainer];
    analysisTabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab, analysisTabs, analysisContainers)));

    // Carga inicial
    updateViewModeDisplay();
    handleSistemaChange();
};

    initializeApp();

    // --- FUNCIONES GLOBALES PARA REPORTE ---
    window.getChartImage = (chartName, format = 'jpeg', quality = 0.7, width = 1200, height = 600) => {
        return new Promise((resolve) => {
            const config = chartConfigs[chartName];
            if (!config) {
                console.warn(`Gráfico "${chartName}" no encontrado.`);
                resolve(null);
                return;
            }

            const exportConfig = JSON.parse(JSON.stringify(config));
            exportConfig.options.responsive = false;
            exportConfig.options.animation = false;
            exportConfig.options.devicePixelRatio = 2;

            if (chartName === 'bar' || chartName === 'monthly') {
                if (exportConfig.data.datasets[0]) {
                    exportConfig.data.datasets[0].data = exportConfig.data.datasets[0].data.map(v => Math.round(v));
                }
            }

            exportConfig.plugins = exportConfig.plugins || [];
            exportConfig.plugins.push({
                id: 'custom_canvas_background',
                beforeDraw: (chart) => {
                    const ctx = chart.canvas.getContext('2d');
                    ctx.save();
                    ctx.globalCompositeOperation = 'destination-over';
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, chart.width, chart.height);
                    ctx.restore();
                }
            });

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            
            const chartInstance = new Chart(tempCtx, exportConfig);
            setTimeout(() => {
                resolve(tempCanvas.toDataURL(`image/${format}`, quality));
                chartInstance.destroy();
            }, 250);
        });
    };

    window.getReportData = () => {
        return globalResults;
    };
});