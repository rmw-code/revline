import React, { useEffect, useState } from "react";
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
  Button,
  MenuItem,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { getMySalary, getMySalaryHistory, downloadSalaryHistory } from "../../services/employeeService";
import { loadLS } from "../../utils";
import { LS_KEYS } from "../../enum";
import { LoadingIndicator } from "../LoadingIndicator";
import styles from "./employee.module.scss";

export function Earning() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [session, setSession] = useState(null);
  const [salaryData, setSalaryData] = useState(null);
  const [historyMonths, setHistoryMonths] = useState([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = loadLS(LS_KEYS.SESSION, null);
    setSession(s);

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch salary history months
        const historyRes = await getMySalaryHistory(0, 100);
        if (historyRes && historyRes.content) {
          setHistoryMonths(historyRes.content);
          // Auto-select the first available month
          if (historyRes.content.length > 0) {
            const firstMonth = historyRes.content[0].month;
            setMonth(firstMonth);
            setSelectedHistoryId(historyRes.content[0].id);
          }
        }

        // Fetch current salary details
        const salaryRes = await getMySalary();
        if (salaryRes) {
          setSalaryData(salaryRes);
        }
      } catch (error) {
        console.error("Failed to fetch earning data", error);
      } finally {
        setLoading(false);
      }
    };

    if (s) {
      fetchData();
    }
  }, []);

  // When month changes, update the selected history record
  useEffect(() => {
    if (historyMonths.length > 0 && month) {
      const matched = historyMonths.find((h) => h.month === month);
      if (matched) {
        setSelectedHistoryId(matched.id);
      } else {
        setSelectedHistoryId(null);
      }
    }
  }, [month, historyMonths]);

  const onMonthChange = (e) => {
    setMonth(e.target.value);
  };

  const downloadPayslip = async () => {
    if (!selectedHistoryId) {
      alert("No payslip available for the selected month.");
      return;
    }
    try {
      const blob = await downloadSalaryHistory(selectedHistoryId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `payslip-${month}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download payslip", err);
      alert("Failed to download payslip. Please try again.");
    }
  };

  // Find the selected month's history data for displaying amounts
  const selectedHistory = historyMonths.find((h) => h.month === month) || null;

  if (!session)
    return (
      <Paper variant="outlined" sx={{ p: 2 }} className={styles.leaveContainer}>
        <Typography variant="h6">My Earnings</Typography>
        <Typography color="text.secondary">
          Please login to view your earnings.
        </Typography>
      </Paper>
    );

  return (
    <Paper variant="outlined" sx={{ p: 2 }} className={styles.leaveContainer}>
      <Typography variant="h6" gutterBottom>
        My Earnings
      </Typography>

      {loading ? (
        <LoadingIndicator label="Loading your earnings..." />
      ) : (
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
              select
              value={month}
              onChange={onMonthChange}
              sx={{ minWidth: 200 }}
            >
              {historyMonths.length === 0 ? (
                <MenuItem value={month} disabled>
                  {month} (No history)
                </MenuItem>
              ) : (
                historyMonths.map((h) => (
                  <MenuItem key={h.id} value={h.month}>
                    {h.month}
                  </MenuItem>
                ))
              )}
            </TextField>
          </Box>

          <Box className={styles.tableWrapper}>
            <Table className={styles.leaveTable}>
              <TableBody>
                <TableRow>
                  <TableCell>Base Salary</TableCell>
                  <TableCell>
                    {selectedHistory
                      ? `RM${Number(selectedHistory.baseAmount || 0).toFixed(2)}`
                      : salaryData
                      ? `RM${Number(salaryData.baseSalary || 0).toFixed(2)}`
                      : "-"}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>EPF Contribution</TableCell>
                  <TableCell>
                    {selectedHistory
                      ? `RM${Number(selectedHistory.epf || 0).toFixed(2)}`
                      : "-"}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>EIS Contribution</TableCell>
                  <TableCell>
                    {selectedHistory
                      ? `RM${Number(selectedHistory.eis || 0).toFixed(2)}`
                      : "-"}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>Net Salary</TableCell>
                  <TableCell>
                    {selectedHistory
                      ? `RM${Number(selectedHistory.netAmount || 0).toFixed(2)}`
                      : "-"}
                  </TableCell>
                </TableRow>

                {/* Deductions from current salary setup */}
                {salaryData && salaryData.salaryItems && salaryData.salaryItems.length > 0 && (
                  <>
                    <TableRow>
                      <TableCell>Deductions</TableCell>
                      <TableCell>
                        <Table className={styles.leaveTable}>
                          <TableBody>
                            {salaryData.salaryItems
                              .filter((item) => item.type === "DEDUCTION")
                              .map((d, idx) => (
                                <TableRow key={idx} sx={{ padding: "0px" }}>
                                  <TableCell
                                    style={{ borderBottom: "none", padding: 0 }}
                                  >
                                    {d.title || d.name || "-"}
                                  </TableCell>
                                  <TableCell
                                    style={{ borderBottom: "none", padding: 0 }}
                                  >{`RM${Number(d.amount || 0).toFixed(2)}`}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Allowances</TableCell>
                      <TableCell>
                        <Table className={styles.leaveTable}>
                          <TableBody>
                            {salaryData.salaryItems
                              .filter((item) => item.type === "ALLOWANCE")
                              .map((a, idx) => (
                                <TableRow key={idx} sx={{ padding: "0px" }}>
                                  <TableCell
                                    style={{ borderBottom: "none", padding: 0 }}
                                  >
                                    {a.title || a.name || "-"}
                                  </TableCell>
                                  <TableCell
                                    style={{ borderBottom: "none", padding: 0 }}
                                  >{`RM${Number(a.amount || 0).toFixed(2)}`}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </TableCell>
                    </TableRow>
                  </>
                )}

                <TableRow>
                  <TableCell>Uploaded At</TableCell>
                  <TableCell>
                    {selectedHistory && selectedHistory.uploadedAt
                      ? new Date(selectedHistory.uploadedAt).toLocaleString()
                      : "-"}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>Source</TableCell>
                  <TableCell>
                    {selectedHistory
                      ? selectedHistory.isManualUploaded
                        ? "Uploaded Payslip"
                        : "Manual Entry"
                      : "-"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>

          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={downloadPayslip}
            disabled={!selectedHistoryId || !selectedHistory?.isManualUploaded}
          >
            {selectedHistory?.isManualUploaded
              ? "Download Payslip"
              : "No File Available"}
          </Button>
        </Stack>
      )}
    </Paper>
  );
}

export default Earning;