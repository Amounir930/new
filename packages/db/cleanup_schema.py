
import os
import re
import glob

sql_snippets = []

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    def extract_sql_blocks(text):
        new_text = ""
        idx = 0
        while True:
            match = re.search(r'^[ \t]*sql\s+"[^"]+"\s*\{', text[idx:], re.MULTILINE)
            if not match:
                new_text += text[idx:]
                break
            
            start = idx + match.start()
            new_text += text[idx:start]
            
            brace_count = 0
            in_string = False
            for j in range(start + match.end() - 1, len(text)):
                char = text[j]
                if char == '"' and text[j-1] != '\\':
                    in_string = not in_string
                elif not in_string:
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            sql_snippets.append(text[start:j+1])
                            idx = j + 1
                            break
        return new_text
    
    content = extract_sql_blocks(content)

    def process_index(text):
        new_text = ""
        idx = 0
        while True:
            match = re.search(r'^[ \t]*index\s+"[^"]+"\s*\{', text[idx:], re.MULTILINE)
            if not match:
                new_text += text[idx:]
                break
            
            start = idx + match.start()
            new_text += text[idx:start]
            
            brace_count = 0
            in_string = False
            for j in range(start + match.end() - 1, len(text)):
                char = text[j]
                if char == '"' and text[j-1] != '\\':
                    in_string = not in_string
                elif not in_string:
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            index_body = text[start:j+1]
                            if 'on {' not in index_body:
                                index_body = re.sub(r'([ \t]*)expr\s*=\s*("[^"]+")', r'\n\1on {\n\1  expr = \2\n\1}', index_body)
                            new_text += index_body
                            idx = j + 1
                            break
        return new_text

    content = process_index(content)

    with open(filepath, 'w') as f:
        f.write(content)

for filepath in glob.glob("*.hcl"):
    process_file(filepath)

with open('post_migration_sql_blocks.txt', 'w') as f:
    f.write("\n\n".join(sql_snippets))

print("Applied cleanup.")
