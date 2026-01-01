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
import { createLeaveRequest, getLeaveRequests } from "../../services/leaveService";
import { loadLS, saveLS } from "../../utils";
import { LS_KEYS } from "../../enum";

const STORAGE_KEY = "bs_leaves";

export function Leave() {
  const [type, setType] = useState("ANNUAL_LEAVE");
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

  // Fetch leave requests from API
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        const data = await getLeaveRequests(0, 200);
        if (data.content) {
          setLeaves(data.content);
        } else if (Array.isArray(data)) {
          setLeaves(data);
        } else {
          setLeaves([]);
        }
      } catch (error) {
        console.error("Failed to fetch leave requests", error);
      }
    };
    fetchLeaveRequests();
  }, []);

  // Load user balances from localStorage
  useEffect(() => {
    const s = loadLS(LS_KEYS.SESSION, null);
    setUser(s);

    const allBalances = loadLS(BAL_KEY, {});
    const key = s ? (s.username || s.email || s.id) : "guest";
    const userBal = allBalances[key] || { annual: 12, sick: 10, unpaid: 0 };
    setBalances(userBal);
  }, []);

  const submit = async () => {
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
    if (type !== "UNPAID_LEAVE") {
      // Map API leave type to balance key for checking
      const balanceKey = type === "ANNUAL_LEAVE" ? "annual" : type === "SICK_LEAVE" ? "sick" : "unpaid";
      const remaining = balances[balanceKey] ?? 0;
      if (diffDays > remaining) {
        alert(`Insufficient ${type.replace(/_/g, " ").toLowerCase()} balance (${remaining} days left).`);
        return;
      }
    }

    const payload = {
      leaveType: type,
      startDate,
      endDate,
      days: diffDays,
      reason,
      notes,
    };

    try {
      const response = await createLeaveRequest(payload);

      // deduct balance for non-unpaid leave
      if (type !== "UNPAID_LEAVE") {
        const s = loadLS(LS_KEYS.SESSION, null);
        const allBalances = loadLS(BAL_KEY, {});
        const key = s ? (s.username || s.email || s.id) : "guest";
        const userBal = allBalances[key] || { annual: 12, sick: 10, unpaid: 0 };
        // Map API leave type to balance key
        const balanceKey = type === "ANNUAL_LEAVE" ? "annual" : type === "SICK_LEAVE" ? "sick" : "unpaid";
        userBal[balanceKey] = (userBal[balanceKey] || 0) - diffDays;
        allBalances[key] = userBal;
        setBalances(userBal);
        saveLS(BAL_KEY, allBalances);
      }

      // Add the new leave request to the list
      setLeaves([response, ...leaves]);

      // reset form
      setType("ANNUAL_LEAVE");
      setStartDate("");
      setEndDate("");
      setReason("");
      setNotes("");

      alert("Leave request submitted successfully.");
    } catch (error) {
      console.error("Failed to submit leave request", error);
      alert("Failed to submit leave request. Please try again.");
    }
  };

  const handleStatusChange = async (leaveId, newStatus) => {
    try {
      if (newStatus === "APPROVED") {
        await approveLeaveRequest(leaveId);
      } else if (newStatus === "REJECTED") {
        await rejectLeaveRequest(leaveId);
      }

      // Refresh the leave requests list
      const data = await getLeaveRequests(0, 200);
      if (data.content) {
        setLeaves(data.content);
      } else if (Array.isArray(data)) {
        setLeaves(data);
      }

      alert(`Leave request ${newStatus.toLowerCase()} successfully.`);
    } catch (error) {
      console.error(`Failed to ${newStatus.toLowerCase()} leave request`, error);
      alert(`Failed to ${newStatus.toLowerCase()} leave request. Please try again.`);
    }
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
              <MenuItem value="ANNUAL_LEAVE">Annual Leave</MenuItem>
              <MenuItem value="SICK_LEAVE">Sick Leave</MenuItem>
              <MenuItem value="UNPAID_LEAVE">Unpaid Leave</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel
              shrink
              htmlFor="start-date-input"
              sx={{
                backgroundColor: '#fff',
                paddingX: '4px',
                marginLeft: '-4px',
              }}
            >
              Start Date *
            </InputLabel>
            <Box
              component="input"
              id="start-date-input"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              sx={{
                width: '100%',
                padding: '16.5px 14px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                border: '1px solid rgba(0, 0, 0, 0.23)',
                borderRadius: '4px',
                backgroundColor: '#fff',
                color: '#000',
                colorScheme: 'light',
                '&:hover': {
                  borderColor: 'rgba(0, 0, 0, 0.87)',
                },
                '&:focus': {
                  outline: 'none',
                  borderColor: '#1976d2',
                  borderWidth: '2px',
                },
                '&::-webkit-calendar-picker-indicator': {
                  cursor: 'pointer',
                },
              }}
            />
            <Typography variant="caption" sx={{ mt: 0.5, ml: 1.75, color: 'text.secondary' }}>
              Click to open calendar
            </Typography>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel
              shrink
              htmlFor="end-date-input"
              sx={{
                backgroundColor: '#fff',
                paddingX: '4px',
                marginLeft: '-4px',
              }}
            >
              End Date *
            </InputLabel>
            <Box
              component="input"
              id="end-date-input"
              type="date"
              required
              min={startDate || undefined}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              sx={{
                width: '100%',
                padding: '16.5px 14px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                border: '1px solid rgba(0, 0, 0, 0.23)',
                borderRadius: '4px',
                backgroundColor: '#fff',
                color: '#000',
                colorScheme: 'light',
                '&:hover': {
                  borderColor: 'rgba(0, 0, 0, 0.87)',
                },
                '&:focus': {
                  outline: 'none',
                  borderColor: '#1976d2',
                  borderWidth: '2px',
                },
                '&::-webkit-calendar-picker-indicator': {
                  cursor: 'pointer',
                },
              }}
            />
            <Typography variant="caption" sx={{ mt: 0.5, ml: 1.75, color: 'text.secondary' }}>
              Click to open calendar
            </Typography>
          </FormControl>
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
                  <td>{(l.leaveType || l.type || "-").replace(/_/g, " ")}</td>
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
