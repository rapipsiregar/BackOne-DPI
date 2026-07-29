/**
 * git-push-iso.js
 * Push ke Gitea & GitHub menggunakan isomorphic-git (pure JS, tanpa system git)
 * 
 * CARA KERJA:
 * 1. Clone dari Gitea (untuk dapat history 75 commits)
 * 2. Salin file proyek terbaru ke folder clone
 * 3. Commit perubahan
 * 4. Push ke Gitea
 * 5. Push ke GitHub dengan remote tambahan
 */

const git     = require('isomorphic-git');
const http    = require('isomorphic-git/http/node');
const fs      = require('fs');
const path    = require('path');
const os      = require('os');

// ─── CONFIG ────────────────────────────────────────────────────────────────
const PROJECT_DIR = path.resolve(__dirname);

// Gitea
const GITEA_URL     = 'https://git.proit.id/rafif/Deep-Package-Inspection';
const GITEA_BRANCH  = 'Proxy_Server_API_backone.cloud';
const GITEA_USER    = 'rafif';
const GITEA_PASS    = 'NetWorking.0';

// GitHub
const GITHUB_URL    = 'https://github.com/Rafif-Riqullah-Siregar/BackOne-Deep-Package-Inspection';
const GITHUB_BRANCH = 'Proxy-Server-API-backone.cloud';
// GitHub token (diisi nanti, atau bisa kosong dulu untuk test)
const GITHUB_TOKEN  = process.env.GITHUB_TOKEN || '';

// Commit message
const COMMIT_MSG = `feat(source2): push all latest files - device labeling, help system, proxy docs, database isolation fix

- Added DOKUMENTASI-FILTER-PER-SITE.md (site isolation docs)
- Fixed start-with-env.js to force-load .env.production
- Fixed MONGODB_URI hostname from mongodb-netify to mongodb.prod.proit.id
- Updated .gitignore to exclude sensitive scripts and credential files
- Minor UI and labeling improvements`;

// Author
const AUTHOR = { name: 'Rafif-Riqullah-Siregar', email: 'rafif@databisnis.id' };

// ─── GITIGNORE PATTERNS ──────────────────────────────────────────────────────
// File/folder yang TIDAK boleh di-push (dari .gitignore)
const EXCLUDED_PATTERNS = [
  'node_modules',
  '.next',
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  'coverage',
  'build',
  'out',
  '.DS_Store',
  '*.log',
  '*.pem',
  '.vercel',
  '*.tsbuildinfo',
  'next-env.d.ts',
  '*.db', '*.db-shm', '*.db-wal', '*.sqlite',
  'Laporan_*.docx',
  'temp_docx',
  '*.zip',
  'AGENTS.md', 'CLAUDE.md', '.agents',
  'docs', 'plans',
  'temp.json', 'scratch',
  // Sensitive scripts
  'compare-netify-vs-dashboard.js',
  'ssh-read-source1-proxy.js',
  'check-frontend-uri-now.js',
  'verify-final.js',
  'check-frontend-uri.js',
  'ssh-check-logs.js',
  // Sensitive docs
  'BUKTI-AKSES-MONGODB.txt',
  'DOKUMENTASI-PROXY-NETIFY.md',
];

function shouldExclude(filePath) {
  const parts = filePath.split(/[/\\]/);
  for (const pattern of EXCLUDED_PATTERNS) {
    for (const part of parts) {
      if (pattern.startsWith('*')) {
        const ext = pattern.slice(1);
        if (part.endsWith(ext)) return true;
      } else if (part === pattern || filePath.includes(pattern)) {
        return true;
      }
    }
  }
  return false;
}

async function getGitFiles(dir, baseDir = dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath  = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (shouldExclude(relPath) || entry.name === '.git') continue;
    if (entry.isDirectory()) {
      files.push(...await getGitFiles(fullPath, baseDir));
    } else {
      files.push(relPath);
    }
  }
  return files;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  GIT PUSH (isomorphic-git) → Gitea + GitHub                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // ─── STEP 1: Clone dari Gitea ke temp dir ──────────────────────────────────
  const tmpDir = path.join(os.tmpdir(), `dpi-push-${Date.now()}`);
  console.log(`[1] Cloning dari Gitea ke temp: ${tmpDir}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    await git.clone({
      fs, http,
      dir: tmpDir,
      url: GITEA_URL,
      ref: GITEA_BRANCH,
      singleBranch: true,
      depth: 10,    // ambil 10 commit terakhir saja (cukup untuk push)
      onAuth: () => ({ username: GITEA_USER, password: GITEA_PASS }),
      onProgress: ({ phase, loaded, total }) => {
        if (total) process.stdout.write(`\r   ${phase}: ${loaded}/${total}   `);
      },
    });
    console.log(`\n   ✅ Clone berhasil dari Gitea branch ${GITEA_BRANCH}`);
  } catch (err) {
    console.error(`\n   ❌ Clone dari Gitea gagal: ${err.message}`);
    console.log('   → Coba dengan username tanpa domain (tanpa @databisnis.id)');
    process.exit(1);
  }

  // ─── STEP 2: Salin file project terbaru ke temp dir ────────────────────────
  console.log(`\n[2] Menyalin file terbaru dari project ke clone...`);
  const projectFiles = await getGitFiles(PROJECT_DIR);
  let copied = 0;
  for (const relPath of projectFiles) {
    const src = path.join(PROJECT_DIR, relPath);
    const dst = path.join(tmpDir, relPath);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    copied++;
  }
  console.log(`   ✅ ${copied} file disalin ke clone`);

  // ─── STEP 3: Stage semua perubahan ─────────────────────────────────────────
  console.log(`\n[3] Staging semua perubahan...`);
  const statusMatrix = await git.statusMatrix({ fs, dir: tmpDir });
  let staged = 0;
  for (const [filepath, head, workdir, stage] of statusMatrix) {
    if (workdir !== stage) {
      if (workdir === 0) {
        // File dihapus
        await git.remove({ fs, dir: tmpDir, filepath });
      } else {
        // File baru atau dimodifikasi
        await git.add({ fs, dir: tmpDir, filepath });
      }
      staged++;
    }
  }
  console.log(`   ✅ ${staged} file di-stage`);

  if (staged === 0) {
    console.log('   ℹ️  Tidak ada perubahan yang perlu di-commit!');
    return cleanup(tmpDir);
  }

  // ─── STEP 4: Commit ─────────────────────────────────────────────────────────
  console.log(`\n[4] Membuat commit...`);
  const sha = await git.commit({
    fs,
    dir: tmpDir,
    author: AUTHOR,
    committer: AUTHOR,
    message: COMMIT_MSG,
  });
  console.log(`   ✅ Commit dibuat: ${sha.slice(0, 8)}`);

  // ─── STEP 5: Push ke Gitea ──────────────────────────────────────────────────
  console.log(`\n[5] Push ke Gitea (${GITEA_URL})...`);
  try {
    await git.push({
      fs, http,
      dir: tmpDir,
      remote: 'origin',
      ref: GITEA_BRANCH,
      onAuth: () => ({ username: GITEA_USER, password: GITEA_PASS }),
      onProgress: ({ phase, loaded, total }) => {
        if (total) process.stdout.write(`\r   ${phase}: ${loaded}/${total}   `);
      },
    });
    console.log(`\n   ✅ Push ke Gitea BERHASIL! Branch: ${GITEA_BRANCH}`);
  } catch (err) {
    console.error(`\n   ❌ Push ke Gitea gagal: ${err.message}`);
  }

  // ─── STEP 6: Push ke GitHub ─────────────────────────────────────────────────
  console.log(`\n[6] Push ke GitHub (${GITHUB_URL})...`);

  // Tambah remote GitHub
  const remotes = await git.listRemotes({ fs, dir: tmpDir });
  const hasGithub = remotes.some(r => r.remote === 'github');
  if (!hasGithub) {
    await git.addRemote({ fs, dir: tmpDir, remote: 'github', url: GITHUB_URL });
  }

  // Coba push ke GitHub
  if (!GITHUB_TOKEN) {
    console.log('   ⚠️  GITHUB_TOKEN tidak di-set. GitHub push membutuhkan Personal Access Token.');
    console.log('   → Set environment variable: $env:GITHUB_TOKEN = "ghp_XXXX"');
    console.log('   → Lalu jalankan: node git-push-iso.js');
  } else {
    try {
      await git.push({
        fs, http,
        dir: tmpDir,
        remote: 'github',
        ref: GITHUB_BRANCH,
        remoteRef: GITHUB_BRANCH,
        onAuth: () => ({ username: 'Rafif-Riqullah-Siregar', password: GITHUB_TOKEN }),
        onProgress: ({ phase, loaded, total }) => {
          if (total) process.stdout.write(`\r   ${phase}: ${loaded}/${total}   `);
        },
      });
      console.log(`\n   ✅ Push ke GitHub BERHASIL! Branch: ${GITHUB_BRANCH}`);
    } catch (err) {
      console.error(`\n   ❌ Push ke GitHub gagal: ${err.message}`);
    }
  }

  cleanup(tmpDir);
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  SELESAI                                                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

function cleanup(tmpDir) {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    console.log(`\n[cleanup] Temp dir dihapus: ${tmpDir}`);
  } catch(e) {}
}

main().catch(err => {
  console.error('\n[FATAL]', err.message);
  process.exit(1);
});
