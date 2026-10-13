'use client';
import { FormEvent, useEffect, useState } from 'react';
import { Add } from '@mui/icons-material';
import { Heading, Modal, Page } from './ui';
import { useApp } from './providers';
import { addShift, addStaff, getShifts, getStaff } from '@/lib/data';
import { Shift, Staff, shortDate } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';
const today = () => new Date().toISOString().slice(0, 10);
export default function StaffPage() {
  const { version, refresh, toast } = useApp();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [modal, setModal] = useState<'staff' | 'shift' | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    Promise.all([getStaff(), getShifts()])
      .then(([s, h]) => {
        setStaff(s);
        setShifts(h);
      })
      .catch((e) => toast(e.message));
  }, [version]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!modal) return;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      if (modal === 'staff')
        await addStaff({
          name: String(f.get('name')),
          phone: String(f.get('phone') || '') || null,
        });
      else
        await addShift({
          work_date: String(f.get('work_date')),
          staff_id: String(f.get('staff_id')),
          hours: Number(f.get('hours')),
          shift_name: String(f.get('shift_name')),
          notes: String(f.get('notes') || ''),
        });
      setModal(null);
      refresh();
      toast(modal === 'staff' ? 'Đã thêm nhân sự' : 'Đã ghi nhận ca làm');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Không thể lưu dữ liệu');
    } finally {
      setBusy(false);
    }
  }
  const hoursToday = shifts.filter((x) => x.work_date === today()).reduce((a, x) => a + x.hours, 0);
  const totalHours = shifts.reduce((a, x) => a + x.hours, 0);
  return (
    <Page>
      <Heading
        eyebrow="Đội ngũ C’Floral"
        title="Nhân sự & chấm công"
        subtitle="Ghi nhận giờ làm theo nhân viên, ngày và ca làm."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="secondary-button" onClick={() => setModal('staff')}>
              <Add fontSize="small" /> Thêm nhân sự
            </button>
            <button className="primary-button" onClick={() => setModal('shift')}>
              <Add fontSize="small" /> Ghi ca làm
            </button>
          </div>
        }
      />
      {!isSupabaseConfigured && (
        <div className="notice">
          Đang dùng dữ liệu xem thử. Kết nối Supabase để quản lý nhân sự thật.
        </div>
      )}
      <div className="metric-grid" style={{ marginBottom: 18 }}>
        <Mini label="Tổng nhân sự" val={String(staff.length)} />
        <Mini label="Giờ làm hôm nay" val={`${hoursToday} giờ`} />
        <Mini label="Tổng giờ đã ghi" val={`${totalHours} giờ`} />
        <Mini
          label="Ca làm hôm nay"
          val={String(shifts.filter((x) => x.work_date === today()).length)}
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Nhân viên</h2>
              <div className="panel-note">Danh sách nhân sự đang hoạt động</div>
            </div>
          </div>
          {staff.map((s) => (
            <div className="expense-row" key={s.id}>
              <div className="customer-avatar" style={{ width: 40, height: 40, borderRadius: 14 }}>
                {s.name.slice(0, 1)}
              </div>
              <div className="expense-info">
                <div className="expense-name">{s.name}</div>
                <div className="expense-meta">{s.phone || 'Chưa có số điện thoại'}</div>
              </div>
              <span className="status paid">Đang làm</span>
            </div>
          ))}
          {staff.length === 0 && (
            <div className="empty-state">Chưa có nhân viên. Thêm nhân sự để ghi nhận ca làm.</div>
          )}
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Ca làm gần đây</h2>
              <div className="panel-note">Giờ làm ghi theo từng ngày</div>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table" style={{ minWidth: 360 }}>
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Nhân sự</th>
                  <th>Ca</th>
                  <th>Giờ</th>
                </tr>
              </thead>
              <tbody>
                {[...shifts]
                  .sort((a, b) => b.work_date.localeCompare(a.work_date))
                  .map((s) => (
                    <tr key={s.id}>
                      <td>{shortDate(s.work_date)}</td>
                      <td>{staff.find((x) => x.id === s.staff_id)?.name || 'Nhân sự'}</td>
                      <td>{s.shift_name || '—'}</td>
                      <td>
                        <b>{s.hours}</b>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {shifts.length === 0 && <div className="empty-state">Chưa ghi nhận ca làm.</div>}
          </div>
        </section>
      </div>
      {modal && (
        <Modal
          title={modal === 'staff' ? 'Thêm nhân sự' : 'Ghi nhận ca làm'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="secondary-button" onClick={() => setModal(null)}>
                Hủy
              </button>
              <button className="primary-button" type="submit" form="staff-form" disabled={busy}>
                {busy ? 'Đang lưu…' : 'Lưu'}
              </button>
            </>
          }
        >
          <form id="staff-form" onSubmit={submit}>
            <div className="form-grid">
              {modal === 'staff' ? (
                <>
                  <Field label="Tên nhân sự" name="name" required />
                  <Field label="Số điện thoại" name="phone" />
                </>
              ) : (
                <>
                  <div className="field">
                    <label>Nhân sự</label>
                    <select name="staff_id" required>
                      {staff.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Field
                    label="Ngày làm"
                    name="work_date"
                    type="date"
                    defaultValue={today()}
                    required
                  />
                  <Field
                    label="Số giờ làm"
                    name="hours"
                    type="number"
                    min="0"
                    step="0.5"
                    required
                  />
                  <div className="field">
                    <label>Ca làm</label>
                    <select name="shift_name">
                      <option>Ca sáng</option>
                      <option>Ca chiều</option>
                      <option>Ca tối</option>
                      <option>Cả ngày</option>
                      <option>Khác</option>
                    </select>
                  </div>
                  <Field label="Ghi chú" name="notes" />
                </>
              )}
            </div>
          </form>
        </Modal>
      )}
    </Page>
  );
}
function Field(p: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  min?: string;
  step?: string;
  defaultValue?: string;
}) {
  return (
    <div className="field">
      <label>{p.label}</label>
      <input
        name={p.name}
        type={p.type || 'text'}
        required={p.required}
        min={p.min}
        step={p.step}
        defaultValue={p.defaultValue}
      />
    </div>
  );
}
function Mini({ label, val }: { label: string; val: string }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ marginTop: 12 }}>
        {val}
      </div>
    </div>
  );
}
