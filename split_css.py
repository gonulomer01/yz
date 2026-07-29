import os
import re

with open("wwwroot/css/style.css", "r", encoding="utf-8") as f:
    css = f.read()

# Let's create folders
folders = ["base", "layout", "components", "pages"]
for folder in folders:
    os.makedirs(f"wwwroot/css/{folder}", exist_ok=True)

# A simple regex to find sections separated by /* --- TITLE --- */
sections = re.split(r'/\*\s*---\s*(.*?)\s*---\s*\*/', css)

# sections[0] is everything before the first comment.
# sections[1] is the first title, sections[2] is its content, and so on.

files = {
    "base": "",
    "sidebar": "",
    "topbar": "",
    "modals": "",
    "cards": "",
    "gallery": "",
    "forms": "",
    "animations": "",
    "responsive": "",
    "theme": ""
}

current_file = "base"
files["base"] += sections[0]

for i in range(1, len(sections), 2):
    title = sections[i].lower()
    content = f"\n/* --- {sections[i]} --- */" + sections[i+1]
    
    if "sidebar" in title or "nav" in title:
        current_file = "sidebar"
    elif "top" in title or "header" in title:
        current_file = "topbar"
    elif "modal" in title or "overlay" in title or "lightbox" in title:
        current_file = "modals"
    elif "card" in title or "grid" in title or "feed" in title:
        current_file = "cards"
    elif "gallery" in title or "image" in title or "trash" in title:
        current_file = "gallery"
    elif "form" in title or "input" in title or "btn" in title or "button" in title:
        current_file = "forms"
    elif "anim" in title or "loader" in title:
        current_file = "animations"
    elif "mobile" in title or "responsive" in title:
        current_file = "responsive"
    elif "light mode" in title or "dark mode" in title or "theme" in title:
        current_file = "theme"
    else:
        # keep it in the current file if it doesn't match a specific category
        pass
        
    files[current_file] += content

# Write files
mapping = {
    "base": "base/base.css",
    "theme": "base/theme.css",
    "sidebar": "layout/sidebar.css",
    "topbar": "layout/topbar.css",
    "modals": "components/modals.css",
    "cards": "components/cards.css",
    "gallery": "components/gallery.css",
    "forms": "components/forms.css",
    "animations": "components/animations.css",
    "responsive": "layout/responsive.css"
}

main_css = ""
for key, content in files.items():
    if content.strip():
        file_path = mapping[key]
        with open(f"wwwroot/css/{file_path}", "w", encoding="utf-8") as f:
            f.write(content.strip() + "\n")
        main_css += f'@import url("{file_path}");\n'

with open("wwwroot/css/main.css", "w", encoding="utf-8") as f:
    f.write(main_css)

