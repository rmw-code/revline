import { createTheme } from "@mui/material/styles";
import "@fontsource/maven-pro/400.css";
import "@fontsource/maven-pro/500.css";
import "@fontsource/maven-pro/700.css";

const theme = createTheme({
  palette: {
    primary: {
      main: "#18006a",
    },
  },
  typography: {
    fontFamily: "Maven Pro, Arial, sans-serif",
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    body1: { fontWeight: 400 },
    button: { textTransform: "none", fontWeight: 500 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          backgroundColor: "#18006a",
          color: "#ffffff",
          '&:hover': {
            backgroundColor: '#130055',
          },
        },
      },
    },
  },
});

export default theme;
