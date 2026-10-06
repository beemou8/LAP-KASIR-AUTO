const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = 6767;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let botStatus = {
    running: false,
    step: 0,
    total: 11,
    currentFile: '',
    message: 'Bot Siap Melayani',
    lastResult: null
};

// 1. Cek Status Bot
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        port: PORT,
        message: 'Bot Laporan Kasir Puppeteer Aktif',
        botStatus
    });
});

app.get('/api/status', (req, res) => {
    res.json(botStatus);
});

// Helper: Login IAS (Pemancing / User Asli)
async function lakukanLoginIAS(page, ip, u, p, kon, isPemancing = false) {
    console.log(`[LOGIN] Menuju http://${ip}/login (User: ${u}, Koneksi: ${kon})...`);
    await page.goto(`http://${ip}/login`, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 1000));

    // 1. Pilih Dropdown Koneksi (SIMULASI / PRODUCTION)
    await page.evaluate((koneksiPilihan) => {
        const selects = document.querySelectorAll('select');
        selects.forEach(selectBox => {
            Array.from(selectBox.options).forEach(opt => {
                const optText = opt.text.toUpperCase();
                const optVal  = opt.value.toUpperCase();
                const target  = koneksiPilihan.toUpperCase();
                if (optText.includes(target) || optVal === target || (target === 'SIM' && optVal === 'SIM') || (target === 'PROD' && optVal === 'PROD')) {
                    selectBox.value = opt.value;
                    selectBox.dispatchEvent(new Event('change'));
                }
            });
        });
    }, kon);

    // 2. Ketik Username & Password
    await page.waitForSelector('#username', { timeout: 10000 });
    await page.click('#username', { clickCount: 3 });
    await page.type('#username', u, { delay: 40 });

    await page.waitForSelector('#password', { timeout: 10000 });
    await page.click('#password', { clickCount: 3 });
    await page.type('#password', p, { delay: 40 });

    await page.keyboard.press('Enter');

    // Klik tombol submit login
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, a, input[type="submit"]'));
        const loginBtn = btns.find(b => b.innerText.toLowerCase().includes('login') || (b.value && b.value.toLowerCase().includes('login')));
        if (loginBtn) loginBtn.click();
    });

    console.log(`[LOGIN] Memeriksa respons popup IAS (User: ${u})...`);
    let pesanErrorLogin = "";

    // 3. Tangani SweetAlert Pop-up
    for (let i = 1; i <= 8; i++) {
        await new Promise(r => setTimeout(r, 1000));
        try {
            const popupResult = await page.evaluate(() => {
                let btnOk = document.querySelector('.swal-button--confirm, .swal2-confirm, .swal2-styled');
                if (!btnOk) {
                    const btns = Array.from(document.querySelectorAll('button'));
                    btnOk = btns.find(b => b.textContent && b.textContent.trim().toUpperCase() === 'OK');
                }

                if (btnOk && btnOk.offsetParent !== null) {
                    let titleEl = document.querySelector('.swal-title, .swal2-title');
                    let textEl = document.querySelector('.swal-text, .swal2-html-container, .swal2-content');
                    let titleText = titleEl ? titleEl.innerText.trim() : "";
                    let bodyText = textEl ? textEl.innerText.trim() : "";
                    let fullText = `${titleText} - ${bodyText}`.trim();
                    btnOk.click();
                    return { clicked: true, msg: fullText };
                }
                return { clicked: false, msg: "" };
            });

            if (popupResult.clicked) {
                console.log(`[LOGIN] Popup terdeteksi: ${popupResult.msg}`);
                const msgUpper = popupResult.msg.toUpperCase();
                if (msgUpper.includes('TIDAK DITEMUKAN') || msgUpper.includes('SALAH') || msgUpper.includes('BELUM TERDAFTAR') || msgUpper.includes('GAGAL')) {
                    pesanErrorLogin = popupResult.msg;
                }
                await new Promise(r => setTimeout(r, 1200));
                break;
            }
        } catch (e) {}
    }

    if (pesanErrorLogin !== "" && !isPemancing) {
        throw new Error(`${pesanErrorLogin}`);
    }

    if (isPemancing) {
        console.log(`[LOGIN] Pemancing (rst) selesai. Logout dan siapkan user asli...`);
        try {
            await page.goto(`http://${ip}/logout`, { waitUntil: 'domcontentloaded', timeout: 10000 });
        } catch (e) {}
        await page.goto(`http://${ip}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        return;
    }

    // Tunggu verifikasi login user asli
    let isSuccess = false;
    for (let detik = 1; detik <= 20; detik++) {
        await new Promise(r => setTimeout(r, 1000));
        const isPasswordBoxGone = await page.evaluate(() => {
            const passBox = document.querySelector('input[type="password"]');
            return passBox === null || passBox.offsetParent === null;
        });
        if (isPasswordBoxGone || !page.url().includes('/login')) {
            isSuccess = true;
            console.log(`[LOGIN] Dashboard terbuka! Berhasil masuk dalam ${detik} detik.`);
            break;
        }
    }

    if (!isSuccess && !page.url().includes('/login')) {
        isSuccess = true;
    }

    if (!isSuccess) {
        throw new Error(`Login Gagal untuk User: ${u}. Pastikan Username, Password, dan Koneksi sudah benar.`);
    }
}

// 2. Endpoint Eksekusi Penarikan Laporan
app.all(['/api/tarik', '/api/generate-pdf'], async (req, res) => {
    if (botStatus.running) {
        return res.status(409).json({
            status: 'busy',
            message: 'Bot sedang sibuk memproses penarikan laporan lain. Harap tunggu.',
            botStatus
        });
    }

    let tanggal  = req.body.tanggal  || req.query.tanggal;
    let koneksi  = req.body.koneksi  || req.query.koneksi  || 'SIMULASI';
    let username = req.body.username || req.query.username || '';
    let password = req.body.password || req.query.password || '';

    if (!tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
        const now = new Date();
        const yNow = now.getFullYear();
        const mNow = String(now.getMonth() + 1).padStart(2, '0');
        const dNow = String(now.getDate()).padStart(2, '0');
        tanggal = `${yNow}-${mNow}-${dNow}`;
    }

    const [y, m, d] = tanggal.split('-');
    const dtSlash   = `${d}/${m}/${y}`;          // 05/10/2026
    const dtDash    = `${d}-${m}-${y}`;          // 05-10-2026
    const dtCompact = `${d}${m}${y.slice(-2)}`;  // 051026 (DDMMYY)

    let config = {
        ip: "172.31.147.200"
    };

    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
        try {
            config = { ...config, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) };
        } catch (e) {}
    }

    const base = `http://${config.ip}/fo/laporan-kasir/`;

    // 11 Laporan Lengkap (10 PDF + 1 Excel)
    const listLaporan = [
        {
            filename: `LAP 310 ${dtCompact}.pdf`,
            url: `${base}actual/cetak-sales?tanggal=${dtSlash}`,
            title: 'LAP 310',
            type: 'pdf'
        },
        {
            filename: `SALDOKLIK ${dtCompact}.pdf`,
            url: `${base}actual/cetak-saldoklik?tanggal=${dtSlash}`,
            title: 'SALDOKLIK',
            type: 'pdf'
        },
        {
            filename: `VIRTUAL ACCOUNT ${dtCompact}.pdf`,
            url: `${base}actual/cetak-virtual?tanggal=${dtSlash}`,
            title: 'VIRTUAL ACCOUNT',
            type: 'pdf'
        },
        {
            filename: `ISAKU ${dtCompact}.pdf`,
            url: `${base}actual/cetak-isaku?tanggal=${dtSlash}`,
            title: 'ISAKU',
            type: 'pdf'
        },
        {
            filename: `CB-NK ${dtCompact}.pdf`,
            url: `${base}actual/cetak-cb-nk?tanggal=${dtSlash}`,
            title: 'CB-NK',
            type: 'pdf'
        },
        {
            filename: `KREDIT ${dtCompact}.pdf`,
            url: `${base}actual/cetak-kredit?tanggal=${dtSlash}`,
            title: 'KREDIT',
            type: 'pdf'
        },
        {
            filename: `LAP CB PER ITEM ${dtCompact}.pdf`,
            url: `${base}cei/printdoc?dateA=${dtDash}&dateB=${dtDash}&event1=nodata&event2=nodata&dimensions=all&type_laporan=promosi`,
            title: 'LAP CB PER ITEM',
            type: 'pdf'
        },
        {
            filename: `VOUCHER ${dtCompact}.pdf`,
            url: `${base}transaksivoucher/print?date1=${dtDash}&date2=${dtDash}`,
            title: 'VOUCHER',
            type: 'pdf'
        },
        {
            filename: `REKAP STRUK PER KASIR ${dtCompact}.pdf`,
            url: `${base}strukperkasir/printstruk?date1=${dtDash}&date2=${dtDash}&type=S`,
            title: 'REKAP STRUK PER KASIR',
            type: 'pdf'
        },
        {
            filename: `LAP PENJUALAN ${dtCompact}.pdf`,
            url: `${base}penjualan/printdocumentmenu2?date1=${dtDash}&date2=${dtDash}&grosira=F&export=T&export_type=pdf&lst_print=INDOGROSIR`,
            title: 'LAP PENJUALAN',
            type: 'pdf'
        },
        {
            filename: `LAP CB PER SUPLIER ${dtCompact}.xlsx`,
            url: `${base}csi/printdoc/${dtDash}/${dtDash}/S/nodata/nodata`,
            pageUrl: `${base}csi`,
            title: 'LAP CB PER SUPLIER',
            type: 'excel'
        }
    ];

    const targetFolder = path.join(__dirname, 'laporan', tanggal);
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
    }

    botStatus = {
        running: true,
        step: 0,
        total: listLaporan.length,
        currentFile: '',
        message: 'Membuka jendela browser di taskbar...',
        lastResult: null
    };

    console.log(`\n========================================`);
    console.log(`[BOT:6767] Eksekusi Penarikan 11 Laporan`);
    console.log(`Tanggal  : ${dtDash} (${dtCompact})`);
    console.log(`Koneksi  : ${koneksi}`);
    console.log(`Username : ${username || '(kosong)'}`);
    console.log(`Folder   : ${targetFolder}`);
    console.log(`========================================`);

    const sessionDir = path.join(__dirname, 'browser_session');
    let browser;

    try {
        // Buka browser dengan headless: false agar muncul di taskbar
        browser = await puppeteer.launch({
            headless: false,
            userDataDir: sessionDir,
            defaultViewport: null,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--window-size=1366,768',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-web-security'
            ]
        });

        const page = await browser.newPage();

        await page.evaluateOnNewDocument(() => {
            window.print = () => {};
        });

        page.on('dialog', async dialog => {
            try { await dialog.accept(); } catch (e) {}
        });

        // ============================================================
        // STEP 0: LOGOUT TERLEBIH DAHULU (SESUAI REQUEST USER)
        // ============================================================
        botStatus.message = 'Langkah 0/3: Logout sesi sebelumnya...';
        console.log(`-> (Step 0) Memastikan logout terlebih dahulu...`);
        try {
            await page.goto(`http://${config.ip}/logout`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        } catch (e) {
            try {
                await page.goto(`http://${config.ip}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
            } catch (e2) {}
        }
        await new Promise(r => setTimeout(r, 1000));

        // ============================================================
        // STEP 1: LOGIN PEMANCING (rst / rst)
        // ============================================================
        botStatus.message = 'Langkah 1/3: Menjalankan Login Pemancing (rst)...';
        console.log(`-> (Step 1) Login Pemancing (rst)...`);
        try {
            await lakukanLoginIAS(page, config.ip, 'rst', 'rst', koneksi, true);
        } catch (errPemancing) {
            console.log(`   [INFO] Pemancing: ${errPemancing.message}`);
        }

        // ============================================================
        // STEP 2: LOGIN USER ASLI
        // ============================================================
        if (username && password) {
            botStatus.message = `Langkah 2/3: Login User Asli (${username})...`;
            console.log(`-> (Step 2) Login User Asli (${username})...`);
            await lakukanLoginIAS(page, config.ip, username, password, koneksi, false);
        }

        // ============================================================
        // STEP 3: UNDUH KE-11 LAPORAN
        // ============================================================
        const savedFiles = [];

        for (let i = 0; i < listLaporan.length; i++) {
            const item = listLaporan[i];
            const filePath = path.join(targetFolder, item.filename);

            botStatus.step = i + 1;
            botStatus.currentFile = item.filename;
            botStatus.message = `[${i + 1}/${listLaporan.length}] Mengambil: ${item.filename}...`;

            console.log(`[BOT:6767] [${i + 1}/${listLaporan.length}] Mengambil: ${item.filename}...`);

            try {
                if (item.type === 'excel' || item.filename.endsWith('.xlsx')) {
                    // Kasus Excel (CSI Cash Back per Supplier)
                    if (item.pageUrl) {
                        await page.goto(item.pageUrl, { waitUntil: 'domcontentloaded', timeout: 35000 }).catch(() => {});
                        await new Promise(r => setTimeout(r, 600));
                    }

                    const excelBase64 = await page.evaluate(async (u) => {
                        const r = await fetch(u);
                        const b = await r.blob();
                        return new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result.split(',')[1]);
                            reader.readAsDataURL(b);
                        });
                    }, item.url);

                    if (excelBase64) {
                        const rawBuffer = Buffer.from(excelBase64, 'base64');
                        fs.writeFileSync(filePath, rawBuffer);
                        console.log(`   -> [Excel Asli] Berhasil disimpan: ${item.filename} (${rawBuffer.length} bytes)`);
                    }
                } else {
                    // Kasus PDF
                    const docInfo = await page.evaluate(async (u) => {
                        const r = await fetch(u);
                        const buf = await r.arrayBuffer();
                        const header = new TextDecoder().decode(buf.slice(0, 10));
                        const isPdf = header.startsWith('%PDF');
                        let base64 = null;
                        if (isPdf) {
                            const b = new Blob([buf]);
                            base64 = await new Promise((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                                reader.readAsDataURL(b);
                            });
                        }
                        return { isPdf, base64 };
                    }, item.url);

                    if (docInfo.isPdf && docInfo.base64) {
                        const rawBuffer = Buffer.from(docInfo.base64, 'base64');
                        fs.writeFileSync(filePath, rawBuffer);
                        console.log(`   -> [PDF Asli] Berhasil disimpan: ${item.filename} (${rawBuffer.length} bytes)`);
                    } else {
                        await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 35000 });
                        await new Promise(r => setTimeout(r, 600));

                        await page.pdf({
                            path: filePath,
                            format: 'A4',
                            printBackground: true,
                            margin: { top: '8mm', right: '8mm', bottom: '8mm', left: '8mm' }
                        });
                        console.log(`   -> [HTML Render] Berhasil dirender: ${item.filename}`);
                    }
                }

                savedFiles.push({
                    name: item.filename,
                    title: item.title,
                    path: filePath,
                    size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
                });

            } catch (errItem) {
                console.error(`[BOT:6767] Gagal ambil ${item.filename}: ${errItem.message}`);
            }
        }

        const resultData = {
            status: 'success',
            message: `Berhasil mengunduh dan menamai ${savedFiles.length} dari ${listLaporan.length} laporan!`,
            total: savedFiles.length,
            targetTotal: listLaporan.length,
            tanggal,
            koneksi,
            folder: targetFolder,
            files: savedFiles.map(f => f.name)
        };

        botStatus.running = false;
        botStatus.message = 'Penarikan selesai!';
        botStatus.lastResult = resultData;

        console.log(`[BOT:6767] Selesai! ${savedFiles.length} file tersimpan di: ${targetFolder}\n`);
        return res.json(resultData);

    } catch (err) {
        botStatus.running = false;
        botStatus.message = `Terjadi kesalahan: ${err.message}`;

        console.error(`[BOT:6767 ERROR] ${err.message}`);
        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    } finally {
        if (browser) {
            try { await browser.close(); } catch (e) {}
        }
    }
});

// 3. Endpoint Buka Folder di Windows Explorer
app.all('/api/open-folder', (req, res) => {
    let tanggal = req.body.tanggal || req.query.tanggal;
    let targetDir = path.join(__dirname, 'laporan');
    if (tanggal && /^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
        const sub = path.join(targetDir, tanggal);
        if (fs.existsSync(sub)) targetDir = sub;
    }

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    exec(`explorer "${targetDir}"`);
    res.json({ status: 'success', folder: targetDir });
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`===================================================`);
    console.log(`🚀 BOT LAPORAN KASIR AKTIF (Port Bot: ${PORT})`);
    console.log(`👉 Buka di PC Host : http://localhost:8080/lap-kasir`);
    console.log(`👉 Buka dari PC Lain: http://172.26.22.6:8080/lap-kasir`);
    console.log(`===================================================`);
    console.log(`Status: Standby menunggu klik dari browser...`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: Port ${PORT} sedang dipakai oleh proses lain!`);
        console.error(`Tutup jendela CMD atau proses node lain yang sedang memakai port ${PORT}.\n`);
    } else {
        console.error(`\n❌ SERVER ERROR:`, err.message);
    }
});

process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION]', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED REJECTION]', reason);
});
