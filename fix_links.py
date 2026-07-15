import os
import re

for root, _, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or 'dist' in root:
        continue
    for file in files:
        if file.endswith('.html') or file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original = content
            content = content.replace('tel:+971585577182', 'tel:+971544387023')
            
            content = re.sub(
                r'href="https://wa\.me/971585577182"([^>]*>)\s*Call Now',
                r'href="tel:+971544387023"\1Call Now',
                content,
                flags=re.IGNORECASE|re.DOTALL
            )
            
            if content != original:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f'Reverted {filepath}')
