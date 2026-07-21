const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  // Execute a shell script on remote server
  conn.exec(`python3 -c "
import os, re

root = '/home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/.next/server/app/(dashboard)'

for dirpath, dirnames, filenames in os.walk(root):
    for f in filenames:
        if f.endswith('.html') or f.endswith('.js'):
            full = os.path.join(dirpath, f)
            rel = os.path.relpath(full, root)
            try:
                content = open(full, 'r', encoding='utf-8', errors='ignore').read()
                
                h2s = re.findall(r'<h[12][^>]*>(.*?)</h[12]>', content)
                clean_h2s = [re.sub(r'<[^>]+>', '', h).strip() for h in h2s if h.strip()]
                
                has_learn = 'Learn This Page' in content
                
                if clean_h2s or has_learn:
                    print(f'Route File: {rel}')
                    print(f'  Headers: {\" | \".join(clean_h2s)}')
                    print(f'  Learn This Page Button: {has_learn}')
                    print('-' * 40)
            except Exception as e:
                pass
"`, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
}).connect({
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH'
});
