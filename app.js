// app.js

import DOM from './js/dom.js';
import { calculateResults, getResultadoTableData, getComparativeTableData, getSelectionTableData, getPeakHoursTableData, getInstantFlowData, aggregateHourlyData } from './js/calculations.js';
import { updateUITables, updateTotals, updateSystemView, updateViewModeDisplay, toggleEditMode, switchTab } from './js/ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    // --- REGISTRO DE PLUGINS Y VARIABLES GLOBALES DE ESTADO ---
    Chart.register(ChartDataLabels);
    Chart.defaults.plugins.datalabels.display = false;

    let lineChartInstance, barChartInstance, monthlyChartInstance, efficiencyChartInstance;
    let chartConfigs = {};
    let monitoringData = [];
    let globalResults = {};
    let config = {};
    let params = {
        demandaGuia: 'Low_Medium', litrosPersonaDia: 60, eficiencia: 0.90, usoAcumulador: 0.80,
        tempFria: 10, tempAcumulacion: 45, tempConsumo: 45, horaPuntaInicio: 18,
        horaPuntaFin: 22, valorGas: 1250, valorKwh: 150
    };

    // --- LÓGICA DE DATOS Y ESTADO ---

    const getInputData = () => {
        updateTotals();
        const totalPersonas = (DOM.metodoCalculoSelect.value === 'departamentos')
            ? parseFloat(DOM.totalPersonasGeneralCell.textContent) || 0
            : parseFloat(DOM.inputTotalPersonas.value) || 0;

        const tipoSistema = DOM.tipoSistemaSelect.value;
        const pBC = parseFloat(DOM.potenciaBcInput.value) || 0;
        const pRE = parseFloat(DOM.potenciaReInput.value) || 0;
        const potenciaIngresada = parseFloat(DOM.potenciaIngresadaInput.value) || 0;

        let potenciaParaCalculo = 0;
        if (tipoSistema === 'sala_calderas') potenciaParaCalculo = potenciaIngresada;
        else if (tipoSistema === 'apoyo_re') potenciaParaCalculo = pBC + pRE;
        else if (tipoSistema === 'falla_re') potenciaParaCalculo = pBC;

        let detalleDepartamentos = [];
        if (DOM.metodoCalculoSelect.value === 'departamentos') {
            document.querySelectorAll('#depto-table tbody tr').forEach(row => {
                const cells = row.querySelectorAll('td');
                const unidades = parseInt(cells[2].querySelector('input').value, 10);
                detalleDepartamentos.push([
                    cells[0].textContent.trim(), cells[1].textContent.trim(),
                    isNaN(unidades) ? 0 : unidades, cells[3].textContent.trim()
                ]);
            });
        }

        return {
            totalPersonas,
            acumulacionIngresada: parseFloat(DOM.acumulacionIngresadaInput.value) || 0,
            tipoSistema, pBC, pRE, potenciaIngresada, potenciaParaCalculo,
            metodoCalculo: DOM.metodoCalculoSelect.value,
            metodoCalculoTexto: DOM.metodoCalculoSelect.options[DOM.metodoCalculoSelect.selectedIndex].text,
            tipoSistemaTexto: DOM.tipoSistemaSelect.options[DOM.tipoSistemaSelect.selectedIndex].text,
            detalleDepartamentos
        };
    };

    // --- FUNCIÓN PRINCIPAL DE ACTUALIZACIÓN ---

    const updateComparison = () => {
        const userInputs = getInputData();
        const calculatedResults = calculateResults(userInputs, params, config, monitoringData);
        
        updateUITables(userInputs, calculatedResults, params, config);
        updateCharts(userInputs, calculatedResults);

        globalResults = {
            inputs: userInputs,
            params: params,
            tableData: {
                resultado: getResultadoTableData(userInputs, calculatedResults, params, config),
                equipoSeleccionado: getEquipoSeleccionadoTableData(userInputs, params, config),
                comparative: getComparativeTableData(calculatedResults),
                selection: getSelectionTableData(userInputs, calculatedResults),
                peakHours: getPeakHoursTableData(calculatedResults),
                instantFlow: getInstantFlowData(calculatedResults, params)
            }
        };
    };

    // --- GRÁFICOS ---

    const updateCharts = (inputs, results) => {
        if (monitoringData.length > 0) {
            const factor = inputs.totalPersonas > 0 ? inputs.totalPersonas / config.constants.PERSONAS_BASE_MONITOREO : 0;
            const lineLabels = monitoringData.map(d => new Date(d.created_at).toTimeString().substring(0, 5));
            const lineScaledData = monitoringData.map(d => d["caudal L/min"] * factor);
            chartConfigs.line = { type: 'line', data: { labels: lineLabels, datasets: [{ label: 'Caudal Simulado (L/min)', data: lineScaledData, borderColor: 'rgba(0, 86, 179, 1)', backgroundColor: 'rgba(0, 86, 179, 0.2)', borderWidth: 1.5, pointRadius: 0, fill: true }] }, options: { responsive: true, maintainAspectRatio: true, scales: { x: { ticks: { maxTicksLimit: 24 } }, y: { beginAtZero: true, title: { display: true, text: 'Litros por minuto (L/min)' } } }, plugins: { legend: { display: false }} } };
            if (lineChartInstance) lineChartInstance.destroy();
            lineChartInstance = new Chart(DOM.lineChartCanvas, chartConfigs.line);
        }

        if (monitoringData.length > 0) {
            const hourlyAggregatedData = aggregateHourlyData(monitoringData);
            const factor = inputs.totalPersonas > 0 ? inputs.totalPersonas / config.constants.PERSONAS_BASE_MONITOREO : 0;
            const barScaledData = hourlyAggregatedData.map(d => d * factor);
            const barColors = Array.from({ length: 24 }, (_, i) => (inputs.tipoSistema !== 'sala_calderas' && i >= params.horaPuntaInicio && i < params.horaPuntaFin) ? 'rgba(255, 99, 132, 0.5)' : 'rgba(0, 86, 179, 0.5)');
            const borderColors = Array.from({ length: 24 }, (_, i) => (inputs.tipoSistema !== 'sala_calderas' && i >= params.horaPuntaInicio && i < params.horaPuntaFin) ? 'rgba(255, 99, 132, 1)' : 'rgba(0, 86, 179, 1)');
            const barLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
            chartConfigs.bar = { type: 'bar', data: { labels: barLabels, datasets: [{ label: 'Consumo Total (Litros)', data: barScaledData, backgroundColor: barColors, borderColor: borderColors, borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true, title: { display: true, text: 'Litros (Lts)' } } }, plugins: { legend: { display: false }, datalabels: { display: true, color: '#333', anchor: 'end', align: 'top', font: { weight: 'bold', size: 10 }, formatter: (v) => (v > 1) ? Math.round(v) : '' } } } };
            if (barChartInstance) barChartInstance.destroy();
            barChartInstance = new Chart(DOM.barChartCanvas, chartConfigs.bar);
        }

        const monthlyLabels = Object.keys(config.consumoMensualDistribucion).map(m => m.charAt(0).toUpperCase() + m.slice(1));
        const monthlyDataM3 = Object.values(config.consumoMensualDistribucion).map(dist => results.consumoAnualTotalM3 * dist);
        chartConfigs.monthly = { type: 'bar', data: { labels: monthlyLabels, datasets: [{ label: 'Consumo Mensual (m³)', data: monthlyDataM3, backgroundColor: 'rgba(0, 86, 179, 0.5)', borderColor: 'rgba(0, 86, 179, 1)', borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true, title: { display: true, text: 'Metros Cúbicos (m³)' } } }, plugins: { legend: { display: false }, datalabels: { display: true, anchor: 'end', align: 'top', color: '#333', font: { weight: 'bold' }, formatter: (v) => v > 0 ? Math.round(v).toLocaleString('es-CL') : '' } } } };
        if (monthlyChartInstance) monthlyChartInstance.destroy();
        monthlyChartInstance = new Chart(DOM.monthlyChartCanvas, chartConfigs.monthly);
        
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

    // --- INICIALIZACIÓN Y EVENT LISTENERS ---

    const initializeApp = async () => {
        try {
            const [monitoringResponse, configResponse] = await Promise.all([
                fetch('Data/datos_caudal.json'), fetch('Data/config.json')
            ]);
            if (!monitoringResponse.ok || !configResponse.ok) throw new Error('Falló la carga de datos.');
            monitoringData = await monitoringResponse.json();
            config = await configResponse.json();
        } catch (error) {
            console.error('Error durante la inicialización:', error);
            alert('Error al cargar los datos necesarios para la aplicación.');
            return;
        }

        // --- Event Listeners ---
        DOM.calculadoraForm.addEventListener('input', (event) => {
            if (event.target.matches('input, select')) { updateComparison(); }
        });

        DOM.metodoCalculoSelect.addEventListener('change', () => {
            const isDeptos = DOM.metodoCalculoSelect.value === 'departamentos';
            DOM.ingresoDepartamentosGroup.style.display = isDeptos ? 'block' : 'none';
            DOM.ingresoTotalPersonasGroup.style.display = isDeptos ? 'none' : 'block';
            updateComparison();
        });

        DOM.tipoSistemaSelect.addEventListener('change', () => {
            updateSystemView();
            updateComparison();
        });

        DOM.editBtn.addEventListener('click', () => toggleEditMode(false, params));
        DOM.saveBtn.addEventListener('click', () => {
            const newParams = toggleEditMode(true, params);
            if (newParams) {
                params = newParams;
                updateViewModeDisplay(params);
                updateComparison();
            }
        });

        const graphTabs = [DOM.tabLine, DOM.tabBar, DOM.tabMonthly, DOM.tabEfficiency];
        const graphContainers = [DOM.lineChartContainer, DOM.barChartContainer, DOM.monthlyChartContainer, DOM.efficiencyChartContainer];
        graphTabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab, graphTabs, graphContainers)));

        const analysisTabs = [DOM.tabEquipoSeleccionado, DOM.tabSelection, DOM.tabPeakHours];
        const analysisContainers = [DOM.equipoSeleccionadoContainer, DOM.selectionTableContainer, DOM.peakHoursContainer];
        analysisTabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab, analysisTabs, analysisContainers)));

        // --- Carga Inicial ---
        updateViewModeDisplay(params);
        updateSystemView();
        updateComparison();
    };

    initializeApp();

    // --- FUNCIONES GLOBALES PARA REPORTE (se mantienen aquí) ---
    window.getChartImage = (chartName, format = 'jpeg', quality = 0.7, width = 1200, height = 600) => {
        // ... (código sin cambios)
    };
    window.getReportData = () => globalResults;
});