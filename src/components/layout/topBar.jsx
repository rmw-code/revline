import { AppBar, Button, Chip, Stack, Toolbar } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import MonitorIcon from "@mui/icons-material/Monitor";
import RMWLogo from "./../../assets/RMW-transparent.png";
import styles from "./topBar.module.scss";

export function TopBar({ user, onLogout, onOpenDisplay }) {
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      <Toolbar className={styles.topBarMain}>
        <Stack>
          <img src={RMWLogo} alt="RMW Logo" style={{ height: 50 }} />
        </Stack>
        <Stack flexDirection={'row'} alignItems={'center'}>
          <Chip
            label={user.role}
            variant="outlined"
            size="small"
            sx={{ mr: 1 }}
          />
          <Button
            startIcon={<MonitorIcon />}
            variant="outlined"
            onClick={onOpenDisplay}
            sx={{ mr: 1 }}
          >
            Customer Display
          </Button>
          <Button startIcon={<LogoutIcon />} onClick={onLogout}>
            Logout
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
