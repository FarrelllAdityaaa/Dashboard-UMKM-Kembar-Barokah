// File: Frontend/src/layout/navbar.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { showConfirmToast } from "../components/Toast";

export default function Navbar({ username }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    showConfirmToast(
      "Apakah Anda yakin ingin logout?",
      () => {
        localStorage.removeItem("token");
        navigate("/");
      },
      () => {
        // Batal logout
      },
      "Logout",
      "bg-red-600"
    );
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogoClick = () => {
    navigate("/");
    if (window.innerWidth >= 768) { // md breakpoint
      toggleDropdown();
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const isActive = (path) => location.pathname === path;

  const isProdukActive = () => {
    const path = location.pathname;
    return (
      path === '/menu-produk' ||        // Halaman utama produk
      path.includes('/detailProduk') || // Halaman detail
      path.includes('/produk/')         // Halaman edit atau input
    );
  };

  const isAuditActive = () => {
    const path = location.pathname.toLowerCase();
    return path.includes('audit');
  };

  return (
    <nav className="fixed top-0 left-0 w-full flex items-center justify-between bg-[#FFC63C] px-6 py-3 shadow-md rounded-md font-[Poppins] z-50">
      <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-md bg-transparent"/>
        <span className="font-semibold text-[#3b2f00] leading-tight">
          Kembar<br />Barokah
        </span>
      </a>

      {/* Desktop Menu */}
      <ul className="hidden md:flex gap-8 list-none">
        <li><a href="/dashboard" className={`px-3 py-2 rounded-lg font-semibold hover:text-black hover:underline ${isActive('/dashboard') ? 'bg-[#FFB300] text-[#222]' : 'text-[#222]'}`}>Beranda</a></li>
        <li><a href="/menu-produk" className={`px-3 py-2 rounded-lg font-medium hover:text-black hover:underline ${isProdukActive() ? 'bg-[#FFB300] text-[#222]' : 'text-[#222]'}`}>Produk</a></li>
        <li><a href="/auditdata" className={`px-3 py-2 rounded-lg font-medium hover:text-black hover:underline ${isAuditActive() ? 'bg-[#FFB300] text-[#222]' : 'text-[#222]'}`}>Audit Data</a></li>
        <li><a href="/dashboardPrediksi" className={`px-3 py-2 rounded-lg font-medium hover:text-black hover:underline ${isActive('/dashboardPrediksi') ? 'bg-[#FFB300] text-[#222]' : 'text-[#222]'}`}>Dashboard Prediksi</a></li>
      </ul>

      {/* Desktop User Dropdown */}
      <div className="hidden md:block relative">
        <button
          onClick={toggleDropdown}
          className="flex items-center gap-2 bg-[#FFB300] text-[#222] border border-white rounded-lg px-4 py-1.5 font-medium hover:bg-[#ffce4d] transition-all"
        >
          <i className="fa fa-user"></i> {username}
          <i className={`fa fa-chevron-down transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
        </button>

        {isDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            ></div>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
              <button
                onClick={() => { handleLogout(); setIsDropdownOpen(false); }}
                className="w-full text-left px-4 py-3 text-[#222] hover:bg-gray-100 transition-colors rounded-lg flex items-center gap-2"
              >
                <i className="fa fa-sign-out"></i> Logout
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile User Button - Opens Sidebar */}
      <button
        onClick={toggleMenu}
        className="md:hidden flex items-center gap-2 bg-[#FFB300] text-[#222] border border-white rounded-lg px-3 py-1.5 font-medium hover:bg-[#ffce4d] transition-all"
      >
        <i className="fa fa-user"></i> {username}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Mobile Menu Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-64 bg-[#FFC63C] shadow-lg transform transition-transform duration-300 ease-in-out z-50 md:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-[#FFB300]">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-md bg-transparent"/>
              <span className="font-semibold text-[#3b2f00] leading-tight">
                Kembar<br />Barokah
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#222] hover:text-black"
            >
              <i className="fa fa-times text-xl"></i>
            </button>
          </div>

          <ul className="flex flex-col gap-2 list-none px-6 py-6 flex-1">
            <li>
              <a
                href="/dashboard"
                className={`block px-4 py-3 rounded-lg font-semibold hover:text-black hover:underline transition-colors ${isActive('/dashboard') ? 'bg-[#FFB300] text-[#222]' : 'text-[#222]'}`}
                onClick={() => setIsOpen(false)}
              >
                Beranda
              </a>
            </li>
            <li>
              <a
                href="/menu-produk"
                className={`block px-4 py-3 rounded-lg font-medium hover:text-black hover:underline transition-colors ${isActive('/menu-produk') ? 'bg-[#FFB300] text-[#222]' : 'text-[#222]'}`}
                onClick={() => setIsOpen(false)}
              >
                Produk
              </a>
            </li>
            <li>
              <a
                href="/auditdata"
                className={`block px-4 py-3 rounded-lg font-medium hover:text-black hover:underline transition-colors ${isActive('/auditdata') ? 'bg-[#FFB300] text-[#222]' : 'text-[#222]'}`}
                onClick={() => setIsOpen(false)}
              >
                Audit Data
              </a>
            </li>
            <li>
              <a
                href="/dashboardPrediksi"
                className={`block px-4 py-3 rounded-lg font-medium hover:text-black hover:underline transition-colors ${isActive('/dashboardPrediksi') ? 'bg-[#FFB300] text-[#222]' : 'text-[#222]'}`}
                onClick={() => setIsOpen(false)}
              >
                Dashboard Prediksi
              </a>
            </li>
          </ul>

          <div className="px-6 pb-6">
            <button
              onClick={() => { handleLogout(); setIsOpen(false); }}
              className="flex items-center gap-2 bg-[#FFB300] text-[#222] border border-white rounded-lg px-4 py-3 font-medium hover:bg-[#ffce4d] transition-all w-full justify-center"
            >
              <i className="fa fa-sign-out"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
