// src/components/NavBar.js
import React, { useState } from "react";
import { Link } from "react-scroll";

const NavBar = ({ cartCount = 0 }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { to: "home", label: "Início" },
    { to: "informacoes", label: "Informações" },
    { to: "confirmar", label: "Confirmar Presença" },
    { to: "presentes", label: "Presentes" },
  ];

  const closeMenu = () => setIsMobileOpen(false);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Burger (only visible < 426px via CSS) */}
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

          {/* Cart indicator (shown only on small screens via CSS) */}
          <div className="cart-indicator">
            <span role="img" aria-label="Carrinho">
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
