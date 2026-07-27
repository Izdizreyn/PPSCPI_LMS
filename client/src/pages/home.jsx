import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Home.css";

export default function Home() {
  return (
    <>
      <Navbar />
      <center>
        <div className="heading">
          <p>WELCOME!</p>
        </div>
        <div className="button1 active">
          <Link to="/admin-login">
            <p>Staff</p>
          </Link>
        </div>
        <div className="button2">
          <Link to="/enroll">
            <p>Enrollee</p>
          </Link>
        </div>
      </center>
    </>
  );
}