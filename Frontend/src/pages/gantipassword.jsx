import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo.png";
import ceklis from "../assets/ceklis.svg";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { showErrorToast, showSuccessToast } from "../components/Toast";

export default function GantiPassword() {
  const [username, setUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const toggleShowOldPassword = () => setShowOldPassword(!showOldPassword);
  const toggleShowNewPassword = () => setShowNewPassword(!showNewPassword);
  const toggleShowConfirmPassword = () =>
    setShowConfirmPassword(!showConfirmPassword);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showErrorToast("Password baru dan konfirmasi password tidak sama!");
      return;
    }
    try {
      await api.post("/auth/change-password", {
        username,
        oldPassword,
        newPassword,
        confirmPassword,
      });
      showSuccessToast("Password berhasil diubah!");
      navigate("/login");
      return;
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        showErrorToast("Gagal mengganti password: " + err.response.data.message);
      } else {
        showErrorToast("Gagal mengganti password!");
      }
    }
  };

  const inputClass = "flex-grow p-2 border border-gray-300 rounded-l text-base";
  const toggleButtonClass = "flex items-center bg-white border-l-0 border-transparent rounded-r px-3 cursor-pointer text-gray-600";

  return (
    <div className="flex justify-center items-center bg-gradient-radial from-yellow-400 to-orange-400 w-screen min-h-screen p-6">
      <div className="max-w-md w-full">
        <div className="bg-yellow-100 rounded-full w-24 mx-auto shadow-2xl">
          <img src={logo} alt="Logo" className="block mx-auto -mb-10 w-24" />
        </div>

        <div className="bg-yellow-100 p-10 rounded-xl shadow-2xl w-full mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-black drop-shadow-[2px_2px_0_white,-2px_2px_0_white,2px_-2px_0_white,-2px_-2px_0_white,0_0_15px_#3f3a09]">
              KEMBAR BAROKAH
            </h1>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-2">
            <div>
              <label
                htmlFor="username"
                className="block text-gray-700 font-semibold text-left"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded text-base"
              />
            </div>

            <div>
              <label
                htmlFor="oldPassword"
                className="block text-gray-700 font-semibold text-left"
              >
                Password Lama
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  id="oldPassword"
                  placeholder="Enter your old password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded text-base pr-10"
                />
                <span
                  className="absolute inset-y-0 right-0 flex items-center px-3 cursor-pointer text-gray-600"
                  onClick={toggleShowOldPassword}
                  role="button"
                  tabIndex={0}
                >
                  {showOldPassword ? (
                    <HiEyeOff className="h-5 w-5" />
                  ) : (
                    <HiEye className="h-5 w-5" />
                  )}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-gray-700 font-semibold text-left"
              >
                Password Baru
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded text-base pr-10"
                />
                <span
                  className="absolute inset-y-0 right-0 flex items-center px-3 cursor-pointer text-gray-600"
                  onClick={toggleShowNewPassword}
                  role="button"
                  tabIndex={0}
                >
                  {showNewPassword ? (
                    <HiEyeOff className="h-5 w-5" />
                  ) : (
                    <HiEye className="h-5 w-5" />
                  )}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-gray-700 font-semibold text-left"
              >
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded text-base pr-10"
                />
                <span
                  className="absolute inset-y-0 right-0 flex items-center px-3 cursor-pointer text-gray-600"
                  onClick={toggleShowConfirmPassword}
                  role="button"
                  tabIndex={0}
                >
                  {showConfirmPassword ? (
                    <HiEyeOff className="h-5 w-5" />
                  ) : (
                    <HiEye className="h-5 w-5" />
                  )}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full p-2 bg-black text-white rounded text-base cursor-pointer flex justify-center items-center gap-2.5"
            >
              <img src={ceklis} alt="ceklis" className="w-4.5" />
              Ganti Password
            </button>

            <div className="text-center mt-6">
              <Link 
              to="/login" 
              className="font-bold text-gray-700 hover:underline hover:text-gray-500"
              >
                Kembali ke Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
