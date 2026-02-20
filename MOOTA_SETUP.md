# Panduan Konfigurasi Moota (Sandbox / Testing)

Karena Moota adalah layanan "Cek Mutasi Bank", konsep "Sandbox"-nya adalah dengan menggunakan **Fitur Testing Webhook** yang disediakan Moota, atau melakukan transfer nominal unik Rp 1 perak antar rekening sendiri.

## 1. Persiapan Environment Variable
Tambahkan configuration berikut di file `.env.local` Anda:

```bash
# Moota Configuration
MOOTA_WEBHOOK_SECRET=secret_string_dari_moota
```

## 2. Setup Webhook di Dashboard Moota
1.  Login ke [Moota.co](https://moota.co).
2.  Masuk ke menu **Webhook** atau **Integrasi**.
3.  Buat Webhook baru:
    *   **URL**: `https://[DOMAIN_ANDA]/api/integrations/moota/notify`
    *   **Secret Key**: (Copy string acak di sini dan masukkan ke `.env.local`).
    *   **Events**: Centang `bank_mutation.created` (atau sejenisnya).
    *   **Trigger**: On Credit (Uang Masuk).

> **PENTING (Localhost):**
> Jika Anda masih di localhost, Moota TIDAK BISA mengirim webhook ke `localhost:3000`.
> Anda harus menggunakan layanan "Tunneling" untuk membuat website lokal Anda bisa diakses internet.

### Cara Mendapatkan URL Webhook (Menggunakan Ngrok)
1.  Download **ngrok** di [ngrok.com](https://ngrok.com/download) dan install.
2.  Buka terminal/CMD baru, jalankan:
    ```bash
    ngrok http 3000
    ```
3.  Ngrok akan memberikan URL publik, contoh: `https://abcd-1234.ngrok-free.app`
4.  Copy URL tersebut.
5.  URL Webhook Anda adalah: `https://abcd-1234.ngrok-free.app/api/integrations/moota/notify`
6.  Masukkan URL ini ke Dashboard Moota.

## 3. Cara Testing (Simulasi / Sandbox)
Moota menyediakan fitur "Push Test Notification" di dashboard mereka.

1.  Di Dashboard Moota, cari tombol **Test Webhook** atau **Simulasi**.
2.  Isi payload dummy:
    *   **Bank**: BCA
    *   **Amount**: `199.123` (Sesuaikan dengan angka unik yang muncul di Billing Page Anda).
    *   **Description**: "TRANSFER DARI TEST"
3.  Klik **Kirim / Send**.
4.  Cek Dashboard Relate AI Anda, status harusnya otomatis berubah jadi **PRO**.

## 4. Cara Testing Real (Uang Asli)
1.  Klik "Upgrade" di Relate AI Dashboard.
2.  Dapatkan kode unik, misal: `Rp 99.456`.
3.  Transfer `Rp 99.456` dari rekening bank lain ke rekening yang terdaftar di Moota.
4.  Tunggu 1-5 menit (tergantung interval crawl Moota).
5.  Saat mutasi muncul di E-Banking -> Moota tangkap -> Kirim Webhook -> Akun Upgrade.
