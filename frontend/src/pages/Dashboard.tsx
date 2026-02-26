import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="dashboard">
      <h1>Personal area</h1>
      {user && (
        <p>
          Welcome, {user.display_name || user.email}.
        </p>
      )}
    </div>
  );
}
