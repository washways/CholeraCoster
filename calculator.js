// Cholera Cost Calculator - Multi-Country Version
// Loads data from public APIs and performs cost-benefit analysis

// -----------------------------------------------------------------------------
// configuration
// set to false if you want to run the calculator entirely offline (no World Bank
// fetches).  Useful on networks that block localhost:5001 or external proxies.
const ENABLE_API = true;

// If you deploy a Cloudflare Worker proxy, set its base URL here (no trailing slash).
// Example: https://my-wb-proxy.your-domain.workers.dev
const CLOUDFLARE_WB_PROXY = 'https://cholera.washways1.workers.dev';

// In-memory cache for API data (keyed by country code)
let _apiCache = {};

let currentScenario = 'bau';
let calculationResults = {};
let allScenarios = {};
let currentCountry = { code: 'MWI', name: 'Global' };
let _lastCountryData = null; // store latest WB data for mortality toggle

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

        // Store WB data globally for mortality toggle
        _lastCountryData = countryData;

        // --- Auto-derive Population Growth Rate ---
        if (countryData.populationGrowth !== null) {
            const growthInput = document.getElementById('growthRateInput');
            if (!growthInput.dataset.userEdited) {
                growthInput.value = Math.round(countryData.populationGrowth * 10) / 10;
                growthInput.classList.add('calculated-from-wb');
            }
        }

        // --- Dual Mortality Valuation (HCA / VSL) ---
        if (countryData.gdpPerCapita) {
            updateMortalityMethod(); // sets vslInput based on selected method

            // Daily wage loss = GDP per capita / 250 working days
            const dailyWage = Math.round(countryData.gdpPerCapita / 250);
            const wageInput = document.getElementById('wageLossInput');
            if (!wageInput.dataset.userEdited) {
                wageInput.value = Math.max(1, dailyWage);
                wageInput.classList.add('calculated-from-wb');
            }
            document.getElementById('wageLossNote').textContent = `(≈ $${Math.max(1, dailyWage)} = GDPpc ÷ 250 days)`;

            // --- Auto-derive Emergency & Benefit costs from GDP ---
            const gdp = countryData.gdpPerCapita;

            // Emergency WASH response cost (scales with economy)
            const emergWash = Math.max(5, Math.round(gdp * 0.04));
            const ewInput = document.getElementById('emergencyWashCostInput');
            if (!ewInput.dataset.userEdited) { ewInput.value = emergWash; ewInput.classList.add('calculated-from-wb'); }

            // Emergency OCV response cost
            const emergOCV = Math.max(3, Math.round(gdp * 0.03));
            const eoInput = document.getElementById('emergencyOCVCostInput');
            if (!eoInput.dataset.userEdited) { eoInput.value = emergOCV; eoInput.classList.add('calculated-from-wb'); }

            // Emergency Case Management cost
            const emergCM = Math.max(2, Math.round(gdp * 0.02));
            const ecInput = document.getElementById('emergencyCMCostInput');
            if (!ecInput.dataset.userEdited) { ecInput.value = emergCM; ecInput.classList.add('calculated-from-wb'); }

            // Funeral cost (cultural + economic)
            const funeralCost = Math.max(20, Math.round(gdp * 0.15));
            const fcInput = document.getElementById('funeralCostInput');
            if (!fcInput.dataset.userEdited) { fcInput.value = funeralCost; fcInput.classList.add('calculated-from-wb'); }

            // Diarrhea treatment cost (fraction of case management)
            const caseCostVal = parseFloat(document.getElementById('caseCostInput').value) || 150;
            const diarTreat = Math.max(10, Math.round(caseCostVal * 0.33));
            const dtInput = document.getElementById('diarrhealTreatmentCostInput');
            if (!dtInput.dataset.userEdited) { dtInput.value = diarTreat; dtInput.classList.add('calculated-from-wb'); }
        }

        // --- Estimate base case rate from sanitation coverage ---
        const sanitationFieldValue = countryData.safeSanitation;
        if (sanitationFieldValue !== null && sanitationFieldValue !== undefined) {
            const sanitationFraction = sanitationFieldValue / 100;
            const estimatedBaseCaseRate = (0.001 + (1 - sanitationFraction) * 0.003) * 1000;
            const baseCaseInput = document.getElementById('baseCaseRateInput');
            if (!baseCaseInput.dataset.userEdited) {
                baseCaseInput.value = Math.round(estimatedBaseCaseRate * 100) / 100;
                baseCaseInput.classList.add('calculated-from-wb');
            }
            document.getElementById('baseCaseRateNote').textContent = `(estimated from sanitation: ${sanitationFieldValue.toFixed(1)}% coverage)`;
        }

        // --- Estimate Case Fatality Rate from infant mortality ---
        if (countryData.infantMortality !== null) {
            // Higher infant mortality suggests weaker health system → higher CFR
            const estCFR = Math.max(0.5, Math.min(4.0, 0.5 + countryData.infantMortality / 50));
            const cfInput = document.getElementById('cfRateInput');
            if (!cfInput.dataset.userEdited) {
                cfInput.value = Math.round(estCFR * 10) / 10;
                cfInput.classList.add('calculated-from-wb');
            }
        }

        // --- Estimate case management cost from health spending ---
        if (countryData.healthExpenditure !== null && countryData.healthExpenditure !== undefined) {
            const healthSpending = countryData.healthExpenditure;
            const estimatedCaseCost = Math.max(50, Math.min(300, 80 + healthSpending * 20));
            const caseCostInput = document.getElementById('caseCostInput');
            if (!caseCostInput.dataset.userEdited) {
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

async function fetchCountryData(country = 'MWI', year = null) {
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

    // --- Check in-memory cache first ---
    const cacheKey = `${country}_${year || 'latest'}`;
    if (_apiCache[cacheKey]) {
        console.info('Using cached data for', cacheKey);
        return _apiCache[cacheKey];
    }

    // Request multiple WB indicators for comprehensive country profile
    const codes = {
        population: 'SP.POP.TOTL',
        populationGrowth: 'SP.POP.GROW',
        gdpPerCapita: 'NY.GDP.PCAP.CD',
        gdpTotal: 'NY.GDP.MKTP.CD',
        gdpGrowth: 'NY.GDP.MKTP.KD.ZG',
        urbanPopulation: 'SP.URB.TOTL.IN.ZS',
        openDefecation: 'SH.STA.ODFC.ZS',
        safeSanitation: 'SH.STA.SMSS.ZS',
        safeWater: 'SH.H2O.SMDW.ZS',
        healthExpenditure: 'SH.XPD.CHEX.GD.ZS',
        infantMortality: 'SP.DYN.IMRT.IN',
        underFiveMortality: 'SH.DYN.MORT',
        stunting: 'SH.STA.STNT.ZS',
        lifeExpectancy: 'SP.DYN.LE00.IN',
        literacy: 'SE.ADT.LITR.ZS',
        unemploymentRate: 'SL.UEM.TOTL.ZS',
        gini: 'SI.POV.GINI'
    };

    const result = {
        population: 19130000,
        populationGrowth: null,
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
        success: false
    };

    // Fetch with an 8-second AbortController timeout
    async function fetchWithTimeout(url, timeoutMs = 8000) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const resp = await fetch(url, { signal: controller.signal });
            clearTimeout(timer);
            if (resp.ok) return await resp.json();
            return null;
        } catch (err) {
            clearTimeout(timer);
            return null;
        }
    }

    // Try direct WB API first (supports CORS), then proxies as fallback
    async function fetchIndicator(url) {
        // 1. Direct WB API (no proxy needed — WB supports CORS for format=json)
        const directData = await fetchWithTimeout(url);
        if (directData) return directData;

        // 2. Cloudflare Worker proxy
        if (typeof CLOUDFLARE_WB_PROXY === 'string' && CLOUDFLARE_WB_PROXY.trim().length > 0) {
            const cfUrl = CLOUDFLARE_WB_PROXY + '/' + url.replace('https://api.worldbank.org/v2/', '');
            const data = await fetchWithTimeout(cfUrl);
            if (data) return data;
        }
        // 3. Local Flask proxy
        const localProxy = `http://localhost:5001/wb${url.replace('https://api.worldbank.org/v2', '')}`;
        const localData = await fetchWithTimeout(localProxy, 3000);
        if (localData) return localData;
        // 4. Public CORS proxies
        const proxies = [
            (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
            (u) => `https://api.codetabs.com/v1/proxy?url=${encodeURIComponent(u)}`
        ];
        for (const proxyFn of proxies) {
            const data = await fetchWithTimeout(proxyFn(url));
            if (data) return data;
        }
        return null;
    }

    // Build date range: request several years so the API returns the best available
    let dateParam = '';
    if (year) {
        dateParam = `&date=${year - 3}:${year}`;
    } else {
        dateParam = '&date=2019:2025';
    }

    // --- Fetch ALL indicators in PARALLEL ---
    console.time('WB API fetch');
    const entries = Object.entries(codes);
    const promises = entries.map(([key, code]) => {
        const url = `https://api.worldbank.org/v2/country/${country}/indicator/${code}?format=json&per_page=10${dateParam}`;
        return fetchIndicator(url)
            .then(data => ({ key, code, data }))
            .catch(err => ({ key, code, data: null }));
    });

    const results = await Promise.all(promises);
    console.timeEnd('WB API fetch');

    // Parse results — pick the most recent non-null value from each response
    let successCount = 0;
    for (const { key, code, data } of results) {
        try {
            if (!data || !Array.isArray(data) || !data[1] || !Array.isArray(data[1])) continue;
            // data[1] is an array of records sorted by date descending
            for (const record of data[1]) {
                if (record && record.value !== null && record.value !== undefined) {
                    const val = record.value;
                    if (key === 'population') {
                        result.population = parseInt(val) || result.population;
                        result.year = record.date;
                    } else {
                        result[key] = parseFloat(val);
                    }
                    result.success = true;
                    successCount++;
                    console.info(`✓ ${code} = ${val} (year ${record.date})`);
                    break; // take the first (most recent) non-null value
                }
            }
        } catch (err) {
            console.debug(`${code} parse error:`, err.message);
        }
    }

    // Calculate proxy indicators from WB data
    result.proxies = calculateProxyIndicators(result);

    // Only cache if we got a reasonable number of indicators (avoid caching bad partial data)
    if (successCount >= 5 && result.gdpPerCapita !== null) {
        result._ts = Date.now();
        _apiCache[cacheKey] = result;
        console.info(`Cached ${successCount} indicators for ${cacheKey}`);
    } else {
        console.warn(`Only ${successCount} indicators succeeded (GDP: ${result.gdpPerCapita}) — not caching`);
    }

    return result;
}

function calculateProxyIndicators(data) {
    const proxies = {};

    // Healthcare system capacity — use ABSOLUTE per-capita health spending, not just % of GDP
    if (data.healthExpenditure !== null && data.gdpPerCapita !== null) {
        const absHealthSpend = (data.healthExpenditure / 100) * data.gdpPerCapita; // USD per capita
        if (absHealthSpend < 50) proxies.healthCapacity = `Very low ($${absHealthSpend.toFixed(0)}/person/yr)`;
        else if (absHealthSpend < 150) proxies.healthCapacity = `Low ($${absHealthSpend.toFixed(0)}/person/yr)`;
        else if (absHealthSpend < 500) proxies.healthCapacity = `Moderate ($${absHealthSpend.toFixed(0)}/person/yr)`;
        else proxies.healthCapacity = `Well-resourced ($${absHealthSpend.toFixed(0)}/person/yr)`;
    } else if (data.healthExpenditure !== null) {
        // Fallback: % only
        if (data.healthExpenditure < 3) proxies.healthCapacity = 'Low (limited resources)';
        else if (data.healthExpenditure < 6) proxies.healthCapacity = 'Moderate (developing)';
        else proxies.healthCapacity = 'High spending (% GDP) — verify capacity';
    }

    // Urbanization and water/sanitation correlation
    if (data.urbanPopulation !== null) {
        proxies.urbanizationLevel = `${data.urbanPopulation.toFixed(0)}% urban`;
    }

    // Stunting as proxy for underlying malnutrition/WASH quality
    if (data.stunting !== null) {
        if (data.stunting > 30) proxies.nutritionStatus = `Severe stunting (${data.stunting.toFixed(0)}% — food security issue)`;
        else if (data.stunting > 15) proxies.nutritionStatus = `Moderate stunting (${data.stunting.toFixed(0)}%)`;
        else proxies.nutritionStatus = `Good nutrition (${data.stunting.toFixed(0)}% stunting)`;
    }

    // Development level from under-5 mortality
    if (data.underFiveMortality !== null) {
        let level = 'High development';
        if (data.underFiveMortality > 60) level = 'Low development';
        else if (data.underFiveMortality > 25) level = 'Lower-middle development';
        else if (data.underFiveMortality > 10) level = 'Upper-middle development';
        proxies.developmentLevel = `${level} (U5M: ${data.underFiveMortality.toFixed(0)} per 1,000)`;
    }

    // Estimated poverty rate (inverse correlation with GDP per capita and literacy)
    if (data.gdpPerCapita !== null && data.literacy !== null) {
        const povertyProxy = Math.min(80, Math.max(5, 100 - (data.gdpPerCapita / 200) - data.literacy / 3));
        proxies.estimatedPovertyRate = `~${povertyProxy.toFixed(0)}% (estimated from GDP + literacy)`;
    }

    // Healthcare worker availability proxy — use absolute health spending per capita
    if (data.healthExpenditure !== null && data.infantMortality !== null && data.gdpPerCapita !== null) {
        const absSpend = (data.healthExpenditure / 100) * data.gdpPerCapita;
        const workerProxy = absSpend / (data.infantMortality + 1);
        if (workerProxy < 1) proxies.healthWorkerDensity = 'Very low';
        else if (workerProxy < 3) proxies.healthWorkerDensity = 'Low';
        else if (workerProxy < 10) proxies.healthWorkerDensity = 'Moderate';
        else proxies.healthWorkerDensity = 'Adequate';
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

// --- Dual Mortality Valuation ---
// HCA: Human Capital Approach — NPV of lost future GDP contribution
function calculateHCA(gdpPerCapita, lifeExpectancy) {
    if (!gdpPerCapita || !lifeExpectancy) return null;
    const discountRate = 0.03;
    const workingAgeStart = 25;
    const retirementAge = Math.min(lifeExpectancy, 65);
    const workingYears = Math.max(0, Math.round(retirementAge - workingAgeStart));
    let npv = 0;
    for (let t = 0; t < workingYears; t++) {
        npv += gdpPerCapita / Math.pow(1 + discountRate, t);
    }
    return Math.round(npv);
}

// VSL: Value of Statistical Life — willingness-to-pay approach
function calculateVSL(gdpPerCapita) {
    if (!gdpPerCapita) return null;
    // Multiplier scales with income: ~70 for very low-income, ~80 mid, ~100 upper-mid
    const multiplier = gdpPerCapita < 1000 ? 70 : gdpPerCapita < 4000 ? 80 : 100;
    return Math.round(gdpPerCapita * multiplier);
}

// Update UI based on selected mortality method
function updateMortalityMethod() {
    if (!_lastCountryData || !_lastCountryData.gdpPerCapita) return;
    const method = document.querySelector('input[name="mortalityMethod"]:checked')?.value || 'vsl';
    const hcaVal = calculateHCA(_lastCountryData.gdpPerCapita, _lastCountryData.lifeExpectancy);
    const vslVal = calculateVSL(_lastCountryData.gdpPerCapita);
    const vslInput = document.getElementById('vslInput');

    // Show/hide info blocks
    document.getElementById('hcaInfo').style.display = method === 'hca' ? 'block' : 'none';
    document.getElementById('vslInfo').style.display = method === 'vsl' ? 'block' : 'none';

    // Set the value (only if not user-edited)
    if (!vslInput.dataset.userEdited) {
        if (method === 'hca' && hcaVal) {
            vslInput.value = hcaVal;
        } else if (method === 'vsl' && vslVal) {
            vslInput.value = vslVal;
        }
        vslInput.classList.add('calculated-from-wb');
    }

    // Update display labels
    if (hcaVal) document.getElementById('hcaValue').textContent = `HCA = $${hcaVal.toLocaleString()}`;
    if (vslVal) document.getElementById('vslValue').textContent = `VSL = $${vslVal.toLocaleString()}`;

    // Comparison line
    if (hcaVal && vslVal) {
        document.getElementById('mortalityCompare').textContent = `Compare: HCA $${hcaVal.toLocaleString()} vs VSL $${vslVal.toLocaleString()}`;
    }

    const workYears = Math.round(Math.min(_lastCountryData.lifeExpectancy || 60, 65) - 25);
    document.getElementById('vslNote').textContent = method === 'hca'
        ? `(HCA: NPV of ${workYears} working years at $${_lastCountryData.gdpPerCapita.toLocaleString()}/yr, r=3%)`
        : `(VSL: GDPpc × ${_lastCountryData.gdpPerCapita < 1000 ? 70 : _lastCountryData.gdpPerCapita < 4000 ? 80 : 100} = $${vslVal?.toLocaleString()})`;
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

    // Mortality method radio toggle
    document.querySelectorAll('input[name="mortalityMethod"]').forEach(radio => {
        radio.addEventListener('change', () => updateMortalityMethod());
    });

    // Mark fields as user-edited when the user changes them manually
    const autoFields = ['growthRateInput', 'vslInput', 'wageLossInput', 'baseCaseRateInput', 'cfRateInput',
        'caseCostInput', 'emergencyWashCostInput', 'emergencyOCVCostInput', 'emergencyCMCostInput',
        'diarrhealTreatmentCostInput', 'funeralCostInput'];
    autoFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => { el.dataset.userEdited = 'true'; });
    });
}

function getInputValues() {
    return {
        // Demographics
        population: parseFloat(document.getElementById('populationInput').value), // in thousands
        growthRate: parseFloat(document.getElementById('growthRateInput').value) / 100,
        baseYear: parseInt(document.getElementById('baseYearInput').value),
        duration: parseInt(document.getElementById('durationInput').value),
        washRampUp: parseFloat(document.getElementById('washRampUpInput').value) / 100,
        ocvRampUp: parseFloat(document.getElementById('ocvRampUpInput').value) / 100,

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
        populationInput: "Population at risk in cholera hotspots (thousands). Auto-filled: ~15% of total national population from World Bank API.",
        growthRateInput: "Annual population growth rate (%). Auto-filled from WB indicator SP.POP.GROW.",
        baseYearInput: "Start year for projections.",
        durationInput: "Number of years for the roadmap (1–20).",
        washRampUpInput: "Percentage of the project duration allocated for building WASH infrastructure. Capital costs scale over this period; O&M continues indefinitely.",
        ocvRampUpInput: "Percentage of the project duration to reach the full target OCV vaccination coverage.",
        waterTargetInput: "Target percentage of population reached by improved water supply.",
        sanitationTargetInput: "Target percentage covered by sanitation improvements.",
        hygieneTargetInput: "Target percentage of population receiving hygiene promotion.",
        ocvTargetInput: "Target percentage of population vaccinated with oral cholera vaccine.",
        waterCostInput: "Unit cost (USD) per person for water infrastructure.",
        sanitationCostInput: "Unit cost (USD) per person for sanitation infrastructure.",
        hygieneCostInput: "Unit cost (USD) per person for hygiene promotion.",
        ocvCostInput: "Cost (USD) per person for vaccine campaigns (vaccine + delivery).",
        caseCostInput: "Average cost (USD) of treating one cholera case. Auto-derived: $80 base + health spending × 20 (range $50–$300).",
        otherCostInput: "Additional per-capita program costs such as training, monitoring.",
        emergencyWashCostInput: "Emergency WASH response cost per case. Auto-derived: GDPpc × 0.04, scaled to local economy.",
        emergencyOCVCostInput: "Emergency OCV response cost per case. Auto-derived: GDPpc × 0.03.",
        emergencyCMCostInput: "Emergency case management cost per case. Auto-derived: GDPpc × 0.02.",
        diarrhealTreatmentCostInput: "Diarrhea treatment cost avoided per case. Auto-derived: case management cost × 0.33.",
        funeralCostInput: "Funeral cost avoided per death. Auto-derived: GDPpc × 0.15.",
        tourismBenefitInput: "Economic benefit (USD) per case averted from tourism.",
        baseCaseRateInput: "Baseline cholera cases per 1,000 population. Auto-derived from sanitation coverage: 1 + (1 - sanitation%) × 3.",
        cfRateInput: "Case fatality rate (%). Auto-derived from infant mortality: 0.5 + infantMort/50 (range 0.5–4.0%).",
        vslInput: "Mortality value per death. VSL method: GDPpc × income-scaled multiplier (70–100). HCA method: NPV of lost GDP over remaining working years at 3% discount rate.",
        wageLossInput: "Daily wage loss (USD) per case. Auto-derived: GDPpc ÷ 250 working days.",
        countryCodeInput: "ISO3 country code for World Bank API data (e.g., MWI, ETH, MOZ).",
        wbYearInput: "Year of World Bank data to fetch. Falls back up to 3 years if requested year has no data."
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

    // Calculate for each scenario (no API re-fetch — data was loaded at init)
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

        // WASH implementation ramp-up (linear over specified % of duration)
        const rampUpEnd = Math.ceil(inputs.duration * inputs.washRampUp);
        const washProgress = Math.min(year / (rampUpEnd > 0 ? rampUpEnd : 1), 1) * washReduction;

        // OCV implementation ramp-up (linear over specified % of duration)
        const ocvRampEnd = Math.ceil(inputs.duration * inputs.ocvRampUp);
        const ocvProgress = ocvCoverage > 0 ? Math.min(year / (ocvRampEnd > 0 ? ocvRampEnd : 1), 1) * ocvCoverage : 0;

        // Calculate costs
        // WASH capital costs during ramp-up only
        const washCapitalCost = year < rampUpEnd ? (pop * washProgress * (inputs.waterTarget * inputs.waterCost + inputs.sanitationTarget * inputs.sanitationCost + inputs.hygieneTarget * inputs.hygieneCost) / 1000) : 0;
        // O&M continues at full level after capital investment ends (based on peak infrastructure)
        const peakWashProgress = washReduction; // fully ramped-up WASH progress
        const washOMBase = pop * peakWashProgress * (inputs.waterTarget * inputs.waterCost + inputs.sanitationTarget * inputs.sanitationCost + inputs.hygieneTarget * inputs.hygieneCost) / 1000;
        const washOMCost = year < rampUpEnd ? washCapitalCost * 0.1 : washOMBase * 0.1;
        // OCV campaign costs (proportional to target coverage)
        const ocvCampaignCost = ocvCoverage > 0 ? pop * inputs.ocvTarget * ocvProgress * inputs.ocvCost / 1000 : 0;
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

    // Readable label map with tooltip descriptions
    const labelMap = {
        emergencyWash: { label: 'Emergency WASH Response', tip: 'Cost of emergency WASH interventions avoided per cholera case averted' },
        emergencyOCV: { label: 'Emergency OCV Response', tip: 'Cost of reactive OCV campaigns avoided per case averted' },
        emergencyCM: { label: 'Emergency Case Management', tip: 'Emergency case management costs avoided per case averted' },
        choleraProdTime: { label: 'Cholera Productivity Loss', tip: 'Lost wages and economic output during cholera illness episodes' },
        choleraValueLife: { label: 'Cholera Mortality Value', tip: 'Economic value of cholera deaths averted (HCA or VSL method)' },
        diarrheaTreatment: { label: 'Diarrhea Treatment Savings', tip: 'Treatment costs saved from co-reduced diarrheal disease cases' },
        diarrheaProdTime: { label: 'Diarrhea Productivity Loss', tip: 'Lost wages avoided from co-reduced diarrheal episodes' },
        diarrheaValueLife: { label: 'Diarrhea Mortality Value', tip: 'Economic value of diarrheal deaths averted' },
        washAccessTime: { label: 'WASH Access Time Savings', tip: 'Time saved from improved water/sanitation access (valued at daily wage)' },
        funeral: { label: 'Funeral Costs Avoided', tip: 'Funeral and burial expenses avoided per death averted' },
        tourism: { label: 'Tourism Economic Benefit', tip: 'Tourism revenue preserved by reducing cholera outbreak visibility' },
    };

    // Build benefit totals
    const totals = {};
    for (const key of Object.keys(labelMap)) {
        if (scenario.yearlyData.benefits[key]) {
            totals[key] = scenario.yearlyData.benefits[key].reduce((a, b) => a + b, 0);
        } else {
            totals[key] = 0;
        }
    }

    // Store for sorting
    window._benefitTotals = totals;
    window._benefitLabelMap = labelMap;
    window._benefitTotalBenefits = scenario.totalBenefits;

    // Render table (default: by value descending)
    renderBenefitTable('value', 'desc');

    // Attach sort handlers (only once)
    const sortValBtn = document.getElementById('sortByValue');
    const sortPctBtn = document.getElementById('sortByPercent');
    if (sortValBtn && !sortValBtn._bound) {
        sortValBtn._bound = true;
        sortValBtn._dir = 'desc';
        sortValBtn.addEventListener('click', () => {
            sortValBtn._dir = sortValBtn._dir === 'desc' ? 'asc' : 'desc';
            renderBenefitTable('value', sortValBtn._dir);
        });
    }
    if (sortPctBtn && !sortPctBtn._bound) {
        sortPctBtn._bound = true;
        sortPctBtn._dir = 'desc';
        sortPctBtn.addEventListener('click', () => {
            sortPctBtn._dir = sortPctBtn._dir === 'desc' ? 'asc' : 'desc';
            renderBenefitTable('value', sortPctBtn._dir);
        });
    }

    // Update summary
    document.getElementById('summaryTotalCost').textContent = `$${formatNumber(scenario.totalCosts)}`;
    document.getElementById('summaryTotalBenefit').textContent = `$${formatNumber(scenario.totalBenefits)}`;
    document.getElementById('summaryNetBenefit').textContent = `$${formatNumber(scenario.netBenefit)}`;
    document.getElementById('summaryBCRatio').textContent = scenario.bcRatio.toFixed(2);
    document.getElementById('summaryDALY').textContent = `$${formatNumber(scenario.costPerDALY)}`;
}

function renderBenefitTable(sortBy, direction) {
    const totals = window._benefitTotals;
    const labelMap = window._benefitLabelMap;
    const totalBenefits = window._benefitTotalBenefits;
    if (!totals || !labelMap) return;

    // Sort entries
    const entries = Object.entries(totals);
    entries.sort((a, b) => direction === 'desc' ? b[1] - a[1] : a[1] - b[1]);

    let tableHTML = '';
    for (const [key, value] of entries) {
        const info = labelMap[key] || { label: key, tip: '' };
        const pct = totalBenefits > 0 ? ((value / totalBenefits) * 100).toFixed(1) : '0.0';
        tableHTML += `
            <tr title="${info.tip}">
                <td>${info.label}</td>
                <td class="text-end">$${formatNumber(value)}</td>
                <td class="text-end">${pct}%</td>
            </tr>
        `;
    }
    document.getElementById('benefitTable').querySelector('tbody').innerHTML = tableHTML;
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
    const baseline = projected.map((p, i) => p + averted[i]);

    outcomeChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: scenario.years.map(y => y.toString()),
            datasets: [
                {
                    label: 'Baseline Cases',
                    data: baseline,
                    borderColor: '#6b7280',
                    borderDash: [5, 5],
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
