const { Client } = require('ssh2');

const script = `
sqlite3 /home/adminbackend/web/backend.demoplace.my.id/public_html/backend/netify_data.db "PRAGMA integrity_check;"
echo "Backup DB Check:"
sqlite3 /home/adminbackend/deploy_backup/netify_data.db "PRAGMA integrity_check;"
echo "Current DB Check:"
sqlite3 /home/adminbackend/web/demoplace.my.id/public_html/backend/netify_data.db "PRAGMA integrity_check;"
`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect({
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH'
});
