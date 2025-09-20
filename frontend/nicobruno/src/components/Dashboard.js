import React, { useState, useEffect, useMemo, useCallback } from "react";
import NavBar from "./NavBar";
import Countdown from "./Countdown";
import { Element, scroller } from "react-scroll";

const Dashboard = () => {
  const [submitted, setSubmitted] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(15);
  const [currentSection, setCurrentSection] = useState(0);

  // RSVP form state
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState(""); // ✅ new line
  const [acompanhantes, setAcompanhantes] = useState(0);
  const [mensagem, setMensagem] = useState("");

  const sections = useMemo(() => ["home", "informacoes", "confirmar", "presentes", "countdown"], []);

  const scrollToSection = useCallback((sectionIndex) => {
    scroller.scrollTo(sections[sectionIndex], {
      duration: 600,
      delay: 0,
      smooth: "easeInOutQuart",
    });
    setCurrentSection(sectionIndex);
  }, [sections]);

  const handleArrowClick = (direction) => {
    if (direction === "down" && currentSection < sections.length - 1) {
      scrollToSection(currentSection + 1);
    } else if (direction === "up" && currentSection > 0) {
      scrollToSection(currentSection - 1);
    }
  };

  const handleRSVPSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email, // ✅ added here
          acompanhantes: parseInt(acompanhantes, 10),
          mensagem,
          vai_vir: true,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        console.error("Erro ao enviar RSVP");
      }
    } catch (error) {
      console.error("Erro de rede:", error);
    }
  };

  useEffect(() => {
    if (submitted && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (submitted && redirectCountdown === 0) {
      scrollToSection(3);
      setSubmitted(false);
      setRedirectCountdown(15);
    }
  }, [submitted, redirectCountdown, scrollToSection]);

  const Arrow = ({ direction }) => {
    const isUp = direction === "up";
    return (
      <div 
        className={`scroll-arrow ${isUp ? "up-arrow" : "down-arrow"}`}
        onClick={() => handleArrowClick(direction)}
        style={{
          cursor: "pointer",
          width: "50px",
          height: "50px",
          bottom: "65px", 
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          fontSize: "32px",
          fontWeight: "bold",
          backgroundColor: isUp ? "rgba(136, 136, 136, 1)" : "rgba(56, 56, 56, 1)",
          color: "white",
          borderRadius: "50%",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        {isUp ? "↑" : "↓"}
      </div>
    );
  };

  return (
    <div>
      {/* 🏠 Home Section */}
      <Element name="home" className="section" style={{ minHeight: "100vh", position: "relative" }}>
        <NavBar />
        <div className="home-content">
          <div className="text-left">
            <h1>Nicole & Bruno</h1>
            <h5>SAVE THE DATE</h5>
            <h2>28|03|2026</h2>
          </div>
          <div className="image-right">
            <img src="/sunset-nicobruno.webp" alt="Nicole & Bruno" id="sidephoto" />
          </div>
        </div>
        <div style={{
          position: "absolute",
          bottom: "65px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          justifyContent: "space-between",
          width: "120px",
          gap: "2px"
        }}>
          <Arrow direction="down" />
        </div>
      </Element>

      {/* 📝 Wedding Info Section */}
      <Element name="informacoes" className="section" style={{ minHeight: "100vh", position: "relative" }}>
        <div className="left">
          <h2>Informações do Casamento</h2>
          <ul>
            <li><strong>Data:</strong> 28/03/2026</li>
            <li><strong>Horário:</strong> 16h</li>
            <li><strong>Local:</strong> Espaço Jardim, São Paulo</li>
            <li><strong>Endereço:</strong> <a href="https://www.google.com/maps">Rua das Flores, 123 - SP</a></li>
            <li><strong>Traje:</strong> Esporte fino</li>
          </ul>
        </div>
        <div className="right">
          <p>Estamos muito felizes que você irá compartilhar esse momento tão especial conosco.</p>
        </div>
        <div style={{
          position: "absolute",
          bottom: "65px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          justifyContent: "space-between",
          width: "120px",
          gap: "2px"
        }}>
          <Arrow direction="up" />
          <Arrow direction="down" />
        </div>
      </Element>

      {/* ✅ RSVP Section */}
      <Element name="confirmar" className="section" style={{ minHeight: "100vh", position: "relative" }}>
        {submitted ? (
          <div className="confirmation-message">
            <h2>Obrigado por confirmar presença!</h2>
            <p>Estamos muito felizes que você irá compartilhar esse momento tão especial conosco.</p>
            <small>Você será redirecionado para a página de presentes em {redirectCountdown} segundos...</small>
          </div>
        ) : (
          <>
            <h2>Confirme sua Presença</h2>
            <form className="rsvp-form" onSubmit={handleRSVPSubmit}>
              <input
                type="text"
                placeholder="Seu nome"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <input
                type="email"
                placeholder="Seu e-mail"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="number"
                placeholder="Quantas pessoas virao com voce? (Excluindo voce mesmo)"
                required
                value={acompanhantes}
                onChange={(e) => setAcompanhantes(e.target.value)}
              />
              <textarea
                placeholder="Mensagem (opcional)"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
              />
              <button type="submit">Enviar Confirmação</button>
            </form>
          </>
        )}
        <div style={{
          position: "absolute",
          bottom: "65px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          justifyContent: "space-between",
          width: "120px",
          gap: "2px"
        }}>
          <Arrow direction="up" />
          <Arrow direction="down" />
        </div>
      </Element>

      {/* 🎁 Gift Section */}
      <Element name="presentes" className="section" style={{ minHeight: "100vh", position: "relative" }}>
        <h2>Presentes</h2>
        <p>Se desejar nos presentear, você pode usar o PIX:</p>
        <p><strong>Chave PIX:</strong> nicolebruno@casamento.com</p>
        <p>Obrigado pelo seu carinho!</p>
        <div style={{
          position: "absolute",
          bottom: "65px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          justifyContent: "space-between",
          width: "120px",
          gap: "2px"
        }}>
          <Arrow direction="up" />
          <Arrow direction="down" />
        </div>
      </Element>

      {/* ⏳ Countdown Section */}
      <Element name="countdown" className="section" style={{ minHeight: "100vh", position: "relative" }}>
        <Countdown date="2026-03-28T16:00:00" />
        <div style={{
          position: "absolute",
          bottom: "65px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          justifyContent: "space-between",
          width: "60px",
          gap: "2px"
        }}>
          <Arrow direction="up" />
        </div>
      </Element>
    </div>
  );
};

export default Dashboard;
