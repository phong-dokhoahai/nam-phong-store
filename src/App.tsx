import { Route, BrowserRouter as Router, Routes } from "react-router";
import { AdminRoute, ProtectedRoute } from "@/auth";
import { ScrollToTop } from "./components/common/ScrollToTop";
import AppLayout from "./layout/AppLayout";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import Calendar from "./pages/Calendar";
import BarChart from "./pages/Charts/BarChart";
import LineChart from "./pages/Charts/LineChart";
import Home from "./pages/Dashboard/Ecommerce";
import FormElements from "./pages/Forms/FormElements";
import Categories from "./pages/MasterData/Categories";
import Customers from "./pages/MasterData/Customers";
import Suppliers from "./pages/MasterData/Suppliers";
import Units from "./pages/MasterData/Units";
import Inventory from "./pages/Inventory/Inventory";
import Materials from "./pages/Materials/Materials";
import Blank from "./pages/OtherPage/Blank";
import NotFound from "./pages/OtherPage/NotFound";
import Payments from "./pages/Payments/Payments";
import LowStockReport from "./pages/Reports/LowStockReport";
import RevenueReport from "./pages/Reports/RevenueReport";
import CustomerDebtReport from "./pages/Reports/CustomerDebtReport";
import SupplierDebtReport from "./pages/Reports/SupplierDebtReport";
import InventoryPeriodReport from "./pages/Reports/InventoryPeriodReport";
import PurchaseReport from "./pages/Reports/PurchaseReport";
import SalesReport from "./pages/Reports/SalesReport";
import StockIssues from "./pages/StockIssues/StockIssues";
import StockReceipts from "./pages/StockReceipts/StockReceipts";
import BasicTables from "./pages/Tables/BasicTables";
import Alerts from "./pages/UiElements/Alerts";
import Avatars from "./pages/UiElements/Avatars";
import Badges from "./pages/UiElements/Badges";
import Buttons from "./pages/UiElements/Buttons";
import Images from "./pages/UiElements/Images";
import Videos from "./pages/UiElements/Videos";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index path="/" element={<Home />} />

              {/* Others Page */}
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/blank" element={<Blank />} />

              {/* Inventory */}
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/units" element={<Units />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/stock-receipts" element={<StockReceipts />} />
              <Route path="/stock-issues" element={<StockIssues />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/reports/inventory" element={<InventoryPeriodReport />} />
              <Route path="/reports/low-stock" element={<LowStockReport />} />
              <Route path="/reports/purchases" element={<PurchaseReport />} />
              <Route path="/reports/sales" element={<SalesReport />} />
              <Route element={<AdminRoute />}>
                <Route path="/reports/revenue" element={<RevenueReport />} />
                <Route path="/reports/customer-debt" element={<CustomerDebtReport />} />
                <Route path="/reports/supplier-debt" element={<SupplierDebtReport />} />
              </Route>

              {/* Forms */}
              <Route path="/form-elements" element={<FormElements />} />

              {/* Tables */}
              <Route path="/basic-tables" element={<BasicTables />} />

              {/* Ui Elements */}
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/avatars" element={<Avatars />} />
              <Route path="/badge" element={<Badges />} />
              <Route path="/buttons" element={<Buttons />} />
              <Route path="/images" element={<Images />} />
              <Route path="/videos" element={<Videos />} />

              {/* Charts */}
              <Route path="/line-chart" element={<LineChart />} />
              <Route path="/bar-chart" element={<BarChart />} />
            </Route>
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
