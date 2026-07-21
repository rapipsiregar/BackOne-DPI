const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`grep -rn "Overview Dashboard" /home/adminbackend/web/demoplace.my.id/public_html/ /home/adminbackend/backone-production/ 2>/dev/null | head -n 30`, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('=== SEARCH Overview Dashboard ===\n' + out);
      
      conn.exec(`grep -rn "DPI MetaData" /home/adminbackend/web/demoplace.my.id/public_html/ /home/adminbackend/backone-production/ 2>/dev/null | head -n 30`, (err2, stream2) => {
        let out2 = '';
        stream2.on('data', d => out2 += d);
        stream2.on('close', () => {
          console.log('=== SEARCH DPI MetaData ===\n' + out2);
          conn.end();
        });
      });
    });
  });
}).connect({
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH'
});
