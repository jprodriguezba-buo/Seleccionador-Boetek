document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('calculadora-form');
    const resultadosDiv = document.getElementById('resultados');
    const resultadoTableBody = document.querySelector('#resultado-table tbody');
    const produccionContinua50cSpan = document.getElementById('produccion-continua-50c');
    const produccionContinua45cSpan = document.getElementById('produccion-continua-45c');

    const inputs = form.querySelectorAll('input[type="number"], select');
    const deptoInputs = document.querySelectorAll('#depto-table input[type="number"]');
    const totalUnidadesCell = document.getElementById('total-unidades');
    const totalPersonasGeneralCell = document.getElementById('total-personas-general');

    const acumulacionIngresadaInput = document.getElementById('acumulacion-ingresada');
    const potenciaIngresadaInput = document.getElementById('potencia-ingresada');
    const demandaGuiaSelect = document.getElementById('demanda-guia');

    // ASHRAE-based data for hot water demand (Liters per Person)
    const demandaData = {
        low: {
            "5min": 1.5, "15min": 3.8, "30min": 6.4, "60min": 10.6,
            "120min": 17.0, "180min": 23.1, "diarioAvg": 53, "diarioMax": 76
        },
        "low-medium": {
            "5min": 2.1, "15min": 5.1, "30min": 8.7, "60min": 14.4,
            "120min": 23.7, "180min": 32.4, "diarioAvg": 84, "diarioMax": 131
        },
        medium: {
            "5min": 2.6, "15min": 6.4, "30min": 11.0, "60min": 18.2,
            "120min": 30.3, "180min": 41.6, "diarioAvg": 114, "diarioMax": 185
        },
        high: {
            "5min": 4.5, "15min": 11.4, "30min": 19.3, "60min": 32.2,
            "120min": 54.9, "180min": 71.9, "diarioAvg": 204, "diarioMax": 340
        },
        monitoreo:{
            "5min": 1.85, "15min": 4.19, "30min": 5.66, "60min": 9.25,
            "120min": 14.50, "180min": 20.00, "diarioAvg": "N/A", // Not provided 
            "diarioMax": 67
        }
    };
    
    // Boetek simulated data for hot water demand (Liters per Person)
    const demandaBoetek = {
        "5min": 1.85,
        "15min": 4.19,
        "30min": 5.66,
        "60min": 9.25,
        "120min": 14.50,
        "180min": 20.00,
        "diarioAvg": "N/A", // Not provided
        "diarioMax": 67
    };

    const updateTotals = () => {
        let totalUnidades = 0;
        let totalPersonas = 0;

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

        // System parameters (constants)
        const eficiencia = 0.90;
        const usoAcumulador = 0.80;
        const tempFria = 10; // °C
        const tempAcumulacion = 45; // °C
        const tempConsumo = 45; // °C
        const deltaT_acumulacion = tempAcumulacion - tempFria;
        const deltaT_potencia_total_50c = 50 - tempFria;
        const deltaT_potencia_total_45c = tempConsumo - tempFria;
        const calorEspecificoAgua = 4.186; // kJ/(kg·°C)
        const segundosEnUnDia = 24 * 3600;

        // Clear previous results
        resultadoTableBody.innerHTML = '';

        // Function to create a new row in the results table
        const createResultRow = (param, requerido, ingresado, boetekValue) => {
            const row = document.createElement('tr');
            let statusText;
            let statusClass;
            
            if (ingresado >= requerido) {
                statusText = 'OK';
                statusClass = 'status-ok';
            } else {
                statusText = 'Insuficiente';
                statusClass = 'status-insuficiente';
            }

            // Format numbers with a thousands separator
            const formattedRequerido = Math.round(requerido).toLocaleString('es-CL');
            const formattedIngresado = Math.round(ingresado).toLocaleString('es-CL');
            const formattedBoetek = typeof boetekValue === 'number' ? Math.round(boetekValue).toLocaleString('es-CL') + ' L' : boetekValue;

            row.innerHTML = `
                <td>${param}</td>
                <td>${formattedRequerido} L</td>
                <td>${formattedIngresado} L</td>
                <td class="${statusClass}">${statusText}</td>
                <td class="boetek-col">${formattedBoetek}</td>
            `;
            resultadoTableBody.appendChild(row);
        };

        // Calculation for Continuous ACS Production (L/min)
        const litrosPorMinuto_50c = (potenciaIngresada * eficiencia * 60) / (calorEspecificoAgua * deltaT_potencia_total_50c);
        produccionContinua50cSpan.textContent = litrosPorMinuto_50c.toFixed(2);

        const litrosPorMinuto_45c = (potenciaIngresada * eficiencia * 60) / (calorEspecificoAgua * deltaT_potencia_total_45c);
        produccionContinua45cSpan.textContent = litrosPorMinuto_45c.toFixed(2);


        // Comparison for Accumulation & Power combined
        const peakTimes = {
            "Peak 5 min": { key: "5min", boetekKey: "5min"},
            "Peak 15 min": { key: "15min", boetekKey: "15min"},
            "Peak 30 min": { key: "30min", boetekKey: "30min"},
            "Peak 60 min": { key: "60min", boetekKey: "60min"},
            "Peak 120 min": { key: "120min", boetekKey: "120min"},
            "Peak 180 min": { key: "180min", boetekKey: "180min"},
            "Diario Promedio": { key: "diarioAvg", boetekKey: "diarioAvg"},
            "Diario Máximo": { key: "diarioMax", boetekKey: "diarioMax"}
        };

        for (const [label, keys] of Object.entries(peakTimes)) {
            // Calculate the required volume (ASHRAE)
            const volumenRequerido = totalPersonas * demanda[keys.key];
            
            // Calculate Boetek simulated volume
            const boetekValue = demandaBoetek[keys.boetekKey];
            const volumenBoetek = typeof boetekValue === 'number' ? totalPersonas * boetekValue : boetekValue;

            // Calculate the total provided volume from accumulation and power
            let volumenProporcionado = 0;
            if (typeof keys.key === 'string' && keys.key.includes('min')) { // Peak periods (5-180 min)
                const tiempoSegundos = parseInt(keys.key) * 60;
                
                // Energy from power in kJ
                const energiaPotencia = potenciaIngresada * eficiencia * tiempoSegundos;
                
                // Energy from accumulator in kJ
                const energiaAcumulacion = (acumulacionIngresada * usoAcumulador) * calorEspecificoAgua * deltaT_acumulacion;
                
                // Total energy provided to heat water from 10C to 50C
                const energiaTotal = energiaPotencia + energiaAcumulacion;
                
                // Provided volume in Liters at consumption temperature (50C)
                volumenProporcionado = energiaTotal / (calorEspecificoAgua * deltaT_potencia_total_50c);

            } else { // Daily periods (Promedio and Máximo)
                const energiaKJ = potenciaIngresada * eficiencia * segundosEnUnDia;
                volumenProporcionado = energiaKJ / (calorEspecificoAgua * deltaT_potencia_total_50c);
            }
            
            createResultRow(label, volumenRequerido, volumenProporcionado, volumenBoetek);
        }

        // Display results section always
        resultadosDiv.style.display = 'flex';
    };

    // Add event listeners to all relevant inputs
    inputs.forEach(input => {
        input.addEventListener('input', updateComparison);
    });
    
    // Initial call to update the results on page load
    updateComparison();
});