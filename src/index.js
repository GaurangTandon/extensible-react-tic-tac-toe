import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

const CONSTS = {
    X: "X",
    O: "O",
    B: ""
};

function Square(props) {
    return (
        <button
            className="square"
            onClick={function() {
                props.handleClick(+props.i, +props.j);
            }}
        >
            {props.text}
        </button>
    );
}

class Board extends React.Component {
    static generateBoard(rows, cols) {
        return [...new Array(rows)].map(x => [...new Array(cols)].map(y => CONSTS.B));
    }
    static generateWinningPositions(rows, cols) {
        var out = [];

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                let iplus2 = i + 2 < rows,
                    iminus2 = i - 2 >= 0,
                    jplus2 = j + 2 < cols;
                if (iplus2) out.push([[i, j], [i + 1, j], [i + 2, j]]);
                if (jplus2) out.push([[i, j], [i, j + 1], [i, j + 2]]);
                if (iplus2 && jplus2) out.push([[i, j], [i + 1, j + 1], [i + 2, j + 2]]);
                if (iminus2 && jplus2) out.push([[i, j], [i - 1, j + 1], [i - 2, j + 2]]);
            }
        }

        return out;
    }

    static checkWinner(winningPos, board) {
        var winChar = CONSTS.B,
            isWinning = winningPos.some(function(pos) {
                let char = board[pos[0][0]][pos[0][1]];
                if (char === CONSTS.B) return false;
                if (char === board[pos[1][0]][pos[1][1]] && char === board[pos[2][0]][pos[2][1]]) {
                    winChar = char;
                    return true;
                }
                return false;
            }, this);

        return [isWinning, winChar];
    }

    static checkDraw(board) {
        console.log(board);
        for (let i = 0, rows = board.length, cols = board[0].length; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (board[i][j] === CONSTS.B) return false;
            }
        }

        return true;
    }

    /**
     *
     * @param {Number} i
     * @param {Number} j
     * @param {String} text
     * @param {String} key
     */
    getSquare(i, j, text, key) {
        return <Square i={i} j={j} key={key} handleClick={this.props.handleClick} text={text} />;
    }

    render() {
        const status = this.props.status,
            rows = [];

        this.props.board.forEach((row, index) => {
            rows.push(
                <div className="board-row" key={index}>
                    {row.map((x, i) => this.getSquare(index, i, x, index + "" + i))}
                </div>
            );
        });

        return (
            <div>
                <div className="status">{status}</div>
                {rows}
            </div>
        );
    }
}

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.rows = 3;
        this.cols = 3;
        this.moves = [CONSTS.X, CONSTS.O];
        this.state = {
            board: Board.generateBoard(this.rows, this.cols),
            nextMarker: 0
        };
        this.state.status = this.status;
        this.winningPos = Board.generateWinningPositions(this.rows, this.cols);

        this.winner = CONSTS.B;
    }

    get status() {
        if (this.gameFinished) {
            if (this.winner !== CONSTS.B) return `The winner is ${this.winner}`;
            else return "The game is a draw";
        } else return `Next player: ${this.moves[this.state.nextMarker]}`;
    }

    /**
     * cannot mutate grid values directly
     * @param {*} grid
     * @param {*} i
     * @param {*} j
     * @param {*} val
     */
    mutate(grid, i, j, val) {
        grid[i][j] = val;
        return grid;
    }

    /**
     * in case you wanted to play tictactoe with more than two friends (symbols)
     * on a larger board, you can do so via this method
     * @param {Number} marker current position in this.moves
     */
    getNextMarker(marker) {
        return marker < this.moves.length - 1 ? marker + 1 : 0;
    }

    /**
     * index of square that was clicked
     * @param {Number} i
     * @param {Number} j
     */
    handleBoardClick(i, j) {
        // clicking on already clicked square has no effect
        if (this.state.board[i][j] !== CONSTS.B) return true;
        if (this.gameFinished) return true;

        this.setState(
            function(prevState, props) {
                return {
                    board: this.mutate(prevState.board, i, j, this.moves[prevState.nextMarker]),
                    nextMarker: this.getNextMarker(prevState.nextMarker)
                };
            },
            function() {
                var win = Board.checkWinner(this.winningPos, this.state.board);
                if (win[0]) {
                    this.gameFinished = true;
                    this.winner = win[1];
                } else if (Board.checkDraw(this.state.board)) {
                    this.gameFinished = true;
                }
                this.setState({ status: this.status });
            }.bind(this)
        );
    }

    render() {
        return (
            <div className="game">
                <div className="game-board">
                    <Board
                        handleClick={this.handleBoardClick.bind(this)}
                        board={this.state.board}
                        status={this.status}
                    />
                </div>
                <div className="game-info">
                    <ol>{}</ol>
                </div>
            </div>
        );
    }
}

// ========================================

ReactDOM.render(<Game />, document.getElementById("root"));
