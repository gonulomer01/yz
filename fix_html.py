import re

with open("Views/Home/Index.cshtml", "r", encoding="utf-8") as f:
    html = f.read()

pattern = r'<div class="mobile-brand-header">\s*<img src="/images/logo\.png" alt="Mega Image Studio">\s*<div class="brand-text">\s*<span class="brand-primary">MEGA IMAGE</span><span class="brand-secondary">STUDIO</span>\s*<span class="brand-subtitle">Görsel Platformu</span>\s*</div>\s*</div>'

new_html = """        <div class="mobile-brand-header">
          <img src="/images/logo.png" alt="Mega Image Studio">
          <div class="brand-text">
            <span class="brand-primary">MEGA IMAGE <span class="brand-highlight">STUDIO</span></span>
            <span class="brand-subtitle"><i class="fa-solid fa-sparkles"></i> Görsel Platformu</span>
          </div>
        </div>"""

if re.search(pattern, html):
    html = re.sub(pattern, new_html, html)
    with open("Views/Home/Index.cshtml", "w", encoding="utf-8") as f:
        f.write(html)
    print("Replaced successfully.")
else:
    print("Could not find the target HTML snippet.")
