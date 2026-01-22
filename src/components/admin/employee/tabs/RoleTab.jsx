import { Stack, TextField, Typography } from "@mui/material";
import React from "react";

export default function RoleTab({ form, setForm, editing }) {
  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2">Role / Position</Typography>
      <TextField
        label="Position"
        value={form.position || ''}
        onChange={(e) => setForm({ ...form, position: e.target.value })}
        fullWidth
      />
      <TextField
        label="Current Role"
        value={editing ? (editing.role || '') : ''}
        fullWidth
        InputProps={{ readOnly: true }}
      />
    </Stack>
  );
}
