import './App.css';
import React, {useCallback, useEffect, useState} from 'react';

window.addEventListener("mousedown",function(){
  //alert("down");
});

window.addEventListener("mouseup",function(){
  //alert("up");
})

const Cell = (props) => {
  const handleMouseOver = event => {
    if(props.mouse===1){
      props.add(props.x,props.y)
    }else if(props.mouse===2){
      props.remove(props.x,props.y)
    }
  }
  return (
    <div draggable="false" onMouseDown={()=>{props.down();props.click()}} onMouseOver={event => handleMouseOver(event)} className={`cell ${props.alive}`} style={{"gridColumn":props.col, "gridRow":props.row}} ></div>
  );
}

const Grid = (props) => {
  const [mouse, setMouse] = useState(0); //0 is up, 1 is down on dead, 2 is down on live

  const handleMouseDownAlive = event => {
    //console.log("down")
    setMouse(2);
  }

  const handleMouseDownDead = event => {
    //console.log("down")
    setMouse(1);
  }

  const handleMouseUp = event => {
    //console.log("up")
    setMouse(0);
  }

  let actualX = 0;
  let actualY = 0;
  let g = [];
  for(let x=1; x<74; x++){
    for(let y=1; y<36; y++){
      if(props.cells[actualX+(x-1)]&&props.cells[actualX+(x-1)][actualY+(y-1)]){
        g.push(<Cell key={`${x},${y}`} x={actualX+(x-1)} y={actualY+(y-1)} down={handleMouseDownAlive} add={props.addCell} remove={props.removeCell} mouse={mouse} row={y} col={x} alive={"alive"} click={() => props.click(actualX+(x-1),actualY+(y-1),"alive")} />)
      }else{
        g.push(<Cell key={`${x},${y}`} x={actualX+(x-1)} y={actualY+(y-1)} down={handleMouseDownDead} add={props.addCell} remove={props.removeCell} mouse={mouse} row={y} col={x} alive={"dead"} click={() => props.click(actualX+(x-1),actualY+(y-1),"dead")} />)
      }
    }  
  }

  return (
    <div className="grid" draggable="false" onMouseUp={event => handleMouseUp(event)}>
      {g}
    </div>
  );
}

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function useForceUpdate(){
  const [value, setValue] = useState(0); // integer state
  return () => setValue(value + 1); // update the state to force render
}

function App() {
  const [cells, setCells] = useState({
    26:{16:1},
    27:{17:1},
    28:{15:1,16:1,17:1},
  });
  const [speed, setSpeed] = useState(200);
  const [paused, setPaused] = useState(true);
  //const [backupGrid, setBackupGrid] = useState(cells)
  const forceUpdate = useForceUpdate();

  const nextOrgGen = useCallback(() => {
      function getSurroundingCoords(x,y){
        x = parseInt(x);
        y = parseInt(y);
        return [
            {"x":x-1,"y":y-1},
            {"x":x-1,"y":y},
            {"x":x-1,"y":y+1},
            {"x":x,"y":y-1},
            {"x":x,"y":y+1},
            {"x":x+1,"y":y-1},
            {"x":x+1,"y":y},
            {"x":x+1,"y":y+1},
        ];
      }
    
      function getSurroundingAlive(x,y){
          let alive = 0;
          for(let pair of getSurroundingCoords(x,y)){
              if(cells[pair["x"]]&&cells[pair["x"]][pair["y"]]===1) alive++;
          }
          return alive;
      }

      let newCells = {};
      for(let x in cells){
          for(let y in cells[x]){
              let alive = getSurroundingAlive(x,y);
              if(alive===2||alive===3){
                  newCells[x] = newCells[x]||{};
                  newCells[x][y] = 1;
              }
              for(let pair of getSurroundingCoords(x,y)){
                  if(getSurroundingAlive(pair["x"],pair["y"])===3){
                      newCells[pair["x"]] = newCells[pair["x"]]||{};
                      newCells[pair["x"]][pair["y"]] = 1;
                  }
              }
          }
      }

      setCells(newCells);
      //forceUpdate();
  },[cells])

  useEffect(() => {
    if(!paused){
      const interval = setInterval(() => {
        nextOrgGen();
      }, speed);
      return () => clearInterval(interval);
    }
    
  }, [nextOrgGen,speed,paused]);

  const addOrgCell = (x,y) => {
      let newCells = cells;
      newCells[x]=newCells[x]||{};
      newCells[x][y] = 1;
      setCells(newCells);
      forceUpdate()
  }

  const removeCell = (x,y) => {
    let newCells = cells;
    if(newCells[x]&&newCells[x][y]){
      delete newCells[x][y];
      if(JSON.stringify(newCells[x])==="{}") delete newCells[x];
      setCells(newCells)
    }
    forceUpdate()
  }

  const nextButtonClick = (x,y,alive) => {
    if(alive==="alive"){
      removeCell(x,y);
    }else{
      addOrgCell(x,y);
    }
  }

  const speedButtonClick = () => {
    setSpeed(Math.floor(parseFloat(prompt("Enter speed in miliseconds"))))
  }

  const pauseButtonClick = () => {
    //paused&&
    setPaused(!paused);
  }

  const exportCells = () => {
    download("Cells.txt",JSON.stringify(cells))
  }

  const importCells = () => {
    var input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => {
      var file = e.target.files[0];
      var reader = new FileReader();
      reader.readAsText(file,'UTF-8');
      reader.onload = readerEvent => {
        var content = readerEvent.target.result;
        try{
          JSON.parse(content)
          setCells(JSON.parse(content));
        }catch{
          alert("This is not a grid file");
        }
      }
    };
    input.click();
  }

  return (
    <div className="App">
      <Grid cells={cells} addCell={addOrgCell} removeCell={removeCell} click={nextButtonClick}/>
      <button onClick={() => pauseButtonClick()}>{paused?"Unp":"P"}ause</button>
      <button onClick={() => nextOrgGen()}>Next</button>
      <button onClick={() => speedButtonClick()} id={"speedButton"}>Set Speed</button>
      <button onClick={() => setCells({})}>Reset</button>
      <button onClick={() => exportCells()}>Export Grid</button>
      <button onClick={() => importCells()}>Import Grid</button>
      <button onClick={() => console.log(cells)}>Log Cells</button>
      {/*<div hidden={true} onLoad={() => window.setTimeout(nextOrgGen,1000)}></div>*/}
    </div>
  );
}

export default App;
