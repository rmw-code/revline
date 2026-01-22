import { Stack, TextField, Typography, Button, IconButton, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent, Paper, InputAdornment } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import React, { useEffect, useState, useRef } from "react";
import { LS_KEYS } from "../../../../enum/localStorageKeys";
import { loadLS } from "../../../../utils/loadLS";
import { saveLS } from "../../../../utils/saveLS";
import jsPDF from "jspdf";

export default function SalaryTab({ form, setForm, editing }) {
  const [history, setHistory] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [monthForUpload, setMonthForUpload] = useState('');
  const fileRef = useRef(null);
  const monthInputRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, [editing]);

  const loadHistory = () => {
    if (!editing) {
      setHistory([]);
      return;
    }
    const all = loadLS(LS_KEYS.EMPLOYEE_SALARIES, {}) || {};
    const rec = all[editing.id] || {};
    setHistory(Array.isArray(rec.history) ? rec.history.slice().reverse() : []); // show newest first
  };
  const updateDeduction = (idx, key, value) => {
    const next = [...(form.deductions || [])];
    next[idx] = { ...next[idx], [key]: value };
    setForm({ ...form, deductions: next });
  };

  const saveHistoryEntry = (entry) => {
    if (!editing) return;
    const all = loadLS(LS_KEYS.EMPLOYEE_SALARIES, {}) || {};
    const rec = all[editing.id] || { userId: editing.id };
    // append by default
    const nextHistory = Array.isArray(rec.history) ? rec.history.concat([entry]) : [entry];
    const nextRec = { ...rec, history: nextHistory };
    const nextAll = { ...all, [editing.id]: nextRec };
    saveLS(LS_KEYS.EMPLOYEE_SALARIES, nextAll);
    loadHistory();
  };

  const generateThisMonth = () => {
    if (!editing) {
      alert('No employee selected');
      return;
    }
    const month = new Date().toISOString().slice(0,7);
    const entry = {
      month,
      baseSalary: Number(form.baseSalary || 0),
      deductions: Array.isArray(form.deductions) ? form.deductions : [],
      epfContribution: Number(form.epfContribution || 0),
      eisContribution: Number(form.eisContribution || 0),
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'generated',
    };

    const all = loadLS(LS_KEYS.EMPLOYEE_SALARIES, {}) || {};
    const rec = all[editing.id] || { userId: editing.id };
    const existing = Array.isArray(rec.history) ? rec.history.slice() : [];
    const idx = existing.findIndex(h => h.month === month);
    if (idx >= 0) {
      const ok = window.confirm(`A salary entry for ${month} already exists. Overwrite it?`);
      if (!ok) return;
      existing[idx] = entry;
    } else {
      existing.push(entry);
    }

    const nextRec = { ...rec, history: existing };
    const nextAll = { ...all, [editing.id]: nextRec };
    saveLS(LS_KEYS.EMPLOYEE_SALARIES, nextAll);
    loadHistory();
    alert(`Salary generated for ${month}`);
  };

  const handleFileSelected = async (file) => {
    if (!file || !editing) return;
    try {
      // handle JSON parseable files specially
      const mime = file.type || '';
      const name = file.name || 'upload';
      if (mime === 'application/json' || name.toLowerCase().endsWith('.json')) {
        const txt = await file.text();
        const parsed = JSON.parse(txt);
        // Expect parsed to be an object with baseSalary, deductions, epfContribution, eisContribution optional
        const entry = {
          month: monthForUpload || new Date().toISOString().slice(0,7),
          baseSalary: Number(parsed.baseSalary || parsed.base || 0),
          deductions: Array.isArray(parsed.deductions) ? parsed.deductions : (parsed.deduction ? parsed.deduction : []),
          epfContribution: Number(parsed.epfContribution ?? parsed.epf ?? form.epfContribution ?? 0),
          eisContribution: Number(parsed.eisContribution ?? parsed.eis ?? form.eisContribution ?? 0),
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'admin',
        };
        saveHistoryEntry(entry);
        alert('Uploaded salary for ' + entry.month);
        setMonthForUpload('');
        if (fileRef.current) fileRef.current.value = null;
        return;
      }

      // For PDF / Excel / CSV — store as attachment (data URL) and don't attempt to parse
      const toDataUrl = (f) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });
      const dataUrl = await toDataUrl(file);
      const attachmentEntry = {
        month: monthForUpload || new Date().toISOString().slice(0,7),
        baseSalary: 0,
        deductions: [],
        epfContribution: form.epfContribution ?? 0,
        eisContribution: form.eisContribution ?? 0,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'admin',
        attachment: { fileName: name, fileType: file.type, dataUrl }
      };
      saveHistoryEntry(attachmentEntry);
      alert('Uploaded attachment for ' + attachmentEntry.month + ' (' + name + ')');
      setMonthForUpload('');
      if (fileRef.current) fileRef.current.value = null;
    } catch (err) {
      console.error('Failed to parse uploaded file', err);
      alert('Failed to parse uploaded file. Expecting JSON with salary fields.');
    }
  };

  const downloadEntry = (entry) => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Payslip - ${editing ? editing.name : ''} - ${entry.month}`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Base Salary: ${entry.baseSalary}`, 14, 36);
    const totalDed = (Array.isArray(entry.deductions) ? entry.deductions.reduce((s,d)=>s+Number(d.amount||0),0) : 0);
    doc.text(`Total Deductions: ${totalDed}`, 14, 46);
    doc.text(`EPF (%): ${entry.epfContribution}`, 14, 56);
    doc.text(`EIS (%): ${entry.eisContribution}`, 14, 66);
    doc.save(`payslip-${editing ? editing.id : 'user'}-${entry.month}.pdf`);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2">Salary</Typography>
      <TextField
        label="Base Salary"
        type="number"
        value={form.baseSalary}
        onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
        fullWidth
      />

      <Typography variant="subtitle2">Contributions</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <TextField
          label="EPF Contribution (%)"
          type="number"
          value={form.epfContribution ?? 0}
          onChange={(e) => setForm({ ...form, epfContribution: Number(e.target.value) })}
          sx={{ width: 160 }}
        />
        <TextField
          label="EIS Contribution (%)"
          type="number"
          value={form.eisContribution ?? 0}
          onChange={(e) => setForm({ ...form, eisContribution: Number(e.target.value) })}
          sx={{ width: 160 }}
        />
      </Stack>

      {/* Deductions */}
      <Typography variant="subtitle2" sx={{ mt: 2 }}>Deductions</Typography>
      {(form.deductions || []).map((d, idx) => (
        <Stack key={idx} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
          <TextField
            label="Title"
            value={d.title}
            onChange={(e) => updateDeduction(idx, 'title', e.target.value)}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Amount"
            type="number"
            value={d.amount}
            onChange={(e) => updateDeduction(idx, 'amount', e.target.value)}
            sx={{ width: 140 }}
          />
          <IconButton size="small" onClick={() => {
            const next = [...(form.deductions || [])];
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

      {/* History table and upload (generate button inline) */}
      <Typography variant="subtitle2" sx={{ mt: 2 }}>Salary History</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <TextField
          label="Upload Month"
          type="month"
          value={monthForUpload}
          onChange={(e) => setMonthForUpload(e.target.value)}
          sx={{ width: 200 }}
          inputRef={monthInputRef}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => {
                  const el = monthInputRef.current;
                  if (el && typeof el.showPicker === 'function') {
                    try { el.showPicker(); return; } catch (e) { /* fallthrough */ }
                  }
                  if (el) {
                    el.focus();
                    el.click && el.click();
                  }
                }}>
                  <CalendarTodayIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <input ref={fileRef} type="file" accept=".json,.pdf,.xls,.xlsx,.csv" style={{ display: 'none' }} onChange={(e) => handleFileSelected(e.target.files && e.target.files[0])} />
        <Button startIcon={<UploadFileIcon />} onClick={() => fileRef.current && fileRef.current.click()}>Upload File</Button>
        <div style={{ flex: 1 }} />
        <Button variant="contained" onClick={generateThisMonth}>Generate this month</Button>
      </Stack>

      <Paper variant="outlined" sx={{ width: '100%', overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Month</TableCell>
              <TableCell>Base</TableCell>
              <TableCell>Deductions</TableCell>
              <TableCell>EPF%</TableCell>
              <TableCell>EIS%</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((h, idx) => (
              <TableRow key={idx} hover>
                <TableCell>{h.month}</TableCell>
                <TableCell>{h.baseSalary}</TableCell>
                <TableCell>{Array.isArray(h.deductions) ? h.deductions.reduce((s,d)=>s+Number(d.amount||0),0) : 0}</TableCell>
                <TableCell>{h.epfContribution}</TableCell>
                <TableCell>{h.eisContribution}</TableCell>
                <TableCell>{h.uploadedAt ? new Date(h.uploadedAt).toLocaleString() : '-'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => setViewing(h)} title="View"><VisibilityIcon fontSize="small"/></IconButton>
                  {h.attachment ? (
                    <IconButton size="small" onClick={() => {
                      // open attachment in new tab
                      try {
                        const url = h.attachment.dataUrl;
                        const win = window.open();
                        if (win) {
                          win.document.write(`<iframe src="${url}" style="border:none; width:100%; height:100%"></iframe>`);
                        } else {
                          // fallback: trigger download
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = h.attachment.fileName || 'attachment';
                          a.click();
                        }
                      } catch (e) {
                        console.error('Failed to open attachment', e);
                      }
                    }} title="Open attachment"><DownloadIcon fontSize="small"/></IconButton>
                  ) : (
                    <IconButton size="small" onClick={() => downloadEntry(h)} title="Download"><DownloadIcon fontSize="small"/></IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {history.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center">No history</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* (Deductions are shown above the history) */}

      <Dialog open={!!viewing} onClose={() => setViewing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Salary detail - {viewing?.month}</DialogTitle>
        <DialogContent>
          {viewing && (
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Typography>Base: {viewing.baseSalary}</Typography>
              <Typography>Total Deductions: {Array.isArray(viewing.deductions) ? viewing.deductions.reduce((s,d)=>s+Number(d.amount||0),0) : 0}</Typography>
              <Typography>EPF (%): {viewing.epfContribution}</Typography>
              <Typography>EIS (%): {viewing.eisContribution}</Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

    </Stack>
  );
}
