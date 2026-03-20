'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Banner {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  bgColor: string;
  textColor: string;
  link?: string;
  isActive: boolean;
  sortOrder: number;
}

interface FormData {
  title: string;
  description: string;
  imageUrl: string;
  bgColor: string;
  textColor: string;
  link: string;
}

export default function BannersPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    imageUrl: '',
    bgColor: '#f6de48',
    textColor: '#151515',
    link: '',
  });

  // Fetch banners
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const method = editingId ? 'PUT' : 'POST';
        const url = '/api/banners';
        const body = editingId ? { id: editingId, ...formData } : formData;

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          // Refresh banners
          const bannersRes = await fetch('/api/banners');
          if (bannersRes.ok) {
            const data = await bannersRes.json();
            setBanners(Array.isArray(data) ? data : []);
          }

          setShowForm(false);
          setEditingId(null);
          setFormData({
            title: '',
            description: '',
            imageUrl: '',
            bgColor: '#f6de48',
            textColor: '#151515',
            link: '',
          });

          alert(editingId ? 'Banner updated!' : 'Banner created!');
        } else {
          alert('Failed to save banner');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
      }
    });
  };

  const handleEdit = (banner: Banner) => {
    setFormData({
      title: banner.title,
      description: banner.description || '',
      imageUrl: banner.imageUrl,
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
      const res = await fetch(`/api/banners?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setBanners(banners.filter((b) => b.id !== id));
        alert('Banner deleted!');
      } else {
        alert('Failed to delete banner');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      bgColor: '#f6de48',
      textColor: '#151515',
      link: '',
    });
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
        <h1 className="text-2xl font-black text-[#171717]">Offer Banners</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-[#1768d6] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1559b8]"
          >
            + Add Banner
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="space-y-4 rounded-xl border border-[#efefef] bg-white p-4">
          <h2 className="text-lg font-bold text-[#171717]">{editingId ? 'Edit Banner' : 'Create Banner'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#444] uppercase tracking-wide">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#ececec] bg-[#fafafa] px-3 py-2 text-sm focus:border-[#1768d6] focus:outline-none"
                placeholder="e.g., Summer Sale Up to 50%"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#444] uppercase tracking-wide">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#ececec] bg-[#fafafa] px-3 py-2 text-sm focus:border-[#1768d6] focus:outline-none"
                placeholder="Optional banner tagline"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#444] uppercase tracking-wide">Image URL</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#ececec] bg-[#fafafa] px-3 py-2 text-sm focus:border-[#1768d6] focus:outline-none"
                placeholder="https://example.com/image.jpg"
                required
              />
              {formData.imageUrl && (
                <div className="mt-2 h-32 rounded-lg bg-[#fafafa] overflow-hidden">
                  <img src={formData.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#444] uppercase tracking-wide">BG Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.bgColor}
                    onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                    className="h-10 w-16 cursor-pointer rounded-lg border border-[#ececec]"
                  />
                  <input
                    type="text"
                    value={formData.bgColor}
                    onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                    className="flex-1 rounded-lg border border-[#ececec] bg-[#fafafa] px-2 py-2 text-xs font-mono focus:border-[#1768d6] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444] uppercase tracking-wide">Text Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.textColor}
                    onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                    className="h-10 w-16 cursor-pointer rounded-lg border border-[#ececec]"
                  />
                  <input
                    type="text"
                    value={formData.textColor}
                    onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                    className="flex-1 rounded-lg border border-[#ececec] bg-[#fafafa] px-2 py-2 text-xs font-mono focus:border-[#1768d6] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#444] uppercase tracking-wide">Link (Optional)</label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#ececec] bg-[#fafafa] px-3 py-2 text-sm focus:border-[#1768d6] focus:outline-none"
                placeholder="https://example.com/products"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-lg bg-[#1768d6] px-4 py-2 text-sm font-bold text-white transition disabled:opacity-50 hover:bg-[#1559b8]"
              >
                {isPending ? 'Saving...' : editingId ? 'Update Banner' : 'Create Banner'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 rounded-lg border border-[#ececec] bg-white px-4 py-2 text-sm font-bold text-[#444] transition hover:bg-[#fafafa]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banner List */}
      <div className="space-y-3">
        {banners.length === 0 ? (
          <div className="rounded-xl border border-[#efefef] bg-[#fafafa] px-4 py-8 text-center">
            <p className="text-sm text-[#767676]">No banners yet. Create your first offer banner!</p>
          </div>
        ) : (
          banners.map((banner) => (
            <div
              key={banner.id}
              className="flex items-center gap-4 rounded-xl border border-[#efefef] p-4 hover:bg-[#fafafa]"
              style={{ backgroundColor: banner.bgColor, opacity: banner.isActive ? 1 : 0.6 }}
            >
              {banner.imageUrl && (
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-[#efefef]">
                  <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#171717]" style={{ color: banner.textColor }}>
                  {banner.title}
                </h3>
                {banner.description && (
                  <p className="text-sm text-[#767676]" style={{ color: banner.textColor }}>
                    {banner.description}
                  </p>
                )}
                <p className="text-xs text-[#949494] mt-1">Sort: {banner.sortOrder} · {banner.isActive ? 'Active' : 'Inactive'}</p>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(banner)}
                  className="rounded-lg bg-[#1768d6] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#1559b8]"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="rounded-lg bg-[#f04747] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#d93a3a]"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
