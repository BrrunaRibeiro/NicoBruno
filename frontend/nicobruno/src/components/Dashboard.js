import React, { useState, useEffect } from "react";
import NavBar from "./NavBar";
import Countdown from "./Countdown";
import { Element, scroller } from "react-scroll";

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setVisible(window.pageYOffset > 100);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    visible && (
      <div
        className="scroll-top-btn"
        onClick={() => scroller.scrollTo("home", { smooth: true, duration: 500 })}
      >
        ↑
      </div>
    )
  );
};

const Dashboard = () => {
  return (
    <div>
      <NavBar />
      <ScrollToTopButton />

      {/* Início */}
      <Element name="home" className="section home-section" id="home">
        <div className="home-content">
          <div className="text-left">
            <h1>Nicole & Bruno</h1>
            <h5>SAVE THE DATE</h5>
            <h2>28|03|2026</h2>
          </div>
          <div className="image-right">
            <img
              src="/sunset-nicobruno.webp"
              alt="Nicole & Bruno"
              id="sidephoto"
            />
          </div>
        </div>
      </Element>

      {/* Confirmar Presença */}
      <Element name="confirmar" className="section" id="confirmar">
        <h2>Confirmar Presença</h2>
        <form className="rsvp-form">
          <input type="text" placeholder="Seu nome" required />
          <input type="number" placeholder="Número de convidados" required />
          <textarea placeholder="Mensagem para os noivos (opcional)" />
          <button type="submit">Enviar Confirmação</button>
        </form>
      </Element>

      {/* Presentes */}
      <Element name="presentes" className="section" id="presentes">
        <h2>Presentes</h2>
        <p>Se desejar nos presentear, você pode usar o PIX:</p>
        <p><strong>Chave PIX:</strong> nicolebruno@casamento.com</p>
        <p>Obrigado pelo seu carinho!</p>
      </Element>

      {/* Informações + Agradecimento */}
      <Element name="informacoes" className="section info-thanks" id="informacoes">
        <div className="left">
          <h2>Informações do Casamento</h2>
          <ul>
            <li><strong>Data:</strong> 28/03/2026</li>
            <li><strong>Horário:</strong> 16h</li>
            <li><strong>Local:</strong> Espaço Jardim, São Paulo</li>
            <li><strong>Endereço:</strong> Rua das Flores, 123 - SP</li>
            <li><strong>Traje:</strong> Esporte fino</li>
          </ul>
        </div>

        <div className="right">
          <h2>Obrigado por confirmar presença ou enviar seu presente!</h2>
          <p>Estamos muito felizes que você irá compartilhar esse momento tão especial conosco.</p>
          <Countdown date="2026-03-28T16:00:00" />
        </div>
      </Element>
    </div>
  );
};

export default Dashboard;
