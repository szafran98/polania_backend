const playerCanvasMargin: number = 256

function playerCamera (
  direction: number,
  playerX: number,
  playerY: number,
  playerSocket: any,
  mapData: any
) {
  const mapWidth = mapData.world.width
  const mapHeight = mapData.world.height

  if (
    direction === 2 &&
        playerX + 32 + playerCanvasMargin < mapWidth &&
        playerX >= playerCanvasMargin
  ) {
    playerSocket.emit('cameraRight')
  } else if (
    direction === 1 &&
        playerX - playerCanvasMargin > 0 &&
        playerX + playerCanvasMargin + 32 <= mapWidth
  ) {
    playerSocket.emit('cameraLeft')
  } else if (
    direction === 3 &&
        playerY - playerCanvasMargin > 0 &&
        playerY <= mapHeight - 32 - playerCanvasMargin
  ) {
    playerSocket.emit('cameraUp')
  } else if (
    direction === 0 &&
        playerY + playerCanvasMargin < mapHeight - 32 &&
        playerY >= playerCanvasMargin
  ) {
    playerSocket.emit('cameraDown')
  }
}

export { playerCamera }
