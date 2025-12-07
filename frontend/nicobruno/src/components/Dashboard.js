// Dashboard.js
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import NavBar from "./NavBar";
import Countdown from "./Countdown";
import { Element, scroller } from "react-scroll";
import { ReactTyped } from "react-typed";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

// Max characters for recado / mensagem
const MAX_RECADOS_CHARS = 220;

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

  // ---- UPDATE FLOW (2 steps: lookup -> edit) ----
  // updateStage: "idle" | "lookup" | "edit"
  const [updateStage, setUpdateStage] = useState("idle");
  const [updateLookupEmail, setUpdateLookupEmail] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");

  // ---- GIFTS / CART STATE ----
  const [cart, setCart] = useState({});
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");

  // ---- PIX COPY FEEDBACK ----
  const [pixCopied, setPixCopied] = useState(false);

  // ---- MUSIC STATE ----
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef(null);
  const DEFAULT_VOLUME = 0.05; // 5% volume

  // ---- PAGE LOADER (images preloading) ----
  const [pageReady, setPageReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState({ done: 0, total: 0 });

  // ---- RECADOS CAROUSEL STATE ----
  const [recados, setRecados] = useState([]);
  const [recadosLoading, setRecadosLoading] = useState(true);
  const [currentRecadoIndex, setCurrentRecadoIndex] = useState(0);

  // ✅ order: home -> typedsection -> informacoes -> confirmar -> presentes
  const sections = useMemo(
    () => ["home", "typedsection", "informacoes", "confirmar", "presentes"],
    []
  );

  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

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

  // ---------- START / RESET UPDATE FLOW ----------
  const startUpdateFlow = (prefilledEmail = "") => {
    setIsUpdating(true);
    setEmailExists(false);
    setSubmitted(false);
    setUpdateStage("lookup");
    setUpdateLookupEmail(prefilledEmail || "");
    setUpdateError("");

    // Clear form so we don't leak previous values
    setNome("");
    setEmail("");
    setAcompanhantes("");
    setCriancas("");
    setMensagem("");
    setVaiVir(null);
  };

  const resetToNewConfirmation = () => {
    setIsUpdating(false);
    setEmailExists(false);
    setUpdateStage("idle");
    setUpdateLookupEmail("");
    setUpdateError("");

    setNome("");
    setEmail("");
    setAcompanhantes("");
    setCriancas("");
    setMensagem("");
    setVaiVir(null);
  };

  // ---------- LOOKUP EXISTING RSVP BY EMAIL ----------
  const handleUpdateLookup = async (e) => {
    e.preventDefault();
    if (!updateLookupEmail || updateLoading) return;

    setUpdateLoading(true);
    setUpdateError("");

    try {
      // expects backend: GET /api/rsvp?email=...
      const res = await fetch(
        `${API_BASE_URL}/api/rsvp?email=${encodeURIComponent(updateLookupEmail)}`
      );

      if (!res.ok) {
        if (res.status === 404) {
          setUpdateError(
            "Não encontramos uma confirmação com esse e-mail. Confira se digitou corretamente ou faça uma nova confirmação."
          );
        } else {
          setUpdateError(
            "Ocorreu um erro ao buscar sua confirmação. Tente novamente em instantes."
          );
        }
        return;
      }

      const data = await res.json();

      setEmail(data.email || updateLookupEmail);
      setNome(data.nome || "");
      setVaiVir(data.vai_vir ? "yes" : "no");

      setAcompanhantes(
        data.acompanhantes !== undefined && data.acompanhantes !== null
          ? String(data.acompanhantes)
          : ""
      );
      setCriancas(
        data.criancas !== undefined && data.criancas !== null
          ? String(data.criancas)
          : ""
      );
      setMensagem(data.mensagem || "");

      setUpdateStage("edit");
    } catch (err) {
      console.error("Erro ao buscar confirmação:", err);
      setUpdateError("Erro de rede ao buscar sua confirmação.");
    } finally {
      setUpdateLoading(false);
    }
  };

  // ---------- SUBMIT (CREATE OR UPDATE) ----------
  const handleRSVPSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (vaiVir === null) return;

    setSubmitting(true);

    try {
      const method = isUpdating ? "PUT" : "POST";
      const response = await fetch(`${API_BASE_URL}/api/rsvp`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          acompanhantes:
            vaiVir === "yes" ? parseInt(acompanhantes || 0, 10) : 0,
          criancas: vaiVir === "yes" ? parseInt(criancas || 0, 10) : 0,
          mensagem,
          vai_vir: vaiVir === "yes",
        }),
      });

      if (!isUpdating && response.status === 409) {
        // first-time confirmation with email already used
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

  // ---- COPY PIX KEY + 1.5s FEEDBACK ----
  const copyPixKey = async () => {
    const pixKey = "41999754987";

    try {
      await navigator.clipboard.writeText(pixKey);
    } catch (err) {
      const textarea = document.createElement("textarea");
      textarea.value = pixKey;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCheckoutMessage("");
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 1500);
  };

  // ---- REDIRECT AFTER SUBMIT ----
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

  // ✅ IntersectionObserver uses IDs; Elements have matching id props
  useEffect(() => {
    const els = sections.map((id) => document.getElementById(id)).filter(Boolean);
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (best?.target?.id) {
          const idx = sections.indexOf(best.target.id);
          if (idx !== -1) setCurrentSection(idx);
        }
      },
      { threshold: [0.5, 0.6, 0.7] }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections]);

  // ---- DISABLE TYPED ON SMALL SCREENS ----
  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== "undefined" ? window.innerWidth < 426 : false
  );

  useEffect(() => {
    const onResize = () => setIsSmallScreen(window.innerWidth < 426);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const disableTyping = isSmallScreen;

  // ---- TYPED -> then show countdown ----
  const [showTypedCountdown, setShowTypedCountdown] = useState(disableTyping);

  const handleTypedComplete = useCallback(() => {
    setTimeout(() => setShowTypedCountdown(true), 450);
  }, []);

  useEffect(() => {
    if (disableTyping) {
      const t = setTimeout(() => setShowTypedCountdown(true), 200);
      return () => clearTimeout(t);
    }
    setShowTypedCountdown(false);
  }, [disableTyping]);

  const typedStrings = useMemo(
    () => [
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
        "<br><br>" +
        "<p id='signature'>Nicole e Bruno.</p>",
    ],
    []
  );

  // -------- GIFTS CATALOG (memoized) --------
  const giftCatalog = useMemo(
    () => [
      {
        id: "pao_de_queijo_aeroporto",
        title: "Pão de queijo no aeroporto 😂",
        price: 189.8,
        imageUrl: `${process.env.PUBLIC_URL}/1.jpg`,
      },
      {
        id: "garanta_novos_filhos",
        title: "Garanta novos filhos para os pais de plantas",
        price: 289.2,
        imageUrl: `${process.env.PUBLIC_URL}/2.jpg`,
      },
      {
        id: "prioridade_quarto_visitas",
        title:
          "Prioridade para dormir no quarto de visitas do casal (aproveita que só tem 1)",
        price: 319.0,
        imageUrl: `${process.env.PUBLIC_URL}/3.jpg`,
      },
      {
        id: "taxa_buque",
        title: "Taxa pra noiva não jogar o buquê pra sua namorada",
        price: 355.82,
        imageUrl: `${process.env.PUBLIC_URL}/4.jpg`,
      },
      {
        id: "alexa",
        title: "ALEXA (para ter mais alguém para mandar)",
        price: 382.0,
        imageUrl: `${process.env.PUBLIC_URL}/5.jpg`,
      },
      {
        id: "um_ano_barba",
        title: "Um ano de barba feita para o noivo",
        price: 408.0,
        imageUrl: `${process.env.PUBLIC_URL}/6.jpg`,
      },
      {
        id: "ajuda_dolar_viagem",
        title: "Ajuda para o casal comprar dólar para a viagem",
        price: 661.63,
        imageUrl: `${process.env.PUBLIC_URL}/7.jpg`,
      },
      {
        id: "passagem_trem",
        title: "Passagem de trem entre países",
        price: 768.0,
        imageUrl: `${process.env.PUBLIC_URL}/8.jpg`,
      },
      {
        id: "ajuda_pets",
        title: "Ajuda para custear os MUITOS pets do casal",
        price: 928.0,
        imageUrl: `${process.env.PUBLIC_URL}/9.jpg`,
      },
      {
        id: "hotel_5_estrelas_lua_de_mel",
        title: "Contribuição para um hotel 5 estrelas na lua de mel",
        price: 972.64,
        imageUrl: `${process.env.PUBLIC_URL}/10.jpg`,
      },
      {
        id: "ajuda_mobiliar_casa",
        title: "Ajuda para mobiliar a casa",
        price: 1300.0,
        imageUrl: `${process.env.PUBLIC_URL}/11.jpg`,
      },
      {
        id: "ajuda_motorhome",
        title: "Ajuda para o casal sonhar com o motor home",
        price: 1410.05,
        imageUrl: `${process.env.PUBLIC_URL}/12.avif`,
      },
      {
        id: "adote_um_boleto",
        title: "Adote um boleto",
        price: 1530.0,
        imageUrl: `${process.env.PUBLIC_URL}/13.jpg`,
      },
      {
        id: "passeio_balao",
        title: "Passeio de balão para o casal",
        price: 1650.0,
        imageUrl: `${process.env.PUBLIC_URL}/14.jpg`,
      },
      {
        id: "um_dia_spa",
        title: "Um dia no spa para o casal",
        price: 1760.0,
        imageUrl: `${process.env.PUBLIC_URL}/15.jpg`,
      },
      {
        id: "upgrades_fiji",
        title: "Dois upgrades nas passagens aéreas para ilhas Fiji",
        price: 2700.0,
        imageUrl: `${process.env.PUBLIC_URL}/16.jpg`,
      },
      {
        id: "chale_montanhas",
        title: "Hospedagem em um chalé nas montanhas",
        price: 3630.0,
        imageUrl: `${process.env.PUBLIC_URL}/17.jpeg`,
      },
      {
        id: "upgrade_primeira_classe",
        title: "UPGRADE primeira classe",
        price: 4420.0,
        imageUrl: `${process.env.PUBLIC_URL}/18.jpeg`,
      },
      {
        id: "patrocine_lua_de_mel",
        title: "Patrocine a lua de mel dos noivos",
        price: 5406.72,
        imageUrl: `${process.env.PUBLIC_URL}/19.jpg`,
      },
      {
        id: "ir_junto_lua_de_mel",
        title: "Poder ir junto com os noivos para a lua de mel",
        price: 6687.84,
        imageUrl: `${process.env.PUBLIC_URL}/20.jpg`,
      },
      {
        id: "controles_video_game",
        title: "2 controles de video game para não ter briga",
        price: 726.94,
        imageUrl: `${process.env.PUBLIC_URL}/21.jpg`,
      },
      {
        id: "ajuda_financeira_futuro",
        title: "Ajuda financeira para o futuro do casal",
        price: 508.46,
        imageUrl: `${process.env.PUBLIC_URL}/22.jpg`,
      },
      {
        id: "ajuda_mobiliar_casa_500",
        title: "Ajuda para mobiliar a casa",
        price: 569.7,
        imageUrl: `${process.env.PUBLIC_URL}/11.jpg`,
      },
      {
        id: "ajuda_euro_viagem",
        title: "Ajuda. para os noivos comprarem euro pra viagem",
        price: 611.63,
        imageUrl: `${process.env.PUBLIC_URL}/24.jpg`,
      },
      {
        id: "aulas_meditacao",
        title: "Aulas de meditação",
        price: 451.52,
        imageUrl: `${process.env.PUBLIC_URL}/25.jpg`,
      },
      {
        id: "belas_obras_arte",
        title: "Belas obras de arte para decorar a casa",
        price: 486.63,
        imageUrl: `${process.env.PUBLIC_URL}/26.jpg`,
      },
      {
        id: "cafeteira_eletrica",
        title:
          "Cafeteira elétrica p/ acordar c/ cheiro de café(ajude a sustentar o vicio)",
        price: 775.51,
        imageUrl: `${process.env.PUBLIC_URL}/27.jpg`,
      },
      {
        id: "churrasqueira_legumes",
        title: "Churrasqueira para legumes dos vegetarianos",
        price: 993.7,
        imageUrl: `${process.env.PUBLIC_URL}/28.jpg`,
      },
      {
        id: "compra_euro_viagem",
        title: "Compra de euro para a viagem",
        price: 827.93,
        imageUrl: `${process.env.PUBLIC_URL}/29.jpg`,
      },
      {
        id: "contribuicao_reforma_casa",
        title: "Contribuição para a reforma da casa",
        price: 854.55,
        imageUrl: `${process.env.PUBLIC_URL}/30.jpg`,
      },
      {
        id: "coral_aleluia",
        title: 'Coral pra cantar "Aleluia" na entrada do noivo',
        price: 689.34,
        imageUrl: `${process.env.PUBLIC_URL}/31.jpg`,
      },
      {
        id: "cota_restaurantes_luxo",
        title: "Cota para garantir restaurantes de luxo na viagem",
        price: 656.29,
        imageUrl: `${process.env.PUBLIC_URL}/32.jpg`,
      },
      {
        id: "jantar_primeiro_mes",
        title: "Garanta o jantar durante o 1° mês de casados",
        price: 797.58,
        imageUrl: `${process.env.PUBLIC_URL}/33.jpg`,
      },
      {
        id: "hospedagem_3_noites",
        title: "Hospedagem para 3 noites",
        price: 1333.86,
        imageUrl: `${process.env.PUBLIC_URL}/34.jpg`,
      },
      {
        id: "hospedagem_5_noites",
        title: "Hospedagem para 5 noites",
        price: 4001.58,
        imageUrl: `${process.env.PUBLIC_URL}/35.jpg`,
      },
      {
        id: "incentivo_balada",
        title: "incentivo para noivos voltarem a frequentar balada",
        price: 953.2,
        imageUrl: `${process.env.PUBLIC_URL}/36.jpg`,
      },
      {
        id: "lava_loucas_inox",
        title: "Lava Louças em Inox (PARA AJUDAR O NOIVO)",
        price: 4715.8,
        imageUrl: `${process.env.PUBLIC_URL}/37.jpg`,
      },
      {
        id: "passagem_aerea_1848",
        title: "Passagem aérea",
        price: 2240.85,
        imageUrl: `${process.env.PUBLIC_URL}/38.jpg`,
      },
      {
        id: "passagem_aerea_2200",
        title: "Passagem aérea",
        price: 2670.72,
        imageUrl: `${process.env.PUBLIC_URL}/39.jpg`,
      },
      {
        id: "observacao_aves_exoticas",
        title: "Passeio para observação de aves exóticas",
        price: 269.72,
        imageUrl: `${process.env.PUBLIC_URL}/40.jpg`,
      },
      {
        id: "patrocinio_lua_de_mel_2420",
        title: "Patrocinio da lua de mel do casal",
        price: 2934.49,
        imageUrl: `${process.env.PUBLIC_URL}/41.jpg`,
      },
      {
        id: "piscina_mor_splash_fun",
        title: "Piscina Mor Splash Fun",
        price: 3131.31,
        imageUrl: `${process.env.PUBLIC_URL}/42.jpg`,
      },
      {
        id: "prioridade_quarto_visita_684",
        title: "Prioridade no quarto de visita na casa dos noivos",
        price: 779.35,
        imageUrl: `${process.env.PUBLIC_URL}/43.jpg`,
      },
      {
        id: "quadro_picasso",
        title: "Quadro basico de Picasso",
        price: 344.38,
        imageUrl: `${process.env.PUBLIC_URL}/44.jpg`,
      },
      {
        id: "sessao_compras_relaxante",
        title: "Sessão relaxante de compras para o casal",
        price: 793.02,
        imageUrl: `${process.env.PUBLIC_URL}/45.jpg`,
      },
      {
        id: "trilha_com_guia",
        title: "Trilha com um guia",
        price: 632.15,
        imageUrl: `${process.env.PUBLIC_URL}/46.jpg`,
      },
      {
        id: "visita_ilha_casal",
        title: "Visita a uma ilha para o casal",
        price: 1467.25,
        imageUrl: `${process.env.PUBLIC_URL}/47.jpg`,
      },
    ],
    []
  );

  // ---- PRELOAD IMAGES THEN SHOW PAGE ----
  useEffect(() => {
    let cancelled = false;

    const urls = [
      `${process.env.PUBLIC_URL}/sunset-nicobruno.webp`,
      `${process.env.PUBLIC_URL}/dresscodephoto.webp`,
      `${process.env.PUBLIC_URL}/local-photo.webp`,
      ...giftCatalog.map((g) => g.imageUrl).filter(Boolean),
    ];

    setLoadProgress({ done: 0, total: urls.length });
    setPageReady(false);

    const preloadImage = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          if (!cancelled)
            setLoadProgress((p) => ({ ...p, done: p.done + 1 }));
          resolve(true);
        };
        img.onerror = () => {
          if (!cancelled)
            setLoadProgress((p) => ({ ...p, done: p.done + 1 }));
          resolve(false);
        };
        img.src = src;
      });

    Promise.all(urls.map(preloadImage)).then(() => {
      if (!cancelled) setPageReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [giftCatalog]);

  // ---- FETCH RECADOS FROM BACKEND ----
  useEffect(() => {
    const fetchRecados = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rsvp/messages`);
        if (!res.ok) {
          throw new Error("Falha ao carregar recados");
        }
        const data = await res.json();
        setRecados(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao buscar recados:", err);
        setRecados([]);
      } finally {
        setRecadosLoading(false);
      }
    };

    fetchRecados();
  }, []);

  // ---- AUTO ROTATE RECADOS EVERY 3.5s ----
  useEffect(() => {
    if (recadosLoading || recados.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentRecadoIndex((prev) =>
        recados.length ? (prev + 1) % recados.length : 0
      );
    }, 3500); // 3.5s

    return () => clearInterval(interval);
  }, [recadosLoading, recados]);

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

    const audio = audioRef.current;
    audio.volume = DEFAULT_VOLUME;

    if (isMusicPlaying) {
      audio.pause();
      setIsMusicPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsMusicPlaying(true))
        .catch((err) =>
          console.warn("Não foi possível iniciar a música:", err)
        );
    }
  };

  // ---- RECADOS CAROUSEL CONTROLS ----
  const showNextRecado = () => {
    setCurrentRecadoIndex((prev) =>
      recados.length ? (prev + 1) % recados.length : 0
    );
  };

  const showPrevRecado = () => {
    setCurrentRecadoIndex((prev) =>
      recados.length ? (prev - 1 + recados.length) % recados.length : 0
    );
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
      const response = await fetch(
        `${API_BASE_URL}/api/mercadopago/checkout`,
        {
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
        }
      );

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

  // ---- LOADER OVERLAY (before rendering page) ----
  if (!pageReady) {
    return (
      <div className="page-loader">
        <div className="page-loader-card">
          <div className="spinner" />
          <h3>
            Carregando...{" "}
            {loadProgress.total > 0
              ? `${Math.round(
                  (loadProgress.done / loadProgress.total) * 100
                )}%`
              : ""}
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar
        cartCount={cartItemCount}
        cartItems={cartItems}
        cartTotal={cartTotal}
        onCartAdd={addToCart}
        onCartRemove={removeFromCart}
        onCartClear={clearCart}
        onCartCheckout={handleMercadoPagoCheckout}
      />

      <audio
        ref={audioRef}
        src="/audio/wedding-nicobrunosong.mp3"
        preload="auto"
        loop
        autoPlay
        onLoadedMetadata={() => {
          if (audioRef.current) {
            audioRef.current.volume = DEFAULT_VOLUME;
          }
        }}
      />

      <button
        type="button"
        className="music-toggle-btn"
        onClick={toggleMusic}
        aria-label={isMusicPlaying ? "Pausar música" : "Tocar música"}
      >
        {isMusicPlaying ? "⏸" : "♪"}
      </button>

      {/* 1) HOME */}
      <Element
        name="home"
        id="home"
        className="section"
        style={{ minHeight: "100vh", position: "relative" }}
      >
        <div className="home-content">
          <div className="text-left">
            <img
              src="/logonicobruno.webp"
              alt="Logo(Nicole e Bruno)"
              width="90%"
              id="logo"
              loading="lazy"
              decoding="async"
            />
            <h5 className="savethedate" id="savedatetext">
              SAVE THE DATE
            </h5>
            <h2 className="savethedate">28|03|2026</h2>
          </div>
          <div className="image-right">
            <img
              src="/sunset-nicobruno.webp"
              alt="Nicole & Bruno"
              id="sidephoto"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        <div className="nav-arrows">
          <Arrow direction="down" />
        </div>
      </Element>

      {/* 2) typedsection = typed text + countdown (SIDE-BY-SIDE) */}
      <Element
        name="typedsection"
        id="typedsection"
        className="section info-section"
        style={{ minHeight: "100vh", position: "relative" }}
      >
        <div className="info-columns typedsection-columns">
          {/* LEFT: Typed */}
          <div id="typed-text" className="typed-wrapper">
            {disableTyping ? (
              <div className="typed-static">
                <h3>Família e amigos queridos,</h3>
                <p>
                  Com grande emoção e carinho, convidamos vocês para celebrar
                  conosco um dos momentos mais especiais de nossas vidas: o nosso
                  casamento...
                </p>
                <p>
                  Criamos este espaço para tornar tudo mais simples: informações,
                  presentes e um convite aberto para comemorar ao nosso lado.
                </p>
                <p>
                  Ficaremos muito felizes em contar com sua presença, por isso,
                  não deixe de confirmar através do menu “Confirmar Presença”.
                </p>
                <p>
                  Contamos com vocês e mal podemos esperar para celebrar juntos!
                </p>
                <p>Com carinho,</p>
                <p id="signature">Nicole e Bruno.</p>
              </div>
            ) : (
              <ReactTyped
                strings={typedStrings}
                typeSpeed={20}
                backSpeed={0}
                showCursor={false}
                loop={false}
                onComplete={handleTypedComplete}
              />
            )}
          </div>

          {/* RIGHT: Countdown (fade-in after typing ends) */}
          <div
            className={`typed-countdown ${showTypedCountdown ? "show" : ""}`}
          >
            <Countdown date="2026-03-28T07:00:00" />
          </div>
        </div>
        <div className="nav-arrows">
          <Arrow direction="up" />
          <Arrow direction="down" />
        </div>
      </Element>

      {/* 3) informacoes = Cerimônia + Local + Dress Code */}
      <Element
        name="informacoes"
        id="informacoes"
        className="section info-only-section"
        style={{ minHeight: "100vh", position: "relative" }}
      >
        <div className="info-only-grid">
          {/* LEFT */}
          <div className="info-only-column">
            <h2 className="playfair" style={{ margin: "0 0 0.35rem 0" }}>
              Cerimônia &amp; Recepção
            </h2>
            <h3
              style={{
                margin: "0 0 2 .2rem 0",
                fontStyle: "italic",
                fontWeight: 500,
              }}
            >
              28 de Março de 2026, às 11:00h.
            </h3>
            <img
              src="/localimage.jpeg"
              alt="Local do casamento"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              style={{
                width: "100%",
                maxWidth: "420px",
                height: "auto",
                borderRadius: "12px",
                display: "block",
                margin: "0.5rem auto 0.8rem",
              }}
            />
            <h3 className="info-only-title">Local</h3>
            <p className="info-only-body" style={{ alignSelf: "center" }}>
              📍{" "}
              <strong>
                <a
                  href="https://www.google.com/maps/place/Rua+Joao+Wicki+263,+Jardim+Sao+Carlos,+Almirante+Tamandare+-+PR,+83507-254"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--dark-gray)" }}
                >
                  Chácara Refúgio do Vale
                </a>
                <br />
              </strong>{" "}
              Rua João Wicki, 263 - Jardim São Carlos, Almirante Tamandaré - PR,
              83507-254
            </p>
            <div className="map-wrap">
              <iframe
                title="Chácara Refúgio do Vale"
                src={`https://www.google.com/maps/embed/v1/directions?key=${googleMapsApiKey}&origin=My+Location&destination=Rua+Joao+Wicki+263,+Jardim+Sao+Carlos,+Almirante+Tamandare+-+PR,+83507-254&zoom=14`}
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* RIGHT */}
          <div className="info-only-column" style={{ alignSelf: "center" }}>
            <h3 className="info-only-title playfair">Dress Code</h3>
            <p className="info-only-body">
              Pode deixar o paletó e a gravata em casa! Nosso casamento será em
              clima leve e descontraído, e pede apenas um traje esporte fino, com
              aquele toque de conforto que combina perfeitamente com a festa.
            </p>

            <img
              src="/dresscodephoto.webp"
              alt="Dress Code Suggestion"
              id="dresscodephoto"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        <div className="nav-arrows">
          <Arrow direction="up" />
          <Arrow direction="down" />
        </div>
      </Element>

      {/* 4) CONFIRMAR PRESENÇA */}
      <Element
        name="confirmar"
        id="confirmar"
        className="section"
        style={{ minHeight: "100vh", position: "relative" }}
      >
        {/* Title outside flex, centered above both columns */}
        <h2 className="confirm-title">
          {isUpdating ? "Alterar Confirmação de Presença" : "Confirme sua Presença"}
        </h2>

        <div className="confirmar-layout">
          {/* LEFT: Recados */}
          {!recadosLoading && recados.length > 0 && (
            <div className="recados-wrapper">
              <div className="recados-card">
                <div className="recados-message">
                  <h3 className="recados-title">RECADOS DOS CONVIDADOS</h3>

                  {recados.length > 0 && (
                    <>
                      <p className="recados-text">
                        “{recados[currentRecadoIndex].mensagem}”
                      </p>
                      <p className="recados-author">
                        — {recados[currentRecadoIndex].nome}
                      </p>
                    </>
                  )}
                </div>

                <div className="recados-controls">
                  <button
                    type="button"
                    className="recados-arrow-btn"
                    onClick={showPrevRecado}
                    aria-label="Recado anterior"
                  >
                    ‹
                  </button>
                  <span className="recados-index">
                    {currentRecadoIndex + 1} / {recados.length}
                  </span>
                  <button
                    type="button"
                    className="recados-arrow-btn"
                    onClick={showNextRecado}
                    aria-label="Próximo recado"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RIGHT: RSVP form / messages */}
          <div style={{ flex: "1 1 380px", maxWidth: "520px" }}>
            {emailExists && !isUpdating ? (
              // Conflict card when trying to create a NEW RSVP with an existing email
              <div className="confirmation-message">
                <h2>Esse e-mail já foi usado para confirmar presença.</h2>
                <p>
                  Se deseja mudar sua confirmação ou número de convidados, você
                  pode abaixo:
                </p>
                <div
                  style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}
                >
                  <button
                    onClick={() => {
                      startUpdateFlow(email);
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
              // After successful submit
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
            ) : isUpdating && updateStage === "lookup" ? (
              // STEP 1: lookup existing RSVP by email
              <form className="rsvp-form" onSubmit={handleUpdateLookup}>
                <p id="vocevira" style={{ textAlign: "center" }}>
                  Digite o e-mail que você usou na confirmação inicial:
                </p>

                <input
                  type="email"
                  placeholder="E-mail que você usou na confirmação inicial"
                  required
                  value={updateLookupEmail}
                  onChange={(e) => setUpdateLookupEmail(e.target.value)}
                />

                {updateError && (
                  <p
                    style={{
                      color: "#b00020",
                      fontSize: "0.9rem",
                      marginTop: "0.2rem",
                    }}
                  >
                    {updateError}
                  </p>
                )}

                <button
                  type="submit"
                  className={`btn-primary ${
                    updateLoading || !updateLookupEmail ? "disabled" : ""
                  }`}
                  disabled={updateLoading || !updateLookupEmail}
                >
                  {updateLoading
                    ? "Buscando sua confirmação..."
                    : "Buscar minha confirmação"}
                </button>

                <button
                  type="button"
                  className="update-button"
                  onClick={resetToNewConfirmation}
                >
                  Voltar para nova confirmação
                </button>
              </form>
            ) : (
              // STEP 2 (updateStage === "edit") OR normal new confirmation
              <form className="rsvp-form" onSubmit={handleRSVPSubmit}>
                <p id="vocevira">Você virá ao casamento?</p>

                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-option sim ${
                      vaiVir === "yes" ? "selected" : ""
                    }`}
                    onClick={() => setVaiVir("yes")}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    className={`toggle-option nao ${
                      vaiVir === "no" ? "selected" : ""
                    }`}
                    onClick={() => setVaiVir("no")}
                  >
                    Não
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Seu nome completo"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={isUpdating && updateStage === "edit"}
                />
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isUpdating && updateStage === "edit"}
                />

                {/* ✅ ONLY show adults/kids when vaiVir === "yes"
                    (both for new confirmations and updates) */}
                {vaiVir === "yes" && (
                  <>
                    <input
                      type="number"
                      placeholder="Número de adultos (incluindo você)"
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
                  placeholder={`Recado para os noivos (opcional, até ${MAX_RECADOS_CHARS} caracteres)`}
                  value={mensagem}
                  maxLength={MAX_RECADOS_CHARS}
                  onChange={(e) => setMensagem(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && e.preventDefault()
                  }
                />

                <button
                  type="submit"
                  className={`btn-primary ${
                    vaiVir === null || submitting ? "disabled" : ""
                  }`}
                  disabled={vaiVir === null || submitting}
                >
                  {isUpdating ? "Atualizar Confirmação" : "Enviar Confirmação"}
                </button>

                {!isUpdating && (
                  <button
                    type="button"
                    className="update-button"
                    onClick={() => startUpdateFlow(email)}
                  >
                    Ou deseja alterar sua resposta?
                  </button>
                )}

                {isUpdating && (
                  <button
                    type="button"
                    className="update-button"
                    onClick={resetToNewConfirmation}
                  >
                    Voltar para nova confirmação
                  </button>
                )}
              </form>
            )}
          </div>
        </div>

        <div className="nav-arrows">
          <Arrow direction="up" />
          <Arrow direction="down" />
        </div>
      </Element>

      {/* 5) LISTA DE PRESENTES */}
      <Element
        name="presentes"
        id="presentes"
        className="section"
        style={{ minHeight: "100vh", position: "relative" }}
      >
        <h2>Lista de Presentes</h2>
        <p
          style={{ maxWidth: "80%", margin: "0 auto 1rem", textAlign: "center" }}
        >
          Se quiser nos presentear, fique à vontade para escolher um item da
          nossa Lista de Casamento e comprar pelo site ou, se preferir mais
          praticidade, utilize nossa chave PIX abaixo.
        </p>

        <div
          style={{
            maxWidth: "800px",
            minHeight: "135px",
            margin: "1rem auto 2rem",
            backgroundColor: "#ffffff8f",
            padding: "1.2rem 2.75rem",
            borderRadius: "16px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
            textAlign: "center",
          }}
        >
          <h3 style={{ textAlign: "center" }}>Pix</h3>

          <div
            role="button"
            tabIndex={0}
            onClick={copyPixKey}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && copyPixKey()
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              fontWeight: "bold",
              cursor: "pointer",
              userSelect: "none",
              padding: "10px 12px",
              borderRadius: "12px",
              border: "1px solid rgba(0,0,0,0.12)",
              background: "rgba(255,255,255,0.75)",
            }}
            aria-label="Clique para copiar a chave Pix"
            title="Clique para copiar"
          >
            <span>Chave: 41999754987</span>

            <span
              aria-hidden="true"
              style={{ width: 18, height: 18, display: "inline-block" }}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: "block" }}
              >
                <path
                  d="M8 7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V7Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 17H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
          <br />
          {pixCopied && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 700,
                fontSize: "0.95rem",
                color: "#2e7d32",
              }}
            >
              <span>Copiado</span>
              <span
                aria-hidden="true"
                style={{ fontSize: "1rem", lineHeight: 1 }}
              >
                ✓
              </span>
            </span>
          )}
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
                    {gift.imageUrl && (
                      <img
                        src={gift.imageUrl}
                        alt={gift.title}
                        loading="lazy"
                        decoding="async"
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
                      R$ {gift.price.toFixed(2).replace(".", ",")}
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
          <div className="gift-cart-column" style={{ flex: "1 1 280px" }}>
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
                  Seu carrinho ainda está vazio. Escolha um presente para
                  continuar..
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
                            style={{ fontSize: "0.8rem", color: "#777" }}
                          >
                            x{item.quantity}
                          </div>
                        </div>
                        <div
                          style={{ display: "flex", alignItems: "center" }}
                        >
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
                    Total: R$ {cartTotal.toFixed(2).replace(".", ",")}
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

        <div className="nav-arrows">
          <Arrow direction="up" />
        </div>
      </Element>
    </div>
  );
};

export default Dashboard;
