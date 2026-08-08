import {
  Box,
  Container,
  CssBaseline,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { useEffect, useState } from "react";
import {
  Attendance,
  Catalog,
  CustomerDisplay,
  Leave,
  Login,
  EmployeeAdmin,
  Orders,
  Earning,
  LoadingIndicator,
  Tasks,
  TopBar,
  Users,
  Settings,
} from "./components";
import { LS_KEYS } from "./enum";
import { DEFAULT_SERVICES, DEFAULT_USERS } from "./local";
import { useHashRoute } from "./router";
import theme from "./theme";
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
        <TabsWrapper roles={session.roles || session.role} />
        <Box mt={2} textAlign="center">
          <Typography variant="caption" color="text.disabled">
            Revline Motor Works
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

function TabsWrapper({ roles }) {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loading) return undefined;
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleTabChange = (_, v) => {
    if (v === tab) return;
    setLoading(true);
    setTab(v);
  };

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={handleTabChange}
        aria-label="main tabs"
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        <Tab label="Catalog" />
        <Tab label="Orders" />
        <Tab label="Inventory" disabled />
        <Tab label="Tasks" />
        <Tab label="Leave" />
        <Tab label="My Earnings" />
        <Tab label="Attendance" />
        <Tab label="Employees" />
        <Tab label="Users" />
        <Tab label="Settings" />
      </Tabs>
      <Box sx={{ mt: 2, position: "relative" }}>
        {tab === 0 && <Catalog roles={roles} />}
        {tab === 1 && <Orders roles={roles} />}
        {tab === 2 && <>Coming Soon</>}
        {tab === 3 && <Tasks roles={roles} />}
        {tab === 4 && <Leave />}
        {tab === 5 && <Earning />}
        {tab === 6 && <Attendance />}
        {tab === 7 && <EmployeeAdmin roles={roles} />}
        {tab === 8 && <Users roles={roles} />}
        {tab === 9 && <Settings roles={roles} />}
        {loading && (
          <LoadingIndicator overlay label="Loading, please wait..." />
        )}
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
