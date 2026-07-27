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
        <div className="button1">
          <Link to="/enroll/old">
            <p>Old Student</p>
          </Link>
        </div>
        <div className="button2">
          <Link to="/enroll/new">
            <p>New Student</p>
          </Link>
        </div>
        <div className="button3">
          <Link to="/enroll/transferee">
            <p>Transferee</p>
          </Link>
        </div>
      </center>
    </>
  );
}