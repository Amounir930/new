#!/bin/sh
# Fix Traefik Cloudflare env vars in docker-compose.prod.yml
COMPOSE="/opt/apex-v2/ops/docker-compose.prod.yml"
TOKEN="ehDZ6qYliotOWbaysie0Og_1TTNchvG5v6Jy9lly"
EMAIL="adelhub123@gmail.com"

# Remove the broken CLOUDFLARE lines and add correct ones
python3 - <<EOF
import re

with open("$COMPOSE", "r") as f:
    content = f.read()

# Replace the entire Traefik environment block's CF lines
old = '''      - "CF_API_EMAIL=\${CF_API_EMAIL}"
      - "CLOUDFLARE_EMAIL=adelhub123@gmail.com"
      - "CLOUDFLARE_DNS_API_TOKEN="
      - "CLOUDFLARE_ZONE_API_TOKEN="
      - "CF_ZONE_ID=\${CF_ZONE_ID}"'''

new = '''      - "CLOUDFLARE_EMAIL=$EMAIL"
      - "CLOUDFLARE_DNS_API_TOKEN=$TOKEN"
      - "CLOUDFLARE_ZONE_API_TOKEN=$TOKEN"
      - "CF_API_EMAIL=\${CF_API_EMAIL}"
      - "CF_ZONE_ID=\${CF_ZONE_ID}"'''

content = content.replace(old, new)

with open("$COMPOSE", "w") as f:
    f.write(content)

print("Done")
EOF
