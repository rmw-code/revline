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
import { loadLS, saveLS } from "../../utils";

const STORAGE_KEY = "bs_leaves";

export function Leave() {
  const [type, setType] = useState("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    const existing = loadLS(STORAGE_KEY, []);
    setLeaves(existing || []);
  }, []);

  const submit = () => {
    if (!startDate || !endDate) {
      alert("Please provide both start and end dates for your leave.");
      return;
    }

    const payload = {
      id: Date.now(),
      type,
      startDate,
      endDate,
      reason,
      notes,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    const next = [payload, ...leaves];
    setLeaves(next);
    saveLS(STORAGE_KEY, next);

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
          />

          <TextField
            label="End Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
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
