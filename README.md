# SipilMU

SipilMU adalah aplikasi web yang menyediakan informasi harga satuan pekerjaan (AHSP) dan standar konstruksi untuk proyek sipil di Indonesia. Aplikasi ini dirancang untuk membantu para profesional konstruksi, kontraktor, dan arsitek dalam estimasi biaya proyek dengan cepat dan akurat.

## Fitur Utama

- 📊 **Database AHSP Lengkap** - Kumpulan harga satuan pekerjaan untuk berbagai jenis pekerjaan konstruksi
- 🏗️ **Kategori Pekerjaan Beragam** - Mencakup:
  - Persiapan
  - Struktur Beton
  - Baja & Logam
  - Bekisting
  - Beton Pracetak
  - Dinding
  - Bata
  - Plester & Finishing
  - Keramik & Lantai
  - Cat & Pelapis
  - Kayu & Kusen
  - Pintu, Jendela & Kaca
  - Pipa Air
  - Sanitair
  - Elektrikal
  - Wiremesh
  - Paving & Pasangan
  - Dan lainnya

- 🎨 **Interface yang User-Friendly** - Navigasi mudah dan responsif
- 📱 **Responsive Design** - Dapat diakses dari berbagai perangkat
- 📚 **Panduan Lengkap** - Dilengkapi dengan panduan penggunaan dan modifikasi

## Struktur Proyek

```
sipilmuV2/
├── index.html                 # Halaman utama
├── script.js                  # Logika aplikasi
├── style.css                  # Stylesheet
├── ahsp-data.js              # Database AHSP
├── PANDUAN_AHSP.txt          # Panduan AHSP
├── PANDUAN_MODIFIKASI.txt    # Panduan modifikasi
├── CATATAN_REFACTOR.txt      # Catatan refactoring
├── LOGO.png                  # Logo aplikasi
├── logo_sipilmu-removebg-preview.png
└── menu/                     # Halaman-halaman kategori
    ├── persiapan.html
    ├── struktur-beton.html
    ├── baja-logam.html
    └── ... (file-file lainnya)
```

## Cara Menggunakan

1. **Clone Repository**
   ```bash
   git clone https://github.com/PrasetyaRiski/SipilMU.git
   ```

2. **Buka Aplikasi**
   - Buka file `index.html` di browser web Anda

3. **Navigasi Kategori**
   - Pilih kategori pekerjaan dari menu
   - Lihat daftar harga satuan pekerjaan
   - Gunakan informasi untuk estimasi proyek Anda

## Panduan Pengembangan

### Menambah Data AHSP Baru

1. Edit file `ahsp-data.js` untuk menambah atau mengubah data harga
2. Ikuti format JSON yang sudah ada
3. Buat halaman kategori baru di folder `menu/` jika diperlukan

### Memodifikasi Tampilan

- Edit file `style.css` untuk mengubah desain
- Ubah konten HTML di file-file kategori di folder `menu/`
- Modifikasi `script.js` untuk fungsionalitas baru

Lihat `PANDUAN_MODIFIKASI.txt` untuk panduan detail.

## Teknologi yang Digunakan

- HTML5
- CSS3
- JavaScript (Vanilla)

## Kontribusi

Kami menyambut kontribusi dari Anda! Silakan:

1. Fork repository
2. Buat branch fitur (`git checkout -b fitur/AmazingFeature`)
3. Commit perubahan Anda (`git commit -m 'Menambah AmazingFeature'`)
4. Push ke branch (`git push origin fitur/AmazingFeature`)
5. Buka Pull Request

## Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT - lihat file [LICENSE](LICENSE) untuk detail lebih lanjut.

## Kontak

- GitHub: [PrasetyaRiski](https://github.com/PrasetyaRiski)
- Repository: [SipilMU](https://github.com/PrasetyaRiski/SipilMU)

## Disclaimer

Data harga satuan pekerjaan dalam aplikasi ini disediakan sebagai referensi umum. Harga dapat berbeda-beda tergantung:
- Lokasi geografis
- Waktu
- Ketersediaan material
- Kondisi pasar

Selalu verifikasi harga dengan sumber terpercaya sebelum membuat estimasi proyek.

---

**Dibuat dengan ❤️ untuk komunitas konstruksi Indonesia**
