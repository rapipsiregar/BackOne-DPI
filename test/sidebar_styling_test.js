// test/sidebar_styling_test.js
const fs = require('fs');
const path = require('path');

const sidebarPath = path.join(__dirname, '../src/components/layout/Sidebar.tsx');
const siteSelectorPath = path.join(__dirname, '../src/components/layout/SidebarSiteSelector.tsx');
const timeSelectorPath = path.join(__dirname, '../src/components/layout/SidebarTimeSelector.tsx');
const globalsCssPath = path.join(__dirname, '../src/app/globals.css');
const agentsPagePath = path.join(__dirname, '../src/app/(dashboard)/agents/page.tsx');

let testCount = 0;
let passedCount = 0;

function assert(label, condition) {
  testCount++;
  if (condition) {
    console.log(`  ✓ PASSED: ${label}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAILED: ${label}`);
  }
}

function runTests() {
  console.log('\n=========================================');
  console.log('  RUNNING TDD TESTS FOR SIDEBAR & PAGE STYLING');
  console.log('=========================================\n');

  try {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
    assert(
      'Sidebar.tsx should use Times New Roman font family stack',
      sidebarContent.includes("'Times New Roman', Times, serif")
    );
    assert(
      'Sidebar.tsx link items should be compact (text-xs or text-[13px])',
      sidebarContent.includes('text-xs') || sidebarContent.includes('text-[13px]')
    );
  } catch (err) {
    assert(`Sidebar.tsx read error: ${err.message}`, false);
  }

  try {
    const siteSelectorContent = fs.readFileSync(siteSelectorPath, 'utf8');
    assert(
      'SidebarSiteSelector.tsx should use Times New Roman font family stack',
      siteSelectorContent.includes("'Times New Roman', Times, serif")
    );
    assert(
      'SidebarSiteSelector.tsx label should use correct size (text-[9.5px] to text-[10.5px])',
      siteSelectorContent.includes('text-[10px]') || siteSelectorContent.includes('text-[10.5px]') || siteSelectorContent.includes('text-[9.5px]')
    );
    assert(
      'SidebarSiteSelector.tsx value should use correct size (text-xs or text-sm)',
      siteSelectorContent.includes('text-xs') || siteSelectorContent.includes('text-sm') || siteSelectorContent.includes('text-[13.5px]')
    );
  } catch (err) {
    assert(`SidebarSiteSelector.tsx read error: ${err.message}`, false);
  }

  try {
    const timeSelectorContent = fs.readFileSync(timeSelectorPath, 'utf8');
    assert(
      'SidebarTimeSelector.tsx should use Times New Roman font family stack',
      timeSelectorContent.includes("'Times New Roman', Times, serif")
    );
    assert(
      'SidebarTimeSelector.tsx label should use correct size (text-[9.5px] to text-[10.5px])',
      timeSelectorContent.includes('text-[10px]') || timeSelectorContent.includes('text-[10.5px]') || timeSelectorContent.includes('text-[9.5px]')
    );
    assert(
      'SidebarTimeSelector.tsx value should use correct size (text-xs or text-sm)',
      timeSelectorContent.includes('text-xs') || timeSelectorContent.includes('text-sm') || timeSelectorContent.includes('text-[13.5px]')
    );
  } catch (err) {
    assert(`SidebarTimeSelector.tsx read error: ${err.message}`, false);
  }

  try {
    const globalsCssContent = fs.readFileSync(globalsCssPath, 'utf8');
    assert(
      'globals.css body rule should enforce Times New Roman font-family',
      globalsCssContent.includes("font-family: 'Times New Roman', Times, serif;")
    );
  } catch (err) {
    assert(`globals.css read error: ${err.message}`, false);
  }

  try {
    const agentsPageContent = fs.readFileSync(agentsPagePath, 'utf8');
    assert(
      'agents/page.tsx should display "Agents Inventory" title',
      agentsPageContent.includes('Agents Inventory')
    );
    assert(
      'agents/page.tsx should display subtitle description',
      agentsPageContent.includes('Managed DPI probes, remote collectors, and probe infrastructure.')
    );
    assert(
      'agents/page.tsx header should not render the Server icon',
      !agentsPageContent.includes('<Server className=') && !agentsPageContent.includes('<Server ')
    );
  } catch (err) {
    assert(`agents/page.tsx read error: ${err.message}`, false);
  }

  console.log('\n=========================================');
  console.log(`  RESULT: ${passedCount}/${testCount} tests passed`);
  console.log('=========================================\n');

  if (passedCount !== testCount) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
