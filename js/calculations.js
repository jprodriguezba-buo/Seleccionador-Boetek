// js/calculations.js

/**
 * Realiza una interpolación lineal simple.
 * @param {number} x - El punto en el que se desea interpolar.
 * @param {Array<Object>} dataPoints - Un array de puntos de la forma {x, y}.
 * @returns {number} El valor 'y' interpolado.
 */
export const interpolate = (x, dataPoints) => {
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

/**
 * Agrega el consumo de monitoreo por hora.
 * @param {Array<Object>} monitoringData - Los datos de monitoreo.
 * @returns {Array<number>} Un array con el consumo total para cada una de las 24 horas.
 */
export const aggregateHourlyData = (monitoringData) => {
    if (!monitoringData.length) return new Array(24).fill(0);
    const hourlyConsumption = new Array(24).fill(0);
    monitoringData.forEach(d => {
        const hour = new Date(d.created_at).getHours();
        hourlyConsumption[hour] += d["caudal L/min"];
    });
    return hourlyConsumption;
};

/**
 * Calcula los resultados principales basados en las entradas del usuario y los parámetros.
 */
export const calculateResults = (inputs, params, config, monitoringData) => {
    const { eficiencia, usoAcumulador, tempFria, tempAcumulacion, tempConsumo } = params;
    const results = {};
    results.potenciaParaCalculo = inputs.potenciaParaCalculo;

    const consumoDiarioBaseLitros = inputs.totalPersonas * params.litrosPersonaDia;
    const consumoMensualJulioLitros = consumoDiarioBaseLitros * 31;
    results.consumoAnualTotalLitros = (config.consumoMensualDistribucion.julio > 0) ? (consumoMensualJulioLitros / config.consumoMensualDistribucion.julio) : 0;
    results.consumoAnualTotalM3 = results.consumoAnualTotalLitros / 1000;
    results.dailyM3 = results.consumoAnualTotalM3 / 365;

    results.scmRatio = interpolate(results.dailyM3, config.efficiencyData.scm);
    results.scmCostoM3 = results.scmRatio * params.valorGas;
    results.scmCostoAnual = results.scmCostoM3 * results.consumoAnualTotalM3;

    results.bcRatio = interpolate(results.dailyM3, config.efficiencyData.bc);
    results.bcCostoM3 = results.bcRatio * params.valorKwh;
    results.bcCostoAnual = results.bcCostoM3 * results.consumoAnualTotalM3;

    results.traditionalRatio = interpolate(results.dailyM3, config.efficiencyData.traditional);
    results.traditionalCostoM3 = results.traditionalRatio * params.valorGas;
    results.traditionalCostoAnual = results.traditionalCostoM3 * results.consumoAnualTotalM3;

    results.consumoPuntaLts = 0;
    if (monitoringData.length > 0 && inputs.tipoSistema !== 'sala_calderas') {
        const factor = inputs.totalPersonas > 0 ? inputs.totalPersonas / config.constants.PERSONAS_BASE_MONITOREO : 0;
        const hourlyAggregatedData = aggregateHourlyData(monitoringData);
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
        const energiaAcumulacion = (inputs.acumulacionIngresada * usoAcumulador) * config.constants.CALOR_ESPECIFICO_AGUA * (tempAcumulacion - tempFria);
        const calculatePeakGeneration = (power) => (power * eficiencia * duracionPuntaSegundos + energiaAcumulacion) / (config.constants.CALOR_ESPECIFICO_AGUA * (tempConsumo - tempFria));
        results.generacionPunta['100'] = calculatePeakGeneration(inputs.pBC * 1.0);
        results.generacionPunta['75'] = calculatePeakGeneration(inputs.pBC * 0.75);
        results.generacionPunta['50'] = calculatePeakGeneration(inputs.pBC * 0.50);
        results.generacionPunta['25'] = calculatePeakGeneration(inputs.pBC * 0.25);
        results.generacionPunta['0'] = calculatePeakGeneration(0);
    }

    results.caudal50c = (results.potenciaParaCalculo * eficiencia * 60) / (config.constants.CALOR_ESPECIFICO_AGUA * (50 - tempFria));
    results.caudal60c = (results.potenciaParaCalculo * eficiencia * 60) / (config.constants.CALOR_ESPECIFICO_AGUA * (60 - tempFria));
    results.caudalSeleccionado = (results.potenciaParaCalculo * eficiencia * 60) / (config.constants.CALOR_ESPECIFICO_AGUA * (tempConsumo - tempFria));

    return results;
};


// --- FUNCIONES PARA OBTENER DATOS DE TABLAS ---

export const getResultadoTableData = (inputs, results, params, config) => {
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

export const getEquipoSeleccionadoTableData = (inputs, params, config) => {
    const { eficiencia, usoAcumulador, tempFria, tempAcumulacion, tempConsumo } = params;
    const data = [];
    const peakTimes = {
        "5 min": 5 * 60, "15 min": 15 * 60, "30 min": 30 * 60, "60 min": 60 * 60,
        "120 min": 120 * 60, "180 min": 180 * 60, "Día Completo": 24 * 3600
    };

    for (const [label, tiempoSegundos] of Object.entries(peakTimes)) {
        const energiaPotencia = inputs.potenciaParaCalculo * eficiencia * tiempoSegundos;
        const energiaAcumulacion = (inputs.acumulacionIngresada * usoAcumulador) * config.constants.CALOR_ESPECIFICO_AGUA * (tempAcumulacion - tempFria);
        const volumenProporcionado = (energiaPotencia + energiaAcumulacion) / (config.constants.CALOR_ESPECIFICO_AGUA * (tempConsumo - tempFria));
        
        data.push([label, `${Math.round(volumenProporcionado).toLocaleString('es-CL')} L`]);
    }
    return data;
};

export const getComparativeTableData = (results) => {
    const formatCurrency = (value) => `$${Math.round(value).toLocaleString('es-CL')}`;
    return [
        ['M3 ACS anual', `${Math.round(results.consumoAnualTotalM3).toLocaleString('es-CL')} m³`, `${Math.round(results.consumoAnualTotalM3).toLocaleString('es-CL')} m³`, `${Math.round(results.consumoAnualTotalM3).toLocaleString('es-CL')} m³`],
        ['Prom M3 Dia', `${results.dailyM3.toFixed(2)} m³`, `${results.dailyM3.toFixed(2)} m³`, `${results.dailyM3.toFixed(2)} m³`],
        ['Ratio de generación', `${results.scmRatio.toFixed(2)} m³ gas/m³`, `${results.bcRatio.toFixed(2)} kWh/m³`, `${results.traditionalRatio.toFixed(2)} m³ gas/m³`],
        ['Valor m³ ACS', formatCurrency(results.scmCostoM3), formatCurrency(results.bcCostoM3), formatCurrency(results.traditionalCostoM3)],
        ['Costo Anual ACS', formatCurrency(results.scmCostoAnual), formatCurrency(results.bcCostoAnual), formatCurrency(results.traditionalCostoAnual)]
    ];
};

export const getSelectionTableData = (inputs, results) => {
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

export const getPeakHoursTableData = (results) => {
    const consumoPunta = `${Math.round(results.consumoPuntaLts).toLocaleString('es-CL')} L`;
    const scenarios = [
        { label: 'Suministro con BC al 100%', key: '100' }, { label: 'Suministro con BC al 75%', key: '75' },
        { label: 'Suministro con BC al 50%', key: '50' }, { label: 'Suministro con BC al 25%', key: '25' },
        { label: 'Suministro sin BC (solo acumulación)', key: '0' }
    ];
    return scenarios.map(s => {
        const generacion = results.generacionPunta[s.key] !== undefined ? Math.round(results.generacionPunta[s.key]) : 0;
        const cumple = generacion >= results.consumoPuntaLts ? 'OK' : 'Insuficiente';
        return [s.label, consumoPunta, cumple, `${generacion.toLocaleString('es-CL')} L`];
    });
};

export const getInstantFlowData = (results, params) => {
    return {
        '50c': `${results.caudal50c.toFixed(2)} L/min`,
        '60c': `${results.caudal60c.toFixed(2)} L/min`,
        'consumo': `${results.caudalSeleccionado.toFixed(2)} L/min`,
        'tempConsumo': `${params.tempConsumo}°C`
    };
};