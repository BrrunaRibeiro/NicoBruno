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

  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  console.log("Maps key test from React:", googleMapsApiKey);

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
          bottom: "30px",
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

      <Element name="informacoes" className="section" style={{ minHeight: "100vh", position: "relative", display: "flex", justifyContent: "center", alignItems: "center", padding: "3rem 1rem" }}>
        <div style={{ display: "flex", gap: "3rem", maxWidth: "1200px", width: "100%", flexWrap: "wrap" }}>
          {/* Left Column: Typed message */}
          <div id="typed-text" style={{ flex: "1 1 400px" }}>
            <ReactTyped
              strings={[
                "<h3>Família e amigos queridos,</h3>" +
                "Com grande emoção e carinho, convidamos vocês para celebrar conosco um dos momentos mais especiais de nossas vidas:  ^900 o nosso casamento...   ^1000" +
                "<br><br>" +
                "Criamos este espaço para tornar tudo mais simples: informações, presentes e um convite aberto para comemorar ao nosso lado.  ^500" +
                "<br>" +
                "Ficaremos muito felizes em contar com sua presença, por isso, não deixe de confirmar através do menu ‘Confirme sua Presença’.  ^500" +
                "<br><br>" +
                "Contamos com vocês ^100 e mal podemos esperar para celebrar juntos!  ^1000" +
                "<br><br>" +
                "Com carinho," +
                "<p id='signature'> ^400 Nicole e Bruno.</p"
              ]}
              typeSpeed={35}
              backSpeed={0}
              showCursor={false}
              loop={false}
            />
          </div>
          {/* Right Column: Map, address, dress code */}
          <div style={{ flex: "1 1 400px", opacity: 0, animation: "fadeIn 1s ease-in forwards", animationDelay: "34.5s" }}>
            <h4 style={{ marginBottom: "0.1rem" }}>Dress Code</h4>
            <h5>
              Pode deixar o paletó e a gravata em casa! Nosso casamento será em clima leve e descontraído,
              e pede apenas um traje esporte fino, com aquele toque de conforto que combina perfeitamente com a festa.
            </h5>

            <h4 style={{ marginTop: "2rem", marginBottom: "0.1rem" }}>Local</h4>
            <h5>
              📍<strong><a href="https://www.google.com/maps/place/Rua+Joao+Wicki+263,+Jardim+Sao+Carlos,+Almirante+Tamandare+-+PR,+83507-254" target="_blank" rel="noopener noreferrer">Chácara Refúgio do Vale</a></strong><br />
              Rua João Wicki, 263 - Jardim São Carlos, Almirante Tamandaré - PR, 83507-254
            </h5>

            <div style={{ marginTop: "1rem", borderRadius: "12px", overflow: "hidden", opacity: 0, animation: "fadeIn 1s ease-in forwards", animationDelay: "2.5s" }}>
              <iframe
                title="Chácara Refúgio do Vale"
                src={`https://www.google.com/maps/embed/v1/directions?key=${googleMapsApiKey}&origin=My+Location&destination=Rua+Joao+Wicki+263,+Jardim+Sao+Carlos,+Almirante+Tamandare+-+PR,+83507-254&zoom=14`}
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <div style={{ position: "absolute", bottom: "65px", left: "50%", transform: "translateX(-50%)", display: "flex", justifyContent: "space-between", width: "120px", gap: "2px" }}>
          <Arrow direction="up" />
          <Arrow direction="down" />
        </div>
      </Element>

      <Element name="confirmar" className="section" style={{ minHeight: "100vh", position: "relative" }}>
        {emailExists && !isUpdating ? (
          <div className="confirmation-message">
            <h2>Esse e-mail já foi usado para confirmar presença.</h2>
            <p>Se deseja mudar sua confirmação ou número de convidados, você pode abaixo:</p>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button
                onClick={() => {
                  setEmailExists(false);
                  setIsUpdating(true);
                }}
              >
                Alterar Confirmação
              </button>
              <button
                onClick={() => {
                  setEmailExists(false);
                  scrollToSection(0);
                }}
              >
                Voltar à página inicial
              </button>
            </div>
          </div>
        ) : submitted ? (
          <div className="confirmation-message">
            <h2>{vaiVir === "yes" ? "Obrigado por confirmar presença!" : "Sentiremos sua falta!"}</h2>
            <p>
              {vaiVir === "yes"
                ? "Estamos muito felizes que você irá compartilhar esse momento tão especial conosco."
                : "Que pena que você não poderá comparecer. Obrigada por nos avisar!"}
            </p>
            <small>
              Você será redirecionado para a página de{" "}
              <a href="/Presentes">Presentes</a> em {redirectCountdown} segundos...
            </small>
          </div>
        ) : (
          <>
            <h2>{isUpdating ? "Alterar Confirmação de Presença" : "Confirme sua Presença"}</h2>
            <form className="rsvp-form" onSubmit={handleRSVPSubmit}>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`toggle-option sim ${vaiVir === "yes" ? "selected" : ""}`}
                  onClick={() => setVaiVir("yes")}
                >
                  Sim
                </button>
                <button
                  type="button"
                  className={`toggle-option nao ${vaiVir === "no" ? "selected" : ""}`}
                  onClick={() => setVaiVir("no")}
                >
                  Não
                </button>
              </div>

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

              {(vaiVir === "yes" || isUpdating) && (
                <>
                  <input
                    type="number"
                    placeholder="Número de acompanhantes (incluindo você)"
                    required
                    value={acompanhantes}
                    onChange={(e) => setAcompanhantes(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Número de crianças"
                    value={criancas}
                    onChange={(e) => setCriancas(e.target.value)}
                  />
                </>
              )}

              <input
                type="text"
                placeholder="Mensagem (opcional)"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              />

              <button type="submit" disabled={vaiVir === null || submitting}>
                {isUpdating ? "Atualizar Confirmação" : "Enviar Confirmação"}
              </button>

              {!isUpdating && (
                <button
                  type="button"
                  className="update-button"
                  onClick={() => setIsUpdating(true)}
                >
                  Ou deseja alterar sua resposta?
                </button>
              )}

              {isUpdating && (
                <button
                  type="button"
                  className="update-button"
                  onClick={() => {
                    setIsUpdating(false);
                    setEmailExists(false);
                  }}
                >
                  Voltar para nova confirmação
                </button>
              )}
            </form>
          </>
        )}

        <div
          style={{
            position: "absolute",
            bottom: "65px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            justifyContent: "space-between",
            width: "120px",
            gap: "2px",
          }}
        >
          <Arrow direction="up" />
          <Arrow direction="down" />
        </div>
      </Element>

      <Element name="presentes" className="section" style={{ minHeight: "100vh", position: "relative" }}>
        <h2>Lista de Presentes</h2>
        <p>Se quiser nos presentear, fique à vontade para escolher um item da nossa Lista de Casamento e comprar pelo site ou, se preferir mais praticidade, utilize nossa chave PIX abaixo.</p>
        <p><strong>Chave PIX:</strong> 41999754987</p>
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
