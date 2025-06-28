import React from "react";
import NavBar from "./NavBar";
import Countdown from "./Countdown";


const Dashboard = () => {
    return (
        <div>
            <NavBar class={"NavBar"}/>
            <h1>Nicole & Bruno</h1>
            <h5>SAVE THE DATE</h5>
            <h2>00|00|2026</h2>
            <Countdown class={"Countdown"}></Countdown>
        </div>
    );
}

export default Dashboard;