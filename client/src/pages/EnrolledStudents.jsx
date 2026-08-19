import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import AdminLayout from "../components/AdminLayout";
import "./EnrolledStudents.css";
import { adminLinks } from "../config/navLinks";

const LEVEL_ORDER = [
  "Nursery",
  "Kinder",
  "Elementary",
  "Junior High School",
  "Senior High School",
];
const levelSort = (a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b);

export default function EnrolledStudents() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    (async () => {
      const res = await axios.get(
        `${API_BASE_URL}/admin/enrolled-students.php`,
        authHeaders,
      );
      setStudents(res.data.students);
      setRooms(res.data.rooms);
      setLoading(false);
    })();
  }, []);

  const filteredStudents = students.filter((s) => {
    const q = search.toUpperCase();
    return (
      s.lrn.toUpperCase().includes(q) ||
      s.full_name.toUpperCase().includes(q) ||
      s.room.toUpperCase().includes(q)
    );
  });

  const byLevel = {};
  filteredStudents.forEach((s) => {
    if (!byLevel[s.level]) byLevel[s.level] = [];
    byLevel[s.level].push(s);
  });

  const byRoom = {};
  const roomLevels = {};
  filteredStudents.forEach((s) => {
    if (!byRoom[s.room]) byRoom[s.room] = [];
    byRoom[s.room].push(s);
    roomLevels[s.room] = s.level;
  });

  const roomsByLevel = {};
  rooms.forEach((r) => {
    if (!roomsByLevel[r.level]) roomsByLevel[r.level] = [];
    roomsByLevel[r.level].push(r);
  });

  const renderTable = (list) => (
    <table className="student-table">
      <thead>
        <tr>
          <th>LRN</th>
          <th>Name</th>
          <th>Year Level</th>
          <th>Strand</th>
          <th>Room</th>
          <th>Date Enrolled</th>
        </tr>
      </thead>
      <tbody>
        {list.map((s) => (
          <tr key={s.id}>
            <td>{s.lrn}</td>
            <td>{s.full_name}</td>
            <td>{s.year_level}</td>
            <td>{s.strand}</td>
            <td>{s.room}</td>
            <td>{new Date(s.enrollment_date).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (loading) {
    return (
      <AdminLayout links={adminLinks}>
        <p>Loading...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout links={adminLinks}>
      <div className="enrolled-students">
        <h1>Enrolled Students</h1>

        <div className="page-header-row">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by name, LRN, room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="print-btn" onClick={() => window.print()}>
            Print List
          </button>
        </div>

        <div className="tab">
          <button
            className={activeTab === "all" ? "active" : ""}
            onClick={() => setActiveTab("all")}
          >
            All Students
          </button>
          <button
            className={activeTab === "level" ? "active" : ""}
            onClick={() => setActiveTab("level")}
          >
            By Level
          </button>
          <button
            className={activeTab === "room" ? "active" : ""}
            onClick={() => setActiveTab("room")}
          >
            By Room
          </button>
          <button
            className={activeTab === "occupancy" ? "active" : ""}
            onClick={() => setActiveTab("occupancy")}
          >
            Room Occupancy
          </button>
        </div>

        {activeTab === "all" && (
          <>
            {filteredStudents.length > 0 ? (
              <table className="student-table">
                <thead>
                  <tr>
                    <th>LRN</th>
                    <th>Name</th>
                    <th>Year Level</th>
                    <th>Strand</th>
                    <th>Room</th>
                    <th>Level</th>
                    <th>Date Enrolled</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id}>
                      <td>{s.lrn}</td>
                      <td>{s.full_name}</td>
                      <td>{s.year_level}</td>
                      <td>{s.strand}</td>
                      <td>{s.room}</td>
                      <td>{s.level}</td>
                      <td>
                        {new Date(s.enrollment_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No enrolled students found.</p>
            )}
          </>
        )}

        {activeTab === "level" && (
          <>
            {Object.keys(byLevel)
              .sort(levelSort)
              .map((level) => (
                <div className="level-section" key={level}>
                  <div className="section-header">
                    <h3>{level}</h3>
                  </div>
                  {renderTable(byLevel[level])}
                </div>
              ))}
          </>
        )}

        {activeTab === "room" && (
          <>
            {Object.keys(byRoom)
              .sort((a, b) => {
                const cmp = levelSort(roomLevels[a], roomLevels[b]);
                return cmp !== 0 ? cmp : a.localeCompare(b);
              })
              .map((room) => {
                const level = roomLevels[room];
                return (
                  <div className="room-section" key={room}>
                    <div className="room-header">
                      <h3>
                        {room} ({level})
                      </h3>
                      <span className="capacity-badge">
                        {byRoom[room].length} students
                      </span>
                    </div>
                    <table className="student-table">
                      <thead>
                        <tr>
                          <th>LRN</th>
                          <th>Name</th>
                          <th>Year Level</th>
                          {level === "Senior High School" && <th>Strand</th>}
                          <th>Date Enrolled</th>
                        </tr>
                      </thead>
                      <tbody>
                        {byRoom[room].map((s) => (
                          <tr key={s.id}>
                            <td>{s.lrn}</td>
                            <td>{s.full_name}</td>
                            <td>{s.year_level}</td>
                            {level === "Senior High School" && (
                              <td>{s.strand}</td>
                            )}
                            <td>
                              {new Date(s.enrollment_date).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
          </>
        )}

        {activeTab === "occupancy" && (
          <>
            {Object.keys(roomsByLevel)
              .sort(levelSort)
              .map((level) => (
                <div className="level-section" key={level}>
                  <div className="section-header">
                    <h3>{level}</h3>
                  </div>
                  <table className="student-table">
                    <thead>
                      <tr>
                        <th>Room</th>
                        <th>Year Level</th>
                        {level === "Senior High School" && <th>Strand</th>}
                        <th>Capacity</th>
                        <th>Enrolled</th>
                        <th>Available</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomsByLevel[level]
                        .sort((a, b) =>
                          a.year_level === b.year_level
                            ? a.room_name.localeCompare(b.room_name)
                            : a.year_level - b.year_level,
                        )
                        .map((room) => {
                          const available = room.capacity - room.current_count;
                          const percentFull =
                            (room.current_count / room.capacity) * 100;
                          const status =
                            percentFull >= 100
                              ? "Full"
                              : percentFull >= 80
                                ? "Almost Full"
                                : "Available";
                          const statusClass =
                            percentFull >= 100
                              ? "status-full"
                              : percentFull >= 80
                                ? "status-almost"
                                : "status-available";
                          const strandMatch =
                            level === "Senior High School"
                              ? room.room_name.match(/Grade \d+-(.*)-[A-Z]/)
                              : null;
                          const strand = strandMatch ? strandMatch[1] : "";

                          return (
                            <tr key={room.id} className={statusClass}>
                              <td>{room.room_name}</td>
                              <td>{room.year_level}</td>
                              {level === "Senior High School" && (
                                <td>{strand}</td>
                              )}
                              <td>{room.capacity}</td>
                              <td>{room.current_count}</td>
                              <td>{available}</td>
                              <td>{status}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ))}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
