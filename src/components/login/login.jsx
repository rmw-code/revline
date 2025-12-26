import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { loadLS, saveLS } from "../../utils";
import { LS_KEYS } from "../../enum";
import { DEFAULT_USERS } from "../../local";
import RMWLogo from "./../../assets/RMW.png";
import styles from "./login.module.scss";
import { login } from "../../services/authService";

export const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    /*
    const users = loadLS(LS_KEYS.USERS, DEFAULT_USERS);
    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) return setError("Invalid credentials");
    saveLS(LS_KEYS.SESSION, user);
    onLogin(user);
    */

    try {
      setError(""); // Clear previous errors
      const user = await login(username, password);
      saveLS(LS_KEYS.SESSION, user);
      onLogin(user);
    } catch (err) {
      setError(err.message || "Invalid credentials");
    }
  };

  return (
    <Container maxWidth="xs" sx={{ display: "grid", placeItems: "center" }} className={styles.loginCardContainer}>
      <Paper elevation={3} sx={{ p: 3, width: "100%" }}>
        <Stack className={styles.loginLogo}>
          <img
            src={RMWLogo}
            alt="RMW Logo"
            style={{ height: "auto", width: 180 }}
          />
        </Stack>
        <Stack sx={{ mb: "20px" }}>
          <Typography variant="body2" color="text.secondary">
            Sign in to continue
          </Typography>
        </Stack>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "grid", gap: 2 }}
        >
          <TextField
            label="Username"
            type="text"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <Alert severity="error" variant="outlined">
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            className={styles.loginButton}
          >
            Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};
