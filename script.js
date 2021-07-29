let table = document.querySelector("table");

let computeTable = (isRecomputed=false) => {
    let windowHeight = window.innerHeight;
    let windowWidth = window.innerWidth;
    const borderSize = 400;  // set in CSS

    // need to initialize cellSize before defining it bc else it won't be 
    let cellSize = 20;  // set in CSS

    const verticalCellsQty = Math.ceil((windowHeight - borderSize) / (cellSize + 1));
    const horizontalCellsQty = Math.ceil((windowWidth - borderSize) / (cellSize + 1));
    // needed to add +1 to cellSize to account for cell border size
    
    
    let verticalRows = [];
    let horizontalCells = [];
    // generate each "cell"
    for (let i = 0; i < horizontalCellsQty; i++) {
        horizontalCells.push(
            `<td><div id="_${i}" class="cell"><div></div></div></td>`);
    }
    // use each cell to generate a row
    horizontalCells = horizontalCells.join("");
    for (let i = 0; i < verticalCellsQty; i++) {
        verticalRows.push(`<tr id="_${i}">${horizontalCells}</tr>`);
    }
    
    verticalRows = verticalRows.join("");
    
    
    /* Wait until after everything has been generated before
    rendering on screen
    */
    table.innerHTML = verticalRows;
};

computeTable();

// establishing automaton selection
let RCG = () => {
	let colorThings = "0123456789ABCDEF";
	let index;
	let color = "#";
	for (let i = 0; i < 6; i++) {
		index = Math.floor(Math.random() * 16);
		color = color.concat(colorThings[index]);
	}
	return color;
}

let renderAutomaton = element => {
	if (!element.classList.contains("automaton")) {
		element.classList.add("automaton");
		element.style.backgroundColor = RCG();
	}
	let childId = element.id;
	let parentId = element.parentNode.parentNode.id;
	automatonCoords.add([parseInt(parentId.substring(1)), parseInt(childId.substring(1))]);
};

let cells = document.querySelectorAll(".cell");
let isAutomatonReady = false;
cells.forEach( cell => {

	cell.addEventListener("mousedown", e => {
        e.preventDefault();
		renderAutomaton(cell);
		if (cell.classList.contains("automatonHighlighted")) {
			cell.classList.remove("automatonHighlighted");
		}
		isAutomatonReady = true;
	});

	cell.addEventListener("mouseenter", e => {
		if (isAutomatonReady) {
			renderAutomaton(cell);
		}
		else {
			e.target.classList.add("automatonHighlighted");
		}
	});

	cell.addEventListener("mouseleave", e => {
		if (!isAutomatonReady) {
			e.target.classList.remove("automatonHighlighted");
		}
	})
});

document.body.addEventListener("mouseup", e => {
    isAutomatonReady = false;
});


/*
GAME OF LIFE ALGORITHM
*/
let automatonCoords = new Set();  // [<number> , <number>]
let returnPerimeter = coords => {
    let [yCoord, xCoord] = coords;
    let perimeter = {
        N: [yCoord - 1, xCoord],
        NE: [yCoord - 1, xCoord + 1],
        E: [yCoord, xCoord + 1],
        SE: [yCoord + 1, xCoord + 1],
        S: [yCoord + 1, xCoord],
        SW: [yCoord + 1, xCoord - 1],
        W: [yCoord, xCoord - 1],
        NW: [yCoord - 1, xCoord - 1]
    };
    return perimeter;
};

let potentialNext = new Set();
let countNeighbors = (perimeter, justOnce=false) => {
    let neighbor;
    let n = 0;   // neighbor count
    for (let coord in perimeter) {
        let [parentId, childId] = perimeter[coord];
        neighbor = document.querySelector(`#_${parentId} #_${childId}`);
        try {
            if (neighbor.classList.contains("automaton")) {
                n++;
            }
            else {
                if (!justOnce) {
                    potentialNext.add(perimeter[coord]);  // REMEMBER TO FIX
                }
            }
        }
        catch (err) {
            console.log("Error: ", err);
        }
    }
    
    return n;
};

let areCellsBorn = nextArray => {
    let verifiedNext = new Set();
    nextArray.forEach(coord => {
        let perimeter = returnPerimeter(coord);
        let n = countNeighbors(perimeter, justOnce=true);
        if (n === 3) {
            verifiedNext.add([...coord]);
            automatonCoords.add([...coord]);  // add the new member to automatonCoords
        }
	})
	let babyCell;
    verifiedNext.forEach(coord => {
		babyCell = document.querySelector(`#_${coord[0]} #_${coord[1]}`)
		babyCell.classList.add("automaton");
		babyCell.style.backgroundColor = RCG();
    });
    verifiedNext.clear();
    potentialNext.clear();  // clear potentialNext for the next generation
};


let beginAutomaton = automatonCoords => {
    let generation = 0;
    // every interval below can be thought of as a new generation
    let automatonInterval = setInterval(() => {
        let choppingBlock = [];
        let useableCoords = [...automatonCoords].map(coord => [...coord]);
        
        useableCoords.forEach(coord => {
            let perimeter = returnPerimeter(coord);
            let n = countNeighbors(perimeter);
        
            if (n < 2 || n > 3) {
                choppingBlock.push(coord);
                
            }
        });
		areCellsBorn(potentialNext);
		let deadCell;
        choppingBlock.forEach(coord => {
            let [parentId, childId] = coord;
			deadCell = document.querySelector(`#_${parentId} #_${childId}`)
			deadCell.classList.remove("automaton");
			deadCell.style.backgroundColor = "initial";
            recalculateAutomata();
        })
        generation++;

    }, 200);

    return automatonInterval;
};


let recalculateAutomata = () => {
    automatonCoords.clear();
    let automata = document.querySelectorAll(".automaton");
    automata.forEach(a => {
        let childId = parseInt(a.id.substring(1));
        let parentId = parseInt(a.parentNode.parentNode.id.substring(1));
        automatonCoords.add([parentId, childId]);
    })
};

let buttonDown = element => {
	element.classList.remove("shadow");
};

let buttonUp = element => {
	element.classList.add("shadow");
}

let startBtn = document.querySelector(".startAutomaton");
let startInterval;
startBtn.addEventListener("mousedown", e => {
	buttonDown(e.target);
});

let powerIcon = document.querySelector("input[type='checkbox']");
powerIcon.onclick = e => e.preventDefault();

startBtn.addEventListener("mouseup", e => {
	e.preventDefault();
    if (powerIcon.checked != true) {
        startInterval = beginAutomaton(automatonCoords);
        powerIcon.checked = true;
    }
    buttonUp(e.target);
})

let stopBtn = document.querySelector(".stopAutomaton");
stopBtn.addEventListener("click", e => {
	clearInterval(startInterval);
    powerIcon.checked = false;
});

let resetBtn = document.querySelector(".resetGrid");
resetBtn.addEventListener("click", e => {
	cells.forEach( cell => {
		cell.classList.remove("automaton");
		cell.style.backgroundColor = "initial";
	})
	automatonCoords.clear();
	potentialNext.clear();
});


