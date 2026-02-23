"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  // Links do menu
  const navLinks = [
    { to: "/dashboard", label: "Painel" },
    { to: "/responses", label: "Respostas" },
    { to: "/block-report", label: "Relatório por Bloco" },
  ];

  return (
    <nav className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 relative">
          {/* Logo à esquerda */}
          <div className="flex items-center">
            <img
              src="/Logo2.png"
              alt="Compliance Forms Logo"
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Título centralizado */}
          <Link
            to="/"
            onClick={closeMenu}
            className="absolute left-1/2 transform -translate-x-1/2 font-bold text-xl hover:opacity-80 transition-opacity"
          >
            Compliance Forms
          </Link>

          {/* Menu desktop */}
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMenu}
                className="px-4 py-2 rounded-md hover:bg-white/10 transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Botão mobile */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 hover:bg-white/10 rounded-md transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menu mobile */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-white/20">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMenu}
                className="block px-4 py-2 rounded-md hover:bg-white/10 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}