
import re

file_path = r"c:\Users\LENOVO\.gemini\antigravity\playground\silent-corona\index.html"

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all section tags
    print("--- Scanning for Sections ---")
    sections = [m for m in re.finditer(r'<section[^>]*>', content)]
    for m in sections:
        line_num = content[:m.start()].count('\n') + 1
        print(f"Line {line_num}: {m.group(0)}")

    # Check specifically for partners
    print("\n--- Scanning for 'partners' or 'partneri' ---")
    partners_matches = [m for m in re.finditer(r'(class="[^"]*partners[^"]*"|id="partneri")', content)]
    for m in partners_matches:
        line_num = content[:m.start()].count('\n') + 1
        print(f"Line {line_num}: {m.group(0)}")
        
    # Check for JS scanner
    print("\n--- Scanning for JS duplicates ---")
    # Check if the script is included twice
    scripts = [m for m in re.finditer(r'<script>', content)]
    for m in scripts:
        line_num = content[:m.start()].count('\n') + 1
        # peek content
        snippet = content[m.end():m.end()+100].replace('\n', ' ')
        print(f"Line {line_num}: <script> {snippet}...")

except Exception as e:
    print(f"Error: {e}")
