import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { showErrorToast } from "../components/Toast";
import logo from "../assets/logo.png"; 
import ceklis from "../assets/ceklis.svg";
import { HiEye, HiEyeOff } from "react-icons/hi";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { username, password });
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      showErrorToast("Login gagal!");
      console.error(err.response?.data || err.message);
      // Clear any existing token on login failure
      localStorage.removeItem("token");
    }
  };

  return (
    // Container Utama: Full Screen, Flex Center, Background Gradient
    <div className="flex justify-center items-center min-h-screen w-full bg-gradient-radial from-yellow-400 to-orange-400 p-4">
      
      {/* Card Container: Lebar Responsif */}
      <div className="w-full max-w-md"> 
        
        <div className="bg-yellow-100 rounded-full w-24 mx-auto shadow-2xl">
          <img
            src={logo}
            alt="Logo"
            className="block mx-auto -mb-10 w-24"
          />
        </div>

        <div className="bg-yellow-100 p-8 rounded-xl shadow-2xl w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-black drop-shadow-[2px_2px_0_white,-2px_2px_0_white,2px_-2px_0_white,-2px_-2px_0_white,0_0_15px_#3f3a09]">
              KEMBAR BAROKAH
            </h1>
          </div>

          <form>
            <div className="mb-4">
              <label htmlFor="username" className="block mb-2 text-gray-700 text-left">
                Username
              </label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded text-base"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block mb-2 text-gray-700 text-left">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded text-base pr-10"
              />
                <span
                  className="absolute inset-y-0 right-0 flex items-center px-3 cursor-pointer text-gray-600"
                  onClick={toggleShowPassword}
                  role="button"
                  tabIndex={0}
                >
                  {showPassword ? (
                    <HiEyeOff className="h-5 w-5" />
                  ) : (
                    <HiEye className="h-5 w-5" />
                  )}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleLogin}
              className={`w-full p-3 rounded text-base cursor-pointer flex justify-center items-center gap-2.5 ${
                isLoading ? "bg-gray-500 cursor-not-allowed" : "bg-black text-white"
              }`}
            >
              <img src={ceklis} alt="ceklis" className="w-4.5" />
              Login
            </button>
            <div className="text-center mt-4">
              <Link
                to="/gantipassword"
                className="font-bold text-gray-700 hover:underline hover:text-gray-500"
              >
                Ganti Password
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
