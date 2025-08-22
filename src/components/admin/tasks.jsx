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
} from "@mui/material";
import { useEffect, useState } from "react";
import { LS_KEYS } from "../../enum";
import { loadLS, saveLS } from "../../utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function Tasks({ role }) {
  const [orders, setOrders] = useState(loadLS(LS_KEYS.ORDERS, []));
  const [selected, setSelected] = useState([]); // track selected customers

  useEffect(() => saveLS(LS_KEYS.ORDERS, orders), [orders]);

  const canMechanic = (role) =>
    ["superadmin", "admin", "mechanic"].includes(role);

  if (!canMechanic(role))
    return (
      <Typography color="text.secondary">
        Your role cannot access the Task Board.
      </Typography>
    );

  const toggleStatus = (id) =>
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status:
                o.status === "pending"
                  ? "in-progress"
                  : o.status === "in-progress"
                  ? "completed"
                  : "pending",
            }
          : o
      )
    );

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
      o.customer,
      o.items.map((i) => (i.done ? "[x] " : "[   ] ") + i.name).join("\n\n"),
      // o.status,
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
              <TableCell>{o.customer}</TableCell>
              <TableCell>
                {o.items.map((i, idx) => (
                  <div>
                    <FormControlLabel
                      key={idx}
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
                <Chip label={o.status} size="small" />
              </TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => toggleStatus(o.id)}>
                  Next
                </Button>
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
