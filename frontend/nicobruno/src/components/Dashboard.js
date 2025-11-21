import React, { useState, useEffect, useMemo, useCallback } from "react";
import NavBar from "./NavBar";
import Countdown from "./Countdown";
import { Element, scroller } from "react-scroll";
import { ReactTyped } from "react-typed";

const Dashboard = () => {
  const [submitted, setSubmitted] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(15);
  const [currentSection, setCurrentSection] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [acompanhantes, setAcompanhantes] = useState("");
  const [criancas, setCriancas] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [vaiVir, setVaiVir] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
    if (submitting) return;
    setSubmitting(true);

    try {
      const method = isUpdating ? "PUT" : "POST";
      const response = await fetch("http://localhost:5000/api/rsvp", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          acompanhantes: parseInt(acompanhantes, 10),
          criancas: parseInt(criancas, 10),
          mensagem,
          vai_vir: vaiVir === "yes"
        }),
      });

      if (response.status === 409) {
        setEmailExists(true);
      } else if (response.ok) {
        setSubmitted(true);
      } else {
        console.error("Erro ao enviar RSVP");
      }
    } catch (error) {
      console.error("Erro de rede:", error);
    } finally {
      setSubmitting(false);
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
      <NavBar />

      <Element name="home" className="section" style={{ minHeight: "100vh", position: "relative" }}>
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
        <div style={{ position: "absolute", bottom: "65px", left: "50%", transform: "translateX(-50%)", display: "flex", justifyContent: "space-between", width: "120px", gap: "2px" }}>
          <Arrow direction="down" />
        </div>
      </Element>

      <Element name="informacoes" className="section" style={{ minHeight: "100vh", position: "relative" }}>
        <div style={{ width: "80%", maxWidth: "800px", margin: "auto", padding: "2rem" }}>
          <h3 style={{ alignItems: "center" }}>Família e amigos queridos,</h3>
          <div>
            <ReactTyped
              strings={[
                "Com grande emoção e carinho, convidamos vocês para celebrar conosco um dos momentos mais especiais de nossas vidas: ^1000 o nosso casamento...^1500" +
                "<br><br>" +
                "Criamos este espaço para tornar tudo mais simples: informações, lembranças e um convite aberto para comemorar ao nosso lado. ^1000" +
                "<br>" +
                "Ficaremos muito felizes em contar com sua presença, por isso, não deixe de confirmar através do menu ‘Confirme sua Presença’. ^1000" +
                "<br><br>" +
                "Contamos com vocês ^500 e mal podemos esperar para celebrar juntos!^1500" +
                "<br><br>" +
                "Com carinho, ^500 Nicole e Bruno."
              ]}
              typeSpeed={35}
              loop={false}
              backSpeed={0}
            /></div>
          <div style={{ marginTop: "2rem" }}>
            <h5>Traje: Esporte fino</h5>
            <p>Endereço: <a href="https://www.google.com/maps?q=Espaço+Lumière+Indaiatuba" target="_blank" rel="noopener noreferrer">Espaço Lumière - Indaiatuba</a></p>
            <iframe
              title="Google Maps"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3676.3195912715664!2d-47.200327684875924!3d-23.580761184670736!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94c5d9e0c6757cf3%3A0xe7a9bcd7d5e0a56e!2sEspa%C3%A7o%20Lumi%C3%A8re!5e0!3m2!1spt-BR!2sbr!4v1700000000000"
              width="100%"
              height="300"
              style={{ border: 0, borderRadius: "12px", marginTop: "1rem" }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: "65px", left: "50%", transform: "translateX(-50%)", display: "flex", justifyContent: "space-between", width: "120px", gap: "2px" }}>
          <Arrow direction="up" />
          <Arrow direction="down" />
        </div>
      </Element>

      <Element name="confirmar" className="section" style={{ minHeight: "100vh", position: "relative" }}>
        {emailExists ? (
          <div className="confirmation-message">
            <h2>Esse email já foi usado para confirmar presença.</h2>
            <p>Se deseja alterar sua confirmação, clique abaixo.</p>
            <button onClick={() => { setEmailExists(false); setIsUpdating(true); }}>Alterar Confirmação</button>
            <button onClick={() => { setEmailExists(false); scrollToSection(0); }}>Voltar à página inicial</button>
          </div>
        ) : submitted ? (
          <div className="confirmation-message">
            <h2>{vaiVir === "yes" ? "Obrigado por confirmar presença!" : "Sentiremos sua falta!"}</h2>
            <p>{vaiVir === "yes" ? "Estamos muito felizes que você irá compartilhar esse momento tão especial conosco." : "Que pena que você não poderá comparecer. Obrigada por nos avisar!"}</p>
            <small>Você será redirecionado para a página de <a href="/Presentes">Presentes</a> em {redirectCountdown} segundos...</small>
          </div>
        ) : (
          <>
            <h2>Confirme sua Presença</h2>
            <form className="rsvp-form" onSubmit={handleRSVPSubmit}>
              <button type="button" className="update-button" onClick={() => setIsUpdating(!isUpdating)}>
                {isUpdating ? "Voltar para confirmação" : "Ou deseja alterar sua resposta?"}
              </button>
              <div className="toggle-group">
                <button type="button" className={`toggle-option ${vaiVir === "yes" ? "selected" : ""}`} onClick={() => setVaiVir("yes")}>Sim</button>
                <button type="button" className={`toggle-option ${vaiVir === "no" ? "selected" : ""}`} onClick={() => setVaiVir("no")}>Não</button>
              </div>
              <input type="text" placeholder="Seu nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
              <input type="email" placeholder="Seu e-mail" required value={email} onChange={(e) => setEmail(e.target.value)} />
              {(vaiVir === "yes" || isUpdating) && (
                <>
                  <input type="number" placeholder="Número de acompanhantes (incluindo você)" required value={acompanhantes} onChange={(e) => setAcompanhantes(e.target.value)} />
                  <input type="number" placeholder="Número de crianças" value={criancas} onChange={(e) => setCriancas(e.target.value)} />
                </>
              )}
              <input type="text" placeholder="Mensagem (opcional)" value={mensagem} onChange={(e) => setMensagem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
              <button type="submit" disabled={vaiVir === null || submitting}>Enviar Confirmação</button>
            </form>
          </>
        )}
        <div style={{ position: "absolute", bottom: "65px", left: "50%", transform: "translateX(-50%)", display: "flex", justifyContent: "space-between", width: "120px", gap: "2px" }}>
          <Arrow direction="up" />
          <Arrow direction="down" />
        </div>
      </Element>

      <Element name="presentes" className="section" style={{ minHeight: "100vh", position: "relative" }}>
        <h2>Presentes</h2>
        <p>Se desejar nos presentear, você pode usar o PIX:</p>
        <p><strong>Chave PIX:</strong> nicolebruno@casamento.com</p>
        <p>Obrigado pelo seu carinho!</p>
        <div style={{ position: "absolute", bottom: "65px", left: "50%", transform: "translateX(-50%)", display: "flex", justifyContent: "space-between", width: "120px", gap: "2px" }}>
          <Arrow direction="up" />
          <Arrow direction="down" />
        </div>
      </Element>

      <Element name="countdown" className="section" style={{ minHeight: "100vh", position: "relative" }}>
        <Countdown date="2026-03-28T16:00:00" />
        <div style={{ position: "absolute", bottom: "65px", left: "50%", transform: "translateX(-50%)", display: "flex", justifyContent: "space-between", width: "60px", gap: "2px" }}>
          <Arrow direction="up" />
        </div>
      </Element>
    </div>
  );
};

export default Dashboard;
