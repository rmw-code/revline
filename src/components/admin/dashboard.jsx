import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useCallback, useEffect, useState } from "react";
import { getOrders } from "../../services/orderService";

const HISTORY_MONTHS = 12;
const FORECAST_MONTHS = 3;
const CURRENCY_FORMATTER = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  maximumFractionDigits: 0,
});
const NUMBER_FORMATTER = new Intl.NumberFormat("en-MY");

const formatCurrency = (amount) => CURRENCY_FORMATTER.format(amount);

const getMonthDate = (date, offset = 0) =>
  new Date(date.getFullYear(), date.getMonth() + offset, 1);

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseOrderDate = (value) => {
  if (!value) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getItemTotal = (item) => {
  const explicitTotal = Number(item?.lineTotal);
  if (Number.isFinite(explicitTotal)) return explicitTotal;
  const unitPrice = Number(item?.price ?? item?.amount ?? item?.unitPrice ?? 0);
  const quantity = Number(item?.quantity ?? item?.qty ?? 1);
  return Number.isFinite(unitPrice * quantity) ? unitPrice * quantity : 0;
};

const getOrderTotal = (order) => {
  const total = Number(order?.totalCharge ?? order?.total);
  if (Number.isFinite(total)) return total;
  return (Array.isArray(order?.services) ? order.services : []).reduce(
    (sum, item) => sum + getItemTotal(item),
    0,
  );
};

const getServiceType = (item) =>
  item?.type ||
  item?.serviceTypeName ||
  item?.serviceType ||
  item?.category ||
  item?.service?.serviceTypeName ||
  "Uncategorized";

const buildForecast = (months) => {
  const completedMonths = months.slice(0, -1).slice(-6);
  const meanX = (completedMonths.length - 1) / 2;
  const meanY =
    completedMonths.reduce((sum, month) => sum + month.sales, 0) /
    (completedMonths.length || 1);
  const denominator = completedMonths.reduce(
    (sum, _, index) => sum + (index - meanX) ** 2,
    0,
  );
  const slope =
    denominator === 0
      ? 0
      : completedMonths.reduce(
          (sum, month, index) =>
            sum + (index - meanX) * (month.sales - meanY),
          0,
        ) / denominator;

  return Array.from({ length: FORECAST_MONTHS }, (_, index) => ({
    date: getMonthDate(months[months.length - 1].date, index + 1),
    sales: Math.max(
      0,
      meanY + slope * (completedMonths.length - meanX + index),
    ),
    forecast: true,
  }));
};

function SalesChart({ months }) {
  const chartWidth = 800;
  const chartHeight = 300;
  const left = 58;
  const right = 18;
  const top = 18;
  const bottom = 58;
  const plotWidth = chartWidth - left - right;
  const plotHeight = chartHeight - top - bottom;
  const maxSales = Math.max(1, ...months.map((month) => month.sales));
  const tickStep = maxSales / 4;
  const slotWidth = plotWidth / months.length;
  const barWidth = slotWidth * 0.56;
  const compactCurrency = new Intl.NumberFormat("en-MY", {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  return (
    <Box sx={{ width: "100%", overflowX: "auto" }}>
      <svg
        role="img"
        aria-label="Monthly sales chart showing recorded sales and a three-month trend projection"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        style={{ display: "block", minWidth: 600, width: "100%" }}
      >
        {Array.from({ length: 5 }, (_, index) => {
          const value = maxSales - tickStep * index;
          const y = top + (plotHeight / 4) * index;
          return (
            <g key={index}>
              <line
                x1={left}
                x2={chartWidth - right}
                y1={y}
                y2={y}
                stroke="#e8eaf0"
                strokeDasharray={index === 4 ? undefined : "4 5"}
              />
              <text
                x={left - 8}
                y={y + 4}
                textAnchor="end"
                fill="#74798a"
                fontSize="11"
              >
                {compactCurrency.format(value)}
              </text>
            </g>
          );
        })}
        {months.map((month, index) => {
          const barHeight = (month.sales / maxSales) * plotHeight;
          const x = left + slotWidth * index + (slotWidth - barWidth) / 2;
          const y = top + plotHeight - barHeight;
          const label = month.date.toLocaleDateString("en-MY", {
            month: "short",
            year: "2-digit",
          });
          return (
            <g key={`${month.date.getFullYear()}-${month.date.getMonth()}`}>
              <title>
                {month.forecast ? "Forecast" : "Recorded sales"} for{" "}
                {month.date.toLocaleDateString("en-MY", {
                  month: "long",
                  year: "numeric",
                })}
                : {formatCurrency(month.sales)}
              </title>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 1)}
                rx="4"
                fill={month.forecast ? "#b8a9ef" : "#18006a"}
              />
              <text
                x={left + slotWidth * index + slotWidth / 2}
                y={top + plotHeight + 22}
                textAnchor="middle"
                fill={month.forecast ? "#6c5ba6" : "#74798a"}
                fontSize="10"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </Box>
  );
}

function MetricCard({ label, value, detail }) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2.5, height: "100%", borderRadius: 2 }}
    >
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
        {value}
      </Typography>
      <Typography color="text.secondary" variant="caption">
        {detail}
      </Typography>
    </Paper>
  );
}

export function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const now = new Date();
      const from = getMonthDate(now, -(HISTORY_MONTHS - 1));
      const response = await getOrders({
        page: 0,
        size: 1000,
        createAtFrom: formatDate(from),
        createAtTo: formatDate(now),
        sort: "createAt,asc",
      });
      if (!Array.isArray(response?.content)) {
        throw new Error("The orders response did not contain an order list.");
      }
      setOrders(response.content);
    } catch (loadError) {
      console.error("Failed to load sales dashboard:", loadError);
      setError("Sales data could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const currentMonth = getMonthDate(new Date());
  const historicalMonths = Array.from({ length: HISTORY_MONTHS }, (_, index) => {
    const date = getMonthDate(currentMonth, index - (HISTORY_MONTHS - 1));
    return { date, sales: 0, orderCount: 0 };
  });

  const typeSales = new Map();
  orders.forEach((order) => {
    const orderDate = parseOrderDate(order.createAt || order.createdAt);
    if (!orderDate) return;
    const monthIndex =
      (orderDate.getFullYear() - historicalMonths[0].date.getFullYear()) * 12 +
      orderDate.getMonth() -
      historicalMonths[0].date.getMonth();
    if (monthIndex < 0 || monthIndex >= historicalMonths.length) return;

    historicalMonths[monthIndex].sales += getOrderTotal(order);
    historicalMonths[monthIndex].orderCount += 1;

    const items = Array.isArray(order.services) ? order.services : [];
    items.forEach((item) => {
      const type = getServiceType(item);
      typeSales.set(type, (typeSales.get(type) || 0) + getItemTotal(item));
    });
  });

  const forecastMonths = buildForecast(historicalMonths);
  const currentSales = historicalMonths[historicalMonths.length - 1].sales;
  const forecastSales = forecastMonths[0].sales;
  const totalSales = historicalMonths.reduce((sum, month) => sum + month.sales, 0);
  const totalOrders = historicalMonths.reduce(
    (sum, month) => sum + month.orderCount,
    0,
  );
  const sortedTypes = [...typeSales.entries()].sort(
    (first, second) => second[1] - first[1],
  );
  const itemTypeTotal = sortedTypes.reduce((sum, [, value]) => sum + value, 0);

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Sales dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monthly sales performance and a three-month trend forecast
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadOrders}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={loadOrders}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Paper
          variant="outlined"
          sx={{ minHeight: 280, display: "grid", placeItems: "center" }}
        >
          <CircularProgress aria-label="Loading sales data" />
        </Paper>
      ) : !error ? (
        <Stack spacing={2.5}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            <MetricCard
              label="Sales this month"
              value={formatCurrency(currentSales)}
              detail={`${NUMBER_FORMATTER.format(historicalMonths[11].orderCount)} orders recorded`}
            />
            <MetricCard
              label="Next month forecast"
              value={formatCurrency(forecastSales)}
              detail="Trend projection from completed months"
            />
            <MetricCard
              label="12-month sales"
              value={formatCurrency(totalSales)}
              detail={`${NUMBER_FORMATTER.format(totalOrders)} orders recorded`}
            />
            <MetricCard
              label="Top item type"
              value={sortedTypes[0]?.[0] || "—"}
              detail={
                sortedTypes.length
                  ? `${formatCurrency(sortedTypes[0][1])} in recorded sales`
                  : "No item types recorded"
              }
            />
          </Box>

          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={1}
              sx={{ mb: 1 }}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Monthly sales
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Recorded order value and a linear trend projection
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} alignItems="center">
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 10, height: 10, bgcolor: "#18006a", borderRadius: 0.5 }} />
                  <Typography variant="caption">Actual</Typography>
                </Stack>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 10, height: 10, bgcolor: "#b8a9ef", borderRadius: 0.5 }} />
                  <Typography variant="caption">Forecast</Typography>
                </Stack>
              </Stack>
            </Stack>
            <SalesChart months={[...historicalMonths, ...forecastMonths]} />
            <Typography variant="caption" color="text.secondary">
              Forecast is a simple linear projection using up to the last six
              completed months; it is indicative, not a guarantee.
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700}>
              Sales by item type
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Recorded service line totals over the last 12 months
            </Typography>
            {sortedTypes.length ? (
              <Stack spacing={1.75}>
                {sortedTypes.map(([type, sales]) => {
                  const share = itemTypeTotal
                    ? Math.max(0, (sales / itemTypeTotal) * 100)
                    : 0;
                  return (
                    <Box key={type}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        spacing={2}
                        sx={{ mb: 0.5 }}
                      >
                        <Typography variant="body2">{type}</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(sales)} · {share.toFixed(0)}%
                        </Typography>
                      </Stack>
                      <Box
                        role="progressbar"
                        aria-label={`${type} share of item type sales`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(share)}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: "action.hover",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            width: `${share}%`,
                            height: "100%",
                            bgcolor: "primary.main",
                            borderRadius: 4,
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No item type sales found for this period.
              </Typography>
            )}
          </Paper>
        </Stack>
      ) : null}
    </Box>
  );
}
