import React, { Component } from "react";
// import { Route, Switch } from "react-router-dom";
import { Howl } from "howler";
import Cell from "./cell";
import "./styles.css";
import aiMove from "./audio/ai.wav";
import playerMove from "./audio/player.wav";
import aiWin from "./audio/ai_win.wav";
import draw from "./audio/draw.wav";
import notAllowed from "./audio/not_allowed.wav";

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

class Board extends Component {
  state = {
    board: ["", "", "", "", "", "", "", "", ""],
    game_state: "running",
    first_move: false,
    sound_on: true
  };

  SoundPlay = (src) => {
    const sound = new Howl({ src });
    if (this.state.sound_on) sound.play();
  };

  playFirstMove = async () => {
    await sleep(1000);

    // Computer plays first random move
    let board = ["", "", "", "", "", "", "", "", ""];
    const first_move = this.state.first_move;
    if (first_move) board[Math.floor(Math.random() * 9)] = "O";
    this.setState(
      {
        board: board,
        game_state: "running",
        first_move: !first_move
      },
      () => {
        if (first_move) this.SoundPlay(aiMove);
      }
    );
  };

  componentDidMount() {
    this.playFirstMove();
  }

  game_over = (board = undefined) => {
    if (board === undefined) board = this.state.board;

    // top-row
    if (board[0] === board[1] && board[1] === board[2]) {
      // console.log("top-row");
      if (board[0] === "X") return -1;
      if (board[0] === "O") return +1;
    }

    // mid-row
    if (board[3] === board[4] && board[4] === board[5]) {
      // console.log("mid-row");
      if (board[3] === "X") return -1;
      if (board[3] === "O") return +1;
    }

    // last-row
    if (board[6] === board[7] && board[7] === board[8]) {
      // console.log("last-row");
      if (board[6] === "X") return -1;
      if (board[6] === "O") return +1;
    }

    // left-col
    if (board[0] === board[3] && board[3] === board[6]) {
      // console.log("left-col");
      if (board[0] === "X") return -1;
      if (board[0] === "O") return +1;
    }

    // mid-col
    if (board[1] === board[4] && board[4] === board[7]) {
      // console.log("mid-col");
      if (board[1] === "X") return -1;
      if (board[1] === "O") return +1;
    }

    // right-col
    if (board[2] === board[5] && board[5] === board[8]) {
      // console.log("right-col");
      if (board[2] === "X") return -1;
      if (board[2] === "O") return +1;
    }

    // main-diagonal
    if (board[0] === board[4] && board[4] === board[8]) {
      // console.log("main-diagonal");
      if (board[0] === "X") return -1;
      if (board[0] === "O") return +1;
    }

    // secondary-diagonal
    if (board[2] === board[4] && board[4] === board[6]) {
      // console.log("secondary-diagonal");
      if (board[2] === "X") return -1;
      if (board[2] === "O") return +1;
    }

    if (board.every((v) => v === "O" || v === "X")) {
      return "draw";
    }

    return "running";
  };

  minimax = (board, depth, isComputerTurn) => {
    let score = this.game_over(board);
    if (score === +1) return { move: -1, score: +1 };
    if (score === -1) return { move: -1, score: -1 };
    if (score === "draw") return { move: -1, score: 0 };

    if (depth === 0)
      return { move: undefined, score: isComputerTurn ? -Infinity : +Infinity };

    let bestMove = undefined;
    let bestScore = isComputerTurn ? -Infinity : +Infinity;

    for (let i = 0; i < 9; i++) {
      if (isComputerTurn) {
        // computer's turn
        if (board[i] === "") {
          board[i] = "O";
          let obj = this.minimax(board, depth - 1, false);
          board[i] = "";

          if (obj.score > bestScore) {
            bestScore = obj.score;
            bestMove = i;
          }
        }
      } else {
        // player's turn
        if (board[i] === "") {
          board[i] = "X";
          let obj = this.minimax(board, depth - 1, true);
          board[i] = "";

          if (obj.score < bestScore) {
            bestScore = obj.score;
            bestMove = i;
          }
        }
      }
    }

    return { move: bestMove, score: bestScore };
  };



  nextMove = async (player_move) => {
    let board = this.state.board;

    if (
      board[player_move] !== "" ||
      this.state.game_state !== "running" ||
      this.state.game_state === "computing"
    ) {
      this.SoundPlay(notAllowed);
      return;
    }

    board[player_move] = "X";
    this.setState(
      {
        board: board,
        game_state: "computing"
      },
      () => this.SoundPlay(playerMove)
    );

    let game_state = this.game_over();

    if (game_state === -1) {
      this.setState({
        game_state: "player wins"
      });
      return;
    }

    if (game_state === "draw") {
      this.setState(
        {
          game_state: "draw"
        },
        () => this.SoundPlay(draw)
      );
      return;
    }

    await sleep(500);

    // Determine whether to make a mistake
    let makeMistake = Math.random() < 0.10;
    let obj;
    if (makeMistake) {
      // If making a mistake, choose a random move
      let emptyCells = board
        .map((val, index) => (val === "" ? index : null))
        .filter(val => val !== null);
      let randomMove = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      obj = { move: randomMove, score: 0 }; // No score calculation
    } else {
      // Optimal move
      obj = this.minimax(board, 9, true);
    }

    if (obj.move === undefined) {
      for (let i = 0; i < 9; i++) {
        if (board[i] === "") {
          board[i] = "O";
          break;
        }
      }
    } else {
      board[obj.move] = "O";
    }
    this.SoundPlay(aiMove);

    this.setState({
      board: board
    });

    let new_game_state = this.game_over();

    this.setState(
      {
        game_state:
          new_game_state === +1
            ? "computer wins"
            : new_game_state === "draw"
            ? "draw"
            : "running"
      },
      () => {
        if (this.state.game_state === "computer wins") this.SoundPlay(aiWin);
        if (this.state.game_state === "draw") this.SoundPlay(draw);
      }
    );
  };



  restart = () => {
    this.playFirstMove();
  };

  toggleSound = () => {
    this.setState({
      sound_on: !this.state.sound_on
    });
  };

  render() {
    return (
      <>
        <div className="board x" id="board">
          {this.state.board.map((val, index) => {
            return (
              <Cell
                key={index}
                val={val}
                index={index}
                nextMove={this.nextMove}
              />
            );
          })}
        </div>

        {/* SOUND BUTTON */}
        <div className="sound-div" onClick={this.toggleSound}>
          <div className="icon">
            <i
              className={
                "fas " +
                (this.state.sound_on ? "fa-volume-up" : "fa-volume-mute")
              }
            ></i>
          </div>
        </div>

        <div
          className={
            "winning-message " +
            (this.state.game_state !== "running" &&
            this.state.game_state !== "computing"
              ? "show"
              : "")
          }
          id="winningMessage"
        >
          <div data-winning-message-text>
            {this.state.game_state === "draw" && <p>DRAW</p>}
            {this.state.game_state === "player wins" && <p>PLAYER WINS</p>}
            {this.state.game_state === "computer wins" && <p>AI WINS</p>}
          </div>

          <button className="ripple" id="restartButton" onClick={this.restart}>
            Restart
          </button>
        </div>
      </>
    );
  }
}

export default Board;