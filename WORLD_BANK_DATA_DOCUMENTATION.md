# World Bank Data Integration & Proxy Calculations

## Overview

The calculator now integrates **16 World Bank indicators** and derives **6 proxy metrics** to provide comprehensive country context for cholera cost-benefit analysis.

## Data Sources

### Primary Source: World Bank Open Data API
All primary indicators fetched from: https://data.worldbank.org/

**Data Availability Note:** WB typically has 2-3 year lag. Calculator automatically tries current year, then previous 3 years.

---

## Indicators Fetched (16 Total)

### Demographics
| Indicator | Code | Source | Notes |
|-----------|------|--------|-------|
| Total Population | SP.POP.TOTL | WB | Most recent available |
| Urbanization % | SP.URB.TOTL.IN.ZS | WB | Urban vs rural distribution |

### Economic
| Indicator | Code | Source | Notes |
|-----------|------|--------|-------|
| GDP per capita (USD) | NY.GDP.PCAP.CD | WB | Used to calculate VSL |
| Total GDP (USD) | NY.GDP.MKTP.CD | WB | For scale of economy |
| GDP Growth (%) | NY.GDP.MKTP.KD.ZG | WB | Economic trend |
| Unemployment (%) | SL.UEM.TOTL.ZS | WB | Labor market health |

### Water, Sanitation & Hygiene (WASH)
| Indicator | Code | Source | Notes |
|-----------|------|--------|-------|
| Safe Water Access (%) | SH.H2O.SMDW.ZS | WB | WHO/UNICEF JMP estimate |
| Safely Managed Sanitation (%) | SH.STA.SMSS.ZS | WB | Complete chain from toilet to disposal |
| Open Defecation (%) | SH.STA.ODFC.ZS | WB | Major cholera risk factor |

### Health & Mortality
| Indicator | Code | Source | Notes |
|-----------|------|--------|-------|
| Health Spending (% GDP) | SH.XPD.CHEX.GD.ZS | WB | Healthcare system investment |
| Life Expectancy (years) | SP.DYN.LE00.IN | WB | Overall health outcomes |
| Infant Mortality (per 1,000) | SP.DYN.IMRT.IN | WB | Early childhood survival |
| Under-5 Mortality (per 1,000) | SP.DYN.CDRT.IN | WB | Child health indicator |
| Child Stunting (%) | SH.STA.STNT.ZS | WB | Malnutrition proxy |

### Inequality & Development
| Indicator | Code | Source | Notes |
|-----------|------|--------|-------|
| Gini Coefficient | SI.POV.GINI | WB | Income inequality measure (0–100) |
| Adult Literacy (%) | SE.ADT.LITR.ZS | WB | Education level |

---

## Proxy Calculations (Estimated Indicators)

### 1. **Health System Capacity**
**Formula:** Based on health spending as % GDP

```
If Health Spending < 3% GDP    → "Low (limited resources)"
If Health Spending 3-6% GDP    → "Moderate (developing)"
If Health Spending > 6% GDP    → "High (well-resourced)"
```

**Why:** Countries with higher health budgets typically have:
- Better-trained health workers
- More diagnostic equipment
- Faster case response times
- Higher treatment costs

**Used for:** Estimating case management costs; benchmarking surveillance capacity

---

### 2. **Nutrition Status**
**Formula:** Based on child stunting %

```
If Stunting > 30%  → "Severe stunting (food security issue)"
If Stunting 15-30% → "Moderate stunting (nutrition concern)"
If Stunting < 15%  → "Good nutrition status"
```

**Why:** Stunting indicates:
- Chronic malnutrition in children
- Poor water quality & sanitation
- Weak health service uptake
- Population vulnerability to infectious disease

**Used for:** Assessing underlying vulnerabilities to severe cholera outcomes

---

### 3. **Development Level**
**Formula:** Based on under-5 mortality

```
"Under-5 mortality: [X] per 1,000 (development proxy)"
```

**Why:** U5M is composite indicator of:
- Healthcare system quality
- Maternal/child health services
- Household income & nutrition
- Overall development stage

**Used for:** General context; assumption validation

---

### 4. **Disease Environment Risk**
**Formula:** Combined stunting + open defecation

```
Risk Score = (Stunting% / 30) + (Open Defecation% / 50)

If Risk > 1.5    → "High-risk environment"
If Risk 0.8-1.5  → "Moderate-risk environment"
If Risk < 0.8    → "Lower-risk environment"
```

**Why:** These two factors directly correlate with:
- Diarrheal disease burden
- Cholera transmission risk
- Effectiveness of WASH improvements
- Baseline case incidence

**Used for:** Validating cholera baseline case rate assumption

---

### 5. **Health Worker Density**
**Formula:** Derived from health spending × mortality ratio

```
Capacity = (Health Spending% × 1000) / (Infant Mortality + 1)

If Capacity < 50     → "Very low" (critical shortage)
If Capacity 50-100   → "Low to moderate"
If Capacity > 100    → "Moderate to high"
```

**Why:** Captures:
- Health budget per mortality point (efficiency)
- Relative healthcare worker availability
- System's ability to handle disease outbreaks

**Used for:** Assessing surveillance & case management response capacity

---

### 6. **Estimated Poverty Rate**
**Formula:** Inverse relationship with GDP per capita + literacy

```
Poverty% = MIN(80, MAX(5, 100 - (GDP/capita / 200) - (Literacy / 3)))
```

**Example:** 
- GDP = $522/capita → contributes to high poverty
- Literacy = 65% → contributes to high poverty
- Result: ~70% estimated poverty rate

**Why:** In low-income countries:
- GDP per capita < $1000 strongly correlates with poverty > 50%
- Lower literacy = fewer job opportunities = higher poverty
- Poverty correlates with poor WASH, malnutrition, disease

**Used for:** Context; understanding vulnerability to cholera; baseline burden estimation

**Note:** This is a ROUGH APPROXIMATION. For policy decisions, use actual poverty survey data from National Statistical Office.

---

## Interpretation Guide

### Green "Estimated Indicators" Section
Shows **derived metrics** calculated by combining multiple WB data points with epidemiological relationships.

**Example Reading:**
```
Health system capacity: Moderate (developing) 
  → Health spending is 5.2% GDP
  → Suggests capable but resource-constrained system
  → Factor in modest case management costs (~$150-200)

Disease environment: High-risk environment
  → Stunting = 37%, Open defecation = 15%
  → Suggests strong need for WASH intervention
  → Higher baseline cholera risk expected
```

### When Indicators Show "-"
Means that World Bank data not available for that country in requested year range.
- Calculator falls back to defaults
- You can enter manual estimates based on:
  - National Ministry of Health reports
  - WHO country health profiles
  - Recent surveys (DHS, MICS, etc.)

---

## Data Quality Notes

### Year Lag
- WB publishes data with 2-3 year delay
- Example: Using 2024 data in March 2026 is typical
- Calculator automatically tries current year → previous 3 years

### Coverage Gaps
Some countries may not report all 16 indicators
- Common missing: Gini, literacy (some countries)
- Showing "-" is expected in many developing nations

### Measurement Variation
Different organizations may have different estimates for same indicator
- WB: "Safe water" = any improved source
- WHO/UNICEF JMP: More rigorous "safely managed" standard
- For WASH: Use most conservative estimate for planning

---

## How to Override or Update Data

### For Expert Judgment
All values pulled into parameter fields as:
- **Blue** (API-derived) = directly from WB
- **Green** (Calculated) = derived from WB data

You can type over any value with local/expert data:
- Changes turn field white (manual entry)
- Recalculate → uses your values instead

### Example Workflow
1. See "Health system capacity: Moderate"
2. But you know your district has only 3 health workers for 100,000 people
3. Change "Case Management Cost" from green $210 to white $80
4. Recalculate → uses your local reality

---

## Additional Resources

### For Manual Data Entry
- **Demographic:** National Statistical Office census data
- **Health:** Ministry of Health annual reports
- **WASH:** Community WASH surveys; UNICEF WASH platform
- **Economic:** National accounts; IMF World Economic Outlook

### International Data Portals
- World Bank Data: https://data.worldbank.org/
- WHO Global Health Observatory: https://www.who.int/data/gho
- World Health Survey: https://www.who.int/data/world-health-survey
- DHS Program: https://www.dhsprogram.com/ (Demographic & Health Surveys)
- UNICEF Data: https://data.unicef.org/ (Demographics, mortality, WASH)

### Cholera-Specific
- WHO Cholera Guidelines: https://www.who.int/cholera/prevention
- CDC Cholera Data: https://www.cdc.gov/cholera/response/index.html

---

## Technical Notes

### API Failure Handling
If World Bank API unavailable or data missing:
- Green calculated fields still show estimates based on available data
- Where data can't be calculated, shows "-"
- Defaults in comments help users estimate

### Data Refresh
Panel updates automatically when:
- Country selected changes
- "Calculate Analysis" button clicked
- "Test API" button clicked

All data cached in browser (localStorage) after first fetch to improve responsiveness.

---

## Summary Table

| Category | # Indicators | Data Source | Proxy Calculations |
|----------|-------------|-------------|-------------------|
| Demographics | 2 | WB | Urbanization level |
| Economic | 4 | WB | Poverty estimate |
| WASH | 3 | WB | Disease risk score |
| Health | 6 | WB | System capacity, health worker density |
| Inequality | 1 | WB | - |
| **Total** | **16** | **World Bank** | **6 derived metrics** |

**Result:** Comprehensive 16-indicator country profile → 6 contextual insights → Better parameter assumptions
