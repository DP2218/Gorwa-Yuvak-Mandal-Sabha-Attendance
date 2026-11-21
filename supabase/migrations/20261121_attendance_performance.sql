-- Performance optimization for attendance upsert and queries
-- Creates unique index on (yuvak_id, session_date) for single-statement upsert
create unique index if not exists attendance_yuvak_date_uidx on attendance(yuvak_id, session_date);

-- Ensure index on session_date exists for fast date range and count queries
create index if not exists attendance_date_idx on attendance(session_date);

