const express = require('express');
const router  = express.Router();
const { TlsVersionStat, TlsCipherStat, TlsSecurityStat } = require('../../models/Schemas');
const { getTimeFilter, getBaseFilter } = require('./helpers');

function analyzeCipherSuite(cipher) {
  if (!cipher || cipher === '-' || cipher === 'Unknown') return { status: 'Unknown', description: 'Cipher suite information not available.' };
  
  const c = cipher.toUpperCase();
  
  if (c.includes('NULL') || c.includes('RC4') || c.includes('DES') || c.includes('MD5') || c.includes('EXP') || c.includes('ANON')) {
    return { status: 'Vulnerable', description: 'Uses obsolete and highly insecure cryptographic algorithms. Must be disabled immediately.' };
  }
  
  if (c.includes('CBC') || c.includes('SHA1') || c.startsWith('TLS_RSA_WITH') || (!c.includes('GCM') && !c.includes('POLY1305'))) {
    return { status: 'Weak', description: 'Uses legacy algorithms that are theoretically breakable or lack modern forward secrecy.' };
  }
  
  if ((c.includes('GCM') || c.includes('POLY1305')) && (c.includes('AES') || c.includes('CHACHA20'))) {
    return { status: 'Secure', description: 'Modern, robust authenticated encryption providing forward secrecy.' };
  }
  
  return { status: 'Moderate', description: 'Standard encryption but may lack the strongest current security guarantees.' };
}

// GET /api/dashboard/tls-versions
router.get('/tls-versions', async (req, res) => {
  try {
    const limit      = req.query.limit !== undefined ? parseInt(req.query.limit) : 10;
    const timeFilter = getTimeFilter(req);
    const matchBase  = getBaseFilter(req, timeFilter);

    const data = await TlsVersionStat.aggregate([
      { $match: matchBase },
      { $group: {
          _id:      '$tls_version',
          download: { $sum: '$download' },
          upload:   { $sum: '$upload' },
          timestamp: { $max: '$timestamp' },
      }},
      { $project: { tls_version: '$_id', download: 1, upload: 1, total: { $add: ['$download', '$upload'] }, timestamp: 1, _id: 0 } },
      { $sort: { total: -1 } },
    ]);

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/tls-ciphers
router.get('/tls-ciphers', async (req, res) => {
  try {
    const limit      = req.query.limit !== undefined ? parseInt(req.query.limit) : 15;
    const timeFilter = getTimeFilter(req);
    const matchBase  = getBaseFilter(req, timeFilter);

    const data = await TlsCipherStat.aggregate([
      { $match: matchBase },
      { $group: {
          _id:      '$tls_cipher',
          download: { $sum: '$download' },
          upload:   { $sum: '$upload' },
          timestamp: { $max: '$timestamp' },
      }},
      { $project: { tls_cipher: '$_id', download: 1, upload: 1, total: { $add: ['$download', '$upload'] }, timestamp: 1, _id: 0 } },
      { $sort: { total: -1 } },
    ]);

    let finalData = data.map(d => {
      const { status, description } = analyzeCipherSuite(d.tls_cipher);
      return { ...d, security_status: status, description };
    });

    res.json({ ok: true, data: finalData });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/tls-security
router.get('/tls-security', async (req, res) => {
  try {
    const timeFilter = getTimeFilter(req);
    const matchBase  = getBaseFilter(req, timeFilter);

    const raw = await TlsSecurityStat.aggregate([
      { $match: matchBase },
      { $group: {
          _id:      '$tls_security',
          download: { $sum: '$download' },
          upload:   { $sum: '$upload' },
          timestamp: { $max: '$timestamp' },
      }},
      { $project: {
          tls_security: '$_id',
          download: 1,
          upload:   1,
          total:    { $add: ['$download', '$upload'] },
          timestamp: 1,
          _id: 0
      }},
      { $sort: { total: -1 } }
    ]);

    const data = raw.map(r => {
      let color = '#bc8cff';
      const label = (r.tls_security || '').toLowerCase();
      if (label === 'recommended') color = '#3fb950';
      else if (label === 'weak')    color = '#f0883e';
      else if (label === 'secure')  color = '#58a6ff';
      else if (label === 'insecure') color = '#f85149';
      return { ...r, color };
    });

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
