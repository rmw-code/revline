import { Box, CircularProgress, Fade, Typography } from "@mui/material";

export function LoadingIndicator({
  label = "Loading, please wait...",
  overlay = false,
  size = 44,
}) {
  const content = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
      }}
    >
      <CircularProgress size={size} thickness={4} />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );

  if (!overlay) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        {content}
      </Box>
    );
  }

  return (
    <Fade in>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "rgba(255, 255, 255, 0.65)",
          backdropFilter: "blur(2px)",
          borderRadius: 1,
        }}
      >
        {content}
      </Box>
    </Fade>
  );
}
