'use client';
import { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Banner from '@/components/ui/Banner';
import FormField from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { Plus, AlertTriangle, Pin, Megaphone, Pencil, Trash2 } from '@/components/animate-ui/icons';

export default function NewsEditor({ initialAnnouncements = [] }) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [pageError, setPageError] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Editing state
  const [editingNews, setEditingNews] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPinned, setEditPinned] = useState(false);

  // Delete state
  const [newsToDelete, setNewsToDelete] = useState(null);
  const { adminUser } = useAuth();

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !content.trim()) {
      setError('กรุณากรอกหัวข้อและเนื้อหาประกาศ');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: insertError } = await supabase
        .from('announcements')
        .insert({
          title: title.trim(),
          content: content.trim(),
          is_pinned: isPinned,
          created_by: adminUser?.id || null,
        })
        .select('*')
        .single();

      if (insertError) {
        setError('เกิดข้อผิดพลาด: ' + insertError.message);
      } else if (data) {
        setAnnouncements((prev) => [data, ...prev]);
        setTitle('');
        setContent('');
        setIsPinned(false);
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingNews) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: updateError } = await supabase
        .from('announcements')
        .update({
          title: editTitle.trim(),
          content: editContent.trim(),
          is_pinned: editPinned,
        })
        .eq('id', editingNews.id)
        .select('*')
        .single();

      if (!updateError && data) {
        setAnnouncements((prev) =>
          prev.map((n) => (n.id === editingNews.id ? data : n))
        );
        setEditingNews(null);
      } else {
        setPageError('แก้ไขไม่สำเร็จ: ' + updateError?.message);
      }
    } catch (err) {
      setPageError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!newsToDelete) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: delError } = await supabase
        .from('announcements')
        .delete()
        .eq('id', newsToDelete.id);

      if (!delError) {
        setAnnouncements((prev) => prev.filter((n) => n.id !== newsToDelete.id));
        setNewsToDelete(null);
      } else {
        setPageError('ลบไม่สำเร็จ: ' + delError.message);
      }
    } catch (err) {
      setPageError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Banner kind="error" onClose={() => setPageError('')}>{pageError}</Banner>
      {/* Create News Form */}
      <GlassCard style={{ padding: '1.75rem 2rem', marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--gold-600)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Plus size={18} />
          <span>สร้างข่าวประชาสัมพันธ์ใหม่</span>
        </h3>
        <form onSubmit={handleCreate}>
          {error && (
            <p style={{ color: 'var(--danger-text)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={15} />
              <span>{error}</span>
            </p>
          )}

          <FormField label="หัวข้อประกาศ" required>
            <input
              type="text"
              className="form-input"
              placeholder="เช่น แจ้งกำหนดการรายงานตัวนักกีฬาเปตอง..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </FormField>

          <FormField label="เนื้อหาประกาศ" required>
            <textarea
              className="form-input"
              rows={4}
              placeholder="รายละเอียดของข่าวหรือระเบียบการ..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              style={{ resize: 'vertical' }}
            />
          </FormField>

          <div style={{ margin: '1rem 0' }}>
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Pin size={14} style={{ color: 'var(--gold-600)' }} />
                <span>ปักหมุดประกาศนี้ไว้ด้านบนสุดของหน้าเว็บ</span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ padding: '0.65rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Megaphone size={16} />
            <span>{loading ? 'กำลังเผยแพร่...' : 'เผยแพร่ประกาศ'}</span>
          </button>
        </form>
      </GlassCard>

      {/* Announcements List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {announcements.map((news) => (
          <GlassCard
            key={news.id}
            style={{
              padding: '1.5rem',
              border: news.is_pinned
                ? '1px solid rgba(245, 158, 11, 0.5)'
                : '1px solid var(--glass-border)',
              background: news.is_pinned
                ? 'rgba(245, 158, 11, 0.08)'
                : 'var(--glass-bg)',
            }}
          >
            <div className="flex-between" style={{ marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                {news.is_pinned && (
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(245, 158, 11, 0.25)',
                      color: 'var(--gold-600)',
                      fontSize: '0.75rem',
                      marginRight: '0.5rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Pin size={11} />
                    <span>ปักหมุด</span>
                  </span>
                )}
                <span style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>
                  เผยแพร่เมื่อ: {formatDateTime(news.published_at || news.created_at)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  onClick={() => {
                    setEditingNews(news);
                    setEditTitle(news.title);
                    setEditContent(news.content);
                    setEditPinned(news.is_pinned || false);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Pencil size={12} />
                  <span>แก้ไข</span>
                </button>
                <button
                  onClick={() => setNewsToDelete(news)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: 'var(--danger-text)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Trash2 size={12} />
                  <span>ลบ</span>
                </button>
              </div>
            </div>

            <h4 style={{ fontSize: '1.15rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
              {news.title}
            </h4>
            <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {news.content}
            </p>
          </GlassCard>
        ))}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingNews}
        onClose={() => setEditingNews(null)}
        title="แก้ไขข่าวประชาสัมพันธ์"
      >
        <form onSubmit={handleUpdate} style={{ padding: '0.5rem 0' }}>
          <FormField label="หัวข้อประกาศ" required>
            <input
              type="text"
              className="form-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </FormField>

          <FormField label="เนื้อหาประกาศ" required>
            <textarea
              className="form-input"
              rows={4}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              required
              style={{ resize: 'vertical' }}
            />
          </FormField>

          <div style={{ margin: '1rem 0' }}>
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={editPinned}
                onChange={(e) => setEditPinned(e.target.checked)}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Pin size={14} style={{ color: 'var(--gold-600)' }} />
                <span>ปักหมุดประกาศนี้</span>
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setEditingNews(null)}
              className="btn btn-secondary btn-sm"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={loading}
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!newsToDelete}
        onClose={() => setNewsToDelete(null)}
        title="ยืนยันการลบประกาศ"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ color: 'var(--text)', marginBottom: '1.25rem' }}>
            คุณต้องการลบประกาศ <strong>&quot;{newsToDelete?.title}&quot;</strong> หรือไม่?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              onClick={() => setNewsToDelete(null)}
              className="btn btn-secondary btn-sm"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-primary btn-sm"
              disabled={loading}
              style={{ background: '#ef4444' }}
            >
              {loading ? 'กำลังลบ...' : 'ยืนยันลบ'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
