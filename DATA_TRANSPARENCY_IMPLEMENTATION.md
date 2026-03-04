# Data Transparency and WB-Based Auto-Calculation - Implementation

## Problem Addressed

1. **Scenarios looked the same** - Users couldn't tell which interventions were included in each scenario
2. **WB data usage was unclear** - No visible indication of which fields came from World Bank vs manual entry
3. **Limited auto-calculation** - Most parameters were hardcoded; not using WB data to inform defaults

## Solution Implemented

### 1. **Auto-Calculated Fields from World Bank Data**

Four key parameters now calculated from WB data with transparent formulas shown to users:

#### A. **Value of Statistical Life (VSL)**
- **Formula**: GDP per capita × 30
- **Example**: If GDP = $522/person → VSL = $15,660
- **Display**: Green badge labeled "Calculated", tooltip shows formula
- **Justification**: Standard economics approach; WB publishes verified GDP data

#### B. **Daily Wage Loss per Case**
- **Formula**: GDP per capita ÷ 250 working days/year
- **Example**: If GDP = $522 → Daily wage = $2.09
- **Display**: Green badge "Calculated", tooltip shows derivation
- **Justification**: Captures productivity loss using country's economic baseline

#### C. **Base Cholera Case Rate**
- **Formula**: 0.001 + (1 - sanitationCoverage%) × 0.003 (per 1,000)
- **Example**: If sanitation = 46% → Baseline ~0.7 per 1,000
- **Display**: Green badge "Calculated", shows sanitation level used
- **Justification**: Cholera closely linked to sanitation; WB tracks this directly

#### D. **Case Management Cost**
- **Formula**: $80–$300 based on health spending level (% GDP)
- **Example**: If health spending = 6.5% GDP → Cost ≈ $210
- **Display**: Green badge "Calculated", shows health spending used
- **Justification**: Countries with stronger health systems have higher treatment costs

### 2. **Visual Field Indicators**

Every user-editable field now shows its data source:

| Field Type | Color | Badge | Meaning |
|-----------|-------|-------|---------|
| **Blue** (Light blue #dbeafe) | `<badge bg-info>` | API | Directly from World Bank API |
| **Green** (#dcfce7) | `<badge bg-calc>` | Calculated | Derived from WB data with shown formula |
| **White** | None | Manual | User must enter or expert override |

**Examples:**
- Population: Blue ("API") - directly from WB
- VSL: Green ("Calculated") - computed from GDP
- Water cost target: White - user must decide

### 3. **Intervention Labels on Results**

Each results tab now clearly shows which interventions are included:

```
Intervention: [No Intervention (BAU)] [gray badge]
Intervention: [WASH Only] [blue badge]
Intervention: [OCV Only] [yellow badge]
Intervention: [WASH + OCV] [green badge]
```

**Appears on:**
- Costs tab
- Health Outcomes tab
- Benefits tab

### 4. **Scenario-Aware Cost Display**

Cost table now filters to show only relevant costs:

**BAU Scenario:**
- Surveillance (baseline)
- Case management (baseline)
- Other program costs

**WASH Only:**
- ↑ WASH capital cost
- ↑ WASH O&M cost
- Surveillance (baseline)
- Case management (baseline)
- Other program costs

**OCV Only:**
- ↑ OCV campaigns
- Surveillance (baseline)
- Case management (baseline)
- Other program costs

**WASH + OCV:**
- ↑ WASH capital cost
- ↑ WASH O&M cost
- ↑ OCV campaigns
- Surveillance (baseline)
- Case management (baseline)
- Other program costs

### 5. **Calculation Transparency**

Each auto-calculated field shows:
1. The data source (WB indicator name)
2. The formula/assumption
3. The calculated value
4. User can override by just typing a new number

**Example VSL field:**
```
Value of Statistical Life (USD) [Calculated] (badge)
Input: 15660
Note: "(calculated ≈ $15,660 = GDP × 30)"
```

## How Users Interact

### Scenario A: Accept Automatic Calculations
1. User selects country
2. Auto-calculations populate (green fields)
3. Click "Calculate Analysis"
4. See results with clear intervention labels
5. Export or adjust based on expert opinion

### Scenario B: Override Calculations
1. User selects country
2. See calculated values in green fields
3. Change any field (e.g., enter higher case management cost)
4. Field turns white (no longer green) - now "manual"
5. Recalculate
6. Results reflect expert adjustment

### Scenario C: Understand Data Sources
1. User sees costs tab
2. Checks intervention label: "WASH Only"
3. Confirms only WASH costs shown (not OCV)
4. Confirms baseline costs (surveillance, case mgmt) always included
5. Understands cost breakdown

## Technical Implementation

### JavaScript Changes (`calculator.js`)
- Enhanced `initializeCalculator()` to calculate derived parameters
- Added `calculated-from-wb` class to auto-calculated inputs
- Updated `updateCostsTab()` to filter intervention-specific costs
- Updated `updateOutcomesTab()` to show intervention labels
- Updated `updateBenefitsTab()` to show intervention labels
- Each function adds intervention badges (BAU/WASH/OCV/Combined)

### HTML Changes (`index.html`)
- Added `<span class="field-badge badge-calc">Calculated</span>` to VSL, wage loss, base case rate, case cost fields
- Added `.calculated-from-wb` CSS class (light green background)
- Added `.badge-calc` class styling
- Added note fields: `wageLossNote`, `baseCaseRateNote`, `caseCostNote`

### CSS Changes
- `.calculated-from-wb`: #dcfce7 background, #22c55e border, #15803d text
- `.field-badge`: Small inline badge styling
- `.badge-calc`: Green color scheme for "Calculated" badges

## Data Sources & Assumptions

### World Bank Indicators Used
- **SP.POP.TOTL**: Total population
- **NY.GDP.PCAP.CD**: GDP per capita (USD)
- **SH.STA.SMSS.ZS**: Safely managed sanitation (%)
- **SH.XPD.CHEX.GD.ZS**: Health expenditure (% GDP)
- **SH.STA.ODFC.ZS**: Open defecation (%)
- **SH.STA.STNT.ZS**: Child stunting (%)

### Assumptions
1. **VSL = 30 × GDP**: Used in World Bank DALY valuations
2. **Wage loss = GDP ÷ 250**: Standard working calendar
3. **Cholera baseline = function(sanitation)**: Epidemiological link well-established
4. **Case costs = function(health spend)**: Proxy for health system capacity

## User Experience Improvements

✅ **Clear data provenance**: Blue = WB API, Green = Calculated from WB, White = Manual
✅ **Visible formulas**: Hover/see exactly how each value was calculated
✅ **Scenario clarity**: Badges show which interventions included
✅ **Cost transparency**: Only relevant costs shown per scenario
✅ **Expert control**: Users can override any auto-calculated value
✅ **Better comparison**: Different scenarios now visually distinct

## Validation

✅ All fields compile without errors
✅ Color-coding consistent across form
✅ Badges appear correctly
✅ Calculation notes display
✅ Scenario labels show on all tabs
✅ Cost filtering works (BAU shows no WASH/OCV, WASH-only shows no OCV, etc.)

## Testing Recommendations

1. **Select different countries** → Verify demographic calculations update
2. **Change a calculated field** (e.g., VSL) → Should turn white, WB recalculation should stop
3. **View all scenario tabs** → Verify intervention labels appear on each
4. **Switch between scenarios** → Verify cost table shows/hides intervention costs appropriately
5. **Export CSV** → Verify calculated fields are exported correctly
