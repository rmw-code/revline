import {
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Checkbox,
  FormControlLabel,
  Stack,
  Select,
  MenuItem,
} from "@mui/material";
import { useEffect, useState } from "react";
import { getOrders, updateOrderStatus } from "../../services/orderService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function Tasks({ role }) {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState([]); // track selected customers

  useEffect(() => {
    // Fetch PENDING and IN-PROGRESS orders from API on component mount
    const fetchPendingOrders = async () => {
      try {
        const response = await getOrders({ 
          status: ["PENDING", "IN-PROGRESS"],
          includeServices: true,
          page: 0, 
          size: 500 
        });
        setOrders(response.content || []);
      } catch (error) {
        console.error("Failed to fetch pending orders:", error);
      }
    };
    fetchPendingOrders();
  }, []);

  const canMechanic = (role) =>
    ["superadmin", "admin", "mechanic"].includes(role);

  if (!canMechanic(role))
    return (
      <Typography color="text.secondary">
        Your role cannot access the Task Board.
      </Typography>
    );

  const handleStatusChange = async (id, newStatus) => {
    try {
      // Call API to update order status
      await updateOrderStatus(id, newStatus);
      
      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
      
      console.log(`Order ${id} status updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("Failed to update order status. Please try again.");
    }
  };

  const toggleItem = (orderId, itemIndex) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              items: o.items.map((i, idx) =>
                idx === itemIndex ? { ...i, done: !i.done } : i
              ),
            }
          : o
      )
    );
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Mechanic Task List", 14, 20);

    const filtered = orders.filter((o) => selected.includes(o.id));

    const rows = filtered.map((o) => [
      o.customerName || o.customer,
      (o.services || o.items || []).map((i) => (i.done ? "[x] " : "[   ] ") + i.name).join("\n\n"),
    ]);

    autoTable(doc, {
      head: [["Customer", "Checklist"]],
      body: rows,
      startY: 30,
      styles: {
        font: "helvetica",
        fontSize: 18,
        cellPadding: 2,
        valign: "top",
      },
      headStyles: { fillColor: [240, 240, 240], textColor: 20 },
    });

    doc.save("tasks.pdf");
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Mechanic Jobs</Typography>
        <Button
          variant="contained"
          onClick={exportPDF}
          disabled={selected.length === 0}
        >
          Export to PDF
        </Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Customer</TableCell>
            <TableCell>Mechanic</TableCell>
            <TableCell>Checklist</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Advance</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id} hover>
              <TableCell>
                <Checkbox
                  checked={selected.includes(o.id)}
                  onChange={() => toggleSelect(o.id)}
                />
              </TableCell>
              <TableCell>{o.customerName || o.customer}</TableCell>
              <TableCell>{o.mechanicName || o.mechanic || "-"}</TableCell>
              <TableCell>
                {(o.services || o.items || []).map((i, idx) => (
                  <div key={idx}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={i.done || false}
                          onChange={() => toggleItem(o.id, idx)}
                          disabled
                        />
                      }
                      label={i.name}
                    />
                  </div>
                ))}
              </TableCell>
              <TableCell>
                <Chip label={o.status?.toUpperCase() || "PENDING"} size="small" />
              </TableCell>
              <TableCell align="right">
                <Select
                  size="small"
                  value={o.status || "PENDING"}
                  onChange={(e) => handleStatusChange(o.id, e.target.value)}
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="PENDING">PENDING</MenuItem>
                  <MenuItem value="IN-PROGRESS">IN-PROGRESS</MenuItem>
                  <MenuItem value="COMPLETED">COMPLETED</MenuItem>
                </Select>
              </TableCell>
            </TableRow>
          ))}
          {orders.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                align="center"
                sx={{ py: 6, color: "text.secondary" }}
              >
                No jobs assigned.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}
