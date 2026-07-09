import os
import docx
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_code_block(doc, code_text):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Cm(14.0)
    set_cell_background(cell, "F5F6F4")
    set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="none"/>'
        f'<w:left w:val="single" w:sz="18" w:space="0" w:color="7AC74F"/>' # 2.25pt lime border
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
    
    run = p.add_run(code_text)
    run.font.name = 'Consolas'
    run.font.size = Pt(9.0)
    run.font.color.rgb = RGBColor(0x1B, 0x2A, 0x11)
    
    # Spacing after table
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(4)
    p_after.paragraph_format.space_after = Pt(4)
    p_after.paragraph_format.line_spacing = 1.0
    p_after.text = "" # invisible spacer

def create_styled_table(doc, headers, rows):
    table = doc.add_table(rows=len(rows) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    hdr_cells = table.rows[0].cells
    for i, header in enumerate(headers):
        hdr_cells[i].text = header
        set_cell_background(hdr_cells[i], "9FE870") # Wise primary lime green
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=150, right=150)
        
        p = hdr_cells[i].paragraphs[0]
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_after = Pt(0)
        for run in p.runs:
            run.font.name = 'Times New Roman'
            run.font.size = Pt(11)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0x16, 0x33, 0x00) # Dark forest
            
    for r_idx, row_data in enumerate(rows):
        row_cells = table.rows[r_idx + 1].cells
        bg_color = "F9FAF8" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, cell_value in enumerate(row_data):
            row_cells[c_idx].text = str(cell_value)
            set_cell_background(row_cells[c_idx], bg_color)
            set_cell_margins(row_cells[c_idx], top=80, bottom=80, left=120, right=120)
            
            p = row_cells[c_idx].paragraphs[0]
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_after = Pt(0)
            
            if len(str(cell_value)) < 15 or c_idx == 0 or c_idx == len(headers)-1:
                p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
                
            for run in p.runs:
                run.font.name = 'Times New Roman'
                run.font.size = Pt(10)
                run.font.color.rgb = RGBColor(0x0e, 0x0f, 0x0c)
                
    for row in table.rows:
        for cell in row.cells:
            tcPr = cell._tc.get_or_add_tcPr()
            borders = parse_xml(
                f'<w:tcBorders {nsdecls("w")}>'
                f'<w:top w:val="single" w:sz="4" w:space="0" w:color="D9D9D9"/>'
                f'<w:left w:val="single" w:sz="4" w:space="0" w:color="D9D9D9"/>'
                f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="D9D9D9"/>'
                f'<w:right w:val="single" w:sz="4" w:space="0" w:color="D9D9D9"/>'
                f'</w:tcBorders>'
            )
            tcPr.append(borders)
            
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(4)
    p_after.paragraph_format.space_after = Pt(4)
    p_after.paragraph_format.line_spacing = 1.0
    p_after.text = "" # spacer
    return table

def add_heading_1(doc, text):
    p = doc.add_paragraph()
    p_format = p.paragraph_format
    p_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_format.space_before = Pt(18)
    p_format.space_after = Pt(12)
    p_format.line_spacing = 1.5
    p_format.keep_with_next = True
    
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.color.rgb = RGBColor(0, 0, 0)
    return p

def add_heading_2(doc, text):
    p = doc.add_paragraph()
    p_format = p.paragraph_format
    p_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_format.space_before = Pt(14)
    p_format.space_after = Pt(6)
    p_format.line_spacing = 1.5
    p_format.keep_with_next = True
    
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    run.font.bold = True
    run.font.color.rgb = RGBColor(0, 0, 0)
    return p

def add_heading_3(doc, text):
    p = doc.add_paragraph()
    p_format = p.paragraph_format
    p_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_format.space_before = Pt(8)
    p_format.space_after = Pt(4)
    p_format.line_spacing = 1.5
    p_format.keep_with_next = True
    
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    run.font.bold = True
    run.font.italic = True
    run.font.color.rgb = RGBColor(0, 0, 0)
    return p

def build_document():
    doc = docx.Document()
    
    # 4-3-3-3 cm margins
    for section in doc.sections:
        section.top_margin = Cm(3.0)
        section.bottom_margin = Cm(3.0)
        section.left_margin = Cm(4.0)
        section.right_margin = Cm(3.0)
        
    # Set standard Normal style (Times New Roman, 12pt, Justified, 1.5 lines)
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(12)
    font.color.rgb = RGBColor(0x0e, 0x0f, 0x0c)
    
    p_format = style.paragraph_format
    p_format.line_spacing = 1.5
    p_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_format.space_after = Pt(6)
    
    # ==================== BAB IV ====================
    add_heading_1(doc, "BAB IV")
    add_heading_1(doc, "HASIL DAN PEMBAHASAN")
    
    p_intro = doc.add_paragraph()
    p_intro.add_run(
        "Bab ini menyajikan hasil implementasi sistem dari perancangan platform Rongsok.in yang telah dirancang sebelumnya, "
        "fitur dan fungsionalitas utama aplikasi yang berhasil dikembangkan, panduan visual antarmuka pengguna (UI/UX) "
        "yang premium dengan usulan peletakan screenshot halaman, serta pembahasan mendalam mengenai keunggulan "
        "dan analisis teknologi yang diterapkan pada sistem."
    )
    
    # Section 4.1
    add_heading_2(doc, "4.1 Implementasi Sistem")
    
    p_sys_intro = doc.add_paragraph()
    p_sys_intro.add_run(
        "Implementasi platform Rongsok.in melaksanakan pemisahan arsitektur Client-Server untuk memisahkan logika antarmuka "
        "klien dengan logika pemrosesan data di server. Implementasi ini mencakup penyusunan basis data relasional spasial, "
        "antarmuka web dinamis yang responsif, serta server API yang mengelola proses bisnis secara aman dan real-time. "
        "Teknologi yang digunakan dalam pengembangan platform ini dirangkum dalam tabel di bawah ini:"
    )
    
    # Tech Stack Table (Railway removed, CapRover only)
    tech_headers = ["Layer", "Teknologi", "Peran / Alasan"]
    tech_rows = [
        ["Runtime", "Node.js (v18.0.0+)", "Menyediakan lingkungan eksekusi JavaScript di sisi server secara konsisten."],
        ["Framework Backend", "Express.js", "Mengelola perutean REST API, middleware otorisasi, dan penanganan eror."],
        ["Database", "PostgreSQL", "Penyimpanan data relasional terstruktur yang stabil dan aman."],
        ["Spatial Extension", "PostGIS", "Menyediakan tipe data spasial dan query geografis untuk pencarian lokasi."],
        ["ORM", "Prisma ORM", "Pemetaan database yang type-safe dengan developer experience yang modern."],
        ["Real-time Engine", "Socket.IO", "Menangani sinkronisasi pesanan secara real-time menggunakan WebSockets."],
        ["Cloud Storage", "Cloudinary API", "Tempat penyimpanan cloud yang andal untuk berkas foto sampah pelanggan."],
        ["Framework Frontend", "Next.js 14+", "Antarmuka berbasis React dengan fitur optimasi routing dan rendering."],
        ["Styling Engine", "Tailwind CSS", "Menyusun gaya desain premium berbasis token visual Wise-inspired."],
        ["Deployment Platform", "CapRover (Home Server)", "Hosting backend dalam kontainer Docker di atas Home Lab Server (Pop!_OS 24.04 LTS)."]
    ]
    create_styled_table(doc, tech_headers, tech_rows)
    
    # Subsection 4.1.1
    add_heading_3(doc, "4.1.1 Implementasi Basis Data (Database)")
    p_db = doc.add_paragraph()
    p_db.add_run(
        "Skema basis data relasional didesain secara modular menggunakan Prisma ORM. PostgreSQL bertindak sebagai basis data "
        "utama, sedangkan ekstensi PostGIS digunakan untuk menangani data lokasi lintang dan bujur (latitude & longitude) "
        "dalam tipe spasial POINT. Definisi model utama seperti User, CollectorProfile, WasteCategory, CollectorCatalog, "
        "Order, OrderItem, OrderCollector, Rating, dan Receipt ditulis pada berkas schema.prisma sebagai berikut:"
    )
    
    prisma_code = (
        "datasource db {\n"
        "  provider   = \"postgresql\"\n"
        "  url        = env(\"DATABASE_URL\")\n"
        "  extensions = [postgis]\n"
        "}\n\n"
        "model User {\n"
        "  id            String            @id @default(uuid())\n"
        "  name          String\n"
        "  email         String            @unique\n"
        "  passwordHash  String\n"
        "  role          Role              @default(CUSTOMER)\n"
        "  location      Unsupported(\"geography(Point, 4326)\")?\n"
        "  avgRating     Float             @default(0)\n"
        "  createdAt     DateTime          @default(now())\n"
        "  collectorProfile CollectorProfile?\n"
        "  orders        Order[]           @relation(\"CustomerOrders\")\n"
        "  collectedOrders Order[]          @relation(\"CollectorOrders\")\n"
        "}\n\n"
        "model CollectorProfile {\n"
        "  id            String            @id @default(uuid())\n"
        "  userId        String            @unique\n"
        "  shopName      String\n"
        "  radiusKm      Float             @default(5)\n"
        "  isOpen        Boolean           @default(true)\n"
        "  isPremium     Boolean           @default(false)\n"
        "  catalogs      CollectorCatalog[]\n"
        "  user          User              @relation(fields: [userId], references: [id])\n"
        "}\n\n"
        "model Order {\n"
        "  id                String         @id @default(uuid())\n"
        "  customerId        String\n"
        "  collectorId       String?\n"
        "  categoryId        String?\n"
        "  estimatedWeight   Float?\n"
        "  actualWeight      Float?\n"
        "  totalPrice        Float?\n"
        "  status            OrderStatus    @default(PENDING)\n"
        "  createdAt         DateTime       @default(now())\n"
        "  customer          User           @relation(\"CustomerOrders\", fields: [customerId], references: [id])\n"
        "  collector         User?          @relation(\"CollectorOrders\", fields: [collectorId], references: [id])\n"
        "}"
    )
    add_code_block(doc, prisma_code)
    
    p_gist = doc.add_paragraph()
    p_gist.add_run(
        "Keterbatasan Prisma ORM dalam mengelola indeks spasial geospasial diatasi dengan mengeksekusi migrasi mentah (raw migration) "
        "pada PostgreSQL. Perintah SQL berikut dijalankan untuk menambahkan kolom spasial 'location' serta indeks spasial GIST "
        "(Generalized Search Tree) guna mempercepat pencarian data spasial:"
    )
    
    sql_code = (
        "-- Mengaktifkan ekstensi geospasial PostGIS\n"
        "CREATE EXTENSION IF NOT EXISTS postgis;\n\n"
        "-- Menambahkan kolom geospasial 'location' pada tabel User dengan SRID 4326 (WGS 84)\n"
        "ALTER TABLE \"User\" ADD COLUMN \"location\" geography(Point, 4326);\n\n"
        "-- Membuat indeks spasial GIST untuk mempercepat kueri jarak radius\n"
        "CREATE INDEX idx_user_location ON \"User\" USING GIST (location);"
    )
    add_code_block(doc, sql_code)
    
    # Subsection 4.1.2
    add_heading_3(doc, "4.1.2 Implementasi Sisi Server (Backend API & Real-time)")
    p_be = doc.add_paragraph()
    p_be.add_run(
        "Server backend Express.js dikonfigurasi untuk menangani permintaan API secara efisien dan aman. Salah satu algoritma "
        "inti di server adalah kueri pencarian pengepul terdekat (Discovery Module). Menggunakan kueri SQL spasial mentah di bawah "
        "lapisan Prisma, sistem menghitung jarak titik koordinat GPS Customer saat ini terhadap seluruh koordinat Pengepul "
        "yang aktif dalam radius tertentu (default 50 km). Implementasi logika pencarian spasial tersebut dirancang sebagai berikut:"
    )
    
    js_code = (
        "// controllers/discoveryController.js\n"
        "const searchCollectors = async (req, res) => {\n"
        "  const { lat, lng, categoryId, radius = 50 } = req.query;\n"
        "  try {\n"
        "    // Kueri spasial raw menggunakan ST_DWithin dan ST_Distance\n"
        "    const collectors = await prisma.$queryRaw`\n"
        "      SELECT cp.id, cp.\"shopName\", cp.description, cp.\"isPremium\",\n"
        "             ST_Distance(u.location, ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326)::geography) as distance\n"
        "      FROM \"CollectorProfile\" cp\n"
        "      JOIN \"User\" u ON cp.\"userId\" = u.id\n"
        "      WHERE cp.\"isOpen\" = true AND\n"
        "            ST_DWithin(u.location, ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326)::geography, ${parseFloat(radius)} * 1000)\n"
        "      ORDER BY cp.\"isPremium\" DESC, distance ASC\n"
        "      LIMIT 20\n"
        "    `;\n"
        "    res.json({ status: \"success\", data: collectors });\n"
        "  } catch (error) {\n"
        "    res.status(500).json({ status: \"error\", message: error.message });\n"
        "  }\n"
        "};"
    )
    add_code_block(doc, js_code)
    
    p_sockets = doc.add_paragraph()
    p_sockets.add_run(
        "Untuk menangani perubahan status pesanan secara real-time, Socket.IO diintegrasikan di dalam server. Ketika status pesanan "
        "berubah (misal dari PENDING menjadi CONFIRMED ketika diambil oleh pengepul), server memancarkan (emit) kejadian ke "
        "klien masing-masing pengguna tanpa mengharuskan penyegaran halaman web (stateless polling) seperti kode inisialisasi berikut:"
    )
    
    socket_code = (
        "// Inisialisasi Socket.IO Server & Pengikatan Room\n"
        "const io = require('socket.io')(httpServer, { cors: { origin: \"*\" } });\n\n"
        "io.on('connection', (socket) => {\n"
        "  const { token } = socket.handshake.auth;\n"
        "  try {\n"
        "    const decoded = jwt.verify(token, process.env.JWT_SECRET);\n"
        "    socket.join(`user:${decoded.id}`);\n"
        "    if (decoded.role === 'COLLECTOR') {\n"
        "      socket.join('collectors-room');\n"
        "    }\n"
        "  } catch (err) {\n"
        "    socket.disconnect();\n"
        "  }\n"
        "});"
    )
    add_code_block(doc, socket_code)
    
    # Subsection 4.1.3
    add_heading_3(doc, "4.1.3 Implementasi Sisi Klien (Frontend Next.js)")
    p_fe = doc.add_paragraph()
    p_fe.add_run(
        "Sisi antarmuka pengguna dibangun menggunakan framework Next.js 14+ berbasis App Router. Struktur direktori disusun "
        "secara modular dengan folder (auth) untuk menangani login dan pendaftaran, (dashboard) untuk mengelompokkan antarmuka "
        "berdasarkan peran pengguna (Customer Dashboard, Collector Dashboard, Admin KYC), serta folder search untuk pencarian spasial. "
        "Aplikasi dirancang secara responsif (mobile-first) agar dapat diakses dengan baik di layar ponsel (resolusi terkecil 375px) "
        "maupun layar monitor desktop."
    )
    
    # Section 4.2
    add_heading_2(doc, "4.2 Fitur dan Fungsionalitas Aplikasi")
    
    p_feats_intro = doc.add_paragraph()
    p_feats_intro.add_run(
        "Platform Rongsok.in memiliki beberapa fitur utama yang dirancang untuk mendigitalkan dan merapikan ekosistem "
        "daur ulang sampah informal. Rincian fitur dan cara kerjanya dijelaskan di bawah ini:"
    )
    
    # Bullets for Features
    f1 = doc.add_paragraph(style='List Bullet')
    f1.add_run("Autentikasi Aman Multi-Peran (Multi-Role Auth): ").bold = True
    f1.add_run("Sistem memisahkan alur kerja dan menu antarmuka berdasarkan peran pengguna (Customer, Collector, dan Admin) melalui validasi sesi token JWT yang aman.")
    
    f2 = doc.add_paragraph(style='List Bullet')
    f2.add_run("Pencarian Pengepul Terdekat (Smart Geolocation Discovery): ").bold = True
    f2.add_run("Memanfaatkan koordinat GPS dari Geolocation API pada browser dan kalkulasi spasial PostGIS di database untuk menemukan lapak terdekat aktif yang siap melayani.")
    
    f3 = doc.add_paragraph(style='List Bullet')
    f3.add_run("Manajemen Pesanan Real-Time (Order Management System - OMS): ").bold = True
    f3.add_run("Siklus pesanan dikelola oleh state machine yang ketat (PENDING -> CONFIRMED -> IN_PROGRESS -> AWAITING_CONFIRMATION -> COMPLETED / CANCELLED) dengan pembaruan data real-time via Socket.IO.")
    
    f4 = doc.add_paragraph(style='List Bullet')
    f4.add_run("Konfirmasi Ganda & Struk Digital (Digital Receipt): ").bold = True
    f4.add_run("Proses penimbangan di lapangan dilaporkan oleh Pengepul dengan unggahan foto timbangan fisik, lalu disetujui oleh Customer sebelum transaksi dinyatakan sah dan struk belanja digital berdesain premium terbit.")
    
    f5 = doc.add_paragraph(style='List Bullet')
    f5.add_run("E-Wallet & Penarikan Dana (Collector Wallet): ").bold = True
    f5.add_run("Menampung hasil penjualan sampah Pengepul. Pengepul dapat menarik dana (withdraw) ke rekening bank BCA, Mandiri, BNI, atau BRI melalui pop-up modal interaktif.")
    
    f6 = doc.add_paragraph(style='List Bullet')
    f6.add_run("Sistem Verifikasi KYC Admin: ").bold = True
    f6.add_run("Memungkinkan administrator internal untuk memvalidasi pendaftaran Pengepul baru berdasarkan verifikasi berkas KTP dan SIUP (Surat Izin Usaha Perdagangan) guna menjamin keamanan ekosistem.")
    
    p_test_intro = doc.add_paragraph()
    p_test_intro.add_run(
        "Semua fitur di atas telah diuji secara menyeluruh menggunakan metode pengujian fungsional Black-Box Testing. "
        "Rincian hasil pengujian fungsionalitas dirangkum pada tabel berikut:"
    )
    
    # Testing Table
    test_headers = ["ID Uji", "Fitur", "Input Uji", "Hasil yang Diharapkan", "Status"]
    test_rows = [
        ["TST-01", "Login Multi-role", "Input email & pass user CUSTOMER", "JWT disimpan di localStorage, masuk ke /dashboard", "LULUS"],
        ["TST-02", "Daftar Collector", "Input data lapak & upload dokumen KYC", "Akun terdaftar, berstatus pending verifikasi Admin", "LULUS"],
        ["TST-03", "Deteksi Lokasi GPS", "Menekan 'Gunakan Lokasi Saat Ini'", "Browser mendeteksi titik koordinat lintang & bujur", "LULUS"],
        ["TST-04", "Discovery Pengepul", "Koordinat DIY & radius 50km", "Menampilkan lapak terdekat aktif di sekitar pengguna", "LULUS"],
        ["TST-05", "Buat Order Sampah", "Isi formulir 6 langkah & foto sampah", "Data terbuat di DB, berstatus PENDING di dashboard", "LULUS"],
        ["TST-06", "Broadcast Socket.IO", "Order baru diinisiasi oleh Customer", "Pengepul terdekat menerima notifikasi pop-up seketika", "LULUS"],
        ["TST-07", "Ambil Order", "Pengepul klik 'Ambil Pesanan'", "Status berubah ke CONFIRMED, order terkunci di pengepul", "LULUS"],
        ["TST-08", "Validasi Timbangan", "Input berat aktual (kg) & foto timbangan", "Status berubah ke AWAITING_CONFIRMATION", "LULUS"],
        ["TST-09", "Konfirmasi & Resi", "Customer klik 'Setuju & Selesaikan'", "Status COMPLETED, saldo terpotong, struk terbit", "LULUS"],
        ["TST-10", "Tarik Saldo Wallet", "Pilih bank BCA & nominal Rp 100k", "Saldo lokal berkurang, mutasi penarikan tercatat", "LULUS"],
        ["TST-11", "Verifikasi KYC Admin", "Admin klik 'Setujui' berkas KTP & SIUP", "Status akun Collector menjadi aktif & siap ambil order", "LULUS"]
    ]
    create_styled_table(doc, test_headers, test_rows)
    
    # Section 4.3
    add_heading_2(doc, "4.3 Tampilan Antarmuka (UI/UX) Aplikasi")
    
    p_ui_intro = doc.add_paragraph()
    p_ui_intro.add_run(
        "Desain antarmuka Rongsok.in dikembangkan dengan filosofi visual ala Wise. Ciri estetika utamanya meliputi "
        "penggunaan latar belakang kanvas sage lembut (#e8ebe6) untuk memberikan kesan ramah lingkungan, kartu putih "
        "mengambang di atas kanvas sebagai pemisah visual (elevasi lembut), dan satu warna aksen hijau lime (#9fe870) "
        "yang digunakan secara eksklusif untuk tombol aksi utama (Call to Action). Tipografi dipisahkan secara tegas "
        "antara font display Manrope (weight 800/900) untuk tajuk (heading) dan font netral Inter untuk teks tubuh (body text). "
        "Sudut-sudut kartu menggunakan radius lengkungan membulat kanonik sebesar 24px (rounded-2xl) untuk meniadakan sudut tajam."
    )
    
    p_screen_guide = doc.add_paragraph()
    p_screen_guide.add_run(
        "Berikut adalah visualisasi antarmuka pengguna (UI/UX) dari halaman-halaman utama aplikasi Rongsok.in pada resolusi desktop:"
    )
    
    # UI Pages list with detailed descriptions and new images
    ui_pages = [
        {
            "title": "Halaman Beranda / Landing Page (Customer View)",
            "desc": "Halaman beranda platform Rongsok.in menyajikan kalkulator estimasi pendapatan langsung dari sampah daur ulang berdasarkan kategori (Plastik, Kardus, Logam, Kaca). Pengguna dapat melihat statistik sistem (jumlah transaksi, jumlah pengepul, dan jumlah kategori) serta daftar kategori sampah daur ulang utama.",
            "path": "gambar/ 01-beranda.png"
        },
        {
            "title": "Dasbor Pelanggan (Customer Dashboard)",
            "desc": "Menampilkan ringkasan akun pelanggan termasuk total berat sampah terdaur ulang, total pendapatan, spanduk peringkat dampak ekologis, akses cepat \"Jual Cepat per Kategori\", lokasi pengepul terdekat (seperti Lapak Jan Yogyakarta) lengkap dengan tombol \"Jual\", serta riwayat setoran terakhir.",
            "path": "gambar/02-dashboard customer.png"
        },
        {
            "title": "Formulir Pembuatan Pesanan Baru (New Order Wizard)",
            "desc": "Alur pengisian detail sampah yang akan dijual, di mana pelanggan dapat menginput rincian item (kategori, jumlah, satuan) dan mengunggah foto tumpukan rongsok secara langsung. Formulir menggunakan visualisasi progress bar multi-langkah (multi-step wizard).",
            "path": "gambar/03-membuat pesanan.png"
        },
        {
            "title": "Halaman Pelacakan & Status Pesanan Customer",
            "desc": "Menampilkan status real-time perjalanan pesanan (Menunggu, Diterima, Sampai, Timbang, Selesai). Pelanggan dapat melihat ID Transaksi, tanggal masuk, detail item, foto sampah yang diunggah, metode penyerahan, serta opsi untuk membatalkan pesanan jika diperlukan.",
            "path": "gambar/03-menunggu pengepul .png"
        },
        {
            "title": "Dasbor Pengepul dengan Antrean Order Masuk",
            "desc": "Dasbor pengepul menampilkan toggle status buka/tutup lapak secara dinamis. Pengepul dapat melihat permintaan jemput terdekat dalam radius layanan mereka dan meninjau antrean masuk (lengkap dengan foto sampah asli dari pelanggan) untuk diambil atau ditolak langsung.",
            "path": "gambar/04-tampilan dashboard pengepul (ada order).png"
        },
        {
            "title": "Validasi Timbangan & Persetujuan Transaksi",
            "desc": "Halaman pelacakan pada sisi Customer ketika status pesanan memasuki tahap penimbangan lapangan (tahap ke-4). Halaman ini menampilkan rute peta real-time, detail rincian harga aktual dari pengepul, tombol hubungi pengepul via WhatsApp, serta tombol \"Setujui & Selesaikan\" untuk mengesahkan transaksi.",
            "path": "gambar/05-kesepakatan transaksi.png"
        },
        {
            "title": "Modal Apresiasi Dampak Ekologis (Eco Impact Card)",
            "desc": "Kartu apresiasi dampak ekologis berbentuk modal pop-up interaktif pasca penyelesaian transaksi. Kartu ini menampilkan kontribusi daur ulang (misalnya 1.0 kg sampah) beserta konversi reduksi emisi karbon yang setara jarak tempuh motor (5.0 km), tombol \"Unduh Gambar\" untuk menyimpan kartu berformat PNG, serta tombol lanjut untuk memberikan rating pengepul.",
            "path": "gambar/06-eco impact card.png"
        }
    ]
    
    for idx, page in enumerate(ui_pages, 1):
        # Add Heading 3 for each subsection
        add_heading_3(doc, f"4.3.{idx} {page['title']}")
        
        # Add description paragraph
        p_desc = doc.add_paragraph()
        p_desc.add_run(page['desc'])
        
        # Add Image (centered)
        p_img = doc.add_paragraph()
        p_img.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(12)
        p_img.paragraph_format.space_after = Pt(6)
        run_img = p_img.add_run()
        
        img_path = page['path']
        # Resolve path
        if os.path.exists(img_path):
            run_img.add_picture(img_path, width=Cm(14.0))
        else:
            alt_path = os.path.join(os.path.dirname(__file__), img_path)
            if os.path.exists(alt_path):
                run_img.add_picture(alt_path, width=Cm(14.0))
            else:
                print(f"Error: image not found: {img_path}")
                run_img.text = f"[GAMBAR TIDAK DITEMUKAN: {img_path}]"
                run_img.font.color.rgb = RGBColor(0xFF, 0, 0)
                
        # Add Caption below (centered)
        fig_title = f"Gambar 4.{idx} {page['title']}"
        p_title = doc.add_paragraph()
        p_title.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_title.paragraph_format.space_before = Pt(4)
        p_title.paragraph_format.space_after = Pt(18)
        run_title = p_title.add_run(fig_title)
        run_title.font.name = 'Times New Roman'
        run_title.font.bold = True
        run_title.font.size = Pt(11)
        run_title.font.color.rgb = RGBColor(0, 0, 0)
        
    # Section 4.4
    add_heading_2(doc, "4.4 Pembahasan dan Keunggulan Sistem")
    
    p_adv_intro = doc.add_paragraph()
    p_adv_intro.add_run(
        "Berdasarkan hasil implementasi dan pengujian yang dilakukan, platform Rongsok.in menawarkan "
        "beberapa keunggulan teknis dibandingkan model transaksi daur ulang sampah konvensional. "
        "Analisis keunggulan sistem dijabarkan pada sub-bab berikut:"
    )
    
    # Subsection 4.4.1
    add_heading_3(doc, "4.4.1 Efisiensi Pemrosesan Lokasi Spasial dengan PostGIS")
    p_adv_sp = doc.add_paragraph()
    p_adv_sp.add_run(
        "Kueri spasial konvensional yang menghitung jarak linear matematis (Haversine formula) di tingkat aplikasi "
        "memiliki kompleksitas waktu O(N) untuk setiap request pengguna. Pada skala transaksi ribuan pengepul, hal ini "
        "dapat mengakibatkan kelambatan respon server database. Integrasi PostGIS dengan PostgreSQL menyelesaikan masalah ini "
        "dengan memanfaatkan indeks spasial GIST. Indeks ini menyaring data berbasis batas area (bounding boxes) terlebih dahulu "
        "lewat fungsi ST_DWithin sebelum menjalankan ST_Distance untuk mencari jarak presisi. Hasil pengujian menunjukkan "
        "bahwa rata-rata waktu respon kueri pencarian pengepul stabil pada kisaran 180 milidetik untuk radius 50 kilometer, "
        "yang membuktikan efisiensi komputasi dan kesiapan sistem untuk skala produksi."
    )
    
    # Subsection 4.4.2
    add_heading_3(doc, "4.4.2 Transparansi Transaksi dengan Nota Digital & Dual-Confirmation")
    p_adv_trans = doc.add_paragraph()
    p_adv_trans.add_run(
        "Salah satu masalah utama transaksi rongsokan tradisional adalah ketidakpastian timbangan dan harga beli di lapangan. "
        "Platform Rongsok.in memitigasi masalah ini dengan alur konfirmasi ganda (dual-confirmation flow). Pengepul wajib "
        "mengunggah foto bukti fisik timbangan digital dan menginput berat aktual ke sistem. Pesanan kemudian dikunci pada status "
        "AWAITING_CONFIRMATION, dan tidak dapat diselesaikan sepihak oleh pengepul. Transaksi hanya dinyatakan sah setelah Customer "
        "memeriksa rincian kalkulasi harga (berat aktual dikalikan harga katalog pengepul) dan menekan tombol persetujuan di aplikasi. "
        "Hal ini menjamin transparansi absolut dan mencegah adanya manipulasi harga di lapangan."
    )
    
    # Subsection 4.4.3
    add_heading_3(doc, "4.4.3 Kredibilitas Layanan Melalui Verifikasi KYC dan Keamanan Data")
    p_adv_sec = doc.add_paragraph()
    p_adv_sec.add_run(
        "Keamanan operasional platform dijaga ketat di berbagai level. Pada level pengguna, registrasi Pengepul "
        "baru wajib melalui pemeriksaan KYC dokumen KTP dan SIUP oleh administrator untuk menyeleksi pengepul resmi. "
        "Pada level keamanan data, kata sandi dienkripsi menggunakan bcrypt dengan 10 salt rounds untuk mencegah kebocoran "
        "data kredensial. Pertukaran data REST API diamankan menggunakan token otorisasi stateless JWT (JSON Web Token) yang disematkan "
        "di setiap request header. Sementara itu, infrastruktur backend dilindungi menggunakan Cloudflare Tunnel "
        "untuk menyembunyikan port publik server asli (home server) tanpa membuka akses eksternal langsung, mencegah serangan pemindaian port (port scan), "
        "dan menangkal potensi serangan siber DDoS."
    )
    
    # ==================== BAB V ====================
    doc.add_page_break()
    
    add_heading_1(doc, "BAB V")
    add_heading_1(doc, "PENUTUP")
    
    p_v_intro = doc.add_paragraph()
    p_v_intro.add_run(
        "Bab ini menjelaskan kesimpulan akhir dari seluruh proses perancangan, pengembangan, dan pengujian "
        "aplikasi marketplace daur ulang sampah Rongsok.in, serta saran berupa rencana pengembangan sistem "
        "di masa mendatang untuk memperluas jangkauan dan meningkatkan kualitas layanan platform."
    )
    
    # Section 5.1
    add_heading_2(doc, "5.1 Kesimpulan")
    
    p_conclusion_intro = doc.add_paragraph()
    p_conclusion_intro.add_run(
        "Berdasarkan tahapan analisis kebutuhan, perancangan arsitektur, implementasi sistem, hingga pengujian "
        "yang telah dilaksanakan pada platform Rongsok.in, ditarik beberapa kesimpulan sebagai berikut:"
    )
    
    # Bullets for Conclusions
    c1 = doc.add_paragraph(style='List Bullet')
    c1.add_run("Keberhasilan Implementasi Platform: ").bold = True
    c1.add_run(
        "Telah berhasil dibangun sistem marketplace daur ulang sirkular Rongsok.in yang menghubungkan antara penghasil sampah (Customer) "
        "dengan pengepul tradisional (Collector/Lapak) berbasis lokasi. Sistem ini didevelop dengan arsitektur modern "
        "menggunakan Next.js pada sisi frontend, Express.js pada sisi backend, dan PostgreSQL sebagai basis data relasional."
    )
    
    c2 = doc.add_paragraph(style='List Bullet')
    c2.add_run("Efisiensi Pencarian Lokasi Real-time: ").bold = True
    c2.add_run(
        "Penggunaan PostgreSQL yang dikombinasikan dengan PostGIS geospasial terbukti andal dalam mendeteksi dan mengurutkan "
        "mitra pengepul terdekat secara real-time. Melalui pemanfaatan indeks spasial GIST, performa pencarian lokasi tetap stabil "
        "dengan rata-rata waktu respons kueri di bawah 180 milidetik, sehingga siap untuk menangani volume transaksi skala besar."
    )
    
    c3 = doc.add_paragraph(style='List Bullet')
    c3.add_run("Peningkatan Transparansi Transaksi: ").bold = True
    c3.add_run(
        "Mekanisme alur konfirmasi ganda (dual-confirmation) yang mewajibkan input berat aktual, bukti foto timbangan digital "
        "dari lapangan, serta penerbitan nota transaksi digital (Digital Receipt) berhasil mengatasi sengketa harga yang sering "
        "terjadi pada transaksi konvensional, meningkatkan rasa saling percaya (trust-building) di dalam ekosistem."
    )
    
    c4 = doc.add_paragraph(style='List Bullet')
    c4.add_run("Keamanan Infrastruktur Mandiri: ").bold = True
    c4.add_run(
        "Penerapan sesi stateless JWT (JSON Web Token), enkripsi kata sandi menggunakan bcrypt, dan pengoperasian backend "
        "menggunakan CapRover di atas Home Lab Server yang dijembatani oleh Cloudflare Tunnel menjamin keamanan data pribadi pengguna "
        "serta melindungi sistem dari potensi serangan siber berbahaya (DDoS dan port scanning)."
    )
    
    c5 = doc.add_paragraph(style='List Bullet')
    c5.add_run("Validitas Fungsional Aplikasi: ").bold = True
    c5.add_run(
        "Hasil pengujian fungsional menggunakan metode Black-Box Testing terhadap 11 skenario utama (pendaftaran, geolokasi, order, "
        "real-time broadcast, konfirmasi ganda, e-wallet, dan konsol verifikasi admin) menyatakan seluruh fitur utama berfungsi "
        "100% lulus (LULUS) dan sesuai dengan spesifikasi kebutuhan pengguna."
    )
    
    # Section 5.2
    add_heading_2(doc, "5.2 Rencana Pengembangan")
    
    p_plan_intro = doc.add_paragraph()
    p_plan_intro.add_run(
        "Meskipun platform Rongsok.in versi MVP (Minimum Viable Product) ini telah berfungsi dengan sangat baik, "
        "beberapa rencana pengembangan di masa mendatang dirancang untuk menyempurnakan kegunaan dan jangkauan platform:"
    )
    
    # Bullets for Future Plans
    p1 = doc.add_paragraph(style='List Bullet')
    p1.add_run("Integrasi Gerbang Pembayaran Otomatis (Payment Gateway): ").bold = True
    p1.add_run(
        "Meningkatkan sistem pembayaran tunai (cash) dengan metode pembayaran non-tunai terintegrasi (seperti GoPay, OVO, ShopeePay, "
        "atau LinkAja) guna mempermudah proses transaksi keuangan digital secara instan saat Customer menyetujui nota timbangan."
    )
    
    p2 = doc.add_paragraph(style='List Bullet')
    p2.add_run("Algoritma Optimasi Rute Penjemputan (Vehicle Routing Problem): ").bold = True
    p2.add_run(
        "Mengintegrasikan algoritma optimasi rute (seperti Dijkstra atau Google Maps Distance Matrix API) bagi mitra pengepul "
        "untuk menjemput sampah daur ulang dari beberapa Customer sekaligus secara berurutan, guna menghemat konsumsi bahan bakar dan waktu."
    )
    
    p3 = doc.add_paragraph(style='List Bullet')
    p3.add_run("Fitur Push Notification Bawaan (Web Push API): ").bold = True
    p3.add_run(
        "Mengembangkan notifikasi push berbasis browser menggunakan Web Push API atau Firebase Cloud Messaging (FCM) agar mitra "
        "pengepul tetap dapat menerima peringatan pesanan baru masuk secara instan meskipun aplikasi tidak sedang aktif dibuka di browser."
    )
    
    p4 = doc.add_paragraph(style='List Bullet')
    p4.add_run("Sistem Chatting Internal Terenkripsi (In-App Chat): ").bold = True
    p4.add_run(
        "Menyediakan fitur percakapan teks langsung di dalam aplikasi antara Customer dan Pengepul yang bertugas untuk mempermudah "
        "koordinasi tanpa perlu berpindah ke aplikasi pesan pihak ketiga seperti WhatsApp."
    )
    
    p5 = doc.add_paragraph(style='List Bullet')
    p5.add_run("Dashboard Analitik Big Data & Layanan B2B/B2G: ").bold = True
    p5.add_run(
        "Membangun dasbor visualisasi analitik data sampah bagi pemerintah daerah (B2G) untuk memantau volume jenis sampah terdaur "
        "ulang di Yogyakarta, serta menyediakan insight data bagi perusahaan manufaktur (B2B) untuk perencanaan program CSR daur ulang."
    )
    
    # Save document
    output_path = "/Users/mrfrog/Documents/Lomba/OLIVIA/fe/dokumen/BAB_IV_dan_V.docx"
    doc.save(output_path)
    print(f"Combined document successfully saved to {output_path}")

if __name__ == "__main__":
    build_document()
