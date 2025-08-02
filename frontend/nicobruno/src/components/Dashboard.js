import React, { useState, useEffect } from "react";
import NavBar from "./NavBar";
import Countdown from "./Countdown";
import { Element, scroller } from "react-scroll";

const ScrollToTopButton = ({ visible }) => (
  <div
    className={`scroll-top-btn ${visible ? 'visible' : 'hidden'}`}
    onClick={() => scroller.scrollTo("home", { smooth: true, duration: 500 })}
  >
    ↑
  </div>
);

const ScrollDownArrow = ({ to }) => (
  <div
    className="scroll-arrow scroll-down"
    onClick={() =>
      scroller.scrollTo(to, {
        smooth: true,
        duration: 500,
        offset: -60,
      })
    }
  >
    ↓
  </div>
);

const Dashboard = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(15);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (submitted && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (submitted && redirectCountdown === 0) {
      scroller.scrollTo("presentes", { smooth: true, duration: 500 });
      setSubmitted(false);
      setRedirectCountdown(15);
    }
  }, [submitted, redirectCountdown]);

  const handleRSVPSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div>
      <NavBar />
      <ScrollToTopButton visible={showScrollTop} />

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
        <ScrollDownArrow to="informacoes" />
      </Element>

      {/* Informações do Casamento */}
      <Element name="informacoes" className="section info-thanks" id="informacoes">
        <div className="left">
          <h2>Informações do Casamento</h2>
          <ul>
            <li><strong>Data:</strong> 28/03/2026</li>
            <li><strong>Horário:</strong> 16h</li>
            <li><strong>Local:</strong> Espaço Jardim, São Paulo</li>
            <li><strong>Endereço:</strong> <a href="https://www.google.com/maps" target="_blank" rel="noreferrer">Rua das Flores, 123 - SP</a></li>
            <li><strong>Traje:</strong> Esporte fino</li>
          </ul>
        </div>
        <div className="right">
          <p>Estamos muito felizes que você irá compartilhar esse momento tão especial conosco.</p>
        </div>
        <ScrollDownArrow to="confirmar" />
      </Element>

      {/* Confirmar Presença */}
      <Element name="confirmar" className="section" id="confirmar">
        {submitted ? (
          <div className="confirmation-message">
            <h2>Obrigado por confirmar presença!</h2>
            <p>
              Estamos muito felizes que você irá compartilhar esse momento tão especial conosco.
            </p>
            <small>
              Você será redirecionado para a página de presentes em {redirectCountdown} segundos...
            </small>
          </div>
        ) : (
          <>
            <h2>Confirme sua Presença</h2>
            <form className="rsvp-form" onSubmit={handleRSVPSubmit}>
              <input type="text" placeholder="Seu nome" required />
              <input type="number" placeholder="Número de convidados (excluindo você mesmo)" required />
              <textarea placeholder="Mensagem para os noivos (opcional)" />
              <button type="submit">Enviar Confirmação</button>
            </form>
          </>
        )}
        <ScrollDownArrow to="presentes" />
      </Element>

      {/* Presentes */}
      <Element name="presentes" className="section" id="presentes">
        <h2>Presentes</h2>
        <p>Se desejar nos presentear, você pode usar o PIX:</p>
        <p><strong>Chave PIX:</strong> nicolebruno@casamento.com</p>
        <p>Obrigado pelo seu carinho!</p>
        <ScrollDownArrow to="countdown" />
      </Element>

      {/* Contagem Regressiva */}
      <Element name="countdown" className="section" id="countdown">
        <Countdown date="2026-03-28T16:00:00" />
      </Element>
    </div>
  );
};

export default Dashboard;
