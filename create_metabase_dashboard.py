#!/usr/bin/env python3
"""
Script to create Monthly Statistics Dashboard in Metabase.
Run this after getting the session token from Metabase.
Usage: python3 create_metabase_dashboard.py <SESSION_TOKEN>
"""
import sys
import json
import urllib.request
import urllib.error

if len(sys.argv) < 2:
    print("Usage: python3 create_metabase_dashboard.py <SESSION_TOKEN>")
    print("\nHow to get your session token:")
    print("1. Open Metabase at http://localhost:33001")
    print("2. Open DevTools (F12) > Network tab")
    print("3. Login to Metabase")
    print("4. Find the 'session' POST request, copy the 'id' from the response")
    sys.exit(1)

TOKEN = sys.argv[1]
BASE = "http://localhost:33001/api"
HEADERS = {"Content-Type": "application/json", "X-Metabase-Session": TOKEN}

def api(method, path, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"ERROR {e.code} on {method} {path}: {e.read().decode()}")
        return None

# 1. Find the climate_monitoring database
print("Step 1: Finding climate_monitoring database...")
dbs = api("GET", "/database")
db_id = None
for db in (dbs.get("data") or []):
    if "climate" in db.get("name","").lower() or "postgres" in db.get("engine","").lower():
        db_id = db["id"]
        print(f"  Found DB: {db['name']} (id={db_id})")
        break

if not db_id:
    print("  Database not connected to Metabase yet!")
    print("  Please connect PostgreSQL first:")
    print("  Settings > Databases > Add Database")
    print("  Host: postgres, Port: 5432, DB: climate_monitoring")
    print("  User: postgres, Password: postgrespassword")
    sys.exit(1)

# 2. Get climate_observations table id
print("\nStep 2: Finding climate_observations table...")
tables = api("GET", f"/database/{db_id}/tables")
table_id = None
for t in (tables or []):
    if t.get("name") == "climate_observations":
        table_id = t["id"]
        print(f"  Found table id: {table_id}")
        break

if not table_id:
    print("  Table not found. Syncing database...")
    api("POST", f"/database/{db_id}/sync_schema")
    import time; time.sleep(5)
    tables = api("GET", f"/database/{db_id}/tables")
    for t in (tables or []):
        if t.get("name") == "climate_observations":
            table_id = t["id"]
            print(f"  Found table id after sync: {table_id}")
            break

# 3. Create Monthly Stats Dashboard
print("\nStep 3: Creating dashboard...")
dash = api("POST", "/dashboard", {
    "name": "📊 Statistik Klimatologi Bulanan 2025",
    "description": "Rata-rata dan Total setiap parameter iklim per bulan — Stasiun Meteorologi Tunggul Wulung (96805)"
})
if not dash:
    print("  Failed to create dashboard"); sys.exit(1)
dash_id = dash["id"]
print(f"  Dashboard created! id={dash_id}")

# 4. Create Questions (native SQL queries)
questions_config = [
    {
        "name": "Total Curah Hujan per Bulan (mm)",
        "sql": """SELECT TO_CHAR(observed_at,'Mon YYYY') as "Bulan", 
                         TO_CHAR(observed_at,'YYYY-MM') as month_sort,
                         ROUND(SUM(rainfall_mm)::numeric,1) as "Total Hujan (mm)"
                  FROM climate_observations
                  GROUP BY TO_CHAR(observed_at,'Mon YYYY'), TO_CHAR(observed_at,'YYYY-MM')
                  ORDER BY month_sort""",
        "display": "bar",
        "viz": {"graph.dimensions":["Bulan"],"graph.metrics":["Total Hujan (mm)"],"graph.colors":["#3b82f6"]}
    },
    {
        "name": "Rata-rata Suhu per Bulan (°C)",
        "sql": """SELECT TO_CHAR(observed_at,'Mon YYYY') as "Bulan",
                         TO_CHAR(observed_at,'YYYY-MM') as month_sort,
                         ROUND(AVG(temp_max)::numeric,2) as "T-Max (°C)",
                         ROUND(AVG(temp_avg)::numeric,2) as "T-Avg (°C)",
                         ROUND(AVG(temp_min)::numeric,2) as "T-Min (°C)"
                  FROM climate_observations
                  GROUP BY TO_CHAR(observed_at,'Mon YYYY'), TO_CHAR(observed_at,'YYYY-MM')
                  ORDER BY month_sort""",
        "display": "line",
        "viz": {"graph.dimensions":["Bulan"],"graph.metrics":["T-Max (°C)","T-Avg (°C)","T-Min (°C)"]}
    },
    {
        "name": "Rata-rata Kelembapan per Bulan (%)",
        "sql": """SELECT TO_CHAR(observed_at,'Mon YYYY') as "Bulan",
                         TO_CHAR(observed_at,'YYYY-MM') as month_sort,
                         ROUND(AVG(humidity_avg)::numeric,1) as "RH Avg (%)",
                         ROUND(AVG(humidity_0700)::numeric,1) as "RH 07:00 (%)",
                         ROUND(AVG(humidity_1300)::numeric,1) as "RH 13:00 (%)"
                  FROM climate_observations
                  GROUP BY TO_CHAR(observed_at,'Mon YYYY'), TO_CHAR(observed_at,'YYYY-MM')
                  ORDER BY month_sort""",
        "display": "line",
        "viz": {"graph.dimensions":["Bulan"],"graph.metrics":["RH Avg (%)","RH 07:00 (%)","RH 13:00 (%)"]}
    },
    {
        "name": "Total Penyinaran Matahari per Bulan (jam)",
        "sql": """SELECT TO_CHAR(observed_at,'Mon YYYY') as "Bulan",
                         TO_CHAR(observed_at,'YYYY-MM') as month_sort,
                         ROUND(SUM(sunshine_hours)::numeric,1) as "Penyinaran (jam)"
                  FROM climate_observations
                  GROUP BY TO_CHAR(observed_at,'Mon YYYY'), TO_CHAR(observed_at,'YYYY-MM')
                  ORDER BY month_sort""",
        "display": "bar",
        "viz": {"graph.dimensions":["Bulan"],"graph.metrics":["Penyinaran (jam)"],"graph.colors":["#f59e0b"]}
    },
    {
        "name": "Rata-rata Kecepatan Angin per Bulan",
        "sql": """SELECT TO_CHAR(observed_at,'Mon YYYY') as "Bulan",
                         TO_CHAR(observed_at,'YYYY-MM') as month_sort,
                         ROUND(AVG(wind_avg_kmh)::numeric,2) as "Angin Avg (km/h)",
                         ROUND(AVG(wind_max_knot)::numeric,1) as "Angin Max (knot)"
                  FROM climate_observations
                  GROUP BY TO_CHAR(observed_at,'Mon YYYY'), TO_CHAR(observed_at,'YYYY-MM')
                  ORDER BY month_sort""",
        "display": "line",
        "viz": {"graph.dimensions":["Bulan"],"graph.metrics":["Angin Avg (km/h)","Angin Max (knot)"]}
    },
    {
        "name": "Tabel Statistik Lengkap per Bulan",
        "sql": """SELECT TO_CHAR(observed_at,'Mon YYYY') as "Bulan",
                         COUNT(*) as "Jml Hari",
                         ROUND(SUM(rainfall_mm)::numeric,1) as "Σ Hujan (mm)",
                         ROUND(AVG(rainfall_mm)::numeric,2) as "Avg Hujan/hari",
                         ROUND(AVG(temp_max)::numeric,2) as "Avg T-Max",
                         ROUND(AVG(temp_avg)::numeric,2) as "Avg T-Avg",
                         ROUND(AVG(temp_min)::numeric,2) as "Avg T-Min",
                         ROUND(AVG(humidity_avg)::numeric,1) as "Avg RH (%)",
                         ROUND(SUM(sunshine_hours)::numeric,1) as "Σ Penyinaran (jam)",
                         ROUND(AVG(wind_avg_kmh)::numeric,2) as "Avg Angin (km/h)",
                         SUM(CASE WHEN qc_flag>0 THEN 1 ELSE 0 END) as "Hari Warning"
                  FROM climate_observations
                  GROUP BY TO_CHAR(observed_at,'Mon YYYY'), TO_CHAR(observed_at,'YYYY-MM')
                  ORDER BY TO_CHAR(observed_at,'YYYY-MM')""",
        "display": "table",
        "viz": {}
    }
]

card_ids = []
for i, q in enumerate(questions_config):
    print(f"\nStep {i+4}: Creating question '{q['name']}'...")
    card = api("POST", "/card", {
        "name": q["name"],
        "dataset_query": {
            "type": "native",
            "native": {"query": q["sql"]},
            "database": db_id
        },
        "display": q["display"],
        "visualization_settings": q["viz"],
        "collection_id": None
    })
    if card:
        card_ids.append(card["id"])
        print(f"  Created card id={card['id']}")
    else:
        print(f"  Failed to create card!")

# 5. Add cards to dashboard
print("\nStep 10: Adding cards to dashboard...")
col = 0
row = 0
for i, card_id in enumerate(card_ids):
    size_x = 12 if i == len(card_ids)-1 else 12  # table full width, others half
    size_y = 8 if questions_config[i]["display"] == "table" else 6
    
    # Alternate positions
    if i % 2 == 0:
        col = 0
        if i > 0: row += 6
    else:
        col = 12
    
    if questions_config[i]["display"] == "table":
        col = 0
        row += 6
        size_x = 24
    
    api("POST", f"/dashboard/{dash_id}/cards", {
        "cardId": card_id,
        "col": col,
        "row": row,
        "size_x": size_x,
        "size_y": size_y
    })
    print(f"  Added card {i+1}/{len(card_ids)} at col={col}, row={row}")

print(f"\n✅ DONE! Dashboard created successfully!")
print(f"   Open: http://localhost:33001/dashboard/{dash_id}")
print(f"   Or via Tailscale: http://100.75.253.114:33001/dashboard/{dash_id}")
