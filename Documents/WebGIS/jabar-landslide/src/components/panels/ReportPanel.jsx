import React, { useState } from 'react';
import { AlertTriangle, Send, MapPin, Camera, CheckCircle2 } from 'lucide-react';

export default function ReportPanel({ onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    region: 'Kab. Cianjur',
    coords: '',
    description: '',
    severity: 'Tinggi'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate submission to Google Sheets API
    setSubmitted(true);
    setTimeout(() => {
      // Auto close after 3 seconds if needed
    }, 3000);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({
            ...prev,
            coords: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`
          }));
        },
        () => alert('Gagal mendeteksi lokasi otomatis. Mohon ketik manual.')
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up text-left">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl glass-panel-elevated border border-white/15 p-6 sm:p-8 shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>FORMULIR PELAPORAN CEPAT WARGA</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Laporkan Titik Longsor / Retakan Tanah
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer text-lg font-bold"
          >
            &times;
          </button>
        </div>

        {submitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Laporan Berhasil Terkirim!</h3>
            <p className="text-sm text-zinc-300 max-w-md mx-auto">
              Data koordinat telah diteruskan ke posko siaga BPBD Jawa Barat dan bot peringatan Telegram untuk verifikasi tim lapangan.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 rounded-full bg-emerald-400 text-zinc-950 font-semibold text-xs hover:bg-emerald-300 transition-colors"
            >
              Kembali ke Aplikasi
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Nama Pelapor</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Nomor WhatsApp / Telp</label>
                <input
                  type="tel"
                  required
                  placeholder="0812-XXXX-XXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Kabupaten / Kota</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="Kab. Cianjur">Kabupaten Cianjur</option>
                  <option value="Kab. Bandung Barat">Kabupaten Bandung Barat</option>
                  <option value="Kab. Sukabumi">Kabupaten Sukabumi</option>
                  <option value="Kab. Garut">Kabupaten Garut</option>
                  <option value="Kab. Tasikmalaya">Kabupaten Tasikmalaya</option>
                  <option value="Kab. Bogor">Kabupaten Bogor</option>
                  <option value="Kab. Sumedang">Kabupaten Sumedang</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Tingkat Bahaya</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="Kritis">Kritis (Jalan Terputus / Rumah Tertimbun)</option>
                  <option value="Tinggi">Tinggi (Retakan Mahkota Lereng Aktif)</option>
                  <option value="Sedang">Sedang (Rembesan Lumpur & Pohon Miring)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-zinc-300 font-medium">Titik Koordinat (Latitude, Longitude)</label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3 h-3" /> Ambil Lokasi Saya
                </button>
              </div>
              <input
                type="text"
                placeholder="-6.9175, 107.6191"
                value={formData.coords}
                onChange={(e) => setFormData({ ...formData, coords: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Deskripsi & Kondisi Lapangan</label>
              <textarea
                rows="3"
                required
                placeholder="Jelaskan kondisi lereng, material longsoran, atau apakah ada warga yang memerlukan evakuasi darurat..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-semibold transition-all shadow-lg shadow-rose-500/20 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Laporan Bencana</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
