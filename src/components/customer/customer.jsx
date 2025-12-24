import {
  Box,
  Chip,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { LS_KEYS } from "../../enum";
import { loadLS } from "../../utils";
import QR from "./../../assets/qr.jpg";

export function CustomerDisplay() {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    // Poll for order updates from localStorage
    const fetchOrder = () => {
      const displayOrder = loadLS(LS_KEYS.DISPLAY_ORDER, null);
      setOrder(displayOrder);
    };

    // Initial fetch
    fetchOrder();

    // Poll for changes every 800ms
    const interval = setInterval(fetchOrder, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h5">Invoice</Typography>
          </Box>
          <Chip label="Live" color="primary" variant="outlined" />
        </Box>

        {!order ? (
          <Box
            display="grid"
            placeItems="center"
            sx={{ height: "70vh", color: "text.secondary" }}
          >
            No order selected yet.
          </Box>
        ) : (
          <Stack flexDirection={"row"} gap={2}>
            <Stack flexGrow={2}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Stack>
                    <Typography variant="h6">
                      Customer: {order.customerName || order.customer}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Invoice: {order.invoiceNo || order.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Bike: {order.motorcycleName || order.bike}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mechanic: {order.mechanicName || order.mechanic}
                    </Typography>
                  </Stack>
                  <Chip
                    label={(order.isPaid || order.paid) ? "Paid" : "Unpaid"}
                    color={(order.isPaid || order.paid) ? "success" : "default"}
                    variant={(order.isPaid || order.paid) ? "filled" : "outlined"}
                  />
                </Box>
                <Table size="large">
                  <TableHead>
                    <TableRow>
                      <TableCell>Service</TableCell>
                      <TableCell>Details</TableCell>
                      <TableCell>Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(order.services || order.items || []).map((i) => (
                      <TableRow key={i.id}>
                        <TableCell>{i.name}</TableCell>
                        <TableCell>{i.details || "-"}</TableCell>
                        <TableCell>RM{i.price.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        align="right"
                        sx={{ fontWeight: 600 }}
                      >
                        Total
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        RM{(order.totalCharge || order.total || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  mt={2}
                  color="text.secondary"
                >
                  <Typography variant="body2">
                    Created: {new Date(order.createAt || order.createdAt).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    Status: {order.status?.toUpperCase() || "PENDING"}
                  </Typography>
                </Box>
              </Paper>
            </Stack>

            <Stack flex={6} alignItems="center" justifyContent="flex-start">
              <img src={QR} style={{ maxWidth: "100%", height: "auto" }} />
            </Stack>
          </Stack>
        )}
        <Stack textAlign={"center"} mt={5}>
          <Typography variant="h2" component="h2">
            Wifi's Password{" "}
            <Stack style={{ color: "#1976d2" }}>RevLineMotorWorks</Stack>
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
