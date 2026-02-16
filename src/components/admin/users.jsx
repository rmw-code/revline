import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PeopleIcon from "@mui/icons-material/People";
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import styles from "./admin.module.scss";
import { getUsers, createUser, updateUser, deleteUser } from "../../services/userServices";
import { ROLES } from "../../constants";
import { hasRole } from "../../utils";

export function Users({ roles }) {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    id: "",
    name: "",
    username: "",
    email: "",
    roles: [],
    password: "pass",
  });
  const canManageUsers = (roles) => hasRole(roles, "SUPERADMIN");

  const fetchUsers = async () => {
    try {
      const response = await getUsers(0, 100);
      setUsers(response.content || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setError("Failed to load users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (!canManageUsers(roles))
    return (
      <Typography color="text.secondary">
        Only superadmin can manage users.
      </Typography>
    );

  const reset = () => {
    setForm({
      id: "",
      name: "",
      username: "",
      email: "",
      roles: [],
      password: "pass",
    });
    setEditing(false);
    setError("");
  };
  const save = async () => {
    if (!form.name || !form.email) return;
    
    setLoading(true);
    setError("");
    
    try {
      if (editing) {
        await updateUser(form.id, form);
      } else {
        await createUser(form);
      }
      
      await fetchUsers();
      setOpen(false);
      reset();
    } catch (err) {
      console.error("Failed to save user:", err);
      setError(err.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };
  const edit = (u) => {
    // Handle both old format (role) and new format (roles)
    const userRoles = u.roles || (u.role ? [u.role] : []);
    setForm({ ...u, roles: userRoles });
    setEditing(true);
    setOpen(true);
  };
  const remove = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      await deleteUser(id);
      await fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
      setError(err.message || "Failed to delete user");
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
        <Typography variant="h6">User Management</Typography>
        <Button
          startIcon={<PeopleIcon />}
          variant="contained"
          onClick={() => { setEditing(false); setOpen(true); reset(); }}
        >
          {/* {editing ? "Edit User" : "Add User"} */}
          Add User
        </Button>
      </Box>

      <div className={styles.tableWrapper}>
        <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Username</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Roles</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id} hover>
              <TableCell>{u.name}</TableCell>
              <TableCell>{u.username}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>
                {(u.roles || [u.role]).map((role, idx) => (
                  <Chip 
                    key={idx} 
                    label={role} 
                    variant="outlined" 
                    size="small" 
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => edit(u)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => remove(u.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setError("");
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Name"
                fullWidth
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="roles-label">Roles</InputLabel>
                <Select
                  labelId="roles-label"
                  label="Roles"
                  multiple
                  displayEmpty
                  value={form.roles}
                  onChange={(e) => setForm({ ...form, roles: e.target.value })}
                  renderValue={(selected) => {
                    if (selected.length === 0) {
                      return <em>Select roles</em>;
                    }
                    return (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    );
                  }}
                >
                  {ROLES.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Password"
                fullWidth
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Grid>
          </Grid>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={loading}>
            {loading ? "Saving..." : editing ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
