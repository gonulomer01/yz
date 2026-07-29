import re

with open("wwwroot/js/app.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

headers = []
for i, line in enumerate(lines):
    if line.strip().startswith("// ---") or line.strip().startswith("/* ---"):
        headers.append((i, line.strip()))

with open("headers.txt", "w", encoding="utf-8") as f:
    for h in headers:
        f.write(f"{h[0]}: {h[1]}\n")
