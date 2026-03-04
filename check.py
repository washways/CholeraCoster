import requests
for code in ['SP.POP.TOTL','NY.GDP.PCAP.CD','SH.STA.ODFC.ZS','SH.STA.SMSS.ZS','SH.XPD.CHEX.GD.ZS','SH.STA.STNT.ZS']:
    url=f'https://api.worldbank.org/v2/country/MWI/indicator/{code}?format=json&per_page=1'
    r=requests.get(url)
    print(code, r.status_code, r.text[:200])
