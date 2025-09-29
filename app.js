document.addEventListener('DOMContentLoaded', async () => {
    // --- ELEMENTOS DEL DOM ---
    const form = document.getElementById('calculadora-form');
    const resultadosDiv = document.getElementById('resultados');
    const resultadoTableBody = document.querySelector('#resultado-table tbody');
    const produccionContinua45cSpan = document.getElementById('produccion-continua-45c');
    const inputs = form.querySelectorAll('input[type="number"], select');
    const deptoInputs = document.querySelectorAll('#depto-table input[type="number"]');
    const totalUnidadesCell = document.getElementById('total-unidades');
    const totalPersonasGeneralCell = document.getElementById('total-personas-general');
    const acumulacionIngresadaInput = document.getElementById('acumulacion-ingresada');
    const potenciaIngresadaInput = document.getElementById('potencia-ingresada');
    const demandaGuiaSelect = document.getElementById('demanda-guia');
    const viewMode = document.getElementById('param-view-mode');
    const editMode = document.getElementById('param-edit-mode');
    const editBtn = document.getElementById('edit-params-btn');
    const saveBtn = document.getElementById('save-params-btn');

    // Elementos de los gráficos y pestañas
    const tabLine = document.getElementById('tab-line');
    const tabBar = document.getElementById('tab-bar');
    const lineChartContainer = document.getElementById('line-chart-container');
    const barChartContainer = document.getElementById('bar-chart-container');
    const lineChartCanvas = document.getElementById('lineChart').getContext('2d');
    const barChartCanvas = document.getElementById('barChart').getContext('2d');

    // --- VARIABLES GLOBALES ---
    let lineChartInstance = null;
    let barChartInstance = null;
    let monitoringData = [];

    let params = {
        eficiencia: 0.90, usoAcumulador: 0.80, tempFria: 10,
        tempAcumulacion: 60, tempConsumo: 45
    };

    const demandaData = {
        low: { "5min": 1.5, "15min": 3.8, "30min": 6.4, "60min": 10.6, "120min": 17.0, "180min": 23.1, "diarioAvg": 53, "diarioMax": 76 },
        "low-medium": { "5min": 2.1, "15min": 5.1, "30min": 8.7, "60min": 14.4, "120min": 23.7, "180min": 32.4, "diarioAvg": 84, "diarioMax": 131 },
        medium: { "5min": 2.6, "15min": 6.4, "30min": 11.0, "60min": 18.2, "120min": 30.3, "180min": 41.6, "diarioAvg": 114, "diarioMax": 185 },
        high: { "5min": 4.5, "15min": 11.4, "30min": 19.3, "60min": 32.2, "120min": 54.9, "180min": 71.9, "diarioAvg": 204, "diarioMax": 340 },
        monitoreo: { "5min": 1.85, "15min": 4.19, "30min": 5.66, "60min": 9.25, "120min": 14.50, "180min": 20.00, "diarioAvg": "N/A", "diarioMax": 67 }
    };

    // --- CARGA INICIAL DE DATOS ---
    try {
        const response = await fetch('Data/datos_caudal.json');
        if (!response.ok) throw new Error('No se pudieron cargar los datos de monitoreo.');
        monitoringData = await response.json();
    } catch (error) {
        console.error('Error al cargar datos_caudal.json:', error);
        alert('No se pudo cargar el perfil de consumo. Los gráficos no funcionarán.');
    }
    
    // --- FUNCIONES DE GRÁFICOS ---

    /**
     * Procesa los datos de monitoreo para agrupar el consumo total por hora.
     * @returns {number[]} Un array con 24 valores, uno por cada hora.
     */
    const aggregateHourlyData = () => {
        if (!monitoringData.length) return new Array(24).fill(0);
        
        const hourlyConsumption = new Array(24).fill(0);
        monitoringData.forEach(d => {
            const hour = new Date(d.created_at).getHours();
            hourlyConsumption[hour] += d["caudal L/min"];
        });
        return hourlyConsumption;
    };
    
    /**
     * Actualiza ambos gráficos (línea y barras) con los datos escalados.
     * @param {number} totalPersonas - El número total de personas para la simulación.
     */
    const updateCharts = (totalPersonas) => {
        if (!monitoringData.length) return;

        const personasBase = 769.5;
        const factor = totalPersonas > 0 ? totalPersonas / personasBase : 0;

        // --- Gráfico de Líneas (Perfil Diario) ---
        const lineLabels = monitoringData.map(d => new Date(d.created_at).toTimeString().substring(0, 5));
        const lineScaledData = monitoringData.map(d => d["caudal L/min"] * factor);
        
        if (lineChartInstance) lineChartInstance.destroy();
        lineChartInstance = new Chart(lineChartCanvas, {
            type: 'line',
            data: {
                labels: lineLabels,
                datasets: [{
                    label: 'Caudal Simulado (L/min)', data: lineScaledData,
                    borderColor: 'rgba(0, 86, 179, 1)', backgroundColor: 'rgba(0, 86, 179, 0.2)',
                    borderWidth: 1.5, pointRadius: 0, fill: true,
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { maxTicksLimit: 24 } }, y: { beginAtZero: true } } }
        });

        // --- Gráfico de Barras (Consumo por Hora) ---
        const hourlyAggregatedData = aggregateHourlyData();
        const barLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
        const barScaledData = hourlyAggregatedData.map(d => d * factor);
        
        if (barChartInstance) barChartInstance.destroy();
        barChartInstance = new Chart(barChartCanvas, {
            type: 'bar',
            data: {
                labels: barLabels,
                datasets: [{
                    label: 'Consumo Total (Litros)', data: barScaledData,
                    borderColor: 'rgba(220, 53, 69, 1)', backgroundColor: 'rgba(220, 53, 69, 0.5)',
                    borderWidth: 1
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });
    };
    
    // --- LÓGICA PRINCIPAL DE LA APP ---
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
        updateTotals();
        
        const totalPersonas = parseFloat(totalPersonasGeneralCell.textContent) || 0;
        const demandaGuia = demandaGuiaSelect.value;
        const demanda = demandaData[demandaGuia];
        const acumulacionIngresada = parseFloat(acumulacionIngresadaInput.value) || 0;
        const potenciaIngresada = parseFloat(potenciaIngresadaInput.value) || 0;
        const { eficiencia, usoAcumulador, tempFria, tempAcumulacion, tempConsumo } = params;
        const calorEspecificoAgua = 4.186, segundosEnUnDia = 24 * 3600;

        resultadoTableBody.innerHTML = '';

        const createResultRow = (param, requerido, ingresado, boetekValue) => {
            const row = document.createElement('tr');
            let statusText = ingresado >= requerido ? 'OK' : 'Insuficiente';
            let statusClass = ingresado >= requerido ? 'status-ok' : 'status-insuficiente';
            const formattedRequerido = Math.round(requerido).toLocaleString('es-CL');
            const formattedIngresado = Math.round(ingresado).toLocaleString('es-CL');
            let boetekBgClass = (typeof boetekValue === 'number' && ingresado < boetekValue) ? 'monitoreo-insuficiente' : '';
            const formattedBoetek = typeof boetekValue === 'number' ? Math.round(boetekValue).toLocaleString('es-CL') + ' L' : boetekValue;
            let sobredimensionamiento = (typeof boetekValue === 'number' && boetekValue > 0) ? (((ingresado / boetekValue) - 1) * 100).toFixed(0) + '%' : 'N/A';

            row.innerHTML = `<td>${param}</td><td>${formattedRequerido} L</td><td>${formattedIngresado} L</td><td class="${statusClass}">${statusText}</td><td class="boetek-col ${boetekBgClass}">${formattedBoetek}</td><td class="sobre-dimensionamiento-col">${sobredimensionamiento}</td>`;
            resultadoTableBody.appendChild(row);
        };

        const litrosPorMinuto_45c = (potenciaIngresada * eficiencia * 60) / (calorEspecificoAgua * (tempConsumo - tempFria));
        produccionContinua45cSpan.textContent = litrosPorMinuto_45c.toFixed(2);
        
        const peakTimes = { "Peak 5 min": "5min", "Peak 15 min": "15min", "Peak 30 min": "30min", "Peak 60 min": "60min", "Peak 120 min": "120min", "Peak 180 min": "180min", "Diario Promedio": "diarioAvg", "Diario Máximo": "diarioMax" };
        for (const [label, key] of Object.entries(peakTimes)) {
            const volumenRequerido = totalPersonas * demanda[key];
            const boetekValue = demandaData.monitoreo[key];
            const volumenBoetek = typeof boetekValue === 'number' ? totalPersonas * boetekValue : boetekValue;
            let volumenProporcionado = 0;
            if (key.includes('min')) {
                const tiempoSegundos = parseInt(key) * 60;
                const energiaPotencia = potenciaIngresada * eficiencia * tiempoSegundos;
                const energiaAcumulacion = (acumulacionIngresada * usoAcumulador) * calorEspecificoAgua * (tempAcumulacion - tempFria);
                volumenProporcionado = (energiaPotencia + energiaAcumulacion) / (calorEspecificoAgua * (tempConsumo - tempFria));
            } else {
                volumenProporcionado = (potenciaIngresada * eficiencia * segundosEnUnDia) / (calorEspecificoAgua * (tempConsumo - tempFria));
            }
            createResultRow(label, volumenRequerido, volumenProporcionado, volumenBoetek);
        }
        updateCharts(totalPersonas);
        resultadosDiv.style.display = 'flex';
    };

    const toggleEditMode = (isSaving = false) => {
        const isCurrentlyEditing = editMode.style.display !== 'none';
        if (isSaving && isCurrentlyEditing) {
            params = {
                eficiencia: parseFloat(document.getElementById('edit-eficiencia').value),
                usoAcumulador: parseFloat(document.getElementById('edit-uso-acumulador').value),
                tempFria: parseFloat(document.getElementById('edit-temp-fria').value),
                tempAcumulacion: parseFloat(document.getElementById('edit-temp-acumulacion').value),
                tempConsumo: parseFloat(document.getElementById('edit-temp-consumo').value)
            };
            document.getElementById('view-eficiencia').textContent = (params.eficiencia * 100).toFixed(0) + '%';
            document.getElementById('view-uso-acumulador').textContent = (params.usoAcumulador * 100).toFixed(0) + '%';
            document.getElementById('view-temp-fria').textContent = params.tempFria + '°C';
            document.getElementById('view-temp-acumulacion').textContent = params.tempAcumulacion + '°C';
            document.getElementById('view-temp-consumo').textContent = params.tempConsumo + '°C';
            viewMode.style.display = 'block';
            editMode.style.display = 'none';
            updateComparison();
        } else if (!isCurrentlyEditing) {
            document.getElementById('edit-eficiencia').value = params.eficiencia;
            document.getElementById('edit-uso-acumulador').value = params.usoAcumulador;
            document.getElementById('edit-temp-fria').value = params.tempFria;
            document.getElementById('edit-temp-acumulacion').value = params.tempAcumulacion;
            document.getElementById('edit-temp-consumo').value = params.tempConsumo;

            viewMode.style.display = 'none';
            editMode.style.display = 'block';
        }
    };

    // --- EVENT LISTENERS ---
    editBtn.addEventListener('click', () => toggleEditMode(false));
    saveBtn.addEventListener('click', () => toggleEditMode(true));
    inputs.forEach(input => input.addEventListener('input', updateComparison));
    tabLine.addEventListener('click', () => {
        tabLine.classList.add('active');
        tabBar.classList.remove('active');
        lineChartContainer.style.display = 'block';
        barChartContainer.style.display = 'none';
    });
    tabBar.addEventListener('click', () => {
        tabBar.classList.add('active');
        tabLine.classList.remove('active');
        barChartContainer.style.display = 'block';
        lineChartContainer.style.display = 'none';
    });

    // --- INICIALIZACIÓN ---
    const initializeApp = () => {
        document.getElementById('view-eficiencia').textContent = (params.eficiencia * 100).toFixed(0) + '%';
        document.getElementById('view-uso-acumulador').textContent = (params.usoAcumulador * 100).toFixed(0) + '%';
        document.getElementById('view-temp-fria').textContent = params.tempFria + '°C';
        document.getElementById('view-temp-acumulacion').textContent = params.tempAcumulacion + '°C';
        document.getElementById('view-temp-consumo').textContent = params.tempConsumo + '°C';
        updateComparison();
    };

    initializeApp();
});