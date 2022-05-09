import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Box, Container, Typography } from "@mui/material";
import Player, { Vector } from "./components/Player";

function App() {
  const [position, setPosition] = useState<Vector>(new Vector(0, 0));
  const [velocity, setVelocity] = useState<Vector>(new Vector(0, 0));
  const [acceleration, setAcceleration] = useState<Vector>(new Vector(0, 0));
  const [fps, setFps] = useState(0);
  const [caughtKeys, setCaughtKeys] = useState<Set<string>>(new Set());
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const playerRef = useRef<Player>(null!);

  const radius = 30;
  const ratio = window.devicePixelRatio ?? 1;
  const canvasWidth = 800 * ratio;
  const canvasHeight = 600 * ratio;

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = canvasWidth;
      canvasRef.current.height = canvasHeight;
      playerRef.current = new Player(
        canvasRef.current,
        canvasWidth / 2 - radius,
        canvasHeight - radius,
        radius,
        updateDisplayValues,
      );
      playerRef.current.draw();
    }
  }, [canvasRef, canvasWidth, canvasHeight]);

  function updateDisplayValues(position: Vector, velocity: Vector, acceleration: Vector, fps: number) {
    setPosition(position);
    setVelocity(velocity);
    setAcceleration(acceleration);
    setFps(fps);
  }

  function catchKeys(event: KeyboardEvent<HTMLDivElement>) {
    setCaughtKeys(new Set(caughtKeys).add(event.key));
  }

  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case " ":
      case "w": {
        if (caughtKeys.has("d") || caughtKeys.has("ArrowRight")) playerRef.current.jump("right");
        else if (caughtKeys.has("a") || caughtKeys.has("ArrowLeft")) playerRef.current.jump("left");
        else playerRef.current.jump();
        break;
      }
    }
    let keysCopy = new Set(caughtKeys);
    keysCopy.delete(event.key);
    setCaughtKeys(keysCopy);
  }

  return (
    <Container
      onKeyDown={catchKeys}
      onKeyUp={handleKeys}
      maxWidth="md"
      tabIndex={0}
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography variant="body1">FPS = {fps.toFixed(0)}</Typography>
      <Typography variant="body1">
        x = {position.x.toFixed(2)}, y = {position.y.toFixed(2)}
      </Typography>
      <Typography variant="body1">
        vx = {velocity.x.toFixed(2)}, vy = {velocity.y.toFixed(2)}
      </Typography>
      <Typography variant="body1">
        ax = {acceleration.x.toFixed(2)}, ay = {acceleration.y.toFixed(2)}
      </Typography>
      <Box
        component="canvas"
        width={canvasWidth}
        height={canvasHeight}
        sx={{
          border: "2px solid black",
          backgroundColor: "info.light",
        }}
        ref={canvasRef}
      />
    </Container>
  );
}

export default App;
