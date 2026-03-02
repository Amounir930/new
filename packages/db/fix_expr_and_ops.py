
import os
import re
import glob

def fix_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()

    out_lines = []
    in_index_block = False
    
    # To accumulate properties for HNSW index ops conversion
    idx_columns_line = None
    idx_ops_line = None
    
    for i, line in enumerate(lines):
        if re.match(r'^[ \t]*index\s+"[^"]+"\s*\{', line):
            in_index_block = True
            out_lines.append(line)
            continue
            
        elif in_index_block and re.match(r'^[ \t]*\}', line):
            in_index_block = False
            out_lines.append(line)
            continue
            
        if in_index_block:
            # 1. Fix stray expr
            # match `expr = "..."` or `expr  = "..."`
            expr_match = re.search(r'expr\s*=\s*("[^"]+")', line)
            if expr_match and 'on {' not in line:
                indent = line[:len(line) - len(line.lstrip())]
                out_lines.append(f"{indent}on {{\n")
                out_lines.append(f"{indent}  expr = {expr_match.group(1)}\n")
                out_lines.append(f"{indent}}}\n")
                continue
                
            # 2. Fix HNSW vector ops
            # We see `columns = [column.embedding]` and `ops = [sql("...")]`
            if 'columns = [column.' in line and 'embedding' in line:
                col_match = re.search(r'columns\s*=\s*\[(column\.[^\]]+)\]', line)
                if col_match:
                    idx_columns_line = line
                    col_val = col_match.group(1)
                    indent = line[:len(line) - len(line.lstrip())]
                    out_lines.append(f"{indent}on {{\n")
                    out_lines.append(f"{indent}  column = {col_val}\n")
                    # We will add ops if we see it later
                else:
                    out_lines.append(line)
                continue
                
            if 'ops' in line and 'sql(' in line:
                ops_match = re.search(r'ops\s*=\s*\[(sql\([^\]]+\))\]', line)
                if ops_match:
                    ops_val = ops_match.group(1)
                    indent = line[:len(line) - len(line.lstrip())]
                    out_lines.append(f"{indent}  ops = {ops_val}\n")
                    out_lines.append(f"{indent}}}\n") # close the on { block
                continue
            
        out_lines.append(line)

    with open(filepath, 'w') as f:
        f.writelines(out_lines)

for filepath in glob.glob("*.hcl"):
    fix_file(filepath)

print("Applied expr and ops fixes via python.")
