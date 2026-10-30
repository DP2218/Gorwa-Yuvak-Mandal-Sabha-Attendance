'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Group } from '@/lib/data';

type Props = {
  suggestedCode: string;
  existingGroups: Group[];
};

export default function CreateGroupClient({ suggestedCode, existingGroups }: Props) {
  const router = useRouter();

  // Group Details
  const [code, setCode] = useState(suggestedCode);
  const [leaderName, setLeaderName] = useState('');

  // Option to add initial yuvak
  const [enableAddYuvak, setEnableAddYuvak] = useState(true);

  // Yuvak Details matching 2nd image
  const [formId, setFormId] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappSameAsMobile, setWhatsappSameAsMobile] = useState(true);
  const [homePhone, setHomePhone] = useState('');
  const [education, setEducation] = useState('');
  const [address, setAddress] = useState('');

  // Status & Validation
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [overrideDuplicateMobile, setOverrideDuplicateMobile] = useState(false);

  function toDisplayDate(iso: string): string {
    if (!iso) return '';
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return iso;
    return `${m[3]}-${m[2]}-${m[1]}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setWarning(null);

    const cleanCode = code.trim();
    if (!cleanCode) {
      setError('Please provide a group code (e.g. SK 13)');
      return;
    }

    if (enableAddYuvak && !name.trim()) {
      setError('Please enter the yuvak name, or uncheck "Add a new yuvak to this group"');
      return;
    }

    const payload: {
      code: string;
      leaderName: string;
      overrideDuplicateMobile?: boolean;
      yuvak?: {
        formId: string;
        name: string;
        birthDate: string;
        mobile: string;
        whatsapp: string;
        homePhone: string;
        education: string;
        address: string;
        overrideDuplicateMobile?: boolean;
      };
    } = {
      code: cleanCode,
      leaderName: leaderName.trim(),
      overrideDuplicateMobile,
    };

    if (enableAddYuvak && name.trim()) {
      payload.yuvak = {
        formId: formId.trim(),
        name: name.trim(),
        birthDate: birthDate.trim(),
        mobile: mobile.replace(/\D/g, ''),
        whatsapp: (whatsappSameAsMobile ? mobile : whatsapp).replace(/\D/g, ''),
        homePhone: homePhone.replace(/\D/g, ''),
        education: education.trim(),
        address: address.trim(),
        overrideDuplicateMobile,
      };
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 409 && data?.canOverride) {
        setWarning(data.warning || 'A yuvak with this mobile number already exists.');
        setSubmitting(false);
        return;
      }

      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Failed to create new SK group');
        setSubmitting(false);
        return;
      }

      // Success: redirect to the new group's admin page
      router.push(`/admin/group/${data.group.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ margin: '0 0 12px' }}>
        <Link href="/admin" className="back-link">
          ← Back to Admin Dashboard
        </Link>
      </div>

      <div className="card">
        <h1 style={{ margin: '0 0 6px' }}>Create New SK Group</h1>
        <p className="muted" style={{ margin: 0 }}>
          Create a new SK group for attendance, assign a leader, and optionally add initial yuvaks.
        </p>
      </div>

      {error && (
        <div className="error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {warning && (
        <div
          style={{
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 16,
            color: '#92400e',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Warning: Duplicate mobile number</div>
          <div>{warning}</div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 10,
              color: '#78350f',
              cursor: 'pointer',
              fontSize: '0.92rem',
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={overrideDuplicateMobile}
              onChange={(e) => setOverrideDuplicateMobile(e.target.checked)}
              style={{ width: 'auto', minHeight: 'auto' }}
            />
            Allow duplicate mobile number and save anyway
          </label>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Group Info */}
        <div className="card">
          <h2 style={{ margin: '0 0 14px' }}>1. Group Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <div className="field">
              <label htmlFor="groupCode">GROUP CODE / ID *</label>
              <input
                id="groupCode"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. SK 13"
                disabled={submitting}
              />
              <span className="muted" style={{ fontSize: '0.82rem', marginTop: 4, display: 'block' }}>
                Existing groups: {existingGroups.map((g) => g.code).join(', ')}
              </span>
            </div>

            <div className="field">
              <label htmlFor="leaderName">LEADER NAME</label>
              <input
                id="leaderName"
                type="text"
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                placeholder="SURNAME FIRSTNAME FATHERNAME"
                disabled={submitting}
              />
              <span className="muted" style={{ fontSize: '0.82rem', marginTop: 4, display: 'block' }}>
                Full name of group leader
              </span>
            </div>
          </div>
        </div>

        {/* Step 2: Add New Yuvak (Matching Image 2) */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: enableAddYuvak ? 16 : 0 }}>
            <div>
              <h2 style={{ margin: '0 0 4px' }}>2. Add New Yuvak</h2>
              <p className="muted" style={{ margin: 0 }}>
                Optionally add the first yuvak to this group now.
              </p>
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.92rem', margin: 0 }}>
              <input
                type="checkbox"
                checked={enableAddYuvak}
                onChange={(e) => setEnableAddYuvak(e.target.checked)}
                disabled={submitting}
                style={{ width: 'auto', minHeight: 'auto' }}
              />
              Add new yuvak to {code || 'this group'}
            </label>
          </div>

          {enableAddYuvak && (
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                {/* Form ID */}
                <div className="field">
                  <label htmlFor="formId">Form ID</label>
                  <input
                    id="formId"
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="e.g. 1674"
                    disabled={submitting}
                  />
                </div>

                {/* Yuvak Name */}
                <div className="field">
                  <label htmlFor="yuvakName">YUVAK NAME *</label>
                  <input
                    id="yuvakName"
                    type="text"
                    required={enableAddYuvak}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="PATEL HET YOGESHBHAI"
                    disabled={submitting}
                  />
                </div>

                {/* Birth Date */}
                <div className="field">
                  <label htmlFor="birthDate">BIRTH DATE</label>
                  <input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    disabled={submitting}
                  />
                  {birthDate && (
                    <span className="muted" style={{ fontSize: '0.8rem', marginTop: 2, display: 'block' }}>
                      Stored as date, displayed as: {toDisplayDate(birthDate)}
                    </span>
                  )}
                </div>

                {/* Group */}
                <div className="field">
                  <label htmlFor="groupDisplay">GROUP</label>
                  <input
                    id="groupDisplay"
                    type="text"
                    disabled
                    value={`${code || 'New Group'} ${leaderName ? `(${leaderName})` : ''}`}
                    style={{ background: '#f4f4f5', color: '#555' }}
                  />
                </div>

                {/* Mobile */}
                <div className="field">
                  <label htmlFor="mobile">MOBILE (10 digits)</label>
                  <input
                    id="mobile"
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMobile(val);
                      if (whatsappSameAsMobile) setWhatsapp(val);
                    }}
                    placeholder="9662097607"
                    disabled={submitting}
                  />
                </div>

                {/* WhatsApp */}
                <div className="field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label htmlFor="whatsapp" style={{ margin: 0 }}>
                      WHATSAPP (10 digits)
                    </label>
                    <label
                      style={{
                        margin: 0,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: 'var(--ink)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={whatsappSameAsMobile}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setWhatsappSameAsMobile(checked);
                          if (checked) setWhatsapp(mobile);
                        }}
                        disabled={submitting}
                        style={{ width: 'auto', minHeight: 'auto' }}
                      />
                      Same as mobile
                    </label>
                  </div>
                  <input
                    id="whatsapp"
                    type="tel"
                    maxLength={10}
                    value={whatsapp}
                    disabled={whatsappSameAsMobile || submitting}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="9662097607"
                  />
                </div>

                {/* Home Phone */}
                <div className="field">
                  <label htmlFor="homePhone">HOME PHONE (10 digits)</label>
                  <input
                    id="homePhone"
                    type="tel"
                    maxLength={10}
                    value={homePhone}
                    onChange={(e) => setHomePhone(e.target.value)}
                    placeholder="9998629620"
                    disabled={submitting}
                  />
                </div>

                {/* Education */}
                <div className="field">
                  <label htmlFor="education">EDUCATION DETAIL</label>
                  <input
                    id="education"
                    type="text"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="B.Com (5th sem)"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Address (Multiline) */}
              <div className="field" style={{ marginTop: 12 }}>
                <label htmlFor="address">ADDRESS (multi-line)</label>
                <textarea
                  id="address"
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="14 JAY AMBE SOCIETY, GORWA"
                  disabled={submitting}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
          <button
            type="button"
            className="btn ghost"
            onClick={() => router.push('/admin')}
            disabled={submitting}
            style={{ minHeight: 46, padding: '10px 20px' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn"
            disabled={submitting}
            style={{ minHeight: 46, padding: '10px 26px', fontWeight: 600 }}
          >
            {submitting ? 'Creating Group...' : `Create ${code || 'SK Group'}`}
          </button>
        </div>
      </form>
    </div>
  );
}

