import { useEffect, useState } from "react";
import {
  Box,
  Container,
  CssBaseline,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import {
  Catalog,
  CustomerDisplay,
  Login,
  Orders,
  Tasks,
  TopBar,
  Users,
} from "./components";
import { LS_KEYS } from "./enum";
import { DEFAULT_SERVICES, DEFAULT_USERS } from "./local";
import { useHashRoute } from "./router";
import { loadLS, saveLS } from "./utils";

function Shell() {
  const { path } = useHashRoute();
  const [session, setSession] = useState(loadLS(LS_KEYS.SESSION, null));

  useEffect(() => {
    if (!localStorage.getItem(LS_KEYS.USERS))
      saveLS(LS_KEYS.USERS, DEFAULT_USERS);
    if (!localStorage.getItem(LS_KEYS.SERVICES))
      saveLS(LS_KEYS.SERVICES, DEFAULT_SERVICES);
  }, []);

  if (path.startsWith("/display")) return <CustomerDisplay />;

  if (!session) return <Login onLogin={setSession} loadLS={loadLS} />;

  const logout = () => {
    localStorage.removeItem(LS_KEYS.SESSION);
    setSession(null);
  };
  const openDisplay = () => {
    window.open("#/display", "customer_display", "width=900,height=700");
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <TopBar user={session} onLogout={logout} onOpenDisplay={openDisplay} />
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <TabsWrapper role={session.role} />
        <Box mt={2} textAlign="center">
          <Typography variant="caption" color="text.disabled">
            Revline Motor Works
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

const comingSoon = () => {

}

function TabsWrapper({ role }) {
  const [tab, setTab] = useState(0);
  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="main tabs">
        <Tab label="Catalog" />
        <Tab label="Orders" />
        <Tab label="Inventory" />
        <Tab label="Tasks" />
        <Tab label="Leave" />
        <Tab label="Attendance" />
        <Tab label="Users" />
      </Tabs>
      <Box sx={{ mt: 2 }}>
        {tab === 0 && <Catalog role={role} />}
        {tab === 1 && <Orders role={role} />}
        {tab === 2 && <>Coming Soon</>}
        {tab === 3 && <Tasks role={role} />}
        {tab === 6 && <Users role={role} />}
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Shell />
    </ThemeProvider>
  );
}
