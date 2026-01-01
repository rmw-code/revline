import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
} from "@mui/material";
import styles from "./admin.module.scss";
import { loadLS, saveLS } from "../../utils";
import { getPendingLeaveRequests, approveLeaveRequest, rejectLeaveRequest } from "../../services/leaveService";
import { getAttendanceRecords } from "../../services/attendanceService";

const ATT_KEY = "bs_attendance";
const LEAVE_KEY = "bs_leaves";

// Simple helper to create demo attendance if none exists
function sampleAttendance() {
  const today = new Date();
  const dateStr = (d) => d.toISOString().slice(0, 10);
  return [
    { id: 1, employee: "Alice", date: dateStr(today), checkIn: "09:02", checkOut: "17:15", hours: 8.2 },
    { id: 2, employee: "Bob", date: dateStr(today), checkIn: "09:10", checkOut: "17:00", hours: 7.8 },
    { id: 3, employee: "Charlie", date: dateStr(new Date(today.getTime() - 86400000)), checkIn: "09:00", checkOut: "16:45", hours: 7.75 },
  ];
}

export function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [filter, setFilter] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch attendance records from API
    fetchAttendanceRecords();
    // Fetch pending leave requests from API
    fetchPendingLeaves();
  }, []);

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAttendanceRecords(0, 300, "date,desc");
      // The API returns data in response.content (Spring Boot pagination format)
      const attendanceData = response.content || [];

      // Transform API data to match component format
      const transformedData = attendanceData.map(record => ({
        id: record.id,
        employee: record.userName,
        email: record.userEmail,
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        hours: record.hours,
        notes: record.notes,
        userId: record.userId
      }));

      setAttendance(transformedData);
    } catch (err) {
      console.error("Error fetching attendance records:", err);
      setError("Failed to load attendance records");
      // Fallback to localStorage if API fails
      const a = loadLS(ATT_KEY, null);
      if (!a || !Array.isArray(a) || a.length === 0) {
        const sample = sampleAttendance();
        setAttendance(sample);
        saveLS(ATT_KEY, sample);
      } else {
        setAttendance(a);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingLeaves = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPendingLeaveRequests(0, 10);
      // Assuming the API returns data in response.content (Spring Boot pagination format)
      setLeaves(response.content || response || []);
    } catch (err) {
      console.error("Error fetching pending leave requests:", err);
      setError("Failed to load leave requests");
      // Fallback to localStorage if API fails
      const ls = loadLS(LEAVE_KEY, []);
      setLeaves(ls || []);
    } finally {
      setLoading(false);
    }
  };

  const filtered = attendance.filter((r) =>
    filter ? r.employee.toLowerCase().includes(filter.toLowerCase()) : true
  );

  const updateLeaveStatus = async (id, action) => {
    try {
      setLoading(true);
      setError(null);

      if (action === "APPROVED") {
        await approveLeaveRequest(id);
      } else if (action === "DENIED") {
        await rejectLeaveRequest(id);
      }

      // Refresh the list after successful update
      await fetchPendingLeaves();
    } catch (err) {
      console.error("Error updating leave status:", err);
      setError("Failed to update leave request");
      // Fallback to localStorage update if API fails
      const next = leaves.map((l) => (l.id === id ? { ...l, status: action } : l));
      setLeaves(next);
      saveLS(LEAVE_KEY, next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box width="100%">
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }} className={styles.catalogContainer}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Attendance</Typography>
        </Box>

        {error && (
          <Box sx={{ mb: 2, p: 1, bgcolor: "error.light", color: "error.contrastText", borderRadius: 1 }}>
            {error}
          </Box>
        )}

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
          <TextField label="Filter by employee" value={filter} onChange={(e) => setFilter(e.target.value)} fullWidth />
        </Stack>

        <div className={styles.tableWrapper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Employee</TableCell>
                <TableCell>Check In</TableCell>
                <TableCell>Check Out</TableCell>
                <TableCell>Hours</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.employee}</TableCell>
                  <TableCell>{r.checkIn}</TableCell>
                  <TableCell>{r.checkOut}</TableCell>
                  <TableCell>{r.hours}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    {loading ? "Loading attendance records..." : "No attendance records."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }} className={styles.catalogContainer}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Manage Leave Applications</Typography>
        </Box>

        {error && (
          <Box sx={{ mb: 2, p: 1, bgcolor: "error.light", color: "error.contrastText", borderRadius: 1 }}>
            {error}
          </Box>
        )}

        <div className={styles.tableWrapper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Applicant</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaves.map((l) => (
                <TableRow key={l.id} hover>
                  <TableCell>{l.name || l.employeeName || "—"}</TableCell>
                  <TableCell>{(l.leaveType || l.type || "").toUpperCase()}</TableCell>
                  <TableCell>{l.startDate}</TableCell>
                  <TableCell>{l.endDate}</TableCell>
                  <TableCell title={l.reason} style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.reason}</TableCell>
                  <TableCell>
                    <Chip label={l.status || "PENDING"} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    {l.status === "PENDING" ? (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          sx={{ mr: 1 }}
                          onClick={() => updateLeaveStatus(l.id, "APPROVED")}
                          disabled={loading}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => updateLeaveStatus(l.id, "DENIED")}
                          disabled={loading}
                        >
                          Deny
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => updateLeaveStatus(l.id, "PENDING")}
                        disabled={loading}
                      >
                        Revert
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {leaves.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    {loading ? "Loading leave applications..." : "No pending leave applications."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Paper>
    </Box>
  );
}

export default Attendance;
