import { Stack, TextField, Typography } from "@mui/material";
import React from "react";

export default function PersonalTab({ form, setForm }) {
  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2">Personal Information</Typography>
      <TextField
        label="Full Name"
        value={form.contact?.fullName || ''}
        onChange={(e) => setForm({ ...form, contact: { ...(form.contact || {}), fullName: e.target.value } })}
        fullWidth
      />
      <TextField
        label="Email"
        type="email"
        value={form.contact?.email || ''}
        onChange={(e) => setForm({ ...form, contact: { ...(form.contact || {}), email: e.target.value } })}
        fullWidth
      />
      <TextField
        label="Nickname"
        value={form.contact?.nickname || ''}
        onChange={(e) => setForm({ ...form, contact: { ...(form.contact || {}), nickname: e.target.value } })}
        fullWidth
      />
      <TextField
        label="Alternate Email"
        type="email"
        value={form.contact?.altEmail || ''}
        onChange={(e) => setForm({ ...form, contact: { ...(form.contact || {}), altEmail: e.target.value } })}
        fullWidth
      />
      <TextField
        label="IC Number"
        value={form.contact?.icNumber || ''}
        onChange={(e) => setForm({ ...form, contact: { ...(form.contact || {}), icNumber: e.target.value } })}
        fullWidth
      />
      <TextField
        label="Birth Date"
        type="date"
        value={form.contact?.birthDate || ''}
        onChange={(e) => setForm({ ...form, contact: { ...(form.contact || {}), birthDate: e.target.value } })}
        InputLabelProps={{ shrink: true }}
        sx={{ maxWidth: 240 }}
      />

      <Typography variant="subtitle2">Contact</Typography>
      <TextField
        label="Address"
        value={form.contact?.address || ''}
        onChange={(e) => setForm({ ...form, contact: { ...(form.contact || {}), address: e.target.value } })}
        fullWidth
      />
      <TextField
        label="Phone"
        value={form.contact?.phone || ''}
        onChange={(e) => setForm({ ...form, contact: { ...(form.contact || {}), phone: e.target.value } })}
        fullWidth
      />
      <TextField
        label="Emergency Contact Name"
        value={form.contact?.emergencyContactName || ''}
        onChange={(e) => setForm({ ...form, contact: { ...(form.contact || {}), emergencyContactName: e.target.value } })}
        fullWidth
      />
      <TextField
        label="Emergency Contact No"
        value={form.contact?.emergencyContactNo || ''}
        onChange={(e) => setForm({ ...form, contact: { ...(form.contact || {}), emergencyContactNo: e.target.value } })}
        fullWidth
      />
    </Stack>
  );
}
