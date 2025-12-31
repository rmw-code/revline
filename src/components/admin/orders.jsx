import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import React, { useEffect, useRef, useState } from "react";
import styles from "./admin.module.scss";
import { useReactToPrint } from "react-to-print";
import { LS_KEYS } from "../../enum";
import { loadLS, saveLS } from "../../utils";
import { getServices } from "../../services/serviceService";
import { getMotorcycles } from "../../services/motorcycleService";
import { getUsersByRole } from "../../services/userServices";
import { createOrder as createOrderAPI, getOrders, getOrderById, markOrderAsPaid } from "../../services/orderService";
import RevlineLogo from "./../../assets/revline_bg_cropped.png";

export function Orders({ role }) {
  const [services, setServices] = useState([]);
  const [motorcycles, setMotorcycles] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [orders, setOrders] = useState([]); // No longer using localStorage
  const [customer, setCustomer] = useState("");
  const [phoneNo, setPhoneNo] = useState(""); // 🔹 new state
  const [platNo, setPlatNo] = useState(""); // 🔹 new state
  const [mileage, setMileage] = useState(""); // 🔹 new state
  const [bike, setBike] = useState(""); // 🔹 new state
  const [selectedMotorcycle, setSelectedMotorcycle] = useState(null); // 🔹 motorcycle object
  const [mechanic, setMechanic] = useState(""); // 🔹 new state
  const [selectedMechanic, setSelectedMechanic] = useState(null); // 🔹 mechanic object
  const [selected, setSelected] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [printOrder, setPrintOrder] = useState(null);
  const [search, setSearch] = useState(""); // 🔹 search services
  const printRef = useRef(null);

  const canCashier = (role) =>
    ["superadmin", "admin", "cashier"].includes(role);

  useEffect(() => {
    // Fetch services from API on component mount
    const fetchServices = async () => {
      try {
        const response = await getServices("", 0, 5000);
        setServices(response.content || []);
      } catch (error) {
        console.error("Failed to fetch services:", error);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    // Fetch orders from API on component mount
    const fetchOrders = async () => {
      try {
        const response = await getOrders({ page: 0, size: 10 });
        setOrders(response.content || []);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    // Check localStorage for mechanics list first
    const cachedMechanics = loadLS(LS_KEYS.MECHANICS, null);

    if (cachedMechanics && cachedMechanics.length > 0) {
      // Use cached mechanics from localStorage
      setMechanics(cachedMechanics);
    } else {
      // Fetch from API and store in localStorage
      const fetchMechanics = async () => {
        try {
          const response = await getUsersByRole("mechanic", 0, 100);
          const mechanicsList = response.content || [];
          setMechanics(mechanicsList);
          saveLS(LS_KEYS.MECHANICS, mechanicsList);
        } catch (error) {
          console.error("Failed to fetch mechanics:", error);
        }
      };
      fetchMechanics();
    }
  }, []);

  useEffect(() => {
    // Check localStorage for motorcycles list first
    const cachedMotorcycles = loadLS(LS_KEYS.MOTORCYCLES, null);

    if (cachedMotorcycles && cachedMotorcycles.length > 0) {
      // Use cached motorcycles from localStorage
      setMotorcycles(cachedMotorcycles);
    } else {
      // Fetch from API and store in localStorage
      const fetchMotorcycles = async () => {
        try {
          const response = await getMotorcycles(0, 100);
          const motorcycleList = response.content || [];
          setMotorcycles(motorcycleList);
          saveLS(LS_KEYS.MOTORCYCLES, motorcycleList);
        } catch (error) {
          console.error("Failed to fetch motorcycles:", error);
        }
      };
      fetchMotorcycles();
    }
  }, []);

  // No longer syncing orders to localStorage
  // useEffect(() => saveLS(LS_KEYS.ORDERS, orders), [orders]);

  const total = selected.reduce((sum, id) => {
    const s = services.find((x) => x.id === id);
    const qty = quantities[id] || 1;
    return sum + (s?.price || 0) * qty;
  }, 0);

  // Toggle selection and ensure default quantity assigned when selected
  const toggleSelectWithQuantity = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      } else {
        setQuantities((q) => ({ ...(q || {}), [id]: q && q[id] ? q[id] : 1 }));
        return [...prev, id];
      }
    });
  };
  const createOrder = async () => {
    if (!customer || selected.length === 0) return;
    
    try {
      // Get selected services with their details
      const items = selected.map((id) => services.find((s) => s.id === id));
      
      // Prepare services array for API (include quantity)
      const servicesPayload = items.map((item) => {
        const qty = quantities[item.id] || 1;
        return {
          name: item.name,
          price: item.price,
          details: item.details || "",
          quantity: qty,
          lineTotal: Number((item.price * qty).toFixed(2)),
        };
      });

      // Prepare order data for API
      const orderData = {
        customerName: customer,
        phoneNumber: phoneNo,
        plateNumber: platNo,
        mileage: mileage,
        motorcycleName: bike,
        motorcycleId: selectedMotorcycle?.id || null,
        mechanicName: mechanic,
        mechanicId: selectedMechanic?.id || null,
        status: "PENDING",
        isPaid: false,
        services: servicesPayload,
      };

      // Call API to create order
      const createdOrder = await createOrderAPI(orderData);

      // Fetch the full order details to get complete data including invoice number
      const fullOrderDetails = await getOrderById(createdOrder.id);
      
      // Add to local orders list for immediate display in table
      const next = [fullOrderDetails, ...orders];
      setOrders(next);
      
      // Save full order details to localStorage for customer display
      saveLS(LS_KEYS.DISPLAY_ORDER, fullOrderDetails);
      
      // Reset form
      setCustomer("");
      setPhoneNo("");
      setPlatNo("");
      setMileage("");
      setBike("");
      setSelectedMotorcycle(null);
      setMechanic("");
      setSelectedMechanic(null);
      setSelected([]);
    } catch (error) {
      console.error("Failed to create order:", error);
      alert("Failed to create order. Please try again.");
    }
  };

  const downloadPDF = async (order) => {
    try {
      // Fetch complete order details from API
      const fullOrder = await getOrderById(order.id);
      
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
      doc.setFontSize(9);
      doc.text(`Invoice No: ${fullOrder.invoiceNo || fullOrder.id}`, 14, 30);
      doc.text(`Customer: ${fullOrder.customerName || fullOrder.customer}`, 14, 35);
      doc.text(`Bike: ${fullOrder.motorcycleName || fullOrder.bike}`, 14, 40);
      doc.text(`Mechanic: ${fullOrder.mechanicName || fullOrder.mechanic}`, 14, 45);
      doc.text(`Date: ${new Date(fullOrder.createAt || fullOrder.createdAt).toLocaleString()}`, 14, 50);
      
      // Payment status
      const paymentStatus = (fullOrder.isPaid || fullOrder.paid) ? "Paid" : "Unpaid";
      doc.setFont("helvetica", "bold");
      doc.text(`Status: ${paymentStatus}`, 14, 55);
      doc.setFont("helvetica", "normal");

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

      // Table - handle both 'services' (API) and 'items' (local) arrays
      const serviceItems = fullOrder.services || fullOrder.items || [];
      const rows = serviceItems.map((i) => [i.name, i.details || "-", `RM${i.price.toFixed(2)}`]);

      autoTable(doc, {
        head: [["Service & Product", "Details", "Price"]],
        body: rows,
        startY: tableStartY,
        styles: { font: "helvetica", fontSize: 10, cellPadding: 6 }, // 🔹 more spacing
        headStyles: { fillColor: [240, 240, 240], textColor: 20 },
      });

      // Total
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Total: RM${(fullOrder.totalCharge || fullOrder.total || 0).toFixed(2)}`,
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

      doc.save(`invoice-${fullOrder.invoiceNo || fullOrder.id}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const markPaid = async (id) => {
    try {
      // Call API to mark order as paid
      await markOrderAsPaid(id);
      
      // Fetch the updated order details from API to get complete data
      const updatedOrder = await getOrderById(id);
      
      // Update local state with the complete order data
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? updatedOrder : o))
      );
      
      console.log(`Order ${id} marked as paid`);
    } catch (error) {
      console.error("Failed to mark order as paid:", error);
      alert("Failed to mark order as paid. Please try again.");
    }
  };
  
  const setDisplay = async (id) => {
    try {
      // Fetch full order details from API
      const orderDetails = await getOrderById(id);
      
      // Store full order details in localStorage for display
      saveLS(LS_KEYS.DISPLAY_ORDER, orderDetails);
      
      console.log("Order details saved for display:", orderDetails);
    } catch (error) {
      console.error("Failed to fetch order details:", error);
    }
  };

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

  return (
    <Grid width={"100%"} container spacing={2}>
      <Grid width={"100%"} item xs={12} md={12}>
        <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
          <Typography variant="h6" gutterBottom>
            Create Order
          </Typography>
          <Stack spacing={2}>
            <Stack
              flexDirection={{ xs: "column", md: "row" }}
              columnGap={2}
              rowGap={2}
            >
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
            <Stack width="100%">
              <TextField
                label="Mileage"
                fullWidth
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
              />
            </Stack>
            <Stack width="100%">
              <Autocomplete
                freeSolo
                options={motorcycles}
                getOptionLabel={(option) => 
                  typeof option === 'string' ? option : `${option.brand} ${option.model}`
                }
                value={bike}
                onChange={(event, newValue) => {
                  if (typeof newValue === 'string') {
                    setBike(newValue);
                    setSelectedMotorcycle(null);
                  } else if (newValue) {
                    setBike(`${newValue.brand} ${newValue.model}`);
                    setSelectedMotorcycle(newValue);
                  } else {
                    setBike("");
                    setSelectedMotorcycle(null);
                  }
                }}
                onInputChange={(event, newInputValue) => {
                  setBike(newInputValue);
                  if (!newInputValue) setSelectedMotorcycle(null);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Bike"
                    fullWidth
                  />
                )}
              />
            </Stack>
            <Stack width="100%">
              <Autocomplete
                freeSolo
                options={mechanics}
                getOptionLabel={(option) => 
                  typeof option === 'string' ? option : (option.name || option.email)
                }
                value={mechanic}
                onChange={(event, newValue) => {
                  if (typeof newValue === 'string') {
                    setMechanic(newValue);
                    setSelectedMechanic(null);
                  } else if (newValue) {
                    setMechanic(newValue.name || newValue.email);
                    setSelectedMechanic(newValue);
                  } else {
                    setMechanic("");
                    setSelectedMechanic(null);
                  }
                }}
                onInputChange={(event, newInputValue) => {
                  setMechanic(newInputValue);
                  if (!newInputValue) setSelectedMechanic(null);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Mechanic"
                    fullWidth
                  />
                )}
              />
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

          <div className={styles.tableScrollable}>
            <div className={styles.tableWrapper}>
              <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Pick</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Price</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services
                .filter((s) =>
                  s.name.toLowerCase().includes(search.toLowerCase())
                )
                .map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.includes(s.id)}
                        onChange={() => toggleSelectWithQuantity(s.id)}
                      />
                    </TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        inputProps={{ min: 1 }}
                        value={quantities[s.id] ?? 1}
                        onChange={(e) => {
                          const v = Math.max(1, Number(e.target.value || 1));
                          setQuantities((q) => ({ ...(q || {}), [s.id]: v }));
                        }}
                        sx={{ width: 90 }}
                      />
                    </TableCell>
                    <TableCell>{s.details}</TableCell>
                    <TableCell>RM{s.price.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
              </Table>
            </div>
          </div>
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
          <div className={styles.tableWrapper}>
            <Table size="large" className={styles.wideTable}>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Phone No</TableCell>
                <TableCell>Plat No</TableCell>
                <TableCell>Mileage</TableCell>
                <TableCell>Bike</TableCell>
                <TableCell>Mechanic</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell>{o.customerName || o.customer}</TableCell>
                  <TableCell>{o.phoneNumber || "-"}</TableCell>
                  <TableCell>{o.plateNumber || "-"}</TableCell>
                  <TableCell>{o.mileage || "-"}</TableCell>
                  <TableCell>{o.motorcycleName || o.bike}</TableCell>
                  <TableCell>{o.mechanicName || o.mechanic}</TableCell>
                  <TableCell>RM{(o.totalCharge || o.total || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip label={o.status?.toUpperCase() || "PENDING"} size="small" />
                  </TableCell>
                  <TableCell>
                    {(o.isPaid || o.paid) ? (
                      <Chip label="Paid" color="success" size="small" />
                    ) : (
                      <Chip label="Unpaid" variant="outlined" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => setDisplay(o.id)}
                      sx={{ mr: 1 }}
                    >
                      Display
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => downloadPDF(o)}
                      sx={{ mr: 1 }}
                    >
                      PDF
                    </Button>
                    {!o.isPaid && !o.paid && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => markPaid(o.id)}
                      >
                        Mark Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    align="center"
                    sx={{ py: 6, color: "text.secondary" }}
                  >
                    No orders yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            </Table>
          </div>
        </Paper>
      </Grid>
    </Grid>
  );
}
