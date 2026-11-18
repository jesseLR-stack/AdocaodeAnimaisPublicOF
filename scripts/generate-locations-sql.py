"""Gera a migration com estados e municípios (IBGE) a partir dos CSVs de
kelvins/municipios-brasileiros (licença MIT).
Uso: python3 scripts/generate-locations-sql.py estados.csv municipios.csv > saida.sql
"""
import csv, sys, unicodedata, re

def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def q(s):
    return "'" + s.replace("'", "''") + "'"

estados_csv, municipios_csv = sys.argv[1], sys.argv[2]
uf_by_code = {}
print("-- Dados de referência: estados e municípios brasileiros (IBGE).")
print("-- Fonte: github.com/kelvins/municipios-brasileiros (MIT). Gerado por scripts/generate-locations-sql.py\n")
print("insert into public.states (uf, name, region) values")
rows = []
with open(estados_csv, encoding="utf-8-sig") as f:
    for r in csv.DictReader(f):
        uf_by_code[r["codigo_uf"]] = r["uf"]
        rows.append(f"  ({q(r['uf'])}, {q(r['nome'])}, {q(r['regiao'])})")
print(",\n".join(sorted(rows)) + "\non conflict (uf) do nothing;\n")
rows = []
with open(municipios_csv, encoding="utf-8-sig") as f:
    for r in csv.DictReader(f):
        uf = uf_by_code[r["codigo_uf"]]
        rows.append(f"  ({r['codigo_ibge']}, {q(r['nome'])}, {q(slugify(r['nome']) + '-' + uf.lower())}, {q(uf)}, {r['latitude']}, {r['longitude']}, {'true' if r['capital']=='1' else 'false'})")
for i in range(0, len(rows), 1000):
    print("insert into public.cities (id, name, slug, uf, latitude, longitude, is_capital) values")
    print(",\n".join(rows[i:i+1000]) + "\non conflict (id) do nothing;\n")
