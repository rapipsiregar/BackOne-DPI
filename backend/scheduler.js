// backend/scheduler.js
const cron   = require('node-cron');
const netify = require('./netify');
const db     = require('./database');
const SITE_UUID = process.env.NETIFY_SITE_UUID || 'dummy_site_uuid';

let isRunning = false;

async function runPoll() {
  if (isRunning) {
    console.log('[Scheduler] Poll sedang berjalan, skip.');
    return;
  }
  isRunning = true;
  const fetchedAt = new Date().toISOString();
  console.log(`[Scheduler] Mulai polling... (${fetchedAt})`);

  try {
    // 1. Top Aplikasi
    const apps = await netify.fetchTopApps(1440, 20);
    if (apps && Array.isArray(apps)) {
      db.insertBandwidthApps(apps, fetchedAt, SITE_UUID);
      console.log(`[Scheduler] OK Apps       : ${apps.length} baris`);
    } else {
      console.log(`[Scheduler] -- Apps       : tidak ada data`);
    }

    // 2. Top Devices — pakai fetchDiscoveredDevices yg sudah dinormalisasi
    const devices = await netify.fetchDiscoveredDevices(1440, 200);
    if (devices && Array.isArray(devices)) {
      db.insertDevices(devices, fetchedAt, SITE_UUID);
      console.log(`[Scheduler] OK Devices    : ${devices.length} baris`);
    } else {
      console.log(`[Scheduler] -- Devices    : tidak ada data`);
    }

    // 3. Top Protokol
    const protocols = await netify.fetchTopProtocols(1440, 20);
    if (protocols && Array.isArray(protocols)) {
      db.insertProtocols(protocols, fetchedAt, SITE_UUID);
      console.log(`[Scheduler] OK Protocols  : ${protocols.length} baris`);
    } else {
      console.log(`[Scheduler] -- Protocols  : tidak ada data`);
    }

    // 4. Top Negara
    const countries = await netify.fetchTopCountries(1440, 15);
    if (countries && Array.isArray(countries)) {
      db.insertCountries(countries, fetchedAt, SITE_UUID);
      console.log(`[Scheduler] OK Countries  : ${countries.length} baris`);
    } else {
      console.log(`[Scheduler] -- Countries  : tidak ada data`);
    }

    // 5. Top Domain/DNS
    const domains = await netify.fetchTopDomains(1440, 20);
    if (domains && Array.isArray(domains)) {
      db.insertDNS(domains, fetchedAt, SITE_UUID);
      console.log(`[Scheduler] OK DNS        : ${domains.length} baris`);
    } else {
      console.log(`[Scheduler] -- DNS        : tidak ada data`);
    }

    // 6. Flows — pakai local_ip sebagai proxy
    const flows = await netify.fetchFlows(200);
    if (flows && Array.isArray(flows)) {
      db.insertFlows(flows, fetchedAt, SITE_UUID);
      console.log(`[Scheduler] OK Flows      : ${flows.length} baris`);
    } else {
      console.log(`[Scheduler] -- Flows      : tidak ada data`);
    }

    // 7. Threats — dari Events Status
    const threats = await netify.fetchCyberThreats(1440, 50);
    if (threats && Array.isArray(threats)) {
      db.insertThreats(threats, fetchedAt, SITE_UUID);
      console.log(`[Scheduler] OK Threats    : ${threats.length} baris`);
    } else {
      console.log(`[Scheduler] -- Threats    : tidak ada data`);
    }

    // 8. Events Log
    const events = await netify.fetchEvents(50);
    if (events && Array.isArray(events)) {
      db.insertEvents(events, fetchedAt, SITE_UUID);
      console.log(`[Scheduler] OK Events     : ${events.length} baris`);
    } else {
      console.log(`[Scheduler] -- Events     : tidak ada data`);
    }

    // 10. App Categories
    const appCats = await netify.fetchTopAppCategories(1440, 15);
    if (appCats?.length) { db.insertAppCategories(appCats, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK AppCats    : ${appCats.length} baris`); }
    else console.log(`[Scheduler] -- AppCats    : tidak ada data`);

    // 11. Continents
    const continents = await netify.fetchTopContinents(1440, 10);
    if (continents?.length) { db.insertContinents(continents, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK Continents : ${continents.length} baris`); }
    else console.log(`[Scheduler] -- Continents : tidak ada data`);

    // 12. Regions
    const regions = await netify.fetchTopRegions(1440, 20);
    if (regions?.length) { db.insertRegions(regions, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK Regions    : ${regions.length} baris`); }
    else console.log(`[Scheduler] -- Regions    : tidak ada data`);

    // 13. Cities
    const cities = await netify.fetchTopCities(1440, 20);
    if (cities?.length) { db.insertCities(cities, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK Cities     : ${cities.length} baris`); }
    else console.log(`[Scheduler] -- Cities     : tidak ada data`);

    // 14. VLANs
    const vlans = await netify.fetchTopVLANs(1440, 20);
    if (vlans?.length) { db.insertVLANs(vlans, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK VLANs      : ${vlans.length} baris`); }
    else console.log(`[Scheduler] -- VLANs      : tidak ada data`);

    // 15. Interfaces
    const ifaces = await netify.fetchTopInterfaces(1440, 20);
    if (ifaces?.length) { db.insertInterfaces(ifaces, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK Interfaces : ${ifaces.length} baris`); }
    else console.log(`[Scheduler] -- Interfaces : tidak ada data`);

    // 16. Flow Types
    const flowTypes = await netify.fetchTopFlowTypes(1440, 10);
    if (flowTypes?.length) { db.insertFlowTypes(flowTypes, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK FlowTypes  : ${flowTypes.length} baris`); }
    else console.log(`[Scheduler] -- FlowTypes  : tidak ada data`);

    // 17. Flow Origins
    const flowOrigins = await netify.fetchTopFlowOrigins(1440, 10);
    if (flowOrigins?.length) { db.insertFlowOrigins(flowOrigins, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK FlowOrigin : ${flowOrigins.length} baris`); }
    else console.log(`[Scheduler] -- FlowOrigin : tidak ada data`);

    // 18. IP Versions
    const ipVersions = await netify.fetchTopIPVersions(1440, 5);
    if (ipVersions?.length) { db.insertIPVersions(ipVersions, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK IPVersions : ${ipVersions.length} baris`); }
    else console.log(`[Scheduler] -- IPVersions : tidak ada data`);

    // 19. Remote IPs
    const remoteIPs = await netify.fetchTopRemoteIPs(1440, 20);
    if (remoteIPs?.length) { db.insertRemoteIPs(remoteIPs, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK RemoteIPs  : ${remoteIPs.length} baris`); }
    else console.log(`[Scheduler] -- RemoteIPs  : tidak ada data`);

    // 20. MAC Bandwidth
    const macBW = await netify.fetchTopLocalMACs(1440, 50);
    if (macBW?.length) { db.insertMACBandwidth(macBW, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK MACBandwdh : ${macBW.length} baris`); }
    else console.log(`[Scheduler] -- MACBandwdh : tidak ada data`);

    // 9. Bandwidth Timeline
    const summary  = await netify.fetchBandwidthSummary(1440);
    const devCount = devices?.length ?? 0;
    db.insertBandwidthTimeline({ ...summary, devices: devCount }, fetchedAt, SITE_UUID);
    console.log(`[Scheduler] OK Timeline   : saved`);

    // 21. TLS Versions
    const tlsVer = await netify.fetchTLSVersions(1440, 10);
    if (tlsVer?.length) { db.insertTLSVersions(tlsVer, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK TLS Ver    : ${tlsVer.length} baris`); }
    else console.log(`[Scheduler] -- TLS Ver    : tidak ada data`);

    // 22. TLS Ciphers
    const tlsCipher = await netify.fetchTLSCiphers(1440, 15);
    if (tlsCipher?.length) { db.insertTLSCiphers(tlsCipher, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK TLS Cipher : ${tlsCipher.length} baris`); }
    else console.log(`[Scheduler] -- TLS Cipher : tidak ada data`);

    // 23. TLS Security
    const tlsSec = await netify.fetchTLSSecurity(1440, 10);
    if (tlsSec?.length) { db.insertTLSSecurity(tlsSec, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK TLS Sec    : ${tlsSec.length} baris`); }
    else console.log(`[Scheduler] -- TLS Sec    : tidak ada data`);

    // 24. NetBIOS Hostnames
    const netbios = await netify.fetchNetBIOSHostnames(1440, 30);
    if (netbios?.length) { db.insertNetBIOSHostnames(netbios, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK NetBIOS    : ${netbios.length} baris`); }
    else console.log(`[Scheduler] -- NetBIOS    : tidak ada data`);

    // 25. Discovery OS (standalone — OS yang terdeteksi di jaringan)
    const discOs = await netify.fetchTopDiscoveryOS(1440, 20);
    if (discOs?.length) { db.insertDiscoveryOS(discOs, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK DiscOS     : ${discOs.length} baris`); }
    else console.log(`[Scheduler] -- DiscOS     : tidak ada data`);

    // 26. DHCP Class Fingerprint
    const dhcpFp = await netify.fetchDHCPClassFingerprints(1440, 30);
    if (dhcpFp?.length) { db.insertDHCPFingerprints(dhcpFp, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK DHCP FP    : ${dhcpFp.length} baris`); }
    else console.log(`[Scheduler] -- DHCP FP    : tidak ada data`);

    // 27. HTTP User-Agent
    const userAgents = await netify.fetchHTTPUserAgents(1440, 30);
    if (userAgents?.length) { db.insertHTTPUserAgents(userAgents, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK UserAgent  : ${userAgents.length} baris`); }
    else console.log(`[Scheduler] -- UserAgent  : tidak ada data`);

    // 28. HTTPS SNI Hostname
    const sniHosts = await netify.fetchSNIHostnames(1440, 30);
    if (sniHosts?.length) { db.insertSNIHostnames(sniHosts, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK SNI Host   : ${sniHosts.length} baris`); }
    else console.log(`[Scheduler] -- SNI Host   : tidak ada data`);

    // 29. SSL Server Common Name
    const sslCN = await netify.fetchSSLServerCN(1440, 30);
    if (sslCN?.length) { db.insertSSLServerCN(sslCN, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK SSL CN     : ${sslCN.length} baris`); }
    else console.log(`[Scheduler] -- SSL CN     : tidak ada data`);

    // 30. QUIC Hostname
    const quicHosts = await netify.fetchQUICHostnames(1440, 30);
    if (quicHosts?.length) { db.insertQUICHostnames(quicHosts, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK QUIC Host  : ${quicHosts.length} baris`); }
    else console.log(`[Scheduler] -- QUIC Host  : tidak ada data`);

    // 31. BitTorrent Info Hash
    const btHashes = await netify.fetchBitTorrentInfoHashes(1440, 30);
    if (btHashes?.length) { db.insertBitTorrentHashes(btHashes, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK BT Hash    : ${btHashes.length} baris`); }
    else console.log(`[Scheduler] -- BT Hash    : tidak ada data`);

    // 32. SSH Client (field: ssh_client)
    const sshClient = await netify.fetchSSHClients(1440, 20);
    if (sshClient?.length) { db.insertSSHVersions(sshClient, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK SSH Client : ${sshClient.length} baris`); }
    else console.log(`[Scheduler] -- SSH Client : tidak ada data`);

    // 32b. SSH Server (field: ssh_server)
    const sshServer = await netify.fetchSSHServers(1440, 20);
    if (sshServer?.length) { db.insertSSHVersions(sshServer, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK SSH Server : ${sshServer.length} baris`); }
    else console.log(`[Scheduler] -- SSH Server : tidak ada data`);

    // 33. mDNS Hostname (Chromecast, Apple TV, etc.)
    const mdnsHosts = await netify.fetchMDNSHostnames(1440, 30);
    if (mdnsHosts?.length) { db.insertMDNSHostnames(mdnsHosts, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK mDNS Host  : ${mdnsHosts.length} baris`); }
    else console.log(`[Scheduler] -- mDNS Host  : tidak ada data`);

    // ─── INTELLIGENCE 22-30 (derive dari data yang tersedia) ─────────────────

    // 34. Cryptocurrency Mining (derive dari apps + flows ke port mining)
    const cryptoMining = await netify.fetchCryptoMining(50);
    if (cryptoMining?.length) { db.insertCryptoMining(cryptoMining, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK CryptoMine : ${cryptoMining.length} baris`); }
    else console.log(`[Scheduler] -- CryptoMine : tidak ada data`);

    // 35. Device Discovery (derive dari flows + bandwidth per-IP)
    const devDisc = await netify.fetchDeviceDiscovery(100);
    if (devDisc?.length) { db.insertDeviceDiscovery(devDisc, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK DevDisc    : ${devDisc.length} baris`); }
    else console.log(`[Scheduler] -- DevDisc    : tidak ada data`);

    // 36. Encryption Audit (derive dari flows per-IP: port encrypted vs plain)
    const encAudit = await netify.fetchEncryptionAudit(50);
    if (encAudit?.length) { db.insertEncryptionAudit(encAudit, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK EncAudit   : ${encAudit.length} baris`); }
    else console.log(`[Scheduler] -- EncAudit   : tidak ada data`);

    // 37. Insecure Protocols (derive dari top protocols)
    const insecProto = await netify.fetchInsecureProtocols(1440, 50);
    if (insecProto?.length) { db.insertInsecureProtocols(insecProto, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK InsecProto : ${insecProto.length} baris`); }
    else console.log(`[Scheduler] -- InsecProto : tidak ada data`);

    // 38. IP Reputation (derive dari top remote_ip + high-risk countries)
    const ipRep = await netify.fetchIPReputation(50);
    if (ipRep?.length) { db.insertIPReputation(ipRep, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK IPRepute   : ${ipRep.length} baris`); }
    else console.log(`[Scheduler] -- IPRepute   : tidak ada data`);

    // 39. Server Discovery (derive dari flows ke port server well-known)
    const srvDisc = await netify.fetchServerDiscovery(100);
    if (srvDisc?.length) { db.insertServerDiscovery(srvDisc, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK SrvDisc    : ${srvDisc.length} baris`); }
    else console.log(`[Scheduler] -- SrvDisc    : tidak ada data`);

    // 40. Tor Detection (derive dari apps/hostnames mengandung "tor")
    const torDet = await netify.fetchTorDetection(50);
    if (torDet?.length) { db.insertTorDetection(torDet, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK TorDet     : ${torDet.length} baris`); }
    else console.log(`[Scheduler] -- TorDet     : tidak ada data`);

    // 41. Unencrypted Password (derive dari flows ke port cleartext auth)
    const unencPwd = await netify.fetchUnencryptedPasswords(50);
    if (unencPwd?.length) { db.insertUnencryptedPasswords(unencPwd, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK UnencPwd   : ${unencPwd.length} baris`); }
    else console.log(`[Scheduler] -- UnencPwd   : tidak ada data`);

    // 42. VPN Detection (derive dari apps/protocols/ports VPN)
    const vpnDet = await netify.fetchVPNDetection(50);
    if (vpnDet?.length) { db.insertVPNDetection(vpnDet, fetchedAt, SITE_UUID); console.log(`[Scheduler] OK VPNDet     : ${vpnDet.length} baris`); }
    else console.log(`[Scheduler] -- VPNDet     : tidak ada data`);

  } catch (err) {
    console.error('[Scheduler] ERROR:', err);
  } finally {
    isRunning = false;
    console.log(`[Scheduler] Poll selesai.\n`);
  }
}

function startScheduler() {
  runPoll();
  cron.schedule('* * * * *', () => runPoll());
  console.log('[Scheduler] Aktif. Polling setiap 1 menit.\n');
}

module.exports = { startScheduler, runPoll };