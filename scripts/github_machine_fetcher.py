#!/usr/bin/env python3
"""
GITHUB MACHINE: AUTOMATED SATELLITE & SENSOR DATA FETCHER
Proyek: WebGIS & Early Warning System Longsor Jawa Barat
Fungsi: Menarik data publik real-time (BMKG, Open-Meteo, RainViewer) secara berkala via GitHub Actions.
"""

import os
import json
import urllib.request
from datetime import datetime

# Koordinat Stasiun Pemantauan Kunci Jawa Barat (Pusat Rawan Longsor & Sesar)
MONITORING_STATIONS = {
    "Cianjur (Cugenang)": {"lat": -6.82, "lng": 107.10},
    "Sukabumi (Cikembar)": {"lat": -6.98, "lng": 106.85},
    "Bandung Barat (Lembang)": {"lat": -6.82, "lng": 107.61},
    "Kab. Bandung (Kertasari)": {"lat": -7.19, "lng": 107.67},
    "Garut (Pasirwangi)": {"lat": -7.22, "lng": 107.75},
    "Sumedang (Tanjungsari)": {"lat": -6.85, "lng": 107.82},
    "Bogor (Puncak Lereng)": {"lat": -6.70, "lng": 106.98}
}

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "Documents", "WebGIS", "jabar-landslide", "public", "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def fetch_json(url, timeout=10):
    try:
        req = urllib.request.Request(
            url, 
            headers={"User-Agent": "GitHub-Machine-Jabar-EWS/1.0"}
        )
        with urllib.request.urlopen(req, timeout=timeout) as response:
            if response.status == 200:
                return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"[-] Gagal fetch {url}: {e}")
    return None

def fetch_bmkg_gempa():
    print("[*] Menarik data gempa bumi terkini dari BMKG...")
    url = "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json"
    data = fetch_json(url)
    if data and "Infogempa" in data:
        gempa = data["Infogempa"]["gempa"]
        print(f"[+] Gempa Terkini BMKG: M {gempa.get('Magnitude')} di {gempa.get('Wilayah')}")
        return gempa
    return None

def fetch_himawari_status():
    print("[*] Memeriksa ketersediaan citra satelit cuaca Himawari-9 BMKG...")
    products = {
        "EH": "https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_EH_Indonesia.png",
        "RP": "https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_RP_Indonesia.png",
        "NC": "https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_NC_Indonesia.png"
    }
    status_results = {}
    for code, url in products.items():
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "GitHub-Machine-Jabar-EWS/1.0"}, method="HEAD")
            with urllib.request.urlopen(req, timeout=10) as resp:
                status_results[code] = {
                    "url": url,
                    "tersedia": resp.status == 200,
                    "terakhir_diperbarui": resp.headers.get("Last-Modified") or datetime.utcnow().isoformat()
                }
                print(f"[+] Himawari-9 ({code}): Aktif 200 OK")
        except Exception as e:
            status_results[code] = {"url": url, "tersedia": False, "error": str(e)}
            print(f"[-] Gagal periksa Himawari-9 ({code}): {e}")
    return status_results

def fetch_weather_stations():
    print("[*] Menarik data presipitasi & kelembapan tanah satelit via Open-Meteo...")
    weather_results = {}
    for name, coords in MONITORING_STATIONS.items():
        lat = coords["lat"]
        lng = coords["lng"]
        url = (
            f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}"
            f"&current=temperature_2m,relative_humidity_2m,precipitation,rain"
            f"&hourly=precipitation_probability,soil_moisture_0_to_7cm"
            f"&timezone=Asia%2FJakarta"
        )
        data = fetch_json(url)
        if data and "current" in data:
            curr = data["current"]
            weather_results[name] = {
                "lat": lat,
                "lng": lng,
                "suhu_c": curr.get("temperature_2m"),
                "kelembapan_persen": curr.get("relative_humidity_2m"),
                "curah_hujan_mm": curr.get("precipitation"),
                "status_hujan": "Hujan Lebat" if curr.get("precipitation", 0) > 10 else ("Hujan Sedang" if curr.get("precipitation", 0) > 2 else "Aman / Kering")
            }
    return weather_results

def main():
    print("=" * 60)
    print("🚀 GITHUB MACHINE: DATA FETCHER JABAR EWS DIMULAI")
    print(f"⏰ Timestamp UTC: {datetime.utcnow().isoformat()}")
    print("=" * 60)

    gempa = fetch_bmkg_gempa()
    himawari_status = fetch_himawari_status()
    stations_weather = fetch_weather_stations()

    output_payload = {
        "terakhir_diperbarui": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "mesin_eksekusi": "GitHub Actions Automated Cron Runner",
        "gempa_bmkg": gempa,
        "himawari_9": himawari_status,
        "stasiun_cuaca_jabar": stations_weather,
        "status_sistem": "Normal Operasional"
    }

    out_file = os.path.join(OUTPUT_DIR, "live-telemetry.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, indent=2, ensure_ascii=False)

    print(f"[✅] Data berhasil disimpan ke: {out_file}")
    print("=" * 60)

if __name__ == "__main__":
    main()
