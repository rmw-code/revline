import { Stack, TextField, Typography } from "@mui/material";
import React from "react";

export default function BankingTab({ form, setForm }) {
  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2">Banking Details</Typography>
      <TextField
        label="Bank Name"
        value={form.contact?.bankName || ''}
        onChange={(e) => setForm({ ...form, contact: { ...(form.contact || {}), bankName: e.target.value } })}
        fullWidth
      />
      <TextField
        label="Bank Account Number"
        value={form.contact?.bankAccountNumber || ''}
        onChange={(e) => setForm({ ...form, contact: { ...(form.contact || {}), bankAccountNumber: e.target.value } })}
        fullWidth
      />
    </Stack>
  );
}
