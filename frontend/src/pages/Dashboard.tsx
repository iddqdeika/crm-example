import { useAuth } from "../contexts/AuthContext";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="dashboard">
      <h1 className="dashboard__heading">Personal area</h1>
      {user && (
        <p className="dashboard__welcome">
          Welcome, {user.display_name || user.email}.
        </p>
      )}
    </div>
  );
}
