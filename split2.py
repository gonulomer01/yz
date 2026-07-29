import re

with open("Views/Home/Index.cshtml", "r", encoding="utf-8") as f:
    html = f.read()

start = html.find('<!-- Tam Ekran')
if start == -1:
    start = html.find('<div id="fullscreen-lightbox"')

end = html.find('<!-- Mobile Bottom Bar -->')

if start != -1 and end != -1:
    modals_content = html[start:end]
    with open("Views/Shared/Partials/_Modals.cshtml", "w", encoding="utf-8") as f:
        f.write(modals_content)
    
    html = html[:start] + '@await Html.PartialAsync("Partials/_Modals")\n\n    ' + html[end:]
    
    # Extract bottom bar
    bb_start = html.find('<!-- Mobile Bottom Bar -->')
    bb_end = html.find('</nav>') + 6
    if bb_start != -1 and html.find('</nav>', bb_start) != -1:
        bb_content = html[bb_start:bb_end]
        with open("Views/Shared/Partials/_MobileBottomBar.cshtml", "w", encoding="utf-8") as f:
            f.write(bb_content)
        html = html[:bb_start] + '@await Html.PartialAsync("Partials/_MobileBottomBar")' + html[bb_end:]

    with open("Views/Home/Index.cshtml", "w", encoding="utf-8") as f:
        f.write(html)
