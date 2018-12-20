import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

const CONSTS = {
    X: "X",
    O: "O",
    B: ""
};

/**
 * @param {Number[][]} arr
 */
function arrayCopy(arr) {
    var out = [];
    for (var i = 0, len = arr.length; i < len; i++) {
        if (Array.isArray(arr[i])) out.push(arrayCopy(arr[i]));
        else out.push(arr[i]);
    }
    return out;
}

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
    /**
     * return a blank board of size rows x cols
     * @param {Number} rows
     * @param {Number} cols
     */
    static generateBoard(rows, cols) {
        return [...new Array(rows)].map(x => [...new Array(cols)].map(y => CONSTS.B));
    }

    /**
     * generate an array of all winning positions
     * for a board of size rows x cols
     * @param {Number} rows
     * @param {Number} cols
     */
    static generateWinningPositions(rows, cols) {
        var out = [],
            CONSEC_REQUIRED = 3;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                let iCanGoForward = i + CONSEC_REQUIRED - 1 < rows,
                    iCanGoBackward = i - (CONSEC_REQUIRED - 1) >= 0,
                    jCanGoForward = j + CONSEC_REQUIRED - 1 < cols;
                if (iCanGoForward) out.push([[i, j], [i + 1, j], [i + 2, j]]);
                if (jCanGoForward) out.push([[i, j], [i, j + 1], [i, j + 2]]);
                if (iCanGoForward && jCanGoForward) out.push([[i, j], [i + 1, j + 1], [i + 2, j + 2]]);
                if (iCanGoBackward && jCanGoForward) out.push([[i, j], [i - 1, j + 1], [i - 2, j + 2]]);
            }
        }

        return out;
    }

    /**
     * Checks, given a list of winning positions, whether any player is winning
     * on the board.
     * @param {Number[][][]} winningPos
     * @param {String[][]} board
     */
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

    /**
     * Check if the given board indicates a drawn state i.e.
     * the board has no extra place for a player left.
     * (assumes that there is no winner, so it may return true
     *  if at last move player wins.)
     * @param {Character[][]} board
     */
    static boardIsFull(board) {
        for (let i = 0, rows = board.length, cols = board[0].length; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (board[i][j] === CONSTS.B) return false;
            }
        }

        return true;
    }

    /**
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
        this.rows = this.props.rows || 3;
        this.cols = this.props.cols || 3;
        this.moves = this.props.moves || [CONSTS.X, CONSTS.O, "Z", "Y"];
        var board = Board.generateBoard(this.rows, this.cols);
        this.state = {
            board: arrayCopy(board),
            nextMarker: 0,
            moveHistory: [arrayCopy(board)],
            moveHistoryStart: 2,
            moveHistoryEnd: 1
        };
        this.state.status = this.status;
        this.winningPos = Board.generateWinningPositions(this.rows, this.cols);

        this.winner = CONSTS.B;
    }

    /**
     * Returns current status text displayed at the top of the board.
     */
    get status() {
        if (this.gameFinished) {
            if (this.winner !== CONSTS.B) return `The winner is ${this.winner}`;
            else return "The game is a draw";
        } else return `Next player: ${this.moves[this.state.nextMarker]}`;
    }

    /**
     * cannot mutate grid state value directly
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
     * @param {Number} currMarker current position in this.moves
     */
    getNextMarker(currMarker) {
        return currMarker < this.moves.length - 1 ? currMarker + 1 : 0;
    }

    /**
     * Update board on each click. Clicking a filled square or one
     * whose game is finished does not do anything.
     * @param {Number} i row index of square that was clicked
     * @param {Number} j column index of square that was clicked
     */
    handleBoardClick(i, j) {
        // clicking on already clicked square has no effect
        if (this.state.board[i][j] !== CONSTS.B) return true;
        if (this.gameFinished) return true;

        // this function has a callback to the callback o.O
        this.setState(
            function(prevState, props) {
                return {
                    board: this.mutate(prevState.board, i, j, this.moves[prevState.nextMarker])
                };
            },
            // first callback
            function() {
                this.setState(
                    {
                        status: this.status,
                        moveHistory: this.state.moveHistory
                            .slice(0, this.state.moveHistoryEnd)
                            .concat([arrayCopy(this.state.board)]), // store a copy to avoid mutation
                        moveHistoryEnd: this.state.moveHistoryEnd + 1
                    },
                    // second callback
                    x => this.setNextPlayer()
                );
            }.bind(this)
        );
    }

    /**
     * Set the next player state for the given board state (nextMarker).
     * If there is a winner or game is drawn, indicate that game is finished.
     */
    setNextPlayer() {
        var win = Board.checkWinner(this.winningPos, this.state.board),
            nextMarker;
        if (win[0]) {
            this.gameFinished = true;
            this.winner = win[1];
        } else if (Board.boardIsFull(this.state.board)) {
            this.gameFinished = true;
            this.winner = CONSTS.B;
        } else {
            this.gameFinished = false;
            nextMarker = (this.state.moveHistoryEnd - this.state.moveHistoryStart + 1) % this.moves.length;
        }

        this.setState({
            status: this.status,
            nextMarker
        });
    }

    /**
     * Set board to the board obtained after said move number
     * i.e. gotoMove(1) gives board after first move.
     * Also recomputes next player accordingly.
     * @param {Number} moveNumber
     */
    gotoMove(moveNumber) {
        this.setState(
            { moveHistoryEnd: moveNumber + 1, board: arrayCopy(this.state.moveHistory[moveNumber]) },
            function() {
                this.setNextPlayer();
            }
        );
    }

    /**
     * resets board to blank
     */
    resetBoard() {
        this.gotoMove(0);
    }

    /**
     * moves the board one state behind
     */
    undoBoard() {
        if (this.state.moveHistoryEnd > 1) this.gotoMove(this.state.moveHistoryEnd - 2);
        else alert("Already at last move");
    }

    /**
     * moves the board one state ahead
     */
    redoBoard() {
        if (this.state.moveHistoryEnd < this.state.moveHistory.length) this.gotoMove(this.state.moveHistoryEnd);
        else alert("Already at latest move");
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
                    <button onClick={x => this.resetBoard()}>Reset board</button>
                    <button onClick={x => this.undoBoard()}>Undo </button>
                    <button onClick={x => this.redoBoard()}>Redo</button>
                    <ol>
                        {this.state.moveHistory
                            .slice(this.state.moveHistoryStart, this.state.moveHistoryEnd)
                            .map((x, index) => (
                                <li key={index + 1}>
                                    <button onClick={x => this.gotoMove(index + 1)}>Goto move {index + 1}</button>
                                </li>
                            ))}
                    </ol>
                </div>
            </div>
        );
    }
}

// ========================================

ReactDOM.render(<Game />, document.getElementById("root"));
