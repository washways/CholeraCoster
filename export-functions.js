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

// Helper: get country display name
function getCountryDisplayName() {
    // First try the global currentCountry object
    if (currentCountry && currentCountry.name && currentCountry.name !== 'Global') {
        return currentCountry.name;
    }
    // Fallback: look up the ISO code in the countryNames dictionary
    const code = document.getElementById('countryCodeInput') ? document.getElementById('countryCodeInput').value.toUpperCase() : '';
    if (code && typeof countryNames !== 'undefined' && countryNames[code]) {
        return countryNames[code];
    }
    // Last resort: return the ISO code itself
    return code || 'Selected Country';
}

// Helper: build the shared comparison table HTML for all 4 scenarios
function buildComparisonTableHTML() {
    let rows = '';
    for (const [key, s] of Object.entries(allScenarios)) {
        rows += '<tr>';
        rows += '<td>' + s.name + '</td>';
        rows += '<td style="text-align:right">$' + formatNumber(s.totalCosts) + '</td>';
        rows += '<td style="text-align:right">$' + formatNumber(s.totalBenefits) + '</td>';
        rows += '<td style="text-align:right">' + formatNumber(s.casesAverted) + '</td>';
        rows += '<td style="text-align:right">' + formatNumber(s.deathsAverted) + '</td>';
        rows += '<td style="text-align:right">$' + formatNumber(s.netBenefit) + '</td>';
        rows += '<td style="text-align:right">' + s.bcRatio.toFixed(2) + '</td>';
        rows += '<td style="text-align:right">$' + s.costPerDALY.toFixed(2) + '</td>';
        rows += '</tr>';
    }
    return '<table>' +
        '<tr><th>Scenario</th><th>Total Cost</th><th>Total Benefit</th><th>Cases Averted</th><th>Deaths Averted</th><th>Net Benefit</th><th>B/C Ratio</th><th>Cost/DALY</th></tr>' +
        rows + '</table>';
}

// Helper: build the economic breakdown table for a given scenario
function buildEconBreakdownHTML(s) {
    const emergencyTotal = s.yearlyData.benefits.emergencyWash.reduce((a, b) => a + b, 0) +
        s.yearlyData.benefits.emergencyOCV.reduce((a, b) => a + b, 0) +
        s.yearlyData.benefits.emergencyCM.reduce((a, b) => a + b, 0);
    return '<table>' +
        '<tr><th>Economic Indicator</th><th>Value (USD)</th></tr>' +
        '<tr><td>Value of Lives Saved</td><td style="text-align:right">$' + formatNumber(s.yearlyData.benefits.choleraValueLife.reduce((a, b) => a + b, 0)) + '</td></tr>' +
        '<tr><td>Productivity Restored</td><td style="text-align:right">$' + formatNumber(s.yearlyData.benefits.choleraProdTime.reduce((a, b) => a + b, 0)) + '</td></tr>' +
        '<tr><td>Emergency Costs Avoided</td><td style="text-align:right">$' + formatNumber(emergencyTotal) + '</td></tr>' +
        '<tr style="background:#f1f5f9;"><td><strong>Net Economic Benefit</strong></td><td style="text-align:right"><strong>$' + formatNumber(s.netBenefit) + '</strong></td></tr>' +
        '</table>';
}

// Helper: capture all chart canvases as base64 images
function captureCharts() {
    const ids = ['comparisonChart', 'costChart', 'outcomeChart', 'benefitChart'];
    const imgs = {};
    for (const id of ids) {
        const canvas = document.getElementById(id);
        imgs[id] = (canvas && canvas.width > 0) ? canvas.toDataURL('image/png') : '';
    }
    return imgs;
}

// Print Report — shows all 4 scenarios with comparison
function printResults() {
    if (!allScenarios || !allScenarios.bau) {
        alert('Please calculate the analysis first.');
        return;
    }

    const countryName = getCountryDisplayName();
    const inputs = getInputValues();
    const imgs = captureCharts();

    const printWindow = window.open('', '', 'height=800,width=900');

    let html = '<html><head><title>Cholera Investment Case – ' + countryName + '</title>';
    html += '<style>';
    html += 'body { font-family: Calibri, Arial, sans-serif; margin: 20px; line-height: 1.4; color: #1e293b; }';
    html += 'h1 { color: #1e3a8a; font-size: 20pt; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px; }';
    html += 'h2 { color: #0891b2; font-size: 14pt; margin-top: 18px; border-bottom: 1px solid #e2e8f0; }';
    html += 'p { font-size: 10pt; margin: 4px 0; }';
    html += 'table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 9pt; }';
    html += 'th, td { border: 1px solid #cbd5e1; padding: 4px 6px; }';
    html += 'th { background: #1e3a8a; color: white; font-size: 8pt; }';
    html += 'td:first-child { text-align: left; }';
    html += '.highlight { padding: 10px; background: #f0f9ff; border-left: 4px solid #0891b2; margin: 10px 0; font-size: 10pt; }';
    html += '.chart-img { width: 100%; max-width: 500px; display: block; margin: 10px auto; }';
    html += '.footer { margin-top: 20px; font-size: 8pt; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 5px; }';
    html += '</style></head><body>';

    html += '<h1>Cholera Investment Case: ' + countryName + '</h1>';
    html += '<p><strong>Date:</strong> ' + new Date().toLocaleDateString() + ' &nbsp;|&nbsp; <strong>Analysis Period:</strong> ' + inputs.duration + ' years &nbsp;|&nbsp; <strong>Population:</strong> ' + formatNumber(inputs.population * 1000) + '</p>';

    html += '<div class="highlight"><strong>Executive Summary:</strong> This report compares four cholera intervention strategies for <strong>' + countryName + '</strong> over a <strong>' + inputs.duration + '-year</strong> period. Targeted WASH and OCV investments show substantial returns compared to doing nothing.</div>';

    // Section 1: Scenario Comparison
    html += '<h2>1. Scenario Comparison</h2>';
    html += buildComparisonTableHTML();

    if (imgs.comparisonChart) {
        html += '<img class="chart-img" src="' + imgs.comparisonChart + '" alt="Scenario Comparison" />';
    }

    // Section 2: Health Outcomes across all scenarios
    html += '<h2>2. Projected Health Outcomes</h2>';
    html += '<table><tr><th>Scenario</th><th>Total Cases</th><th>Total Deaths</th><th>Cases Averted</th><th>Deaths Averted</th></tr>';
    for (const [key, s] of Object.entries(allScenarios)) {
        const totalCases = s.yearlyData.outcomes.cases.reduce((a, b) => a + b, 0);
        const totalDeaths = s.yearlyData.outcomes.deaths.reduce((a, b) => a + b, 0);
        html += '<tr><td>' + s.name + '</td>';
        html += '<td style="text-align:right">' + formatNumber(totalCases) + '</td>';
        html += '<td style="text-align:right">' + formatNumber(totalDeaths) + '</td>';
        html += '<td style="text-align:right">' + formatNumber(s.casesAverted) + '</td>';
        html += '<td style="text-align:right">' + formatNumber(s.deathsAverted) + '</td></tr>';
    }
    html += '</table>';

    if (imgs.outcomeChart) {
        html += '<img class="chart-img" src="' + imgs.outcomeChart + '" alt="Health Outcomes" />';
    }

    // Section 3: Cost breakdown
    html += '<h2>3. Cost Breakdown</h2>';
    if (imgs.costChart) {
        html += '<img class="chart-img" src="' + imgs.costChart + '" alt="Cost Breakdown" />';
    }

    // Section 4: Economic benefits for each intervention scenario
    html += '<h2>4. Economic Return by Scenario</h2>';
    const interventionKeys = ['wash', 'ocv', 'combined'];
    for (const key of interventionKeys) {
        const s = allScenarios[key];
        if (!s) continue;
        html += '<h3 style="color:#0f172a; font-size: 11pt; margin-top: 10px;">' + s.name + ' (B/C Ratio: ' + s.bcRatio.toFixed(2) + ')</h3>';
        html += buildEconBreakdownHTML(s);
    }

    if (imgs.benefitChart) {
        html += '<img class="chart-img" src="' + imgs.benefitChart + '" alt="Benefits" />';
    }

    html += '<div class="footer">Generated by the Global Cholera Cost Calculator &bull; washways1@gmail.com</div>';
    html += '</body></html>';

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
}

// Export to Word — generates a .doc file using MHTML multipart format for reliable chart embedding
function exportToWord() {
    if (!allScenarios || !allScenarios.bau) {
        alert("Please calculate the analysis first.");
        return;
    }

    const inputs = getInputValues();
    const countryName = getCountryDisplayName();
    const dateStr = new Date().toLocaleDateString();
    const imgs = captureCharts();

    // Collect chart images as MHTML parts
    const boundary = '----=_NextPart_CHOLERA_EXPORT';
    const chartParts = [];
    const chartCids = {};
    let partIdx = 0;
    for (const [id, dataUrl] of Object.entries(imgs)) {
        if (!dataUrl) continue;
        // dataUrl is like "data:image/png;base64,iVBOR..."
        const base64Data = dataUrl.split(',')[1];
        if (!base64Data) continue;
        const cid = id + '@chart.local';
        chartCids[id] = 'cid:' + cid;
        chartParts.push(
            '--' + boundary + '\r\n' +
            'Content-Type: image/png\r\n' +
            'Content-Transfer-Encoding: base64\r\n' +
            'Content-Location: ' + cid + '\r\n' +
            '\r\n' +
            base64Data.match(/.{1,76}/g).join('\r\n') + '\r\n'
        );
        partIdx++;
    }

    // Build comparison rows
    let comparisonRows = '';
    for (const [key, s] of Object.entries(allScenarios)) {
        comparisonRows += '<tr>' +
            '<td>' + s.name + '</td>' +
            '<td style="text-align:right">$' + formatNumber(s.totalCosts) + '</td>' +
            '<td style="text-align:right">$' + formatNumber(s.totalBenefits) + '</td>' +
            '<td style="text-align:right">' + formatNumber(s.casesAverted) + '</td>' +
            '<td style="text-align:right">' + formatNumber(s.deathsAverted) + '</td>' +
            '<td style="text-align:right">$' + formatNumber(s.netBenefit) + '</td>' +
            '<td style="text-align:right">' + s.bcRatio.toFixed(2) + '</td>' +
            '<td style="text-align:right">$' + s.costPerDALY.toFixed(2) + '</td>' +
            '</tr>';
    }

    // Build health rows
    let healthRows = '';
    for (const [key, s] of Object.entries(allScenarios)) {
        const tc = s.yearlyData.outcomes.cases.reduce((a, b) => a + b, 0);
        const td2 = s.yearlyData.outcomes.deaths.reduce((a, b) => a + b, 0);
        healthRows += '<tr>' +
            '<td>' + s.name + '</td>' +
            '<td style="text-align:right">' + formatNumber(tc) + '</td>' +
            '<td style="text-align:right">' + formatNumber(td2) + '</td>' +
            '<td style="text-align:right">' + formatNumber(s.casesAverted) + '</td>' +
            '<td style="text-align:right">' + formatNumber(s.deathsAverted) + '</td>' +
            '</tr>';
    }

    // Economic breakdown per intervention
    let econSections = '';
    for (const key of ['wash', 'ocv', 'combined']) {
        const s = allScenarios[key];
        if (!s) continue;
        const emergTotal = s.yearlyData.benefits.emergencyWash.reduce((a, b) => a + b, 0) +
            s.yearlyData.benefits.emergencyOCV.reduce((a, b) => a + b, 0) +
            s.yearlyData.benefits.emergencyCM.reduce((a, b) => a + b, 0);
        econSections += '<h3>' + s.name + ' (B/C Ratio: ' + s.bcRatio.toFixed(2) + ')</h3>' +
            '<table>' +
            '<tr><th>Economic Indicator</th><th>Value (USD)</th></tr>' +
            '<tr><td>Value of Lives Saved</td><td style="text-align:right">$' + formatNumber(s.yearlyData.benefits.choleraValueLife.reduce((a, b) => a + b, 0)) + '</td></tr>' +
            '<tr><td>Productivity Restored</td><td style="text-align:right">$' + formatNumber(s.yearlyData.benefits.choleraProdTime.reduce((a, b) => a + b, 0)) + '</td></tr>' +
            '<tr><td>Emergency Costs Avoided</td><td style="text-align:right">$' + formatNumber(emergTotal) + '</td></tr>' +
            '<tr style="background:#f1f5f9;"><td><strong>Net Economic Benefit</strong></td><td style="text-align:right"><strong>$' + formatNumber(s.netBenefit) + '</strong></td></tr>' +
            '</table>';
    }

    // Best scenario recommendation
    let bestScenario = allScenarios.combined;
    let bestName = 'WASH + OCV';
    for (const [key, s] of Object.entries(allScenarios)) {
        if (key === 'bau') continue;
        if (s.bcRatio > bestScenario.bcRatio) {
            bestScenario = s;
            bestName = s.name;
        }
    }

    // Chart image tags using cid references
    const comparisonImgTag = chartCids.comparisonChart ? '<img src="' + chartCids.comparisonChart + '" width="560" style="display:block;margin:8px auto;" />' : '';
    const outcomeImgTag = chartCids.outcomeChart ? '<img src="' + chartCids.outcomeChart + '" width="560" style="display:block;margin:8px auto;" />' : '';
    const costImgTag = chartCids.costChart ? '<img src="' + chartCids.costChart + '" width="560" style="display:block;margin:8px auto;" />' : '';
    const benefitImgTag = chartCids.benefitChart ? '<img src="' + chartCids.benefitChart + '" width="560" style="display:block;margin:8px auto;" />' : '';

    const htmlPart =
        '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
        '<head><meta charset="utf-8"><title>Investment Case – ' + countryName + '</title>' +
        '<style>' +
        'body{font-family:Calibri,Arial,sans-serif;max-width:800px;margin:0 auto;line-height:1.4;color:#1e293b}' +
        'h1{color:#1e3a8a;text-align:center;font-size:20pt;border-bottom:2px solid #1e3a8a;padding-bottom:5px;margin-bottom:5px}' +
        'h2{color:#0891b2;font-size:13pt;margin-top:14px;margin-bottom:4px;border-bottom:1px solid #e2e8f0}' +
        'h3{color:#0f172a;font-size:11pt;margin-top:8px;margin-bottom:3px}' +
        'p{font-size:10pt;margin:4px 0}' +
        'table{width:100%;border-collapse:collapse;margin:6px 0;font-size:8pt}' +
        'th,td{border:1px solid #cbd5e1;padding:3px 5px}' +
        'th{background-color:#f1f5f9;font-weight:bold;color:#1e293b;font-size:8pt}' +
        '.highlight{background-color:#f0f9ff;padding:8px;border-left:4px solid #0284c7;margin:8px 0;font-size:10pt}' +
        '.footer{margin-top:15px;font-size:8pt;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:4px}' +
        '</style></head><body>' +
        '<h1>Investment Case for Cholera Intervention: ' + countryName + '</h1>' +
        '<p style="text-align:center;color:#64748b"><strong>Date:</strong> ' + dateStr + ' &nbsp;|&nbsp; <strong>Analysis Period:</strong> ' + inputs.duration + ' years &nbsp;|&nbsp; <strong>Population:</strong> ' + formatNumber(inputs.population * 1000) + '</p>' +
        '<div class="highlight"><strong>Executive Summary:</strong> This investment case evaluates four cholera intervention strategies for <strong>' + countryName + '</strong> over <strong>' + inputs.duration + ' years</strong>. Among the options analysed, <strong>' + bestName + '</strong> achieves the highest B/C Ratio of <strong>' + bestScenario.bcRatio.toFixed(2) + '</strong>, generating <strong>$' + formatNumber(bestScenario.netBenefit) + '</strong> in net economic benefit from an investment of <strong>$' + formatNumber(bestScenario.totalCosts) + '</strong>.</div>' +
        '<h2>1. Scenario Comparison</h2>' +
        '<p>Four strategies are compared: Business as Usual (no intervention), WASH infrastructure alone, Oral Cholera Vaccination alone, and a combined WASH + OCV approach.</p>' +
        '<table><tr><th>Scenario</th><th>Total Cost</th><th>Total Benefit</th><th>Cases Averted</th><th>Deaths Averted</th><th>Net Benefit</th><th>B/C Ratio</th><th>Cost/DALY</th></tr>' + comparisonRows + '</table>' +
        comparisonImgTag +
        '<h2>2. Health Outcomes Across All Scenarios</h2>' +
        '<p>Projected cholera cases and deaths for ' + countryName + ' under each strategy over the ' + inputs.duration + '-year period:</p>' +
        '<table><tr><th>Scenario</th><th>Total Cases</th><th>Total Deaths</th><th>Cases Averted</th><th>Deaths Averted</th></tr>' + healthRows + '</table>' +
        outcomeImgTag +
        '<h2>3. Investment Costs</h2>' +
        '<p>Breakdown of costs for infrastructure, operations, and vaccination delivery across each scenario in ' + countryName + '.</p>' +
        costImgTag +
        '<h2>4. Economic Return by Intervention</h2>' +
        '<p>Detailed economic benefits for each active intervention scenario, including lives saved, productivity restored, and emergency costs avoided.</p>' +
        econSections +
        benefitImgTag +
        '<div class="highlight"><strong>Recommendation:</strong> Investing in cholera prevention in ' + countryName + ' is strongly justified. The <strong>' + bestName + '</strong> strategy delivers the highest return, averting <strong>' + formatNumber(bestScenario.casesAverted) + '</strong> cases and <strong>' + formatNumber(bestScenario.deathsAverted) + '</strong> deaths with every $1 invested returning <strong>$' + bestScenario.bcRatio.toFixed(2) + '</strong> in economic benefit.</div>' +
        '<div class="footer">Generated by the Global Cholera Cost Calculator &bull; Contact: washways1@gmail.com</div>' +
        '</body></html>';

    // Build MHTML document
    const mhtmlContent =
        'MIME-Version: 1.0\r\n' +
        'Content-Type: multipart/related; boundary="' + boundary + '"\r\n' +
        '\r\n' +
        '--' + boundary + '\r\n' +
        'Content-Type: text/html; charset="utf-8"\r\n' +
        'Content-Transfer-Encoding: quoted-printable\r\n' +
        '\r\n' +
        htmlPart + '\r\n' +
        chartParts.join('') +
        '--' + boundary + '--';

    const blob = new Blob([mhtmlContent], {
        type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.href = url;
    const safeCountryName = countryName.replace(/\s+/g, '_');
    element.download = 'Investment_Case_' + safeCountryName + '_' + dateStr.replace(/\//g, '-') + '.doc';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
}
