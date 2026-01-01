import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Select,
  InputLabel,
  FormControl,
  Checkbox,
  FormControlLabel,
  InputAdornment,
} from "@mui/material";
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import styles from "./employee.module.scss";
import { loadLS, saveLS } from "../../utils";
import { LS_KEYS } from "../../enum";

const STORAGE_KEY = "bs_leaves";

export function Leave() {
  const [type, setType] = useState("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [leaves, setLeaves] = useState([]);
  const BAL_KEY = "bs_leave_balances";
  const [balances, setBalances] = useState({});
  const [user, setUser] = useState(null);
  const [halfDay, setHalfDay] = useState(false);
  const [halfPart, setHalfPart] = useState("AM");

  useEffect(() => {
    const existing = loadLS(STORAGE_KEY, []);
    setLeaves(existing || []);
  }, []);

  useEffect(() => {
    const s = loadLS(LS_KEYS.SESSION, null);
    setUser(s);

    const allBalances = loadLS(BAL_KEY, {});
    const key = s ? (s.username || s.email || s.id) : "guest";
    const userBal = allBalances[key] || { annual: 12, sick: 10, unpaid: 0 };
    setBalances(userBal);
  }, []);

  const submit = () => {
    if (!startDate || !endDate) {
      alert("Please provide both start and end dates for your leave.");
      return;
    }
    // compute days (inclusive) or half-day
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    let diffDays = Math.floor((eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;
    if (halfDay) {
      // half-day requires start and end to be same day
      if (startDate !== endDate) {
        alert("Half-day leave must be for a single date. Set start and end to the same day or uncheck Half day.");
        return;
      }
      diffDays = 0.5;
    }
    if (isNaN(diffDays) || diffDays <= 0) {
      alert("End date must be the same or after start date.");
      return;
    }

    // check balance unless unpaid
    if (type !== "unpaid") {
      const remaining = balances[type] ?? 0;
      if (diffDays > remaining) {
        alert(`Insufficient ${type} leave balance (${remaining} days left).`);
        return;
      }
    }

    const payload = {
      id: Date.now(),
      applicant: user ? (user.name || user.username || user.email) : "Unknown",
      type,
      startDate,
      endDate,
      days: diffDays,
      reason,
      notes,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    const next = [payload, ...leaves];
    setLeaves(next);
    saveLS(STORAGE_KEY, next);

    // deduct balance for non-unpaid leave
    if (type !== "unpaid") {
      const s = loadLS(LS_KEYS.SESSION, null);
      const allBalances = loadLS(BAL_KEY, {});
      const key = s ? (s.username || s.email || s.id) : "guest";
      const userBal = allBalances[key] || { annual: 12, sick: 10, unpaid: 0 };
      userBal[type] = (userBal[type] || 0) - diffDays;
      allBalances[key] = userBal;
      setBalances(userBal);
      saveLS(BAL_KEY, allBalances);
    }

    // reset form
    setType("annual");
    setStartDate("");
    setEndDate("");
    setReason("");
    setNotes("");

    alert("Leave request submitted.");
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }} className={styles.leaveContainer}>
      <Typography variant="h6" gutterBottom>
        Apply for Leave
      </Typography>

      <Box mb={1} className={styles.balances}>
        <Typography variant="body2" color="text.secondary">
          Leave balances:
        </Typography>
        <Stack className={styles.balanceItems} direction="row" spacing={1} mt={1}>
          <Box className={styles.balanceItem}>
            <Typography variant="caption">Annual</Typography>
            <Typography variant="body2">{balances.annual ?? 0} days</Typography>
          </Box>
          <Box className={styles.balanceItem}>
            <Typography variant="caption">Sick</Typography>
            <Typography variant="body2">{balances.sick ?? 0} days</Typography>
          </Box>
          <Box className={styles.balanceItem}>
            <Typography variant="caption">Unpaid</Typography>
            <Typography variant="body2">{balances.unpaid ?? 0} days</Typography>
          </Box>
        </Stack>
      </Box>

      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
          <FormControl fullWidth>
            <InputLabel id="leave-type-label">Leave Type</InputLabel>
            <Select
              labelId="leave-type-label"
              value={type}
              label="Leave Type"
              onChange={(e) => setType(e.target.value)}
            >
              <MenuItem value="annual">Annual Leave</MenuItem>
              <MenuItem value="sick">Sick Leave</MenuItem>
              <MenuItem value="unpaid">Unpaid Leave</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Start Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <CalendarTodayIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="End Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <CalendarTodayIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        <Box>
          <FormControlLabel
            control={
              <Checkbox checked={halfDay} onChange={(e) => setHalfDay(e.target.checked)} />
            }
            label="Half day"
          />
          {halfDay && (
            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel id="half-part-label">When</InputLabel>
              <Select
                labelId="half-part-label"
                value={halfPart}
                label="When"
                onChange={(e) => setHalfPart(e.target.value)}
              >
                <MenuItem value="AM">Morning (AM)</MenuItem>
                <MenuItem value="PM">Afternoon (PM)</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>

        <TextField
          label="Reason"
          placeholder="Short description of leave"
          fullWidth
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <TextField
          label="Notes (optional)"
          placeholder="Additional information"
          fullWidth
          multiline
          minRows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <Box display="flex" justifyContent="flex-end">
          <Button variant="contained" onClick={submit}>
            Submit Leave Request
          </Button>
        </Box>
      </Stack>

      {/* Recent leave requests */}
      <Box mt={3}>
        <Typography variant="subtitle1" gutterBottom>
          Recent Requests
        </Typography>

        <div className={styles.tableWrapper}>
          <table className={styles.leaveTable}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20 }}>
                    No leave requests yet.
                  </td>
                </tr>
              )}
              {leaves.map((l) => (
                <tr key={l.id}>
                  <td>{(l.type || "-").toUpperCase()}</td>
                  <td>{l.startDate}</td>
                  <td>{l.endDate}</td>
                  <td style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={l.reason}>{l.reason || "-"}</td>
                  <td>{l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Box>
    </Paper>
  );
}

export default Leave;
