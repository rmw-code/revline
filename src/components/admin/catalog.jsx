import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
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
import { getServices, updateService, createService, deleteService } from "../../services/serviceService";
import { LS_KEYS } from "../../enum";
import { DEFAULT_SERVICES } from "../../local";
import { loadLS, saveLS } from "../../utils";

const canManageServices = (role) => role === "superadmin" || role === "admin";

export function Catalog({ role }) {
  /*
  const [services, setServices] = useState(
    loadLS(LS_KEYS.SERVICES, DEFAULT_SERVICES)
  );
  */
  const [services, setServices] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    id: "",
    name: "",
    price: 0,
    details: "",
  });

  /*
  useEffect(() => saveLS(LS_KEYS.SERVICES, services), [services]);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const byQ = q
        ? s.name.toLowerCase().includes(q.toLowerCase()) ||
          s.details.toLowerCase().includes(q.toLowerCase())
        : true;
      return byQ;
    });
  }, [services, q]);
  */

  // New API Integration
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getServices(q, 0, 100);
        // Assuming response is Page<Service> or List<Service>. 
        // If it's a Page object (content, totalElements, etc.), we extract content.
        // Adjust based on typical Spring Boot Page response or the actual return.
        // The prompt says "response contain 'token'..." for login, but here "retrieve all services".
        // I'll assume it returns the list or an object with 'content'.
        // For safety, checks if data.content exists (pagination) or data itself is array.
        if (data.content) {
          setServices(data.content);
        } else if (Array.isArray(data)) {
          setServices(data);
        } else {
          setServices([]);
        }
      } catch (error) {
        console.error("Failed to fetch services", error);
      }
    };
    fetchServices();
  }, [q]);

  const filtered = services; // Backend handles filtering

  const resetForm = () => {
    setForm({
      id: "",
      name: "",
      price: 0,
      details: "",
    });
    setEditing(false);
  };

  const openAdd = () => {
    resetForm();
    setOpen(true);
  };

  // Centralized function to refresh services list
  const refreshServices = async () => {
    try {
      const data = await getServices(q, 0, 100);
      if (data.content) {
        setServices(data.content);
      } else if (Array.isArray(data)) {
        setServices(data);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error("Failed to refresh services", error);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;

    try {
      if (editing) {
        await updateService(form.id, {
          name: form.name,
          price: Number(form.price),
          details: form.details,
        });
      } else {
        await createService({
          name: form.name,
          price: Number(form.price),
          details: form.details,
        });
      }

      await refreshServices();
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save service", error);
    }
  };

  const handleEdit = (s) => {
    setForm(s);
    setEditing(true);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteService(id);
      await refreshServices();
    } catch (error) {
      console.error("Failed to delete service", error);
    }
  };

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
        <Grid xs={12} md={6}>
          <TextField
            fullWidth
            label="Search services or details"
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
              <TableCell
                title={s.details}
                style={{
                  maxWidth: 320,
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                {s.details}
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
            </Stack>
            <Stack>
              <TextField
                label="Details"
                fullWidth
                value={form.details}
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
