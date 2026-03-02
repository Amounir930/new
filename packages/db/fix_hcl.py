
import os
import re

def fix_hcl_content(content):
    # 1. First, standard multi-line enums (safely)
    def enum_repl(m):
        name = m.group(1)
        body = m.group(2)
        # Split body by attributes
        parts = re.split(r'([a-z_]+\s*=\s*)', body)
        # parts looks like ['', 'schema = ', 'schema.public ', 'values = ', '["A", "B"]']
        new_body = ""
        for i in range(1, len(parts), 2):
            attr = parts[i].strip()
            val = parts[i+1].strip()
            if val.endswith(';'): val = val[:-1] # remove optional semicolon
            new_body += f"\n  {attr}{val}"
        return f'enum "{name}" {{{new_body}\n}}'

    content = re.sub(r'enum "([^"]+)"\s*{([^}]+)}', enum_repl, content)

    # 2. Fix column definitions
    def column_repl(m):
        name = m.group(1)
        body = m.group(2)
        # Avoid breaking sql("...") blocks
        # We'll split by attributes while respecting common SQL patterns
        parts = re.split(r'([a-z_]+\s*=\s*)', body)
        new_body = ""
        for i in range(1, len(parts), 2):
            attr = parts[i].strip()
            val = parts[i+1].strip()
            # Remove trailing semicolon if it was misused as separator
            if val.endswith(';'): val = val[:-1]
            new_body += f"\n    {attr} {val}"
        return f'column "{name}" {{{new_body}\n  }}'

    # Only target column definitions that are on a single line or misuse semicolons
    content = re.sub(r'column "([^"]+)"\s*{([^}\n]+)}', column_repl, content)
    
    # 3. Cleanup remaining semicolons outside of long SQL blocks (HEREDOCS)
    # We'll do this line by line for safety
    lines = content.split('\n')
    in_sql = False
    new_lines = []
    for line in lines:
        if '<<SQL' in line:
            in_sql = True
        if in_sql:
            new_lines.append(line)
            if 'SQL' in line and line.strip() == 'SQL':
                in_sql = False
            continue
        
        # Outside SQL heredocs, remove semicolons that are not inside quotes or sql()
        # This is a bit risky but we'll try to target attribute ends
        if not in_sql:
            # Remove trailing semicolons (not in sql())
            if ';' in line and 'sql(' not in line:
                line = line.replace(';', '')
        new_lines.append(line)
    
    return '\n'.join(new_lines)

files = [
    "01_foundation.hcl", 
    "02_CATALOG_INVENTORY.hcl", 
    "03-Protocol.hcl", 
    "04_commerce_crm.hcl", 
    "05_marketing_systems.hcl", 
    "06-SYSTEM.hcl", 
    "07-SECURITY.hcl"
]

for filename in files:
    if os.path.exists(filename):
        with open(filename, 'r') as f:
            content = f.read()
        new_content = fix_hcl_content(content)
        with open(filename, 'w') as f:
            f.write(new_content)
        print(f"Fixed {filename}")
