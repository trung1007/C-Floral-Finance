'use client';
import { FormEvent, useEffect, useState } from 'react';
import { Add, Delete, Edit, Person, Payments } from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
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
  addExpense,
  addStaff,
  deleteShift,
  deleteStaff,
  getShifts,
  getShiftsForStaff,
  getStaff,
  getStaffPayrollSummary,
  updateShift,
  updateStaff,
} from '@/lib/data';
import { money, paymentMethods, Shift, Staff, shortDate, STAFF_HOURLY_RATE } from '@/lib/types';
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
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [staffShifts, setStaffShifts] = useState<Shift[]>([]);
  const [loadingStaffShifts, setLoadingStaffShifts] = useState(false);
  const [payroll, setPayroll] = useState<Record<string, { hours: number; paid: number }>>({});
  const [payingStaff, setPayingStaff] = useState<Staff | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paying, setPaying] = useState(false);
  useEffect(() => {
    Promise.all([getStaff(), getShifts(), getStaffPayrollSummary()])
      .then(([s, h, p]) => {
        setStaff(s);
        setShifts(h);
        setPayroll(p);
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
      toast('Đã xóa khỏi danh sách. Lịch sử chấm công và khoản chi vẫn được giữ.');
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
  async function openStaffDetails(person: Staff) {
    setSelectedStaff(person);
    setStaffShifts([]);
    setLoadingStaffShifts(true);
    try {
      setStaffShifts(await getShiftsForStaff(person.id));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Không thể tải lịch sử ca làm');
    } finally {
      setLoadingStaffShifts(false);
    }
  }
  const staffHours = staffShifts.reduce((sum, shift) => sum + shift.hours, 0);
  const activeStaff = staff.filter((person) => person.active);
  const owedFor = (person: Staff) => Math.max(0, (payroll[person.id]?.hours || 0) * STAFF_HOURLY_RATE - (payroll[person.id]?.paid || 0));
  const selectedOwed = selectedStaff
    ? Math.max(0, staffHours * STAFF_HOURLY_RATE - (payroll[selectedStaff.id]?.paid || 0))
    : 0;
  async function submitStaffPayment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!payingStaff) return;
    const form = new FormData(e.currentTarget);
    const amount = Number(form.get('amount'));
    const outstanding = owedFor(payingStaff);
    if (!Number.isInteger(amount) || amount <= 0 || amount > outstanding) {
      toast('Số tiền trả phải lớn hơn 0 và không vượt quá số tiền còn phải trả.');
      return;
    }
    setPaying(true);
    try {
      await addExpense({
        expense_date: String(form.get('expense_date')),
        kind: 'other',
        category: 'Tiền nhân sự',
        description: `Trả tiền công - ${payingStaff.name}`,
        amount,
        payment_method: String(form.get('payment_method')) || null,
        payee: payingStaff.name,
        notes: String(form.get('notes') || '') || null,
        staff_id: payingStaff.id,
      });
      setPayingStaff(null);
      setPaymentAmount('');
      refresh();
      toast('Đã ghi nhận thanh toán và thêm vào khoản chi nhân sự.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Không thể ghi nhận thanh toán');
    } finally {
      setPaying(false);
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
        <Mini label="Tổng nhân sự" val={String(activeStaff.length)} />
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
          {activeStaff.map((s) => (
            <div className="expense-row" key={s.id}>
              <ButtonBase
                onClick={() => openStaffDetails(s)}
                aria-label={`Xem giờ làm và tiền công của ${s.name}`}
                sx={{ display: 'flex', flex: 1, minWidth: 0, gap: 1.25, justifyContent: 'flex-start', textAlign: 'left', borderRadius: 2, p: 0.5 }}
              >
                <div className="customer-avatar" style={{ width: 40, height: 40, borderRadius: 14 }}>
                  {s.name.slice(0, 1)}
                </div>
                <div className="expense-info">
                  <div className="expense-name">{s.name}</div>
                  <div className="expense-meta">{s.phone || 'Chưa có số điện thoại'}</div>
                </div>
              </ButtonBase>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <span className={`status ${owedFor(s) > 0 ? 'deposit' : 'paid'}`}>
                  {owedFor(s) > 0 ? `Còn trả ${money(owedFor(s))}` : 'Đã trả đủ'}
                </span>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Payments />}
                  disabled={owedFor(s) <= 0}
                  onClick={() => { setPayingStaff(s); setPaymentAmount(String(owedFor(s))); }}
                >
                  Trả tiền
                </Button>
              </Stack>
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
                  title={owedFor(s) > 0 ? 'Thanh toán đủ tiền công trước khi xóa' : 'Xóa nhân sự'}
                  disabled={owedFor(s) > 0}
                  onClick={() => setDeleteTarget({ type: 'staff', person: s })}
                >
                  <Delete fontSize="small" />
                </button>
              </div>
            </div>
          ))}
          {activeStaff.length === 0 && (
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
      <Dialog open={selectedStaff !== null} onClose={() => setSelectedStaff(null)} fullWidth maxWidth="md">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Person sx={{ color: 'var(--green-dark)' }} />
            <span>Chấm công · {selectedStaff?.name}</span>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
            <Card variant="outlined" sx={{ flex: 1, borderRadius: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Tổng giờ làm</Typography>
                <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                  {loadingStaffShifts ? <CircularProgress size={20} /> : `${staffHours} giờ`}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1, borderRadius: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Còn phải trả</Typography>
                <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5, color: 'var(--green-dark)' }}>
                  {loadingStaffShifts ? <CircularProgress size={20} /> : money(selectedOwed)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Đã trả {money(payroll[selectedStaff?.id || '']?.paid || 0)} · Đơn giá {money(STAFF_HOURLY_RATE)} / giờ
                </Typography>
              </CardContent>
            </Card>
          </Stack>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Chi tiết ca làm</Typography>
          {loadingStaffShifts ? (
            <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress size={28} /></Stack>
          ) : staffShifts.length > 0 ? (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 360 }}>
              <Table stickyHeader size="small" aria-label={`Chi tiết ca làm của ${selectedStaff?.name}`}>
                <TableHead>
                  <TableRow>
                    <TableCell>Ngày</TableCell><TableCell>Ca</TableCell><TableCell align="right">Số giờ</TableCell><TableCell align="right">Tiền công</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staffShifts.map((shift) => (
                    <TableRow key={shift.id} hover>
                      <TableCell>{shortDate(shift.work_date)}</TableCell>
                      <TableCell>{shift.shift_name || '—'}</TableCell>
                      <TableCell align="right">{shift.hours}</TableCell>
                      <TableCell align="right">{money(shift.hours * STAFF_HOURLY_RATE)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" sx={{ py: 2 }}>Nhân viên chưa có ca làm nào.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedStaff(null)} sx={{ color: 'var(--green-dark)', fontWeight: 700 }}>Đóng</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={payingStaff !== null} onClose={() => !paying && setPayingStaff(null)} fullWidth maxWidth="sm">
        <DialogTitle>Trả tiền công · {payingStaff?.name}</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 2 }} color="text.secondary">
            Còn phải trả: <b>{payingStaff ? money(owedFor(payingStaff)) : money(0)}</b>. Khoản trả sẽ tự ghi vào bảng chi mục “Tiền nhân sự”.
          </Typography>
          <form id="staff-payment-form" onSubmit={submitStaffPayment}>
            <Stack spacing={2}>
              <DateField label="Ngày trả" name="expense_date" defaultValue={today()} required key={`pay-date-${payingStaff?.id || ''}`} />
              <TextField
                label="Số tiền trả (VNĐ)"
                name="amount"
                type="number"
                required
                fullWidth
                size="small"
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
                slotProps={{ htmlInput: { min: 1, max: payingStaff ? owedFor(payingStaff) : undefined, step: 1 } }}
              />
              <MuiFormControl size="small" fullWidth className="form-mui-control">
                <MuiInputLabel id="staff-payment-method-label">Hình thức thanh toán</MuiInputLabel>
                <MuiSelect name="payment_method" labelId="staff-payment-method-label" label="Hình thức thanh toán" defaultValue={paymentMethods[0]}>
                  {paymentMethods.map((method) => <MuiMenuItem key={method} value={method}>{method}</MuiMenuItem>)}
                </MuiSelect>
              </MuiFormControl>
              <TextField label="Ghi chú" name="notes" size="small" fullWidth />
            </Stack>
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPayingStaff(null)} disabled={paying} sx={{ color: 'var(--green-dark)', fontWeight: 700 }}>Hủy</Button>
          <Button type="submit" form="staff-payment-form" disabled={paying} variant="contained" sx={{ backgroundColor: 'var(--green-dark)', borderRadius: '12px', fontWeight: 700 }}>
            {paying ? <CircularProgress size={18} color="inherit" /> : 'Ghi nhận trả tiền'}
          </Button>
        </DialogActions>
      </Dialog>
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
                      {activeStaff.map((x) => (
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
              ? <>Xóa <b>{deleteTarget.person.name}</b> khỏi danh sách nhân sự? Lịch sử ca làm và các khoản đã trả sẽ được giữ lại.</>
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
