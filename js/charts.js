// js/charts.js

import DOM from './dom.js';
import { aggregateHourlyData } from './calculations.js';

let lineChartInstance, barChartInstance, monthlyChartInstance, efficiencyChartInstance;
let chartConfigs = {};

// LA LÍNEA DE ABAJO ES LA ÚNICA QUE CAMBIA
export const updateCharts = (inputs, results, params, config, monitoringData) => {
    // Gráfico de Líneas (Perfil Diario)
    if (config.constants && monitoringData.length > 0) {
        const factor = inputs.totalPersonas > 0 ? inputs.totalPersonas / config.constants.PERSONAS_BASE_MONITOREO : 0;
        const lineLabels = monitoringData.map(d => new Date(d.created_at).toTimeString().substring(0, 5));
        const lineScaledData = monitoringData.map(d => d["caudal L/min"] * factor);
        chartConfigs.line = { type: 'line', data: { labels: lineLabels, datasets: [{ label: 'Caudal Simulado (L/min)', data: lineScaledData, borderColor: 'rgba(0, 86, 179, 1)', backgroundColor: 'rgba(0, 86, 179, 0.2)', borderWidth: 1.5, pointRadius: 0, fill: true }] }, options: { responsive: true, maintainAspectRatio: true, scales: { x: { ticks: { maxTicksLimit: 24 } }, y: { beginAtZero: true, title: { display: true, text: 'Litros por minuto (L/min)' } } }, plugins: { legend: { display: false }} } };
        if (lineChartInstance) lineChartInstance.destroy();
        lineChartInstance = new Chart(DOM.lineChartCanvas, chartConfigs.line);
    }

    // Gráfico de Barras (Consumo por Hora)
    if (config.constants && monitoringData.length > 0) {
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

    // Gráfico Mensual
    if (config.consumoMensualDistribucion) {
        const monthlyLabels = Object.keys(config.consumoMensualDistribucion).map(m => m.charAt(0).toUpperCase() + m.slice(1));
        const monthlyDataM3 = Object.values(config.consumoMensualDistribucion).map(dist => results.consumoAnualTotalM3 * dist);
        chartConfigs.monthly = { type: 'bar', data: { labels: monthlyLabels, datasets: [{ label: 'Consumo Mensual (m³)', data: monthlyDataM3, backgroundColor: 'rgba(0, 86, 179, 0.5)', borderColor: 'rgba(0, 86, 179, 1)', borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true, title: { display: true, text: 'Metros Cúbicos (m³)' } } }, plugins: { legend: { display: false }, datalabels: { display: true, anchor: 'end', align: 'top', color: '#333', font: { weight: 'bold' }, formatter: (v) => v > 0 ? Math.round(v).toLocaleString('es-CL') : '' } } } };
        if (monthlyChartInstance) monthlyChartInstance.destroy();
        monthlyChartInstance = new Chart(DOM.monthlyChartCanvas, chartConfigs.monthly);
    }
    
    // Gráfico de Eficiencia
    if (config.efficiencyData) {
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
    }
};

export const getChartConfig = (chartName) => {
    return chartConfigs[chartName];
};