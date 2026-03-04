# Malawi Cholera Cost Calculator

A comprehensive, interactive web-based tool for analyzing the costs and benefits of cholera prevention interventions in Malawi.

## Features

### 📊 **Interactive Analysis**
- Real-time cost-benefit calculations
- Multiple intervention scenarios (WASH, OCV, Combined)
- Comparison across different strategies
- Dynamic visualization with interactive charts

### 🌍 **Data Integration**
- Automatic population data from World Bank APIs
- Currency conversions and economic indicators
- Based on WHO and CDC epidemiological data

### 📈 **Comprehensive Metrics**
- Investment costs breakdown (WASH, vaccines, case management, other program costs)
- Health outcomes (cases prevented, deaths averted)
- Economic benefits (value of lives saved, productivity gains)
- Cost-benefit ratios and return on investment
- Cost per DALY averted (health economic metric)

### 🎯 **Four Intervention Scenarios**
1. **Business as Usual (BAU)**: No new interventions, baseline disease burden
2. **WASH Only**: Water, sanitation, and hygiene improvements
3. **OCV Only**: Oral Cholera Vaccine campaigns
4. **WASH + OCV**: Combined intervention strategy

## How the Calculator Works

This section describes the internal mechanics of the calculator so you can fully understand and trust its outputs.

### Data Sources & API-derived Values
- **Population data** is fetched automatically from the World Bank API. When the page loads, the `Hotspot Population` field and multiple other parameters are pre‑filled and highlighted dynamically.
- **Auto-Derived Parameters**: To accelerate analysis, the calculator estimates several inputs if World Bank data is available (all can be manually overridden):
  - **Population Growth Rate**: Direct from WB indicator `SP.POP.GROW`.
  - **Case Fatality Rate (CFR)**: Scaled based on infant mortality (a proxy for health system capacity).
  - **Emergency WASH & Case Management Costs**: Estimated as a fraction of GDP per capita.
  - **Funeral Costs**: Estimated at 15% of GDP per capita.
  - **Daily Wage Loss**: Estimated as GDP per capita ÷ 250 working days.

**World Bank Indicators Pulled Automatically:**
- Population (SP.POP.TOTL) & Growth Rate (SP.POP.GROW)
- GDP per capita (NY.GDP.PCAP.CD)
- Open defecation (% of population) (SH.STA.ODFC.ZS)
- Safely managed sanitation (% of population) (SH.STA.SMSS.ZS)
- Health expenditure (% of GDP) (SH.XPD.CHEX.GD.ZS)
- Stunting prevalence (% of children) (SH.STA.STNT.ZS)
- Infant mortality (SP.DYN.IMRT.IN)
- Literacy rate (SE.ADT.LITR.ZS)
- Urban population (SP.URB.TOTL.IN.ZS)

These values are stored globally and drive the **Estimated Indicators** panel (Health System Capacity, Development Level, Disease Environment, etc.).

These values are stored in the `malawiData` object and can be used to extend the model if needed.
5. **Display**: The results are rendered in the UI tabs and charts. The **Outcomes tab now includes baseline case/death totals as well as projected values**, making it easier to see the absolute impact of each intervention. Changing a parameter or scenario triggers a recalculation in the browser; no server communication is required.

### Formula Highlights
- **Population Projection:** `P_year = P_base * (1 + growthRate) ^ year`
- **Intervention Ramp-up:** Linear over roughly 60% of the roadmap period, reaching target coverage
- **Case Reduction:** Combined effect = `washImpact + ocvImpact * (1 - washImpact)` capped at 95%
- **Baseline Cases:** `baselineCases = population * baseCaseRate`
- **Projected Cases:** `projectedCases = baselineCases * (1 - totalCaseReduction)`
- **Deaths:** `projectedDeaths = projectedCases * cfRate`
- **Case Management Cost:** `cmCost = projectedCases * caseCost`
- **Value of Life Saved:** `deathsAverted * vsl`
- **Productivity Benefit:** `casesAverted * wageLoss * 7` (seven-day illness assumption)

Because all computations occur in JavaScript, you can inspect or modify them directly in `calculator.js`.

### Extending the Model
- To add an API-derived field, fetch the data during `initializeCalculator()` and then mark the input element with the CSS class `api-derived`.  Use a `<span class="badge bg-info">API</span>` next to the label to indicate its source.
- To introduce new cost components or health outcomes, extend the loop in `calculateScenario()` and update the chart/table rendering functions accordingly.

---

## Getting Started

### Requirements
- Windows, macOS, or Linux
- Python 3.x (built-in HTTP server)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for API data and external libraries)

### Installation

1. **Extract Files**
   - Ensure all files are in the same directory:
     - `index.html` - Main web interface
     - `calculator.js` - Calculation engine
     - `run.bat` - Launcher script

2. **Run the Calculator**
   
   **Windows:**
   ```bash
   run.bat
   ```
   
   **macOS/Linux:**
   ```bash
   python3 -m http.server 8000
   # Then open: http://localhost:8000
   ```

3. The application will:
   - Start a local web server
   - Automatically open in your default browser
   - Load Malawi population data from World Bank API

### Alternative: Direct Browser Access
- Simply open `index.html` in your web browser (may have limited API access)

## Usage Guide

### Step 1: Input Base Parameters

#### World Bank Data Source (optional)
- **Country Code**: ISO3 code (defaults to `MWI` for Malawi). A dropdown list of common Eastern African codes is provided, but you may type any valid ISO3 code.
- **WB Data Year**: Select the year of World Bank indicators (default `2025`). The API will return the closest available year if the exact value is not present.


#### Demographics
- **Hotspot Population**: Population at risk in cholera-affected areas (in thousands)
- **Annual Growth Rate**: Population growth percentage (auto-filled from WB API)
- **Base Year**: Starting year for projections
- **Roadmap Duration**: Overall project length (typically 10-20 years)
- **WASH Capital Ramp-Up (%)**: Percentage of the project duration allocated to completing WASH infrastructure. Capital costs scale over this period; O&M continues indefinitely.
- **OCV Campaign Ramp-Up (%)**: Percentage of project duration to reach full OCV target coverage.

#### WASH Intervention Targets
- **Water Coverage Target**: % of population with access to improved water supply
- **Sanitation Coverage Target**: % with access to improved sanitation
- **Hygiene Promotion Target**: % reached with hygiene behavior change

#### OCV Parameters
- **OCV Coverage Target**: % of population vaccinated in campaigns

#### Unit Costs (in USD)
- Costs based on Sub-Saharan Africa averages, adjustable for Malawi:
  - **Water Supply**: $45/capita (infrastructure development)
  - **Sanitation**: $35/capita (improved latrines/facilities)
  - **Hygiene Promotion**: $8/capita (behavior change campaigns)
  - **OCV Campaign**: $3.50/person (vaccine + delivery)
  - **Case Management**: $150/case (treatment, hospitalization)

#### Health Parameters
- **Base Cholera Case Rate**: Cases per 1,000 per year (baseline scenario)
- **Case Fatality Rate**: % of cases that result in death (1-3% typical)
- **Value of Statistical Life**: Monetary value of preventing one death
- **Daily Wage Loss**: Economic loss per case (missed workdays)

### Step 2: Calculate Analysis
- Click **"Calculate Analysis"** button
- The tool computes costs and benefits for all scenarios
- Generates visual charts and summary tables

### Step 3: Review Results

> **Export / Print:** Use the buttons below the form to download results as CSV (includes a parameter summary at the top) or JSON, or to print a formatted report.


#### Costs Tab
- Breakdown of intervention costs by component
- Annual cost projections
- Case management costs included

#### Health Outcomes Tab
- Baseline and projected cases and deaths
- Cases and deaths averted due to the intervention
- Timeline of intervention impact

#### Benefits Tab
- Value of lives saved
- Productivity gains
- Net benefit (Total benefits - Total costs)
- Benefit-Cost Ratio (higher = better ROI)
- Cost per DALY (lower = more cost-effective)

#### Comparison Tab
- Side-by-side comparison of all scenarios
- Identify most cost-effective strategy
- ROI analysis

### Step 4: Scenario Comparison
- Toggle between scenarios using scenario buttons
- Each button shows specific intervention strategy
- Compare metrics across different approaches

## Key Calculations

### Cost Calculation
```
Total Cost = Implementation Cost + Case Management Cost

Implementation Cost = 
  + Water infrastructure × population × coverage target
  + Sanitation infrastructure × population × coverage target
  + Hygiene promotion × population × coverage target
  + OCV campaigns × population × coverage target

Case Management Cost = Cases × unit cost per case
```

### Health Impact
```
Cases Averted = Baseline Cases × (Reduction from WASH + Reduction from OCV)

Deaths Averted = Cases Averted × Case Fatality Rate
```

#### Valuing Mortality
The calculator offers a **dual mortality valuation method**, controlled via a UI toggle:

1. **HCA (Human Capital Approach):** The net present value (NPV) of lost future economic contribution.
   * *Formula:* `Σ (GDPpc / (1+r)^t)`, where `r=3%` discount rate over the remaining working years (assuming working age up to 65).
   * *Profile:* More conservative, closely tied to pure economic output.
2. **VSL (Value of Statistical Life):** Based on societal willingness-to-pay to reduce mortality risk.
   * *Formula:* `GDPpc × Multiplier`, where the multiplier scales dynamically between 70–100 depending on the country's income classification (e.g., extremely low income uses 70x).
   * *Profile:* Standard welfare-economics approach capturing intrinsic life value; generates higher benefits.

You can seamlessly switch between these methods; the calculator dynamically restates impact figures based on local WB GDP data.

### Economic Benefits
```
Total Benefits = Value of Lives Saved + Productivity Losses Averted + Other Streams

Value of Lives Saved = Deaths Averted × Value of Statistical Life

Productivity Losses Averted = Cases Averted × Average Illness Duration × Daily Wage

Other Streams include estimated savings from emergency WASH/OCV/CM responses, avoided diarrhea treatment and lost workdays, WASH access time savings, funeral costs avoided, tourism benefits, and similar ancillary effects.
```

### Key Metrics
```
Net Benefit = Total Benefits - Total Costs

Benefit-Cost Ratio = Total Benefits / Total Costs

Cost per DALY = Total Costs / DALY Averted
  (DALY = Disability-Adjusted Life Year)
```

## Customization

### Adjusting for Regional Variation
- **Urban/Rural Split**: Modify population distribution in base inputs
- **Local Costs**: Update unit costs based on local procurement data
- **Effectiveness Factors**: Adjust disease impact based on local epidemiology
- **Economic Data**: Update VSL and wage loss based on national income data

### Data Sources
- **Population**: World Bank (API) – the CSV export now records the value used.
- **Unit Costs**: WHO, World Health Statistics
- **Health Parameters**: CDC, WHO guidance on cholera
- **Economic Data**: International Labour Organization data

## Interpreting Results

### Good Indicators for an Intervention
- ✅ Benefit-Cost Ratio > 1.0 (benefits exceed costs)
- ✅ Net Benefit is positive (net gain to society)
- ✅ Cost per DALY < GDP per capita (WHO threshold)
- ✅ High cases/deaths averted relative to investment

### Limitation Notices
- Projections assume linear scale-up of interventions
- Excludes indirect costs (health system strengthening)
- Simplified epidemiological model
- Does not account for intervention degradation over time
- Assumes sustained funding and implementation

## Data Sources & Attribution

- **Population Data**: World Bank API (Open Data)
- **Epidemiological Models**: Adapted from WHO GTFCC guidelines
- **Cost Data**: WASH sector benchmarks, WHO procurement data
- **Economic Parameters**: ILO, national income statistics

## Technical Details

### Architecture
- **Frontend**: HTML5, CSS3, Bootstrap 5
- **Charts**: Chart.js
- **API**: World Bank Open Data API
- **Calculations**: Pure JavaScript (no backend required)
- **Deployment**: Static HTML/JavaScript (runs locally)

### Browser Compatibility
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Any modern browser with ES6 support

### Performance
- Instant calculations with < 100KB total file size
- Works offline after initial data load
- No database or server required

## Troubleshooting

### Issue: "Could not load external data"

If your office firewall blocks localhost or external proxies, you can disable
World Bank queries entirely.  Open `calculator.js` and set
`const ENABLE_API = false;` near the top of the file.  The app will then skip
the proxy logic and simply show the parameter form with default/blank values.
This is the simplest way to run in a locked‑down network; you can still type in
your own numbers.

### Deploying a Cloudflare Worker proxy

If you host the site on GitHub Pages and want automatic World Bank lookups, deploy the included Cloudflare Worker proxy. The worker forwards requests to the World Bank API and adds `Access-Control-Allow-Origin: *` so browsers can fetch the data.

Steps summary:

1. Install Wrangler: `npm install -g wrangler`
2. Authenticate: `wrangler login`
3. From the `cloudflare_worker` folder, run `wrangler publish`
4. Copy the Worker URL and paste it into `calculator.js` as `CLOUDFLARE_WB_PROXY`

See `cloudflare_worker/README.md` for full details.

- **Solution**: Calculator defaults to standard values. You can manually input Malawi-specific data.
- Check internet connection for API access

### Issue: Charts not displaying
- **Solution**: Ensure JavaScript is enabled in browser
- Try refreshing the page (Ctrl+R)
- Check browser console for errors (F12)

### Issue: API returns empty data or you see "Tracking Prevention blocked" messages
- **Solution**: Some privacy/anti‑tracking features (e.g. in Edge or Safari) will block `localStorage` or the World Bank API request. Temporarily disable tracking protection for `localhost` or open the calculator in a different browser. Check the browser console for details; cached values will be used automatically if available.
- **Note**: The World Bank typically publishes development indicators with a 2‑3 year lag. If you select year 2025, the calculator automatically tries 2024, 2023, 2022 in sequence until it finds data. Check the "Data Year" line in the API Data panel to see what year was actually retrieved.

### Issue: Numbers seem unrealistic
- **Solution**: Verify input parameters match your context
- Consult WHO/local health ministry for realistic rates
- Check calculation assumptions match your scenario

## Future Enhancements

- Multi-country comparison module
- Uncertainty analysis and sensitivity testing
- Monte Carlo simulation for probabilistic outcomes
- GIS mapping of intervention zones
- Integration with national health data systems
- Adaptation pathways for climate resilience
- Gender-disaggregated impact analysis

## Support & Contact

For questions about calculations or methodology:
- Refer to: WHO Cholera Response Framework (2017)
- WASH & Health: WHO/UNICEF Joint Monitoring Programme
- Request methodology documentation

## License & Attribution

This calculator implements the methodology from the Malawi Investment Plan for Cholera Prevention and Control.
Based on Excel model: "Unprotected MALAWI INVESTMENT TOOL 2026.xlsx"

**Please attribute this tool in any reports or presentations:**
> Malawi Cholera Cost Calculator (2026) - Interactive Planning Tool

## Disclaimer

This tool is provided for planning and analysis purposes. 
- Results are estimates based on input parameters
- Actual costs and outcomes will vary with implementation
- Use WHO guidelines for validation
- Consult epidemiologists for parameter verification
- Always conduct sensitivity analysis for key assumptions

---

**Last Updated**: March 2026
**Version**: 1.0
**Data Source**: World Bank, WHO, CDC
