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
} from "@mui/material";
import styles from "./employee.module.scss";
import { createLeaveRequest, getLeaveRequests } from "../../services/leaveService";

export function Leave() {
  const [type, setType] = useState("ANNUAL_LEAVE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [leaves, setLeaves] = useState([]);

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

  const submit = async () => {
    if (!startDate || !endDate) {
      alert("Please provide both start and end dates for your leave.");
      return;
    }

    const payload = {
      leaveType: type,
      startDate,
      endDate,
      reason,
      notes,
    };

    try {
      const response = await createLeaveRequest(payload);

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

      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
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
                  <td>{(l.leaveType || "-").replace(/_/g, " ")}</td>
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
