const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    let config = {
        ip: "172.31.147.200",
        username: "",
        password: "",
        koneksi: "sim",
        cabang: "spibdg2t",
        headless: false
    };

    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
        try {
            config = { ...config, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) };
        } catch (e) {}
    }

    let tglArg = process.argv[2];
    if (!tglArg || !/^\d{4}-\d{2}-\d{2}$/.test(tglArg)) {
        const now = new Date();
        const yNow = now.getFullYear();
        const mNow = String(now.getMonth() + 1).padStart(2, '0');
        const dNow = String(now.getDate()).padStart(2, '0');
        tglArg = `${yNow}-${mNow}-${dNow}`;
    }

    const [y, m, d] = tglArg.split('-');
    const dtSlash   = `${d}/${m}/${y}`;
    const dtDash    = `${d}-${m}-${y}`;
    const dtCompact = `${d}${m}${y.slice(-2)}`;

    const base = `http://${config.ip}/fo/laporan-kasir/`;

    const listLaporan = [
        {
            filename: `LAP 310 ${dtCompact}.pdf`,
            url: `${base}actual/cetak-sales?tanggal=${dtSlash}`,
            title: 'LAP 310'
        },
        {
            filename: `SALDOKLIK ${dtCompact}.pdf`,
            url: `${base}actual/cetak-saldoklik?tanggal=${dtSlash}`,
            title: 'SALDOKLIK'
        },
        {
            filename: `VIRTUAL ACCOUNT ${dtCompact}.pdf`,
            url: `${base}actual/cetak-virtual?tanggal=${dtSlash}`,
            title: 'VIRTUAL ACCOUNT'
        },
        {
            filename: `ISAKU ${dtCompact}.pdf`,
            url: `${base}actual/cetak-isaku?tanggal=${dtSlash}`,
            title: 'ISAKU'
        },
        {
            filename: `CB-NK ${dtCompact}.pdf`,
            url: `${base}actual/cetak-cb-nk?tanggal=${dtSlash}`,
            title: 'CB-NK'
        },
        {
            filename: `KREDIT ${dtCompact}.pdf`,
            url: `${base}actual/cetak-kredit?tanggal=${dtSlash}`,
            title: 'KREDIT'
        },
        {
            filename: `LAP CB PER ITEM ${dtCompact}.pdf`,
            url: `${base}cei/printdoc?dateA=${dtDash}&dateB=${dtDash}&event1=nodata&event2=nodata&dimensions=all&type_laporan=promosi`,
            title: 'LAP CB PER ITEM'
        },
        {
            filename: `VOUCHER ${dtCompact}.pdf`,
            url: `${base}transaksivoucher/print?date1=${dtDash}&date2=${dtDash}`,
            title: 'VOUCHER'
        },
        {
            filename: `REKAP STRUK PER KASIR ${dtCompact}.pdf`,
            url: `${base}strukperkasir/printstruk?date1=${dtDash}&date2=${dtDash}&type=S`,
            title: 'REKAP STRUK PER KASIR'
        },
        {
            filename: `LAP PENJUALAN ${dtCompact}.pdf`,
            url: `${base}penjualan/printdocumentmenu2?date1=${dtDash}&date2=${dtDash}&grosira=F&export=T&export_type=pdf&lst_print=INDOGROSIR`,
            title: 'LAP PENJUALAN'
        }
    ];

    const targetFolder = path.join(__dirname, 'laporan', tglArg);
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
    }

    const sessionDir = path.join(__dirname, 'browser_session');
    let browser;

    try {
        browser = await puppeteer.launch({
            headless: false,
            userDataDir: sessionDir,
            defaultViewport: null,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--start-maximized',
                '--disable-web-security'
            ]
        });

        const page = await browser.newPage();

        await page.evaluateOnNewDocument(() => {
            window.print = () => {};
        });

        page.on('dialog', async dialog => {
            try { await dialog.accept(); } catch(e){}
        });

        const savedFiles = [];

        for (let i = 0; i < listLaporan.length; i++) {
            const item = listLaporan[i];
            const filePath = path.join(targetFolder, item.filename);
            console.log(`[PROGRES ${i + 1}/${listLaporan.length}] Mengambil: ${item.filename}...`);

            try {
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

                savedFiles.push({
                    name: item.filename,
                    title: item.title,
                    path: filePath,
                    size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
                });

            } catch (errItem) {
                console.error(`   [GAGAL] ${item.filename}: ${errItem.message}`);
            }
        }

        console.log(`[SELESAI] Tersimpan ${savedFiles.length} laporan.`);
        console.log(JSON.stringify({
            status: 'success',
            total: savedFiles.length,
            targetTotal: listLaporan.length,
            folder: targetFolder,
            tanggal: tglArg,
            files: savedFiles.map(f => f.name)
        }));

    } catch (err) {
        console.error(`[ERROR UTAMA] ${err.message}`);
        console.log(JSON.stringify({ status: 'error', message: err.message }));
        process.exitCode = 1;
    } finally {
        if (browser) {
            try { await browser.close(); } catch (e) {}
        }
    }
})();
