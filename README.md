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
- **Population data** is fetched automatically from the World Bank API (indicator `SP.POP.TOTL` for Malawi). When the page loads the `Hotspot Population` field is pre‑filled and highlighted in blue; this cell is marked with the label `API` in the interface. If the API call fails a warning banner appears at the top of the form, defaults are used and the field can be edited manually.  The calculator now caches the last successful API response in your browser so a previous result can be reused when offline or when the API is temporarily unreachable (the status line will show “cached”).
- All other inputs are provided by the user, but the structure allows you to replace any input with values from other public APIs by following the same pattern used for population.

### Calculation Flow
1. **Populate Inputs**: User-defined parameters (growth rate, unit costs, coverage targets, health rates) are read from the form. The population field may also be pre-populated via API and is visually distinguished.

> **Note**: earlier versions of the calculator applied an erroneous "/1000" factor to the benefit formulas, which made all benefit streams artificially small.  That bug has been corrected – benefits are now calculated in the same USD units as costs, so the **Benefit‑Cost Ratio** correctly reflects the investment return.
2. **Scenario Definitions**: Four scenarios are automatically created:
   - **BAU** (no intervention)
   - **WASH** (water/sanitation/hygiene only)
   - **OCV** (vaccine only)
   - **Combined** (both WASH and OCV)
3. **Yearly Loop**: For each year in the selected roadmap duration, the model:
   - Projects the population using the annual growth rate.
   - Calculates intervention coverage progress (linear ramp-up).
   - Computes a more detailed cost structure:
     * WASH capital costs (water, sanitation, hygiene infrastructure)
     * WASH O&M costs (assumed 10% of capital annually)
     * OCV campaign costs
     * Surveillance costs (default $0.02 per person per year)
     * Case management costs (based on projected cases)
   - Estimates baseline cholera cases using the `baseCaseRate` and applies reductions from WASH and OCV using conservative interaction formulas.
   - Derives cases averted and deaths averted using the case fatality rate.
   - Calculates multiple benefit streams, including:
     * Emergency WASH/OCV/CM costs saved
     * Value of lives saved and productivity time gained
     * Averted diarrhea treatment/productivity/case-value
     * WASH access time savings
     * Funeral costs avoided and tourism benefits
   - Assigns a monetary value to these benefits and aggregates them.
4. **Aggregation**: Totals and averages are summed across years so that each scenario returns a comprehensive result object containing:
   - Total costs broken down by component
   - Total and yearly cases/deaths projected and averted
   - Total economic benefits, net benefit, B/C ratio, DALYs averted, and cost per DALY

Additional cost/benefit categories mirror the list you requested and appear in the Results tables and charts.

**API Data Sources Section Update**

At the top of this file we now note which World Bank indicators are pulled automatically:

- Population (SP.POP.TOTL)
- GDP per capita (NY.GDP.PCAP.CD)
- Open defecation (% of population) (SH.STA.ODFC.ZS)
- Safely managed sanitation (% of population) (SH.STA.SMSS.ZS)
- Health expenditure (% of GDP) (SH.XPD.CHEX.GD.ZS)
- Stunting prevalence (% of children) (SH.STA.STNT.ZS)

The fetched GDP per capita is used to suggest a default VSL; you can override by entering your own.

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
- **Annual Growth Rate**: Population growth percentage (typical for Malawi: 2.8%)
- **Base Year**: Starting year for projections
- **Roadmap Duration**: How many years to project (typically 10 years)

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
The calculator uses a **value of statistical life (VSL)** input to convert deaths averted into dollars.  This is the most common approach in cost‑benefit work, but users may prefer alternative methods:

* **GDP‑per‑capita multiple** – set VSL equal to 20–30× national GDP per capita (a rule‑of‑thumb used by some agencies).
* **Human‑capital approach** – estimate the present value of lost lifetime earnings: `[annual wage] × [remaining life expectancy]`.
* **DALY conversion** – assign a monetary value per disability‑adjusted life year and compute `deathsAverted × years lost × valuePerDALY`.
* **Willingness‑to‑pay surveys** – use locally derived survey results where available.

Any of these approaches can be plugged into the `vslInput` field; the tooltip explains the alternatives.

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
