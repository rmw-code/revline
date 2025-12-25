import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import QueuePlayNextIcon from "@mui/icons-material/QueuePlayNext";
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { bikeList } from "../../data/bikesList";
import { LS_KEYS } from "../../enum";
import { DEFAULT_SERVICES } from "../../local";
import { loadLS, saveLS } from "../../utils";
import RevlineLogo from "./../../assets/revline_bg_cropped.png";

export function Orders({ role }) {
  const [services] = useState(loadLS(LS_KEYS.SERVICES, DEFAULT_SERVICES));
  const [orders, setOrders] = useState(loadLS(LS_KEYS.ORDERS, []));
  const [customer, setCustomer] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [platNo, setPlatNo] = useState("");
  const [mileage, setMileage] = useState("");
  const [bike, setBike] = useState("");
  const [mechanic, setMechanic] = useState("");
  const [selected, setSelected] = useState([]);
  const [printOrder, setPrintOrder] = useState(null);
  const [search, setSearch] = useState("");
  const printRef = useRef(null);
  const mechanicOptions = ["Wan", "Syahmi"];

  const canCashier = (role) =>
    ["superadmin", "admin", "cashier"].includes(role);

  useEffect(() => saveLS(LS_KEYS.ORDERS, orders), [orders]);

  const total = selected.reduce((sum, id) => {
    const s = services.find((x) => x.id === id);
    return sum + (s?.price || 0);
  }, 0);

  const toggleSel = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const createOrder = () => {
    if (!customer || selected.length === 0) return;
    const items = selected.map((id) => services.find((s) => s.id === id));
    const order = {
      id: crypto.randomUUID(),
      customer,
      bike,
      mechanic,
      phoneNo,
      platNo,
      mileage,
      items,
      total,
      status: "pending",
      createdAt: new Date().toISOString(),
      paid: false,
    };
    const next = [order, ...orders];
    setOrders(next);
    saveLS(LS_KEYS.DISPLAY_ORDER_ID, order.id);
    setCustomer("");
    setPhoneNo("");
    setBike("");
    setMechanic("");
    setMileage("");
    setPlatNo("");
    setSelected([]);
  };

  const downloadPDF = (order) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 🔹 Watermark (centered, low opacity)
    doc.setGState(new doc.GState({ opacity: 0.08 }));
    const wmSize = 160; // adjust watermark size
    const wmX = (pageWidth - wmSize) / 2;
    const wmY = (pageHeight - wmSize) / 3;
    doc.addImage(RevlineLogo, "PNG", wmX, wmY, wmSize, wmSize);

    // Reset opacity for normal content
    doc.setGState(new doc.GState({ opacity: 1 }));

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Service Invoice", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`Customer: ${order.customer}`, 14, 30);
    doc.text(`Phone Number: ${order.phoneNo ? order.phoneNo : "-"}`, 14, 35);
    doc.text(`Plate No: ${order.platNo}`, 14, 40);
    doc.text(`Bike: ${order.bike}`, 14, 45);
    doc.text(`Mileage: ${order.mileage}KM`, 14, 50);
    doc.text(`Mechanic: ${order.mechanic}`, 14, 55);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`, 14, 65);

    // Logo (top right)
    const logoWidth = 50;
    const logoHeight = 20;
    const marginRight = 14;
    const logoX = pageWidth - logoWidth - marginRight;
    const logoY = 14;
    doc.addImage(RevlineLogo, "PNG", logoX, logoY, logoWidth, logoHeight);

    // Address under logo
    const address = [
      "E-G-12, Pangsapuri Putra Raya",
      "Jalan PP 32, Seksyen 2",
      "Taman Pinggiran Putra",
      "43300 Seri Kembangan, Selangor",
      "Business Reg. No: 202503190421 (003752485-M)",
    ];
    doc.setFontSize(9);
    let addressY = logoY + logoHeight + 5;
    address.forEach((line) => {
      doc.text(line, pageWidth - marginRight, addressY, { align: "right" });
      addressY += 5;
    });

    // Ensure table starts AFTER logo + address
    const tableStartY = Math.max(addressY + 10, 70);

    // Table
    const rows = order.items.map((i) => [
      i.name,
      i.quantity,
      i.type,
      `RM${i.price.toFixed(2)}`,
    ]);

    autoTable(doc, {
      head: [["Service & Product", "Qty", "Type", "Price"]],
      body: rows,
      startY: tableStartY,
      styles: { font: "helvetica", fontSize: 10, cellPadding: 4 }, // 🔹 more spacing
      headStyles: { fillColor: [240, 240, 240], textColor: 20 },
    });

    // Total
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Total: RM${order.total.toFixed(2)}`,
      14,
      doc.lastAutoTable.finalY + 12
    );

    // 🔹 Signature & Stamp section
    const footerY = pageHeight - 40;

    // Customer signature (left)
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Customer Signature:", 14, footerY);

    // add more vertical spacing before line
    const signatureLineY = footerY + 20;
    doc.line(14, signatureLineY, 80, signatureLineY);

    // Company stamp (right)
    const stampBoxWidth = 60;
    const stampBoxHeight = 30;
    const stampX = pageWidth - stampBoxWidth - 14;
    const stampY = footerY - 10;
    doc.rect(stampX, stampY, stampBoxWidth, stampBoxHeight);

    doc.save(`invoice-${order.id}.pdf`);
  };

  const markPaid = (id) =>
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, paid: true } : o))
    );
  const setDisplay = (id) => saveLS(LS_KEYS.DISPLAY_ORDER_ID, id);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: "Invoice",
  });

  if (!canCashier(role))
    return (
      <Typography color="text.secondary">
        Your role cannot access POS.
      </Typography>
    );

  const deleteOrder = (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      const updated = orders.filter((o) => o.id !== id);
      setOrders(updated);
      saveLS(LS_KEYS.ORDERS, updated);
    }
  };

  return (
    <Grid width={"100%"} container spacing={2}>
      <Grid width={"100%"} item xs={12} md={12}>
        <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
          <Typography variant="h6" gutterBottom>
            Create Order
          </Typography>
          <Stack spacing={2}>
            <Stack flexDirection={"row"} columnGap={2}>
              {/* Customer name */}
              <Stack width="100%">
                <TextField
                  label="Customer Name"
                  fullWidth
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                />
              </Stack>
              <Stack width="100%">
                <TextField
                  label="Phone Number"
                  fullWidth
                  value={phoneNo}
                  onChange={(e) => setPhoneNo(e.target.value)}
                />
              </Stack>
              <Stack width="100%">
                <TextField
                  label="Plate Number"
                  fullWidth
                  value={platNo}
                  onChange={(e) => setPlatNo(e.target.value)}
                />
              </Stack>
              {/* </Stack>
            <Stack flexDirection={"row"} columnGap={2}> */}
              <Stack width="100%">
                <TextField
                  label="Mileage"
                  fullWidth
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                />
              </Stack>
              <Stack width="100%">
                <TextField
                  select
                  label="Bike"
                  fullWidth
                  value={bike}
                  onChange={(e) => setBike(e.target.value)}
                >
                  {bikeList.map((b) => (
                    <MenuItem key={b} value={b}>
                      {b}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              {/* Mechanic dropdown */}
              <Stack width="100%">
                <TextField
                  select
                  label="Mechanic"
                  fullWidth
                  value={mechanic}
                  onChange={(e) => setMechanic(e.target.value)}
                >
                  {mechanicOptions.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* 🔎 Search services */}
          <TextField
            label="Search Services"
            fullWidth
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Box sx={{ maxHeight: 250, overflowY: "auto" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Pick</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Bike</TableCell>
                  <TableCell>Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services
                  .filter((s) =>
                    s.name.toLowerCase().includes(search.toLowerCase())
                  )
                  .sort((a, b) => {
                    // Checked items first
                    const aChecked = selected.includes(a.id);
                    const bChecked = selected.includes(b.id);
                    if (aChecked === bChecked) return 0;
                    return aChecked ? -1 : 1;
                  })
                  .map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selected.includes(s.id)}
                          onChange={() => toggleSel(s.id)}
                        />
                      </TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.quantity > 0 ? s.quantity : "-"}</TableCell>
                      <TableCell>{s.type}</TableCell>
                      <TableCell>{s.details ? s.details : "-"}</TableCell>
                      <TableCell
                        title={s.bike}
                        style={{
                          maxWidth: 140,
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                        }}
                      >
                        {Array.isArray(s.bike) ? s.bike.join(", ") : s.bike}
                      </TableCell>{" "}
                      <TableCell>RM{s.price.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Box>

          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mt={2}
          >
            <Typography color="text.secondary">Total</Typography>
            <Typography variant="h6">RM{total.toFixed(2)}</Typography>
          </Box>
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={createOrder}
            >
              Create & Show
            </Button>
          </Box>
        </Paper>
      </Grid>

      {/* Recent Orders remains same */}
      <Grid item xs={12} md={12} width={"100%"}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Orders
          </Typography>
          <Table size="large">
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Bike</TableCell>
                <TableCell>Mechanic</TableCell>
                <TableCell>Total</TableCell>
                {/* <TableCell>Status</TableCell> */}
                <TableCell>Paid</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell>{o.customer}</TableCell>
                  <TableCell>{o.bike}</TableCell>
                  <TableCell>{o.mechanic}</TableCell>
                  <TableCell>RM{o.total.toFixed(2)}</TableCell>
                  {/* <TableCell>
                    <Chip label={o.status} size="small" />
                  </TableCell> */}
                  <TableCell>
                    {o.paid ? (
                      <Chip label="Paid" color="success" size="small" />
                    ) : (
                      <Chip label="Unpaid" variant="outlined" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Display">
                      <IconButton
                        color="primary"
                        onClick={() => setDisplay(o.id)}
                        size="small"
                      >
                        <QueuePlayNextIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download PDF">
                      <IconButton
                        color="primary"
                        onClick={() => downloadPDF(o)}
                        size="small"
                      >
                        <PictureAsPdfIcon />
                      </IconButton>
                    </Tooltip>
                    {!o.paid && (
                      <Tooltip title="Mark as paid">
                        <IconButton
                          color="primary"
                          onClick={() => markPaid(o.id)}
                          size="small"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete Order">
                      <IconButton
                        color="error"
                        onClick={() => deleteOrder(o.id)}
                        size="small"
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 6, color: "text.secondary" }}
                  >
                    No orders yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Grid>
    </Grid>
  );
}
