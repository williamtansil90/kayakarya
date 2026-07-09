import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { adminApi, authApi } from '../../api';
import { Image, X } from 'lucide-react';

const emptySettings = {
  tagline: '',
  title: '',
  subtitle: '',
  cta_text: '',
  wallpaper_url: '',
};

export default function AdminHomepage() {
  const [settings, setSettings] = useState(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await adminApi.getHomepageSettings();
      setSettings({
        ...emptySettings,
        ...res.data.settings,
        wallpaper_url: res.data.settings.wallpaper_url || '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWallpaperUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await authApi.upload(file);
      setSettings((prev) => ({ ...prev, wallpaper_url: res.data.url }));
    } catch {
      alert('Gagal upload wallpaper');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateHomepageSettings(settings);
      alert('Pengaturan halaman utama berhasil disimpan');
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar variant="admin" />
        <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="admin" />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-black mb-2">Pengaturan Halaman Utama</h1>
        <p className="text-gray-500 mb-6">Edit teks hero dan wallpaper background di halaman depan.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <input
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                placeholder="Belajar Kreatif, Raih Karya"
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Judul Utama</label>
              <input
                value={settings.title}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                placeholder="Temukan Course Kreatif Terbaik"
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea
                value={settings.subtitle}
                onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                placeholder="Belajar langsung dari para ahli..."
                className="w-full border rounded-lg px-3 py-2 h-24"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teks Tombol Login</label>
              <input
                value={settings.cta_text}
                onChange={(e) => setSettings({ ...settings, cta_text: e.target.value })}
                placeholder="Mulai dengan Google Account"
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-3">Wallpaper Background</label>
            {settings.wallpaper_url ? (
              <div className="relative mb-4">
                <img
                  src={settings.wallpaper_url}
                  alt="Wallpaper preview"
                  className="w-full max-h-64 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, wallpaper_url: '' })}
                  className="absolute top-2 right-2 bg-black text-white rounded-full w-8 h-8 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-black transition-colors mb-4">
                <Image className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">
                  {uploading ? 'Mengupload...' : 'Klik untuk upload wallpaper'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleWallpaperUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
            {settings.wallpaper_url && (
              <label className="inline-block text-sm text-black hover:underline cursor-pointer">
                Ganti wallpaper
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleWallpaperUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Kosongkan wallpaper untuk menggunakan background gradient default.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </form>
      </div>
    </div>
  );
}
