# Quick Start Guide - Malawi Cholera Cost Calculator

## ⚡ 30-Second Setup

### Windows Users
1. Navigate to: `C:\Users\jrobertson\CholeraCoster`
2. Double-click: `run.bat`
3. Browser opens automatically → Ready to use!

### Mac/Linux Users
```bash
cd CholeraCoster
python3 -m http.server 8000
# Open browser to: http://localhost:8000
```

---

## 🎮 Quick Tutorial (2 minutes)

### What You'll See
The calculator has **3 main sections**:

#### Left Panel (INPUT)
- Adjust cholera prevention parameters
- Click "Calculate Analysis"

#### Right Panel (RESULTS)
- 4 tabs: Costs, Outcomes, Benefits, Comparison
- Interactive charts and tables
- Toggle between scenarios using buttons

---

## 📝 5 Typical Use Cases

### Use Case 1: **Strategic Planning**
*Question: "Should we invest in WASH or OCV campaigns?"*

1. Enter realistic cost and population data
2. Compare scenarios in "Comparison" tab
3. Look at Benefit-Cost Ratio
4. Choose highest ratio → best return on investment

### Use Case 2: **Budget Justification**
*Question: "How much should we allocate for cholera prevention?"*

1. Input expected coverage targets
2. View "Costs" tab → Total implementation costs
3. Use in funding proposals
4. Show decision-makers the benefits/cost breakdown

### Use Case 3: **Sensitivity Analysis**
*Question: "How sensitive are results to uncertain costs?"*

1. Calculate baseline scenario
2. Adjust uncertain parameters (+/- 20%)
3. Recalculate
4. Document how results change
5. Repeat for each uncertain variable

### Use Case 4: **Regional Planning**
*Question: "Different impacts for urban vs rural areas?"*

1. Run calculator for urban hotspots
2. Run again for rural hotspots
3. Sum totals in Comparison tab
4. Identify most cost-effective geography

### Use Case 5: **Advocacy**
*Question: "How to communicate impact to government?"*

1. Run combined WASH+OCV scenario
2. Screenshot "Comparison" tab
3. Highlight:
   - Cases averted
   - Deaths prevented
   - Net benefit amount
4. Use in presentations/reports

---

## 📊 Key Output Metrics (What They Mean)

| Metric | What It Shows | Target Value |
|--------|---------------|--------------|
| **Total Costs** | Investment needed | Lower = better for budget |
| **Baseline Cases** | Expected cases without intervention | – |
| **Cases Averted** | Lives improved (difference from baseline) | Higher = more impact |
| **Baseline Deaths** | Expected deaths without intervention | – |
| **Deaths Averted** | Lives saved (difference from baseline) | Higher = better humanitarian outcome |
| **Net Benefit** | Money returned to society | Positive = worthwhile investment |
| **B/C Ratio** | Return per dollar spent | >1.5 = good investment |
| **Cost/DALY** | Health cost-effectiveness | < GDP per capita = justified |

---

## ⚙️ Important Parameters to Verify

Before running analysis, ensure these match Malawi context:

✓ **Population**: Get from local health district  
✓ **Baseline case rate**: Check disease surveillance data  
✓ **Case fatality rate**: Should be 1-3% for cholera  
✓ **Unit costs**: Adjust for local prices  
✓ **Value of Statistical Life**: Use country income guidance  
✓ **World Bank inputs**: Optionally change the country code or data year in the form to refresh population and other indicators  

---

## 💡 Pro Tips

1. **Compare Scenarios**: Use the interactive buttons to quickly switch between WASH-only, OCV-only, and combined approaches

2. **Export Results**: After running the analysis, use the CSV/JSON/Print buttons beneath the form to download or print the results directly. The CSV now begins with a list of all input parameters (parameter,value,description) followed by the scenario summary. Screenshots of charts or copy/paste tables also work.

3. **Scenario Testing**: Change one variable and recalculate to see sensitivity

4. **Share Findings**: Show "Comparison" tab to make the case for specific interventions

---

## 🛠 API Troubleshooting

If the World Bank API is unreachable you’ll see a warning and default values will be used.  You can click the **Test API** button in the input panel to force another call and view the result in the browser console.  The `API status` message above the button also shows success/failure.

- Verify your machine has internet access and that `localhost` is allowed to make outbound HTTPS requests.  A cached copy of the last successful API response will be used automatically if the server cannot be reached; you’ll see “(cached)” appended to the API status message.
- Ensure the country code is a valid ISO3 and the year is one supported by the API (2020–2025 typically).
- Check the browser console for errors such as CORS issues or network timeouts; the test button logs the raw response.
- If you are offline, the calculator will still run using manual inputs.  Simply type the values you need.

The API call itself cannot be fixed from within the calculator; these steps merely help you diagnose connectivity problems.

---

5. **Real-time Updates**: All calculations refresh instantly when you change parameters

6. **Baselines are visible**: The outcomes tab now shows the original case and death totals alongside projected values so you can see absolute and relative impact.

---

## ❓ Frequently Asked Questions

### Q: Where does the population data come from?
**A:** Automatically from World Bank API on first load. You can override with your own estimates.

### Q: Can I download my results?
**A:** Yes - use your browser's print-to-PDF feature, or take screenshots of each tab.

### Q: How accurate are the calculations?
**A:** Based on WHO epidemiological models. Accuracy depends on input data quality. Always validate with local experts.

### Q: Can I modify the Excel file?
**A:** The calculator is HTML/JavaScript based. The Excel file is reference material but not used by the calculator.

### Q: What if some costs are unknown?
**A:** Use regional averages or WHO benchmarks. Run sensitivity analysis by testing ±20% variations.

### Q: Can I compare male vs female outcomes?
**A:** Current version: No, but epidemiological data can be stratified before input.

---

## 🔍 Reading the Charts

### Cost Chart (Stacked Bar)
- **X-axis**: Years of implementation
- **Y-axis**: Cost in USD thousands
- **Colors**: Different intervention types
- **Interpretation**: Shows when costs peak, what drives spending

### Outcome Chart (Line)
- **X-axis**: Years
- **Y-axis**: Number of cases
- **Lines**: Projected vs averted cases
- **Interpretation**: Shows intervention impact over time

### Benefits Chart (Stacked Bar)
- **X-axis**: Years
- **Y-axis**: Benefit value (USD thousands)
- **Interpretation**: Monetary value of health improvement

### Comparison Chart (Grouped Bar)
- **X-axis**: Scenarios
- **Y-axis**: Value (USD thousands)
- **Interpretation**: Relative investment & return across strategies

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| Browser won't load | Check Python server is running; try http://localhost:8000/index.html |
| Charts not showing | Refresh page; check JavaScript enabled in browser |
| Calculations seem wrong | Verify input parameters; consult README for calculation methods |
| Need baseline data | Contact: Malawi Ministry of Health, District Health Office |

---

## 📚 Further Reading

- **WHO Cholera Response**: https://www.who.int/cholera
- **Malawi Health Sector**: Ministry of Health website
- **WASH Data**: WHO/UNICEF Joint Monitoring Programme
- **Economic Data**: World Bank Open Data, IMF statistics

---

## 🎯 Next Steps

1. ✅ Review README.md for detailed methodology
2. ✅ Enter your district/region-specific parameters
3. ✅ Generate baseline scenario
4. ✅ Test each intervention option
5. ✅ Document findings for your team
6. ✅ Use in budget/planning meetings

---

**Support**: For technical questions, consult the README.md for full documentation.

**Good luck with your cholera prevention planning! 🙌**
