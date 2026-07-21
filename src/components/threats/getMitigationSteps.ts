interface MitigationStep {
  title: string;
  desc: string;
}

export function getMitigationSteps(type: string): { intro: string; steps: MitigationStep[] } {
  const defaultIntro = "Follow these best practice security steps to mitigate and secure your network.";
  
  switch (type) {
    case "Insecure Plaintext Password":
      return {
        intro: "Plaintext credentials were detected over an unencrypted channel (HTTP). This exposes passwords to eavesdropping and interception.",
        steps: [
          {
            title: "Force HTTPS Redirection",
            desc: "Configure the destination server to automatically redirect all port 80 (HTTP) traffic to port 443 (HTTPS).",
          },
          {
            title: "Enable Strict-Transport-Security (HSTS)",
            desc: "Add the HSTS response header to force browsers to always connect via HTTPS for this domain.",
          },
          {
            title: "Rotate Exposed Credentials",
            desc: "Immediately rotate and change passwords that were transmitted over this unencrypted connection.",
          },
          {
            title: "Audit Client Applications",
            desc: "Update the client application configurations to enforce SSL/TLS encrypted APIs/endpoints.",
          }
        ]
      };
    case "Cryptomining Connection":
      return {
        intro: "An active outbound connection to a known cryptocurrency mining pool was detected. This typically indicates a malware infection or unauthorized resource use.",
        steps: [
          {
            title: "Isolate the Source Device",
            desc: "Quarantine the infected machine from other local network segments to prevent lateral movement of malware.",
          },
          {
            title: "Block Mining Pool Endpoints",
            desc: "Add destination IPs/domains (e.g. stratum server addresses) to the firewall blocklist.",
          },
          {
            title: "Run Deep Malware Scanner",
            desc: "Execute a thorough antivirus scan on the device to locate and remove mining trojans (cryptojackers).",
          },
          {
            title: "Check System Resource Usage",
            desc: "Review Task Manager / top processes on the source device for suspicious high CPU/GPU spikes.",
          }
        ]
      };
    case "Tor Exit Node Traffic":
      return {
        intro: "Active communication with a Tor exit node was detected. Tor is often used to bypass firewalls, mask identities, or establish command-and-control channels.",
        steps: [
          {
            title: "Audit Authorized Tor Use",
            desc: "Verify whether Tor client software is authorized for use on this specific device under company policy.",
          },
          {
            title: "Block Tor Gateways",
            desc: "Implement firewall rules to drop outbound traffic to publicly known Tor exit node IP addresses.",
          },
          {
            title: "Inspect DNS Logs",
            desc: "Review DNS query histories on the source device to check for onion routing lookups or malicious domains.",
          },
          {
            title: "Remove Tor Browsers",
            desc: "Uninstall unauthorized Tor client software or browsers from the user endpoint.",
          }
        ]
      };
    case "Malicious IP Reputation":
      return {
        intro: "A connection was established with an IP address associated with known malicious activity (spam, botnets, malware distribution, or command-and-control).",
        steps: [
          {
            title: "Deploy Firewall Drops",
            desc: "Apply strict packet filtering rules to drop all incoming and outgoing connections to the malicious IP address.",
          },
          {
            title: "Scan Endpoint for Trojans",
            desc: "The source device might be a participant in a botnet. Run security scans to check for command-and-control agents.",
          },
          {
            title: "Check Payload Contents",
            desc: "Review DPI network flow payload logs to determine if credentials, sensitive files, or malware were transferred.",
          },
          {
            title: "Enable Automatic IP Feeds",
            desc: "Ensure your gateway's intrusion prevention system (IPS) automatically syncs daily threat intelligence lists.",
          }
        ]
      };
    case "Expired SSL/TLS Certificate":
      return {
        intro: "An SSL connection was initiated with a remote server using an expired security certificate. This compromises connection trust and opens users to MITM attacks.",
        steps: [
          {
            title: "Renew SSL Certificate",
            desc: "If the destination is your server, renew the certificate immediately using a public CA (e.g. Let's Encrypt, Sectigo).",
          },
          {
            title: "Enable Cert Auto-Renewal",
            desc: "Configure automated certificate renewal cron scripts (like certbot / ACME client) to prevent future expirations.",
          },
          {
            title: "Warn Client Browser Users",
            desc: "Do not ignore browser certificate warnings. Advise users against bypassing safety alerts on the target domain.",
          },
          {
            title: "Check Server Date/Time Settings",
            desc: "Ensure the target web server's system clock is correctly synchronized via NTP, which affects SSL validation.",
          }
        ]
      };
    case "Unauthorized Port Scan":
      return {
        intro: "A device inside or outside the network was observed performing a rapid volume of connection attempts to closed ports, indicating reconnaissance.",
        steps: [
          {
            title: "Check Device Activity",
            desc: "Identify whether the source IP belongs to an IT administrator running network discovery tools or a compromised machine.",
            },
          {
            title: "Configure Connection Rate-Limits",
            desc: "Setup rate-limiting policies on the firewall to drop IPs executing excessive connection handshakes per second.",
          },
          {
            title: "Enable IPS Block Rules",
            desc: "Verify that the Intrusion Prevention System (IPS) is active and configured to automatically block scans.",
          },
          {
            title: "Harden Exposed Ports",
            desc: "Ensure that sensitive services (SSH, RDP, SMB) are disabled or protected behind a VPN rather than exposed to scans.",
          }
        ]
      };
    default:
      return {
        intro: defaultIntro,
        steps: [
          {
            title: "Investigate Device Logs",
            desc: "Examine system event logs and deep packet flows on the source device to check for abnormal software execution.",
          },
          {
            title: "Block Target Connection",
            desc: "Add destination ports and target IP addresses to firewall filters until the device behavior is clarified.",
          },
          {
            title: "Quarantine and Scan",
            desc: "Isolate the client endpoint from the main VLAN and run security scanners to eliminate malware threats.",
          }
        ]
      };
  }
}
