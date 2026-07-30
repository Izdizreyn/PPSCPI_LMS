import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Etype.css";

export default function Etype() {
  return (
    <>
      <Navbar />
      <center>
        <div className="heading">
          <p>WELCOME ENROLLEE!</p>
        </div>
        <div className="etype-btn-old">
          <Link to="/enroll/old">
            <p>Old Student</p>
          </Link>
        </div>
        <div className="etype-btn-new">
          <Link to="/enroll/new">
            <p>New Student</p>
          </Link>
        </div>
        <div className="etype-btn-trans">
          <Link to="/enroll/transferee">
            <p>Transferee</p>
          </Link>
        </div>
      </center>
    </>
  );
}