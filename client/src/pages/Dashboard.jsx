import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Welcome, {user?.name} 👋
        </h1>
        <p className="text-slate-500 mb-6">
          Role:{" "}
          <span className="font-medium text-blue-600">
            {user?.role?.toUpperCase()}
          </span>
        </p>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
