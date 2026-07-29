import re
import os

with open("Views/Home/Index.cshtml", "r", encoding="utf-8") as f:
    html = f.read()

def extract_and_replace(html, start_marker, end_marker, partial_name):
    start = html.find(start_marker)
    if start == -1: return html
    end = html.find(end_marker, start) + len(end_marker)
    content = html[start:end]
    
    with open(f"Views/Shared/Partials/_{partial_name}.cshtml", "w", encoding="utf-8") as f:
        f.write(content)
        
    return html[:start] + f'@await Html.PartialAsync("Partials/_{partial_name}")' + html[end:]

html = extract_and_replace(html, '<aside class="app-sidebar" id="app-sidebar">', '</aside>', 'Sidebar')
html = extract_and_replace(html, '<header class="top-bar glass-card">', '</header>', 'TopBar')
html = extract_and_replace(html, '<section id="section-studio" class="page active">', '</section>', 'Studio')
html = extract_and_replace(html, '<section id="section-dashboard" class="page">', '</section>', 'Dashboard')
html = extract_and_replace(html, '<section id="section-profile" class="page">', '</section>', 'Profile')
html = extract_and_replace(html, '<section id="section-gallery" class="page">', '</section>', 'Gallery')
html = extract_and_replace(html, '<section id="section-collections" class="page">', '</section>', 'Collections')
html = extract_and_replace(html, '<section id="section-favorites" class="page">', '</section>', 'Favorites')
html = extract_and_replace(html, '<section id="section-trash" class="page">', '</section>', 'Trash')

with open("Views/Home/Index.cshtml", "w", encoding="utf-8") as f:
    f.write(html)
