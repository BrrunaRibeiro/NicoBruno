// src/components/NavBar.js
import React, { useState } from "react";
import { Link } from "react-scroll";

const NavBar = ({
  cartCount = 0,
  cartItems = [],
  cartTotal = 0,
  onCartAdd,
  onCartRemove,
  onCartClear,
  onCartCheckout,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const menuItems = [
    { to: "home", label: "Início" },
    { to: "informacoes", label: "Informações" },
    { to: "confirmar", label: "Confirmar Presença" },
    { to: "presentes", label: "Presentes" },
  ];

  const closeMenu = () => setIsMobileOpen(false);

  const toggleMobileMenu = () => {
    setIsMobileOpen((prev) => !prev);
    setIsCartOpen(false); // never show both at once
  };

  const toggleCart = () => {
    setIsCartOpen((prev) => !prev);
    setIsMobileOpen(false);
  };

  const handleCartClick = () => {
    toggleCart();
  };

  const handleCartKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleCart();
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
            onClick={toggleMobileMenu}
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
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Cart indicator – CLICKABLE, opens dropdown cart */}
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

      {/* CART DROPDOWN – like the example you pasted */}
      <div className={`cart-dropdown ${isCartOpen ? "open" : ""}`} style= {{ paddingTop: "10px" }}>
        <div className="cart-dropdown-inner">
          {(!cartItems || cartItems.length === 0) ? (
            <p style={{ fontSize: "0.95rem", margin: 0 }}>
              Seu carrinho ainda está vazio. Escolha um presente para continuar.
            </p>
          ) : (
            <>
              <ul className="cart-dropdown-list">
                {cartItems.map((item) => (
                  <li key={item.id} className="cart-dropdown-item">
                    <div>
                      <span className="cart-dropdown-item-title">
                        {item.title}
                      </span>
                      <div className="cart-dropdown-item-qty">
                        x{item.quantity}
                      </div>
                    </div>
                    <div className="cart-dropdown-qty-controls">
                      <button
                        type="button"
                        className="cart-dropdown-qty-btn"
                        onClick={() => onCartRemove && onCartRemove(item.id)}
                      >
                        -
                      </button>
                      <button
                        type="button"
                        className="cart-dropdown-qty-btn"
                        onClick={() => onCartAdd && onCartAdd(item)}
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <hr />
              <p className="cart-dropdown-total">
                Total: R${" "}
                {cartTotal.toFixed(2).replace(".", ",")}
              </p>
              <button
                type="button"
                className="cart-dropdown-primary-btn"
                onClick={() => onCartCheckout && onCartCheckout()}
              >
                Prosseguir com o pagamento
              </button>
              <button
                type="button"
                className="cart-dropdown-secondary-btn"
                onClick={() => onCartClear && onCartClear()}
              >
                Limpar carrinho
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default NavBar;
