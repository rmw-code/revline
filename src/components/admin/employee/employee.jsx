import EditIcon from "@mui/icons-material/Edit";
import PaidIcon from "@mui/icons-material/Paid";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, Tabs, Tab } from "@mui/material";
import { useEffect, useState } from "react";
import styles from "../admin.module.scss";
import { getUsers } from "../../../services/userServices";
import { getEmployees, updateEmployeeDetails, updateSalaryPublishStatus } from "../../../services/employeeService";
import { LS_KEYS } from "../../../enum/localStorageKeys";
import { loadLS } from "../../../utils/loadLS";
import { saveLS } from "../../../utils/saveLS";

import PersonalTab from "./tabs/PersonalTab";
import BankingTab from "./tabs/BankingTab";
import LeavesTab from "./tabs/LeavesTab";
import RoleTab from "./tabs/RoleTab";
import SalaryTab from "./tabs/SalaryTab";

export function EmployeeAdmin({ role }) {
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]); // employee data from API
  const [salaries, setSalaries] = useState({}); // map userId => salary record
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [form, setForm] = useState({ baseSalary: "", deductions: [], published: false, contact: { address: '', phone: '', emergencyContactName: '', emergencyContactNo: '', bankName: '', bankAccountNumber: '' }, leaveBalances: { annual: 0, sick: 0, unpaid: 0 }, epfContribution: 11, eisContribution: 0, position: '' });

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
          email: employeeData.email || user.email || '',
          altEmail: employeeData.altEmail || '',
          fullName: employeeData.fullName || user.name || '',
          nickname: employeeData.nickname || user.name || '',
          icNumber: employeeData.icNumber || '',
          birthDate: employeeData.birthDate || '',
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
        epfContribution: Number(employeeData.epfContribution || 11),
        eisContribution: Number(employeeData.eisContribution || 0),
        position: employeeData.position || ''
      });
    } else {
      // Fallback to localStorage data
  const s = salaries[user.id] || { baseSalary: "", deductions: [], published: false, contact: { address: '', phone: '', emergencyContactName: '', emergencyContactNo: '', bankName: '', bankAccountNumber: '' }, leaveBalances: { annual: 0, sick: 0, unpaid: 0 }, epfContribution: 11, eisContribution: 0, position: '' };
      let ded = [];
      if (Array.isArray(s.deductions)) {
        ded = s.deductions.map((d) => {
          if (d && typeof d === 'object') return { title: d.title ?? "", amount: Number(d.amount ?? 0) };
          return { title: "", amount: Number(d || 0) };
        });
      } else if (typeof s.deductions === "number") {
        ded = [{ title: "Other", amount: s.deductions }];
      }
  setForm({ baseSalary: s.baseSalary ?? "", deductions: ded, published: !!s.published, contact: { ...(s.contact || {}), email: (s.contact && s.contact.email) || user.email || '', altEmail: (s.contact && s.contact.altEmail) || '' }, leaveBalances: s.leaveBalances || { annual: 0, sick: 0, unpaid: 0 }, epfContribution: s.epfContribution ?? 11, eisContribution: s.eisContribution ?? 0, position: s.position ?? '' });
    }
    
    setEditing(user);
    setTabIndex(0);
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
        unpaidLeave: Number(form.leaveBalances?.unpaid) || 0,
        position: form.position || ''
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
        position: form.position || '',
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
      const current = salaries[user.id] || { baseSalary: 0, deductions: 0, published: false, contact: { address: '', phone: '', emergencyContactName: '', emergencyContactNo: '', bankName: '', bankAccountNumber: '' }, leaveBalances: { annual: 0, sick: 0, unpaid: 0 }, epfContribution: 11, eisContribution: 0, position: '' };
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

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: { xs: '95vw', sm: '80vw', md: '70vw' },
            maxWidth: '95vw'
          }
        }}
      >
        <DialogTitle>{editing ? `Salary for ${editing.name}` : "Set Salary"}</DialogTitle>
        <DialogContent dividers sx={{
          minHeight: 420,
          maxHeight: '70vh',
          overflow: 'auto',
          // keep consistent inner layout spacing when tabs change
          display: 'block'
        }}>
          <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} variant="scrollable" allowScrollButtonsMobile>
            <Tab label="Personal" />
            <Tab label="Banking" />
            <Tab label="Leaves" />
            <Tab label="Role / Position" />
            <Tab label="Salary" />
          </Tabs>

          <Box sx={{ mt: 2 }}>
            {tabIndex === 0 && <PersonalTab form={form} setForm={setForm} />}
            {tabIndex === 1 && <BankingTab form={form} setForm={setForm} />}
            {tabIndex === 2 && <LeavesTab form={form} setForm={setForm} />}
            {tabIndex === 3 && <RoleTab form={form} setForm={setForm} editing={editing} />}
            {tabIndex === 4 && <SalaryTab form={form} setForm={setForm} editing={editing} />}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); setEditing(null); }}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default EmployeeAdmin;
