import React from 'react';
import styled from 'styled-components';

const paths = {
  up: "M23 8 L8 32 H38 Z",          // triangle up
  down: "M23 32 L8 8 H38 Z",        // triangle down
  left: "M8 20 L32 8 V32 Z",        // triangle left
  right: "M32 20 L8 8 V32 Z",       // triangle right
};

const AnimatedArrowButton = ({ direction = 'down', onClick }) => {
  const path = paths[direction] || paths.down;

  return (
    <Wrapper onClick={onClick}>
      <button className="button">
        <div className="button-box">
          <svg viewBox="0 0 46 40" xmlns="http://www.w3.org/2000/svg">
            <path d={path} />
          </svg>
        </div>
      </button>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  .button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    background-color: transparent;
    border: none;
    outline: none;
    cursor: pointer;
    position: relative;
  }

  .button:before,
  .button:after {
    content: "";
    position: absolute;
    border-radius: 50%;
    inset: 7px;
  }

  .button:before {
    border: 4px solid #ffffff;
    transition: opacity 0.4s ease, transform 0.5s ease;
  }

  .button:after {
    border: 4px solid #ffffff;
    transform: scale(1.3);
    opacity: 0;
    transition: opacity 0.4s ease, transform 0.5s ease;
  }

  .button:hover:before,
  .button:focus:before {
    opacity: 0;
    transform: scale(0.7);
  }

  .button:hover:after,
  .button:focus:after {
    opacity: 1;
    transform: scale(1);
  }

  .button-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
  }

  svg {
    width: 100%;
    height: 100%;
    fill: white;
  }
`;

export default AnimatedArrowButton;
