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
import QR from "./../../assets/qr.png";

export function CustomerDisplay() {
  const [orders, setOrders] = useState(loadLS(LS_KEYS.ORDERS, []));
  const [displayId, setDisplayId] = useState(
    loadLS(LS_KEYS.DISPLAY_ORDER_ID, null)
  );

  useEffect(() => {
    const int = setInterval(() => {
      setOrders(loadLS(LS_KEYS.ORDERS, []));
      setDisplayId(loadLS(LS_KEYS.DISPLAY_ORDER_ID, null));
    }, 800);
    return () => clearInterval(int);
  }, []);

  const order = orders.find((o) => o.id === displayId);

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
                  <Typography variant="h6">
                    Customer: {order.customer}
                  </Typography>
                  <Chip
                    label={order.paid ? "Paid" : "Unpaid"}
                    color={order.paid ? "success" : "default"}
                    variant={order.paid ? "filled" : "outlined"}
                  />
                </Box>
                <Table size="large">
                  <TableHead>
                    <TableRow>
                      <TableCell>Service</TableCell>
                      <TableCell>Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell>{i.name}</TableCell>
                        <TableCell>RM{i.price.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell
                        colSpan={1}
                        align="right"
                        sx={{ fontWeight: 600 }}
                      >
                        Total
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        RM{order.total.toFixed(2)}
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
                    Created: {new Date(order.createdAt).toLocaleString()}
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
