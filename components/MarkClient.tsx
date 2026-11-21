'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AddYuvakForm from './AddYuvakForm';
import type { Yuvak } from '@/lib/data';

type Props = {
  groupId: number;
  groupCode: string;
  yuvaks: Yuvak[];
  presentIds: number[];
  date: string;
  focusId?: number;
};

type RowStatus = 'saving' | 'saved' | 'error';

export default function MarkClient({
  groupId,
  groupCode,
  yuvaks: initial,
  presentIds,
  date,
  focusId,
}: Props) {
  const [list, setList] = useState<Yuvak[]>(initial);
  const [present, setPresent] = useState<Set<number>>(() => new Set(presentIds));
  const [q, setQ] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addedNote, setAddedNote] = useState<string | null>(null);

  // Per-row state tracking
  const [rowStatus, setRowStatus] = useState<Map<number, RowStatus>>(new Map());
  const [errorToast, setErrorToast] = useState<{ message: string; yuvakId: number; yuvakName: string } | null>(null);
  const [confirmedCount, setConfirmedCount] = useState<number>(0);

  // References for managing FIFO per-row queues and DB confirmed state for clean rollback
  const confirmedPresentRef = useRef<Set<number>>(new Set(presentIds));
  const pendingQueueRef = useRef<Map<number, boolean>>(new Map());
  const activeWorkersRef = useRef<Set<number>>(new Set());

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter(
      (y) =>
        y.name.toLowerCase().includes(s) ||
        (y.mobile ?? '').includes(s) ||
        (y.serial_no !== null && String(y.serial_no) === s)
    );
  }, [list, q]);

  const presentCount = list.filter((y) => present.has(y.id)).length;

  // Count how many rows are currently saving
  const savingCount = useMemo(() => {
    let count = 0;
    for (const st of rowStatus.values()) {
      if (st === 'saving') count++;
    }
    return count;
  }, [rowStatus]);

  useEffect(() => {
    if (!focusId) return;
    document.getElementById(`y-${focusId}`)?.scrollIntoView({ block: 'center' });
  }, [focusId]);

  // Single small request that upserts or deletes only that one row
  async function saveSingleRow(yuvakId: number, isPresent: boolean): Promise<boolean> {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yuvak_id: yuvakId, session_date: date, present: isPresent }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // Serial FIFO queue worker per row: last tap always wins, requests never arrive out of order
  async function processRowQueue(yuvakId: number, yuvakName: string) {
    activeWorkersRef.current.add(yuvakId);

    while (pendingQueueRef.current.has(yuvakId)) {
      const desiredState = pendingQueueRef.current.get(yuvakId)!;
      pendingQueueRef.current.delete(yuvakId);

      const ok = await saveSingleRow(yuvakId, desiredState);

      if (!ok) {
        // Roll back row to database-confirmed state
        const confirmedState = confirmedPresentRef.current.has(yuvakId);
        setPresent((prev) => {
          const next = new Set(prev);
          if (confirmedState) next.add(yuvakId);
          else next.delete(yuvakId);
          return next;
        });

        setRowStatus((prev) => new Map(prev).set(yuvakId, 'error'));
        setErrorToast({
          message: `Could not save ${yuvakName}. Check your connection and tap Retry.`,
          yuvakId,
          yuvakName,
        });
        activeWorkersRef.current.delete(yuvakId);
        return;
      }

      // If no new tap was queued while this save was executing, mark as saved & update confirmed state
      if (!pendingQueueRef.current.has(yuvakId)) {
        const nextConfirmed = new Set(confirmedPresentRef.current);
        if (desiredState) nextConfirmed.add(yuvakId);
        else nextConfirmed.delete(yuvakId);
        confirmedPresentRef.current = nextConfirmed;

        setConfirmedCount((c) => c + 1);
        setRowStatus((prev) => new Map(prev).set(yuvakId, 'saved'));

        // Clear per-row "Saved" text after 2.5s so rows stay clean
        setTimeout(() => {
          setRowStatus((prev) => {
            if (prev.get(yuvakId) === 'saved' && !pendingQueueRef.current.has(yuvakId)) {
              const next = new Map(prev);
              next.delete(yuvakId);
              return next;
            }
            return prev;
          });
        }, 2500);
      }
    }

    activeWorkersRef.current.delete(yuvakId);
  }

  function toggle(y: Yuvak) {
    const isCurrentlyPresent = present.has(y.id);
    const nextState = !isCurrentlyPresent;

    // 1. Optimistic UI update: flip checkbox, row color, and counter immediately (<100ms)
    setPresent((prev) => {
      const next = new Set(prev);
      if (nextState) next.add(y.id);
      else next.delete(y.id);
      return next;
    });

    // 2. Clear any previous error toast for this row
    if (errorToast?.yuvakId === y.id) {
      setErrorToast(null);
    }

    // 3. Queue desired state for this row and show inline Saving...
    pendingQueueRef.current.set(y.id, nextState);
    setRowStatus((prev) => new Map(prev).set(y.id, 'saving'));

    // 4. Run queue worker if not already running for this yuvak
    if (!activeWorkersRef.current.has(y.id)) {
      processRowQueue(y.id, y.name);
    }
  }

  function retry(yuvakId: number, yuvakName: string) {
    setErrorToast(null);
    // Determine the desired toggle target relative to the confirmed state
    const confirmed = confirmedPresentRef.current.has(yuvakId);
    const target = !confirmed;

    // Apply optimistic flip again
    setPresent((prev) => {
      const next = new Set(prev);
      if (target) next.add(yuvakId);
      else next.delete(yuvakId);
      return next;
    });

    pendingQueueRef.current.set(yuvakId, target);
    setRowStatus((prev) => new Map(prev).set(yuvakId, 'saving'));

    if (!activeWorkersRef.current.has(yuvakId)) {
      processRowQueue(yuvakId, yuvakName);
    }
  }

  async function onAdded(y: Yuvak) {
    setList((prev) => [...prev, y].sort((a, b) => a.name.localeCompare(b.name)));
    setShowAdd(false);
    setAddedNote(`${y.name} added to ${groupCode} and marked present.`);

    // Optimistically mark present
    setPresent((prev) => new Set(prev).add(y.id));
    pendingQueueRef.current.set(y.id, true);
    setRowStatus((prev) => new Map(prev).set(y.id, 'saving'));

    processRowQueue(y.id, y.name);
  }

  // Determine top card status indicator
  const hasErrors = errorToast !== null;
  const topStatus = savingCount > 0 ? 'saving' : hasErrors ? 'error' : confirmedCount > 0 ? 'saved' : 'idle';

  return (
    <>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div>
            <strong style={{ fontSize: '1.4rem' }}>{presentCount}</strong>
            <span className="muted"> present of {list.length}</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.86rem',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: 20,
              background:
                topStatus === 'saving'
                  ? '#fef3c7'
                  : topStatus === 'error'
                  ? '#fee2e2'
                  : topStatus === 'saved'
                  ? '#dcfce7'
                  : '#f3f4f6',
              color:
                topStatus === 'saving'
                  ? '#b45309'
                  : topStatus === 'error'
                  ? '#b91c1c'
                  : topStatus === 'saved'
                  ? '#15803d'
                  : '#6b7280',
              transition: 'all 0.2s ease',
            }}
          >
            <span>
              {topStatus === 'saving'
                ? '⏳'
                : topStatus === 'error'
                ? '⚠️'
                : topStatus === 'saved'
                ? '✓'
                : '●'}
            </span>
            <span>
              {topStatus === 'saving'
                ? 'Saving...'
                : topStatus === 'error'
                ? 'Save failed'
                : topStatus === 'saved'
                ? 'Auto-saved'
                : 'Ready'}
            </span>
          </div>
        </div>
        <div className="muted" style={{ fontSize: '0.85rem', marginTop: 8 }}>
          Tap a name to mark present or absent. Each selection is <strong>saved automatically</strong> to the database — no submit button needed.
        </div>
      </div>

      {errorToast && (
        <div
          className="error row"
          role="alert"
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            display: 'flex',
            gap: 12,
            margin: '8px 0',
          }}
        >
          <span>{errorToast.message}</span>
          <button
            type="button"
            className="btn"
            style={{
              padding: '4px 12px',
              fontSize: '0.85rem',
              flexShrink: 0,
              background: '#b91c1c',
              color: '#ffffff',
            }}
            onClick={() => retry(errorToast.yuvakId, errorToast.yuvakName)}
          >
            Retry
          </button>
        </div>
      )}

      {addedNote && <div className="success" role="status">{addedNote}</div>}

      <div className="card">
        <div className="field">
          <label htmlFor="search">Search name, mobile or SR.NO</label>
          <input
            id="search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type to filter"
            autoComplete="off"
          />
        </div>

        <div className="list" role="group" aria-label={`${groupCode} yuvaks`}>
          {visible.map((y) => {
            const on = present.has(y.id);
            const status = rowStatus.get(y.id);

            return (
              <button
                key={y.id}
                id={`y-${y.id}`}
                type="button"
                className={`yrow${on ? ' on' : ''}${focusId === y.id ? ' focus' : ''}`}
                aria-pressed={on}
                onClick={() => toggle(y)}
              >
                <span className="check" aria-hidden>
                  {on ? '✓' : ''}
                </span>

                <span style={{ minWidth: 0, flex: 1 }}>
                  <span className="name">
                    {y.serial_no !== null && <span className="muted">#{y.serial_no} </span>}
                    {y.name}
                    {y.source === 'added' && <span className="tag">added</span>}
                  </span>
                  <span className="meta">
                    {[y.mobile, y.education].filter(Boolean).join(' · ') || 'No details'}
                  </span>
                </span>

                {/* Per-row Saving... / Saved / Failed with Retry button */}
                {status === 'saving' && (
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: '#b45309',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      marginLeft: 'auto',
                      paddingLeft: 8,
                      flexShrink: 0,
                    }}
                  >
                    <span>⏳</span> Saving...
                  </span>
                )}

                {status === 'saved' && (
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: '#15803d',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      marginLeft: 'auto',
                      paddingLeft: 8,
                      flexShrink: 0,
                    }}
                  >
                    ✓ Saved
                  </span>
                )}

                {status === 'error' && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      marginLeft: 'auto',
                      paddingLeft: 8,
                      flexShrink: 0,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span style={{ fontSize: '0.78rem', color: '#b91c1c', fontWeight: 600 }}>Failed</span>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        height: 'auto',
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #f87171',
                      }}
                      onClick={() => retry(y.id, y.name)}
                    >
                      Retry
                    </button>
                  </span>
                )}
              </button>
            );
          })}
          {visible.length === 0 && (
            <p className="muted">No one matches &ldquo;{q}&rdquo; in {groupCode}.</p>
          )}
        </div>
      </div>

      <div className="card">
        {!showAdd ? (
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="muted">Not in this list?</span>
            <button className="btn ghost" type="button" onClick={() => setShowAdd(true)}>
              + Add new yuvak to {groupCode}
            </button>
          </div>
        ) : (
          <>
            <h2>Add new yuvak to {groupCode}</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Saved to the database. They are marked present for {date} straight away.
            </p>
            <AddYuvakForm fixedGroupId={groupId} initialName={q} onAdded={onAdded} />
            <button className="btn ghost" type="button" style={{ marginTop: 8 }} onClick={() => setShowAdd(false)}>
              Cancel
            </button>
          </>
        )}
      </div>
    </>
  );
}
