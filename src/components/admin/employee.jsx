import EditIcon from "@mui/icons-material/Edit";
import PaidIcon from "@mui/icons-material/Paid";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import styles from "./admin.module.scss";
import { getUsers } from "../../services/userServices";
import { LS_KEYS } from "../../enum/localStorageKeys";
import { loadLS } from "../../utils/loadLS";
import { saveLS } from "../../utils/saveLS";

export function EmployeeAdmin({ role }) {
  const [users, setUsers] = useState([]);
  const [salaries, setSalaries] = useState({}); // map userId => salary record
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ baseSalary: "", deductions: [], published: false, contact: { address: '', phone: '', nextOfKin: '' }, leaveBalances: { annual: 0, sick: 0, unpaid: 0 } });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getUsers(0, 200);
        setUsers(res.content || []);
      } catch (e) {
        console.error("Failed to load users", e);
      }
    };
    fetch();

    const existing = loadLS(LS_KEYS.EMPLOYEE_SALARIES, {});
    setSalaries(existing || {});
  }, []);

  const openFor = (user) => {
  const s = salaries[user.id] || { baseSalary: "", deductions: [], published: false, contact: { address: '', phone: '', nextOfKin: '' }, leaveBalances: { annual: 0, sick: 0, unpaid: 0 } };
    // normalize deductions to array of { title, amount }
    let ded = [];
    if (Array.isArray(s.deductions)) {
      ded = s.deductions.map((d) => {
        if (d && typeof d === 'object') return { title: d.title ?? "", amount: Number(d.amount ?? 0) };
        return { title: "", amount: Number(d || 0) };
      });
    } else if (typeof s.deductions === "number") {
      ded = [{ title: "Other", amount: s.deductions }];
    }
    setEditing(user);
    setForm({ baseSalary: s.baseSalary ?? "", deductions: ded, published: !!s.published, contact: s.contact || { address: '', phone: '', nextOfKin: '' }, leaveBalances: s.leaveBalances || { annual: 0, sick: 0, unpaid: 0 } });
    setOpen(true);
  };

  const save = () => {
    if (!editing) return;
    const record = {
      userId: editing.id,
      baseSalary: Number(form.baseSalary) || 0,
      deductions: (form.deductions || []).map(d => ({ title: d.title || "", amount: Number(d.amount) || 0 })),
      published: !!form.published,
      contact: form.contact || { address: '', phone: '', nextOfKin: '' },
      leaveBalances: form.leaveBalances || { annual: 0, sick: 0, unpaid: 0 },
      updatedAt: new Date().toISOString(),
    };
    const next = { ...salaries, [editing.id]: record };
    setSalaries(next);
    saveLS(LS_KEYS.EMPLOYEE_SALARIES, next);
    setOpen(false);
    setEditing(null);
  };

  const togglePublish = (user) => {
    const current = salaries[user.id] || { baseSalary: 0, deductions: 0, published: false, contact: { address: '', phone: '', nextOfKin: '' }, leaveBalances: { annual: 0, sick: 0, unpaid: 0 } };
    const nextRecord = { ...current, published: !current.published, updatedAt: new Date().toISOString() };
    const next = { ...salaries, [user.id]: nextRecord };
    setSalaries(next);
    saveLS(LS_KEYS.EMPLOYEE_SALARIES, next);
  };

  // Only allow managers/superadmin to access
  const canManage = (r) => r === "superadmin" || r === "admin";
  if (!canManage(role)) {
    return (<Typography color="text.secondary">You do not have permission to manage employees.</Typography>);
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Employee Management</Typography>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<PaidIcon />} variant="contained" onClick={() => { /* future bulk actions */ }}>Manage Salaries</Button>
        </Stack>
      </Box>

      <div className={styles.tableWrapper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Base Salary</TableCell>
              <TableCell>Deductions</TableCell>
              <TableCell>Annual</TableCell>
              <TableCell>Sick</TableCell>
              <TableCell>Unpaid</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Next of Kin</TableCell>
              <TableCell>Published</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => {
              const s = salaries[u.id];
              return (
                <TableRow key={u.id} hover>
                  <TableCell className={styles.ellipsis}>{u.name}</TableCell>
                  <TableCell className={styles.ellipsis}>{u.email}</TableCell>
                  <TableCell className={styles.ellipsis}>{u.role}</TableCell>
                  <TableCell>{s ? s.baseSalary : "—"}</TableCell>
                    <TableCell className={styles.ellipsis}>{s ? (() => {
                      const ded = s.deductions;
                      if (Array.isArray(ded)) return ded.reduce((sum, d) => sum + (Number(d.amount) || 0), 0).toLocaleString();
                      if (typeof ded === 'number') return Number(ded).toLocaleString();
                      return "—";
                    })() : "—"}</TableCell>
                    <TableCell>{s && s.leaveBalances ? (Number(s.leaveBalances.annual) || 0) : 0}</TableCell>
                    <TableCell>{s && s.leaveBalances ? (Number(s.leaveBalances.sick) || 0) : 0}</TableCell>
                    <TableCell>{s && s.leaveBalances ? (Number(s.leaveBalances.unpaid) || 0) : 0}</TableCell>
                    <TableCell className={styles.ellipsis}>{s && s.contact ? s.contact.address || '—' : '—'}</TableCell>
                    <TableCell className={styles.ellipsis}>{s && s.contact ? s.contact.phone || '—' : '—'}</TableCell>
                    <TableCell className={styles.ellipsis}>{s && s.contact ? s.contact.nextOfKin || '—' : '—'}</TableCell>
                  <TableCell>
                    <Switch size="small" checked={!!(s && s.published)} onChange={() => togglePublish(u)} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openFor(u)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? `Salary for ${editing.name}` : "Set Salary"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Base Salary"
              type="number"
              value={form.baseSalary}
              onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
              fullWidth
            />

            <Typography variant="subtitle2">Contact</Typography>
            <TextField
              label="Address"
              value={form.contact?.address || ''}
              onChange={(e) => setForm({ ...form, contact: { ...(form.contact || {}), address: e.target.value } })}
              fullWidth
            />
            <TextField
              label="Phone"
              value={form.contact?.phone || ''}
              onChange={(e) => setForm({ ...form, contact: { ...(form.contact || {}), phone: e.target.value } })}
              fullWidth
            />
            <TextField
              label="Next of Kin"
              value={form.contact?.nextOfKin || ''}
              onChange={(e) => setForm({ ...form, contact: { ...(form.contact || {}), nextOfKin: e.target.value } })}
              fullWidth
            />

            <Typography variant="subtitle2">Deductions</Typography>
            {(form.deductions || []).map((d, idx) => (
              <Stack key={idx} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                <TextField
                  label="Title"
                  value={d.title}
                  onChange={(e) => {
                    const next = [...form.deductions];
                    next[idx] = { ...next[idx], title: e.target.value };
                    setForm({ ...form, deductions: next });
                  }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Amount"
                  type="number"
                  value={d.amount}
                  onChange={(e) => {
                    const next = [...form.deductions];
                    next[idx] = { ...next[idx], amount: e.target.value };
                    setForm({ ...form, deductions: next });
                  }}
                  sx={{ width: 140 }}
                />
                <IconButton size="small" onClick={() => {
                  const next = [...form.deductions];
                  next.splice(idx, 1);
                  setForm({ ...form, deductions: next });
                }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}

            <Button startIcon={<AddIcon />} onClick={() => {
              const next = [...(form.deductions || []), { title: '', amount: 0 }];
              setForm({ ...form, deductions: next });
            }}>
              Add deduction
            </Button>

            <Typography variant="subtitle2">Leave Balances</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                label="Annual"
                type="number"
                value={form.leaveBalances?.annual ?? 0}
                onChange={(e) => setForm({ ...form, leaveBalances: { ...(form.leaveBalances || {}), annual: Number(e.target.value) } })}
                sx={{ width: 140 }}
              />
              <TextField
                label="Sick"
                type="number"
                value={form.leaveBalances?.sick ?? 0}
                onChange={(e) => setForm({ ...form, leaveBalances: { ...(form.leaveBalances || {}), sick: Number(e.target.value) } })}
                sx={{ width: 140 }}
              />
              <TextField
                label="Unpaid"
                type="number"
                value={form.leaveBalances?.unpaid ?? 0}
                onChange={(e) => setForm({ ...form, leaveBalances: { ...(form.leaveBalances || {}), unpaid: Number(e.target.value) } })}
                sx={{ width: 140 }}
              />
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch checked={!!form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              <Typography>Publish salary (visible to other modules)</Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); setEditing(null); }}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
