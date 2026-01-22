import { Stack, TextField, Typography } from "@mui/material";
import React from "react";

export default function LeavesTab({ form, setForm }) {
  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2">Leave Balances</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <TextField
          label="Annual"
          type="number"
          value={form.leaveBalances?.annual ?? 0}
          onChange={(e) => setForm({ ...form, leaveBalances: { ...(form.leaveBalances || {}), annual: Number(e.target.value) } })}
          sx={{ width: 140 }}
        />
        <TextField
          label="Sick"
          type="number"
          value={form.leaveBalances?.sick ?? 0}
          onChange={(e) => setForm({ ...form, leaveBalances: { ...(form.leaveBalances || {}), sick: Number(e.target.value) } })}
          sx={{ width: 140 }}
        />
        <TextField
          label="Unpaid"
          type="number"
          value={form.leaveBalances?.unpaid ?? 0}
          onChange={(e) => setForm({ ...form, leaveBalances: { ...(form.leaveBalances || {}), unpaid: Number(e.target.value) } })}
          sx={{ width: 140 }}
        />
      </Stack>
    </Stack>
  );
}
