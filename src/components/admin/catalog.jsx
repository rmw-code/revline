import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { getMotorcycles } from "../../services/motorcycleService";
import {
  createService,
  deleteService,
  getServices,
  updateService,
} from "../../services/serviceService";
import { getServiceTypes } from "../../services/serviceTypesService";
import { hasAnyRole } from "../../utils";
import styles from "./admin.module.scss";

const canManageServices = (roles) => hasAnyRole(roles, ["SUPERADMIN", "ADMIN"]);

// Helper function to format motorcycle list
const formatMotorcycleList = (motorcycleList) => {
  if (!motorcycleList || motorcycleList.length === 0) {
    return "-";
  }
  return motorcycleList.map((bike) => `${bike.brand} ${bike.model}`).join(", ");
};

export function Catalog({ roles }) {
  /*
  const [services, setServices] = useState(
    loadLS(LS_KEYS.SERVICES, DEFAULT_SERVICES)
  );
  */
  const [services, setServices] = useState([]);
  const [bikeList, setBikeList] = useState([]);
  const [motorcycleObjects, setMotorcycleObjects] = useState([]); // Full objects with IDs
  const [itemTypeList, setItemTypeList] = useState([]); // Array of type names for display
  const [serviceTypeObjects, setServiceTypeObjects] = useState([]); // Full objects with IDs
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    id: "",
    name: "",
    price: 0,
    details: "",
    // keep quantity in state for backwards compatibility but removed from dialog
    quantity: 0,
    allowMultiple: false,
    bike: [],
    type: "",
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

  // Fetch motorcycles on component mount
  useEffect(() => {
    const fetchMotorcycles = async () => {
      try {
        const data = await getMotorcycles(0, 5000);
        if (data.content) {
          setMotorcycleObjects(data.content);
          const bikes = data.content.map(
            (bike) => `${bike.brand} ${bike.model}`,
          );
          setBikeList(bikes);
        } else if (Array.isArray(data)) {
          setMotorcycleObjects(data);
          const bikes = data.map((bike) => `${bike.brand} ${bike.model}`);
          setBikeList(bikes);
        }
      } catch (error) {
        console.error("Failed to fetch motorcycles", error);
      }
    };
    fetchMotorcycles();
  }, []);

  // Fetch service types on component mount
  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const data = await getServiceTypes();
        if (Array.isArray(data)) {
          setServiceTypeObjects(data);
          const types = data.map((type) => type.name);
          setItemTypeList(types);
        }
      } catch (error) {
        console.error("Failed to fetch service types", error);
      }
    };
    fetchServiceTypes();
  }, []);

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
      quantity: 0,
      allowMultiple: false,
      bike: [],
      type: "",
    });
    setEditing(false);
  };

  const openAdd = () => {
    resetForm();
    setOpen(true);
  };

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

    // Get service type ID from the selected type name
    const serviceType = serviceTypeObjects.find((st) => st.name === form.type);
    const serviceTypeId = serviceType ? serviceType.id : null;

    // Get motorcycle IDs from selected bike strings (defensive: handle different shapes)
    const bikeArr = Array.isArray(form.bike) ? form.bike : [];
    const motorcycleIds = bikeArr
      .map((bikeStr) => {
        const motorcycle = motorcycleObjects.find(
          (m) => `${m.brand} ${m.model}` === bikeStr,
        );
        return motorcycle ? motorcycle.id : null;
      })
      .filter((id) => id !== null);

    try {
      if (editing) {
        await updateService(form.id, {
          name: form.name,
          price: Number(form.price),
          details: form.details,
          // keep quantity for backend compatibility and also send allowMultiple
          quantity: Number(form.quantity) || 0,
          allowMultiple: !!form.allowMultiple,
          serviceTypeId: serviceTypeId,
          motorcycleIds: motorcycleIds,
          motorcycleList: motorcycleIds
            .map((id) => {
              const motorcycle = motorcycleObjects.find((m) => m.id === id);
              return motorcycle
                ? {
                    id: motorcycle.id,
                    brand: motorcycle.brand,
                    model: motorcycle.model,
                  }
                : null;
            })
            .filter((m) => m !== null),
        });
      } else {
        await createService({
          name: form.name,
          price: Number(form.price),
          details: form.details,
          quantity: Number(form.quantity) || 0,
          allowMultiple: !!form.allowMultiple,
          serviceTypeId: serviceTypeId,
          motorcycleIds: motorcycleIds,
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
    // Normalize incoming service object into the dialog form shape
    const bikeSelection =
      s.bike ??
      (s.motorcycleList
        ? s.motorcycleList.map((m) => `${m.brand} ${m.model}`)
        : []);

    console.log(bikeSelection, "bikeSelection");
    setForm({
      id: s.id ?? "",
      name: s.name ?? "",
      price: s.price ?? 0,
      details: s.details ?? "",
      quantity: s.quantity ?? 0,
      allowMultiple: !!s.allowMultiple,
      bike: bikeSelection,
      type: s.serviceTypeName ?? s.type ?? "",
    });
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
    <Paper variant="outlined" sx={{ p: 2 }} className={styles.catalogContainer}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Services & Parts Catalog</Typography>
        {canManageServices(roles) && (
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={openAdd}
            sx={{ backgroundColor: "#18006a" }}
          >
            New Service Or Part
          </Button>
        )}
      </Box>

      <Grid spacing={2} sx={{ mb: 2 }}>
        <Grid xs={12} md={12}>
          <TextField
            label="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            variant="outlined"
            sx={{
              width: { xs: "100%", md: "100%" },
              // minWidth: { md: '50%' },
              "& .MuiInputBase-input": {
                fontSize: "1rem",
                padding: "12px 14px",
              },
              "& .MuiInputLabel-root": { fontSize: "0.95rem" },
            }}
          />
        </Grid>
      </Grid>

      <div className={styles.tableWrapper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Service</TableCell>
              <TableCell>Part Number</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Qty</TableCell>
              <TableCell>Bike</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Details</TableCell>
              {canManageServices(roles) && (
                <TableCell align="right">Actions</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>RM{s.price.toFixed(2)}</TableCell>
                <TableCell>{s.allowMultiple ? s.quantity : "-"}</TableCell>
                <TableCell
                  title={formatMotorcycleList(s.motorcycleList)}
                  style={{
                    maxWidth: 200,
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                  }}
                >
                  {formatMotorcycleList(s.motorcycleList)}
                </TableCell>
                <TableCell>{s.serviceTypeName || "-"}</TableCell>
                <TableCell
                  title={s.details || "-"}
                  style={{
                    maxWidth: 320,
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                  }}
                >
                  {s.details && s.details.trim() ? s.details : "-"}
                </TableCell>
                {canManageServices(roles) && (
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
                  colSpan={canManageServices(roles) ? 7 : 6}
                  align="center"
                  sx={{ py: 6, color: "text.secondary" }}
                >
                  No services match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
              <Autocomplete
                fullWidth
                options={itemTypeList}
                value={form?.type || null}
                onChange={(event, newValue) => {
                  setForm({ ...form, type: newValue || "" });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Type"
                    placeholder="Select type"
                  />
                )}
                isOptionEqualToValue={(option, value) => option === value}
              />
            </Stack>
            <Stack flexDirection={"row"} columnGap={2}>
              <Autocomplete
                multiple
                fullWidth
                options={bikeList}
                value={form.bike ?? []}
                onChange={(event, newValue) => {
                  setForm({ ...form, bike: newValue });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Bike"
                    placeholder="Select bikes"
                  />
                )}
                isOptionEqualToValue={(option, value) => option === value}
              />

              <TextField
                label="Part Number"
                fullWidth
                disabled={form.type !== "Parts" && form.type !== "Used Parts"} // Enable only when type is "Parts" or "Used Parts"
                value={form.partNumber || ""}
                onChange={(e) =>
                  setForm({ ...form, partNumber: e.target.value })
                }
              />
            </Stack>
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

            <Stack>
              <TextField
                label="Details"
                fullWidth
                value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
              />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2}>
              {/* Checkbox: possible to have more than one */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!form.allowMultiple}
                    onChange={(e) =>
                      setForm({ ...form, allowMultiple: e.target.checked })
                    }
                  />
                }
                label="Possible to have more than one"
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
