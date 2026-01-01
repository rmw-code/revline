import { AppBar, Button, Chip, Stack, Toolbar, IconButton, Menu, MenuItem, ListItemIcon } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import MonitorIcon from "@mui/icons-material/Monitor";
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import RMWLogo from "./../../assets/RMW-transparent.png";
import styles from "./topBar.module.scss";
import { useState } from "react";

export function TopBar({ user, onLogout, onOpenDisplay }) {
  const [menuAnchor, setMenuAnchor] = useState(null);

  const handleMenuOpen = (event) => setMenuAnchor(event.currentTarget);
  const handleMenuClose = () => setMenuAnchor(null);
  const handleLogout = () => {
    handleMenuClose();
    if (onLogout) onLogout();
  };

  const username = user?.name || user?.username || user?.email || "User";

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
        <Stack className={styles.topBarActions} flexDirection={'row'} alignItems={'center'}>
          <Chip
            label={user.role}
            variant="outlined"
            size="small"
            sx={{ mr: 1 }}
          />

          <Button
            startIcon={<MonitorIcon />}
            size="small"
            className={styles.displayButton}
            variant="outlined"
            onClick={onOpenDisplay}
            sx={{ mr: 1 }}
            title="Open customer display"
            aria-label="Open customer display"
          >
            Customer Display
          </Button>

          {/* Hamburger menu containing username and logout */}
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleMenuOpen}
            aria-controls={menuAnchor ? 'topbar-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={menuAnchor ? 'true' : undefined}
            size="large"
          >
            <MenuIcon />
          </IconButton>

          <Menu
            id="topbar-menu"
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              {username}
            </MenuItem>

            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
