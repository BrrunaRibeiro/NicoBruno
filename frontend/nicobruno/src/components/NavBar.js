// src/components/NavBar.js
import React, { useState } from "react";
import { Link } from "react-scroll";

const NavBar = ({ cartCount = 0, onCartClick }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { to: "home", label: "Início" },
    { to: "informacoes", label: "Informações" },
    { to: "confirmar", label: "Confirmar Presença" },
    { to: "presentes", label: "Presentes" },
  ];

  const closeMenu = () => setIsMobileOpen(false);

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick(); // we’ll define this in Dashboard
    }
    setIsMobileOpen(false);
  };

  const handleCartKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === " ") && onCartClick) {
      e.preventDefault();
      handleCartClick();
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Burger (only visible ≤ 425px via CSS) */}
          <button
            type="button"
            className="burger-btn"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            aria-label={isMobileOpen ? "Fechar menu" : "Abrir menu"}
          >
            <span />
            <span />
            <span />
          </button>

          {/* Desktop menu */}
          <ul className="menu desktop-menu">
            {menuItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  smooth={true}
                  duration={500}
                  offset={-70}
                  spy={true}
                  activeClass="active"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Cart indicator – CLICKABLE */}
          <div
            className="cart-indicator"
            role="button"
            tabIndex={0}
            aria-label="Abrir carrinho de presentes"
            onClick={handleCartClick}
            onKeyDown={handleCartKeyDown}
          >
            <span role="img" aria-hidden="true">
              🛒
            </span>
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile dropdown menu (slides under navbar) */}
      <div className={`mobile-menu ${isMobileOpen ? "open" : ""}`}>
        <ul>
          {menuItems.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                smooth={true}
                duration={500}
                offset={-70}
                onClick={closeMenu}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default NavBar;
