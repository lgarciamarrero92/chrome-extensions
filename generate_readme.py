import os
import json

# Define the README file
README_FILE = "README.md"

# Scan repository for folders containing manifest.json
extensions = []
repo_path = os.path.dirname(os.path.abspath(__file__))

for folder in os.listdir(repo_path):
    manifest_path = os.path.join(repo_path, folder, "manifest.json")
    
    if os.path.isdir(os.path.join(repo_path, folder)) and os.path.isfile(manifest_path):
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest_data = json.load(f)
                name = manifest_data.get("name", "Unknown Extension")
                description = manifest_data.get("description", "No description available.")
                extensions.append((folder, name, description))
        except Exception as e:
            print(f"Error reading {manifest_path}: {e}")

# Generate the table for README.md
table_header = "| Folder Name | Extension Name | Description |\n|-------------|---------------|------------|\n"
table_rows = "\n".join([f"| `{folder}/` | {name} | {description} |" for folder, name, description in extensions])

# Read existing README.md
with open(README_FILE, "r", encoding="utf-8") as f:
    readme_content = f.read()

# Replace the Available Extensions section
new_section = f"## 🛠 Available Extensions\n\n{table_header}{table_rows}\n"
updated_content = readme_content.split("## 🛠 Available Extensions")[0] + new_section

# Write updated README.md
with open(README_FILE, "w", encoding="utf-8") as f:
    f.write(updated_content)

print("✅ README.md updated successfully!")
