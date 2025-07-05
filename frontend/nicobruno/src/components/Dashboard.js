import React from "react";
import NavBar from "./NavBar";

const Dashboard = () => {
  // // 🎯 Set the actual wedding date here once confirmed
  // const weddingDate = new Date("2026-01-15T15:00:00").getTime();

  return (
    <div>
      <NavBar className="NavBar" />
      <div className="content">
        <h1>Nicole & Bruno</h1>
        <h5>SAVE THE DATE</h5>
        <h2>15|01|2026</h2>
      </div>
    </div>
  );
};

export default Dashboard;
