import EditIcon from "@mui/icons-material/Edit";
import PaidIcon from "@mui/icons-material/Paid";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, Tabs, Tab } from "@mui/material";
import { useEffect, useState } from "react";
import styles from "../admin.module.scss";
// Removed getUsers import
import { getEmployees, updateEmployeeDetails, updateSalaryPublishStatus } from "../../../services/employeeService";
import { LS_KEYS } from "../../../enum/localStorageKeys";
import { loadLS } from "../../../utils/loadLS";
import { saveLS } from "../../../utils/saveLS";
import { formatDateForInput, formatDateForApi } from "../../../utils/dateUtils";
import { hasAnyRole } from "../../../utils";

import PersonalTab from "./tabs/PersonalTab";
import BankingTab from "./tabs/BankingTab";
import LeavesTab from "./tabs/LeavesTab";
import RoleTab from "./tabs/RoleTab";
import SalaryTab from "./tabs/SalaryTab";

export function EmployeeAdmin({ roles }) {
  // Removed users state
  const [employees, setEmployees] = useState([]); // employee data from API
  const [salaries, setSalaries] = useState({}); // map userId => salary record
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [form, setForm] = useState({ baseSalary: "", items: [], published: false, contact: { address: '', phone: '', emergencyContactName: '', emergencyContactNo: '', bankName: '', bankAccountNumber: '' }, leaveBalances: { annual: 0, sick: 0, unpaid: 0 }, epfContribution: 11, eisContribution: 0, position: '' });

  useEffect(() => {
    const fetch = async () => {
      try {
        // Fetch employees with detailed information from backend
        const employeeData = await getEmployees();
        console.log("Employee data from API:", employeeData);
        setEmployees(employeeData || []);

        // Removed getUsers call
      } catch (e) {
        console.error("Failed to load employees", e);
      }
    };
    fetch();

    const existing = loadLS(LS_KEYS.EMPLOYEE_SALARIES, {});
    setSalaries(existing || {});
  }, []);

  const openFor = (emp) => {
    // Use API data directly
    const employeeData = emp;

    if (employeeData) {
      // Use API data to populate form
      const items = (employeeData.salaryItems || []).map(item => ({
        title: item.name || "",
        amount: Number(item.amount || 0),
        type: item.type || "OTHER"
      }));

      setForm({
        baseSalary: employeeData.baseSalary || "",
        items: items,
        published: !!employeeData.isSalaryPublished,
        contact: {
          email: employeeData.email || '',
          altEmail: employeeData.alternateEmail || employeeData.altEmail || '',
          fullName: employeeData.fullName || employeeData.name || '',
          nickname: employeeData.nickname || employeeData.name || '',
          icNumber: employeeData.icNo || employeeData.icNumber || '',
          birthDate: formatDateForInput(employeeData.dob || employeeData.birthDate || ''),
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
      // Fallback or defaults if for some reason data is missing, though we iterate employees
      setForm({ baseSalary: "", items: [], published: false, contact: { address: '', phone: '', emergencyContactName: '', emergencyContactNo: '', bankName: '', bankAccountNumber: '' }, leaveBalances: { annual: 0, sick: 0, unpaid: 0 }, epfContribution: 11, eisContribution: 0, position: '' });
    }

    // Set editing object, ensuring we have the id (userId) for saving
    setEditing({ ...emp, id: emp.userId });
    setTabIndex(0);
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;

    try {
      // Prepare data for API
      const details = {
        name: form.contact?.fullName || '',
        alternateEmail: form.contact?.altEmail || '',
        icNo: form.contact?.icNumber || '',
        dob: formatDateForApi(form.contact?.birthDate || ''),
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
        position: form.position || '',
        // Map items back to what backend might expect?
        // If backend returns 'items', let's send 'items'.
        // But if previous was salaryItems or deductions...
        // Let's send 'items' and hope backend handles it.
        items: (form.items || []).map(i => ({
          name: i.title,
          amount: Number(i.amount),
          type: i.type
        })),
        baseSalary: Number(form.baseSalary || 0),
        epfContribution: Number(form.epfContribution || 0),
        eisContribution: Number(form.eisContribution || 0)
      };

      // Call API to update employee details
      // editing.id here corresponds to userId because we set it in openFor
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

  const togglePublish = async (emp) => {
    try {
      // Get current published status from passed employee object
      const currentStatus = !!emp.isSalaryPublished;
      const newStatus = !currentStatus;

      // Call API to update salary publish status
      // Use emp.userId
      await updateSalaryPublishStatus(emp.userId, newStatus);

      // Refetch employee data to get updated information
      const updatedEmployeeData = await getEmployees();
      setEmployees(updatedEmployeeData || []);

      // Also update localStorage for backward compatibility
      const current = salaries[emp.userId] || { baseSalary: 0, deductions: 0, published: false, contact: { address: '', phone: '', emergencyContactName: '', emergencyContactNo: '', bankName: '', bankAccountNumber: '' }, leaveBalances: { annual: 0, sick: 0, unpaid: 0 }, epfContribution: 11, eisContribution: 0, position: '' };
      const nextRecord = { ...current, published: newStatus, updatedAt: new Date().toISOString() };
      const next = { ...salaries, [emp.userId]: nextRecord };
      setSalaries(next);
      saveLS(LS_KEYS.EMPLOYEE_SALARIES, next);
    } catch (error) {
      console.error("Failed to update salary publish status:", error);
      alert("Failed to update salary publish status. Please try again.");
    }
  };

  // Only allow managers/superadmin to access
  const canManage = (roles) => hasAnyRole(roles, ["SUPERADMIN", "ADMIN"]);
  if (!canManage(roles)) {
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
            {employees.map((emp) => {
              // Iterate over employees directly
              const s = salaries[emp.userId];

              return (
                <TableRow key={emp.userId} hover>
                  <TableCell className={styles.ellipsis}>{emp.fullName || emp.name}</TableCell>
                  <TableCell className={styles.ellipsis}>{emp.email}</TableCell>
                  <TableCell className={styles.ellipsis}>{emp.role || '—'}</TableCell>
                  <TableCell>{emp.baseSalary || (s ? s.baseSalary : "—")}</TableCell>
                  <TableCell className={styles.ellipsis}>{emp.totalDeductions?.toLocaleString() || (s ? (() => {
                    const ded = s.deductions;
                    if (Array.isArray(ded)) return ded.reduce((sum, d) => sum + (Number(d.amount) || 0), 0).toLocaleString();
                    if (typeof ded === 'number') return Number(ded).toLocaleString();
                    return "—";
                  })() : "—")}</TableCell>
                  <TableCell>{Number(emp.annualLeave || 0) || (s && s.leaveBalances ? (Number(s.leaveBalances.annual) || 0) : 0)}</TableCell>
                  <TableCell>{Number(emp.sickLeave || 0) || (s && s.leaveBalances ? (Number(s.leaveBalances.sick) || 0) : 0)}</TableCell>
                  <TableCell>{Number(emp.unpaidLeave || 0) || (s && s.leaveBalances ? (Number(s.leaveBalances.unpaid) || 0) : 0)}</TableCell>
                  <TableCell className={styles.ellipsis}>{emp.address || (s && s.contact ? s.contact.address || '—' : '—')}</TableCell>
                  <TableCell className={styles.ellipsis}>{emp.phone || (s && s.contact ? s.contact.phone || '—' : '—')}</TableCell>
                  <TableCell className={styles.ellipsis}>{emp.emergencyContactName || (s && s.contact ? s.contact.emergencyContactName || '—' : '—')}</TableCell>
                  <TableCell className={styles.ellipsis}>{emp.emergencyContactNo || (s && s.contact ? s.contact.emergencyContactNo || '—' : '—')}</TableCell>
                  <TableCell className={styles.ellipsis}>{emp.bankName || (s && s.contact ? s.contact.bankName || '—' : '—')}</TableCell>
                  <TableCell className={styles.ellipsis}>{emp.bankAccountNumber || (s && s.contact ? s.contact.bankAccountNumber || '—' : '—')}</TableCell>
                  <TableCell>{Number(emp.epfContribution || 0) || (s ? (Number(s.epfContribution) || 0) : 0)}</TableCell>
                  <TableCell>{Number(emp.eisContribution || 0) || (s ? (Number(s.eisContribution) || 0) : 0)}</TableCell>
                  <TableCell>
                    <Switch size="small" checked={!!emp.isSalaryPublished} onChange={() => togglePublish(emp)} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openFor(emp)}>
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
