'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';

type BannerType = 'TEXT' | 'IMAGE';

interface Banner {
  id: string;
  type: BannerType;
  title: string;
  description?: string;
  imageUrl?: string | null;
  bgColor: string;
  textColor: string;
  link?: string;
  isActive: boolean;
  sortOrder: number;
}

interface FormData {
  type: BannerType;
  title: string;
  description: string;
  imageUrl: string;
  bgColor: string;
  textColor: string;
  link: string;
}

const INITIAL_FORM: FormData = {
  type: 'TEXT',
  title: '',
  description: '',
  imageUrl: '',
  bgColor: '#fb923c',
  textColor: '#151515',
  link: '',
};

export default function BannersPage() {
  const [isPending, startTransition] = useTransition();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);

  const textBanners = useMemo(() => banners.filter((banner) => banner.type === 'TEXT'), [banners]);
  const imageBanners = useMemo(() => banners.filter((banner) => banner.type === 'IMAGE'), [banners]);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch('/api/banners');
        if (res.ok) {
          const data = await res.json();
          setBanners(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to fetch banners:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const refreshBanners = async () => {
    const bannersRes = await fetch('/api/banners');
    if (bannersRes.ok) {
      const data = await bannersRes.json();
      setBanners(Array.isArray(data) ? data : []);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(INITIAL_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.type === 'IMAGE' && !formData.imageUrl.trim()) {
      alert('Image URL is required for image banners.');
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          ...formData,
          imageUrl: formData.type === 'IMAGE' ? formData.imageUrl.trim() : '',
        };

        const method = editingId ? 'PUT' : 'POST';
        const body = editingId ? { id: editingId, ...payload } : payload;

        const res = await fetch('/api/banners', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          let message = 'Failed to save banner';
          try {
            const errorPayload = await res.json();
            message = errorPayload?.error?.message || message;
          } catch {
            // keep default message
          }
          alert(message);
          return;
        }

        await refreshBanners();
        resetForm();
        alert(editingId ? 'Banner updated' : 'Banner created');
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
      }
    });
  };

  const handleEdit = (banner: Banner) => {
    setFormData({
      type: banner.type,
      title: banner.title,
      description: banner.description || '',
      imageUrl: banner.imageUrl || '',
      bgColor: banner.bgColor,
      textColor: banner.textColor,
      link: banner.link || '',
    });
    setEditingId(banner.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const res = await fetch(`/api/banners?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        let message = 'Failed to delete banner';
        try {
          const errorPayload = await res.json();
          message = errorPayload?.error?.message || message;
        } catch {
          // keep default message
        }
        alert(message);
        return;
      }

      setBanners((prev) => prev.filter((banner) => banner.id !== id));
      alert('Banner deleted');
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-10 space-y-8 animate-pulse">
        <div className="h-10 w-64 rounded-2xl bg-slate-100" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-slate-50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="p-6 lg:p-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Promotional Banners</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Configure homepage hero banners and announcement tickers.</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="rounded-2xl bg-amber-500 px-8 py-4 text-sm font-black text-slate-900 shadow-xl shadow-amber-200/50 transition-all hover:bg-amber-400 active:scale-95"
            >
              ✨ Add New Banner
            </button>
          )}
        </div>

        {showForm && (
          <article className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="mb-8 text-sm font-black uppercase tracking-widest text-slate-900">{editingId ? 'Edit Configuration' : 'New Banner Configuration'}</h2>

            <div className="mb-8 flex gap-3">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: 'TEXT', imageUrl: '' }))}
                className={`rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${
                  formData.type === 'TEXT' 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                Text Ticker
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: 'IMAGE' }))}
                className={`rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${
                  formData.type === 'IMAGE' 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                Hero Carousel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Headline</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50"
                    placeholder="e.g. MEGA SUMMER SALE"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sub-headline</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50"
                    placeholder="Optional details..."
                  />
                </div>
              </div>

              {formData.type === 'IMAGE' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Banner Asset (URL)</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50"
                    placeholder="https://..."
                    required
                  />
                  {formData.imageUrl && (
                    <div className="mt-4 h-48 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                      <img src={formData.imageUrl} alt="Banner preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Background</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.bgColor}
                      onChange={(e) => setFormData((prev) => ({ ...prev, bgColor: e.target.value }))}
                      className="h-12 w-16 cursor-pointer rounded-xl border border-slate-100"
                    />
                    <span className="text-xs font-mono font-bold text-slate-500">{formData.bgColor}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Text Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.textColor}
                      onChange={(e) => setFormData((prev) => ({ ...prev, textColor: e.target.value }))}
                      className="h-12 w-16 cursor-pointer rounded-xl border border-slate-100"
                    />
                    <span className="text-xs font-mono font-bold text-slate-500">{formData.textColor}</span>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Destination Link</label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold outline-none focus:border-amber-400"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl bg-slate-50 px-8 py-4 text-sm font-bold text-slate-500 transition-all hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-2xl bg-amber-500 px-10 py-4 text-sm font-black text-slate-900 shadow-xl shadow-amber-200/50 transition-all hover:bg-amber-400 disabled:opacity-50"
                >
                  {isPending ? 'Processing...' : editingId ? 'Update Configuration' : 'Launch Banner'}
                </button>
              </div>
            </form>
          </article>
        )}

        <div className="grid gap-12">
          {/* Text Banners Section */}
          <section>
            <h2 className="mb-6 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
              <span>Text Ticker List</span>
              <div className="h-px flex-1 bg-slate-100" />
            </h2>
            {textBanners.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-100 py-12 text-center">
                <p className="text-sm font-bold text-slate-300">No active text tickers found.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {textBanners.map((banner) => (
                  <article key={banner.id} className="group relative flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100/50 transition-all hover:border-amber-100">
                    <div className="flex flex-1 items-center gap-6">
                      <div className="h-12 w-1 rounded-full" style={{ backgroundColor: banner.bgColor }} />
                      <div>
                        <h3 className="text-base font-black text-slate-900">{banner.title}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ticker • Active: {banner.isActive ? 'Y' : 'N'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(banner)} className="rounded-xl bg-slate-50 p-2.5 text-lg hover:bg-amber-50 hover:text-amber-600 transition-all">✏️</button>
                      <button onClick={() => handleDelete(banner.id)} className="rounded-xl bg-slate-50 p-2.5 text-lg hover:bg-rose-50 hover:text-rose-600 transition-all">🗑️</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Image Banners Section */}
          <section>
            <h2 className="mb-6 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
              <span>Hero Carousel List</span>
              <div className="h-px flex-1 bg-slate-100" />
            </h2>
            {imageBanners.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-100 py-12 text-center">
                <p className="text-sm font-bold text-slate-300">No Hero banners configured.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {imageBanners.map((banner) => (
                  <article key={banner.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:border-amber-100">
                    <div className="aspect-[21/9] w-full bg-slate-100 overflow-hidden">
                      {banner.imageUrl ? (
                        <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl">🖼️</div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-900">{banner.title}</h3>
                          <p className="mt-1 text-xs font-medium text-slate-500 line-clamp-1">{banner.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(banner)} className="rounded-xl bg-slate-50 p-2 text-md hover:bg-amber-50 hover:text-amber-600 transition-all">✏️</button>
                          <button onClick={() => handleDelete(banner.id)} className="rounded-xl bg-slate-50 p-2 text-md hover:bg-rose-50 hover:text-rose-600 transition-all">🗑️</button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

