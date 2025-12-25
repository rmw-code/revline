import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { bikeList } from "../../data/bikesList";
import { LS_KEYS } from "../../enum";
import { DEFAULT_SERVICES } from "../../local";
import { loadLS, saveLS } from "../../utils";
import { itemTypeList } from "../../data/itemTypeList";

const canManageServices = (role) => role === "superadmin" || role === "admin";

export function Catalog({ role }) {
  const [services, setServices] = useState(
    loadLS(LS_KEYS.SERVICES, DEFAULT_SERVICES)
  );
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    id: "",
    name: "",
    price: 0,
    quantity: 0,
    bike: [],
    type: "",
    details: "",
  });

  useEffect(() => saveLS(LS_KEYS.SERVICES, services), [services]);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const byQ = q
        ? s.name?.toLowerCase().includes(q.toLowerCase()) ||
          s.details?.toLowerCase().includes(q.toLowerCase()) ||
          (Array.isArray(s.bike)
            ? s.bike.join(", ").toLowerCase().includes(q.toLowerCase())
            : s.bike?.toLowerCase().includes(q.toLowerCase()))
        : true;
      return byQ;
    });
  }, [services, q]);

  const resetForm = () => {
    setForm({
      id: "",
      name: "",
      price: 0,
      quantity: 0,
      bike: [],
      type: "",
      details: "",
    });
    setEditing(false);
  };

  const openAdd = () => {
    resetForm();
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editing) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === form.id
            ? {
                ...form,
                price: Number(form.price),
              }
            : s
        )
      );
    } else {
      setServices((prev) => [
        {
          ...form,
          id: crypto.randomUUID(),
          price: Number(form.price),
        },
        ...prev,
      ]);
    }
    setOpen(false);
    resetForm();
  };

  const handleEdit = (s) => {
    setForm({
      id: s.id || "",
      name: s.name || "",
      price: s.price ?? 0,
      quantity: s.quantity ?? 0,
      bike: Array.isArray(s.bike) ? s.bike : s.bike ? [s.bike] : [],
      type: s.type || "",
      details: s.details || "",
    });
    setEditing(true);
    setOpen(true);
  };

  const handleDelete = (id) =>
    setServices((prev) => prev.filter((s) => s.id !== id));

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Service Catalog</Typography>
        {canManageServices(role) && (
          <Button startIcon={<AddIcon />} variant="contained" onClick={openAdd}>
            New Service
          </Button>
        )}
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid>
          <TextField
            fullWidth
            label="Search by services | bike | details"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </Grid>
      </Grid>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Service</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Qty</TableCell>
            <TableCell>Bike</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Details</TableCell>
            {canManageServices(role) && (
              <TableCell align="right">Actions</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map((s) => (
            <TableRow key={s.id} hover>
              <TableCell>{s.name}</TableCell>
              <TableCell>RM{s.price.toFixed(2)}</TableCell>
              <TableCell>{s.quantity > 0 ? s.quantity : "-"}</TableCell>
              <TableCell
                title={s.bike}
                style={{
                  maxWidth: 140,
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                {Array.isArray(s.bike) ? s.bike.join(", ") : s.bike}
              </TableCell>
              <TableCell>{s.type}</TableCell>
              <TableCell
                title={s.details}
                style={{
                  maxWidth: 80,
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                {s.details ? s.details : "-"}
              </TableCell>
              {canManageServices(role) && (
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleEdit(s)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(s.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={canManageServices(role) ? 7 : 6}
                align="center"
                sx={{ py: 6, color: "text.secondary" }}
              >
                No services match your filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editing ? "Edit Service" : "Add Service"}</DialogTitle>
        <DialogContent dividers>
          <Stack flexDirection={"column"} spacing={2}>
            <Stack>
              <TextField
                label="Name"
                fullWidth
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Stack>
            <Stack flexDirection={"row"} columnGap={2}>
              <TextField
                label="Price"
                fullWidth
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
              />
              <TextField
                label="Quantity"
                type="number"
                fullWidth
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: Number(e.target.value) })
                }
              />
            </Stack>
            <Stack flexDirection={"row"} columnGap={2}>
              <FormControl fullWidth>
                <InputLabel>Bike</InputLabel>
                <Select
                  multiple
                  value={form.bike ?? []}
                  onChange={(e) => setForm({ ...form, bike: e.target.value })}
                  input={<OutlinedInput label="Bike" />}
                  renderValue={(selected) =>
                    selected.length === 0 ? "Select bikes" : selected.join(", ")
                  }
                >
                  {bikeList.map((b) => (
                    <MenuItem key={b} value={b}>
                      <Checkbox checked={form.bike.includes(b)} />
                      <ListItemText primary={b} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                select
                label="Type"
                fullWidth
                value={form?.type || ""}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {itemTypeList.map((b) => (
                  <MenuItem key={b} value={b}>
                    {b}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack>
              <TextField
                label="Details"
                fullWidth
                value={form.details ?? ""}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editing ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
