// app.js

import DOM from './js/dom.js';
import { calculateResults, getResultadoTableData, getComparativeTableData, getSelectionTableData, getPeakHoursTableData, getInstantFlowData } from './js/calculations.js';
import { updateUITables, updateTotals, updateSystemView, updateViewModeDisplay, toggleEditMode, switchTab } from './js/ui.js';
import { updateCharts, getChartConfig } from './js/charts.js'; // <-- NUEVA IMPORTACIÓN

document.addEventListener('DOMContentLoaded', async () => {
    // --- REGISTRO DE PLUGINS Y VARIABLES GLOBALES DE ESTADO ---
    Chart.register(ChartDataLabels);
    Chart.defaults.plugins.datalabels.display = false;

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
        // La llamada a updateCharts ahora necesita todos los datos
        updateCharts(userInputs, calculatedResults, params, config, monitoringData);

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

        updateViewModeDisplay(params);
        updateSystemView();
        updateComparison();
    };

    initializeApp();

    // --- FUNCIONES GLOBALES PARA REPORTE ---
    window.getChartImage = (chartName, format = 'jpeg', quality = 0.7, width = 1200, height = 600) => {
        return new Promise((resolve) => {
            const config = getChartConfig(chartName); // Usa la nueva función importada
            if (!config) {
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
    
    window.getReportData = () => globalResults;
});