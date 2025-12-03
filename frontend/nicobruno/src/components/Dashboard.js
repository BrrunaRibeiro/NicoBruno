import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import NavBar from "./NavBar";
import Countdown from "./Countdown";
import { Element, scroller } from "react-scroll";
import { ReactTyped } from "react-typed";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

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

  // ---- GIFTS / CART STATE ----
  const [cart, setCart] = useState({});
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");

  // ---- MUSIC STATE ----
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef(null);

  // order of sections
  const sections = useMemo(
    () => ["home", "informacoes", "confirmar", "countdown", "presentes"],
    []
  );

  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  console.log("Maps key test from React:", googleMapsApiKey);

  const scrollToSection = useCallback(
    (sectionIndex) => {
      scroller.scrollTo(sections[sectionIndex], {
        duration: 600,
        delay: 0,
        smooth: "easeInOutQuart",
      });
      setCurrentSection(sectionIndex);
    },
    [sections]
  );

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
      const response = await fetch(`${API_BASE_URL}/api/rsvp`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          acompanhantes: parseInt(acompanhantes || 0, 10),
          criancas: parseInt(criancas || 0, 10),
          mensagem,
          vai_vir: vaiVir === "yes",
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
      scrollToSection(4); // "presentes"
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
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          fontSize: "32px",
          fontWeight: "bold",
          backgroundColor: isUp
            ? "rgba(136, 136, 136, 1)"
            : "rgba(56, 56, 56, 1)",
          color: "white",
          borderRadius: "50%",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
        }}
      >
        {isUp ? "↑" : "↓"}
      </div>
    );
  };

  // -------- GIFTS CATALOG --------
  const giftCatalog = [
    {
      id: "pao_de_queijo_aeroporto",
      title: "Pão de queijo no aeroporto (kkk)",
      price: 189.8,
      imageUrl: "", // placeholder
    },
    {
      id: "garanta_novos_filhos",
      title: "Garanta novos filhos para os pais de planta",
      price: 289.2,
      imageUrl: "", // placeholder
    },
    {
      id: "prioridade_quarto_visitas",
      title:
        "Prioridade p/ dormir no quarto de visitas do casal (aproveita que só tem 1)",
      price: 319.0,
      imageUrl: "", // placeholder
    },
    {
      id: "taxa_buque",
      title: "Taxa pra noiva não jogar o buquê pra sua namorada",
      price: 355.82,
      imageUrl: "", // placeholder
    },
    {
      id: "alexa",
      title: "ALEXA (para ter mais alguém para mandar)",
      price: 382.0,
      imageUrl: "", // placeholder
    },
    {
      id: "um_ano_barba",
      title: "Um ano de barba feita para o noivo",
      price: 408.0,
      imageUrl: "", // placeholder
    },
    {
      id: "ajuda_dolar_viagem",
      title: "Ajuda para o casal comprar dólar para a viagem",
      price: 661.63,
      imageUrl: "", // placeholder
    },
    {
      id: "passagem_trem",
      title: "Passagem de trem entre países",
      price: 768.0,
      imageUrl: "", // placeholder
    },
    {
      id: "ajuda_pets",
      title: "Ajuda para custear os MUITOS pets do casal",
      price: 928.0,
      imageUrl: "", // placeholder
    },
    {
      id: "hotel_5_estrelas_lua_de_mel",
      title: "Contribuição para um hotel 5 estrelas na lua de mel",
      price: 972.64,
      imageUrl: "", // placeholder
    },
    {
      id: "ajuda_mobiliar_casa",
      title: "Ajuda para mobiliar a casa",
      price: 1300.0,
      imageUrl: "", // placeholder
    },
    {
      id: "ajuda_motorhome",
      title: "Ajuda para o casal sonhar com o motor home",
      price: 1410.05,
      imageUrl: "", // placeholder
    },
    {
      id: "adote_um_boleto",
      title: "Adote um boleto",
      price: 1530.0,
      imageUrl: "", // placeholder
    },
    {
      id: "passeio_balao",
      title: "Passeio de balão para o casal",
      price: 1650.0,
      imageUrl: "", // placeholder
    },
    {
      id: "um_dia_spa",
      title: "Um dia no spa para o casal",
      price: 1760.0,
      imageUrl: "", // placeholder
    },
    {
      id: "upgrades_fiji",
      title: "Dois upgrades nas passagens aéreas para ilhas Fiji",
      price: 2700.0,
      imageUrl: "", // placeholder
    },
    {
      id: "chale_montanhas",
      title: "Hospedagem em um chalé nas montanhas",
      price: 3630.0,
      imageUrl: "", // placeholder
    },
    {
      id: "upgrade_primeira_classe",
      title: "UPGRADE primeira classe",
      price: 4420.0,
      imageUrl: "", // placeholder
    },
    {
      id: "patrocine_lua_de_mel",
      title: "Patrocine a lua de mel dos noivos",
      price: 5406.72,
      imageUrl: "", // placeholder
    },
    {
      id: "ir_junto_lua_de_mel",
      title: "Poder ir junto com os noivos para a lua de mel",
      price: 6687.84,
      imageUrl: "", // placeholder
    },
  ];

  // ---- CART HELPERS ----
  const addToCart = (gift) => {
    setCart((prev) => {
      const existing = prev[gift.id];
      const quantity = existing ? existing.quantity + 1 : 1;
      return {
        ...prev,
        [gift.id]: { ...gift, quantity },
      };
    });
  };

  const removeFromCart = (giftId) => {
    setCart((prev) => {
      const existing = prev[giftId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const { [giftId]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [giftId]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  const clearCart = () => setCart({});

  const handleCartIconClick = useCallback(() => {
    const presentsIndex = sections.indexOf("presentes");
    if (presentsIndex !== -1) {
      scrollToSection(presentsIndex);
    }
  }, [sections, scrollToSection]);


  const cartItems = Object.values(cart);

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const cartItemCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );


  // ---- MUSIC TOGGLE ----
  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsMusicPlaying(true))
        .catch((err) => {
          console.warn("Não foi possível iniciar a música:", err);
        });
    }
  };

  // ---- MERCADO PAGO CHECKOUT ----
  const handleMercadoPagoCheckout = async () => {
    if (cartItems.length === 0) {
      setCheckoutMessage("Escolha pelo menos um presente antes de continuar.");
      return;
    }

    setCheckoutLoading(true);
    setCheckoutMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/mercadopago/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            id: item.id,
            title: item.title,
            unit_price: item.price,
            quantity: item.quantity,
          })),
          nome,
          email,
          mensagem,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Erro no checkout Mercado Pago:", data);
        setCheckoutMessage(
          data.erro || "Não foi possível iniciar o pagamento agora."
        );
        return;
      }

      if (data.init_point) {
        window.location.href = data.init_point;
      } else if (data.preferenceId) {
        window.location.href = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${data.preferenceId}`;
      } else {
        setCheckoutMessage(
          "Resposta inesperada do servidor. Tente novamente em alguns instantes."
        );
      }
    } catch (err) {
      console.error("Erro de rede no checkout:", err);
      setCheckoutMessage("Erro de rede ao iniciar o pagamento.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div>
      <NavBar cartCount={cartItemCount} onCartClick={handleCartIconClick} />

      {/* Background music – put your mp3 in /public/audio/ */}
      <audio
        ref={audioRef}
        src="/audio/wedding-nicobrunosong.mp3"   // ⬅ only this!
        preload="auto"
        loop
      />


      {/* Floating music toggle button */}
      <button
        type="button"
        className="music-toggle-btn"
        onClick={toggleMusic}
        aria-label={isMusicPlaying ? "Pausar música" : "Tocar música"}
      >
        {isMusicPlaying ? "⏸" : "♪"}
      </button>

      {/* HOME */}
      <Element
        name="home"
        className="section"
        style={{ minHeight: "100vh", position: "relative" }}
      >
        <div className="home-content">
          <div className="text-left">
            <h1>Nicole &amp; Bruno</h1>
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
          <Arrow direction="down" />
        </div>
      </Element>

      {/* INFORMAÇÕES */}
      <Element
        name="informacoes"
        className="section"
        style={{
          minHeight: "100vh",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "3rem",
            maxWidth: "1200px",
            width: "100%",
            flexWrap: "wrap",
          }}
        >
          {/* Left Column: Typed message */}
          <div id="typed-text" style={{ flex: "1 1 400px" }}>
            <ReactTyped
              strings={[
                "<h3>Família e amigos queridos,</h3>" +
                "Com grande emoção e carinho, convidamos vocês para celebrar conosco um dos momentos mais especiais de nossas vidas:  ^900 o nosso casamento...   ^1000" +
                "<br><br>" +
                "Criamos este espaço para tornar tudo mais simples: informações, presentes e um convite aberto para comemorar ao nosso lado.  ^500" +
                "<br>" +
                "Ficaremos muito felizes em contar com sua presença, por isso, não deixe de confirmar através do menu ‘Confirmar Presença’.  ^500" +
                "<br><br>" +
                "Contamos com vocês ^100 e mal podemos esperar para celebrar juntos!  ^1000" +
                "<br><br>" +
                "Com carinho," +
                "<p id='signature'> ^400 Nicole e Bruno.</p",
              ]}
              typeSpeed={35}
              backSpeed={0}
              showCursor={false}
              loop={false}
            />
          </div>
          {/* Right Column: Map, address, dress code */}
          <div className="info-details"
            style={{
              flex: "1 1 400px",
              opacity: 0,
              animation: "fadeIn 1s ease-in forwards",
              animationDelay: "34.5s",
            }}
          >
            <h2>Cerimônia &amp; Recepção</h2>
            <h3>28 de Março de 2026, às 11:00h.</h3>
            <h4 style={{ marginBottom: "0.1rem" }}>Dress Code</h4>
            <h5>
              Pode deixar o paletó e a gravata em casa! Nosso casamento será em
              clima leve e descontraído, e pede apenas um traje esporte fino,
              com aquele toque de conforto que combina perfeitamente com a
              festa.
            </h5>
            <h4 style={{ marginBottom: "0.1rem" }}>Local</h4>
            <h5>
              📍
              <strong>
                <a
                  href="https://www.google.com/maps/place/Rua+Joao+Wicki+263,+Jardim+Sao+Carlos,+Almirante+Tamandare+-+PR,+83507-254"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chácara Refúgio do Vale
                </a>
              </strong>{" "}
              Rua João Wicki, 263 - Jardim São Carlos, Almirante Tamandaré - PR,
              83507-254
            </h5>
            <div
              style={{
                marginTop: "1rem",
                borderRadius: "12px",
                overflow: "hidden",
                opacity: 0,
                animation: "fadeIn 1s ease-in forwards",
                animationDelay: "2.5s",
              }}
            >
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

      {/* CONFIRMAR PRESENÇA */}
      <Element
        name="confirmar"
        className="section"
        style={{ minHeight: "100vh", position: "relative" }}
      >
        {emailExists && !isUpdating ? (
          <div className="confirmation-message">
            <h2>Esse e-mail já foi usado para confirmar presença.</h2>
            <p>
              Se deseja mudar sua confirmação ou número de convidados, você pode
              abaixo:
            </p>
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
            <h2>
              {vaiVir === "yes"
                ? "Obrigado por confirmar presença!"
                : "Sentiremos sua falta!"}
            </h2>
            <p>
              {vaiVir === "yes"
                ? "Estamos muito felizes que você irá compartilhar esse momento tão especial conosco."
                : "Que pena que você não poderá comparecer. Obrigada por nos avisar!"}
            </p>
            <small>
              Você será redirecionado para a página de{" "}
              <a href="/Presentes">Presentes</a> em {redirectCountdown}{" "}
              segundos...
            </small>
          </div>
        ) : (
          <>
            <h2>
              {isUpdating
                ? "Alterar Confirmação de Presença"
                : "Confirme sua Presença"}
            </h2>
            <form className="rsvp-form" onSubmit={handleRSVPSubmit}>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`toggle-option sim ${vaiVir === "yes" ? "selected" : ""
                    }`}
                  onClick={() => setVaiVir("yes")}
                >
                  Sim
                </button>
                <button
                  type="button"
                  className={`toggle-option nao ${vaiVir === "no" ? "selected" : ""
                    }`}
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
                {isUpdating
                  ? "Atualizar Confirmação"
                  : "Enviar Confirmação"}
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

      {/* COUNTDOWN */}
      <Element
        name="countdown"
        className="section"
        style={{ minHeight: "100vh", position: "relative" }}
      >
        <Countdown date="2026-03-28T11:00:00" />
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

      {/* LISTA DE PRESENTES */}
      <Element
        name="presentes"
        className="section"
        style={{
          minHeight: "100vh",
          position: "relative",
        }}
      >
        <h2>Lista de Presentes</h2>
        <p style={{ maxWidth: "720px", margin: "0 auto 1rem" }}>
          Se quiser nos presentear, fique à vontade para escolher um presente
          abaixo. Você pode pagar diretamente aqui no site usando cartão,
          boleto ou Pix via Mercado Pago. Se preferir, também deixamos nossa
          chave Pix direta.
        </p>

        {/* Pix direto */}
        <div
          style={{
            maxWidth: "800px",
            margin: "1rem auto 2rem",
            backgroundColor: "white",
            padding: "1.5rem 1.75rem",
            borderRadius: "16px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
          }}
        >
          <h3>Pix direto</h3>
          <p style={{ marginBottom: "0.4rem" }}>
            Se você preferir, também pode nos presentear diretamente pelo Pix:
          </p>
          <p style={{ fontWeight: "bold" }}>Chave Pix: 41999754987</p>
        </div>

        {/* Gifts + Cart layout */}
        <div
          style={{
            maxWidth: "1120px",
            margin: "0 auto",
            display: "flex",
            gap: "2rem",
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          {/* Gifts grid */}
          <div style={{ flex: "2 1 420px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3 style={{ margin: 0 }}>Presentes</h3>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {giftCatalog.map((gift) => (
                <div
                  key={gift.id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    padding: "1.2rem 1rem 1rem",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "220px",
                  }}
                >
                  <div>
                    {/* placeholder for future image */}
                    {gift.imageUrl && (
                      <img
                        src={gift.imageUrl}
                        alt={gift.title}
                        style={{
                          width: "100%",
                          height: "140px",
                          objectFit: "cover",
                          borderRadius: "12px",
                          marginBottom: "0.6rem",
                        }}
                      />
                    )}
                    <h4
                      style={{
                        marginBottom: "0.6rem",
                        fontSize: "1rem",
                        minHeight: "3rem",
                      }}
                    >
                      {gift.title}
                    </h4>
                    <p
                      style={{
                        fontWeight: "bold",
                        marginBottom: "0.8rem",
                        fontSize: "0.95rem",
                      }}
                    >
                      R${" "}
                      {gift.price
                        .toFixed(2)
                        .replace(".", ",")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart(gift)}
                    style={{
                      marginTop: "auto",
                      padding: "0.55rem 0.9rem",
                      borderRadius: "999px",
                      border: "none",
                      backgroundColor: "#444",
                      color: "white",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                    }}
                  >
                    Presentear
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div style={{ flex: "1 1 280px" }}>
            <h3 style={{ marginTop: 0 }}>Carrinho</h3>
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "1rem 1.25rem",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                minHeight: "150px",
              }}
            >
              {cartItems.length === 0 ? (
                <p style={{ fontSize: "0.95rem" }}>
                  Seu carrinho ainda está vazio. Escolha um presente para continuar..
                </p>
              ) : (
                <>
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      marginBottom: "0.8rem",
                    }}
                  >
                    {cartItems.map((item) => (
                      <li
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <div>
                          <span style={{ fontSize: "0.93rem" }}>
                            {item.title}
                          </span>
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "#777",
                            }}
                          >
                            x{item.quantity}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            style={{
                              width: "26px",
                              height: "26px",
                              borderRadius: "50%",
                              border: "none",
                              marginRight: "0.3rem",
                              cursor: "pointer",
                            }}
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => addToCart(item)}
                            style={{
                              width: "26px",
                              height: "26px",
                              borderRadius: "50%",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            +
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <hr />
                  <p style={{ fontWeight: "bold", marginTop: "0.6rem" }}>
                    Total: R${" "}
                    {cartTotal
                      .toFixed(2)
                      .replace(".", ",")}
                  </p>

                  <button
                    type="button"
                    onClick={handleMercadoPagoCheckout}
                    disabled={checkoutLoading}
                    style={{
                      marginTop: "0.6rem",
                      width: "100%",
                      padding: "0.65rem 1rem",
                      borderRadius: "999px",
                      border: "none",
                      backgroundColor: checkoutLoading ? "#999" : "#222",
                      color: "white",
                      fontWeight: "bold",
                      cursor: checkoutLoading ? "default" : "pointer",
                    }}
                  >
                    {checkoutLoading
                      ? "Redirecionando para pagamento..."
                      : "Prosseguir com o pagamento"}
                  </button>
                  <button
                    type="button"
                    onClick={clearCart}
                    style={{
                      marginTop: "0.4rem",
                      width: "100%",
                      padding: "0.45rem 1rem",
                      borderRadius: "999px",
                      border: "1px solid #ccc",
                      backgroundColor: "white",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Limpar carrinho
                  </button>
                  {checkoutMessage && (
                    <p
                      style={{
                        marginTop: "0.5rem",
                        fontSize: "0.85rem",
                        color: "#b00020",
                      }}
                    >
                      {checkoutMessage}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom arrows */}
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
        </div>
      </Element>
    </div>
  );
};

export default Dashboard;
