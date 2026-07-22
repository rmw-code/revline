import {
  Stack,
  TextField,
  Typography,
  Button,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import React, { useEffect, useState, useRef } from "react";
import { LS_KEYS } from "../../../../enum/localStorageKeys";
import { loadLS } from "../../../../utils/loadLS";
import { saveLS } from "../../../../utils/saveLS";
import jsPDF from "jspdf";
import {
  getEmployeeSalary,
  getSalaryHistory,
  downloadSalaryHistory,
  createSalaryHistory,
  uploadSalaryHistory,
} from "../../../../services/employeeService";

export default function SalaryTab({ form, setForm, editing }) {
  const [history, setHistory] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [monthForUpload, setMonthForUpload] = useState("");
  const fileRef = useRef(null);
  const monthInputRef = useRef(null);

  useEffect(() => {
    loadHistory();
    if (editing) {
      loadSalaryDetails();
    }
  }, [editing]);

  // Auto-calculate Net Amount
  useEffect(() => {
    const base = Number(form.baseSalary || 0);
    const items = form.items || [];
    let allowances = 0;
    let deductions = 0;
    items.forEach((item) => {
      const amt = Number(item.amount || 0);
      if (item.type === "ALLOWANCE") allowances += amt;
      else if (item.type === "DEDUCTION") deductions += amt;
      else deductions += amt; // Fallback for OTHER
    });

    const epfAmount = Number(form.epfContribution || 0);
    const eisAmount = Number(form.eisContribution || 0);

    // Net = Base + Allowances - Deductions - EPF - EIS
    const net = base + allowances - deductions - epfAmount - eisAmount;

    setForm((prev) => {
      // Only update if value matches calculation to avoid overwriting user edits?
      // User said "any changes... will automatically show".
      // This usually means overwrite.
      // "The auto calculation is just a suggestion." -> implies if I change parameters, suggestion updates.
      // If I change Net Amount, it stays. If I change Base Salary, it updates Net Amount.
      // This is solved by using dependencies.
      // If dependencies change, we overwrite Net Amount.
      // If dependencies DON'T change (user typing in Net Amount field), this effect DOES NOT run.
      // Perfect.
      if (prev.netAmount === Number(net.toFixed(2))) return prev;
      return { ...prev, netAmount: Number(net.toFixed(2)) };
    });
  }, [form.baseSalary, form.items, form.epfContribution, form.eisContribution]);

  const loadSalaryDetails = async () => {
    try {
      const salaryData = await getEmployeeSalary(editing.id);
      if (salaryData) {
        setForm((prev) => ({
          ...prev,
          baseSalary: salaryData.baseSalary || 0,
          epfContribution: salaryData.epfContribution || 0,
          eisContribution: salaryData.eisContribution || 0,
          items: (salaryData.items || []).map((item) => ({
            title: item.name,
            amount: item.amount,
            type: item.type || "OTHER",
          })),
        }));
      }
    } catch (e) {
      console.error("Failed to load salary details", e);
    }
  };

  const loadHistory = async () => {
    if (!editing) {
      setHistory([]);
      return;
    }
    try {
      const res = await getSalaryHistory(editing.id);
      setHistory(res.content || []);
    } catch (e) {
      console.error("Failed to load salary history", e);
      setHistory([]);
    }
  };

  const updateItem = (idx, key, value) => {
    const next = [...(form.items || [])];
    next[idx] = { ...next[idx], [key]: value };
    setForm({ ...form, items: next });
  };

  const saveHistoryEntry = (entry) => {
    if (!editing) return;
    const all = loadLS(LS_KEYS.EMPLOYEE_SALARIES, {}) || {};
    const rec = all[editing.id] || { userId: editing.id };
    const nextHistory = Array.isArray(rec.history)
      ? rec.history.concat([entry])
      : [entry];
    const nextRec = { ...rec, history: nextHistory };
    const nextAll = { ...all, [editing.id]: nextRec };
    saveLS(LS_KEYS.EMPLOYEE_SALARIES, nextAll);
    // loadHistory();
    alert("Saved to local storage (not visible in API history)");
  };

  const generateThisMonth = async () => {
    if (!editing) {
      alert("No employee selected");
      return;
    }
    const month = new Date().toISOString().slice(0, 7);

    try {
      const base = Number(form.baseSalary || 0);

      // Use EPF/EIS amounts directly from form
      const epfAmount = Number(form.epfContribution || 0);
      const eisAmount = Number(form.eisContribution || 0);

      // Use user-defined Net Amount (or auto-calculated)
      const net = Number(form.netAmount || 0);

      const data = {
        userId: editing.id,
        month: month,
        baseAmount: base,
        netAmount: Number(net.toFixed(2)),
        epf: Number(epfAmount.toFixed(2)),
        eis: Number(eisAmount.toFixed(2)),
      };

      await createSalaryHistory(data);
      alert(`Salary generated for ${month}`);
      loadHistory();
    } catch (e) {
      console.error("Failed to generate salary", e);
      alert("Failed to generate salary history");
    }
  };

  const handleFileSelected = async (file) => {
    if (!file || !editing) return;
    try {
      const mime = file.type || "";
      const name = file.name || "upload";
      if (mime === "application/json" || name.toLowerCase().endsWith(".json")) {
        const txt = await file.text();
        const parsed = JSON.parse(txt);
        const entry = {
          month: monthForUpload || new Date().toISOString().slice(0, 7),
          baseSalary: Number(parsed.baseSalary || parsed.base || 0),
          items: Array.isArray(parsed.items)
            ? parsed.items
            : parsed.deductions
              ? parsed.deductions
              : [],
          epfContribution: Number(
            parsed.epfContribution ?? parsed.epf ?? form.epfContribution ?? 0,
          ),
          eisContribution: Number(
            parsed.eisContribution ?? parsed.eis ?? form.eisContribution ?? 0,
          ),
          uploadedAt: new Date().toISOString(),
          uploadedBy: "admin",
        };
        saveHistoryEntry(entry);
        alert("Uploaded salary for " + entry.month);
        setMonthForUpload("");
        if (fileRef.current) fileRef.current.value = null;
        return;
      }

      if (!monthForUpload) {
        alert("Please select the Upload Month first.");
        if (fileRef.current) fileRef.current.value = null;
        return;
      }

      // Simplified payload: only base is real, others 0 as requested
      const base = Number(form.baseSalary || 0);

      const data = {
        baseAmount: base,
        netAmount: 0,
        epf: 0,
        eis: 0,
      };

      await uploadSalaryHistory(editing.id, monthForUpload, file, data);
      alert(`File uploaded successfully for ${monthForUpload}`);

      setMonthForUpload("");
      if (fileRef.current) fileRef.current.value = null;
      loadHistory();
    } catch (err) {
      console.error("Failed to upload file", err);
      alert("Failed to upload file: " + err.message);
      if (fileRef.current) fileRef.current.value = null;
    }
  };

  const handleDownload = async (entry) => {
    if (entry.isManualUploaded) {
      try {
        const blob = await downloadSalaryHistory(entry.id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `salary_history_${entry.month}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Download failed", e);
        alert("Failed to download file");
      }
    } else {
      downloadEntry(entry);
    }
  };

  const downloadEntry = (entry) => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(
      `Payslip - ${editing ? editing.name : ""} - ${entry.month}`,
      14,
      20,
    );
    doc.setFontSize(11);

    const base =
      entry.baseAmount !== undefined ? entry.baseAmount : entry.baseSalary;
    const net = entry.netAmount !== undefined ? entry.netAmount : 0;
    const epf = entry.epf !== undefined ? entry.epf : entry.epfContribution;
    const eis = entry.eis !== undefined ? entry.eis : entry.eisContribution;

    doc.text(`Base Salary: ${base}`, 14, 36);
    // If net is available (API history), show it.
    if (entry.netAmount !== undefined) {
      doc.text(`Net Amount: ${net}`, 14, 46);
    } else {
      // Fallback calculation for legacy local history
      let totalAllowance = 0;
      let totalDeduction = 0;
      const items = entry.items || entry.deductions || [];
      items.forEach((d) => {
        const amt = Number(d.amount || 0);
        if (d.type === "ALLOWANCE") totalAllowance += amt;
        else if (d.type === "DEDUCTION") totalDeduction += amt;
        // Legacy handling: if no type, assume deduction was the norm in legacy
        else totalDeduction += amt;
      });
      doc.text(`Total Allowances: ${totalAllowance}`, 14, 46);
      doc.text(`Total Deductions: ${totalDeduction}`, 14, 56);
    }

    doc.text(`EPF: ${epf}`, 14, 66);
    doc.text(`EIS: ${eis}`, 14, 76);
    doc.save(`payslip-${editing ? editing.id : "user"}-${entry.month}.pdf`);
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
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField
          label="EPF Contribution"
          type="number"
          value={form.epfContribution ?? 0}
          onChange={(e) =>
            setForm({ ...form, epfContribution: Number(e.target.value) })
          }
          sx={{ width: 160 }}
        />
        <TextField
          label="EIS Contribution"
          type="number"
          value={form.eisContribution ?? 0}
          onChange={(e) =>
            setForm({ ...form, eisContribution: Number(e.target.value) })
          }
          sx={{ width: 160 }}
        />
      </Stack>

      <Typography variant="subtitle2" sx={{ mt: 2 }}>
        Salary Items
      </Typography>
      {(form.items || []).map((d, idx) => (
        <Stack
          key={idx}
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems="center"
        >
          <TextField
            label="Title"
            value={d.title}
            onChange={(e) => updateItem(idx, "title", e.target.value)}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Amount"
            type="number"
            value={d.amount}
            onChange={(e) => updateItem(idx, "amount", e.target.value)}
            sx={{ width: 140 }}
          />
          <FormControl sx={{ width: 160 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={d.type || "OTHER"}
              label="Type"
              onChange={(e) => updateItem(idx, "type", e.target.value)}
            >
              <MenuItem value="ALLOWANCE">Allowance</MenuItem>
              <MenuItem value="DEDUCTION">Deduction</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </FormControl>
          <IconButton
            size="small"
            onClick={() => {
              const next = [...(form.items || [])];
              next.splice(idx, 1);
              setForm({ ...form, items: next });
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ))}

      <Button
        startIcon={<AddIcon />}
        onClick={() => {
          const next = [
            ...(form.items || []),
            { title: "", amount: 0, type: "OTHER" },
          ];
          setForm({ ...form, items: next });
        }}
      >
        Add Item
      </Button>

      {/* Net Amount Field */}
      <TextField
        label="Net Amount"
        type="number"
        value={form.netAmount !== undefined ? form.netAmount : ""}
        onChange={(e) => setForm({ ...form, netAmount: e.target.value })}
        sx={{ width: 320 }}
        helperText="Auto-calculated. You can manually edit this value."
      />

      <Typography variant="subtitle2" sx={{ mt: 2 }}>
        Salary History
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <TextField
          label="Upload Month"
          type="month"
          value={monthForUpload}
          onChange={(e) => setMonthForUpload(e.target.value)}
          sx={{
            width: 200,
            "& .MuiOutlinedInput-root": {
              color: monthForUpload ? "inherit" : "transparent",
            },
            "& .MuiOutlinedInput-input": {
              color: monthForUpload ? "inherit" : "transparent",
            },
          }}
          inputRef={monthInputRef}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => {
                    const el = monthInputRef.current;
                    if (el && typeof el.showPicker === "function") {
                      try {
                        el.showPicker();
                        return;
                      } catch (e) {}
                    }
                    if (el) {
                      el.focus();
                      el.click && el.click();
                    }
                  }}
                >
                  <CalendarTodayIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <input
          ref={fileRef}
          type="file"
          accept=".json,.pdf,.xls,.xlsx,.csv"
          style={{ display: "none" }}
          onChange={(e) =>
            handleFileSelected(e.target.files && e.target.files[0])
          }
        />
        <Button
          startIcon={<UploadFileIcon />}
          onClick={() => fileRef.current && fileRef.current.click()}
        >
          Upload File
        </Button>
        <div style={{ flex: 1 }} />
        <Button variant="contained" onClick={generateThisMonth}>
          Generate this month
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ width: "100%", overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Month</TableCell>
              <TableCell>Base</TableCell>
              <TableCell>Net</TableCell>
              <TableCell>EPF</TableCell>
              <TableCell>EIS</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((h, idx) => {
              const base =
                h.baseAmount !== undefined ? h.baseAmount : h.baseSalary;
              const net = h.netAmount !== undefined ? h.netAmount : 0;
              const epf = h.epf !== undefined ? h.epf : h.epfContribution;
              const eis = h.eis !== undefined ? h.eis : h.eisContribution;

              return (
                <TableRow key={idx} hover>
                  <TableCell>{h.month}</TableCell>
                  <TableCell>{base}</TableCell>
                  <TableCell>{net}</TableCell>
                  <TableCell>{epf}</TableCell>
                  <TableCell>{eis}</TableCell>
                  <TableCell>
                    {h.uploadedAt
                      ? new Date(h.uploadedAt).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell align="right">
                    {!h.isManualUploaded && (
                      <IconButton
                        size="small"
                        onClick={() => setViewing(h)}
                        title="View"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleDownload(h)}
                      title="Download"
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {history.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No history
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog
        open={!!viewing}
        onClose={() => setViewing(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Salary detail - {viewing?.month}</DialogTitle>
        <DialogContent>
          {viewing && (
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Typography>
                Base:{" "}
                {viewing.baseAmount !== undefined
                  ? viewing.baseAmount
                  : viewing.baseSalary}
              </Typography>
              <Typography>Net: {viewing.netAmount}</Typography>
              <Typography>
                EPF:{" "}
                {viewing.epf !== undefined
                  ? viewing.epf
                  : viewing.epfContribution}
              </Typography>
              <Typography>
                EIS:{" "}
                {viewing.eis !== undefined
                  ? viewing.eis
                  : viewing.eisContribution}
              </Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
