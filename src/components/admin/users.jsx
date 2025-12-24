import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PeopleIcon from "@mui/icons-material/People";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
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
import { getUsers } from "../../services/userServices";
import { ROLES } from "../../constants";

export function Users({ role }) {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    id: "",
    name: "",
    username: "",
    email: "",
    role: "cashier",
    password: "pass",
  });
  const canManageUsers = (role) => role === "superadmin";

  useEffect(() => {
    // Fetch users from API on component mount
    const fetchUsers = async () => {
      try {
        const response = await getUsers(0, 100);
        setUsers(response.content || []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchUsers();
  }, []);

  if (!canManageUsers(role))
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
      role: "cashier",
      password: "pass",
    });
    setEditing(false);
  };
  const save = () => {
    if (!form.name || !form.email || !form.username) return;
    if (editing)
      setUsers((prev) => prev.map((u) => (u.id === form.id ? form : u)));
    else setUsers((prev) => [{ ...form, id: crypto.randomUUID() }, ...prev]);
    setOpen(false);
    reset();
  };
  const edit = (u) => {
    setForm(u);
    setEditing(true);
    setOpen(true);
  };
  const remove = (id) => setUsers((prev) => prev.filter((u) => u.id !== id));

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

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Username</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
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
                <Chip label={u.role} variant="outlined" size="small" />
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

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
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
              <Select
                fullWidth
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {ROLES.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>
            {editing ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
