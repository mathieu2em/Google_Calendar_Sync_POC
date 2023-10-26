import json
import os

# Check if 'vars' folder exists, and create it if not
if not os.path.exists('vars'):
    os.makedirs('vars')

# Load the JSON data
with open('credentials.json', 'r') as json_file:
    data = json.load(json_file)

# Navigate to the 'web' key and extract desired environment variables
web_data = data.get('web', {})
env_vars = {key: web_data[key] for key in ['client_id', 'project_id', 'client_secret'] if key in web_data}

# Write the environment variables to a .env file inside the 'vars' folder
with open('vars/.env', 'w') as env_file:
    for key, value in env_vars.items():
        env_file.write(f"{key}={value}\n")

print("'vars/.env' file created successfully!")