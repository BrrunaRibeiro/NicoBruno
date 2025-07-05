import React from "react";

const NavBar = () => {
    return (
        <nav>
            <ul className="menu">
                <li><a href="index.html" className="active">Home</a></li>
                <li><a href="info.html">Informações</a></li>
                <li><a href="rspv.html">Confirmar Presença</a></li>
                <li><a href="giftdonations.html">Presentes</a></li>
            </ul>
        </nav>
    );
}

export default NavBar;