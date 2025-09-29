document.addEventListener('DOMContentLoaded', async () => {
    // --- ELEMENTOS DEL DOM ---
    const form = document.getElementById('calculadora-form');
    const produccionContinua50cSpan = document.getElementById('produccion-continua-50c');
    const produccionContinuaTempSpan = document.getElementById('prod-continua-temp');
    const produccionContinuaValorSpan = document.getElementById('produccion-continua-valor');
    const deptoInputs = document.querySelectorAll('#depto-table input[type="number"]');
    const totalUnidadesCell = document.getElementById('total-unidades');
    const totalPersonasGeneralCell = document.getElementById('total-personas-general');
    const demandaGuiaSelect = document.getElementById('demanda-guia');
    const viewMode = document.getElementById('param-view-mode');
    const editMode = document.getElementById('param-edit-mode');
    const editBtn = document.getElementById('edit-params-btn');
    const saveBtn = document.getElementById('save-params-btn');
    const filasHoraPunta = document.querySelectorAll('.fila-hora-punta');

    // Nuevos elementos del sistema
    const tipoSistemaSelect = document.getElementById('tipo-sistema');
    const acumulacionIngresadaInput = document.getElementById('acumulacion-ingresada');
    const potenciaSalaCalderasGroup = document.getElementById('potencia-sala-calderas-group');
    const potenciaIngresadaInput = document.getElementById('potencia-ingresada');
    const potenciaBombaCalorGroup = document.getElementById('potencia-bomba-calor-group');
    const potenciaBcInput = document.getElementById('potencia-bc');
    const potenciaReInput = document.getElementById('potencia-re');
    const potenciaTotalDisplaySpan = document.getElementById('potencia-total-display');

    // Elementos de resultados
    const resultadoTable = document.getElementById('resultado-table');
    const resultadoTableBody = document.querySelector('#resultado-table tbody');
    const consumoPuntaBox = document.getElementById('consumo-punta-box');
    const consumoPuntaValorSpan = document.getElementById('consumo-punta-valor');
    const generacionPuntaValorSpan = document.getElementById('generacion-punta-valor');
    
    // Elementos de los gráficos
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
        demandaGuia: 'low-medium',
        eficiencia: 0.90, 
        usoAcumulador: 0.80, 
        tempFria: 10,
        tempAcumulacion: 45, 
        tempConsumo: 45,
        horaPuntaInicio: 18,
        horaPuntaFin: 22
    };
    const demandaGuiaMap = {
        'low': 'Baja',
        'low-medium': 'Baja-Media',
        'medium': 'Media',
        'high': 'Alta'
    };
    const demandaData = {
        low: { "5min": 1.5, "15min": 3.8, "30min": 6.4, "60min": 10.6, "120min": 17.0, "180min": 23.1, "diarioAvg": 53, "diarioMax": 76 },
        "low-medium": { "5min": 2.1, "15min": 5.1, "30min": 8.7, "60min": 14.4, "120min": 23.7, "180min": 32.4, "diarioAvg": 84, "diarioMax": 131 },
        medium: { "5min": 2.6, "15min": 6.4, "30min": 11.0, "60min": 18.2, "120min": 30.3, "180min": 41.6, "diarioAvg": 114, "diarioMax": 185 },
        high: { "5min": 4.5, "15min": 11.4, "30min": 19.3, "60min": 32.2, "120min": 54.9, "180min": 71.9, "diarioAvg": 204, "diarioMax": 340 },
        monitoreo: { "5min": 1.85, "15min": 4.19, "30min": 5.66, "60min": 9.25, "120min": 14.50, "180min": 20.00, "diarioAvg": "N/A", "diarioMax": 67 }
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

        updateCharts(totalPersonas);
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

        potenciaSalaCalderasGroup.style.display = esBombaDeCalor ? 'none' : 'block';
        potenciaBombaCalorGroup.style.display = esBombaDeCalor ? 'block' : 'none';
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
                eficiencia: parseFloat(document.getElementById('edit-eficiencia').value),
                usoAcumulador: parseFloat(document.getElementById('edit-uso-acumulador').value),
                tempFria: parseFloat(document.getElementById('edit-temp-fria').value),
                tempAcumulacion: parseFloat(document.getElementById('edit-temp-acumulacion').value),
                tempConsumo: parseFloat(document.getElementById('edit-temp-consumo').value),
                horaPuntaInicio: parseInt(document.getElementById('edit-hora-punta-inicio').value, 10),
                horaPuntaFin: parseInt(document.getElementById('edit-hora-punta-fin').value, 10)
            };
            
            document.getElementById('view-demanda-guia').textContent = demandaGuiaMap[params.demandaGuia];
            document.getElementById('view-eficiencia').textContent = `${(params.eficiencia * 100).toFixed(0)}%`;
            document.getElementById('view-uso-acumulador').textContent = `${(params.usoAcumulador * 100).toFixed(0)}%`;
            document.getElementById('view-temp-fria').textContent = `${params.tempFria}°C`;
            document.getElementById('view-temp-acumulacion').textContent = `${params.tempAcumulacion}°C`;
            document.getElementById('view-temp-consumo').textContent = `${params.tempConsumo}°C`;
            document.getElementById('view-hora-punta-inicio').textContent = formatHour(params.horaPuntaInicio);
            document.getElementById('view-hora-punta-fin').textContent = formatHour(params.horaPuntaFin);

            viewMode.style.display = 'block';
            editMode.style.display = 'none';
            updateComparison();
        } else if (!isCurrentlyEditing) {
            document.getElementById('demanda-guia').value = params.demandaGuia;
            document.getElementById('edit-eficiencia').value = params.eficiencia;
            document.getElementById('edit-uso-acumulador').value = params.usoAcumulador;
            document.getElementById('edit-temp-fria').value = params.tempFria;
            document.getElementById('edit-temp-acumulacion').value = params.tempAcumulacion;
            document.getElementById('edit-temp-consumo').value = params.tempConsumo;
            document.getElementById('edit-hora-punta-inicio').value = params.horaPuntaInicio;
            document.getElementById('edit-hora-punta-fin').value = params.horaPuntaFin;

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
    
    const updateCharts = (totalPersonas) => {
        if (!monitoringData.length) return;

        const tipoSistema = tipoSistemaSelect.value;
        const esBombaDeCalor = tipoSistema !== 'sala_calderas';
        const personasBase = 769.5;
        const factor = totalPersonas > 0 ? totalPersonas / personasBase : 0;
        
        const lineLabels = monitoringData.map(d => new Date(d.created_at).toTimeString().substring(0, 5));
        const lineScaledData = monitoringData.map(d => d["caudal L/min"] * factor);
        if (lineChartInstance) lineChartInstance.destroy();
        lineChartInstance = new Chart(lineChartCanvas, {
            type: 'line', data: { labels: lineLabels, datasets: [{ label: 'Caudal Simulado (L/min)', data: lineScaledData, borderColor: 'rgba(0, 86, 179, 1)', backgroundColor: 'rgba(0, 86, 179, 0.2)', borderWidth: 1.5, pointRadius: 0, fill: true }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { maxTicksLimit: 24 } }, y: { beginAtZero: true } } }
        });

        const hourlyAggregatedData = aggregateHourlyData();
        const barScaledData = hourlyAggregatedData.map(d => d * factor);
        
        let consumoTotalPunta = 0;
        const barColors = [];
        const borderColors = [];
        const peakColor = 'rgba(255, 99, 132, 0.5)';
        const defaultColor = 'rgba(0, 86, 179, 0.5)';
        const peakBorderColor = 'rgba(255, 99, 132, 1)';
        const defaultBorderColor = 'rgba(0, 86, 179, 1)';

        for (let hour = 0; hour < 24; hour++) {
            if (esBombaDeCalor && hour >= params.horaPuntaInicio && hour < params.horaPuntaFin) {
                consumoTotalPunta += barScaledData[hour];
                barColors.push(peakColor);
                borderColors.push(peakBorderColor);
            } else {
                barColors.push(defaultColor);
                borderColors.push(defaultBorderColor);
            }
        }
        consumoPuntaValorSpan.textContent = esBombaDeCalor ? Math.round(consumoTotalPunta).toLocaleString('es-CL') : '0';

        const barLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
        if (barChartInstance) barChartInstance.destroy();
        barChartInstance = new Chart(barChartCanvas, {
            type: 'bar', data: { labels: barLabels, datasets: [{ label: 'Consumo Total (Litros)', data: barScaledData, backgroundColor: barColors, borderColor: borderColors, borderWidth: 1 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });
    };
    
    try {
        const response = await fetch('Data/datos_caudal.json');
        if (!response.ok) throw new Error('No se pudieron cargar los datos de monitoreo.');
        monitoringData = await response.json();
        
        const allInputs = document.querySelectorAll('#calculadora-form input, #calculadora-form select');
        allInputs.forEach(input => input.addEventListener('input', updateComparison));
        editBtn.addEventListener('click', () => toggleEditMode(false));
        saveBtn.addEventListener('click', () => toggleEditMode(true));
        tipoSistemaSelect.addEventListener('change', handleSistemaChange);
        
        tabLine.addEventListener('click', () => {
            tabLine.classList.add('active'); tabBar.classList.remove('active');
            lineChartContainer.style.display = 'block'; barChartContainer.style.display = 'none';
        });
        tabBar.addEventListener('click', () => {
            tabBar.classList.add('active'); tabLine.classList.remove('active');
            barChartContainer.style.display = 'block'; lineChartContainer.style.display = 'none';
        });
        
        const initializeApp = () => {
            const formatHour = (hour) => `${String(hour).padStart(2, '0')}:00`;
            document.getElementById('view-demanda-guia').textContent = demandaGuiaMap[params.demandaGuia];
            document.getElementById('view-eficiencia').textContent = `${(params.eficiencia * 100).toFixed(0)}%`;
            document.getElementById('view-uso-acumulador').textContent = `${(params.usoAcumulador * 100).toFixed(0)}%`;
            document.getElementById('view-temp-fria').textContent = `${params.tempFria}°C`;
            document.getElementById('view-temp-acumulacion').textContent = `${params.tempAcumulacion}°C`;
            document.getElementById('view-temp-consumo').textContent = `${params.tempConsumo}°C`;
            document.getElementById('view-hora-punta-inicio').textContent = formatHour(params.horaPuntaInicio);
            document.getElementById('view-hora-punta-fin').textContent = formatHour(params.horaPuntaFin);
            handleSistemaChange();
            updateComparison(); 
        };

        initializeApp();
        
    } catch (error) {
        console.error('Error al cargar datos_caudal.json:', error);
        alert('No se pudo cargar el perfil de consumo. Los gráficos no funcionarán.');
    }
});