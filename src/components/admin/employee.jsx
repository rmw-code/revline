import EditIcon from "@mui/icons-material/Edit";
import PaidIcon from "@mui/icons-material/Paid";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import styles from "./admin.module.scss";
import { getUsers } from "../../services/userServices";
import { getEmployees, updateEmployeeDetails, updateSalaryPublishStatus } from "../../services/employeeService";
import { LS_KEYS } from "../../enum/localStorageKeys";
import { loadLS } from "../../utils/loadLS";
import { saveLS } from "../../utils/saveLS";

export function EmployeeAdmin({ role }) {
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]); // employee data from API
  const [salaries, setSalaries] = useState({}); // map userId => salary record
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ baseSalary: "", deductions: [], published: false, contact: { address: '', phone: '', emergencyContactName: '', emergencyContactNo: '', bankName: '', bankAccountNumber: '' }, leaveBalances: { annual: 0, sick: 0, unpaid: 0 }, epfContribution: 11, eisContribution: 0 });

  useEffect(() => {
    const fetch = async () => {
      try {
        // Fetch employees with detailed information from backend
        const employeeData = await getEmployees();
        console.log("Employee data from API:", employeeData);
        setEmployees(employeeData || []);
        
        // Optionally, still fetch users if needed for other purposes
        const res = await getUsers(0, 200);
        setUsers(res.content || []);
      } catch (e) {
        console.error("Failed to load employees", e);
      }
    };
    fetch();

    const existing = loadLS(LS_KEYS.EMPLOYEE_SALARIES, {});
    setSalaries(existing || {});
  }, []);

  const openFor = (user) => {
    // Find employee data from API response
    const employeeData = employees.find(emp => emp.userId === user.id);
    
    if (employeeData) {
      // Use API data to populate form
      const deductions = (employeeData.salaryItems || []).map(item => ({
        title: item.name || "",
        amount: Number(item.amount || 0)
      }));
      
      setForm({
        baseSalary: employeeData.baseSalary || "",
        deductions: deductions,
        published: !!employeeData.isSalaryPublished,
        contact: {
          address: employeeData.address || '',
          phone: employeeData.phone || '',
          emergencyContactName: employeeData.emergencyContactName || '',
          emergencyContactNo: employeeData.emergencyContactNo || '',
          bankName: employeeData.bankName || '',
          bankAccountNumber: employeeData.bankAccountNumber || ''
        },
        leaveBalances: {
          annual: Number(employeeData.annualLeave || 0),
          sick: Number(employeeData.sickLeave || 0),
          unpaid: Number(employeeData.unpaidLeave || 0)
        },
        epfContribution: Number(employeeData.epfContribution || 0),
        eisContribution: Number(employeeData.eisContribution || 0)
      });
    } else {
      // Fallback to localStorage data
      const s = salaries[user.id] || { baseSalary: "", deductions: [], published: false, contact: { address: '', phone: '', emergencyContactName: '', emergencyContactNo: '', bankName: '', bankAccountNumber: '' }, leaveBalances: { annual: 0, sick: 0, unpaid: 0 }, epfContribution: 11, eisContribution: 0 };
      let ded = [];
      if (Array.isArray(s.deductions)) {
        ded = s.deductions.map((d) => {
          if (d && typeof d === 'object') return { title: d.title ?? "", amount: Number(d.amount ?? 0) };
          return { title: "", amount: Number(d || 0) };
        });
      } else if (typeof s.deductions === "number") {
        ded = [{ title: "Other", amount: s.deductions }];
      }
      setForm({ baseSalary: s.baseSalary ?? "", deductions: ded, published: !!s.published, contact: s.contact || { address: '', phone: '', emergencyContactName: '', emergencyContactNo: '', bankName: '', bankAccountNumber: '' }, leaveBalances: s.leaveBalances || { annual: 0, sick: 0, unpaid: 0 }, epfContribution: s.epfContribution ?? 11, eisContribution: s.eisContribution ?? 0 });
    }
    
    setEditing(user);
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    
    try {
      // Prepare data for API
      const details = {
        address: form.contact?.address || '',
        phone: form.contact?.phone || '',
        emergencyContactName: form.contact?.emergencyContactName || '',
        emergencyContactNo: form.contact?.emergencyContactNo || '',
        bankName: form.contact?.bankName || '',
        bankAccountNumber: form.contact?.bankAccountNumber || '',
        isSalaryPublished: !!form.published,
        annualLeave: Number(form.leaveBalances?.annual) || 0,
        sickLeave: Number(form.leaveBalances?.sick) || 0,
        unpaidLeave: Number(form.leaveBalances?.unpaid) || 0
      };
      
      // Call API to update employee details
      await updateEmployeeDetails(editing.id, details);
      
      // Refetch employee data to get updated information
      const updatedEmployeeData = await getEmployees();
      setEmployees(updatedEmployeeData || []);
      
      // Also save to localStorage for backward compatibility
      const record = {
        userId: editing.id,
        baseSalary: Number(form.baseSalary) || 0,
        deductions: (form.deductions || []).map(d => ({ title: d.title || "", amount: Number(d.amount) || 0 })),
        published: !!form.published,
        contact: form.contact || { address: '', phone: '', emergencyContactName: '', emergencyContactNo: '', bankName: '', bankAccountNumber: '' },
        leaveBalances: form.leaveBalances || { annual: 0, sick: 0, unpaid: 0 },
        epfContribution: Number(form.epfContribution) || 0,
        eisContribution: Number(form.eisContribution) || 0,
        updatedAt: new Date().toISOString(),
      };
      const next = { ...salaries, [editing.id]: record };
      setSalaries(next);
      saveLS(LS_KEYS.EMPLOYEE_SALARIES, next);
      
      setOpen(false);
      setEditing(null);
    } catch (error) {
      console.error("Failed to update employee details:", error);
      alert("Failed to update employee details. Please try again.");
    }
  };

  const togglePublish = async (user) => {
    try {
      // Get current published status from API data
      const empData = employees.find(emp => emp.userId === user.id);
      const currentStatus = empData ? !!empData.isSalaryPublished : false;
      const newStatus = !currentStatus;
      
      // Call API to update salary publish status
      await updateSalaryPublishStatus(user.id, newStatus);
      
      // Refetch employee data to get updated information
      const updatedEmployeeData = await getEmployees();
      setEmployees(updatedEmployeeData || []);
      
      // Also update localStorage for backward compatibility
      const current = salaries[user.id] || { baseSalary: 0, deductions: 0, published: false, contact: { address: '', phone: '', emergencyContactName: '', emergencyContactNo: '', bankName: '', bankAccountNumber: '' }, leaveBalances: { annual: 0, sick: 0, unpaid: 0 }, epfContribution: 11, eisContribution: 0 };
      const nextRecord = { ...current, published: newStatus, updatedAt: new Date().toISOString() };
      const next = { ...salaries, [user.id]: nextRecord };
      setSalaries(next);
      saveLS(LS_KEYS.EMPLOYEE_SALARIES, next);
    } catch (error) {
      console.error("Failed to update salary publish status:", error);
      alert("Failed to update salary publish status. Please try again.");
    }
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
              <TableCell>Emergency Contact</TableCell>
              <TableCell>Emergency Contact No</TableCell>
              <TableCell>Bank Name</TableCell>
              <TableCell>Bank Account</TableCell>
              <TableCell>EPF</TableCell>
              <TableCell>EIS</TableCell>
              <TableCell>Published</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => {
              // Get employee data from API for accurate display
              const empData = employees.find(emp => emp.userId === u.id);
              const s = salaries[u.id];
              
              return (
                <TableRow key={u.id} hover>
                  <TableCell className={styles.ellipsis}>{u.name}</TableCell>
                  <TableCell className={styles.ellipsis}>{u.email}</TableCell>
                  <TableCell className={styles.ellipsis}>{u.role}</TableCell>
                  <TableCell>{empData ? empData.baseSalary : (s ? s.baseSalary : "—")}</TableCell>
                    <TableCell className={styles.ellipsis}>{empData ? empData.totalDeductions?.toLocaleString() : (s ? (() => {
                      const ded = s.deductions;
                      if (Array.isArray(ded)) return ded.reduce((sum, d) => sum + (Number(d.amount) || 0), 0).toLocaleString();
                      if (typeof ded === 'number') return Number(ded).toLocaleString();
                      return "—";
                    })() : "—")}</TableCell>
                    <TableCell>{empData ? Number(empData.annualLeave || 0) : (s && s.leaveBalances ? (Number(s.leaveBalances.annual) || 0) : 0)}</TableCell>
                    <TableCell>{empData ? Number(empData.sickLeave || 0) : (s && s.leaveBalances ? (Number(s.leaveBalances.sick) || 0) : 0)}</TableCell>
                    <TableCell>{empData ? Number(empData.unpaidLeave || 0) : (s && s.leaveBalances ? (Number(s.leaveBalances.unpaid) || 0) : 0)}</TableCell>
                    <TableCell className={styles.ellipsis}>{empData ? empData.address || '—' : (s && s.contact ? s.contact.address || '—' : '—')}</TableCell>
                    <TableCell className={styles.ellipsis}>{empData ? empData.phone || '—' : (s && s.contact ? s.contact.phone || '—' : '—')}</TableCell>
                    <TableCell className={styles.ellipsis}>{empData ? empData.emergencyContactName || '—' : (s && s.contact ? s.contact.emergencyContactName || '—' : '—')}</TableCell>
                    <TableCell className={styles.ellipsis}>{empData ? empData.emergencyContactNo || '—' : (s && s.contact ? s.contact.emergencyContactNo || '—' : '—')}</TableCell>
                    <TableCell className={styles.ellipsis}>{empData ? empData.bankName || '—' : (s && s.contact ? s.contact.bankName || '—' : '—')}</TableCell>
                    <TableCell className={styles.ellipsis}>{empData ? empData.bankAccountNumber || '—' : (s && s.contact ? s.contact.bankAccountNumber || '—' : '—')}</TableCell>
                    <TableCell>{empData ? Number(empData.epfContribution || 0) : (s ? (Number(s.epfContribution) || 0) : 0)}</TableCell>
                    <TableCell>{empData ? Number(empData.eisContribution || 0) : (s ? (Number(s.eisContribution) || 0) : 0)}</TableCell>
                  <TableCell>
                    <Switch size="small" checked={empData ? !!empData.isSalaryPublished : !!(s && s.published)} onChange={() => togglePublish(u)} />
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
              label="Emergency Contact Name"
              value={form.contact?.emergencyContactName || ''}
              onChange={(e) => setForm({ ...form, contact: { ...(form.contact || {}), emergencyContactName: e.target.value } })}
              fullWidth
            />
            <TextField
              label="Emergency Contact No"
              value={form.contact?.emergencyContactNo || ''}
              onChange={(e) => setForm({ ...form, contact: { ...(form.contact || {}), emergencyContactNo: e.target.value } })}
              fullWidth
            />
            <TextField
              label="Bank Name"
              value={form.contact?.bankName || ''}
              onChange={(e) => setForm({ ...form, contact: { ...(form.contact || {}), bankName: e.target.value } })}
              fullWidth
            />
            <TextField
              label="Bank Account Number"
              value={form.contact?.bankAccountNumber || ''}
              onChange={(e) => setForm({ ...form, contact: { ...(form.contact || {}), bankAccountNumber: e.target.value } })}
              fullWidth
            />

            <Typography variant="subtitle2">Contributions</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                label="EPF Contribution"
                type="number"
                value={form.epfContribution ?? 0}
                onChange={(e) => setForm({ ...form, epfContribution: Number(e.target.value) })}
                sx={{ width: 160 }}
              />
              <TextField
                label="EIS Contribution"
                type="number"
                value={form.eisContribution ?? 0}
                onChange={(e) => setForm({ ...form, eisContribution: Number(e.target.value) })}
                sx={{ width: 160 }}
              />
            </Stack>

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
              <Switch 
                checked={!!form.published} 
                onChange={async (e) => {
                  const newStatus = e.target.checked;
                  setForm({ ...form, published: newStatus });
                  
                  if (editing) {
                    try {
                      // Update via API
                      await updateSalaryPublishStatus(editing.id, newStatus);
                      
                      // Refetch employee data
                      const updatedEmployeeData = await getEmployees();
                      setEmployees(updatedEmployeeData || []);
                    } catch (error) {
                      console.error("Failed to update salary publish status:", error);
                      // Revert form state on error
                      setForm({ ...form, published: !newStatus });
                    }
                  }
                }} 
              />
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
