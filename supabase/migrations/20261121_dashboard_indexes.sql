-- Indexes for optimal dashboard and attendance queries
create index if not exists attendance_date_idx on attendance(session_date);
create unique index if not exists attendance_yuvak_date_uidx on attendance(yuvak_id, session_date);
create index if not exists yuvaks_group_idx on yuvaks(group_id);

