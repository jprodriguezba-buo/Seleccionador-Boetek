// js/ui.js

import DOM from './dom.js';
import { getComparativeTableData, getSelectionTableData, getPeakHoursTableData, getInstantFlowData, getEquipoSeleccionadoTableData, getResultadoTableData } from './calculations.js';

// --- Funciones auxiliares de UI (no se exportan) ---

const updateStatusCell = (cell, isOk) => {
    if (!cell) return;
    cell.textContent = isOk ? 'OK' : 'Insuficiente';
    cell.className = isOk ? 'status-ok' : 'status-insuficiente';
};


// --- Funciones de actualización de tablas y paneles (no se exportan) ---

const updateEquipoSeleccionadoTable = (inputs, params, config) => {
    if (!DOM.equipoSeleccionadoTableBody) return;
    DOM.equipoSeleccionadoTableBody.innerHTML = '';
    const tableData = getEquipoSeleccionadoTableData(inputs, params, config);
    tableData.forEach(rowData => {
        const row = DOM.equipoSeleccionadoTableBody.insertRow();
        row.innerHTML = `<td>${rowData[0]}</td><td>${rowData[1]}</td>`;
    });
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

const updateResultsTable = (inputs, results, params, config) => {
    DOM.resultadoTableBody.innerHTML = '';
    const tableData = getResultadoTableData(inputs, results, params, config);
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

const updateOperationPanels = (inputs, results, params) => {
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

    const flowData = getInstantFlowData(results, params);
    DOM.produccionContinua50cSpan.textContent = flowData['50c'].replace(' L/min','');
    DOM.produccionContinua60cSpan.textContent = flowData['60c'].replace(' L/min','');
    DOM.produccionContinuaTempSpan.textContent = params.tempConsumo;
    DOM.produccionContinuaValorSpan.textContent = flowData['consumo'].replace(' L/min','');
    
    if(inputs.tipoSistema === 'apoyo_re' || inputs.tipoSistema === 'falla_re') {
        DOM.potenciaTotalDisplaySpan.textContent = (inputs.pBC + inputs.pRE).toString();
    }
};

const updateDisclaimerText = (params) => {
    DOM.disclaimerTempAcumulacion.textContent = params.tempAcumulacion;
    DOM.disclaimerTempFria.textContent = params.tempFria;
};


// --- Funciones Exportadas ---

export const updateUITables = (inputs, results, params, config) => {
    updateEquipoSeleccionadoTable(inputs, params, config);
    updateCostTables(inputs, results);
    updateResultsTable(inputs, results, params, config);
    updateOperationPanels(inputs, results, params);
    updateDisclaimerText(params);
};

export const updateTotals = () => {
    let totalUnidades = 0, totalPersonas = 0;
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

export const updateSystemView = () => {
    const tipoSistema = DOM.tipoSistemaSelect.value;
    const esBombaDeCalor = tipoSistema !== 'sala_calderas';

    DOM.potenciaSalaCalderasRow.style.display = esBombaDeCalor ? 'none' : 'table-row';
    DOM.potenciaBcRow.style.display = esBombaDeCalor ? 'table-row' : 'none';
    DOM.potenciaReRow.style.display = esBombaDeCalor ? 'table-row' : 'none';
    DOM.potenciaTotalDisplayRow.style.display = esBombaDeCalor ? 'table-row' : 'none';
    DOM.tabPeakHours.style.display = esBombaDeCalor ? 'inline-block' : 'none';
    DOM.filasHoraPunta.forEach(fila => { fila.style.display = esBombaDeCalor ? 'table-row' : 'none'; });
    
    if (!esBombaDeCalor && DOM.tabPeakHours.classList.contains('active')) {
        const analysisTabs = [DOM.tabEquipoSeleccionado, DOM.tabSelection, DOM.tabPeakHours];
        const analysisContainers = [DOM.equipoSeleccionadoContainer, DOM.selectionTableContainer, DOM.peakHoursContainer];
        switchTab(DOM.tabEquipoSeleccionado, analysisTabs, analysisContainers);
    }
    DOM.resultadoTable.classList.toggle('falla-re-active', tipoSistema === 'falla_re');
};

export const updateViewModeDisplay = (params) => {
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

export const toggleEditMode = (isSaving, currentParams) => {
    const isCurrentlyEditing = DOM.editMode.style.display !== 'none';

    if (isSaving && isCurrentlyEditing) {
        const newParams = {
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
        DOM.viewMode.style.display = 'block';
        DOM.editMode.style.display = 'none';
        return newParams; // Devuelve los nuevos parámetros para que app.js actualice su estado
    } else if (!isCurrentlyEditing) {
        document.getElementById('demanda-guia').value = currentParams.demandaGuia;
        document.getElementById('edit-litros-persona-dia').value = currentParams.litrosPersonaDia;
        document.getElementById('edit-eficiencia').value = currentParams.eficiencia;
        document.getElementById('edit-uso-acumulador').value = currentParams.usoAcumulador;
        document.getElementById('edit-temp-fria').value = currentParams.tempFria;
        document.getElementById('edit-temp-acumulacion').value = currentParams.tempAcumulacion;
        document.getElementById('edit-temp-consumo').value = currentParams.tempConsumo;
        document.getElementById('edit-hora-punta-inicio').value = currentParams.horaPuntaInicio;
        document.getElementById('edit-hora-punta-fin').value = currentParams.horaPuntaFin;
        document.getElementById('edit-valor-gas').value = currentParams.valorGas;
        document.getElementById('edit-valor-kwh').value = currentParams.valorKwh;
        DOM.viewMode.style.display = 'none';
        DOM.editMode.style.display = 'block';
    }
    return null; // No hay cambios en los parámetros
};

export const switchTab = (clickedTab, allTabs, allContainers) => {
    allTabs.forEach(t => t.classList.remove('active'));
    clickedTab.classList.add('active');
    const index = allTabs.findIndex(t => t === clickedTab);
    allContainers.forEach(c => c.style.display = 'none');
    if (index !== -1) allContainers[index].style.display = 'block';
};