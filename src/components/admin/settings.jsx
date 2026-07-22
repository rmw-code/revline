import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { hasAnyRole } from "../../utils";
import {
  getMotorcycles,
  createMotorcycle,
  updateMotorcycle,
  deleteMotorcycle,
} from "../../services/motorcycleService";
import { loadLS } from "../../utils/loadLS";
import { saveLS } from "../../utils/saveLS";
import { LS_KEYS } from "../../enum/localStorageKeys";

const defaultForm = {
  name: "",
  description: "",
  brand: "",
  model: "",
  year: "",
  notes: "",
};

export function Settings({ roles }) {
  const canManage = hasAnyRole(roles, ["SUPERADMIN", "ADMIN"]);
  const [brands, setBrands] = useState([]);
  const [catalogTypes, setCatalogTypes] = useState([]);
  const [motorcycles, setMotorcycles] = useState([]);
  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("brand");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const [brandMenuAnchor, setBrandMenuAnchor] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [typeMenuAnchor, setTypeMenuAnchor] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [motoMenuAnchor, setMotoMenuAnchor] = useState(null);
  const [selectedMoto, setSelectedMoto] = useState(null);

  useEffect(() => {
    setBrands(loadLS(LS_KEYS.BRANDS, []));
    setCatalogTypes(loadLS(LS_KEYS.CATALOG_TYPES, []));
  }, []);

  useEffect(() => {
    saveLS(LS_KEYS.BRANDS, brands);
  }, [brands]);

  useEffect(() => {
    saveLS(LS_KEYS.CATALOG_TYPES, catalogTypes);
  }, [catalogTypes]);

  useEffect(() => {
    loadMotorcycles();
  }, []);

  const loadMotorcycles = async () => {
    try {
      const response = await getMotorcycles(0, 100);
      const list = response?.content || response || [];
      setMotorcycles(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed to fetch motorcycles:", error);
      setMotorcycles([]);
    }
  };

  const openDialog = (mode, item = null) => {
    setDialogMode(mode);
    setEditing(item);
    setError("");

    if (item) {
      if (mode === "brand" || mode === "type") {
        setForm({
          name: item.name || "",
          description: item.description || "",
          brand: "",
          model: "",
          year: "",
          notes: "",
        });
      } else {
        setForm({
          name: "",
          description: "",
          brand: item.brand || "",
          model: item.model || "",
          year: item.year ? String(item.year) : "",
          notes: item.notes || "",
        });
      }
    } else {
      setForm(defaultForm);
    }

    setOpen(true);
  };

  const handleSave = async () => {
    if (dialogMode === "brand") {
      if (!form.name.trim()) {
        setError("Brand name is required.");
        return;
      }
      const next = editing
        ? brands.map((item) =>
            item.id === editing.id
              ? {
                  ...item,
                  name: form.name.trim(),
                  description: form.description.trim(),
                }
              : item,
          )
        : [
            ...brands,
            {
              id: Date.now().toString(),
              name: form.name.trim(),
              description: form.description.trim(),
            },
          ];
      setBrands(next);
      setOpen(false);
      return;
    }

    if (dialogMode === "type") {
      if (!form.name.trim()) {
        setError("Catalog type name is required.");
        return;
      }
      const next = editing
        ? catalogTypes.map((item) =>
            item.id === editing.id
              ? {
                  ...item,
                  name: form.name.trim(),
                  description: form.description.trim(),
                }
              : item,
          )
        : [
            ...catalogTypes,
            {
              id: Date.now().toString(),
              name: form.name.trim(),
              description: form.description.trim(),
            },
          ];
      setCatalogTypes(next);
      setOpen(false);
      return;
    }

    if (dialogMode === "motorcycle") {
      if (!form.brand.trim() || !form.model.trim()) {
        setError("Brand and model are required.");
        return;
      }

      const payload = {
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: form.year ? Number(form.year) : undefined,
        notes: form.notes.trim() || undefined,
      };

      try {
        if (editing) {
          await updateMotorcycle(editing.id, payload);
        } else {
          await createMotorcycle(payload);
        }
        await loadMotorcycles();
        setOpen(false);
      } catch (error) {
        console.error("Failed to save motorcycle:", error);
        setError("Unable to save motorcycle. Please try again.");
      }
    }
  };

  const handleDelete = async (mode, item) => {
    if (mode === "brand") {
      setBrands(brands.filter((entry) => entry.id !== item.id));
      return;
    }
    if (mode === "type") {
      setCatalogTypes(catalogTypes.filter((entry) => entry.id !== item.id));
      return;
    }
    if (mode === "motorcycle") {
      try {
        await deleteMotorcycle(item.id);
        await loadMotorcycles();
      } catch (error) {
        console.error("Failed to delete motorcycle:", error);
      }
    }
  };

  const dialogTitle =
    dialogMode === "brand"
      ? editing
        ? "Edit Brand"
        : "Add Brand"
      : dialogMode === "type"
        ? editing
          ? "Edit Catalog Type"
          : "Add Catalog Type"
        : editing
          ? "Edit Motorcycle"
          : "Add Motorcycle";

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Dictionary Settings
      </Typography>
      <Typography color="text.secondary" paragraph>
        Manage brands, catalog types, and motorcycles from one page. New catalog
        types are stored locally and can be used in the catalog dropdown.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Brands</Typography>
              {canManage && (
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  variant="contained"
                  onClick={() => openDialog("brand")}
                >
                  Add
                </Button>
              )}
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  {canManage && <TableCell align="center" sx={{ width: 50 }}>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {brands.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canManage ? 3 : 2} align="center">
                      No brands added.
                    </TableCell>
                  </TableRow>
                )}
                {brands.map((brand) => (
                  <TableRow key={brand.id} hover>
                    <TableCell>{brand.name}</TableCell>
                    <TableCell>{brand.description || "-"}</TableCell>
                    {canManage && (
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setBrandMenuAnchor(e.currentTarget);
                            setSelectedBrand(brand);
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Catalog Types</Typography>
              {canManage && (
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  variant="contained"
                  onClick={() => openDialog("type")}
                >
                  Add
                </Button>
              )}
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  {canManage && <TableCell align="center" sx={{ width: 50 }}>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {catalogTypes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canManage ? 3 : 2} align="center">
                      No catalog types added.
                    </TableCell>
                  </TableRow>
                )}
                {catalogTypes.map((type) => (
                  <TableRow key={type.id} hover>
                    <TableCell>{type.name}</TableCell>
                    <TableCell>{type.description || "-"}</TableCell>
                    {canManage && (
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setTypeMenuAnchor(e.currentTarget);
                            setSelectedType(type);
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Motorcycles</Typography>
              {canManage && (
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  variant="contained"
                  onClick={() => openDialog("motorcycle")}
                >
                  Add
                </Button>
              )}
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Brand</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Year</TableCell>
                  {canManage && <TableCell align="center" sx={{ width: 50 }}>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {motorcycles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canManage ? 4 : 3} align="center">
                      No motorcycles loaded.
                    </TableCell>
                  </TableRow>
                )}
                {motorcycles.map((mc) => (
                  <TableRow
                    key={mc.id || `${mc.brand}-${mc.model}-${mc.year}`}
                    hover
                  >
                    <TableCell>{mc.brand || "-"}</TableCell>
                    <TableCell>{mc.model || "-"}</TableCell>
                    <TableCell>{mc.year || "-"}</TableCell>
                    {canManage && (
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setMotoMenuAnchor(e.currentTarget);
                            setSelectedMoto(mc);
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>

      {/* Brands Menu */}
      <Menu
        anchorEl={brandMenuAnchor}
        open={Boolean(brandMenuAnchor)}
        onClose={() => {
          setBrandMenuAnchor(null);
          setSelectedBrand(null);
        }}
      >
        <MenuItem
          onClick={() => {
            openDialog("brand", selectedBrand);
            setBrandMenuAnchor(null);
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleDelete("brand", selectedBrand);
            setBrandMenuAnchor(null);
          }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Catalog Types Menu */}
      <Menu
        anchorEl={typeMenuAnchor}
        open={Boolean(typeMenuAnchor)}
        onClose={() => {
          setTypeMenuAnchor(null);
          setSelectedType(null);
        }}
      >
        <MenuItem
          onClick={() => {
            openDialog("type", selectedType);
            setTypeMenuAnchor(null);
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleDelete("type", selectedType);
            setTypeMenuAnchor(null);
          }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Motorcycles Menu */}
      <Menu
        anchorEl={motoMenuAnchor}
        open={Boolean(motoMenuAnchor)}
        onClose={() => {
          setMotoMenuAnchor(null);
          setSelectedMoto(null);
        }}
      >
        <MenuItem
          onClick={() => {
            openDialog("motorcycle", selectedMoto);
            setMotoMenuAnchor(null);
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleDelete("motorcycle", selectedMoto);
            setMotoMenuAnchor(null);
          }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent dividers>
          <Stack flexDirection="column" spacing={2}>
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
            {(dialogMode === "brand" || dialogMode === "type") && (
              <>
                <TextField
                  label={dialogMode === "brand" ? "Brand Name" : "Catalog Type"}
                  fullWidth
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  minRows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </>
            )}
            {dialogMode === "motorcycle" && (
              <>
                <TextField
                  label="Brand"
                  fullWidth
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
                <TextField
                  label="Model"
                  fullWidth
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
                <TextField
                  label="Year of Manufacture"
                  type="number"
                  fullWidth
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
                <TextField
                  label="Details"
                  fullWidth
                  multiline
                  minRows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editing ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
