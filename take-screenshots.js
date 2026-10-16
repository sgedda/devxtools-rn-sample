const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function takeScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 }); // iPhone size
  
  const screenshotDir = path.join('/workspace/docs/screenshots/pr5');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  try {
    // Navigate to the app
    console.log('Navigating to Expo app...');
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait for app to load
    await wait(5000);
    
    // Navigate to Lab tab
    console.log('Clicking Lab tab...');
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const labLink = links.find(a => a.textContent.includes('Lab'));
      if (labLink) labLink.click();
    });
    await wait(2000);
    
    // Switch to MSW
    console.log('Switching to MSW...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('div'));
      const mswButton = buttons.find(b => b.textContent === 'MSW');
      if (mswButton) mswButton.click();
    });
    await wait(2000);
    
    // Go back to Tasks to trigger some requests
    console.log('Going to Tasks to trigger requests...');
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const tasksLink = links.find(a => a.textContent.includes('Tasks'));
      if (tasksLink) tasksLink.click();
    });
    await wait(2000);
    
    // Go back to Lab to see the log
    console.log('Returning to Lab...');
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const labLink = links.find(a => a.textContent.includes('Lab'));
      if (labLink) labLink.click();
    });
    await wait(2000);
    
    // Screenshot 1: Lab with MSW requests
    console.log('Taking screenshot 1: MSW requests...');
    await page.screenshot({ 
      path: path.join(screenshotDir, '1-msw-requests.png'),
      fullPage: false
    });
    
    // Select a scenario (Slow loading)
    console.log('Selecting slow-loading scenario...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('div'));
      const slowButton = buttons.find(b => b.textContent.includes('Slow (3s)'));
      if (slowButton) slowButton.click();
    });
    await wait(1000);
    
    // Scroll to see the log
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await wait(1000);
    
    // Screenshot 2: Divider showing scenario switch
    console.log('Taking screenshot 2: Scenario divider...');
    await page.screenshot({ 
      path: path.join(screenshotDir, '2-scenario-divider.png'),
      fullPage: false
    });
    
    // Go to tasks and back to trigger requests with new scenario
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const tasksLink = links.find(a => a.textContent.includes('Tasks'));
      if (tasksLink) tasksLink.click();
    });
    await wait(4000); // Wait for slow requests
    
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const labLink = links.find(a => a.textContent.includes('Lab'));
      if (labLink) labLink.click();
    });
    await wait(2000);
    
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await wait(1000);
    
    // Screenshot 3: Requests with new scenario tag
    console.log('Taking screenshot 3: Requests with new scenario...');
    await page.screenshot({ 
      path: path.join(screenshotDir, '3-scenario-requests.png'),
      fullPage: false
    });
    
    // Switch back to Real
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await wait(1000);
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('div'));
      const realButton = buttons.find(b => b.textContent === 'Real');
      if (realButton) realButton.click();
    });
    await wait(2000);
    
    // Scroll to see source switch divider
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await wait(1000);
    
    // Screenshot 4: Source switch divider
    console.log('Taking screenshot 4: Source switch divider...');
    await page.screenshot({ 
      path: path.join(screenshotDir, '4-source-switch.png'),
      fullPage: false
    });
    
    console.log('All screenshots captured successfully!');
  } catch (error) {
    console.error('Error taking screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

takeScreenshots().catch(console.error);
