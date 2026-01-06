import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Typography,
  InputAdornment,
  Button,
  IconButton,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DownloadIcon from "@mui/icons-material/Download";
import { jsPDF } from "jspdf";
import styles from "./employee.module.scss";
import { loadLS } from "../../utils";
import { LS_KEYS } from "../../enum";

export function Earning() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [session, setSession] = useState(null);
  const [salaryRecord, setSalaryRecord] = useState(null);
  const monthInputRef = useRef(null);

  // compute max month (current month) to prevent selecting future months
  const now = new Date();
  const maxMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  useEffect(() => {
    const s = loadLS(LS_KEYS.SESSION, null);
    setSession(s);

    const all = loadLS(LS_KEYS.EMPLOYEE_SALARIES, {});
    let rec = null;
    if (s && all) {
      if (Array.isArray(all)) {
        rec =
          all.find(
            (r) =>
              r &&
              (r.userId === s.id ||
                r.userId === s.username ||
                r.email === s.email)
          ) || null;
      } else if (typeof all === "object") {
        // direct map keyed by id
        if (all[s.id]) {
          rec = all[s.id];
        } else {
          // search values for a matching userId or email/username
          const vals = Object.values(all || {});
          rec =
            vals.find(
              (r) =>
                r &&
                (r.userId === s.id ||
                  r.userId === s.username ||
                  r.userId === s.email ||
                  r.email === s.email ||
                  r.username === s.username)
            ) || null;
        }
      }
    }
    setSalaryRecord(rec && rec.published ? rec : null);
  }, []);

  const onMonthChange = (e) => {
    const v = e.target.value;
    // clamp to maxMonth if user types a future month
    if (v > maxMonth) {
      setMonth(maxMonth);
    } else {
      setMonth(v);
    }
  };

  const openMonthPicker = () => {
    const el = monthInputRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === "function") {
        el.showPicker();
        return;
      }
    } catch (e) {}
    try {
      el.focus();
      el.click();
    } catch (e) {}
  };

  const downloadPayslip = (selectedMonth) => {
    if (!session) {
      alert("Please login to download payslip.");
      return;
    }
    if (!salaryRecord) {
      alert("No published salary record available to download.");
      return;
    }
    try {
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text(`Payslip - ${selectedMonth}`, 14, 20);
      doc.setFontSize(11);
      doc.text(
        `Employee: ${session.name || session.username || session.email}`,
        14,
        32
      );
      doc.text(`Month: ${selectedMonth}`, 14, 40);
      const base = Number(salaryRecord.baseSalary || 0).toFixed(2);
      doc.text(`Base Salary: RM${base}`, 14, 50);

      let y = 60;
      doc.text(`Deductions:`, 14, y);
      y += 6;
      const deductions = salaryRecord.deductions || [];
      if (deductions.length === 0) {
        doc.text(`- None`, 18, y);
        y += 8;
      } else {
        deductions.forEach((d) => {
          doc.text(
            `${d.title || "-"}: RM${Number(d.amount || 0).toFixed(2)}`,
            18,
            y
          );
          y += 8;
        });
      }

      const totalDeductions = deductions
        .reduce((s, d) => s + Number(d.amount || 0), 0)
        .toFixed(2);
      doc.text(`Total Deductions: RM${totalDeductions}`, 14, y + 4);
      doc.text(
        `Net Salary: RM${(
          Number(salaryRecord.baseSalary || 0) - Number(totalDeductions)
        ).toFixed(2)}`,
        14,
        y + 14
      );

      doc.save(`payslip-${session.id || "user"}-${selectedMonth}.pdf`);
    } catch (err) {
      console.error("Failed to generate payslip", err);
      alert("Failed to generate payslip.");
    }
  };

  if (!session)
    return (
      <Paper variant="outlined" sx={{ p: 2 }} className={styles.leaveContainer}>
        <Typography variant="h6">My Earning</Typography>
        <Typography color="text.secondary">
          Please login to view your earning.
        </Typography>
      </Paper>
    );

  return (
    <Paper variant="outlined" sx={{ p: 2 }} className={styles.leaveContainer}>
      <Typography variant="h6" gutterBottom>
        My Earning
      </Typography>

      <Stack spacing={2}>
        <Box display="flex" gap={12} alignItems="center">
          <Typography variant="subtitle2">Employee</Typography>
          <Typography variant="body1">
            {session.name || session.username || session.email}
          </Typography>
        </Box>

        <Box display="flex" gap={12} alignItems="center">
          <Typography variant="subtitle2">Select Month</Typography>
            <TextField
              type="month"
              value={month}
              onChange={onMonthChange}
              inputRef={monthInputRef}
              inputProps={{ max: maxMonth }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ pointerEvents: "auto" }}>
                    <IconButton
                      size="small"
                      onClick={openMonthPicker}
                      edge="start"
                      sx={{ cursor: "pointer" }}
                      aria-label="Open month picker"
                      title="Open month picker"
                    >
                      <CalendarTodayIcon fontSize="small" color="action" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => downloadPayslip(month)}
          >
            Download Payslip
          </Button>
        </Box>

        <Box className={styles.tableWrapper}>
          <Table className={styles.leaveTable}>
            <TableBody>
              <TableRow>
                <TableCell>Base Salary</TableCell>
                <TableCell>
                  {salaryRecord
                    ? `RM${Number(salaryRecord.baseSalary || 0).toFixed(2)}`
                    : "-"}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>Deductions</TableCell>
                <TableCell>
                  {salaryRecord &&
                  salaryRecord.deductions &&
                  salaryRecord.deductions.length > 0 ? (
                    <Table className={styles.leaveTable}>
                      <TableBody>
                        {salaryRecord.deductions.map((d, idx) => (
                          <TableRow key={idx}>
                            <TableCell style={{ borderBottom: "none" }}>
                              {d.title || "-"}
                            </TableCell>
                            <TableCell
                              style={{ borderBottom: "none" }}
                            >{`RM${Number(d.amount || 0).toFixed(
                              2
                            )}`}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>Total Deductions</TableCell>
                <TableCell>
                  {salaryRecord
                    ? `RM${(salaryRecord.deductions || [])
                        .reduce((s, d) => s + Number(d.amount || 0), 0)
                        .toFixed(2)}`
                    : "-"}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>Net Salary</TableCell>
                <TableCell>
                  {salaryRecord
                    ? `RM${(
                        Number(salaryRecord.baseSalary || 0) -
                        (salaryRecord.deductions || []).reduce(
                          (s, d) => s + Number(d.amount || 0),
                          0
                        )
                      ).toFixed(2)}`
                    : "-"}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>Contact</TableCell>
                <TableCell>
                  {salaryRecord && salaryRecord.contact ? (
                    <div>
                      <div>{salaryRecord.contact.address}</div>
                      <div>{salaryRecord.contact.phone}</div>
                      <div>{salaryRecord.contact.emergencyContactName}</div>
                      <div>{salaryRecord.contact.emergencyContactNo}</div>
                      <div>{salaryRecord.contact.bankName}</div>
                      <div>{salaryRecord.contact.bankAccountNumber}</div>
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Stack>
    </Paper>
  );
}

export default Earning;
