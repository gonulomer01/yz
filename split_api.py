import re
import os

with open("Controllers/ApiController.cs", "r", encoding="utf-8") as f:
    content = f.read()

# Replace class definition with partial
content = content.replace("public class ApiController : ControllerBase", "public partial class ApiController : ControllerBase")
with open("Controllers/ApiController.cs", "w", encoding="utf-8") as f:
    f.write(content)

print("Added partial keyword")
