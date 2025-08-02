import React, { useState, useEffect, useCallback } from "react";

const Countdown = ({ date }) => {
  const calculateTimeLeft = useCallback(() => {
    const targetDate = new Date(date);
    const now = new Date();
    const difference = targetDate - now;

    let timeLeft = {};
    if (difference > 0) {
      timeLeft = {
        dias: Math.floor(difference / (1000 * 60 * 60 * 24)),
        horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutos: Math.floor((difference / 1000 / 60) % 60),
        segundos: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  }, [date]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  return (
    <div className="countdown-container">
      <h3 className="countdown-title">CONTAGEM REGRESSIVA</h3>
      <div className="countdown-grid">
        <div className="box dias">
          <span className="number">{timeLeft.dias ?? "00"}</span>
          <span className="label">dias</span>
        </div>
        <div className="box horas">
          <span className="number">{timeLeft.horas ?? "00"}</span>
          <span className="label">horas</span>
        </div>
        <div className="box minutos">
          <span className="number">{timeLeft.minutos ?? "00"}</span>
          <span className="label">minutos</span>
        </div>
        <div className="box segundos">
          <span className="number">{timeLeft.segundos ?? "00"}</span>
          <span className="label">segundos</span>
        </div>
      </div>
    </div>
  );
};

export default Countdown;
