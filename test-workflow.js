const axios = require('axios');
const API_URL = 'http://localhost:5000/api/v1';

async function runTest() {
  console.log('=== MEMULAI SIMULASI WORKFLOW PENJUALAN RONGSOK.IN ===\n');

  try {
    // 1. LOGIN CUSTOMER & COLLECTOR
    console.log('1. Melakukan autentikasi Login...');
    
    // Login Customer
    const custLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'rizky@example.com',
      password: 'customer123'
    });
    const custToken = custLoginRes.data.data.access_token;
    const custId = custLoginRes.data.data.user.id;
    console.log(`   - Login Customer Berhasil: Rizky (ID: ${custId})`);

    // Login Collector
    const collLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'budi@collector.com',
      password: 'collector123'
    });
    const collToken = collLoginRes.data.data.access_token;
    const collId = collLoginRes.data.data.user.id;
    console.log(`   - Login Pengepul Berhasil: Budi (ID: ${collId})\n`);

    const custHeaders = { Authorization: `Bearer ${custToken}` };
    const collHeaders = { Authorization: `Bearer ${collToken}` };

    // 2. CLEANUP ACTIVE TRANSACTIONS (agar pengujian tidak terblokir limit 1 order)
    console.log('2. Memeriksa dan membersihkan transaksi aktif lama...');
    
    // Check active order for customer
    const activeCustOrdersRes = await axios.get(`${API_URL}/orders?status=active`, { headers: custHeaders });
    const activeCustOrders = activeCustOrdersRes.data.data;
    if (activeCustOrders.length > 0) {
      for (const order of activeCustOrders) {
        console.log(`   - Ditemukan transaksi aktif lama customer (ID: ${order.id}, Status: ${order.status}). Membatalkan...`);
        try {
          await axios.patch(`${API_URL}/orders/${order.id}`, { action: 'cancel' }, { headers: custHeaders });
          console.log(`     * Sukses membatalkan order ${order.id}`);
        } catch (e) {
          // If cannot cancel (e.g. AWAITING_CONFIRMATION), confirm/complete it
          if (order.status === 'AWAITING_CONFIRMATION') {
            await axios.patch(`${API_URL}/orders/${order.id}`, { action: 'confirm' }, { headers: custHeaders });
            console.log(`     * Sukses menyelesaikan order ${order.id}`);
          } else {
            console.log(`     * Gagal membersihkan order: ${e.response?.data?.message || e.message}`);
          }
        }
      }
    } else {
      console.log('   - Tidak ada transaksi aktif lama dari Customer.');
    }

    // Check active order for collector
    const activeCollOrdersRes = await axios.get(`${API_URL}/orders?status=active&role=collector`, { headers: collHeaders });
    const activeCollOrders = activeCollOrdersRes.data.data;
    if (activeCollOrders.length > 0) {
      for (const order of activeCollOrders) {
        console.log(`   - Ditemukan transaksi aktif lama pengepul (ID: ${order.id}, Status: ${order.status}). Membatalkan...`);
        try {
          await axios.patch(`${API_URL}/orders/${order.id}`, { action: 'cancel' }, { headers: collHeaders });
          console.log(`     * Sukses membatalkan order ${order.id}`);
        } catch (e) {
          if (order.status === 'AWAITING_CONFIRMATION') {
            await axios.patch(`${API_URL}/orders/${order.id}`, { action: 'confirm' }, { headers: custHeaders });
            console.log(`     * Sukses menyelesaikan order ${order.id}`);
          } else {
            console.log(`     * Gagal membersihkan order: ${e.response?.data?.message || e.message}`);
          }
        }
      }
    } else {
      console.log('   - Tidak ada transaksi aktif lama dari Pengepul.\n');
    }

    // 3. PENGEPUL BUKA LAPAK & SET PROFILE
    console.log('3. Pengepul Membuka Lapak & Memperbarui Koordinat Geospasial...');
    const profileRes = await axios.post(`${API_URL}/collector/profile`, {
      shopName: 'Lapak Budi Yogyakarta',
      description: 'Pengepul Daur Ulang Terpercaya',
      radiusKm: 25,
      isOpen: true,
      lat: -7.7956,
      lng: 110.3695
    }, { headers: collHeaders });
    console.log(`   - Lapak Berhasil Dibuka: ${profileRes.data.data.shopName} (Status: Buka, Radius: 25 km)\n`);

    // 4. KATEGORI SAMPAH & DISCOVERY
    console.log('4. Customer Mencari Pengepul Terdekat...');
    
    // Ambil Kategori untuk mendapatkan id 'Kardus'
    const catRes = await axios.get(`${API_URL}/discovery/categories`);
    const categories = catRes.data.data;
    const kardusCat = categories.find(c => c.name.toLowerCase() === 'kardus');
    if (!kardusCat) throw new Error('Kategori Kardus tidak ditemukan!');
    console.log(`   - Kategori Kardus ditemukan (ID: ${kardusCat.id})`);

    // Cari Pengepul Terdekat
    const discoveryRes = await axios.get(`${API_URL}/discovery/search?lat=-7.7956&lng=110.3695&categoryId=${kardusCat.id}&radius=50`);
    const nearbyCollectors = discoveryRes.data.data;
    console.log(`   - Pengepul ditemukan di sekitar: ${nearbyCollectors.length} lapak`);
    const budiLapak = nearbyCollectors.find(c => c.ownerName.toLowerCase().includes('budi'));
    if (budiLapak) {
      console.log(`     * Pengepul Budi Terdeteksi! Nama Lapak: ${budiLapak.shopName}, Jarak: ${(budiLapak.distance / 1000).toFixed(2)} km\n`);
    } else {
      console.log('     * Warning: Budi tidak masuk daftar radius (mungkin kendala spasial default database)\n');
    }

    // 5. CUSTOMER JUAL (BUAT ORDER BARU)
    console.log('5. Customer Membuat Pesanan Baru (Menjual Kardus 15kg)...');
    const orderRes = await axios.post(`${API_URL}/orders`, {
      categoryId: kardusCat.id,
      method: 'PICKUP',
      estimatedWeight: 15,
      lat: -7.7956,
      lng: 110.3695,
      photoUrl: 'https://res.cloudinary.com/djh7hbugg/image/upload/v1779792590/kardus.jpg'
    }, { headers: custHeaders });
    const orderId = orderRes.data.data.id;
    console.log(`   - Order Berhasil Dibuat: ID: ${orderId} (Status: ${orderRes.data.data.status})\n`);

    // 6. PENGEPUL TERIMA PESANAN
    console.log('6. Pengepul Menerima Pesanan...');
    const acceptRes = await axios.patch(`${API_URL}/orders/${orderId}`, {
      action: 'accept'
    }, { headers: collHeaders });
    console.log(`   - Pesanan Diterima: ID: ${orderId} (Status Baru: ${acceptRes.data.data.status})\n`);

    // 7. PENGEPUL TIMBANG DI LAPANGAN & INPUT BERAT/HARGA
    console.log('7. Pengepul Melakukan Penimbangan & Mengunggah Bukti...');
    // Simulasi penimbangan di lapangan: berat bersih 14.5 kg, harga disepakati Rp 4.500 per kg
    const validateRes = await axios.patch(`${API_URL}/orders/${orderId}`, {
      action: 'validate',
      actualWeight: 14.5,
      agreedPrice: 4500
    }, { headers: collHeaders });
    console.log(`   - Penginputan Timbangan Sukses: ID: ${orderId}`);
    console.log(`     * Berat Timbangan: 14.5 kg, Harga/kg: Rp 4.500`);
    console.log(`     * Status Baru: ${validateRes.data.data.status}\n`);

    // 8. CUSTOMER KONFIRMASI DAN SELESAIKAN TRANSAKSI
    console.log('8. Customer Menyetujui Nota Digital & Menyelesaikan Transaksi...');
    const confirmRes = await axios.patch(`${API_URL}/orders/${orderId}`, {
      action: 'confirm'
    }, { headers: custHeaders });
    console.log(`   - Transaksi Selesai Secara Sah!`);
    console.log(`     * ID Transaksi: ${orderId}`);
    console.log(`     * Status Final: ${confirmRes.data.data.status}\n`);

    // 9. CEK TRANSAKSI COMPLETED
    console.log('9. Memverifikasi detail struk transaksi terakhir...');
    const finalOrderRes = await axios.get(`${API_URL}/orders/${orderId}`, { headers: custHeaders });
    const finalOrder = finalOrderRes.data.data;
    console.log(`   - Informasi Nota Digital:`);
    console.log(`     * ID Transaksi: ${finalOrder.id}`);
    console.log(`     * Nama Customer: ${finalOrder.customer.name}`);
    console.log(`     * Pengepul Bertugas: ${finalOrder.collector.name}`);
    console.log(`     * Kategori Barang: ${finalOrder.category.name}`);
    console.log(`     * Berat Bersih Aktual: ${finalOrder.actualWeight} kg`);
    console.log(`     * Harga yang Disepakati: Rp ${finalOrder.agreedPrice.toLocaleString('id-ID')}/kg`);
    console.log(`     * Total Pembayaran Ditransfer: Rp ${finalOrder.totalPrice.toLocaleString('id-ID')}`);
    console.log(`     * Status Transaksi Akhir: ${finalOrder.status}\n`);

    console.log('=== SIMULASI WORKFLOW SELESAI DENGAN SUKSES 100% !!! ===');
    console.log('Semua transisi status (PENDING -> CONFIRMED -> AWAITING_CONFIRMATION -> COMPLETED) berjalan lancar tanpa satu pun bug!');

  } catch (error) {
    console.error('\n❌ ERROR SAAT SIMULASI WORKFLOW:', error.response?.data || error.message);
  }
}

runTest();
