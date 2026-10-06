<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Kasir</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap" rel="stylesheet">
    <style>
        body { 
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: #f5f5f7;
            color: #1d1d1f;
            -webkit-font-smoothing: antialiased;
        }

        .apple-card {
            background: #ffffff;
            border: 1px solid rgba(0, 0, 0, 0.06);
            box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.05);
        }

        .apple-input {
            background-color: #fbfbfd;
            border: 1px solid #d2d2d7;
            color: #1d1d1f;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .apple-input:focus {
            background-color: #ffffff;
            border-color: #0071e3;
            box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.12);
        }

        .apple-btn-primary {
            background-color: #0071e3;
            color: #ffffff;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .apple-btn-primary:hover {
            background-color: #0077ed;
        }

        .apple-btn-primary:active {
            transform: scale(0.98);
        }

        .apple-pill-active {
            background-color: #ffffff;
            color: #1d1d1f;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .apple-pill-inactive {
            color: #86868b;
        }

        .apple-pill-inactive:hover {
            color: #1d1d1f;
        }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4 selection:bg-blue-100">

    <div class="max-w-[420px] w-full py-8">
        
        <!-- Apple Minimal Card -->
        <div class="apple-card rounded-[28px] p-8 space-y-7">
            
            <!-- Header & Motivational Line -->
            <div class="text-center space-y-2">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#f5f5f7] mb-1">
                    <svg class="w-6 h-6 text-[#1d1d1f]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"></path>
                    </svg>
                </div>
                
                <h1 class="text-[22px] font-semibold tracking-tight text-[#1d1d1f]">
                    Laporan Kasir
                </h1>

                <!-- Motivational Quote (Apple Understated Typography) -->
                <p id="quoteText" class="text-[13px] text-[#86868b] italic font-normal leading-relaxed min-h-[38px] flex items-center justify-center px-4 transition-opacity duration-300">
                    "Kerjakan dengan teliti, selesaikan dengan tuntas."
                </p>
            </div>

            <!-- Form -->
            <div class="space-y-4">

                <!-- Segmented Control Koneksi -->
                <div>
                    <label class="block text-[11px] font-semibold text-[#86868b] tracking-wider uppercase mb-1.5">
                        Koneksi
                    </label>
                    <div class="grid grid-cols-2 p-1 bg-[#efeff2] rounded-xl text-[12px] font-medium">
                        <button type="button" id="tabSim" onclick="pilihKoneksi('SIMULASI')" 
                            class="py-2 rounded-lg apple-pill-active transition-all duration-200">
                            Simulasi
                        </button>
                        <button type="button" id="tabProd" onclick="pilihKoneksi('PRODUCTION')" 
                            class="py-2 rounded-lg apple-pill-inactive transition-all duration-200">
                            Production
                        </button>
                    </div>
                    <input type="hidden" id="koneksi" value="SIMULASI">
                </div>

                <!-- Username & Password -->
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-[11px] font-semibold text-[#86868b] tracking-wider uppercase mb-1.5">
                            Username
                        </label>
                        <input type="text" id="username" placeholder="Username" 
                            class="w-full apple-input rounded-xl px-3.5 py-2.5 text-[14px] font-medium outline-none uppercase placeholder:text-zinc-400 placeholder:normal-case">
                    </div>
                    <div>
                        <label class="block text-[11px] font-semibold text-[#86868b] tracking-wider uppercase mb-1.5">
                            Password
                        </label>
                        <input type="password" id="password" placeholder="••••••••" 
                            class="w-full apple-input rounded-xl px-3.5 py-2.5 text-[14px] font-medium outline-none placeholder:text-zinc-400">
                    </div>
                </div>

                <!-- Tanggal -->
                <div>
                    <label class="block text-[11px] font-semibold text-[#86868b] tracking-wider uppercase mb-1.5">
                        Tanggal Laporan
                    </label>
                    <input type="date" id="tgl" value="<?php echo date('Y-m-d'); ?>" 
                        class="w-full apple-input rounded-xl px-3.5 py-2.5 text-[14px] font-medium outline-none cursor-pointer">
                </div>

                <!-- Primary Action Button -->
                <div class="pt-2 space-y-2">
                    <button type="button" id="btnProses" onclick="prosesLaporan()" 
                        class="w-full apple-btn-primary rounded-xl py-3.5 text-[14px] font-medium flex items-center justify-center gap-2 shadow-sm">
                        <span id="labelProses">Download Semua Laporan</span>
                    </button>

                    <button type="button" onclick="window.open('http://172.31.147.200/fo/laporan-kasir/csi', '_blank')" 
                        class="w-full text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-xl py-2.5 text-[12px] font-medium transition duration-150">
                        Buka Menu Cashback
                    </button>
                </div>

                <!-- Subtle Status & Result Banner -->
                <div id="hasilBox" class="hidden rounded-xl p-3.5 bg-[#fbfbfd] border border-[#e5e5ea] text-[12px] transition-all">
                    <div class="flex items-center justify-between">
                        <span id="pesanHasil" class="text-[#1d1d1f] font-medium flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 11 File tersimpan
                        </span>
                        <div class="flex items-center gap-2.5 font-medium">
                            <a id="linkZip" href="#" class="text-[#0071e3] hover:underline font-semibold">Download ZIP</a>
                            <span class="text-[#d2d2d7]">•</span>
                            <button onclick="bukaFolder()" class="text-[#86868b] hover:text-[#1d1d1f] hover:underline" title="Buka folder laporan di PC Host">Buka di Host</button>
                        </div>
                    </div>
                </div>

                <!-- Minimal Error Banner -->
                <div id="errorBox" class="hidden rounded-xl p-3 bg-red-50/60 border border-red-200/60 text-[12px] text-red-700 font-medium text-center">
                    <span id="pesanError">Terjadi kesalahan.</span>
                </div>

            </div>
        </div>

        <!-- Apple Subtext -->
        <div class="text-center mt-5">
            <span class="text-[11px] text-[#86868b] tracking-normal font-normal">
                Create And Managed by Dimas EDP SPI 2T; 
            </span>
        </div>

    </div>

    <script>
        // Universal API Bridge melalui Apache port 80 (bisa diakses dari PC Host & semua PC di LAN)
        const API_URL = "api.php";

        // Koleksi Kata-kata Motivasi
        const quotes = [
            "\"Kerja Terus Yuk Mumpung Belum Mati.\"",
            "\"kalo ngerasa hidup itu berat gausah diangkat.\"",
            "\"Teuing dek ngetik naon.\"",
            "\"Persib JUARA.\"",
            "\"Mengapa harus shin tae yong.\"",
            "\"Kerapian laporan adalah cerminan dedikasi kerja.\"",
            "\"Semangat hari ini, sukses esok hari.\""
        ];

        // Ganti quote secara acak saat dimuat
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        document.getElementById('quoteText').innerText = randomQuote;

        // Restore saved account
        window.addEventListener('DOMContentLoaded', () => {
            const u = localStorage.getItem('lk_u');
            const p = localStorage.getItem('lk_p');
            const k = localStorage.getItem('lk_k');
            if (u) document.getElementById('username').value = u;
            if (p) document.getElementById('password').value = p;
            if (k) pilihKoneksi(k);
        });

        function pilihKoneksi(val) {
            document.getElementById('koneksi').value = val;
            const sim = document.getElementById('tabSim');
            const prod = document.getElementById('tabProd');
            if (val === 'SIMULASI') {
                sim.className = 'py-2 rounded-lg apple-pill-active transition-all duration-200';
                prod.className = 'py-2 rounded-lg apple-pill-inactive transition-all duration-200';
            } else {
                prod.className = 'py-2 rounded-lg apple-pill-active transition-all duration-200';
                sim.className = 'py-2 rounded-lg apple-pill-inactive transition-all duration-200';
            }
        }

        async function prosesLaporan() {
            const tgl = document.getElementById('tgl').value;
            const u = document.getElementById('username').value.trim();
            const p = document.getElementById('password').value.trim();
            const kon = document.getElementById('koneksi').value;

            if (!u || !p) {
                tampilkanError("Silakan isi username dan password.");
                document.getElementById('username').focus();
                return;
            }

            // Simpan akun di background
            localStorage.setItem('lk_u', u);
            localStorage.setItem('lk_p', p);
            localStorage.setItem('lk_k', kon);

            const btn = document.getElementById('btnProses');
            const label = document.getElementById('labelProses');
            const hasilBox = document.getElementById('hasilBox');
            const errorBox = document.getElementById('errorBox');

            btn.disabled = true;
            btn.classList.add('opacity-70', 'cursor-not-allowed');
            label.innerText = "Menghubungkan...";
            hasilBox.classList.add('hidden');
            errorBox.classList.add('hidden');

            // Polling progres halus
            const poller = setInterval(() => {
                fetch(`${API_URL}?action=status`)
                    .then(r => r.json())
                    .then(st => {
                        if (st.running && st.step > 0) {
                            label.innerText = `Mengunduh ${st.step} dari ${st.total}...`;
                        } else if (st.running && st.message) {
                            if (st.message.includes('Login')) {
                                label.innerText = "Otentikasi Akun...";
                            }
                        }
                    })
                    .catch(() => {});
            }, 800);

            try {
                const res = await fetch(`${API_URL}?action=tarik`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tanggal: tgl, username: u, password: p, koneksi: kon })
                });

                const data = await res.json();
                clearInterval(poller);

                if (res.ok && data.status === 'success') {
                    hasilBox.classList.remove('hidden');
                    document.getElementById('pesanHasil').innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ${data.total} File selesai diunduh`;
                    document.getElementById('linkZip').href = `download_zip.php?tanggal=${tgl}`;
                    label.innerText = "Selesai";
                } else {
                    throw new Error(data.message || 'Gagal memproses laporan');
                }
            } catch (err) {
                clearInterval(poller);
                tampilkanError(err.message);
            } finally {
                btn.disabled = false;
                btn.classList.remove('opacity-70', 'cursor-not-allowed');
                setTimeout(() => { label.innerText = "Download Semua Laporan"; }, 3500);
            }
        }

        function bukaFolder() {
            const tgl = document.getElementById('tgl').value;
            fetch(`${API_URL}?action=open-folder&tanggal=${tgl}`).catch(() => {
                fetch(`open_folder.php?tanggal=${tgl}`);
            });
        }

        function tampilkanError(msg) {
            const errorBox = document.getElementById('errorBox');
            document.getElementById('pesanError').innerText = msg;
            errorBox.classList.remove('hidden');
        }
    </script>
</body>
</html>