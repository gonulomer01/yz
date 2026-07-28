with open('wwwroot/js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

old_str = "onclick=\"readNotification(${n.id}, '${n.groupId}')\""
new_str = "onclick=\"readNotification(${n.id}, '${n.groupId}', ${n.imageId || 'null'})\""

js = js.replace(old_str, new_str)

with open('wwwroot/js/app.js', 'w', encoding='utf-8') as f:
    f.write(js)
