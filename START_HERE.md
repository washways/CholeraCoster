# 📋 Cholera Cost Calculator - Multi-Country Version

## 🚀 START HERE

### I just downloaded this - what do I do?

> 💡 *This calculator works for any country. Select your country from the dropdown at the top. Input fields highlighted in blue are automatically populated from World Bank APIs. You can overwrite them if desired.*

**Windows users:** Double-click `run.bat` and skip to "Using the Calculator" section.

**Mac/Linux users:** 
```bash
cd CholeraCoster
python3 -m http.server 8000
# Open: http://localhost:8000
```

> 🛠 **Important:** the calculator fetches data from the World Bank API and your browser needs a CORS proxy. A small Python server is included to handle this.
> 
> Start it in a separate terminal before loading the page:
> ```bash
> cd CholeraCoster
> python wb_proxy.py
> ```
> It will listen on `http://localhost:5001` and automatically add the necessary CORS headers. If you forget, the app will still work using public proxies (slower/less reliable), but many office networks block them.
>
> **Firewall/Tracking issues:** Some corporate firewalls or browser tracking‑prevention features block both the local proxy port and external proxy services. If data fails to load, try one or more of the following:
> 1. Allow `localhost:5001` (and `localhost:8000`) in your firewall or antivirus.
> 2. Disable tracking prevention for `http://localhost:8000` (Edge/Chrome settings).
> 3. Run the proxy on a different port and update `calculator.js` accordingly.
> 4. As a last resort, enter values manually in the blue fields.
>
> **Simplest offline option:** edit `calculator.js` and set `ENABLE_API = false` at the top. That bypasses all network calls and lets you use the tool entirely offline.

## Optional: Deploying a Cloudflare Worker proxy (recommended for GitHub Pages)

If you want the calculator to automatically fetch World Bank data when hosted on GitHub Pages or other static hosting, deploy the included Cloudflare Worker proxy and set its URL in `calculator.js`.

Quick steps:

1. Install Wrangler:

```bash
npm install -g wrangler
```

2. Login to Cloudflare:

```bash
wrangler login
```

3. Deploy the worker:

```bash
cd cloudflare_worker
wrangler publish
# take note of the worker URL printed by wrangler
```

4. Edit `calculator.js` and set `CLOUDFLARE_WB_PROXY` to the worker URL (no trailing slash):

```js
const CLOUDFLARE_WB_PROXY = 'https://wb-proxy-worker.example.workers.dev'
```

5. Commit and push your site to GitHub Pages. The site will now request World Bank data via the Cloudflare Worker (which adds the required CORS headers).

If you prefer the Cloudflare dashboard UI, open the Workers page, create a new Worker, paste the `cloudflare_worker/worker.js` content, save and deploy; copy the Worker URL into `calculator.js`.



---

## 🌍 Selecting a Country

**The calculator works for any country!**

1. **See the dropdown at the top** with country names (country selector in the header)
2. **Select your country** from the list (19 countries included: Malawi, Kenya, Uganda, Tanzania, Zimbabwe, Rwanda, Zambia, Burundi, Mozambique, South Africa, Ethiopia, Sudan, DRC, Nigeria, Ghana, Bangladesh, India, Yemen, Haiti)
3. **Wait for data to load** — a loading spinner will appear while fetching World Bank data
4. **Data automatically updates** — population, GDP, sanitation coverage, and health spending are populated
5. **Continue with parameters** — adjust costs and assumptions as needed for your country

---

## 📚 Documentation Map

### For Different Users

```
👱 "I have 5 minutes"
   └→ Read: QUICK_START.md
      (2-minute overview + FAQ)

👔 "I'm a manager/decision maker"
   └→ Read: IMPLEMENTATION_SUMMARY.md §1-3
      (What it does, outputs, use cases)

🔬 "I need full details"
   └→ Read: README.md (complete)
      (Calculations, data sources, methodology)

⚙️ "I want to customize it"
   └→ Look at: calculator.js + README.md
      (See "Customization" section)

❓ "Something's not working"
   └→ Check: README.md § Troubleshooting
      + QUICK_START.md § FAQ
```

---

## 📂 Files in This Folder

| File | Purpose | Read Time |
|------|---------|-----------|
| **index.html** | Main calculator interface | - (run it!) |
| **calculator.js** | Calculation engine | Reference only |
| **run.bat** | Windows launcher | Click it! |
| **QUICK_START.md** | ← Start here (fastest path) | 3 min |
| **IMPLEMENTATION_SUMMARY.md** | What's been built, features | 5 min |
| **README.md** | Complete documentation | 15 min |
| **This file** | Navigation guide | 2 min |
| Unprotected MALAWI INVESTMENT TOOL 2026.xlsx | Reference/background | (for reference) |

---

## 🎯 Quick Navigation

### Want to...

**"Run the calculator"**
- Windows: Double-click `run.bat`
- Mac/Linux: `python3 -m http.server 8000`
- → Browser opens automatically

**"Understand the calculations"**
- Read: README.md § "Key Calculations"
- Shows: Cost formulas, health impact model

**"Learn about parameters"**
- Read: README.md § "Understanding Results"
- Shows: What each input means
- Value: Interpretation guide

**"See example outputs"**
- Read: IMPLEMENTATION_SUMMARY.md § "Output Example"
- Shows: What results look like
- Includes: Sample numbers

**"Find specific parameter definitions"**
- Search README.md for the term
- Or check QUICK_START.md § "Key Output Metrics"

**"Fix a problem"**
- Check README.md § "Troubleshooting" (problems + solutions)
- Or QUICK_START.md § "FAQ" (common questions)

**"Customize for my region"**
- Read: README.md § "Customization"
- Update parameters in left panel
- Run analysis

**"Get data for my district"**
- Read: README.md § "Data Sources"
- Contact: Ministry of Health/Local health office
- Update fields + Recalculate

**"Present results"**
- Take screenshots of each tab
- Use browser print function (Ctrl+P) to PDF
- Or copy tables into PowerPoint

**"Learn the methodology"**
- Read: README.md § "Technical Details"
- See: Calculation section
- Also: "Data Sources & Attribution"

**"Understand cost-benefit economics"**
- Read: IMPLEMENTATION_SUMMARY.md § "Output Example"
- Then: README.md § "Interpreting Results"

---

## ✅ Getting Started Checklist

- [ ] Opened calculator in web browser
- [ ] Saw four parameter input categories on left
- [ ] Clicked "Calculate Analysis" button
- [ ] Saw tabs appear on right (Costs, Outcomes, Benefits, Comparison)
- [ ] Toggled between scenario buttons
- [ ] Reviewed interactive charts
- [ ] Read one output metric explanation

**If you checked all boxes: You're ready to use the calculator! 🎉**

---

## 🎓 Learning Path by Role

### For Policy Decision Makers
1. Read: IMPLEMENTATION_SUMMARY.md (5 min)
2. Run: Calculator with default values (2 min)
3. Check: "Comparison" tab → B/C Ratio & Net Benefit (1 min)
4. Decide: Which scenario to pursue
5. Skip: Technical details

### For Health/Planning Professionals
1. Read: QUICK_START.md (5 min)
2. Read: README.md § Parameters (10 min)
3. Update: Parameters with district data (10 min)
4. Run: Analysis (1 min)
5. Export: Results to Excel/PowerPoint (5 min)

### For Research/Technical Staff
1. Read: All documentation (30 min)
2. Study: README.md § "Key Calculations" (10 min)
3. Examine: calculator.js source code (15 min)
4. Run: Sensitivity analysis (20 min)
5. Document: Findings & assumptions (30 min)

---

## 🌐 Online Resources

### Related Tools & Data
- **World Bank Data**: https://data.worldbank.org (demography)
- **WHO Cholera Portal**: https://www.who.int/cholera (guidance)
- **CDC Cholera**: https://www.cdc.gov/cholera (epidemiology)
- **ILO Data**: https://www.ilo.org (economic data)

### Country-Specific
- **Malawi Ministry of Health**: [official website]
- **UNICEF Malawi**: [WASH data, coordinates]
- **National Statistical Office**: [demographic data]

---

## 🆘 Help & Support

### Common Questions

**Q: How do I update parameters?**
A: Everything on the left side is editable. Change any field → Click "Calculate Analysis"

**Q: Can I save my analysis?**
A: Use browser print (Ctrl+P) → Save as PDF, or take screenshots

**Q: What if API doesn't load?**
A: Calculator uses default values. You can still enter your own data.

**Q: Is this based on scientific research?**
A: Yes - WHO methodologies. See README.md § "Data Sources"

**Q: Can I share this with colleagues?**
A: Yes! Send the entire "CholeraCoster" folder. They can run locally.

### More help
- Check README.md § "Troubleshooting" (detailed solutions)
- Review QUICK_START.md § "FAQ" (common issues)

---

## 🎯 Recommended First Steps

### 1️⃣ **Immediate** (Do this now)
- Open calculator in browser
- Review default parameters
- Click "Calculate Analysis"
- Examine "Comparison" tab

### 2️⃣ **This Week** (Do this in next few days)
- Read QUICK_START.md
- Update parameters for your district
- Run all 4 scenarios
- Compare results

### 3️⃣ **This Month** (Do this within a week)
- Document your findings
- Prepare a summary slide
- Share with team
- Use in planning meeting

---

## 📋 Checklist: Before You Present Results

- [ ] Verified all input parameters are realistic
- [ ] Run sensitivity analysis (try ±20% on key costs)
- [ ] Compared all 4 scenarios
- [ ] Documented your assumptions
- [ ] Reviewed "Interpretation Results" section
- [ ] Highlighted key findings (B/C ratio, cases averted, etc.)
- [ ] Prepared simple visual summary
- [ ] Noted limitations and disclaimers
- [ ] Referenced WHO/health ministry guidelines
- [ ] Ready to discuss methodology with questions

---

## 🗂️ How Files Relate

```
User wants to...        →  Read this file           →  Section
────────────────────    ──────────────────────    ────────────────
Understand what tool does   IMPLEMENTATION_SUMMARY    § 1-3
Use it immediately         QUICK_START                § 0-1  
Learn full details         README                     All
Fix a problem              README                     § Troubleshooting
Customize it               README                     § Customization
Validate methodology       README                     § Key Calculations
Plan next steps            IMPLEMENTATION_SUMMARY    § § "Next Steps"
Present results            QUICK_START                § "Use Cases"
Understand outputs         IMPLEMENTATION_SUMMARY    § "Output Example"
Check parameter meanings   README                     § "Usage Guide"
```

---

## 💡 Pro Tips

1. **Start Simple**: Use default parameters first before customizing
2. **Document Assumptions**: Write down why you changed each parameter
3. **Run Twice**: Calculate baseline, then test your scenario
4. **Screenshot Everything**: Capture key charts for presentations
5. **Share Findings**: Use "Comparison" tab for executive summaries
6. **Test Sensitivity**: Change uncertain costs ±20% and recalculate
7. **Ask Questions**: Consult health ministry for realistic rates

---

## 🎯 Success Criteria

You'll know you're using it successfully when:

✅ You can calculate results in <3 minutes  
✅ You understand what each tab shows  
✅ You can interpret B/C ratio and net benefit  
✅ You've compared multiple scenarios  
✅ You can explain findings to non-technical audience  
✅ You've used it to influence a decision  

---

## 🚦 Next Action

| Your Situation | Do This |
|---|---|
| **Haven't opened it yet** | Double-click run.bat (or run Python server) |
| **Opened but overwhelmed** | Read QUICK_START.md (5 min), then start over |
| **Tried once, have questions** | Check README.md § "Troubleshooting" |
| **Getting results** | Review IMPLEMENTATION_SUMMARY.md § "Output Example" |
| **Ready to use it seriously** | Update with your district data, run analysis |
| **Ready to present** | Screenshot key findings from "Comparison" tab |

---

## 📞 Questions?

**"How does it calculate costs?"**
→ README.md § "Key Calculations"

**"What do the output metrics mean?"**
→ IMPLEMENTATION_SUMMARY.md § "Output Example"

**"How do I adjust for my region?"**
→ README.md § "Customization"

**"Something's broken"**
→ README.md § "Troubleshooting"

**"How do I cite this?"**
→ README.md § "License & Attribution"

---

## 🎉 You're All Set!

```
📁 Folder: CholeraCoster
├── 🟢 Click: run.bat (Windows)
├── 🟢 Or: python3 -m http.server 8000 (Mac/Linux)
├── 📖 Read: QUICK_START.md (this week)
└── 📊 Use: Calculate your analysis!
```

**Any questions? Check the appropriate file above. Everything you need is documented.**

**Happy analyzing! 🚀**

---

*Last Updated: March 2026*  
*Version: 1.0*  
*Status: Ready to Use* ✅
