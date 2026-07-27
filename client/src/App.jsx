import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Etype from "./pages/Etype";
import OldStudent from "./pages/OldStudent";
import NewStudent from "./pages/NewStudent";
import Transferee from "./pages/Transferee";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/enroll" element={<Etype />} />
        <Route path="/enroll/old" element={<OldStudent />} />
        <Route path="/enroll/new" element={<NewStudent />} />
        <Route path="/enroll/transferee" element={<Transferee />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;