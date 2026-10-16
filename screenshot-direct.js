const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  try {
    // Navigate directly to lab
    console.log('Loading /lab...');
    await page.goto('http://localhost:8081/lab', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));

    // Take fullpage screenshot to see what's there
    await page.screenshot({ path: '/tmp/lab-full.png', fullPage: true });
    
    // Get page content
    const html = await page.content();
    console.log('Page title:', await page.title());
    console.log('Page has MSW text:', html.includes('MSW'));
    console.log('Page has Lab text:', html.includes('Lab'));
    
  } finally {
    await browser.close();
  }
})();
