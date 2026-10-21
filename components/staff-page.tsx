'use client';
import { FormEvent, useEffect, useState } from 'react';
import { Add, Delete, Edit } from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MuiFormControl from '@mui/material/FormControl';
import MuiInputLabel from '@mui/material/InputLabel';
import MuiSelect from '@mui/material/Select';
import MuiMenuItem from '@mui/material/MenuItem';
import { DateField, Heading, Modal, Page } from './ui';
import { useApp } from './providers';
import {
  addShift,
  addStaff,
  deleteShift,
  deleteStaff,
  getShifts,
  getStaff,
  updateShift,
  updateStaff,
} from '@/lib/data';
import { Shift, Staff, shortDate } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';
const today = () => new Date().toISOString().slice(0, 10);
export default function StaffPage() {
  const { version, refresh, toast } = useApp();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [modal, setModal] = useState<'staff' | 'shift' | null>(null);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [shiftPage, setShiftPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'staff'; person: Staff } | { type: 'shift'; shift: Shift } | null>(null);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    Promise.all([getStaff(), getShifts()])
      .then(([s, h]) => {
        setStaff(s);
        setShifts(h);
      })
      .catch((e) => toast(e.message));
  }, [version]);
  const sortedShifts = [...shifts].sort((a, b) => b.work_date.localeCompare(a.work_date));
  const shiftPageCount = Math.ceil(sortedShifts.length / 20);
  const pagedShifts = sortedShifts.slice((shiftPage - 1) * 20, shiftPage * 20);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!modal) return;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const editingStaff = editing;
    const editingShiftRecord = editingShift;
    try {
      if (modal === 'staff') {
        const values = {
          name: String(f.get('name')),
          phone: String(f.get('phone') || '') || null,
        };
        if (editingStaff) await updateStaff(editingStaff.id, values);
        else await addStaff(values);
      } else {
        const values = {
          work_date: String(f.get('work_date')),
          staff_id: String(f.get('staff_id')),
          hours: Number(f.get('hours')),
          shift_name: String(f.get('shift_name') || '') || null,
          notes: String(f.get('notes') || ''),
        };
        if (editingShiftRecord) await updateShift(editingShiftRecord.id, values);
        else await addShift(values);
      }
      setModal(null);
      setEditing(null);
      setEditingShift(null);
      refresh();
      toast(
        modal === 'staff'
          ? editingStaff
            ? 'Đã cập nhật nhân sự'
            : 'Đã thêm nhân sự'
          : editingShiftRecord
            ? 'Đã cập nhật ca làm'
            : 'Đã ghi nhận ca làm',
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Không thể lưu dữ liệu');
    } finally {
      setBusy(false);
    }
  }
  async function removeStaff(person: Staff) {
    setDeleting(true);
    try {
      await deleteStaff(person.id);
      setDeleteTarget(null);
      refresh();
      toast('Đã xóa nhân sự');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Không thể xóa nhân sự');
    } finally {
      setDeleting(false);
    }
  }
  async function removeShift(shift: Shift) {
    const staffName = staff.find((person) => person.id === shift.staff_id)?.name || 'nhân sự';
    setDeleting(true);
    try {
      await deleteShift(shift.id);
      setDeleteTarget(null);
      refresh();
      toast('Đã xóa ca làm');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Không thể xóa ca làm');
    } finally {
      setDeleting(false);
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
            <button className="secondary-button" onClick={() => { setEditing(null); setModal('staff'); }}>
              <Add fontSize="small" /> Thêm nhân sự
            </button>
            <button className="primary-button" onClick={() => { setEditing(null); setEditingShift(null); setModal('shift'); }}>
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
              <div className="staff-actions">
                <button
                  className="secondary-button"
                  aria-label={`Sửa nhân sự ${s.name}`}
                  title="Sửa nhân sự"
                  onClick={() => { setEditing(s); setModal('staff'); }}
                >
                  <Edit fontSize="small" />
                </button>
                <button
                  className="secondary-button danger-button"
                  aria-label={`Xóa nhân sự ${s.name}`}
                  title="Xóa nhân sự"
                  onClick={() => setDeleteTarget({ type: 'staff', person: s })}
                >
                  <Delete fontSize="small" />
                </button>
              </div>
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
            <table className="data-table" style={{ minWidth: 500 }}>
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Nhân sự</th>
                  <th>Ca</th>
                  <th>Giờ</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pagedShifts.map((s) => (
                    <tr key={s.id}>
                      <td>{shortDate(s.work_date)}</td>
                      <td>{staff.find((x) => x.id === s.staff_id)?.name || 'Nhân sự'}</td>
                      <td>{s.shift_name || '—'}</td>
                      <td>
                        <b>{s.hours}</b>
                      </td>
                      <td>
                        <div className="staff-actions">
                          <button
                            className="secondary-button"
                            aria-label="Sửa ca làm"
                            title="Sửa ca làm"
                            onClick={() => { setEditing(null); setEditingShift(s); setModal('shift'); }}
                          >
                            <Edit fontSize="small" />
                          </button>
                          <button
                            className="secondary-button danger-button"
                            aria-label="Xóa ca làm"
                            title="Xóa ca làm"
                            onClick={() => setDeleteTarget({ type: 'shift', shift: s })}
                          >
                            <Delete fontSize="small" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {shiftPageCount > 1 && <div className="pagination">
              <button className="secondary-button" disabled={shiftPage === 1} onClick={() => setShiftPage((p) => p - 1)}>Trước</button>
              <span>Trang {shiftPage} / {shiftPageCount}</span>
              <button className="secondary-button" disabled={shiftPage === shiftPageCount} onClick={() => setShiftPage((p) => p + 1)}>Sau</button>
            </div>}
            {shifts.length === 0 && <div className="empty-state">Chưa ghi nhận ca làm.</div>}
          </div>
        </section>
      </div>
      {modal && (
        <Modal
          title={
            modal === 'staff'
              ? editing
                ? 'Cập nhật nhân sự'
                : 'Thêm nhân sự'
              : editingShift
                ? 'Cập nhật ca làm'
                : 'Ghi nhận ca làm'
          }
          onClose={() => { setModal(null); setEditing(null); setEditingShift(null); }}
          footer={
            <>
              <button className="secondary-button" onClick={() => { setModal(null); setEditing(null); setEditingShift(null); }}>
                Hủy
              </button>
              <button className="primary-button" type="submit" form="staff-form" disabled={busy}>
                {busy ? <><CircularProgress size={17} color="inherit" /> Đang lưu…</> : editing || editingShift ? 'Cập nhật' : 'Lưu'}
              </button>
            </>
          }
        >
          <form id="staff-form" onSubmit={submit}>
            <div className="form-grid">
              {modal === 'staff' ? (
                <>
                  <Field label="Tên nhân sự" name="name" required defaultValue={editing?.name} />
                  <Field label="Số điện thoại" name="phone" defaultValue={editing?.phone || ''} />
                </>
              ) : (
                <>
                  <div className="field">
                    <label>Nhân sự</label>
                    <MuiFormControl size="small" fullWidth required className="form-mui-control">
                    <MuiInputLabel id="shift-staff-label">Nhân sự</MuiInputLabel>
                    <MuiSelect name="staff_id" labelId="shift-staff-label" label="Nhân sự" required defaultValue={editingShift?.staff_id || ''}>
                      {staff.map((x) => (
                        <MuiMenuItem key={x.id} value={x.id}>
                          {x.name}
                        </MuiMenuItem>
                      ))}
                    </MuiSelect>
                    </MuiFormControl>
                  </div>
                  <DateField label="Ngày làm" name="work_date" defaultValue={editingShift?.work_date || today()} required />
                  <Field
                    label="Số giờ làm"
                    name="hours"
                    type="number"
                    min="0"
                    step="0.5"
                    defaultValue={editingShift ? String(editingShift.hours) : undefined}
                    required
                  />
                  <div className="field">
                    <label>Ca làm</label>
                    <MuiFormControl size="small" fullWidth className="form-mui-control">
                      <MuiInputLabel id="shift-name-label">Ca làm</MuiInputLabel>
                      <MuiSelect name="shift_name" labelId="shift-name-label" label="Ca làm" defaultValue={editingShift ? editingShift.shift_name || '' : 'Ca sáng'}>
                        <MuiMenuItem value="">Chưa chọn</MuiMenuItem>
                        <MuiMenuItem value="Ca sáng">Ca sáng</MuiMenuItem>
                        <MuiMenuItem value="Ca chiều">Ca chiều</MuiMenuItem>
                        <MuiMenuItem value="Ca tối">Ca tối</MuiMenuItem>
                        <MuiMenuItem value="Cả ngày">Cả ngày</MuiMenuItem>
                        <MuiMenuItem value="Khác">Khác</MuiMenuItem>
                      </MuiSelect>
                    </MuiFormControl>
                  </div>
                  <Field label="Ghi chú" name="notes" defaultValue={editingShift?.notes || ''} />
                </>
              )}
            </div>
          </form>
        </Modal>
      )}
      <Dialog open={deleteTarget !== null} onClose={() => !deleting && setDeleteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent dividers>
          <Typography>
            {deleteTarget?.type === 'staff'
              ? <>Bạn có chắc chắn muốn xóa nhân sự <b>{deleteTarget.person.name}</b>?</>
              : deleteTarget?.type === 'shift'
                ? <>Bạn có chắc chắn muốn xóa ca làm ngày <b>{shortDate(deleteTarget.shift.work_date)}</b> của <b>{staff.find((person) => person.id === deleteTarget.shift.staff_id)?.name || 'nhân sự'}</b>?</>
                : ''}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ color: 'var(--green-dark)', fontWeight: 700 }}>Hủy</Button>
          <Button
            onClick={() => deleteTarget?.type === 'staff' ? removeStaff(deleteTarget.person) : deleteTarget?.type === 'shift' ? removeShift(deleteTarget.shift) : undefined}
            disabled={deleting}
            variant="contained"
            sx={{ backgroundColor: '#bd6657', '&:hover': { backgroundColor: '#a95245' }, borderRadius: '12px', fontWeight: 700 }}
          >
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
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
  return <TextField label={p.label} name={p.name} type={p.type || 'text'} required={p.required} defaultValue={p.defaultValue} size="small" fullWidth className="form-mui-input" slotProps={{ htmlInput: { min: p.min, step: p.step } }} />;
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
