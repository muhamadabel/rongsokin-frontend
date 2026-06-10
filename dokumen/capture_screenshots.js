// capture_screenshots.js
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Absolute paths to node_modules in be-rongsok
const bePath = '/Users/mrfrog/Documents/Lomba/OLIVIA/be/be-rongsok';
const fePath = '/Users/mrfrog/Documents/Lomba/OLIVIA/fe';
const prismaPath = path.join(bePath, 'node_modules/@prisma/client');
const jwtPath = path.join(bePath, 'node_modules/jsonwebtoken');
const bcryptPath = path.join(bePath, 'node_modules/bcryptjs');

let PrismaClient;
let jwt;
let bcrypt;
try {
  PrismaClient = require(prismaPath).PrismaClient;
  jwt = require(jwtPath);
  bcrypt = require(bcryptPath);
} catch (e) {
  console.error('Error importing libraries from be-rongsok node_modules:', e.message);
  process.exit(1);
}

const prisma = new PrismaClient();
const JWT_SECRET = 'super_secret_rongsokin_jwt_key_2024_!@#';

function waitPort(port) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const interval = setInterval(() => {
      // For port 3000 (backend), ping the server
      if (port === 3000) {
        const req = http.request({ port, path: '/api/v1/auth/me', method: 'GET', timeout: 500 }, (res) => {
          clearInterval(interval);
          resolve();
        });
        req.on('error', () => {});
        req.end();
      } else {
        // For frontend, check if port is open
        const checkReq = http.request({ port, path: '/', method: 'GET', timeout: 500 }, (r) => {
          clearInterval(interval);
          resolve();
        });
        checkReq.on('error', () => {});
        checkReq.end();
      }
      
      retries++;
      if (retries > 40) {
        clearInterval(interval);
        reject(new Error(`Timeout waiting for port ${port}`));
      }
    }, 1000);
  });
}

async function setupTestData() {
  console.log('--- Setting up Test Data in Supabase ---');
  
  // Cleanup test users/orders if they exist
  await prisma.rating.deleteMany({ where: { order: { customer: { email: 'cust_ss@rongsok.test' } } } });
  await prisma.receipt.deleteMany({ where: { order: { customer: { email: 'cust_ss@rongsok.test' } } } });
  await prisma.orderCollector.deleteMany({ where: { order: { customer: { email: 'cust_ss@rongsok.test' } } } });
  await prisma.orderItem.deleteMany({ where: { order: { customer: { email: 'cust_ss@rongsok.test' } } } });
  await prisma.order.deleteMany({ where: { customer: { email: 'cust_ss@rongsok.test' } } });
  await prisma.collectorCatalog.deleteMany({ where: { collector: { user: { email: 'col_ss@rongsok.test' } } } });
  
  // Clean profile
  await prisma.collectorProfile.deleteMany({ where: { user: { email: 'col_ss@rongsok.test' } } });
  
  // Clean users
  await prisma.user.deleteMany({ where: { email: { in: ['cust_ss@rongsok.test', 'col_ss@rongsok.test'] } } });

  // 1. Create Customer
  const passwordHash = await bcrypt.hash('password123', 10);
  const customer = await prisma.user.create({
    data: {
      name: 'Customer Uji',
      email: 'cust_ss@rongsok.test',
      passwordHash: passwordHash,
      role: 'CUSTOMER',
      phone: '081234567890',
      avgRating: 4.8
    }
  });

  // Set customer location (Yogyakarta)
  await prisma.$executeRawUnsafe(
    `UPDATE "User" SET location = ST_GeographyFromText('POINT(110.3722 -7.7972)') WHERE id = $1`,
    customer.id
  );

  // 2. Create Collector & Profile
  const collector = await prisma.user.create({
    data: {
      name: 'Pengepul Uji',
      email: 'col_ss@rongsok.test',
      passwordHash: passwordHash,
      role: 'COLLECTOR',
      phone: '089876543210',
      avgRating: 4.9
    }
  });

  // Set collector location (Yogyakarta)
  await prisma.$executeRawUnsafe(
    `UPDATE "User" SET location = ST_GeographyFromText('POINT(110.3695 -7.7956)') WHERE id = $1`,
    collector.id
  );

  const colProfile = await prisma.collectorProfile.create({
    data: {
      userId: collector.id,
      shopName: 'Lapak Rongsok Jogja',
      description: 'Menerima kardus, plastik, kertas, logam, dll. Penjemputan cepat dan timbangan jujur.',
      radiusKm: 25.0,
      isOpen: true,
      isPremium: true,
      priorityScore: 10,
      maxConcurrentOrders: 5
    }
  });

  // 3. Ensure waste categories exist
  let categories = await prisma.wasteCategory.findMany();
  if (categories.length === 0) {
    console.log('Creating default categories...');
    const catData = [
      { name: 'Kardus', unit: 'kg', description: 'Kardus bekas bersih' },
      { name: 'Plastik', unit: 'kg', description: 'Botol plastik PET bening' },
      { name: 'Logam', unit: 'kg', description: 'Kaleng aluminium & besi tua' }
    ];
    for (const c of catData) {
      await prisma.wasteCategory.create({ data: c });
    }
    categories = await prisma.wasteCategory.findMany();
  }

  const kardusCat = categories.find(c => c.name.includes('Kardus')) || categories[0];
  const plastikCat = categories.find(c => c.name.includes('Plastik')) || categories[1];

  // 4. Create catalogs for collector
  await prisma.collectorCatalog.create({
    data: {
      collectorId: colProfile.id,
      categoryId: kardusCat.id,
      minPrice: 2000,
      maxPrice: 3000,
      isActive: true
    }
  });
  await prisma.collectorCatalog.create({
    data: {
      collectorId: colProfile.id,
      categoryId: plastikCat.id,
      minPrice: 1500,
      maxPrice: 2500,
      isActive: true
    }
  });

  // 5. Create Completed Order & Receipt
  const completedOrder = await prisma.order.create({
    data: {
      customerId: customer.id,
      collectorId: collector.id,
      categoryId: kardusCat.id,
      method: 'PICKUP',
      photoUrl: 'https://res.cloudinary.com/djh7hbugg/image/upload/v1717830000/kardus.jpg',
      transactionProofUrl: 'https://res.cloudinary.com/djh7hbugg/image/upload/v1717830001/timbangan.jpg',
      estimatedWeight: 10.0,
      actualWeight: 8.5,
      agreedPrice: 3000,
      totalPrice: 25500, // 8.5 * 3000
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      updatedAt: new Date()
    }
  });

  await prisma.orderItem.create({
    data: {
      orderId: completedOrder.id,
      categoryId: kardusCat.id,
      estimatedWeight: 10.0,
      actualWeight: 8.5,
      agreedPrice: 3000,
      notes: 'Kardus bersih bergelombang'
    }
  });

  await prisma.receipt.create({
    data: {
      orderId: completedOrder.id,
      detailsJson: {
        buyer: 'Lapak Rongsok Jogja',
        seller: 'Customer Uji',
        items: [
          { category: 'Kardus', weight: 8.5, pricePerKg: 3000, subtotal: 25500 }
        ],
        total: 25500,
        paymentMethod: 'COD'
      }
    }
  });

  // 6. Create Active Pending Order (for dashboard map & user queue)
  const pendingOrder = await prisma.order.create({
    data: {
      customerId: customer.id,
      categoryId: plastikCat.id,
      method: 'PICKUP',
      photoUrl: 'https://res.cloudinary.com/djh7hbugg/image/upload/v1717830002/plastik.jpg',
      estimatedWeight: 5.0,
      status: 'PENDING',
      createdAt: new Date()
    }
  });

  // Map pending order to the collector so they see it in their dashboard queue
  await prisma.orderCollector.create({
    data: {
      orderId: pendingOrder.id,
      collectorId: collector.id,
      status: 'notified'
    }
  });

  await prisma.orderItem.create({
    data: {
      orderId: pendingOrder.id,
      categoryId: plastikCat.id,
      estimatedWeight: 5.0
    }
  });

  console.log('Test accounts and orders successfully set up in Supabase.');
  
  // Sign tokens
  const custToken = jwt.sign({ id: customer.id, email: customer.email, role: customer.role }, JWT_SECRET);
  const colToken = jwt.sign({ id: collector.id, email: collector.email, role: collector.role }, JWT_SECRET);
  const adminToken = jwt.sign({ id: 'admin-id', email: 'admin@rongsok.in', role: 'ADMIN' }, JWT_SECRET);

  return {
    customer,
    collector,
    custToken,
    colToken,
    adminToken,
    completedOrder,
    pendingOrder
  };
}

async function runCapture() {
  let beProcess, feProcess;
  let browser, page;
  const ssDir = '/Users/mrfrog/Documents/Lomba/OLIVIA/fe/public/screenshots';
  
  try {
    const testData = await setupTestData();
    
    console.log('--- Starting Servers ---');
    
    // Spawn Backend
    beProcess = spawn('npm', ['start'], { 
      cwd: bePath,
      env: { ...process.env, PORT: '3000', JWT_SECRET: JWT_SECRET }
    });
    beProcess.stdout.on('data', (data) => console.log(`[BE]: ${data.toString().trim()}`));
    beProcess.stderr.on('data', (data) => console.error(`[BE ERR]: ${data.toString().trim()}`));
    
    // Spawn Frontend
    feProcess = spawn('npx', ['next', 'dev', '-p', '3001'], { 
      cwd: fePath
    });
    feProcess.stdout.on('data', (data) => console.log(`[FE]: ${data.toString().trim()}`));
    feProcess.stderr.on('data', (data) => console.error(`[FE ERR]: ${data.toString().trim()}`));

    console.log('Waiting for backend and frontend to become available...');
    await waitPort(3000);
    await waitPort(3001);
    console.log('Both servers are running successfully.');

    // Start Puppeteer
    console.log('--- Launching Puppeteer ---');
    const puppeteer = require('/Users/mrfrog/Documents/Lomba/OLIVIA/fe/node_modules/puppeteer');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Directory for saving screenshots
    if (!fs.existsSync(ssDir)) {
      fs.mkdirSync(ssDir, { recursive: true });
    }

    // Override Geolocation permissions
    const context = browser.defaultBrowserContext();
    await context.overridePermissions('http://localhost:3001', ['geolocation']);
    await page.setGeolocation({ latitude: -7.7972, longitude: 110.3722 });

    // Define helper to set localStorage auth state
    const setAuth = async (token, user) => {
      await page.evaluate((t, u) => {
        localStorage.setItem('token', t);
        localStorage.setItem('user', JSON.stringify(u));
      }, token, user);
    };

    const clearAuth = async () => {
      await page.evaluate(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
    };

    // 1. Landing Page
    console.log('Capturing: 1_landing_page.png');
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ssDir, '1_landing_page.png') });

    // 2. Register & Login Page
    console.log('Capturing: 2_register_login.png');
    await page.setViewport({ width: 1280, height: 900 }); // desktop view
    await page.goto('http://localhost:3001/register', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Select 'Pengepul (Collector)' Card
    await page.evaluate(() => {
      // Find the button directly
      const btns = Array.from(document.querySelectorAll('button'));
      const colBtn = btns.find(x => x.textContent.includes('Pengepul (Collector)') || x.textContent.includes('Beli rongsokan'));
      if (colBtn) {
        colBtn.click();
        console.log('Clicked collector button directly');
      } else {
        const divs = Array.from(document.querySelectorAll('div, h3'));
        const colCard = divs.find(x => x.textContent.includes('Pengepul (Collector)') || x.textContent.includes('Beli rongsokan'));
        if (colCard) {
          colCard.click();
          console.log('Clicked collector card div/h3');
        } else {
          console.error('Collector card not found');
        }
      }
    });
    await page.waitForTimeout(1000);
    
    // Take a debug screenshot before clicking Lanjut
    await page.screenshot({ path: path.join(ssDir, 'debug_register_step1.png') });
    
    // Click 'Lanjut' button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(x => x.textContent.includes('Lanjut'));
      if (nextBtn) {
        nextBtn.click();
        console.log('Clicked Lanjut button');
      } else {
        console.error('Lanjut button not found');
      }
    });
    await page.waitForTimeout(1500); // Wait for Step 2 to render
    
    // Take a debug screenshot after clicking Lanjut
    await page.screenshot({ path: path.join(ssDir, 'debug_register_step2_before_type.png') });
    
    // Type Biodata inputs in Step 2
    await page.waitForSelector('input[placeholder="budi@gmail.com"]');
    await page.type('input[placeholder="budi@gmail.com"]', 'budi_ss@rongsok.test');
    await page.type('input[placeholder="08123456789"]', '089876543210');
    await page.type('input[placeholder="Minimal 8 karakter"]', 'password123');
    await page.screenshot({ path: path.join(ssDir, '2_register_login.png') });

    // 3. Customer Dashboard
    console.log('Capturing: 3_customer_dashboard.png');
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle2' });
    await setAuth(testData.custToken, testData.customer);
    await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ssDir, '3_customer_dashboard.png') });

    // 4. New Order Form
    console.log('Capturing: 4_new_order_form.png');
    await page.goto('http://localhost:3001/orders/new', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Click Kardus category card
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const kardusCard = btns.find(x => x.textContent.includes('Kardus') || x.textContent.includes('Kertas'));
      if (kardusCard) {
        kardusCard.click();
        console.log('Clicked Kardus/Kertas category button');
      } else {
        console.error('Kardus/Kertas category button not found');
      }
    });
    await page.waitForTimeout(1000);
    
    // Click Lanjut button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(x => x.textContent.includes('Lanjut ke Detail'));
      if (nextBtn) {
        nextBtn.click();
        console.log('Clicked Lanjut ke Detail button');
      } else {
        console.error('Lanjut ke Detail button not found');
      }
    });
    await page.waitForTimeout(1500); // Wait for Step 2
    
    // Type weight
    await page.waitForSelector('input[placeholder="0"]');
    await page.type('input[placeholder="0"]', '12.5');
    await page.screenshot({ path: path.join(ssDir, '4_new_order_form.png') });

    // 7. KTP OCR Verification
    console.log('Capturing: 7_ktp_ocr_verify.png');
    await page.goto('http://localhost:3001/profile/verify', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ssDir, '7_ktp_ocr_verify.png') });

    // 8. Order Tracking & Digital Receipt (completed)
    console.log('Capturing: 8_order_receipt.png');
    await page.goto(`http://localhost:3001/orders/${testData.completedOrder.id}`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ssDir, '8_order_receipt.png') });

    // 5. Collector Dashboard (Desktop Map)
    console.log('Capturing: 5_collector_dashboard.png');
    await page.setViewport({ width: 1280, height: 900 });
    await clearAuth();
    await setAuth(testData.colToken, testData.collector);
    await page.goto('http://localhost:3001/collector', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(5000); // Wait for Leaflet map grid and markers to render
    await page.screenshot({ path: path.join(ssDir, '5_collector_dashboard.png') });

    // 6. Collector COD & Stats
    console.log('Capturing: 6_collector_cod_stats.png');
    // Scroll down to the purchase history & COD card
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight || 600);
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ssDir, '6_collector_cod_stats.png') });

    await browser.close();
    console.log('Screenshots captured and saved to public/screenshots successfully.');

  } catch (error) {
    console.error('An error occurred during capture:', error);
    try {
      if (page && !page.isClosed()) {
        await page.screenshot({ path: path.join(ssDir, 'error_capture.png') });
        console.log('Error screenshot saved to error_capture.png');
      }
    } catch (ssErr) {
      console.error('Failed to take error screenshot:', ssErr);
    }
  } finally {
    console.log('Stopping servers...');
    if (beProcess) beProcess.kill('SIGINT');
    if (feProcess) feProcess.kill('SIGINT');
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Puppeteer Page waitForTimeout fallback
if (typeof require !== 'undefined') {
  try {
    const puppeteer = require('/Users/mrfrog/Documents/Lomba/OLIVIA/fe/node_modules/puppeteer');
    puppeteer.Page.prototype.waitForTimeout = function (ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    };
  } catch (e) {}
}

runCapture();
