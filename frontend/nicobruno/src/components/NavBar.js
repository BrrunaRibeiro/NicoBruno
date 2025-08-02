import React from "react";
import { Link } from "react-scroll";

const NavBar = () => {
  return (
    <nav>
      <ul className="menu">
        <li><Link to="home" smooth={true} duration={500}>Início</Link></li>
        <li><Link to="informacoes" smooth={true} duration={500}>Informações</Link></li>
        <li><Link to="confirmar" smooth={true} duration={500}>Confirmar Presença</Link></li>
        <li><Link to="presentes" smooth={true} duration={500}>Presentes</Link></li>
      </ul>
    </nav>
  );
};

export default NavBar;
