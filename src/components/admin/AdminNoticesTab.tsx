'use client';

import React, { useState } from 'react';
import { Megaphone, Bell, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import type { SocietyNotice, Society, NoticeType, NoticePriority } from '@/lib/types';

interface Props {
  notices: SocietyNotice[];
  societies: Society[];
  onPostNotice: (data: {
    societyId: string;
    societyName: string;
    title: string;
    content: string;
    type: NoticeType;
    priority: NoticePriority;
    authorName: string;
  }) => void;
  deactivateNotice: (id: string) => void;
}

function getNoticeTypeBadge(type: NoticeType) {
  switch (type) {
    case 'MAINTENANCE':
      return <span className="badge badge-amber">{type.replace('_', ' ')}</span>;
    case 'ALERT':
      return <span className="badge badge-rose">{type}</span>;
    case 'SERVICE_UPDATE':
      return <span className="badge badge-blue">SERVICE UPDATE</span>;
    default:
      return <span className="badge badge-slate">{type}</span>;
  }
}

export default function AdminNoticesTab({
  notices,
  societies,
  onPostNotice,
  deactivateNotice,
}: Props) {
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeSocietyId, setNoticeSocietyId] = useState('ALL');
  const [noticeType, setNoticeType] = useState<NoticeType>('ANNOUNCEMENT');
  const [noticePriority, setNoticePriority] = useState<NoticePriority>('NORMAL');
  const [noticeSuccess, setNoticeSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;

    const targetSociety = societies.find((s) => s.id === noticeSocietyId);
    const societyName =
      noticeSocietyId === 'ALL' ? 'All Societies' : targetSociety?.name || 'Local Society';

    onPostNotice({
      societyId: noticeSocietyId,
      societyName,
      title: noticeTitle.trim(),
      content: noticeContent.trim(),
      type: noticeType,
      priority: noticePriority,
      authorName: 'Estate Management',
    });

    setNoticeTitle('');
    setNoticeContent('');
    setNoticeSuccess('Notice broadcast successfully!');
    setTimeout(() => setNoticeSuccess(''), 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Notices List (Left) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Active Notices</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {notices.filter((n) => n.isActive).length} active / {notices.length} total
            </span>
          </div>

          {notices.length === 0 && (
            <div
              className="card"
              style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}
            >
              <Megaphone size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <p>No notices posted yet. Use the form to post your first society notice.</p>
            </div>
          )}

          {notices.map((notice) => (
            <div
              key={notice.id}
              className="card"
              style={{
                borderLeft: `3px solid ${notice.priority === 'URGENT' ? 'var(--accent-rose)' : notice.type === 'MAINTENANCE' ? 'var(--accent-amber)' : 'var(--primary)'}`,
                opacity: notice.isActive ? 1 : 0.45,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexWrap: 'wrap',
                      marginBottom: '6px',
                    }}
                  >
                    {getNoticeTypeBadge(notice.type)}
                    {notice.priority === 'URGENT' && (
                      <span className="badge badge-rose" style={{ fontSize: '0.62rem' }}>
                        URGENT
                      </span>
                    )}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      📍 {notice.societyId === 'ALL' ? 'All Societies' : notice.societyName}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>
                    {notice.title}
                  </div>
                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.5,
                      marginBottom: '8px',
                    }}
                  >
                    {notice.content}
                  </p>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      gap: '10px',
                    }}
                  >
                    <span>By: {notice.authorName}</span>
                    <span>
                      {new Date(notice.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deactivateNotice(notice.id)}
                  title={notice.isActive ? 'Deactivate notice' : 'Already inactive'}
                  disabled={!notice.isActive}
                  style={{
                    flexShrink: 0,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-light)',
                    background: notice.isActive ? '#fff' : 'var(--bg-subtle)',
                    color: notice.isActive ? 'var(--accent-rose)' : 'var(--text-muted)',
                    cursor: notice.isActive ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                  }}
                >
                  {notice.isActive ? (
                    <>
                      <EyeOff size={12} /> Deactivate
                    </>
                  ) : (
                    <>
                      <Eye size={12} /> Inactive
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Post New Notice Form (Right) */}
        <div className="card" style={{ position: 'sticky', top: '80px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Megaphone size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>Post New Notice</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Visible to residents of the selected society
              </div>
            </div>
          </div>

          {noticeSuccess && (
            <div
              style={{
                background: '#d1fae5',
                color: '#065f46',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px',
              }}
            >
              <CheckCircle2 size={15} /> {noticeSuccess}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div>
              <label className="form-label">Target Society</label>
              <select
                value={noticeSocietyId}
                onChange={(e) => setNoticeSocietyId(e.target.value)}
                className="form-input"
              >
                <option value="ALL">📢 All Societies (Platform-wide)</option>
                {societies.map((soc) => (
                  <option key={soc.id} value={soc.id}>
                    📍 {soc.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="form-label">Notice Type</label>
                <select
                  value={noticeType}
                  onChange={(e) => setNoticeType(e.target.value as NoticeType)}
                  className="form-input"
                >
                  <option value="ANNOUNCEMENT">📢 Announcement</option>
                  <option value="MAINTENANCE">🔧 Maintenance</option>
                  <option value="ALERT">🚨 Alert</option>
                  <option value="SERVICE_UPDATE">🔄 Service Update</option>
                </select>
              </div>
              <div>
                <label className="form-label">Priority</label>
                <select
                  value={noticePriority}
                  onChange={(e) => setNoticePriority(e.target.value as NoticePriority)}
                  className="form-input"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="URGENT">🔴 Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Notice Title</label>
              <input
                type="text"
                placeholder="e.g. Water supply disruption on Saturday morning"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Notice Content</label>
              <textarea
                placeholder="Write your notice message here. Be clear and informative for residents..."
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                className="form-input"
                rows={4}
                style={{ resize: 'vertical', minHeight: '90px' }}
                required
              />
            </div>

            <div
              style={{
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                display: 'flex',
                gap: '6px',
                alignItems: 'flex-start',
              }}
            >
              <Bell size={13} style={{ flexShrink: 0, marginTop: '1px' }} color="var(--primary)" />
              Notices appear as a banner on the Home tab for residents, filtered to their registered
              society.
            </div>

            <button type="submit" className="btn btn-primary btn-full">
              <Megaphone size={15} /> Post Notice
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
