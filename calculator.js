// Cholera Cost Calculator - Multi-Country Version
// Loads data from public APIs and performs cost-benefit analysis

// -----------------------------------------------------------------------------
// configuration
// set to false if you want to run the calculator entirely offline (no World Bank
// fetches).  Useful on networks that block localhost:5001 or external proxies.
const ENABLE_API = true;

// If you deploy a Cloudflare Worker proxy, set its base URL here (no trailing slash).
// Example: https://my-wb-proxy.your-domain.workers.dev
const CLOUDFLARE_WB_PROXY = 'https://cholera.washways1.workers.dev/';

let currentScenario = 'bau';
let calculationResults = {};
let allScenarios = {};
let currentCountry = { code: 'MWI', name: 'Malawi' };

// Country name mapping
const countryNames = {
    'MWI': 'Malawi',
    'KEN': 'Kenya',
    'UGA': 'Uganda',
    'TZA': 'Tanzania',
    'ZMB': 'Zambia',
    'ZWE': 'Zimbabwe',
    'RWA': 'Rwanda',
    'BDI': 'Burundi',
    'MOZ': 'Mozambique',
    'ZAF': 'South Africa',
    'ETH': 'Ethiopia',
    'SDN': 'Sudan',
    'COD': 'Dem. Rep. Congo',
    'NGA': 'Nigeria',
    'GHA': 'Ghana',
    'BGD': 'Bangladesh',
    'IND': 'India',
    'YEM': 'Yemen',
    'HTI': 'Haiti'
};

// Chart instances
let costChartInstance = null;
let outcomeChartInstance = null;
let benefitChartInstance = null;
let comparisonChartInstance = null;

// Loading overlay functions
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Close splash screen button
    const splashCloseBtn = document.getElementById('splashCloseBtn');
    if (splashCloseBtn) {
        splashCloseBtn.addEventListener('click', () => {
            document.getElementById('splashScreen').classList.add('hidden');
        });
    }

    // Country selector
    const countrySelect = document.getElementById('countrySelect');
    if (countrySelect) {
        countrySelect.addEventListener('change', handleCountryChange);
    }
    
    await initializeCalculator();
    setupEventListeners();
});

async function handleCountryChange(event) {
    const newCountryCode = event.target.value;
    const newCountryName = countryNames[newCountryCode] || newCountryCode;
    
    currentCountry = { code: newCountryCode, name: newCountryName };
    document.getElementById('headerCountry').textContent = newCountryName;
    document.getElementById('countryCodeInput').value = newCountryCode;
    
    showLoading();
    await initializeCalculator();
    hideLoading();
}

async function initializeCalculator() {
    try {
        // Sync country code input with header selector
        document.getElementById('countryCodeInput').value = currentCountry.code;
        
        // Load country data from public APIs
        const countryData = await fetchCountryData(currentCountry.code);
        
        // Update API status indicator
        let statusText = countryData.success ? 'API status: ✓ Connected' : 'API status: ✗ Offline (using defaults)';
        document.getElementById('apiStatus').textContent = statusText;

        // Update population input with actual data
        const projection2025 = Math.round(countryData.population * 1.005); // Project to 2025
        const popInput = document.getElementById('populationInput');
        popInput.value = Math.round(projection2025 / 1000 * 0.15); // ~15% in hotspots
        // visually mark as derived from API
        popInput.classList.add('api-derived');

        // show warning if API fetch explicitly failed
        if (countryData.success === false) {
            document.getElementById('apiWarning').style.display = 'block';
            // not really derived if we had to fall back
            popInput.classList.remove('api-derived');
        } else {
            document.getElementById('apiWarning').style.display = 'none';
        }

        // Display API statistics - always show the panel
        document.getElementById('apiStats').style.display = 'block';
        document.getElementById('apiPop').textContent = countryData.population.toLocaleString();
        document.getElementById('apiGDP').textContent = countryData.gdpPerCapita ? `$${countryData.gdpPerCapita.toLocaleString()}` : '-';
        document.getElementById('apiGrowth').textContent = countryData.gdpGrowth !== null ? `${countryData.gdpGrowth.toFixed(1)}%` : '-';
        document.getElementById('apiUrban').textContent = countryData.urbanPopulation !== null ? `${countryData.urbanPopulation.toFixed(1)}%` : '-';
        document.getElementById('apiOpen').textContent = countryData.openDefecation !== null ? `${countryData.openDefecation.toFixed(1)}%` : '-';
        document.getElementById('apiSafe').textContent = countryData.safeSanitation !== null ? `${countryData.safeSanitation.toFixed(1)}%` : '-';
        document.getElementById('apiWater').textContent = countryData.safeWater !== null ? `${countryData.safeWater.toFixed(1)}%` : '-';
        document.getElementById('apiHealth').textContent = countryData.healthExpenditure !== null ? `${countryData.healthExpenditure.toFixed(1)}%` : '-';
        document.getElementById('apiInfant').textContent = countryData.infantMortality !== null ? `${countryData.infantMortality.toFixed(0)}` : '-';
        document.getElementById('apiUnderFive').textContent = countryData.underFiveMortality !== null ? `${countryData.underFiveMortality.toFixed(0)}` : '-';
        document.getElementById('apiStunt').textContent = countryData.stunting !== null ? `${countryData.stunting.toFixed(1)}%` : '-';
        document.getElementById('apiLife').textContent = countryData.lifeExpectancy !== null ? `${countryData.lifeExpectancy.toFixed(1)} yrs` : '-';
        document.getElementById('apiUnemployment').textContent = countryData.unemploymentRate !== null ? `${countryData.unemploymentRate.toFixed(1)}%` : '-';
        document.getElementById('apiGini').textContent = countryData.gini !== null ? `${(countryData.gini / 100).toFixed(2)}` : '-';
        
        // Proxy indicators from WB data
        if (countryData.proxies) {
            document.getElementById('apiHealthCapacity').textContent = countryData.proxies.healthCapacity || '-';
            document.getElementById('apiDevelopment').textContent = countryData.proxies.developmentLevel || '-';
            document.getElementById('apiNutrition').textContent = countryData.proxies.nutritionStatus || '-';
            document.getElementById('apiDiseaseRisk').textContent = countryData.proxies.diseaseEnvironment || '-';
            document.getElementById('apiHealthWorkers').textContent = countryData.proxies.healthWorkerDensity || '-';
            document.getElementById('apiPoverty').textContent = countryData.proxies.estimatedPovertyRate || '-';
        }
        
        if (countryData.year) {
            document.getElementById('apiYear').textContent = countryData.year;
        }
        
        // If GDP per capita is available, calculate derived parameters
        if (countryData.gdpPerCapita) {
            const suggested = Math.round(countryData.gdpPerCapita * 30); // VSL = 30× GDP
            document.getElementById('vslNote').textContent = `(calculated ≈ $${suggested.toLocaleString()} = GDP × 30)`;
            const vslInput = document.getElementById('vslInput');
            if (!vslInput.value || vslInput.value === '27000') {
                vslInput.value = suggested;
                vslInput.classList.add('calculated-from-wb');
            }
            
            // Daily wage loss = GDP per capita / 250 working days
            const dailyWage = Math.round(countryData.gdpPerCapita / 250);
            const wageInput = document.getElementById('wageLossInput');
            if (!wageInput.value || wageInput.value === '5') {
                wageInput.value = dailyWage;
                wageInput.classList.add('calculated-from-wb');
            }
            document.getElementById('wageLossNote').textContent = `(estimated ≈ $${dailyWage} = GDP ÷ 250 working days)`;
        }
        
        // Estimate base case rate from sanitation coverage
        const sanitationFieldValue = countryData.safeSanitation;
        if (sanitationFieldValue !== null && sanitationFieldValue !== undefined) {
            // Cholera risk inversely correlated with sanitation: worse sanitation = higher baseline incidence
            // Formula: baseline = 0.001 + (1 - sanitation%) * 0.003
            const sanitationFraction = sanitationFieldValue / 100;
            const estimatedBaseCaseRate = (0.001 + (1 - sanitationFraction) * 0.003) * 1000; // per 1000
            const baseCaseInput = document.getElementById('baseCaseRateInput');
            if (!baseCaseInput.value || baseCaseInput.value === '0.5') {
                baseCaseInput.value = Math.round(estimatedBaseCaseRate * 100) / 100;
                baseCaseInput.classList.add('calculated-from-wb');
            }
            document.getElementById('baseCaseRateNote').textContent = `(estimated from sanitation: ${sanitationFieldValue.toFixed(1)}% coverage)`;
        }
        
        // Estimate case management cost from health spending level
        if (countryData.healthExpenditure !== null && countryData.healthExpenditure !== undefined) {
            // Countries with higher health spending tend to have higher case management costs
            // Rough formula:  baseline + health_spending * multiplier
            const healthSpending = countryData.healthExpenditure; // % of GDP
            const estimatedCaseCost = Math.max(50, Math.min(300, 80 + healthSpending * 20)); // $50-300
            const caseCostInput = document.getElementById('caseCostInput');
            if (!caseCostInput.value || caseCostInput.value === '150') {
                caseCostInput.value = Math.round(estimatedCaseCost);
                caseCostInput.classList.add('calculated-from-wb');
            }
            document.getElementById('caseCostNote').textContent = `(estimated from health spending: ${healthSpending.toFixed(1)}% GDP)`;
        }

        // initialize tooltips once elements exist
        initTooltips();

        // Hide loading, show form
        document.getElementById('loading-data').classList.remove('active');
        document.getElementById('parameterForm').style.display = 'block';
        
        // Set default calculations
        calculateAnalysis();
    } catch (error) {
        console.error('Error initializing calculator:', error);
        document.getElementById('loading-data').innerHTML = `
            <div class="alert alert-warning">
                <p><i class="fas fa-exclamation-triangle"></i> Could not load external data, using default values.</p>
                <p>Office firewall, browser tracking‑prevention or an inactive proxy may be blocking the World Bank API.</p>
                <ul>
                    <li>Make sure the local proxy is running: <code>python wb_proxy.py</code> (or use the Windows launcher).</li>
                    <li>Allow <code>localhost:5001</code> through your firewall/antivirus.</li>
                    <li>Disable "tracking prevention" or add <code>http://localhost:8000</code> to your exceptions.</li>
                    <li>Or simply type in your own data in the blue fields.</li>
                </ul>
            </div>
        `;
        document.getElementById('loading-data').classList.remove('active');
        document.getElementById('parameterForm').style.display = 'block';
        initTooltips();
        calculateAnalysis();
    }
}

async function fetchCountryData(country='MWI', year=null) {
    // if the user has disabled API access, immediately return default object
    if (!ENABLE_API) {
        console.warn('API disabled; returning default data');
        return {
            population: 19130000,
            gdpPerCapita: null,
            gdpTotal: null,
            gdpGrowth: null,
            urbanPopulation: null,
            openDefecation: null,
            safeSanitation: null,
            safeWater: null,
            healthExpenditure: null,
            infantMortality: null,
            underFiveMortality: null,
            stunting: null,
            lifeExpectancy: null,
            literacy: null,
            unemploymentRate: null,
            gini: null,
            country: countryNames[country] || country,
            year: null,
            success: false,
            proxies: {}
        };
    }

    // Request multiple WB indicators for comprehensive country profile
    const codes = {
        population: 'SP.POP.TOTL',                  // Total population
        gdpPerCapita: 'NY.GDP.PCAP.CD',             // GDP per capita (USD)
        gdpTotal: 'NY.GDP.MKTP.CD',                 // GDP total
        gdpGrowth: 'NY.GDP.MKTP.KD.ZG',            // GDP growth (annual %)
        urbanPopulation: 'SP.URB.TOTL.IN.ZS',      // Urban population (%)
        openDefecation: 'SH.STA.ODFC.ZS',          // Open defecation (%)
        safeSanitation: 'SH.STA.SMSS.ZS',          // Safely managed sanitation (%)
        safeWater: 'SH.H2O.SMDW.ZS',               // Safe water supply (%)
        healthExpenditure: 'SH.XPD.CHEX.GD.ZS',    // Health expenditure (% GDP)
        infantMortality: 'SP.DYN.IMRT.IN',         // Infant mortality (per 1000)
        underFiveMortality: 'SP.DYN.CDRT.IN',     // Under-5 mortality (per 1000)
        stunting: 'SH.STA.STNT.ZS',                // Child stunting (%)
        lifeExpectancy: 'SP.DYN.LE00.IN',          // Life expectancy (years)
        literacy: 'SE.ADT.LITR.ZS',                // Adult literacy (%)
        unemploymentRate: 'SL.UEM.TOTL.ZS',       // Unemployment (%)
        gini: 'SI.POV.GINI'                        // Gini coefficient (inequality)
    };

    const result = {
        population: 19130000,
        gdpPerCapita: null,
        gdpTotal: null,
        gdpGrowth: null,
        urbanPopulation: null,
        openDefecation: null,
        safeSanitation: null,
        safeWater: null,
        healthExpenditure: null,
        infantMortality: null,
        underFiveMortality: null,
        stunting: null,
        lifeExpectancy: null,
        literacy: null,
        unemploymentRate: null,
        gini: null,
        country: 'Malawi',
        year: null,
        success: false
    };

    // Try current year first, then fall back to previous years
    const yearOrder = year ? [year, year-1, year-2, year-3, null] : [null];

    // Helper function to fetch using either a local proxy or public CORS proxies
    async function fetchWithProxy(url) {
            // Try configured Cloudflare Worker proxy first (if set)
            if (typeof CLOUDFLARE_WB_PROXY === 'string' && CLOUDFLARE_WB_PROXY.trim().length > 0) {
                try {
                    const cfUrl = CLOUDFLARE_WB_PROXY + `/` + url.replace('https://api.worldbank.org/v2/', '');
                    const resp = await fetch(cfUrl);
                    if (resp.ok) return await resp.json();
                } catch (err) {
                    console.debug('cloudflare proxy failed:', err.message);
                }
            }

            // next try the local Flask proxy (must be started separately)
            const localProxy = `http://localhost:5001/wb${url.replace('https://api.worldbank.org/v2', '')}`;
            try {
                const resp = await fetch(localProxy);
                if (resp.ok) return await resp.json();
            } catch (err) {
                console.debug('local proxy failed:', err.message);
            }

            // public proxies as fallback
            const proxies = [
                (u) => `https://api.codetabs.com/v1/proxy?url=${encodeURIComponent(u)}`,
                (u) => `https://cors.sh/${u}`,
                (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`
            ];

        for (const proxyFn of proxies) {
            try {
                const proxiedUrl = proxyFn(url);
                const resp = await fetch(proxiedUrl, { timeout: 5000 });
                if (resp.ok) {
                    return await resp.json();
                }
            } catch (err) {
                console.debug(`proxy failed:`, err.message);
                continue;
            }
        }
        throw new Error('All CORS proxies failed');
    }

    for (const [key, code] of Object.entries(codes)) {
        let foundValue = false;
        for (const tryYear of yearOrder) {
            if (foundValue) break;
            let baseUrl = `https://api.worldbank.org/v2/country/${country}/indicator/${code}?format=json&per_page=1`;
            if (tryYear) baseUrl += `&date=${tryYear}`;
            try {
                const data = await fetchWithProxy(baseUrl);
                if (data[1] && Array.isArray(data[1]) && data[1].length > 0 && data[1][0] && data[1][0].value !== null) {
                    const val = data[1][0].value;
                    if (key === 'population') {
                        result.population = parseInt(val) || result.population;
                        result.year = data[1][0].date;
                    } else {
                        result[key] = parseFloat(val);
                    }
                    result.success = true;
                    foundValue = true;
                    console.info(`✓ ${code} = ${val} (year ${result.year})`);
                }
            } catch (err) {
                console.debug(`${code} fetch error:`, err.message);
            }
        }
    }

    // Calculate proxy indicators from WB data
    result.proxies = calculateProxyIndicators(result);

    return result;
}

function calculateProxyIndicators(data) {
    const proxies = {};

    // Healthcare system capacity proxy
    if (data.healthExpenditure !== null) {
        // Health spending correlates with system capacity
        if (data.healthExpenditure < 3) proxies.healthCapacity = 'Low (limited resources)';
        else if (data.healthExpenditure < 6) proxies.healthCapacity = 'Moderate (developing)';
        else proxies.healthCapacity = 'High (well-resourced)';
    }

    // Urbanization and water/sanitation correlation
    if (data.urbanPopulation !== null) {
        proxies.urbanizationLevel = `${data.urbanPopulation.toFixed(0)}% urban`;
    }

    // Stunting as proxy for underlying malnutrition/WASH quality
    if (data.stunting !== null) {
        if (data.stunting > 30) proxies.nutritionStatus = 'Severe stunting (food security issue)';
        else if (data.stunting > 15) proxies.nutritionStatus = 'Moderate stunting (nutrition concern)';
        else proxies.nutritionStatus = 'Good nutrition status';
    }

    // Mortality from under-5 (captures overall development/healthcare)
    if (data.underFiveMortality !== null) {
        proxies.developmentLevel = `Under-5 mortality: ${data.underFiveMortality.toFixed(0)} per 1,000 (development proxy)`;
    }

    // Estimated poverty rate (inverse correlation with GDP per capita and literacy)
    if (data.gdpPerCapita !== null && data.literacy !== null) {
        // Very rough proxy: lower GDP + lower literacy = higher poverty
        const povertyProxy = Math.min(80, Math.max(5, 100 - (data.gdpPerCapita / 200) - data.literacy / 3));
        proxies.estimatedPovertyRate = `~${povertyProxy.toFixed(0)}% (estimated from GDP + literacy)`;
    }

    // Healthcare worker availability proxy (from health spending and mortality)
    if (data.healthExpenditure !== null && data.infantMortality !== null) {
        const healthWorkerCapacity = data.healthExpenditure * (1000 / (data.infantMortality + 1));
        if (healthWorkerCapacity < 50) proxies.healthWorkerDensity = 'Very low';
        else if (healthWorkerCapacity < 100) proxies.healthWorkerDensity = 'Low to moderate';
        else proxies.healthWorkerDensity = 'Moderate to high';
    }

    // Disease environment risk (from stunting, mortality, open defecation)
    if (data.stunting !== null && data.openDefecation !== null) {
        const diseaseRisk = (data.stunting / 30) + (data.openDefecation / 50);
        if (diseaseRisk > 1.5) proxies.diseaseEnvironment = 'High-risk environment';
        else if (diseaseRisk > 0.8) proxies.diseaseEnvironment = 'Moderate-risk environment';
        else proxies.diseaseEnvironment = 'Lower-risk environment';
    }

    return proxies;
}

function setupEventListeners() {
    // Calculate button
    document.getElementById('calculateBtn').addEventListener('click', calculateAnalysis);
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', resetDefaults);
    
    // Export/Print buttons
    document.getElementById('exportCSVBtn').addEventListener('click', exportToCSV);
    document.getElementById('exportJSONBtn').addEventListener('click', exportToJSON);
    document.getElementById('printBtn').addEventListener('click', printResults);

    // API test button
    const apiTest = document.getElementById('apiTestBtn');
    if (apiTest) {
        apiTest.addEventListener('click', async () => {
            const inputs = getInputValues();
            showLoading();
            const data = await fetchCountryData(inputs.countryCode, inputs.wbYear);
            hideLoading();
            console.log('API test result', data);
            alert('API returned ' + (data.success ? 'success' : 'no data') + '. See console for details.');
            document.getElementById('apiStatus').textContent = data.success ? 'API status: ✓ Connected' : 'API status: ✗ Offline (using defaults)';
        });
    }
    
    // Scenario buttons
    document.querySelectorAll('.scenario-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
            e.target.closest('.scenario-btn').classList.add('active');
            currentScenario = e.target.closest('.scenario-btn').dataset.scenario;
            updateResultsDisplay();
        });
    });
}

function getInputValues() {
    return {
        // Demographics
        population: parseFloat(document.getElementById('populationInput').value), // in thousands
        growthRate: parseFloat(document.getElementById('growthRateInput').value) / 100,
        baseYear: parseInt(document.getElementById('baseYearInput').value),
        duration: parseInt(document.getElementById('durationInput').value),
        
        // WASH targets
        waterTarget: parseFloat(document.getElementById('waterTargetInput').value) / 100,
        sanitationTarget: parseFloat(document.getElementById('sanitationTargetInput').value) / 100,
        hygieneTarget: parseFloat(document.getElementById('hygieneTargetInput').value) / 100,
        
        // OCV
        ocvTarget: parseFloat(document.getElementById('ocvTargetInput').value) / 100,
        
        // Costs per capita
        waterCost: parseFloat(document.getElementById('waterCostInput').value),
        sanitationCost: parseFloat(document.getElementById('sanitationCostInput').value),
        hygieneCost: parseFloat(document.getElementById('hygieneCostInput').value),
        ocvCost: parseFloat(document.getElementById('ocvCostInput').value),
        caseCost: parseFloat(document.getElementById('caseCostInput').value),
        otherCostPerCapita: parseFloat(document.getElementById('otherCostInput').value) || 0,
        emergencyWashCost: parseFloat(document.getElementById('emergencyWashCostInput').value),
        emergencyOCVCost: parseFloat(document.getElementById('emergencyOCVCostInput').value),
        emergencyCMCost: parseFloat(document.getElementById('emergencyCMCostInput').value),
        diarrheaTreatmentCost: parseFloat(document.getElementById('diarrhealTreatmentCostInput').value),
        funeralCost: parseFloat(document.getElementById('funeralCostInput').value),
        tourismBenefit: parseFloat(document.getElementById('tourismBenefitInput').value),
        countryCode: document.getElementById('countryCodeInput').value.toUpperCase(),
        wbYear: parseInt(document.getElementById('wbYearInput').value),
        
        // Health parameters
        baseCaseRate: parseFloat(document.getElementById('baseCaseRateInput').value) / 1000,
        cfRate: parseFloat(document.getElementById('cfRateInput').value) / 100,
        vsl: parseFloat(document.getElementById('vslInput').value),
        wageLoss: parseFloat(document.getElementById('wageLossInput').value),
    };
}

// add tooltip mapping and initialization
function initTooltips() {
    const tooltips = {
        populationInput: "Population at risk in cholera hotspots (thousands). Defaults from World Bank API when available.",
        growthRateInput: "Annual population growth rate (%) used to project future population.",
        baseYearInput: "Start year for projections.",
        durationInput: "Number of years for the roadmap (1–20).",
        waterTargetInput: "Target percentage of population reached by improved water supply.",
        sanitationTargetInput: "Target percentage covered by sanitation improvements.",
        hygieneTargetInput: "Target percentage of population receiving hygiene promotion.",
        ocvTargetInput: "Target percentage of population vaccinated with oral cholera vaccine.",
        waterCostInput: "Unit cost (USD) per person for water infrastructure. Use local estimates or defaults.",
        sanitationCostInput: "Unit cost (USD) per person for sanitation infrastructure.",
        hygieneCostInput: "Unit cost (USD) per person for hygiene promotion.",
        ocvCostInput: "Cost (USD) per person for vaccine campaigns (vaccine + delivery).",
        caseCostInput: "Average cost (USD) of treating one cholera case.",
        otherCostInput: "Additional per-capita program costs such as training, monitoring.",
        emergencyWashCostInput: "Average emergency WASH response cost saved per cholera case.",
        emergencyOCVCostInput: "Average emergency OCV response cost saved per case.",
        emergencyCMCostInput: "Cost saved from emergency case management per case.",
        diarrhealTreatmentCostInput: "Treatment cost (USD) avoided per diarrheal case due to cholera reduction.",
        funeralCostInput: "Funeral cost avoided per death averted.",
        tourismBenefitInput: "Economic benefit (USD) per case averted from tourism.",
        baseCaseRateInput: "Baseline annual cholera cases per 1,000 population. Determines disease burden.",
        cfRateInput: "Case fatality rate (%) used to convert cases to deaths.",
        vslInput: "Value of statistical life (USD) used to monetize averted deaths; you can instead estimate mortality value as a multiple of GDP per capita, the present value of lifetime earnings (human capital), or convert DALYs averted using a cost-per-DALY figure.",
        wageLossInput: "Daily wage loss (USD) per case used in productivity calculations.",
        countryCodeInput: "ISO3 country code for World Bank API data (e.g., MWI).",
        wbYearInput: "Year of World Bank data to fetch; the calculator will automatically try this year and up to 3 previous years if the requested year has no data."
    };

    Object.entries(tooltips).forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el) {
            el.setAttribute('title', text);
            el.setAttribute('data-bs-toggle', 'tooltip');
        }
    });

    // initialize bootstrap tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

async function calculateAnalysis() {
    const inputs = getInputValues();
    
    // Show loading while fetching
    showLoading();
    
    // refresh API-driven demographics if user changed country/year
    const apiData = await fetchCountryData(inputs.countryCode, inputs.wbYear);
    
    // Hide loading after fetch
    hideLoading();
    
    // update API status line whenever we refresh
    document.getElementById('apiStatus').textContent = apiData.success ? 'API status: ✓ Connected' : 'API status: ✗ Offline (using defaults)';
    if (apiData.success) {
        // Hide warning and show API stats when API succeeds
        document.getElementById('apiWarning').style.display = 'none';
        document.getElementById('apiStats').style.display = 'block';
        
        const proj = Math.round(apiData.population * 1.005);
        const popInput = document.getElementById('populationInput');
        popInput.value = Math.round(proj / 1000 * 0.15);
        popInput.classList.add('api-derived');
    } else {
        document.getElementById('apiWarning').style.display = 'block';
        document.getElementById('populationInput').classList.remove('api-derived');
    }

    // Calculate for each scenario
    allScenarios = {
        bau: calculateScenario(inputs, 'Business as Usual', 0, 0),
        wash: calculateScenario(inputs, 'WASH Only', 0.75, 0),
        ocv: calculateScenario(inputs, 'OCV Only', 0, 0.70),
        combined: calculateScenario(inputs, 'WASH + OCV', 0.75, 0.70),
    };
    
    calculationResults = allScenarios[currentScenario];
    updateResultsDisplay();
}

function calculateScenario(inputs, name, washReduction, ocvCoverage) {
    const years = [];
    const yearlyData = {
        costs: { washCapital: [], washOM: [], ocvCampaigns: [], surveillance: [], caseManagement: [], other: [], total: [] },
        outcomes: { cases: [], deaths: [], casesAverted: [], deathsAverted: [] },
        benefits: {
            emergencyWash: [], emergencyOCV: [], emergencyCM: [],
            choleraProdTime: [], choleraValueLife: [],
            diarrheaTreatment: [], diarrheaProdTime: [], diarrheaValueLife: [],
            washAccessTime: [], funeral: [], tourism: [],
            total: []
        }
    };
    
    let totalCosts = 0;
    let totalBenefits = 0;
    let totalCasesAverted = 0;
    let totalDeathsAverted = 0;
    
    for (let year = 0; year < inputs.duration; year++) {
        years.push(inputs.baseYear + year);
        
        // Calculate population for this year
        const pop = inputs.population * Math.pow(1 + inputs.growthRate, year) * 1000; // Convert back to actual
        
        // WASH implementation ramp-up (linear)
        const washProgress = Math.min(year / (inputs.duration * 0.6), 1) * washReduction;
        
        // OCV implementation ramp-up
        const ocvProgress = ocvCoverage > 0 ? Math.min(year / (inputs.duration * 0.5), 1) * ocvCoverage : 0;
        
        // Calculate costs
        const washCapitalCost = year < inputs.duration * 0.6 ? (pop * washProgress * (inputs.waterTarget * inputs.waterCost + inputs.sanitationTarget * inputs.sanitationCost + inputs.hygieneTarget * inputs.hygieneCost) / 1000) : 0;
        const washOMCost = washCapitalCost * 0.1; // 10% annual O&M
        const ocvCampaignCost = ocvCoverage > 0 ? pop * ocvProgress * inputs.ocvCost / 1000 : 0;
        const surveillanceCost = pop * 0.02; // $0.02 per person per year
        
        
        const yearCost = washCapitalCost + washOMCost + ocvCampaignCost + surveillanceCost;
        totalCosts += yearCost;
        
        // Calculate health outcomes
        // WASH reduces transmission
        const caseReductionFromWash = washProgress * washReduction;
        // OCV provides protection
        const caseReductionFromOCV = ocvProgress * 0.85; // 85% efficacy
        
        // Combined effect (not additive, more conservative)
        const totalCaseReduction = Math.min(caseReductionFromWash + caseReductionFromOCV * (1 - caseReductionFromWash), 0.95);
        
        // Cases and deaths
        const baselineCases = pop * inputs.baseCaseRate;
        const projectedCases = baselineCases * (1 - totalCaseReduction);
        const casesAverted = baselineCases - projectedCases;
        const projectedDeaths = projectedCases * inputs.cfRate;
        const deathsAverted = baselineCases * inputs.cfRate * totalCaseReduction;
        
        // Case management cost
        const cmCost = projectedCases * inputs.caseCost / 1000;
        totalCosts += cmCost;
        // additional per-capita program costs
        const otherCost = pop * inputs.otherCostPerCapita / 1000;
        totalCosts += otherCost;
        
        // Calculate benefits
        // Lives saved benefit  (dollars)
        const lifesSavedBenefit = deathsAverted * inputs.vsl;
        
        // Productivity loss averted (7-day illness)
        const productivityBenefit = casesAverted * inputs.wageLoss * 7;
        
        // Additional benefit streams (user-configurable) – all in dollars
        const emergencyWashAverted = casesAverted * inputs.emergencyWashCost;
        const emergencyOCVAverted = casesAverted * inputs.emergencyOCVCost;
        const emergencyCMAverted = casesAverted * inputs.emergencyCMCost;
        const choleraProdTime = casesAverted * 5;                // workdays saved (val not monetized)
        const choleraValueLife = deathsAverted * inputs.vsl;      // duplicate of lifesSaved
        const diarrheaTreatmentAverted = casesAverted * inputs.diarrheaTreatmentCost;
        const diarrheaProdTime = casesAverted * 3;
        const diarrheaValueLife = deathsAverted * inputs.vsl * 0.5;
        const washAccessTimeSavings = pop * washProgress * 0.5;
        const funeralCostsAvoided = deathsAverted * inputs.funeralCost;
        const tourismBenefit = casesAverted * inputs.tourismBenefit;
        
        // Total benefits sum
        const yearBenefits = lifesSavedBenefit + productivityBenefit + emergencyWashAverted + emergencyOCVAverted + emergencyCMAverted + choleraProdTime + choleraValueLife + diarrheaTreatmentAverted + diarrheaProdTime + diarrheaValueLife + washAccessTimeSavings + funeralCostsAvoided + tourismBenefit;
        totalBenefits += yearBenefits;
        
        // Store yearly data
        yearlyData.costs.washCapital.push(washCapitalCost);
        yearlyData.costs.washOM.push(washOMCost);
        yearlyData.costs.ocvCampaigns.push(ocvCampaignCost);
        yearlyData.costs.surveillance.push(surveillanceCost);
        yearlyData.costs.caseManagement.push(cmCost);
        yearlyData.costs.other.push(otherCost);
        yearlyData.costs.total.push(yearCost + cmCost + otherCost);
        
        yearlyData.outcomes.cases.push(projectedCases);
        yearlyData.outcomes.deaths.push(projectedDeaths);
        yearlyData.outcomes.casesAverted.push(casesAverted);
        yearlyData.outcomes.deathsAverted.push(deathsAverted);
        
        yearlyData.benefits.emergencyWash.push(emergencyWashAverted);
        yearlyData.benefits.emergencyOCV.push(emergencyOCVAverted);
        yearlyData.benefits.emergencyCM.push(emergencyCMAverted);
        yearlyData.benefits.choleraProdTime.push(choleraProdTime);
        yearlyData.benefits.choleraValueLife.push(choleraValueLife);
        yearlyData.benefits.diarrheaTreatment.push(diarrheaTreatmentAverted);
        yearlyData.benefits.diarrheaProdTime.push(diarrheaProdTime);
        yearlyData.benefits.diarrheaValueLife.push(diarrheaValueLife);
        yearlyData.benefits.washAccessTime.push(washAccessTimeSavings);
        yearlyData.benefits.funeral.push(funeralCostsAvoided);
        yearlyData.benefits.tourism.push(tourismBenefit);
        yearlyData.benefits.total.push(yearBenefits);
        
        totalCasesAverted += casesAverted;
        totalDeathsAverted += deathsAverted;
    }
    
    return {
        name: name,
        years: years,
        yearlyData: yearlyData,
        totalCosts: totalCosts,
        totalBenefits: totalBenefits,
        netBenefit: totalBenefits - totalCosts,
        bcRatio: totalCosts > 0 ? totalBenefits / totalCosts : 0,
        casesAverted: totalCasesAverted,
        deathsAverted: totalDeathsAverted,
        dalyAverted: totalCasesAverted * 0.3 + totalDeathsAverted * 35, // Rough DALY estimate
        costPerDALY: (totalCosts > 0 && totalCasesAverted > 0) ? totalCosts / (totalCasesAverted * 0.3 + totalDeathsAverted * 35) : 0
    };
}

function updateResultsDisplay() {
    const scenario = allScenarios[currentScenario];
    
    updateCostsTab(scenario);
    updateOutcomesTab(scenario);
    updateBenefitsTab(scenario);
    updateComparisonTab();
}

function updateCostsTab(scenario) {
    // Show which interventions are active in this scenario
    let interventionLabel = '';
    if (currentScenario === 'bau') {
        interventionLabel = '<span class=\"badge bg-secondary\">No Intervention (BAU)</span>';
    } else if (currentScenario === 'wash') {
        interventionLabel = '<span class=\"badge bg-info\">WASH Only</span>';
    } else if (currentScenario === 'ocv') {
        interventionLabel = '<span class=\"badge bg-warning\">OCV Only</span>';
    } else if (currentScenario === 'combined') {
        interventionLabel = '<span class=\"badge bg-success\">WASH + OCV</span>';
    }
    
    // Update metrics with intervention label
    const costMetricsHTML = `
        <div class="col-md-12 mb-2">
            <small>Intervention: ${interventionLabel}</small>
        </div>
        <div class="col-md-6">
            <div class="metric-card cost">
                <h6>Total Implementation Costs</h6>
                <div class="value">$${formatNumber(scenario.totalCosts)}</div>
                <small>Over ${scenario.years.length} years</small>
            </div>
        </div>
        <div class="col-md-6">
            <div class="metric-card">
                <h6>Annual Average Cost</h6>
                <div class="value">$${formatNumber(scenario.totalCosts / scenario.years.length)}</div>
                <small>Per year</small>
            </div>
        </div>
    `;
    document.getElementById('costMetrics').innerHTML = costMetricsHTML;
    
    // Update chart
    updateCostChart(scenario);
    
    // Build cost table with scenario-aware filtering
    const costData = {};
    
    // Always show surveillance and case management (baseline infrastructure)
    costData['Surveillance'] = scenario.yearlyData.costs.surveillance.reduce((a, b) => a + b, 0);
    costData['Case management (baseline)'] = scenario.yearlyData.costs.caseManagement.reduce((a, b) => a + b, 0);
    costData['Other program costs'] = scenario.yearlyData.costs.other.reduce((a, b) => a + b, 0);
    
    // Show intervention-specific costs only if enabled
    const washCapital = scenario.yearlyData.costs.washCapital.reduce((a, b) => a + b, 0);
    const washOM = scenario.yearlyData.costs.washOM.reduce((a, b) => a + b, 0);
    const ocvCost = scenario.yearlyData.costs.ocvCampaigns.reduce((a, b) => a + b, 0);
    
    if (washCapital > 0 || washOM > 0) {
        costData['WASH capital cost'] = washCapital;
        if (washOM > 0) costData['WASH O&M cost'] = washOM;
    }
    if (ocvCost > 0) {
        costData['OCV campaigns'] = ocvCost;
    }
    
    let tableHTML = '';
    for (const [component, cost] of Object.entries(costData)) {
        const annualAvg = cost / scenario.years.length;
        tableHTML += `
            <tr>
                <td>${component}</td>
                <td class="text-end">$${formatNumber(cost)}</td>
                <td class="text-end">$${formatNumber(annualAvg)}</td>
            </tr>
        `;
    }
    document.getElementById('costTable').querySelector('tbody').innerHTML = tableHTML;
}

function updateOutcomesTab(scenario) {
    // retrieve latest inputs so we can compute baseline values correctly
    const inputs = getInputValues();

    // Show which interventions are active
    let interventionLabel = '';
    if (currentScenario === 'bau') {
        interventionLabel = '<span class=\"badge bg-secondary\">No Intervention (BAU)</span>';
    } else if (currentScenario === 'wash') {
        interventionLabel = '<span class=\"badge bg-info\">WASH Only</span>';
    } else if (currentScenario === 'ocv') {
        interventionLabel = '<span class=\"badge bg-warning\">OCV Only</span>';
    } else if (currentScenario === 'combined') {
        interventionLabel = '<span class=\"badge bg-success\">WASH + OCV</span>';
    }

    // Update metrics
    const totalProjectedCases = scenario.yearlyData.outcomes.cases.reduce((a, b) => a + b, 0);
    const totalProjectedDeaths = scenario.yearlyData.outcomes.deaths.reduce((a, b) => a + b, 0);

    // baseline values include the averted portion
    const baselineCases = totalProjectedCases + scenario.casesAverted;
    const baselineDeaths = totalProjectedDeaths + scenario.deathsAverted;

    const outcomeMetricsHTML = `
        <div class="col-md-12 mb-2">
            <small>Intervention: ${interventionLabel}</small>
        </div>
        <div class="col-md-3">
            <div class="metric-card">
                <h6>Baseline Cases</h6>
                <div class="value">${formatNumber(baselineCases)}</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="metric-card success">
                <h6>Cases Averted</h6>
                <div class="value">${formatNumber(scenario.casesAverted)}</div>
                <small>Compared to BAU</small>
            </div>
        </div>
        <div class="col-md-3">
            <div class="metric-card">
                <h6>Baseline Deaths</h6>
                <div class="value">${formatNumber(baselineDeaths)}</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="metric-card success">
                <h6>Deaths Averted</h6>
                <div class="value">${formatNumber(scenario.deathsAverted)}</div>
                <small>Lives saved</small>
            </div>
        </div>
    `;
    document.getElementById('outcomeMetrics').innerHTML = outcomeMetricsHTML;
    
    // Update chart
    updateOutcomeChart(scenario);
    
    // Update table
    let tableHTML = `
        <tr>
            <td>Cholera Cases (projected)</td>
            <td class="text-end">${formatNumber(totalProjectedCases)}</td>
            <td class="text-end">${formatNumber(scenario.casesAverted)}</td>
        </tr>
        <tr>
            <td>Deaths (projected)</td>
            <td class="text-end">${formatNumber(totalProjectedDeaths)}</td>
            <td class="text-end">${formatNumber(scenario.deathsAverted)}</td>
        </tr>
    `;
    document.getElementById('outcomeTable').querySelector('tbody').innerHTML = tableHTML;
}

function updateBenefitsTab(scenario) {
    // Show which interventions are active
    let interventionLabel = '';
    if (currentScenario === 'bau') {
        interventionLabel = '<span class=\"badge bg-secondary\">No Intervention (BAU)</span>';
    } else if (currentScenario === 'wash') {
        interventionLabel = '<span class=\"badge bg-info\">WASH Only</span>';
    } else if (currentScenario === 'ocv') {
        interventionLabel = '<span class=\"badge bg-warning\">OCV Only</span>';
    } else if (currentScenario === 'combined') {
        interventionLabel = '<span class=\"badge bg-success\">WASH + OCV</span>';
    }
    
    // Update metrics
    const benefitMetricsHTML = `
        <div class="col-md-12 mb-2">
            <small>Intervention: ${interventionLabel}</small>
        </div>
        <div class="col-md-4">
            <div class="metric-card success">
                <h6>Total Benefits</h6>
                <div class="value">$${formatNumber(scenario.totalBenefits)}</div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="metric-card">
                <h6>Net Benefit</h6>
                <div class="value" style="color: ${scenario.netBenefit >= 0 ? 'var(--success-color)' : 'var(--accent-color)'}">
                    $${formatNumber(scenario.netBenefit)}
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="metric-card">
                <h6>B/C Ratio</h6>
                <div class="value">${scenario.bcRatio.toFixed(2)}</div>
                <small>Higher is better</small>
            </div>
        </div>
    `;
    document.getElementById('benefitMetrics').innerHTML = benefitMetricsHTML;
    
    // Update chart
    updateBenefitChart(scenario);
    
    // Update benefit table with expanded categories
    const totals = {
        emergencyWash: scenario.yearlyData.benefits.emergencyWash.reduce((a,b)=>a+b,0),
        emergencyOCV: scenario.yearlyData.benefits.emergencyOCV.reduce((a,b)=>a+b,0),
        emergencyCM: scenario.yearlyData.benefits.emergencyCM.reduce((a,b)=>a+b,0),
        choleraProdTime: scenario.yearlyData.benefits.choleraProdTime.reduce((a,b)=>a+b,0),
        choleraValueLife: scenario.yearlyData.benefits.choleraValueLife.reduce((a,b)=>a+b,0),
        diarrheaTreatment: scenario.yearlyData.benefits.diarrheaTreatment.reduce((a,b)=>a+b,0),
        diarrheaProdTime: scenario.yearlyData.benefits.diarrheaProdTime.reduce((a,b)=>a+b,0),
        diarrheaValueLife: scenario.yearlyData.benefits.diarrheaValueLife.reduce((a,b)=>a+b,0),
        washAccessTime: scenario.yearlyData.benefits.washAccessTime.reduce((a,b)=>a+b,0),
        funeral: scenario.yearlyData.benefits.funeral.reduce((a,b)=>a+b,0),
        tourism: scenario.yearlyData.benefits.tourism.reduce((a,b)=>a+b,0),
    };
    
    let tableHTML = '';
    for (const [name, value] of Object.entries(totals)) {
        const label = name.replace(/([A-Z])/g, ' $1').replace(/^./, s=>s.toUpperCase());
        tableHTML += `
            <tr>
                <td>${label}</td>
                <td class="text-end">$${formatNumber(value)}</td>
                <td class="text-end">${((value / scenario.totalBenefits) * 100).toFixed(1)}%</td>
            </tr>
        `;
    }
    document.getElementById('benefitTable').querySelector('tbody').innerHTML = tableHTML;
    
    // Update summary
    document.getElementById('summaryTotalCost').textContent = `$${formatNumber(scenario.totalCosts)}`;
    document.getElementById('summaryTotalBenefit').textContent = `$${formatNumber(scenario.totalBenefits)}`;
    document.getElementById('summaryNetBenefit').textContent = `$${formatNumber(scenario.netBenefit)}`;
    document.getElementById('summaryBCRatio').textContent = scenario.bcRatio.toFixed(2);
    document.getElementById('summaryDALY').textContent = `$${formatNumber(scenario.costPerDALY)}`;
}

function updateComparisonTab() {
    // Update chart
    updateComparisonChart();
    
    // Update table
    let tableHTML = '';
    for (const [key, scenario] of Object.entries(allScenarios)) {
        tableHTML += `
            <tr>
                <td><strong>${scenario.name}</strong></td>
                <td class="text-end">$${formatNumber(scenario.totalCosts)}</td>
                <td class="text-end">${formatNumber(scenario.casesAverted)}</td>
                <td class="text-end">${formatNumber(scenario.deathsAverted)}</td>
                <td class="text-end" style="color: ${scenario.netBenefit >= 0 ? 'var(--success-color)' : 'var(--accent-color)'}">
                    $${formatNumber(scenario.netBenefit)}
                </td>
                <td class="text-end">${scenario.bcRatio.toFixed(2)}</td>
            </tr>
        `;
    }
    document.getElementById('comparisonTable').querySelector('tbody').innerHTML = tableHTML;
}

function updateCostChart(scenario) {
    const ctx = document.getElementById('costChart').getContext('2d');
    
    if (costChartInstance) costChartInstance.destroy();
    
    costChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: scenario.years.map(y => y.toString()),
            datasets: [
                {
                    label: 'WASH capital',
                    data: scenario.yearlyData.costs.washCapital,
                    backgroundColor: '#3b82f6'
                },
                {
                    label: 'WASH O&M',
                    data: scenario.yearlyData.costs.washOM,
                    backgroundColor: '#8b5cf6'
                },
                {
                    label: 'OCV campaigns',
                    data: scenario.yearlyData.costs.ocvCampaigns,
                    backgroundColor: '#10b981'
                },
                {
                    label: 'Surveillance',
                    data: scenario.yearlyData.costs.surveillance,
                    backgroundColor: '#f59e0b'
                },
                {
                    label: 'Case management',
                    data: scenario.yearlyData.costs.caseManagement,
                    backgroundColor: '#ef4444'
                },
                {
                    label: 'Other programs',
                    data: scenario.yearlyData.costs.other,
                    backgroundColor: '#6b7280'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true },
                y: { stacked: true, title: { display: true, text: 'Cost (USD thousands)' } }
            },
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Annual Costs by Component' }
            }
        }
    });
}

function updateOutcomeChart(scenario) {
    const ctx = document.getElementById('outcomeChart').getContext('2d');
    
    if (outcomeChartInstance) outcomeChartInstance.destroy();
    
    // build baseline series by adding projected + averted
    const projected = scenario.yearlyData.outcomes.cases;
    const averted = scenario.yearlyData.outcomes.casesAverted;
    const baseline = projected.map((p,i) => p + averted[i]);

    outcomeChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: scenario.years.map(y => y.toString()),
            datasets: [
                {
                    label: 'Baseline Cases',
                    data: baseline,
                    borderColor: '#6b7280',
                    borderDash: [5,5],
                    backgroundColor: 'rgba(107,114,128,0.05)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Projected Cases',
                    data: projected,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Cases Averted',
                    data: averted,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Cholera Cases Projection' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function updateBenefitChart(scenario) {
    const ctx = document.getElementById('benefitChart').getContext('2d');
    
    if (benefitChartInstance) benefitChartInstance.destroy();
    
    // choose a few major categories for visualization
    benefitChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: scenario.years.map(y => y.toString()),
            datasets: [
                {
                    label: 'Cholera: Lives Value',
                    data: scenario.yearlyData.benefits.choleraValueLife,
                    backgroundColor: '#10b981'
                },
                {
                    label: 'Cholera: Productivity',
                    data: scenario.yearlyData.benefits.choleraProdTime,
                    backgroundColor: '#3b82f6'
                },
                {
                    label: 'Emergency WASH Saved',
                    data: scenario.yearlyData.benefits.emergencyWash,
                    backgroundColor: '#f59e0b'
                },
                {
                    label: 'Emergency OCV Saved',
                    data: scenario.yearlyData.benefits.emergencyOCV,
                    backgroundColor: '#8b5cf6'
                },
                {
                    label: 'Tourism Benefit',
                    data: scenario.yearlyData.benefits.tourism,
                    backgroundColor: '#ef4444'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true },
                y: { stacked: true }
            },
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Annual Benefits by Category' }
            }
        }
    });
}

function updateComparisonChart() {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    if (comparisonChartInstance) comparisonChartInstance.destroy();
    
    const scenarios = Object.values(allScenarios);
    
    comparisonChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: scenarios.map(s => s.name),
            datasets: [
                {
                    label: 'Total Costs',
                    data: scenarios.map(s => s.totalCosts),
                    backgroundColor: '#ef4444'
                },
                {
                    label: 'Total Benefits',
                    data: scenarios.map(s => s.totalBenefits),
                    backgroundColor: '#10b981'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Scenario Comparison: Costs vs Benefits' }
            }
        }
    });
}

function resetDefaults() {
    document.getElementById('parameterForm').reset();
    calculateAnalysis();
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return Math.round(num).toString();
}
