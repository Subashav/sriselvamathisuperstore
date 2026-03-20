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
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[#efefef]" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-[#efefef]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#171717]">Banner Management</h1>
          <p className="mt-1 text-sm text-[#5d5d5d]">Create separate text banners for the scrolling strip and image banners for the homepage carousel.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-[#1768d6] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1559b8]"
          >
            Add Banner
          </button>
        )}
      </div>

      {showForm && (
        <div className="space-y-4 rounded-xl border border-[#efefef] bg-white p-4">
          <h2 className="text-lg font-bold text-[#171717]">{editingId ? 'Edit Banner' : 'Create Banner'}</h2>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, type: 'TEXT', imageUrl: '' }))}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                formData.type === 'TEXT' ? 'bg-[#1768d6] text-white' : 'border border-[#e5e5e5] text-[#555] hover:bg-[#f8f8f8]'
              }`}
            >
              Text Banner (Scrolling Strip)
            </button>
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, type: 'IMAGE' }))}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                formData.type === 'IMAGE' ? 'bg-[#1768d6] text-white' : 'border border-[#e5e5e5] text-[#555] hover:bg-[#f8f8f8]'
              }`}
            >
              Image Banner (Homepage Carousel)
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#444]">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[#ececec] bg-[#fafafa] px-3 py-2 text-sm focus:border-[#1768d6] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#444]">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[#ececec] bg-[#fafafa] px-3 py-2 text-sm focus:border-[#1768d6] focus:outline-none"
                placeholder={formData.type === 'TEXT' ? 'Optional subtitle for scrolling text' : 'Optional subtitle for carousel'}
              />
            </div>

            {formData.type === 'IMAGE' ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-[#444]">Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-[#ececec] bg-[#fafafa] px-3 py-2 text-sm focus:border-[#1768d6] focus:outline-none"
                  placeholder="https://example.com/banner.jpg"
                  required
                />
                {formData.imageUrl && (
                  <div className="mt-2 h-32 overflow-hidden rounded-lg bg-[#fafafa]">
                    <img src={formData.imageUrl} alt="Banner preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-[#444]">BG Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.bgColor}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bgColor: e.target.value }))}
                    className="h-10 w-16 cursor-pointer rounded-lg border border-[#ececec]"
                  />
                  <input
                    type="text"
                    value={formData.bgColor}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bgColor: e.target.value }))}
                    className="flex-1 rounded-lg border border-[#ececec] bg-[#fafafa] px-2 py-2 text-xs font-mono focus:border-[#1768d6] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-[#444]">Text Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.textColor}
                    onChange={(e) => setFormData((prev) => ({ ...prev, textColor: e.target.value }))}
                    className="h-10 w-16 cursor-pointer rounded-lg border border-[#ececec]"
                  />
                  <input
                    type="text"
                    value={formData.textColor}
                    onChange={(e) => setFormData((prev) => ({ ...prev, textColor: e.target.value }))}
                    className="flex-1 rounded-lg border border-[#ececec] bg-[#fafafa] px-2 py-2 text-xs font-mono focus:border-[#1768d6] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#444]">Link (Optional)</label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[#ececec] bg-[#fafafa] px-3 py-2 text-sm focus:border-[#1768d6] focus:outline-none"
                placeholder="https://example.com/products"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-lg bg-[#1768d6] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1559b8] disabled:opacity-50"
              >
                {isPending ? 'Saving...' : editingId ? 'Update Banner' : 'Create Banner'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 rounded-lg border border-[#ececec] bg-white px-4 py-2 text-sm font-bold text-[#444] transition hover:bg-[#fafafa]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wide text-[#333]">Text Banners (Scrolling Strip)</h2>
        {textBanners.length === 0 ? (
          <div className="rounded-xl border border-[#efefef] bg-[#fafafa] px-4 py-6 text-sm text-[#767676]">
            No text banners configured.
          </div>
        ) : (
          textBanners.map((banner) => (
            <article key={banner.id} className="flex items-start gap-4 rounded-xl border border-[#efefef] p-4" style={{ backgroundColor: banner.bgColor }}>
              <div className="flex-1">
                <h3 className="font-bold" style={{ color: banner.textColor }}>{banner.title}</h3>
                {banner.description ? <p className="text-sm" style={{ color: banner.textColor }}>{banner.description}</p> : null}
                <p className="mt-1 text-xs text-[#666]">Sort: {banner.sortOrder} Â· Active: {banner.isActive ? 'Yes' : 'No'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(banner)} className="rounded-lg bg-[#1768d6] px-3 py-2 text-xs font-bold text-white hover:bg-[#1559b8]">Edit</button>
                <button onClick={() => handleDelete(banner.id)} className="rounded-lg bg-[#ef4444] px-3 py-2 text-xs font-bold text-white hover:bg-[#dc2626]">Delete</button>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wide text-[#333]">Image Banners (Homepage Carousel)</h2>
        {imageBanners.length === 0 ? (
          <div className="rounded-xl border border-[#efefef] bg-[#fafafa] px-4 py-6 text-sm text-[#767676]">
            No image banners configured.
          </div>
        ) : (
          imageBanners.map((banner) => (
            <article key={banner.id} className="flex items-center gap-4 rounded-xl border border-[#efefef] p-4">
              {banner.imageUrl ? (
                <div className="h-20 w-20 overflow-hidden rounded-lg bg-[#efefef]">
                  <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-[#171717]">{banner.title}</h3>
                {banner.description ? <p className="text-sm text-[#666]">{banner.description}</p> : null}
                <p className="mt-1 text-xs text-[#666]">Sort: {banner.sortOrder} Â· Active: {banner.isActive ? 'Yes' : 'No'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(banner)} className="rounded-lg bg-[#1768d6] px-3 py-2 text-xs font-bold text-white hover:bg-[#1559b8]">Edit</button>
                <button onClick={() => handleDelete(banner.id)} className="rounded-lg bg-[#ef4444] px-3 py-2 text-xs font-bold text-white hover:bg-[#dc2626]">Delete</button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

