// Export to CSV
function exportToCSV() {
    let csv = 'Global Cholera Cost Calculator Results\n';
    csv += 'Generated: ' + new Date().toLocaleString() + '\n\n';

    // include input parameters at top
    const inputs = getInputValues();
    csv += 'Parameters\n';
    csv += 'Parameter,Value,Description\n';
    csv += `Population (thousands),${inputs.population},"Hotspot population at risk (default from API)"\n`;
    csv += `Growth rate (%),${(inputs.growthRate * 100).toFixed(2)},"Annual population growth"\n`;
    csv += `Base year,${inputs.baseYear},"Start year for projections"\n`;
    csv += `Duration (years),${inputs.duration},"Analysis period"\n`;
    csv += `Water target (%),${(inputs.waterTarget * 100).toFixed(1)},"Coverage goal for improved water"\n`;
    csv += `Sanitation target (%),${(inputs.sanitationTarget * 100).toFixed(1)},"Coverage goal for sanitation"\n`;
    csv += `Hygiene target (%),${(inputs.hygieneTarget * 100).toFixed(1)},"Coverage goal for hygiene promotion"\n`;
    csv += `OCV target (%),${(inputs.ocvTarget * 100).toFixed(1)},"Vaccination coverage goal"\n`;
    csv += `Unit cost water,${inputs.waterCost},"USD per capita"\n`;
    csv += `Unit cost sanitation,${inputs.sanitationCost},"USD per capita"\n`;
    csv += `Unit cost hygiene,${inputs.hygieneCost},"USD per capita"\n`;
    csv += `OCV cost per person,${inputs.ocvCost},"USD"\n`;
    csv += `Case management cost,${inputs.caseCost},"USD per case"\n`;
    csv += `Other program cost,${inputs.otherCostPerCapita},"USD per capita"\n`;
    csv += `Emergency WASH cost,${inputs.emergencyWashCost},"USD per case averted"\n`;
    csv += `Emergency OCV cost,${inputs.emergencyOCVCost},"USD per case averted"\n`;
    csv += `Emergency CM cost,${inputs.emergencyCMCost},"USD per case averted"\n`;
    csv += `Diarrhea treatment saved,${inputs.diarrheaTreatmentCost},"USD per case"\n`;
    csv += `Funeral cost saved,${inputs.funeralCost},"USD per death"\n`;
    csv += `Tourism benefit,${inputs.tourismBenefit},"USD per case averted"\n`;
    csv += `Base case rate (per 1k),${(inputs.baseCaseRate * 1000).toFixed(2)},"Annual baseline cases"\n`;
    csv += `Case fatality rate (%),${(inputs.cfRate * 100).toFixed(2)},"% of cases resulting in death"\n`;
    csv += `VSL,${inputs.vsl},"Value of statistical life"\n`;
    csv += `Wage loss per case,${inputs.wageLoss},"USD per day"\n`;
    csv += `Country code,${inputs.countryCode},"ISO3 for WB API"\n`;
    csv += `WB year,${inputs.wbYear},"Data year for WB API"\n\n`;

    csv += 'Scenario Summary\n';
    csv += 'Scenario,Total Costs,Total Benefits,Net Benefit,B/C Ratio,Baseline Cases,Baseline Deaths,Cases Averted,Deaths Averted,Cost per DALY\n';

    for (const key in allScenarios) {
        const scenario = allScenarios[key];
        // compute baseline metrics
        const totalProjCases = scenario.yearlyData.outcomes.cases.reduce((a, b) => a + b, 0);
        const totalProjDeaths = scenario.yearlyData.outcomes.deaths.reduce((a, b) => a + b, 0);
        const baselineCases = totalProjCases + scenario.casesAverted;
        const baselineDeaths = totalProjDeaths + scenario.deathsAverted;
        csv += '"' + scenario.name + '",' + scenario.totalCosts.toFixed(0) + ',' + scenario.totalBenefits.toFixed(0) + ',' + scenario.netBenefit.toFixed(0) + ',' + scenario.bcRatio.toFixed(2) + ',' + baselineCases.toFixed(0) + ',' + baselineDeaths.toFixed(0) + ',' + scenario.casesAverted.toFixed(0) + ',' + scenario.deathsAverted.toFixed(0) + ',' + scenario.costPerDALY.toFixed(2) + '\n';
    }

    csv += '\nComparison Table\n';
    csv += 'Year';
    for (const key in allScenarios) {
        const scenario = allScenarios[key];
        csv += ',"' + scenario.name + ' Cases","' + scenario.name + ' Deaths","' + scenario.name + ' Costs"';
    }
    csv += '\n';

    const current = allScenarios[currentScenario];
    for (let i = 0; i < current.years.length; i++) {
        csv += current.years[i];
        for (const key in allScenarios) {
            const scenario = allScenarios[key];
            csv += ',' + scenario.yearlyData.outcomes.cases[i].toFixed(0) + ',' + scenario.yearlyData.outcomes.deaths[i].toFixed(0) + ',' + scenario.yearlyData.costs.total[i].toFixed(0);
        }
        csv += '\n';
    }

    downloadFile(csv, 'cholera-results.csv', 'text/csv');
}

// Export to JSON
function exportToJSON() {
    const data = {
        generatedAt: new Date().toISOString(),
        formInputs: getInputValues(),
        scenarios: {}
    };

    for (const key in allScenarios) {
        const scenario = allScenarios[key];
        // compute baseline values for completeness
        const totalProjCases = scenario.yearlyData.outcomes.cases.reduce((a, b) => a + b, 0);
        const totalProjDeaths = scenario.yearlyData.outcomes.deaths.reduce((a, b) => a + b, 0);
        const baselineCases = totalProjCases + scenario.casesAverted;
        const baselineDeaths = totalProjDeaths + scenario.deathsAverted;

        data.scenarios[key] = {
            name: scenario.name,
            totalCosts: scenario.totalCosts,
            totalBenefits: scenario.totalBenefits,
            netBenefit: scenario.netBenefit,
            bcRatio: scenario.bcRatio,
            baselineCases: baselineCases,
            baselineDeaths: baselineDeaths,
            casesAverted: scenario.casesAverted,
            deathsAverted: scenario.deathsAverted,
            costPerDALY: scenario.costPerDALY,
            years: scenario.years,
            yearlyData: scenario.yearlyData
        };
    }

    downloadFile(JSON.stringify(data, null, 2), 'cholera-results.json', 'application/json');
}

// Helper function to download file
function downloadFile(content, filename, mimeType) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Print results
function printResults() {
    const printWindow = window.open('', '', 'height=600,width=800');
    const scenario = allScenarios[currentScenario];

    let html = '<html><head><title>Cholera Cost-Benefit Analysis</title>';
    html += '<style>body { font-family: Arial, sans-serif; margin: 20px; }';
    html += 'h1 { color: #1e3a8a; } h2 { color: #0891b2; margin-top: 20px; }';
    html += 'table { width: 100%; border-collapse: collapse; margin: 10px 0; }';
    html += 'th, td { border: 1px solid #ccc; padding: 8px; text-align: right; }';
    html += 'th { background: #1e3a8a; color: white; }';
    html += 'td:first-child { text-align: left; }';
    html += '.metric { margin: 15px 0; padding: 10px; background: #f0f9ff; border-left: 4px solid #0891b2; }';
    html += '.metric-label { font-weight: bold; color: #1e3a8a; }';
    html += '.metric-value { font-size: 1.2em; color: #0891b2; }';
    html += '</style></head><body>';
    html += '<h1>Global Cholera Cost-Benefit Analysis</h1>';
    html += '<p>Generated: ' + new Date().toLocaleString() + '</p>';
    html += '<h2>Scenario: ' + scenario.name + '</h2>';

    html += '<div class="metric"><div class="metric-label">Total Investment Costs</div>';
    html += '<div class="metric-value">$' + formatNumber(scenario.totalCosts) + 'K</div></div>';

    html += '<div class="metric"><div class="metric-label">Total Economic Benefits</div>';
    html += '<div class="metric-value">$' + formatNumber(scenario.totalBenefits) + 'K</div></div>';

    html += '<div class="metric"><div class="metric-label">Net Benefit</div>';
    html += '<div class="metric-value">$' + formatNumber(scenario.netBenefit) + 'K</div></div>';

    html += '<div class="metric"><div class="metric-label">Benefit-Cost Ratio</div>';
    html += '<div class="metric-value">' + scenario.bcRatio.toFixed(2) + '</div></div>';

    // calculate baseline outcomes for print
    const totalProjCases = scenario.yearlyData.outcomes.cases.reduce((a, b) => a + b, 0);
    const totalProjDeaths = scenario.yearlyData.outcomes.deaths.reduce((a, b) => a + b, 0);
    const baselineCases = totalProjCases + scenario.casesAverted;
    const baselineDeaths = totalProjDeaths + scenario.deathsAverted;

    html += '<h2>Health Outcomes</h2>';
    html += '<table><tr><th>Metric</th><th>Value</th></tr>';
    html += '<tr><td>Baseline Cases</td><td>' + formatNumber(baselineCases) + '</td></tr>';
    html += '<tr><td>Cases Averted</td><td>' + formatNumber(scenario.casesAverted) + '</td></tr>';
    html += '<tr><td>Baseline Deaths</td><td>' + formatNumber(baselineDeaths) + '</td></tr>';
    html += '<tr><td>Deaths Averted</td><td>' + formatNumber(scenario.deathsAverted) + '</td></tr>';
    html += '<tr><td>Cost per DALY</td><td>$' + scenario.costPerDALY.toFixed(2) + '</td></tr></table>';

    html += '<h2>Yearly Projection</h2>';
    html += '<table><tr><th>Year</th><th>Cases</th><th>Deaths</th><th>Annual Cost (USD K)</th></tr>';
    for (let i = 0; i < scenario.years.length; i++) {
        html += '<tr><td>' + scenario.years[i] + '</td>';
        html += '<td>' + scenario.yearlyData.outcomes.cases[i].toFixed(0) + '</td>';
        html += '<td>' + scenario.yearlyData.outcomes.deaths[i].toFixed(0) + '</td>';
        html += '<td>' + scenario.yearlyData.costs.total[i].toFixed(0) + '</td></tr>';
    }
    html += '</table>';
    html += '<p style="margin-top: 20px; font-size: 0.9em; color: #666;"><em>Global Cholera Cost Calculator</em></p>';
    html += '</body></html>';

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
}
